// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPancakeV3Router} from "../interfaces/IPancakeV3Router.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IMockMintable {
    function mint(address to, uint256 amount) external;
}

/// @notice Simple mock router for local demos.
///         Keeps deterministic pair rates for tokenIn -> tokenOut swaps.
contract MockPancakeV3Router is IPancakeV3Router {
    mapping(bytes32 => uint256) public pairRateByKey;

    address public immutable owner;

    uint256 public constant SCALE = 1e18;

    error PairNotFound();
    error AmountOutTooLow();
    error InvalidDeadline();
    error TokenInOutSame();
    error ZeroValue();

    event PairConfigured(address indexed tokenIn, address indexed tokenOut, uint256 amountOutPerAmountIn);
    event PairRemoved(address indexed tokenIn, address indexed tokenOut);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert("MockRouter: only owner");
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function pairRate(address tokenIn, address tokenOut) external view returns (uint256) {
        return pairRateByKey[_pairKey(tokenIn, tokenOut)];
    }

    function setPair(address tokenIn, address tokenOut, uint256 amountOutPerAmountIn) external onlyOwner {
        if (tokenIn == tokenOut) revert TokenInOutSame();
        if (amountOutPerAmountIn == 0) revert ZeroValue();

        bytes32 key = _pairKey(tokenIn, tokenOut);
        pairRateByKey[key] = amountOutPerAmountIn;
        emit PairConfigured(tokenIn, tokenOut, amountOutPerAmountIn);
    }

    function removePair(address tokenIn, address tokenOut) external onlyOwner {
        bytes32 key = _pairKey(tokenIn, tokenOut);
        delete pairRateByKey[key];
        emit PairRemoved(tokenIn, tokenOut);
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut)
    {
        if (params.deadline != 0 && params.deadline < block.timestamp) {
            revert InvalidDeadline();
        }
        if (params.tokenIn == params.tokenOut) {
            revert TokenInOutSame();
        }

        uint256 rate = pairRateByKey[_pairKey(params.tokenIn, params.tokenOut)];
        if (rate == 0) {
            revert PairNotFound();
        }

        if (!IERC20Like(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn)) {
            revert("MockRouter: tokenIn transferFrom failed");
        }

        amountOut = (params.amountIn * rate) / SCALE;
        if (amountOut < params.amountOutMinimum) {
            revert AmountOutTooLow();
        }

        bool minted;
        try IMockMintable(params.tokenOut).mint(params.recipient, amountOut) {
            minted = true;
        } catch {
            minted = false;
        }

        if (!minted) {
            if (!IERC20Like(params.tokenOut).transfer(params.recipient, amountOut)) {
                revert("MockRouter: tokenOut payout failed");
            }
        }
    }

    function _pairKey(address tokenIn, address tokenOut) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenIn, tokenOut));
    }
}
