// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subset of PancakeSwap V3 SwapRouter interface (matches Uniswap V3 ISwapRouter).
interface IPancakeV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}
