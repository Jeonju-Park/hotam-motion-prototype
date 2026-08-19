# QA_REPORT — 호탐 모션 프로토타입

> v1.1 · 2026-08-19 · 작성: Claude · 상태: final
> 기준 문서: `PROTO_SPEC.md` v1.0.0 + `handoff_모션가이드_개발.md` v1.0.0 · 디자인 기준: Figma `BXMdfHOhPcmpD5W874jeOS` (호탐 UI2)
> **배포:** https://jeonju-park.github.io/hotam-motion-prototype/ · 저장소 https://github.com/Jeonju-Park/hotam-motion-prototype (public)
> 로컬 실행: `npx serve .` 후 `http://localhost:3000/index.html`

---

## 1. DoD 체크 결과표 (PROTO_SPEC §8)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | §6 화면 전부 이동 가능(끊긴 링크 0) | **통과** | 12개 라우트 + 기록 모달 자동 순회 전부 `is-active` + `rendered`. 로그인->온보딩1->온보딩2->홈 체인, 홈->상세, 탐색->미리보기->상세, 탭바 5개 모두 도달 |
| 2 | Trans1(딤)·Pop(엣지)·Trans2(400ms)·Trans3(무scale) | **통과** | 4x 슬로우로 실측: push `anim-push` + 이전화면 `at-left has-dim`, 딤 transition `1.2s`(=d6x4) `emphasized-enter`. 모달 `0.4s cubic-bezier(0,0,.15,1)`=d7·enter, 탭바 하강 `0.2s exit`=d4. TabFade는 `transition-property: opacity`만, 양쪽 `transform: none` |
| 3 | 시트 200/50vh/95vh + Full 검색바 숨김 + dismiss | **통과** | snaps 실측 `[200, 422, 780]`. Half=translateY(358)=780-422. Full 도달 시 `map-search.is-hidden`. Peek 아래 드래그 시 `dismissed=true`, translateY(780) |
| 4 | 미리보기->상세 확장 + 복귀 시 상태 복원 | **통과** | 그러버 위로 드래그(임계 초과) -> `#detail` push. 뒤로 -> `#explore` + `previewSheet.is-shown`, 같은 식당명 유지 |
| 5 | 점수 공개 타임라인 + 탭 스킵 | **통과** | `reveal is-mounted is-dim is-badge is-chip is-cta` 순차 도달, count-up 종료값 9.6. scrim/inner 탭 시 `finishAll()`로 전 단계 즉시 완료 |
| 6 | 스켈레톤 200ms 정책 데모 | **통과** | 지연 1200ms에서 t=120ms 스켈레톤 0개 / t=400ms 15개 / t=1400ms 유지(최소 300ms 홀드). 지연 100ms에서는 스켈레톤 미노출·카드 직행 |
| 7 | 버튼 scale 0 · 이모지 0 · hex 하드코딩 0 | **통과** | `node verify/verify.mjs` 12 pass / 0 fail. scale 사용처 8곳 전부 전환·시트·배지(`.viewport.is-behind` `.dialog` `.reveal__badge` `.pick__ico`) |
| 8 | 콘솔 에러 0 · reduced-motion 토글 | **통과** | 전 화면 순회 후 콘솔 로그 0건. `data-rm=1` 시 d1~d8=1ms, 이동->페이드 치환, count-up 즉시, 패럴랙스 off. `prefers-reduced-motion` 미디어쿼리 병행(matchMedia) |

**검증 스크립트:** `node verify/verify.mjs` (12개 검사군, exit 0)
**스크린샷 캡처:** `node verify/shots.mjs` (Chrome 헤드리스, 15장, 390x844)

---

## 2. 판단 기록

### D1. 피그마 접근 (2회 반전 — 최종은 피그마 실측)
- **1차(STEP 0):** `get_metadata`가 최상위 페이지로 `Cover` 하나만 반환. `get_variable_defs(1:2)` = `{}`.
  데스크톱에 열린 페이지가 표지였고, 노드 ID를 몰라 디자인 페이지에 접근 불가.
  -> 대체 소스로 `00_context/tokens/*.json`(2026-07 Variables export, CLAUDE.md 캐논)을 채택.
