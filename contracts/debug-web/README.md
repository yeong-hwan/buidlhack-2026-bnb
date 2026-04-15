# Debug Web 빠른 실행 가이드

`contracts/debug-web/index.html`에서 MetaMask로 `TradeReceiptRegistry`, `PerUserExecutor`를 직접 호출하는 로컬 데모입니다.  
기본 전제는 `BSC fork`가 아니라 `로컬 Anvil + mock contracts`입니다.

## 스크립트 구조

이제 스크립트가 3개로 나뉩니다.

- `debug-web/run-fresh-chain.sh`
  - 기존 `8545` 프로세스를 내리고
  - 항상 새로운 `Anvil(31337)` 체인을 띄웁니다.
  - 백그라운드가 아니라 포그라운드로 실행됩니다.
- `debug-web/init-contracts.sh`
  - 이미 떠 있는 Anvil에 mock 토큰/라우터 + 샘플 컨트랙트를 배포합니다.
- `debug-web/start-web.sh`
  - 브라우저용 정적 웹 서버만 띄웁니다.

## 1) 새 체인 실행

```bash
cd /Users/coolguy/dev/buidlhack-2026-bnb/contracts
bash debug-web/run-fresh-chain.sh
```

또는:

```bash
npm run debug:web:chain
```

이 스크립트는 포그라운드에서 계속 실행됩니다. 종료는 `Ctrl+C`입니다.

## 2) 컨트랙트 배포

```bash
cd /Users/coolguy/dev/buidlhack-2026-bnb/contracts
bash debug-web/init-contracts.sh
```

또는:

```bash
npm run debug:web:init
```

이 스크립트는 체인을 띄우지 않습니다. 이미 실행 중인 Anvil에만 배포합니다.

실행 결과:

1. `TradeReceiptRegistry`, `PerUserExecutor`, `MockERC20(WBNB/USDT)`, `MockPancakeV3Router` 배포
2. 결과를 `contracts/debug-web/demo-config.js`에 저장

기본 환경변수:

```bash
export DEPLOYER_PRIVATE_KEY=0xac0974be...
export SAMPLE_USER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export SAMPLE_OPERATOR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export USE_LOCAL_MOCKS=true
export DEMO_PAIR_RATE=1000000000000000000
export SAMPLE_STRATEGY_ID=0x64656d6f7374726174656779
```

## 3) 웹 서버만 시작

```bash
cd /Users/coolguy/dev/buidlhack-2026-bnb/contracts
bash debug-web/start-web.sh
```

또는:

```bash
npm run debug:web
```

브라우저 주소:

```bash
http://127.0.0.1:3000/index.html
```

이 스크립트는 체인을 건드리지 않습니다. 이미 띄워둔 Anvil과 이미 배포된 주소를 그대로 씁니다.
페이지는 `demo-config.js`를 자동으로 읽어서 기본 주소를 미리 채웁니다.

## 4) MetaMask 연결

Anvil 기본 계정:

- 주소: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- 개인키: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- 니모닉: `test test test test test test test test test test test junk`

MetaMask 네트워크:

- 네트워크 이름: `Anvil Local`
- RPC URL: `http://127.0.0.1:8545`
- 체인 ID: `31337`
- 통화 기호: `BNB`

## 5) 페이지에서 입력할 값

`init-contracts.sh`가 끝나면 `debug-web/demo-config.js`가 생성됩니다.

이 파일을 `index.html`이 자동으로 읽어서 아래 값을 미리 채웁니다.

- `registry`
- `executor`
- `swapRouter`
- `strategyId`
- `mockWbnb`
- `mockUsdt`

즉 보통은 주소를 수동으로 다시 붙여넣을 필요가 없습니다.

## 6) 새로운 페어 추가

페이지의 `Owner용 액션` 아래 `새로운 페어 추가`는 mock router에 pair를 직접 넣는 기능입니다.

예시:

- `tokenIn = MOCK_WBNB`
- `tokenOut = MOCK_USDT`
- `rate = 1000000000000000000`

의미:

- `1 WBNB -> 1 USDT` 비율

## 7) 추천 사용 흐름

1. `npm run debug:web:chain`
2. 다른 터미널에서 `npm run debug:web:init`
3. 또 다른 터미널에서 `npm run debug:web`
4. MetaMask 연결
5. 자동으로 채워진 주소 확인
6. `상세 조회`
7. 필요하면 `새로운 페어 추가`
8. `executeSwap`
