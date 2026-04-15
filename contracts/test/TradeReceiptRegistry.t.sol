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

    /// @notice 모든 테스트를 시작할 때 실행되는 초기 설정.
    ///         admin 계정으로 레지스트리를 배포해서 admin 권한이 실제로 동작하는지부터 시작한다.
    function setUp() public {
        vm.prank(admin);
        registry = new TradeReceiptRegistry(admin);
    }

    /// @notice `setAuthorizedExecutor`는 관리자만 호출할 수 있어야 함을 확인한다.
    ///         다른 사람이 바꾸면 실패해야 하고, admin이 바꾸면 반영돼야 한다.
    function test_setAuthorizedExecutor_adminOnly() public {
        vm.prank(rogue);
        vm.expectRevert(TradeReceiptRegistry.NotAdmin.selector);
        registry.setAuthorizedExecutor(executor, true);

        vm.prank(admin);
        registry.setAuthorizedExecutor(executor, true);
        assertTrue(registry.authorizedExecutor(executor));
    }

    /// @notice 거래 기록 함수는 승인된 실행기만 호출할 수 있어야 함을 확인한다.
    ///         권한 없는 주소(rogue)는 바로 revert가 나와야 함.
    function test_recordTrade_authorizedOnly() public {
        vm.prank(rogue);
        vm.expectRevert(TradeReceiptRegistry.NotAuthorized.selector);
        registry.recordTrade(strategyId, user, address(1), address(2), 100, 200);
    }

    /// @notice 승인된 실행기가 기록을 남기면,
    ///         1) 리턴되는 index,
    ///         2) 저장된 개수,
    ///         3) 해시값,
    ///         4) 실제 저장된 필드 값이
    ///         올바른지 확인한다.
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

    /// @notice 같은 strategyId로 여러 건을 연속 기록할 때
    ///         배열 카운트가 3으로 늘어나는지 확인한다.
    ///         즉, 거래 로그가 누적 저장되는지 검증.
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