- **2차(작업 중반):** 정주가 노드 ID가 포함된 링크 8개를 제공. **노드 ID를 명시하면 접근된다**는 것을 확인
  (`712:9161` 등). `get_variable_defs`가 실제 값을 반환.
- **결과:** 실측 피그마 변수는 **`PROTO_SPEC §2`와 일치**하고, 제가 1차에 채택했던 2026-07 JSON export와는 달랐다.
  -> **1차 판단을 전부 되돌리고 피그마 실측값으로 재정렬.** 아래 D2 표 참조.
- **참고:** Chrome(claude-in-chrome)으로 피그마 웹을 열면 로그인 벽이 뜬다. 자격증명 입력은 제가 하지 않으므로
  이 경로는 사용하지 않았다. **MCP + 노드 ID 조합이 유일하게 동작하는 경로다.**

### D2. 토큰 — 피그마 실측 vs 2026-07 JSON export
`get_variable_defs(712:9161)` 실측값을 최종 채택했다. `00_context/tokens/*.json`은 **낡았다**(9건 불일치).

| 토큰 | 피그마 실측(채택) | 00_context JSON(폐기) | 비고 |
|---|---|---|---|
| `bg/default` | **#FFFFFF** | #F0F4F5 | 화면 배경 = 흰색 |
| `bg/surface` | **#F0F4F5** | #FFFFFF | 면(카드·칩) = 회색 |
| `border/default` | **#E3E8EA** | #CBD3D6 | |
| `main/primary-pressed` | **#D66500** | #A94F00 | |
| `grade/good-bg` | **#FFE5CF** | #FFF4EA | |
| `grade/soso-bg` | **#E4EDE5** | #F1F6F2 | |
| `grade/bad` | **#E5484D**(red) | #6C767B(gray) | 08-11 캐논 = 별로는 red |
| `grade/bad-bg` | **#FDE8E7** | #F0F4F5 | |
| `alpha/glass-60` | **#FFFFFF 60%** | #F0F4F5 60% | |

**신규 확인 토큰(피그마에만 존재):** `radius/full: 9999` · `heading/sm 18/700/1.3` · `heading/lg 20/700/**1.3**`(1.4 아님) · `Gray/100·200·400` · `BW/Black #191919`.
> **정주 확인 필요 #1:** `00_context/tokens/*.json`과 `design_tokens.md`가 현재 피그마와 9건 어긋난다. 캐논 파일 갱신 필요.
> **정주 확인 필요 #2:** 피그마에 `radius/full: 9999`가 존재하고 점수 배지에 쓰인다. `design_tokens.md`의 "12 초과·pill 금지"와 충돌. 본 프로토타입은 **배지·아바타 한정으로 r-full 허용, 버튼은 12 유지**로 처리했다.

### D3. 로그인 이후 경로 (PROTO_SPEC §6 vs PROTO_PROMPT STEP 3)
- 스펙 §6 A0: "로그인 탭 -> Trans5로 홈" / STEP 3 자가검증: "로그인->온보딩->홈 도달"
- **처리:** 둘 다 만족하도록 분기. **기존 회원 로그인 CTA -> Trans5 -> 홈**, **소셜/이메일 가입 -> Trans5 -> ON1 -> ON2 -> 홈**.

### D4. 시트와 탭바의 겹침
- Peek 200px를 `bottom:0`으로 두면 탭바(64)가 하단 64px를 덮어 "그러버+헤더+첫 카드"가 안 보인다.
- **처리:** 탐색 시트를 `bottom: var(--tabbar-h)`로 올리고 스냅값은 스펙 그대로(200 / 0.5·844=422) 유지.
  **Full만 가용 높이로 클램프**(0.95·844=802 -> 780). 스펙 대비 22px 차이. 상수 200/0.5/0.95는 코드에 그대로 존재.

### D5. 시간·easing 하드코딩 금지의 JS 적용
- CSS 변수를 런타임에 읽는 `T.d1~d8` / `T.dl60~200` getter를 만들고 모든 `setTimeout` 지연을 여기서 받는다.
  reduced-motion·4x 슬로우 토글이 **JS 타이밍까지 자동 반영**된다. 검증 스크립트가 `setTimeout(fn, 숫자리터럴)`을 에러로 잡는다.
