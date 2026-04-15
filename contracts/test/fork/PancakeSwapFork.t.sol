// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TradeReceiptRegistry} from "../../src/TradeReceiptRegistry.sol";
import {PerUserExecutor, ITradeReceiptRegistry} from "../../src/PerUserExecutor.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";

/// @notice Fork test against BSC mainnet PancakeSwap V3. Runs only when the
///         BSC_MAINNET_RPC environment variable is set, so `forge test`
///         without a fork URL still passes locally.
///
/// To run: `BSC_MAINNET_RPC=https://bsc-dataseed.binance.org forge test --mc PancakeSwapForkTest -vv`
contract PancakeSwapForkTest is Test {
    // BSC mainnet PancakeSwap V3 SwapRouter (deadline-variant, matches IPancakeV3Router)
    address constant SWAP_ROUTER = 0x1b81D678ffb9C0263b24A97847620C99d213eB14;
    address constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address constant USDT = 0x55d398326f99059fF775485246999027B3197955;

    TradeReceiptRegistry internal registry;
    PerUserExecutor internal executor;

    address internal owner = address(0xFACE);
    address internal operator = address(0x0B0B);
    bytes32 internal strategyId = keccak256("fork-demo");

    bool internal skipFork;

    /// @notice fork 환경 준비 단계.
    ///         BSC_MAINNET_RPC가 있으면 fork를 만들고, 없으면 안전하게 스킵 플래그로만 넘긴다.
    ///         실제 라우터/토큰 주소도 여기서 고정한다.
    function setUp() public {
        string memory rpc;
        try vm.envString("BSC_MAINNET_RPC") returns (string memory s) {
            rpc = s;
        } catch {
            skipFork = true;
            return;
        }
        if (bytes(rpc).length == 0) {
            skipFork = true;
            return;
        }

        vm.createSelectFork(rpc);

        registry = new TradeReceiptRegistry(address(this));
        executor = new PerUserExecutor(
            owner,
            operator,
            strategyId,
            ITradeReceiptRegistry(address(registry)),
            10_000 ether
        );
        registry.setAuthorizedExecutor(address(executor), true);

        vm.startPrank(owner);
        executor.setAllowedRouter(SWAP_ROUTER, true);
        executor.setAllowedToken(WBNB, true);
        executor.setAllowedToken(USDT, true);
        vm.stopPrank();

        // seed the executor with 100 USDT via cheat (balance slot differs per
        // token so use deal in stdStorage mode)
        deal(USDT, address(executor), 100 ether);
    }

    /// @notice 실제 BSC 메인넷 PancakeSwap V3 라우터와 연결해
    ///         USDT -> WBNB 스왑이 실제로 동작하는지 확인한다.
    ///         fork가 없으면 테스트를 건너뛰어 로컬에서도 실패하지 않게 한다.
    function test_fork_swap_usdtToWbnb() public {
        if (skipFork) {
            emit log("BSC_MAINNET_RPC not set; skipping fork test.");
            return;
        }

        uint256 wbnbBefore = IERC20(WBNB).balanceOf(address(executor));
        uint256 usdtBefore = IERC20(USDT).balanceOf(address(executor));
        assertEq(usdtBefore, 100 ether);

        PerUserExecutor.SwapRequest memory req = PerUserExecutor.SwapRequest({
            router: SWAP_ROUTER,
            tokenIn: USDT,
            tokenOut: WBNB,
            fee: 500,
            amountIn: 100 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
            deadline: block.timestamp + 300
        });

        vm.prank(operator);
        uint256 out = executor.executeSwap(req);

        assertGt(out, 0, "no tokens out");
        assertGt(IERC20(WBNB).balanceOf(address(executor)), wbnbBefore);
        assertEq(IERC20(USDT).balanceOf(address(executor)), 0);
        assertEq(registry.receiptCount(strategyId), 1);
        assertEq(executor.spentThisEpoch(), 100 ether);
    }
}
