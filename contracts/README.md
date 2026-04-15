# contracts/

플랫폼의 온체인 코어를 담당하는 Foundry 프로젝트. 두 개의 Solidity 컨트랙트가 전부고, 각각 **작지만 명확한 한 가지 일**만 한다.

---

## 한눈에 보기

| 컨트랙트 | 역할 | 비유 |
|---|---|---|
| **`PerUserExecutor.sol`** | 사용자 한 명이 소유하는 **자동매매 전용 금고**. 백엔드가 대신 거래해주지만, 우리가 정한 규칙 밖으로는 한 발짝도 못 나감 | "정해진 가게에서, 정해진 상품만, 하루 최대 얼마까지 대신 사달라"고 맡긴 심부름꾼 |
| **`TradeReceiptRegistry.sol`** | **모든 거래 영수증이 쌓이는 온체인 장부**. 한 번 기록되면 수정도, 삭제도 불가능 | 공인된 거래 일지. 누구나 열람 가능 |

이 둘이 맞물려서 피치덱의 두 가지 약속을 실현한다:

1. **"키는 당신이 가진다"** — 우리가 사용자 프라이빗 키를 절대 보관하지 않아도 자동매매가 돌아감
2. **"실적은 조작할 수 없다"** — 트레이더가 나중에 손실 거래를 숨기거나 수익률을 부풀릴 수 없음

---

## 왜 두 개의 컨트랙트인가

### 전통적인 카피트레이딩의 문제

일반 카피트레이딩 플랫폼은 두 가지 방식 중 하나를 택한다:

- **중앙화 커스터디**: 사용자 자금을 플랫폼 지갑에 맡김 → 해킹당하면 전부 날아감
- **수동 실행**: 시그널이 뜨면 사용자한테 알림 → 사용자가 직접 브라우저 켜고 MetaMask 서명 → 너무 느려서 알파 소멸

그리고 실적 조작도 흔하다. "수익률 200% 달성" 스크린샷 뒤에서 100개 손실 거래를 숨겨도 알 방법이 없다.

### 우리가 푸는 방식

**`PerUserExecutor`** 로 "키 없는 자동화" 를 만들고, **`TradeReceiptRegistry`** 로 "조작 불가능한 실적" 을 만든다. 두 문제를 완전히 독립적인 두 컨트랙트로 분리해서, 각각의 보안 논리가 단순해진다.

---

## `PerUserExecutor.sol` — 내 전용 실행 금고

사용자 한 명당 **하나의 Executor 컨트랙트** 가 배포된다. 자금은 이 컨트랙트 안에 보관되고, 백엔드(operator)가 대신 거래를 실행한다. 단, **컨트랙트 코드에 박힌 하드한 제약** 을 지키면서만.

### 핵심 역할자 세 명

```
┌────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     Owner      │owns   │  PerUserExecutor │trigger│    Operator     │
│  (유저 본인)   │──────▶│   (내 금고)      │◀──────│ (우리 백엔드)   │
└────────────────┘       └──────────────────┘       └─────────────────┘
                                 │
                                 │ executeSwap()
                                 ▼
                         ┌──────────────────┐
                         │ PancakeSwap V3   │
                         └──────────────────┘
```

- **Owner (사용자 본인)**: 컨트랙트를 배포하고 토큰을 입금한 사람. 아래 것만 할 수 있는 유일한 주체:
  - 허용된 토큰/DEX 목록 수정 (`setAllowedToken`, `setAllowedRouter`)
  - 일일 지출 한도 변경 (`setEpochSpendCap`)
  - Operator 교체 또는 박탈 (`setOperator`, `revokeOperator`)
  - 자금 인출 (`withdraw`)

- **Operator (우리 백엔드 지갑)**: 거래 시그널이 뜨면 `executeSwap()` 을 호출하는 유일한 주체. 그 외에는 **아무것도 못 한다**:
  - 자금을 외부 주소로 빼낼 수 없음 — 함수 자체가 없음
  - allowlist 밖의 토큰으로 스왑 불가 — 컨트랙트가 revert
  - allowlist 밖의 DEX 사용 불가 — 마찬가지로 revert
  - 일일 한도 초과 거래 불가 — `EpochCapExceeded` revert

- **PerUserExecutor (컨트랙트 자체)**: 사용자 자금을 보관하는 주소. 토큰 balance가 여기에 쌓임.

### 왜 이 구조가 안전한가

만약 우리 operator 키가 유출되는 최악의 시나리오를 가정해보자:

