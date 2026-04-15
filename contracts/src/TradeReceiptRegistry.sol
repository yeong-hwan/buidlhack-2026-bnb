// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TradeReceiptRegistry
/// @notice Immutable onchain record of every trade executed by an authorized
///         PerUserExecutor. The registry does NOT verify that the strategy
///         logic matches its public block graph; it only guarantees the trade
///         itself (tokens, amounts, timestamp) cannot be edited or hidden
///         after the fact.
contract TradeReceiptRegistry {
    /// @notice 한 번의 스왑을 영구 로그로 남기기 위한 데이터 형식
    ///         (누가, 어떤 전략으로, 어떤 토큰을 얼마나 바꿨는지)
    struct Receipt {
        bytes32 strategyId;
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint64 timestamp;
    }

    address public immutable admin;

    mapping(bytes32 => Receipt[]) private _receipts;
    /// @notice 거래 기록을 남길 수 있는 실행기(PerUserExecutor)만 true
    mapping(address => bool) public authorizedExecutor;

    event ExecutorAuthorized(address indexed executor, bool authorized);
    event TradeRecorded(
        bytes32 indexed strategyId,
        address indexed user,
        address indexed executor,
        bytes32 receiptHash,
        uint256 index
    );

    error NotAdmin();
    error NotAuthorized();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @notice 초기 관리자(admin)만 나중에 실행기 권한을 관리할 수 있다.
    constructor(address admin_) {
        admin = admin_;
    }

    /// @notice 실행기 권한 등록/해제.
    ///         허가되지 않은 주소가 거래를 쓰면 영수증이 조작될 수 있어 반드시 통제 필요
    function setAuthorizedExecutor(address executor, bool authorized) external onlyAdmin {
        authorizedExecutor[executor] = authorized;
        emit ExecutorAuthorized(executor, authorized);
    }

    /// @notice 스왑이 성공했을 때 딱 한 번 호출되는 기록 함수
    /// @return receiptHash 기록을 식별하는 해시값
    /// @return index  해당 strategyId의 영수증 배열 인덱스
    function recordTrade(
        bytes32 strategyId,
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external returns (bytes32 receiptHash, uint256 index) {
        if (!authorizedExecutor[msg.sender]) revert NotAuthorized();
        uint64 ts = uint64(block.timestamp);
        _receipts[strategyId].push(
            Receipt({
                strategyId: strategyId,
                user: user,
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: amountIn,
                amountOut: amountOut,
                timestamp: ts
            })
        );
        index = _receipts[strategyId].length - 1;
        // 같은 내용의 거래라도 시간값이 다르면 다른 해시가 되므로 같은 tx를 구분하기 쉽다.
        receiptHash = keccak256(
            abi.encode(strategyId, user, tokenIn, tokenOut, amountIn, amountOut, ts)
        );
        emit TradeRecorded(strategyId, user, msg.sender, receiptHash, index);
    }

    /// @notice 특정 전략의 모든 영수증을 조회 (UI/감사 로그에서 사용)
    function receiptsOf(bytes32 strategyId) external view returns (Receipt[] memory) {
        return _receipts[strategyId];
    }

    /// @notice 특정 전략의 총 거래 개수 조회 (카운트/페이지네이션 용)
    function receiptCount(bytes32 strategyId) external view returns (uint256) {
        return _receipts[strategyId].length;
    }
}
