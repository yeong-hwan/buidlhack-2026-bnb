// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subset of PancakeSwap V3 SwapRouter interface (matches Uniswap V3 ISwapRouter).
interface IPancakeV3Router {
    /// @notice Pancake(=Uniswap V3 스타일) single-hop swap 입력 파라미터
    ///         exactInputSingle은 "정확한 입력량"으로 스왑할 때 쓰는 함수다.
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

    /// @notice 스왑 실행(토큰 정확량 입력)
    ///         실제 토큰 변화는 라우터에서 처리되고 amountOut(받는 양)만 반환한다.
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}
