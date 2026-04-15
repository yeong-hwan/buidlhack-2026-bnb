// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TradeReceiptRegistry} from "../src/TradeReceiptRegistry.sol";
import {PerUserExecutor, ITradeReceiptRegistry} from "../src/PerUserExecutor.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";
import {IPancakeV3Router} from "../src/interfaces/IPancakeV3Router.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev 1:2 swap rate mock — tokenIn returns tokenOut * 2.
contract MockRouter is IPancakeV3Router {
    function exactInputSingle(ExactInputSingleParams calldata p)
        external
        payable
        override
        returns (uint256 amountOut)
    {
        IERC20(p.tokenIn).transferFrom(msg.sender, address(this), p.amountIn);
        amountOut = p.amountIn * 2;
        require(amountOut >= p.amountOutMinimum, "slippage");
        MockToken(p.tokenOut).mint(p.recipient, amountOut);
    }
}

contract PerUserExecutorTest is Test {
    TradeReceiptRegistry internal registry;
    PerUserExecutor internal executor;
    MockRouter internal router;
    MockToken internal tokenIn;
    MockToken internal tokenOut;
    MockToken internal disallowedToken;

    address internal owner = address(0xFACE);
    address internal operator = address(0x0B0B);
    address internal stranger = address(0xBAD);
    bytes32 internal strategyId = keccak256("demo-strategy");

    function setUp() public {
        registry = new TradeReceiptRegistry(address(this));
        router = new MockRouter();
        tokenIn = new MockToken("In", "IN");
        tokenOut = new MockToken("Out", "OUT");
        disallowedToken = new MockToken("Bad", "BAD");

        executor = new PerUserExecutor(
            owner,
            operator,
            strategyId,
            ITradeReceiptRegistry(address(registry)),
            1_000 ether
        );

        registry.setAuthorizedExecutor(address(executor), true);

        vm.startPrank(owner);
        executor.setAllowedRouter(address(router), true);
        executor.setAllowedToken(address(tokenIn), true);
        executor.setAllowedToken(address(tokenOut), true);
        vm.stopPrank();

        tokenIn.mint(address(executor), 10_000 ether);
    }

    function _defaultRequest(uint256 amountIn)
        internal
        view
        returns (PerUserExecutor.SwapRequest memory)
    {
        return PerUserExecutor.SwapRequest({
            router: address(router),
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            fee: 500,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
            deadline: block.timestamp + 60
        });
    }

    function test_executeSwap_happyPath() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);

        vm.prank(operator);
        uint256 out = executor.executeSwap(req);

        assertEq(out, 20 ether);
        assertEq(tokenOut.balanceOf(address(executor)), 20 ether);
        assertEq(registry.receiptCount(strategyId), 1);
        assertEq(executor.spentThisEpoch(), 10 ether);
    }

    function test_executeSwap_onlyOperator() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        vm.prank(stranger);
        vm.expectRevert(PerUserExecutor.NotOperator.selector);
        executor.executeSwap(req);
    }

    function test_executeSwap_rejectsDisallowedToken() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        req.tokenIn = address(disallowedToken);

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.TokenNotAllowed.selector);
        executor.executeSwap(req);
    }

    function test_executeSwap_rejectsDisallowedRouter() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        req.router = address(0xDEAD);

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.RouterNotAllowed.selector);
        executor.executeSwap(req);
    }

    function test_executeSwap_epochCap() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(600 ether);

        vm.startPrank(operator);
        executor.executeSwap(req);

        PerUserExecutor.SwapRequest memory req2 = _defaultRequest(500 ether);
        vm.expectRevert(PerUserExecutor.EpochCapExceeded.selector);
        executor.executeSwap(req2);
        vm.stopPrank();
    }

    function test_executeSwap_epochRollsOver() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(900 ether);

        vm.prank(operator);
        executor.executeSwap(req);
        assertEq(executor.spentThisEpoch(), 900 ether);

        // advance one day
        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(operator);
        executor.executeSwap(_defaultRequest(900 ether));

        assertEq(executor.spentThisEpoch(), 900 ether);
    }

    function test_revokeOperator_blocksExecution() public {
        vm.prank(owner);
        executor.revokeOperator();

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.NotOperator.selector);
        executor.executeSwap(_defaultRequest(10 ether));
    }

    function test_withdraw_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(PerUserExecutor.NotOwner.selector);
        executor.withdraw(address(tokenIn), stranger, 1 ether);

        vm.prank(owner);
        executor.withdraw(address(tokenIn), owner, 1_000 ether);
        assertEq(tokenIn.balanceOf(owner), 1_000 ether);
    }

    function test_setAllowedTokensBatch() public {
        address[] memory toks = new address[](2);
        bool[] memory flags = new bool[](2);
        toks[0] = address(0x1111);
        toks[1] = address(0x2222);
        flags[0] = true;
        flags[1] = true;

        vm.prank(owner);
        executor.setAllowedTokensBatch(toks, flags);

        assertTrue(executor.allowedToken(toks[0]));
        assertTrue(executor.allowedToken(toks[1]));
    }
}
