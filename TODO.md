# TODO

**마감: 2026년 4월 17일 23:59 KST — D-2**

---

## P0 — 해커톤 필수 제출 요건 (없으면 탈락)

### 온체인 (동료 담당)
- [ ] Smart Contract 배포 (BSC testnet)
  - [ ] StrategyRegistry.sol — 전략 등록/소유권
  - [ ] VaultManager.sol — 자금 관리
- [ ] opBNB 에이전트 실행 로그 기록 컨트랙트
- [ ] 트랜잭션 2회 이상 성공 (해커톤 증명 요건)
- [ ] Deploy 버튼 → 실제 온체인 전략 등록 연동

### 배포
- [ ] Vercel 배포 (라이브 데모 URL)

### 제출물
- [ ] 2~4분 데모 영상 촬영
- [ ] 발표 덱 완성 (10슬라이드)
- [ ] 트위터 게시 (@BNBChain + #ConsumerAIonBNB)
- [ ] Ludium 포털 제출

---

## P1 — 데모 품질 (시간 있으면)

### Strategy Studio
- [ ] 존 복제 기능 (copy 버튼 → 실제 복제 로직 연결)
- [ ] Backtest 버튼 — mock 백테스트 차트
- [ ] 블록 필드 편집 시 드래그 방해 안 되는지 확인
- [ ] 대화 히스토리 로컬 저장/불러오기

### 디자인 통일
- [ ] Home 페이지 색상 톤 통일 (green-500 → cyan-400)
- [ ] Home 이모지 아이콘 제거
- [ ] Market 페이지 Strategy Studio와 연동

---

## P2 — 있으면 좋은 것

- [ ] Simulate 버튼 mock
- [ ] 전략 JSON export/import
- [ ] 전략 공유 링크

---

## 완료된 항목

### Strategy Canvas
- [x] DAG 에이전트 존 레이아웃 (고정 컬럼, 겹침 해결)
- [x] 사용 안 하는 에이전트 존 흐리게 처리
- [x] 블록 간 시그널 연결선 (BUY/SELL/BULLISH 라벨 + 색상)
- [x] Smooth step 엣지 (둥근 모서리)
- [x] 블록 팔레트 사이드바 (카테고리별 접기/펼치기)
- [x] 에이전트 존 헤더 드래그 → 자유 이동 (useNodesState)
- [x] 블록 변경해도 존 위치 유지
- [x] 존 복제 버튼 UI (로직 연결 필요)

### Block Editor
- [x] Scratch 스타일 블록 (Hat/Stack/C-block/Cap)
- [x] 솔리드 컬러 + 3D 깊이감 (inset box-shadow)
- [x] 블록 인라인 편집 (select/number/text)
- [x] 블록 드래그앤드롭 순서 변경 (dnd-kit)
- [x] C-block 하위 블록 드래그 (중첩 DnD)
- [x] 블록 삭제 (X 버튼)
- [x] Edit 모드 제거 → 항상 인터랙티브
- [x] 블록 유효성 검증 (에러/경고 표시)

### Conversation UX
- [x] ChatGPT 스타일 대화 스레드 (오른쪽 패널)
- [x] 대화 히스토리 표시 (유저/시스템 메시지)
- [x] 이전 전략 기반 수정 요청 (previousStrategy context)
- [x] 한국어/영어 자동 감지 응답

### LLM
- [x] OpenAI GPT-4o-mini 연동 (주 엔진)
- [x] Anthropic Claude fallback
- [x] Smart mock fallback (크레딧 없어도 동작)
- [x] 에이전트당 2-4개 블록 생성
- [x] 프롬프트 고도화 (예제 2개, 블록 순서 규칙)

### Wallet
- [x] Connect Wallet (wagmi + viem)
- [x] BSC Testnet + opBNB Testnet 설정
- [x] 주소 축약 표시 + 연결 해제
