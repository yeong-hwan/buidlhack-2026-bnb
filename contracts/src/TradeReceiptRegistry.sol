// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TradeReceiptRegistry
/// @notice Immutable onchain record of every trade executed by an authorized
///         PerUserExecutor. The registry does NOT verify that the strategy
///         logic matches its public block graph; it only guarantees the trade
///         itself (tokens, amounts, timestamp) cannot be edited or hidden
///         after the fact.
contract TradeReceiptRegistry {
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

    constructor(address admin_) {
        admin = admin_;
    }

    function setAuthorizedExecutor(address executor, bool authorized) external onlyAdmin {
        authorizedExecutor[executor] = authorized;
        emit ExecutorAuthorized(executor, authorized);
    }

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
        receiptHash = keccak256(
            abi.encode(strategyId, user, tokenIn, tokenOut, amountIn, amountOut, ts)
        );
        emit TradeRecorded(strategyId, user, msg.sender, receiptHash, index);
    }

    function receiptsOf(bytes32 strategyId) external view returns (Receipt[] memory) {
        return _receipts[strategyId];
    }

    function receiptCount(bytes32 strategyId) external view returns (uint256) {
        return _receipts[strategyId].length;
    }
}
