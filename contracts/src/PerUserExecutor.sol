// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {IPancakeV3Router} from "./interfaces/IPancakeV3Router.sol";

interface ITradeReceiptRegistry {
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

    address public immutable owner;
    bytes32 public immutable strategyId;
    ITradeReceiptRegistry public immutable registry;

    address public operator;

    mapping(address => bool) public allowedToken;
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

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

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

    function setOperator(address operator_) external onlyOwner {
        operator = operator_;
        emit OperatorSet(operator_);
    }

    function revokeOperator() external onlyOwner {
        operator = address(0);
        emit OperatorSet(address(0));
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedToken[token] = allowed;
        emit AllowedTokenSet(token, allowed);
    }

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

    function setAllowedRouter(address router, bool allowed) external onlyOwner {
        allowedRouter[router] = allowed;
        emit AllowedRouterSet(router, allowed);
    }

    function setEpochSpendCap(uint256 cap) external onlyOwner {
        epochSpendCap = cap;
        emit EpochSpendCapSet(cap);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(token, to, amount);
    }

    // ---------- operator execution ----------

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

    function executeSwap(SwapRequest calldata req)
        external
        onlyOperator
        returns (uint256 amountOut)
    {
        if (!allowedRouter[req.router]) revert RouterNotAllowed();
        if (!allowedToken[req.tokenIn] || !allowedToken[req.tokenOut]) revert TokenNotAllowed();

        _rollEpoch();
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

        // reset allowance defensively
        IERC20(req.tokenIn).forceApprove(req.router, 0);

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

    function _rollEpoch() internal {
        uint256 epoch = block.timestamp / 1 days;
        if (epoch != currentEpoch) {
            currentEpoch = epoch;
            spentThisEpoch = 0;
        }
    }
}
