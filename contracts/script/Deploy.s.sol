// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {TradeReceiptRegistry} from "../src/TradeReceiptRegistry.sol";
import {PerUserExecutor, ITradeReceiptRegistry} from "../src/PerUserExecutor.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockWBNB} from "../src/mocks/MockWBNB.sol";
import {MockPancakeV3Router} from "../src/mocks/MockPancakeV3Router.sol";

/// @notice Full local deployment: registry + sample per-user executor.
///         By default this script deploys local mock ERC20s + mock router
///         so no external fork RPC is required.
///
/// Env vars:
///   DEPLOYER_PRIVATE_KEY    - deployer + treated as "admin" of registry
///   SAMPLE_USER             - owner of the sample executor (defaults to deployer)
///   SAMPLE_OPERATOR         - backend operator (defaults to deployer)
///   SAMPLE_STRATEGY_ID      - bytes32 strategyId (defaults to keccak256("demo"))
///   USE_LOCAL_MOCKS         - true/false (default true)
///   PANCAKE_ROUTER          - external router (required if !USE_LOCAL_MOCKS)
///   WBNB, USDT              - token addresses for allowlist (required if !USE_LOCAL_MOCKS)
///   DEMO_EPOCH_CAP          - initial epochSpendCap (defaults to 1000 ether)
///   DEMO_PAIR_RATE          - rate (tokenOut per tokenIn, 1e18 scale) for mock pairs
///                              (defaults to 1e18)
contract DeployScript is Script {
    function _anvilAccounts() internal pure returns (address[10] memory accounts) {
        accounts = [
            address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266),
            address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8),
            address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC),
            address(0x90F79bf6EB2c4f870365E785982E1f101E93b906),
            address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65),
            address(0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc),
            address(0x976EA74026E726554dB657fA54763abd0C3a0aa9),
            address(0x14dC79964da2C08b23698B3D3cc7Ca32193d9955),
            address(0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f),
            address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720)
        ];
    }

    function _seedAnvilAccounts(MockERC20 token, uint256 amountPerAccount) internal {
        address[10] memory accounts = _anvilAccounts();

        for (uint256 i = 0; i < accounts.length; i++) {
            token.mint(accounts[i], amountPerAccount);
        }
    }

    function _seedAnvilAccountsWithBackedWbnb(MockWBNB token, uint256 amountPerAccount) internal {
        address[10] memory accounts = _anvilAccounts();
        uint256 totalSeed = amountPerAccount * accounts.length;

        token.deposit{value: totalSeed}();
        for (uint256 i = 0; i < accounts.length; i++) {
            token.transfer(accounts[i], amountPerAccount);
        }
    }

    /// @notice registry + 샘플 PerUserExecutor를 한 번에 배포.
    ///         테스트/데모용 초기값을 환경변수로 받아 실행한다.
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address sampleUser = vm.envOr("SAMPLE_USER", deployer);
        address sampleOperator = vm.envOr("SAMPLE_OPERATOR", sampleUser);
        bytes32 strategyId = vm.envOr("SAMPLE_STRATEGY_ID", keccak256("demo"));
        bool useLocalMocks = vm.envOr("USE_LOCAL_MOCKS", true);
        uint256 epochCap = vm.envOr("DEMO_EPOCH_CAP", uint256(1_000 ether));
        uint256 pairRate = vm.envOr("DEMO_PAIR_RATE", uint256(1e18));

        address router;
        address wbnb;
        address usdt;

        vm.startBroadcast(pk);

        if (useLocalMocks) {
            MockWBNB mockWBNB = new MockWBNB(deployer);
            MockERC20 mockUSDT = new MockERC20("Tether USD", "USDT", 18, deployer, 0, true);
            MockPancakeV3Router mockRouter = new MockPancakeV3Router();

            // Seed the default Anvil wallets so any imported MetaMask demo account
            // can immediately try allowlisting, swaps, and withdrawals.
            _seedAnvilAccountsWithBackedWbnb(mockWBNB, 100 ether);
            _seedAnvilAccounts(mockUSDT, 10_000 ether);

            // Keep explicit balances for the selected demo roles as well.
            mockWBNB.deposit{value: 100 ether}();
            mockWBNB.transfer(sampleUser, 100 ether);
            mockUSDT.mint(sampleUser, 10_000 ether);
            mockWBNB.deposit{value: 10 ether}();
            mockUSDT.mint(deployer, 10 ether);

            // Prefund the mock router so the UI can show non-zero pool-like
            // balances and USDT -> WBNB swaps have actual WBNB liquidity.
            mockWBNB.deposit{value: 500 ether}();
            mockWBNB.transfer(address(mockRouter), 500 ether);
            mockUSDT.mint(address(mockRouter), 500_000 ether);

            mockRouter.setPair(address(mockWBNB), address(mockUSDT), pairRate);
            mockRouter.setPair(address(mockUSDT), address(mockWBNB), pairRate);

            router = address(mockRouter);
            wbnb = address(mockWBNB);
            usdt = address(mockUSDT);

            console2.log("MockPancakeV3Router:", router);
            console2.log("MockERC20_WBNB:", wbnb);
            console2.log("MockERC20_USDT:", usdt);
            console2.log("MockPairRate(1e18 base):", pairRate);
        } else {
            router = vm.envAddress("PANCAKE_ROUTER");
            wbnb = vm.envAddress("WBNB");
            usdt = vm.envAddress("USDT");
        }

        TradeReceiptRegistry registry = new TradeReceiptRegistry(deployer);
        console2.log("TradeReceiptRegistry:", address(registry));

        PerUserExecutor executor = new PerUserExecutor(
            sampleUser,
            sampleOperator,
            strategyId,
            ITradeReceiptRegistry(address(registry)),
            epochCap
        );
        console2.log("PerUserExecutor:", address(executor));

        // 배포된 실행기만 영수증을 기록할 수 있게 허용
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
