// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {TradeReceiptRegistry} from "../src/TradeReceiptRegistry.sol";
import {PerUserExecutor, ITradeReceiptRegistry} from "../src/PerUserExecutor.sol";

/// @notice Full local deployment: registry + a sample per-user executor.
///         Intended to be run against Anvil forked BSC Testnet.
///
/// Env vars:
///   DEPLOYER_PRIVATE_KEY  - deployer + treated as "admin" of registry
///   SAMPLE_USER           - owner of the sample executor (defaults to deployer)
///   SAMPLE_OPERATOR       - backend operator (defaults to deployer)
///   SAMPLE_STRATEGY_ID    - bytes32 strategyId (defaults to keccak256("demo"))
///   PANCAKE_ROUTER        - PancakeSwap V3 router to allowlist
///   WBNB, USDT            - tokens to allowlist for the sample executor
contract DeployScript is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address sampleUser = vm.envOr("SAMPLE_USER", deployer);
        address sampleOperator = vm.envOr("SAMPLE_OPERATOR", deployer);
        bytes32 strategyId = vm.envOr("SAMPLE_STRATEGY_ID", keccak256("demo"));

        address router = vm.envAddress("PANCAKE_ROUTER");
        address wbnb = vm.envAddress("WBNB");
        address usdt = vm.envAddress("USDT");

        vm.startBroadcast(pk);

        TradeReceiptRegistry registry = new TradeReceiptRegistry(deployer);
        console2.log("TradeReceiptRegistry:", address(registry));

        PerUserExecutor executor = new PerUserExecutor(
            sampleUser,
            sampleOperator,
            strategyId,
            ITradeReceiptRegistry(address(registry)),
            1_000 ether
        );
        console2.log("PerUserExecutor:", address(executor));

        registry.setAuthorizedExecutor(address(executor), true);

        // allowlist the sample router + token pair from the owner's perspective.
        // This only works if the deployer == sampleUser; for a real flow the
        // user would sign these txs from their own wallet.
        if (sampleUser == deployer) {
            executor.setAllowedRouter(router, true);
            executor.setAllowedToken(wbnb, true);
            executor.setAllowedToken(usdt, true);
        }

        vm.stopBroadcast();
    }
}
