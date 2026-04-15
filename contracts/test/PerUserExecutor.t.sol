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

    /// @notice 테스트 공통 초기화.
    ///         레지스트리, 목 라우터, 토큰을 만들고
    ///         오너(owner)가 허용 목록을 구성한 뒤,
    ///         스왑에 쓸 tokenIn을 executor에 미리 넣어둔다.
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

    /// @notice 자주 쓰는 스왑 요청을 기본값으로 만들기 위한 헬퍼 함수.
    ///         테스트마다 매번 같은 요청을 반복해서 작성할 수 있게 한다.
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

    /// @notice 정상 케이스: operator가 허용된 경로/토큰으로 스왑을 실행하면
    ///         1) 반환 금액이 맞고,
    ///         2) tokenOut가 executor로 들어오고,
    ///         3) 영수증이 하나 남고,
    ///         4) 일일 사용량이 기록되는지 본다.
    function test_executeSwap_happyPath() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);

        vm.prank(operator);
        uint256 out = executor.executeSwap(req);

        assertEq(out, 20 ether);
        assertEq(tokenOut.balanceOf(address(executor)), 20 ether);
        assertEq(registry.receiptCount(strategyId), 1);
        assertEq(executor.spentThisEpoch(), 10 ether);
    }

    /// @notice 오직 operator만 swap을 실행할 수 있는지 검증.
    ///         stranger가 실행하면 NotOperator 에러가 나야 한다.
    function test_executeSwap_onlyOperator() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        vm.prank(stranger);
        vm.expectRevert(PerUserExecutor.NotOperator.selector);
        executor.executeSwap(req);
    }

    /// @notice 허용되지 않은 tokenIn/tokenOut이면 실행이 막히는지 확인한다.
    ///         여기선 tokenIn만 바꿔 불허용 토큰 테스트를 수행한다.
    function test_executeSwap_rejectsDisallowedToken() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        req.tokenIn = address(disallowedToken);

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.TokenNotAllowed.selector);
        executor.executeSwap(req);
    }

    /// @notice 허용되지 않은 라우터면 실행이 막히는지 확인한다.
    ///         악성/실수 라우터로의 교환을 차단하는 방어선 테스트.
    function test_executeSwap_rejectsDisallowedRouter() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(10 ether);
        req.router = address(0xDEAD);

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.RouterNotAllowed.selector);
        executor.executeSwap(req);
    }

    /// @notice 하루(에포크) 단위 사용 한도 초과를 방어하는지 확인한다.
    ///         600 + 500 > 1000 이면 두 번째 호출은 실패해야 한다.
    function test_executeSwap_epochCap() public {
        PerUserExecutor.SwapRequest memory req = _defaultRequest(600 ether);

        vm.startPrank(operator);
        executor.executeSwap(req);

        PerUserExecutor.SwapRequest memory req2 = _defaultRequest(500 ether);
        vm.expectRevert(PerUserExecutor.EpochCapExceeded.selector);
        executor.executeSwap(req2);
        vm.stopPrank();
    }

    /// @notice 시간이 1일 지나면 spentThisEpoch가 초기화되는지 확인한다.
    ///         즉 다음 날짜엔 다시 같은 금액을 쓰더라도 허용되는지 검증.
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

    /// @notice 오너가 operator 권한을 회수하면 더 이상 실행이 안 되는지 확인한다.
    ///         revokeOperator 이후에는 이전 operator 호출이 즉시 실패해야 한다.
    function test_revokeOperator_blocksExecution() public {
        vm.prank(owner);
        executor.revokeOperator();

        vm.prank(operator);
        vm.expectRevert(PerUserExecutor.NotOperator.selector);
        executor.executeSwap(_defaultRequest(10 ether));
    }

    /// @notice 인출은 owner 전용인지 확인한다.
    ///         stranger는 실패하고, owner는 실제로 tokenIn을 가져오는지 본다.
    function test_withdraw_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(PerUserExecutor.NotOwner.selector);
        executor.withdraw(address(tokenIn), stranger, 1 ether);

        vm.prank(owner);
        executor.withdraw(address(tokenIn), owner, 1_000 ether);
        assertEq(tokenIn.balanceOf(owner), 1_000 ether);
    }

    /// @notice 여러 토큰을 한 번에 allow/deny 할 수 있는 배치 함수 동작 확인.
    ///         입력된 두 개 주소가 true로 모두 등록되는지 본다.
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
