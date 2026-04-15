// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {IPancakeV3Router} from "./interfaces/IPancakeV3Router.sol";

interface ITradeReceiptRegistry {
    /// @notice 스왑이 끝난 뒤 레지스트리에 기록 요청할 때 쓰는 인터페이스
    function recordTrade(
        bytes32 strategyId,
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external returns (bytes32 receiptHash, uint256 index);
}

/// @title PerUserExecutor
/// @notice Non-custodial execution contract owned by a single user. The
///         backend (operator) can trigger swaps, but only against a hardcoded
///         allowlist of DEX routers and token pairs, bounded by a per-epoch
///         notional limit. Funds live inside this contract and can only move
///         out via the user's own withdraw calls or swaps through approved
///         routers. The operator cannot transfer funds to an arbitrary
///         address, and the user can revoke operator authority at any time.
contract PerUserExecutor {
    using SafeERC20 for IERC20;

    /// @notice 자산 소유자(사용자)
    address public immutable owner;
    /// @notice 이 실행기가 속한 전략 ID(같은 사용자의 여러 전략 분리용)
    bytes32 public immutable strategyId;
    /// @notice 스왑 결과를 남기는 영수증 저장소
    ITradeReceiptRegistry public immutable registry;

    /// @notice operator: backend에서 swap 실행을 트리거할 주소(핵심 권한)
    address public operator;

    /// @notice 이 맵에 true인 토큰만 스왑 입출력 가능
    mapping(address => bool) public allowedToken;
    /// @notice 이 맵에 true인 라우터만 swap 호출 가능
    mapping(address => bool) public allowedRouter;

    /// @dev Per-epoch spend cap (epoch = 1 day). Denominated in tokenIn units.
    ///      Using a raw-unit cap avoids needing an onchain oracle for USD; for
    ///      the MVP we pair this with an offchain check that only sends
    ///      swaps sized against a sensible USD equivalent.
    uint256 public epochSpendCap;
    uint256 public currentEpoch;
    uint256 public spentThisEpoch;

    event OperatorSet(address indexed operator);
    event AllowedTokenSet(address indexed token, bool allowed);
    event AllowedRouterSet(address indexed router, bool allowed);
    event EpochSpendCapSet(uint256 cap);
    event SwapExecuted(
        address indexed router,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        bytes32 receiptHash
    );
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    error NotOwner();
    error NotOperator();
    error TokenNotAllowed();
    error RouterNotAllowed();
    error EpochCapExceeded();
    error ZeroAddress();

    /// @notice 오너만 실행 가능한 함수용 보호 장치
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice 오퍼레이터만 실행 가능한 함수용 보호 장치
    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    /// @notice 실행기 기본 설정.
    ///         owner/operator/strategy/registry/일일 한도만 한 번 고정하고 바꾸기 어렵게 immutable로 보관한다.
    constructor(
        address owner_,
        address operator_,
        bytes32 strategyId_,
        ITradeReceiptRegistry registry_,
        uint256 epochSpendCap_
    ) {
        if (owner_ == address(0) || address(registry_) == address(0)) revert ZeroAddress();
        owner = owner_;
        operator = operator_;
        strategyId = strategyId_;
        registry = registry_;
        epochSpendCap = epochSpendCap_;
        currentEpoch = block.timestamp / 1 days;
        emit OperatorSet(operator_);
        emit EpochSpendCapSet(epochSpendCap_);
    }

    // ---------- owner admin ----------

    /// @notice operator를 교체한다. 운영자가 바뀌어도 owner가 통제권을 유지한다.
    function setOperator(address operator_) external onlyOwner {
        operator = operator_;
        emit OperatorSet(operator_);
    }

    /// @notice operator 권한 즉시 회수. 강한 제어권.
    function revokeOperator() external onlyOwner {
        operator = address(0);
        emit OperatorSet(address(0));
    }

    /// @notice 한 개 토큰 허용/차단 설정
    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedToken[token] = allowed;
        emit AllowedTokenSet(token, allowed);
    }

