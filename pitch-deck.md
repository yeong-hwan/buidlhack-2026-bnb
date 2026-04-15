# 🎯 [Project Name] — Pitch Deck

> **Build your own trading agent. No code required.**
>
> Design on-chain trading strategies with a visual block editor. Deploy autonomous agents in one click — they execute on **BSC** and **opBNB** automatically.

---

## 1. Problem

크립토 트레이더들이 매일 부딪히는 두 벽:

**"좋은 전략 아이디어는 있는데, 만들 수가 없다."**
코딩 못 하면 봇으로 만들 방법이 없다. 개발자에게 맡기면 비싸고 느리고, 수정 한 번에 또 의뢰해야 한다.

**"잘하는 트레이더의 전략을 그대로 따라 하고 싶은데, 신뢰가 안 간다."**
SNS에서 "이 전략 수익률 200%"라고 자랑하는 사람은 많다. 하지만 진짜 그 전략으로 매매했는지, 결과가 조작이 아닌지 검증할 방법이 없다.

---

## 2. Solution

**블록 조립으로 전략을 만들고, 원클릭으로 자동매매 봇을 배포한다 - 모두 BNB Chain 위에서.**

### 핵심 3가지

**① No-Code Strategy Builder**
레고처럼 블록을 조립해 트레이딩 로직을 만든다. 조건 블록, 액션 블록, 시그널 블록을 끌어다 붙이면 끝. 초등학생도 1시간이면 첫 전략을 만든다.

**② One-Click Deploy on BSC + opBNB**
만든 전략은 클릭 한 번으로 자율 에이전트가 되어 **PancakeSwap**에서 실제 매매를 실행한다. BSC와 opBNB의 저렴한 가스비 덕분에 소액 사용자도 부담 없이 시작할 수 있고, 고빈도 전략도 경제성이 나온다.

**③ Verifiable Strategy Marketplace**
잘 나가는 전략을 사거나, 내 전략을 팔 수 있다. **모든 전략의 실행 결과는 BSC에 해시로 앵커링되어 위변조 불가능.** "진짜 그 전략대로 돌렸는지"가 온체인으로 증명된다 - 카피트레이딩의 근본적인 신뢰 문제를 푼다.

---

## 3. Why AI? Beyond Price Charts

기존 트레이딩 봇은 RSI, MA, MACD 같은 차트 지표만 본다. 하지만 진짜 시장은 차트 밖에서 움직인다. **AI가 필요한 이유는 차트 밖 세상을 시그널로 바꾸기 위해서다.**

### AI Signal Blocks - 두 종류

**Non-Coin Signal Block**
- "나스닥 선물이 1% 이상 빠지면"
- "달러 인덱스가 105를 넘으면"
- "10년물 금리가 4.5% 위로 올라가면"

매크로 조건을 블록 하나로 추가할 수 있다. 코인은 매크로의 그림자다. 그걸 못 보는 봇은 항상 늦는다.

**Semantic Signal Block**
- "연준 의장이 비둘기파 발언을 하면"
- "비트코인 ETF에 순유입이 발생하면"
- "트럼프가 관세 관련 트윗을 올리면"

AI 에이전트가 뉴스/SNS/온체인 데이터를 의미 단위로 해석해 시그널로 변환한다. 수식이 아니라 맥락을 읽는 전략.

### 한 줄 예시

> "나스닥 선물 1% 하락 **AND** 연준 매파 발언 감지" → "BNB 포지션 50% 매도"
>
> 이걸 블록 4개 조립으로 만들 수 있다.

---

## 4. How It Works (Architecture)

심플한 3-레이어 구조 - 하루면 MVP가 나온다.

```
┌──────────────────────────────────────────┐
│  Visual Block Editor (Frontend)          │  ← 블록 조립 + 마켓플레이스
└──────────────────────────────────────────┘
                  ↓ deploy
┌──────────────────────────────────────────┐
│  Strategy Execution Engine (Off-chain)   │  ← 시그널 모니터링 + 실행 결정
│  - Price/Macro/News Data Ingestion       │
│  - Block Logic Evaluator                 │
│  - AI Signal Workers                     │
└──────────────────────────────────────────┘
                  ↓ when triggered
┌──────────────────────────────────────────┐
│  On-chain Layer (BSC + opBNB)            │
│  - PancakeSwap V3 Trade Execution        │  ← 실제 거래
│  - Strategy Hash Registry                │  ← 전략/실적 검증
│  - Marketplace Settlement Contract       │  ← 수수료 자동 분배
└──────────────────────────────────────────┘
```

