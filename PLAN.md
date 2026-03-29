# BuidlHack 2026 - BNB Chain Track
## No-Code On-Chain Trading Agent Platform

> 코딩 없이 나만의 온체인 트레이딩 에이전트를 만드는 플랫폼

---

## 제품 개요

사용자가 블록 기반 인터페이스로 트레이딩 전략을 설계하면, 멀티 에이전트 시스템이 BSC/opBNB 위에서 이를 자동으로 실행하는 노코드 온체인 전략 운영 플랫폼.

### 핵심 가치
- 코드 없이 복잡한 트레이딩 로직 구성 (Scratch/Figma 수준의 UX)
- 전략 = 그래프 형태의 의사결정 구조 (DAG)
- Alpha / Execution / Risk 에이전트가 협력하여 실행
- 전략 생성 → 검증(백테스트) → 실행 → 개선 전체 라이프사이클 통합
- 전략 마켓플레이스: 전략을 공유/거래 가능한 자산으로 취급

---

## 아키텍처

```
Frontend (React/Next.js)
    Block Editor (노코드 전략 설계 UI)
    Dashboard (실행 현황, 성과 모니터링)
    Strategy Marketplace

Backend / Agent Layer (TypeScript)
    Strategy Interpreter (블록 그래프 → 실행 로직 변환)
    Alpha Agent (시그널 수집: 모멘텀, 뉴스, 온체인 데이터)
    Execution Agent (DEX 실행, 가스 최적화, 라우팅)
    Risk Agent (손절, 포지션 한도, 리스크 룰 체크)
    Orchestrator (에이전트 간 충돌 조정, 최종 실행 결정)

Smart Contract Layer (Solidity)
    StrategyRegistry.sol  (전략 등록/관리, 소유권)
    VaultManager.sol      (사용자 자금 관리, 입출금)
    ExecutionGateway.sol  (에이전트 실행 트리거, 온체인 검증)
    StrategyNFT.sol       (전략 NFT화, 마켓플레이스 거래)

Blockchain
    BSC   - 실제 DEX 스왑 실행 (PancakeSwap 등, 유동성)
    opBNB - 에이전트 실행 로그 기록 (저비용 온체인 증명)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js, React Flow (블록 에디터), TailwindCSS |
| Backend | TypeScript, Node.js |
| Smart Contract | Solidity, Hardhat |
| Agent | LangChain / 자체 구현 |
| DEX 연동 | PancakeSwap SDK, Viem |
| 온체인 | BSC Mainnet/Testnet, opBNB |
| 디자인 | Figma (MCP 연동으로 실시간 모니터링) |

---

## 코드 설계 원칙

- **1 파일 1 클래스** 원칙 엄수
- 각 블록은 독립적인 클래스로 구현 (`BaseBlock`을 상속)
- 에이전트 각각 독립 클래스 (`BaseAgent`를 상속)
- Smart Contract는 기능별 분리, 단일 책임 원칙

### 블록 클래스 구조 (예시)
```
BaseBlock (abstract)
├── signal/
│   ├── MomentumSignalBlock
│   ├── NewsSignalBlock
│   └── OnchainDataSignalBlock
├── condition/
│   ├── PriceConditionBlock
│   ├── VolumeConditionBlock
│   └── TimeConditionBlock
├── action/
│   ├── SwapActionBlock
│   ├── DCAActionBlock
│   └── RebalanceActionBlock
└── risk/
    ├── StopLossBlock
    ├── TakeProfitBlock
    └── PositionLimitBlock
```

### 에이전트 클래스 구조 (예시)
```
BaseAgent (abstract)
├── AlphaAgent
├── ExecutionAgent
├── RiskAgent
└── OrchestratorAgent
```

---

## 전략 실행 흐름

```
1. 사용자가 블록 에디터에서 전략 설계 (DAG 구성)
2. Strategy Interpreter가 DAG를 실행 가능한 로직으로 변환
3. StrategyRegistry.sol에 전략 등록 (온체인)
4. Orchestrator가 주기적으로 실행 루프 시작
5. Alpha Agent → 시그널 수집 및 판단
6. Risk Agent → 리스크 룰 사전 검증
7. Execution Agent → BSC DEX에서 실행
8. opBNB에 실행 로그 기록
9. 결과 피드백 → 대시보드 업데이트
```

---

## 온체인 증명 전략

- 전략 등록: StrategyRegistry.sol 트랜잭션 (BSC)
- 실행 로그: opBNB에 저비용으로 기록
- 자금 흐름: VaultManager.sol → DEX 실행 트랜잭션 (BSC)

---

## 해커톤 제출 요건 체크리스트

- [ ] 배포된 웹앱 (데모)
- [ ] 발표 덱 (문제 → 솔루션 → 비즈니스 모델 → 차별점)
- [ ] 2~4분 데모 영상
- [ ] GitHub 공개 레포 + README
- [ ] opBNB/BSC 배포 + 트랜잭션 2회 이상
- [ ] 트위터 게시 (@BNBChain + #ConsumerAIonBNB)

---

## 마일스톤

| 단계 | 내용 |
|------|------|
| Week 1 | 블록 에디터 UI + 전략 DAG 설계 |
| Week 2 | 에이전트 시스템 + Smart Contract 개발 |
| Week 3 | BSC/opBNB 연동 + 백테스트 |
| Week 4 | 통합 테스트 + 데모 준비 + 배포 |

**제출 마감: 2026년 4월 17일 23:59 KST**
