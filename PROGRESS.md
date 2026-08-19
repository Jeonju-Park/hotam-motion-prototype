# PROGRESS — 호탐 모션 프로토타입

> 작성: Claude · 기준일 2026-08-19 · 시각은 로컬(KST)

| 시각 | STEP | 내용 | 검증 |
|---|---|---|---|
| 04:02 | STEP 0 | node v24.14.0 확인 · PROTO_SPEC 정독 | - |
| 04:05 | STEP 0 | 피그마 노드 탐색: `get_metadata` 결과 최상위 페이지 `Cover` 1개뿐. 디자인/스타일가이드 페이지 접근 불가 | `reference/figma_nodes.json` |
| 04:07 | STEP 0 | `get_variable_defs(1:2)` = `{}` -> 대체 소스로 `00_context/tokens/*.json`(동일 파일 Variables export, CLAUDE.md 캐논) 채택 | `reference/figma_vars.json` |
| 04:08 | STEP 0 | `get_screenshot(1:2)` 저장 | `reference/cover.png` |
| 04:12 | STEP 0 | 스펙 §2 대 피그마 캐논 토큰 9건 차이 확인, 판정 후 `tokens.css` 생성 | QA_REPORT 판단기록 D1~D4 |
| 04:20 | STEP 0 | `verify/verify.mjs` 작성(12개 검사군) | `node verify/verify.mjs` = 0 |
| 04:35 | STEP 1 | 셸(390x844) · 해시 라우터 · 화면 스택 · 전환 엔진(Trans1/2/3/5) · 엣지 스와이프 · 입력잠금 · 개발 바 · 데모 A/B/C | verify 통과 |
| 04:50 | STEP 2 | 공통 컴포넌트 전부(버튼4·인풋4상태·칩·행·점수배지·토스트·다이얼로그·시트엔진·스켈레톤·스피너) + `#components` 데모 | verify 통과 |
| 05:05 | STEP 3 | A0 로그인 · ON1 선택 · ON2 평가 | 브라우저 순회 |
| 05:20 | STEP 4 | S7 홈 피드(탭2·스켈레톤 정책·찜 낙관적·카드->상세) | 브라우저 순회 |
| 05:35 | STEP 5 | S9 탐색(지도목업·핀8+클러스터·시트 3단·재검색 pill·현위치) | 스냅 상수 grep |
| 05:50 | STEP 6 | 미리보기 시트 -> 상세 확장 · S4 패럴랙스/앱바 진행률 | 브라우저 순회 |
| 06:05 | STEP 7 | 기록 플로우 Trans2 모달 4스텝 + 점수 공개 타임라인 | 브라우저 순회 |
| 06:15 | STEP 8 | 랭킹·프로필 Empty State 순차 등장 · reduced-motion 전 화면 | 토글 검증 |
| 06:30 | STEP 9 | 종합 QA: 전 화면 스크린샷 15장 · 콘솔 0 · 시각 차이 12건 수정 | `reference/shots/` |
| **07:05** | **재작업** | **정주가 노드 ID 링크 8개 제공 -> 피그마 접근 성공.** `get_variable_defs` 실측 결과 STEP 0에서 채택한 2026-07 JSON export가 낡았음을 확인(9건 불일치) | `reference/figma_vars.json` |
| 07:10 | 재작업 | tokens.css 전면 재정렬(bg-default=white, bg-surface=gray, border #E3E8EA, pressed #D66500, grade bad=red, radius/full 추가, heading-lg 1.3 / heading-sm 18 추가) | verify 통과 |
| 07:25 | 재작업 | `verify/crop.mjs` 작성 · 피그마 원본 8노드 다운로드 · 홈 피드 프레임 크롭 | `reference/crop_home.png` |
| 07:40 | 재작업 | S7 홈 피드 전면 재구성(워드마크·링형 점수배지·팔로우·사진 스트립·장소 바·하트/댓글 액션행) | 피그마 대조 |
| 07:55 | 재작업 | 탭바 아이콘(compass·plus-circle) + 활성 채움 아이콘 · 세그먼트 잉크 인디케이터 | 피그마 대조 |
| 08:05 | 재작업 | S4 상세(3열 평점·아웃라인 페어·친구들의 기록 N) · S9 시트 행(썸네일+등급칩+기록수+찜) | 피그마 대조 |
| 08:15 | 재작업 | 토큰 반전에 따른 면/배경 교정 8건(탭바·시트·다이얼로그·인풋·칩·현위치·재검색·소셜버튼) | verify 통과 |
| 08:25 | STEP 9' | 재검증: verify 12 pass/0 fail · 스크린샷 15장 재캡처 · 전 라우트 13개 순회 · 콘솔 0 | - |
| 08:35 | STEP 10 | QA_REPORT.md 작성 · 마감 | - |

## 2차 — 모션 가이드 대조 · 피그마 8노드 · 배포

| 시각 | 내용 | 검증 |
|---|---|---|
| 09:10 | `handoff_모션가이드_개발.md` v1.0.0 대조 — 어긋난 10건 발견 | QA_REPORT §4-B |
| 09:20 | 딤 easing(standard) · 엣지 정착(d4·exit) · dismiss 30% · 시트 scrim 연동 · 칩 해제 d2 · 토스트 소멸 d2 교정 | verify 통과 |
| 09:35 | 미구현 컴포넌트 추가: 버튼 loading · 배너(grid 0fr->1fr) · 제출 거부 shake · 햅틱 | 컴포넌트 데모 |
| 09:45 | **reduced-motion 재설계** — 전 duration 1ms 압축을 폐기하고 "이동·overshoot·count-up·패럴랙스만 제거" 방식으로 전환. 스피너 1200ms 감속 유지 | 토글 검증 |
| 09:55 | count-up "이전 점수부터"(`Modal.prevScore`) | 점수 공개 |
| 10:10 | S11 랭킹 전면 구현(미식/식당 세그·내 순위 카드·친구/전체·내 행 하이라이트) | 피그마 724:8837 |
| 10:25 | S10 프로필 전면 구현(3스탯·핸들·내 식당 리스트·기록/위시·3열 그리드) | 피그마 724:9698 |
| 10:35 | S15 통합검색 · S12 알림 · 설정 신규 구현 | 피그마 718:4325 · 724:11079 |
| 10:50 | **모션 바로가기 바 14종** 추가 — 상태까지 몰고 간 뒤 재생, 엣지 스와이프는 실제 PointerEvent 재생 | 자동 순회 에러 0 |
| 11:00 | 스크린샷 18장 재캡처 · verify 12 pass / 0 fail | - |
| 11:10 | GitHub 저장소 생성·푸시 → Pages 배포 | https://jeonju-park.github.io/hotam-motion-prototype/ |

## 마감

- 산출물: `index.html` `tokens.css` `app.css` `app.js` `data.js` · `verify/{verify,shots,crop}.mjs` · `reference/`(피그마 원본 9 + 크롭 1 + 스크린샷 15 + 메타 2) · `PROGRESS.md` `QA_REPORT.md`
- 최종 상태: **DoD 8/8 통과 · verify 12 pass / 0 fail · 콘솔 에러 0**
- 정주 확인 필요 2건은 `QA_REPORT.md` §2 D2에 정리 (캐논 토큰 파일 갱신 / `radius/full` 대 pill 금지 규칙 충돌)

## 3차 — 정주 피드백 9건 (08-19)

| 시각 | 내용 | 검증 |
|---|---|---|
| 18:20 | 스타일가이드(165:1453) 실측 수집 · 진입 보드(712:9161) 크롭 | reference/figma_styleguide.png · crop_login.png |
| 18:35 | (6) 다이얼로그 자동 닫힘 수정 — goto()의 지연 클리어 + 리스너 누적 | 브라우저 재현 후 통과 |
| 18:45 | (1) 피드 카드 전체 탭 -> 상세 · (2) Pop = 엣지 스와이프 통일(d5·emphasized-exit) | 브라우저 순회 |
| 18:55 | (3) 모달 top 48px + viewport filter 트랜지션 제거 · (4·5) 인풋 filled 잉크 2px | 스크린샷 |
| 19:10 | (7) A0 마스코트 스플래시 + 소셜 3종 + 이메일 로그인 분리 · ON1/ON2 디자인 정합 | crop 대조 |
| 19:20 | (8) 미리보기 아래 드래그 dismiss + 목록 시트 복귀 · (9) 랭킹 스코프 Trans3 페이드 | 브라우저 재현 |
| 19:30 | 스크린샷 18장 재캡처 · verify 12 pass / 0 fail · 배포 | Pages |