### 왜 이 구조가 옳은가

- **실행은 오프체인**: 시그널 평가를 매번 온체인에서 하면 가스 폭탄. 오프체인에서 평가하고 거래만 온체인으로 보낸다.
- **거래는 PancakeSwap V3에 집중**: V1에서 한 곳에 집중해 BSC 거래량에 직접 기여. 슬리피지/라우팅도 단순화.
- **신뢰는 온체인 해시로**: 전략의 매 실행 결과를 BSC에 해시로 등록 → 마켓플레이스에서 누구나 진위 검증 가능. 이게 다른 카피트레이딩 플랫폼과의 결정적 차이.

---

## 5. Differentiation

|                       | No-Code Builder | Marketplace | One-Click Deploy | Non-Coin Signal | Semantic Signal | Onchain Verifiable |
| --------------------- | --------------- | ----------- | ---------------- | --------------- | --------------- | ------------------ |
| Coinrule              | O               | △           | O                | X               | X               | X                  |
| Cryptohopper          | △               | O           | O                | X               | X               | X                  |
| TradeTron             | O               | O           | O                | X               | X               | X                  |
| eToro 카피트레이딩    | X               | O           | O                | X               | X               | X                  |
| **우리 플랫폼**       | **O**           | **O**       | **O**            | **O**           | **O**           | **O**              |

다른 봇 플랫폼이 차트 안에 갇혀 있을 때, 우리는 **차트 밖 시그널 + 의미 기반 시그널 + 온체인 검증**을 모두 통합한 유일한 플랫폼이다.

---

## 6. Business Model

**수익은 단 한 곳에서 나온다 - 마켓플레이스 컨트랙트 수수료.**

- 전략 거래 시 거래액의 **10%를 스마트 컨트랙트가 자동 수취**
- 전략 제작자 90% / 플랫폼 10% (자동 분배, 사람 개입 없음)
- 가입비/구독비 없음 → 진입 장벽 제로

### 왜 이게 좋은가

- **단순하다.** 사용자가 헷갈릴 게 없다.
- **인센티브 정렬.** 좋은 전략이 많이 팔려야 우리도 번다.
- **온체인 자동 정산.** 투명하고, 자동이고, 글로벌.

---

## 7. Go-to-Market

### Phase 1: 검증된 트레이더와 함께 시작 (Day 1 마케팅)

크립토 트위터/유튜브에서 **이미 실적이 검증된 트레이더 5-10명과 파트너십**. 그들의 전략을 플랫폼에 미리 올려두고 이렇게 마케팅한다:

> "@CryptoWhale의 BNB 스윙 전략, 클릭 한 번이면 당신 지갑에서 자동으로 돌아갑니다. 모든 거래는 BSC에 검증되어 박힙니다."

- **트레이더에게**: 팔로워를 즉시 수익으로 전환할 수 있는 새 수익원
- **팔로워에게**: 검증된 전략을 원클릭으로 따라가는 안전한 경험
- **우리에게**: 출시 즉시 트랙션 + 신뢰성

### Phase 2: 커뮤니티 시드

텔레그램/디스코드에 무료 전략 템플릿 배포. 마켓플레이스에 전략이 쌓이면 네트워크 효과로 구매자 유입.

### Phase 3: 크리에이터 이코노미

누구나 전략 제작자가 된다. 좋은 전략은 자연스럽게 위로 떠오른다. **트레이더가 인플루언서가 되는 플랫폼.**

---

## 8. What We'd Build Next

- **Hackathon (오늘)**: Block Editor MVP + PancakeSwap V3 연동 + Strategy Hash Registry + Marketplace Settlement Contract on BSC Testnet
- **1-3개월**: opBNB 풀 마이그레이션으로 가스비 추가 절감, AI 시그널 블록 베타 출시
- **3-6개월**: 모바일 앱, 더 많은 시그널 소스 (온체인 고래 움직임, DeFi TVL 변동), 전략 NFT화로 소유권 이전 시장
- **장기 비전**: 트레이딩 전략의 GitHub. 누구나 fork하고, 개선하고, 수익을 나눈다.