| 공격자가 시도 | 결과 |
|---|---|
| "내 지갑 주소로 토큰 빼내" | `executeSwap()`의 `recipient`는 `address(this)` (executor 자기 자신)로 하드코딩 — 외부 주소로 빠져나갈 경로 없음 |
| "allowlist에 없는 알트코인으로 스왑" | `TokenNotAllowed` revert |
| "다른 악성 DEX 컨트랙트로 라우팅해서 자금 탈취" | `RouterNotAllowed` revert |
| "한도를 넘어서 대규모 스왑" | `EpochCapExceeded` revert |
| "계속 시도해서 자산 마모" | 사용자가 `revokeOperator()` 호출 한 번으로 권한 박탈 |

**허용된 DEX에서 허용된 토큰 간 스왑만 할 수 있다.** 이게 최악 시나리오의 최대 피해다.

### 코드에서 보는 제약

`src/PerUserExecutor.sol` 의 `executeSwap` 안에:

```solidity
if (!allowedRouter[req.router]) revert RouterNotAllowed();
if (!allowedToken[req.tokenIn] || !allowedToken[req.tokenOut]) revert TokenNotAllowed();

_rollEpoch();
if (spentThisEpoch + req.amountIn > epochSpendCap) revert EpochCapExceeded();
spentThisEpoch += req.amountIn;
```

네 줄로 모든 보안이 설명된다. 추가로 스왑 직후 router allowance를 0으로 되돌려서 방어적 초기화를 한다.

---

## `TradeReceiptRegistry.sol` — 온체인 거래 장부

이 컨트랙트는 **딱 하나** 이고 모든 사용자의 모든 거래가 여기로 흘러들어온다.

### 무엇을 기록하는가

Executor가 스왑을 성공시킬 때마다 자기 자신을 호출해달라고 Registry에 요청하고, Registry는 이 정보를 저장한다:

```
strategyId  : 전략의 해시 ID (블록 에디터에서 생성된 AST의 keccak256)
user        : Executor의 owner 주소
tokenIn/Out : 거래한 토큰 쌍
amountIn    : 투입한 양
amountOut   : 받은 양
timestamp   : 블록 시각
```

그리고 이 일곱 개 필드를 `keccak256` 해시한 `receiptHash`를 이벤트로 발행한다.

### 무엇을 증명하는가 (그리고 무엇을 증명하지 않는가)

**증명하는 것**: "이 strategyId로 공개된 전략은 시점 T에 tokenA 100개를 팔아서 tokenB 200개를 받았다. 이 사실은 블록에 박혀있어서 나중에 수정 불가능."

**증명하지 않는 것**: "이 거래가 블록 에디터에 공개된 로직 그대로 실행됐다." 그건 오프체인 인터프리터를 신뢰해야 하는 영역이다. 우리가 이번 MVP에서 정직하게 클레임하는 건 **"실적은 사후 조작 불가능"** 하나다.

### 왜 이게 중요한가

마켓플레이스에서 "@CryptoWhale의 전략, 90일 수익률 50%" 라는 수치가 보일 때, 이건 누가 집계하든 같은 값이 나오는 **블록체인 위의 사실** 이다. 플랫폼이 DB를 조작해도 바뀌지 않고, 트레이더 본인이 손실 거래를 숨겨도 바뀌지 않는다.

### 권한 구조

아무나 `recordTrade()`를 못 부른다. `authorizedExecutor[msg.sender] == true` 인 Executor만 가능하다. Admin이 Executor를 배포할 때마다 `setAuthorizedExecutor()`로 등록해줘야 한다. 이렇게 해서 가짜 receipt가 들어올 수 없다.

---

## 둘이 어떻게 같이 작동하는가

구체적인 시나리오로 따라가보자.

### 등장 인물

- **Alice** — 사용자. @CryptoWhale의 BNB 스윙 전략을 팔로우하고 싶음
- **백엔드** — 우리 서버. Alice를 위한 operator 역할
- **@CryptoWhale의 전략** — strategyId = `0xabc...` (블록 에디터에서 만든 AST의 해시)

### 셋업 단계 (단 한 번)

```
1. Alice가 지갑 연결
2. 프론트엔드가 Alice를 위해 PerUserExecutor 배포
   - owner = Alice
   - operator = 백엔드 주소
   - strategyId = 0xabc...
   - registry = 글로벌 Registry 주소
3. Admin이 registry.setAuthorizedExecutor(Alice의 Executor, true) 호출
4. Alice가 allowlist 세팅 서명:
   - allowedRouter: PancakeSwap V3 Router
   - allowedToken: BNB, USDT, BUSD
   - epochSpendCap: 일일 500 USDT
5. Alice가 자신의 Executor에 USDT 입금
```

### 실행 단계 (시그널 뜰 때마다 반복)

