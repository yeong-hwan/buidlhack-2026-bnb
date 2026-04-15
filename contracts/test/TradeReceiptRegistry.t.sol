// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TradeReceiptRegistry} from "../src/TradeReceiptRegistry.sol";

contract TradeReceiptRegistryTest is Test {
    TradeReceiptRegistry internal registry;
    address internal admin = address(0xA11CE);
    address internal executor = address(0xE1);
    address internal rogue = address(0xBAD);
    address internal user = address(0xFACE);

    bytes32 internal strategyId = keccak256("strat-1");

    function setUp() public {
        vm.prank(admin);
        registry = new TradeReceiptRegistry(admin);
    }

    function test_setAuthorizedExecutor_adminOnly() public {
        vm.prank(rogue);
        vm.expectRevert(TradeReceiptRegistry.NotAdmin.selector);
        registry.setAuthorizedExecutor(executor, true);

        vm.prank(admin);
        registry.setAuthorizedExecutor(executor, true);
        assertTrue(registry.authorizedExecutor(executor));
    }

    function test_recordTrade_authorizedOnly() public {
        vm.prank(rogue);
        vm.expectRevert(TradeReceiptRegistry.NotAuthorized.selector);
        registry.recordTrade(strategyId, user, address(1), address(2), 100, 200);
    }

    function test_recordTrade_storesAndEmits() public {
        vm.prank(admin);
        registry.setAuthorizedExecutor(executor, true);

        vm.warp(1_700_000_000);

        vm.prank(executor);
        (bytes32 hash1, uint256 idx1) =
            registry.recordTrade(strategyId, user, address(0xAA), address(0xBB), 1e18, 2e18);

        assertEq(idx1, 0);
        assertEq(registry.receiptCount(strategyId), 1);

        bytes32 expected = keccak256(
            abi.encode(strategyId, user, address(0xAA), address(0xBB), uint256(1e18), uint256(2e18), uint64(1_700_000_000))
        );
        assertEq(hash1, expected);

        TradeReceiptRegistry.Receipt[] memory all = registry.receiptsOf(strategyId);
        assertEq(all.length, 1);
        assertEq(all[0].user, user);
        assertEq(all[0].amountIn, 1e18);
    }

    function test_recordTrade_multiple() public {
        vm.prank(admin);
        registry.setAuthorizedExecutor(executor, true);

        vm.startPrank(executor);
        registry.recordTrade(strategyId, user, address(1), address(2), 1, 2);
        registry.recordTrade(strategyId, user, address(1), address(2), 3, 4);
        registry.recordTrade(strategyId, user, address(1), address(2), 5, 6);
        vm.stopPrank();

        assertEq(registry.receiptCount(strategyId), 3);
    }
}
