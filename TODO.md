# TODO — 6시간 남음 🚨

**BNB Chain 트랙 마감: 4/16 23:59 KST**

---

## 🔴 절대 필수 (제출 요건)

### 1. Vercel 배포 (30분)
- [ ] `web/` 디렉토리 Vercel 프로젝트 생성
- [ ] 환경변수 설정: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- [ ] Production 빌드 통과 확인 (`npm run build`)
- [ ] 라이브 URL 확보 → 제출 폼에 첨부

### 2. 온체인 증명 (동료 진행)
- [ ] BSC/opBNB testnet에 StrategyRegistry 컨트랙트 배포
- [ ] 트랜잭션 2회 이상 실행
- [ ] 컨트랙트 주소 + 트랜잭션 해시 수집

### 3. GitHub README 최종 점검 (15분)
- [ ] Live Demo URL 추가
- [ ] Contract Address 추가 (동료 작업 완료 후)
- [ ] Setup instructions 검증
- [ ] Screenshot/GIF 추가

### 4. 데모 영상 (2~4분) — 장표와 함께 처리 중

### 5. 트위터 게시 — 장표 완성 후

### 6. Ludium 포털 제출 — 모든 링크 확보 후

---

## 🟡 완료하면 좋음 (시간 남으면)

### 프로덕션 빌드 이슈 체크
- [ ] `npm run build` 에러/경고 제거
- [ ] `.env.example` 최신화
- [ ] Chat Thread에서 OpenAI 크레딧 없을 때 mock 동작 검증

### 마지막 기능 검증
- [ ] 존 드래그 이동 동작 확인
- [ ] 블록 추가/삭제/편집 동작 확인
- [ ] 전략 생성 (한국어/영어) 동작 확인
- [ ] Wallet 연결 동작 확인

---

## ⛔ 이번엔 하지 말자

- 존 복제 로직
- Backtest mock 차트
- 디자인 통일 (Home 페이지 등)
- Market 페이지 연동
- JSON export/import
- Simulate 버튼

---

## 🎯 추천 순서

1. **지금 바로:** `npm run build` 통과 확인 + Vercel 배포
2. **배포 중:** 동료 온체인 작업 진행도 확인
3. **배포 완료 후:** README 업데이트 + 스크린샷
4. **제출 폼 준비:** 모든 링크 수집