- 스펙 §4의 `1200ms pulse` / `800ms spin`은 d1~d8 밖이라 `--d-pulse` `--d-spin`으로 별도 정의.
  60/80/100/120/160/200ms 지연도 `--dl-*`로 정의. **duration 별칭이 아니라 delay 토큰**이라 "별칭 금지" 규칙과 충돌하지 않는다고 판단.

### D6. rAF 정지 환경 대응 (실제 버그 수정)
- 마운트 직후 `requestAnimationFrame`으로 트리거하던 상태 전환(빈/에러 상태 순차 등장, 시트 open, 비교 카드 진입,
  점수 공개)이 **탭이 렌더링하지 않는 환경에서 영구히 발동하지 않는** 버그를 발견.
- **처리:** `nextFrame()` 헬퍼(이중 rAF + `--d1` 타이머 폴백) 도입, 해당 7곳 전부 교체. `countUp`에도 완료 폴백 추가.

### D7. 어휘 (스펙 §7 우선)
- 피그마 탐색 시트의 칩은 "좋았어요"(선택형)로 그려져 있으나, 스펙 §7이 **표시형=좋음/그저/별로, 혼용 금지**를 명시.
  -> 리스트·카드 칩은 **표시형(좋음/그저/별로)**, 기록·온보딩 버튼만 선택형(좋았어요/그저그래요/별로였어요).