```
6. Alice는 노트북 덮고 잠자러 감
7. @CryptoWhale 전략의 조건 충족 (예: BNB 6시간 차트 RSI 25 이하)
8. 백엔드 operator가 Alice의 Executor.executeSwap() 호출
   - tokenIn: USDT, tokenOut: BNB, amountIn: 100 USDT
9. Executor가 allowlist 검증 → 통과
10. Executor가 PancakeSwap V3로 USDT→BNB 스왑 실행
11. Executor가 Registry.recordTrade() 호출
    → receipt onchain에 영구 기록
    → `TradeRecorded(strategyId=0xabc..., user=Alice, ...)` 이벤트 발행
12. Alice는 알림 받음: "전략이 BNB를 샀어요"
```

### 검증 단계 (누구나, 언제나)

```
Carol (구매 고민 중인 사람)이 @CryptoWhale의 전략을 살펴봄.

cast call <TradeReceiptRegistry> "receiptsOf(bytes32)" 0xabc...

→ 지난 90일간 이 전략을 돌린 모든 사용자의 모든 거래 기록이 반환됨
→ Carol이 직접 수익률 계산 가능
→ @CryptoWhale도, 플랫폼도, 누구도 이 숫자를 바꿀 수 없음
```

---

## 사용자가 언제든 할 수 있는 일

보안의 마지막 층은 **탈출 경로** 다. Alice는 언제든 메인 지갑으로 자신의 Executor에 직접 트랜잭션을 보낼 수 있다:

```
withdraw(token, to, amount)  → 자금 꺼내기
revokeOperator()             → 우리 백엔드 권한 즉시 박탈
setAllowedToken(token, false) → 특정 토큰 금지
```

이 중 아무거나 실행되는 순간, 우리 operator는 아무것도 못한다. **사용자가 주도권을 갖는다** 는 건 수사가 아니라 컨트랙트에 박힌 사실이다.

---

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`, `cast`)
- Node 18+

## Setup

```bash
cd contracts
npm install          # installs tsx for export-abis script
npm run setup        # forge install: forge-std + openzeppelin-contracts
npm run build        # forge build
```

## Tests

```bash
npm test                                                            # unit tests (no fork)
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org npm run test:fork  # real PancakeSwap V3 swap
```

fork 테스트는 BSC 메인넷을 복제해서 실제 PancakeSwap V3 풀에 100 USDT → WBNB 스왑을 쏘고, receipt가 제대로 기록되는지까지 검증한다.

## Local dev

로컬 노드 기동 (기본값: BSC 메인넷 fork — 실제 풀·유동성 그대로 씀):

```bash
npm run anvil                              # fork BSC mainnet
FORK=testnet npm run anvil:testnet         # fork BSC testnet (유동성 얕음)
# OR plain: just run `anvil` without fork for clean state
```

샘플 Registry + Executor 배포:

```bash
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
PANCAKE_ROUTER=0x1b81D678ffb9C0263b24A97847620C99d213eB14 \
WBNB=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c \
USDT=0x55d398326f99059fF775485246999027B3197955 \
npm run deploy:local
```

이 한 번의 스크립트가 **6개의 tx** 를 브로드캐스트한다 (Registry 배포, Executor 배포, 권한 설정, allowlist 설정 x3).

## Export ABIs to frontend

```bash
npm run export-abis
```

`PerUserExecutor.json`, `TradeReceiptRegistry.json`, `addresses.json` 을 `../web/src/contracts/` 로 내보낸다. 프론트엔드가 Foundry의 전체 아웃풋을 읽을 필요 없이 바로 쓸 수 있도록.

## Deploy to BSC Testnet

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY with a funded account
source .env
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
PANCAKE_ROUTER=0x1b81D678ffb9C0263b24A97847620C99d213eB14 \
WBNB=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd \
USDT=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd \
npm run deploy:testnet
```

## Addresses

`addresses.json`에 PancakeSwap V3 Factory / SwapRouter / QuoterV2 / NonfungiblePositionManager 주소가 BSC Testnet과 Mainnet 기준으로 정리되어 있다.

### 컨트랙트 주소 선택 주의

PancakeSwap은 BSC에 두 종류의 라우터가 돌고 있다. 둘 중 **`SwapRouter`** 를 써야 한다:

- `0x1b81D678ffb9C0263b24A97847620C99d213eB14` — **V3 SwapRouter** (deadline 파라미터 포함). 우리 `IPancakeV3Router`가 이 시그니처와 일치
- `0x13f4EA83D0bd40E75C8222255bc855a974568Dd4` — **SmartRouter** (deadline 없음, V2+V3+StableSwap 라우팅). 시그니처가 달라서 우리 코드에선 호환 안 됨

실수로 후자를 allowlist에 넣으면 모든 스왑이 revert한다.