    /// @notice 여러 토큰을 한 번에 허용/차단
    ///         프론트에서 토큰 리스트를 받아 한 번에 세팅할 때 유용
    function setAllowedTokensBatch(address[] calldata tokens, bool[] calldata allowed)
        external
        onlyOwner
    {
        require(tokens.length == allowed.length, "length mismatch");
        for (uint256 i; i < tokens.length; ++i) {
            allowedToken[tokens[i]] = allowed[i];
            emit AllowedTokenSet(tokens[i], allowed[i]);
        }
    }

    /// @notice 허용 라우터를 한 개만 바꾸는 함수
    function setAllowedRouter(address router, bool allowed) external onlyOwner {
        allowedRouter[router] = allowed;
        emit AllowedRouterSet(router, allowed);
    }

    /// @notice 일일 한도를 owner가 변경할 수 있음
    function setEpochSpendCap(uint256 cap) external onlyOwner {
        epochSpendCap = cap;
        emit EpochSpendCapSet(cap);
    }

    /// @notice owner만 본인 자산을 외부로 출금할 수 있다.
    ///         operator는 임의 주소로 보낼 수 없음.
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(token, to, amount);
    }

    // ---------- operator execution ----------

    /// @notice operator가 보낼 스왑 요청 포맷
    struct SwapRequest {
        address router;
        address tokenIn;
        address tokenOut;
        uint24 fee;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
        uint256 deadline;
    }

    /// @notice operator 전용으로 실행되는 스왑 함수.
    ///         allowlist + 일일 한도 검사 + 영수증 기록을 한 번에 처리한다.
    function executeSwap(SwapRequest calldata req)
        external
        onlyOperator
        returns (uint256 amountOut)
    {
        // 허용되지 않은 라우터면 실행 불가
        if (!allowedRouter[req.router]) revert RouterNotAllowed();
        // 입금/출금 토큰이 허용되지 않았으면 실행 불가
        if (!allowedToken[req.tokenIn] || !allowedToken[req.tokenOut]) revert TokenNotAllowed();

        // 날짜(1일) 경계가 넘어가면 지출 이력을 초기화
        _rollEpoch();
        // 같은 날에 허용 총액 넘으면 실행 실패
        if (spentThisEpoch + req.amountIn > epochSpendCap) revert EpochCapExceeded();
        spentThisEpoch += req.amountIn;

        // approve the router for this exact amount only
        IERC20(req.tokenIn).forceApprove(req.router, req.amountIn);

        amountOut = IPancakeV3Router(req.router).exactInputSingle(
            IPancakeV3Router.ExactInputSingleParams({
                tokenIn: req.tokenIn,
                tokenOut: req.tokenOut,
                fee: req.fee,
                recipient: address(this),
                deadline: req.deadline,
                amountIn: req.amountIn,
                amountOutMinimum: req.amountOutMinimum,
                sqrtPriceLimitX96: req.sqrtPriceLimitX96
            })
        );

        // 스왑 후 권한은 즉시 회수: 라우터가 남아 있던 approve를 악용하지 못하게 함
        IERC20(req.tokenIn).forceApprove(req.router, 0);

        // 영수증 저장소에 "실제로 실행된 스왑"을 기록
        (bytes32 receiptHash,) = registry.recordTrade(
            strategyId,
            owner,
            req.tokenIn,
            req.tokenOut,
            req.amountIn,
            amountOut
        );

        emit SwapExecuted(req.router, req.tokenIn, req.tokenOut, req.amountIn, amountOut, receiptHash);
    }

    /// @notice 매일 00:00 기준으로 에포크를 바꾸고 spentThisEpoch를 초기화
    function _rollEpoch() internal {
        uint256 epoch = block.timestamp / 1 days;
        if (epoch != currentEpoch) {
            currentEpoch = epoch;
            spentThisEpoch = 0;
        }
    }
}