### D8. 접근성 판단
- 비활성 탭·세그먼트 라벨을 `text/disabled`(#8A959A, 대비 2.6:1)에서 `text/secondary`(#535C60, 6.4:1)로 올렸다.
  `design_tokens.md`의 "아이콘 꺼짐=disabled" 규칙 대비 의도적 상향. 라벨 텍스트 가독성 우선.

---

## 3. 피그마와 의도적으로 다르게 한 것

| 항목 | 피그마 | 프로토타입 | 이유 |
|---|---|---|---|
| 사진 | 실제 음식 사진 | 카테고리 SVG + 톤 배경 | 스펙 §1.3 "외부 이미지 URL 금지". 피그마 크롭도 저작권 불명이라 미사용 |
| 지도 | 실제 지도 타일(네이버 계열) | 연회색 도로 그리드 목업 | 스펙 §1.5 "실지도 SDK 금지" |
| 등급 칩 문구 | "좋았어요" | "좋음" | 스펙 §7 표시형 규칙 (D7) |
| 시트 Full | 95vh | 780px(가용 높이 클램프) | 탭바 겹침 회피 (D4) |
| 비활성 탭 색 | disabled | secondary | WCAG 대비 (D8) |
| 로고타입 | signboard t 커스텀 레터링 | Pretendard ExtraBold "hotam" | 벡터 로고 미확정(캐논 §7 "로고 벡터화 게이트 대기") |
| 버튼 pressed | (구 컴포넌트 문서: 딤+scale 0.96) | 배경색 전환만 | **PROTO_SPEC §4가 08-11 튜닝으로 scale 전면 금지**. 스펙이 더 최신 |

---

## 4. 미해결 항목과 사유

| # | 항목 | 사유 |
|---|---|---|
| U1 | 피그마 전 페이지 크롭 대조 | 노드 ID가 제공된 8개 노드만 접근 가능. 페이지 목록은 여전히 `Cover`만 노출되어 미제공 화면(랭킹 S11·프로필 S10·알림 S12·검색 S15 등)은 대조하지 못했다. 해당 화면은 스펙의 스텁 범위로만 구현 |
| U2 | 브라우저 자동화의 전환 중간 프레임 측정 | 헤드리스/백그라운드 탭에서 **CSS 트랜지션이 정지**해 `getBoundingClientRect`·`getComputedStyle`이 중간값에서 멈춘다. 전환 검증은 클래스 상태 + `transition-duration/timing-function` 실측으로 대체하고, 스크린샷은 `?rm=1`로 정착시킨 뒤 촬영 |
| U3 | 내 식당 리스트(S5)·프로필 수정·팔로워/팔로잉 목록 | 피그마 `724:9698`에 존재하나 2차 작업 범위에서 제외. 진입 시 안내 토스트 |
| U4 | 랭킹 지역·카테고리 선택 시트 | 피그마 `724:8837`에 존재. 필터 칩은 배치했으나 시트는 미구현 |
| U5 | 댓글 스레드·식당 추가(S18) | 스펙 §6 화면 목록 밖. 진입 시 안내 토스트 |

---

## 4-B. 모션 가이드(`handoff_모션가이드_개발.md`) 대조 결과

가이드와 구현이 어긋난 **10건을 찾아 전부 고쳤다.**

| # | 가이드 명세 | 고치기 전 | 고친 뒤 |
|---|---|---|---|
| 1 | Push/Pop 딤 = `d6 · **standard**` (§2) | 딤에 `emphasized-enter` 적용 | `standard`로 교체 |
| 2 | 엣지 스와이프 임계 초과 시 "남은 거리만 **d4·exit**" (§2) | 정착을 `d5·emphasized-exit`로 처리 | `.anim-settle`(d4·exit) 신설, 타이머도 d4 |
| 3 | 시트 Dismiss = Peek에서 **30%** 하향 (§4) | 40%(0.6배) 임계 | 30%(0.7배)로 교정 |
| 4 | 시트 드래그 **scrim 연동 = 1-(이동량/높이)** (§4) | scrim 없음 | `.sheet-scrim` 추가, 진행률 비례 opacity |
| 5 | 칩 **해제는 d2** (§3) | 선택·해제 모두 d3 | 기본 d2 / `.is-on` d3 |
| 6 | 토스트 **소멸 d2·exit** (§3) | 소멸 d4 | `.is-out`(d2·exit) 추가 |
| 7 | 버튼 loading = 라벨 fade-out d2 → 스피너 fade-in d4, 너비 고정 (§3) | 미구현 | `.btn.is-loading` + `.btn__label`/`.btn__load` |
| 8 | 배너 = 높이 `grid 0fr→1fr` d5·enter + fade delay 80 (§3) | 미구현 | `.banner` 추가 (컴포넌트 데모) |
| 9 | 인풋 **제출 거부 시에만** 그룹 shake ±6 ×2 (§3) | 미구현 | `rejectField()` + `@keyframes hotam-shake` |
| 10 | count-up은 **"이전 점수부터"** (§3) | 항상 0부터 | `Modal.prevScore` 도입(재방문 기록이면 기존 점수부터) |

### reduced-motion 재설계 (가이드 §5 — 가장 큰 수정)

기존 구현은 `d1~d8`을 전부 1ms로 눌러 **모든 모션을 없앴다.** 가이드는 그게 아니라
"**이동·overshoot·count-up·패럴랙스만** 제거하고 페이드·순차·스피너는 유지"를 요구한다.

| 가이드 요구 | 고치기 전 | 고친 뒤 |
|---|---|---|
| Trans1·2 이동 → cross-fade **d4** | d4가 1ms라 페이드가 안 보임 | duration 유지, transform만 제거 |
| Trans3 **순차 페이드 유지** | 즉시 전환 | d2/d4/delay-100 그대로 |
| 스피너 **유지(1200ms 감속)** | 정지 | `--d-spin: 800ms -> 1200ms` |
| overshoot 제거 | duration 축소로 우회 | `--overshoot`/`--emphasized-*`를 `standard`로 치환 |
| 시트·토스트 상승 → 페이드만 | 일부만 | `.toast` `.sheet__seq` `.state__seq` `.reveal__*` `.rec-card--*` transform 제거 |
| `animation:none` 전역 해킹 금지 | 해당 없음 | 유지 (shake 1곳만 국소 비활성) |

`@media (prefers-reduced-motion: reduce)` 블록도 같은 규칙으로 병행 구현했다.

### 그 밖에 반영한 것
- **햅틱**(§4): `navigator.vibrate` 기반 light/success/error. 스냅·임계 도달·점수 공개·제출 거부에만, 100ms 내 중복 병합.
- 일반 버튼 탭·스크롤에는 걸지 않았다(가이드 금지 조항).

---

## 4-C. 피그마 8개 노드 반영 (2차)

정주가 제공한 노드 ID로 접근해 아래 화면을 구현/교체했다.

| 노드 | 영역 | 처리 |
|---|---|---|
| `712:9161` | 진입 | 변수 실측 기준 노드 |
| `712:11830` | 홈/피드 | S7 전면 재구성(1차에서 완료) |
| `718:4325` | 검색/알림 | **S15 통합검색 · S12 알림 신규 구현** (홈 앱바 아이콘에서 진입) |
| `724:7829` | 탐색 | S9 시트 행 · S4 상세 정렬(1차에서 완료) |
| `724:8173` | 기록 | 기록 플로우 4단계(구현 완료) |
| `724:8837` | 랭킹 | **S11 전면 구현** — 미식/식당 랭킹 세그 · 내 순위 카드(4위·상위 1%) · 친구/전체 · 내 행 하이라이트 · 팔로우 버튼 · 식당 랭킹 필터 칩 |
| `724:9698` | 프로필 | **S10 전면 구현** — 아바타+3스탯 · 닉네임/핸들/프로필 수정 · 내 식당 리스트 진입 · 기록/위시 탭 · 3열 그리드(이름+점수 오버레이) |
| `724:11079` | 설정 | **설정 신규 구현** — 계정/알림/이용 안내 3그룹 · 로그아웃·탈퇴 다이얼로그 |

랭킹·프로필은 1차에서 Empty State 스텁이었으나 **본화면으로 교체**했다.

---

## 4-D. 모션 바로가기 바 (신규)

화면 최상단에 **14개 모션을 항목별로 재생하는 버튼 바**를 추가했다. 각 버튼은 해당 모션이
실제로 일어나는 상태까지 앱을 몰고 간 뒤 재생한다(모달·다이얼로그 정리 → 목표 화면 이동 → 재생).

Trans1 Push/Pop · 엣지 스와이프 Pop · Trans2 모달 · Trans3 탭 페이드 · Trans5 루트 교체 ·
시트 스냅 3단 · 미리보기 확장 · 점수 공개 · 스켈레톤 200/300 · 찜 실패 역전 · 다이얼로그 ·
토스트 교체 · 컴포넌트 모션 모음 · 빈 상태 순차 등장

버튼마다 명세(`d6 · emphasized-enter + 딤 ink-12` 등)를 함께 표기해 눈으로 본 것과 문서를 바로 대조할 수 있다.
엣지 스와이프는 실제 PointerEvent를 발생시켜 **수동 조작과 완전히 같은 경로**로 재생된다.
14개 전부 자동 클릭 순회로 에러 0 확인.

---

## 4-E. 3차 — 정주 피드백 9건 반영 (08-19)

| # | 피드백 | 원인 · 처리 |
|---|---|---|
| 1 | Trans1 진입이 동작 안 함 | 전환 엔진은 정상이었고, **피드 카드에서 장소 바만 탭 가능**했던 것이 원인. 카드 전체(사진·본문 포함)를 탭 대상으로 확장(버튼류 제외) |
| 2 | Pop과 엣지 스와이프를 동일하게 | 엣지 정착이 `d4·exit`(가이드 §2 문구), 버튼 Pop이 `d5·emphasized-exit`로 서로 달랐음. **정주 결정으로 둘 다 `d5·emphasized-exit`로 통일** — 가이드 §2 "남은 거리만 d4·exit"와 의도적 상이(결정 로그) |
| 3 | Trans2 상단 짤림·끊김 | 모달이 프레임 전체를 덮어 상태바가 가려졌음. **모달 `top: 48px`**로 상태바(흰색)와 배경 축소가 보이게 수정. 끊김은 viewport 전환에서 `filter` 트랜지션 제거 + `will-change: transform`으로 완화 |
| 4·5 | 인풋 filled 선 두께 | 스타일가이드(165:1453) Text Input 2열 = **잉크 2px**. `is-filled`를 1px→2px(잉크)로 수정, 패딩 1px 보정 |
| 6 | 다이얼로그가 켜지자마자 꺼짐 | 진범 2개: ① `goto()`가 무조건 `Dialog.hide()` 호출 → 210ms 지연 클리어가 **방금 연 다이얼로그를 삭제** ② `show()`마다 delegate 리스너 누적. hide를 "열려 있을 때만 + 타이머 취소 가능"으로 고치고 리스너는 1회 바인딩 |
| 7 | 로그인·홈이 디자인과 다름 | **A0 전면 재구성**: 마스코트 탐이(SVG) 스플래시 + 워드마크(o 위 오렌지 점) + "맛집 하나 알려주면 안 잡아먹지" + 카카오/구글/네이버 버튼 + 이메일 로그인·회원가입 링크. 이메일 로그인은 별도 화면(A0-1)으로 분리. **ON1/ON2도 디자인 정합**: "가보신 가게를 모두 골라주세요" + 하단 건너뛰기 링크, ON2 카드 중앙 + 등급 3버튼 가로 + "모르겠어요" 회색 버튼 + "다음 평가하기 (n/N)" |
| 8 | 미리보기 시트가 목록 시트를 대체해야 | 대체 자체는 되고 있었으나 **미리보기를 닫을 방법이 없었음**. 아래로 드래그(30% or 0.5px/ms) → 미리보기 닫힘 + 목록 시트 Peek 복귀 추가. 탭 재진입 시 미리보기가 떠 있으면 목록 시트를 다시 올리지 않음 |
| 9 | 랭킹 친구↔전체 전환 애니메이션 | 리스트에 Trans3 순차 페이드(d2·exit → 100ms → d4·enter) 적용 |

서드파티 로그인 버튼 색(카카오/네이버/구글)은 캐논 팔레트가 아니므로 `--brand-*` 토큰으로 격리했다.

---

## 5. 스크린샷 목록

`reference/shots/` (390x844, Chrome 헤드리스, `?bare=1&rm=1`)

| 파일 | 화면 |
|---|---|
| `01_login.png` | A0 로그인 |
| `02_onboard1.png` | ON1 온보딩 식당 선택 |
| `03_onboard2.png` | ON2 온보딩 평가 |
| `04_home.png` | S7 홈 피드(추천) |
| `05_home_loading.png` | S7 로딩(스켈레톤) |
| `06_home_empty.png` | S7 빈 상태 |
| `07_home_error.png` | S7 에러 상태 |
| `08_explore.png` | S9 탐색(Peek) |
| `09_explore_empty.png` | S9 빈 상태(Half 자동 승격) |
| `10_detail.png` | S4 식당 상세 |
| `11_record_step1.png` | REC 기록 모달 1단계 |
| `12_rank.png` | S11 랭킹 |
| `13_profile.png` | S10 프로필 |
| `14_search.png` | S15 통합검색 |
| `15_inbox.png` | S12 알림 |
| `16_settings.png` | 설정 |
| `17_components.png` | 컴포넌트 데모 |
| `18_demo_a.png` | 전환 데모 A |

**피그마 원본:** `reference/figma_712-11830.png`(S7 홈) · `figma_724-7829.png`(S9+S4) · `figma_718-4325.png` · `figma_724-8173.png` · `figma_724-8837.png` · `figma_724-9698.png` · `figma_724-11079.png` · `figma_page_712-9161.png` · `figma_home_hi.png`(고해상도)
**크롭:** `reference/crop_home.png` (홈 피드 프레임 단독)
**메타:** `reference/figma_nodes.json` · `reference/figma_vars.json` · `reference/cover.png`

---

## 6. 시각 대조 후 수정한 항목 (STEP 9)

피그마 `crop_home.png` / `figma_724-7829.png`와 나란히 놓고 수정한 것.

| # | 수정 전 | 수정 후 |
|---|---|---|
| 1 | 앱바 "호탐" + inbox 아이콘 | **워드마크 "hotam"** + search·**bell** |
| 2 | 흰 카드 컨테이너 + 그림자 피드 | **컨테이너 없는 피드**(구분선만), 사진 스트립 가로 스크롤 |
| 3 | 사각 점수 배지(면 채움) | **링형 배지**(`r-full` 흰 면 + 등급색 링·숫자) |
| 4 | 찜·공유 2버튼 액션행 | **하트+수 / 댓글+수 (좌)** · share·bookmark·more (우) + **팔로우 버튼** |
| 5 | 식당명이 카드 본문 안 텍스트 | **보더 장소 바**(핀 아이콘 + 이름 + chevron) |
| 6 | 탭 인디케이터 주황 | **잉크(검정)** · 세그 폰트 16/700 |
| 7 | 탭바 아이콘 search·plus | **compass · plus-circle**, 활성 시 **채움 아이콘**(안쪽 도형 파냄) |
| 8 | 상세 점수 3박스(친구/전체/기록) | **친구 평점 · 내 취향 예상 · 전체 평점** 3열 숫자행 |
| 9 | 상세 하단 찜아이콘+CTA 나란히 | **찜/공유 아웃라인 페어** + 하단 단독 주황 CTA |
| 10 | 탐색 시트 행 = 썸네일+이름+점수배지 | **썸네일 64 + 등급칩 + 이름 + "기록 N" + 찜 아이콘** |
| 11 | 빈·에러 상태가 Peek(200)에 잘림 | **Half 자동 승격** + 시트 내 상태 패딩 축소 |
| 12 | 스켈레톤이 카드 실루엣과 불일치 | **카드와 동일한 여백·radius**로 정렬 |
| 13 | `.row__title/.row__meta` 인라인 겹침 | block + ellipsis |
| 14 | 프로필 닉네임·스탯 인라인 겹침 | block |
| 15 | 지도 핀 내부 흰 점이 글리프처럼 보임 | 점 제거, 핀 형태만 |
| 16 | 고기 아이콘이 전구처럼 보임 | 그릴 아이콘으로 교체 |
| 17 | 점수 공개 보조 CTA가 딤 위에서 저대비 | 흰색 라벨 |
| 18 | 미리보기 시트 CTA가 탭바에 잘림 | `.preview` 위치 규칙 제거(`.sheet--tab` 상속) |

---

## 7. 실행 · 배포

**라이브:** https://jeonju-park.github.io/hotam-motion-prototype/
**저장소:** https://github.com/Jeonju-Park/hotam-motion-prototype (public · GitHub Pages, main 브랜치 루트)

> 공개 저장소인 이유: 무료 플랜은 **비공개 저장소에 Pages를 붙일 수 없다.** 정주 확인 후 공개로 전환했다.
> 피그마 원본 보드 캡처(`reference/figma_*.png`, `crop_*.png`, `cover.png`)와 내부 실행 프롬프트는
> `.gitignore`로 **저장소에서 제외**했다. 배포본에는 프로토타입이 직접 렌더한 스크린샷만 들어간다.

```bash
cd 20_work/05_prototype_motion
npx serve .
```

- 진입: `http://localhost:3000/index.html` (또는 `python3 -m http.server 8899`)
- **모션 바로가기 바**(최상단): 14개 모션을 항목별로 재생. 각 버튼에 명세가 함께 적혀 있다
- 개발 바: reduced-motion · 4x 슬로우 · 상태 강제(정상/로딩/빈/에러) · 네트워크 지연 슬라이더(0~1500ms) · 컴포넌트 · 전환 데모 · 초기화
- URL 파라미터: `?state=loading|empty|error` `?delay=0~1500` `?rm=1` `?slow=1` `?bare=1`(개발 바 숨김)
- 해시 라우트: `#login #onboard1 #onboard2 #home #explore #detail #record #rank #profile #components #demoa`

```bash
node verify/verify.mjs                 # 정적 검증 12종
node verify/shots.mjs                  # 전 화면 스크린샷 (서버 켠 상태에서)
node verify/crop.mjs src out x y w h s # PNG 크롭
```

### 모션 확인 요령
4x 슬로우를 켜고 보면 다음이 육안으로 분리된다.
- **Trans1:** 홈 -> 카드 탭 -> 상세. 이전 화면이 -25%로 밀리며 그 위에 ink-12 딤이 덮인다. 좌측 가장자리에서 우로 끌면 1:1로 따라오고 40% 또는 0.5px/ms 넘으면 pop.
- **Trans2:** 탭바 "기록". 모달이 400ms에 올라오고 배경이 0.94로 축소·딤, 탭바는 200ms에 하강.
- **Trans3:** 홈 <-> 탐색. 페이드만 있고 확대·축소나 수평 이동이 없다.
- **점수 공개:** 기록 플로우 끝. 딤 -> 배지 overshoot -> count-up 600ms -> 칩 -> CTA. 중간에 탭하면 즉시 완료.
