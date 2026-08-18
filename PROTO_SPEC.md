# 호탐 모션 프로토타입 — 통합 명세 (기능명세 + 인터랙션 + 모션)

> v1.0.0 · 2026-08-11 · 작성: 정주+Claude · 상태: final
> 이 문서는 클로드 코드가 프로토타입을 제작할 때 읽는 **단일 소스**입니다. `PROTO_PROMPT.md`의 프롬프트가 이 문서를 참조합니다.

---

## 0. 목적 · 범위 · 기술 규칙

| 항목 | 내용 |
|---|---|
| 목적 | 08-11 확정 모션 시스템(Trans1~5·스냅·로딩)을 실제 조작으로 검증하는 hi-fi 프로토타입 |
| 뷰포트 | **390×844 고정 프레임**(피그마 기준). 데스크톱 브라우저에서 중앙 프레임으로 표시 |
| 스택 | 순수 HTML/CSS/JS **단일 index.html**(해시 라우팅). 빌드 도구·프레임워크·외부 라이브러리 금지(폰트 Pretendard CDN만 허용) |
| 데이터 | 전부 더미(`data.js`). 서버·저장 없음. 새로고침 시 초기화 허용 |
| 작동 기준 | 실제 기능 아님 — **모든 화면·전환·상태가 눈으로 확인 가능**하면 됨 |

## 1. 디자인 소스 규칙 (절대 규칙)

1. **피그마가 유일한 시각 기준.** fileKey `BXMdfHOhPcmpD5W874jeOS`(**호탐 UI2**) — 최종 디자인 페이지 + 스타일가이드 페이지. 노드 ID는 고정하지 않으며 `PROTO_PROMPT.md` STEP 0의 탐색 절차로 찾는다(실행 전 피그마 데스크톱에 이 파일을 열어둘 것).
   - `get_screenshot`(고해상도)으로 디자인 페이지 전체를 받아 `reference/`에 저장하고, 화면별로 크롭해 참조한다.
   - `get_variable_defs`로 토큰 값을 실측 확인한다(아래 §2와 대조, 다르면 **피그마 우선**). 스타일가이드 페이지에서도 호출해 보강.
2. **아이콘: 이모지·이모티콘 절대 금지.** 피그마에서 형태를 확인하고 **인라인 SVG로 직접 제작**(24×24 박스, stroke 1.5~2, `currentColor`). 피그마 확인 불가 시 동일 스타일로 단순 제작.
3. **사진류**(식당 썸네일·히어로): 피그마 스크린샷에서 크롭 사용 가능. 불가하면 `bg/surface` 회색 플레이스홀더 + 카테고리 SVG 아이콘. **외부 이미지 URL 금지.**
4. **색·간격·radius·타이포는 토큰 변수로만.** hex·px 하드코딩 금지(§2의 CSS 변수 경유).
5. 지도: 실지도 SDK 금지. 피그마 탐색 화면의 지도 영역을 크롭해 배경 이미지로 쓰거나, 불가 시 연회색 도로 그리드 목업. 핀은 절대좌표 더미 8~10개.

## 2. 토큰 (tokens.css로 생성)

### 컬러 (semantic — 08-11 캐논 반영)

```css
:root{
  --bg-default:#FFFFFF; --bg-surface:#F0F4F5; --bg-disabled:#E3E8EA;
  --text-primary:#0E0E0E; --text-secondary:#535C60; --text-tertiary:#6C767B;
  --text-disabled:#8A959A; --text-on-button:#FFFFFF; --text-brand:#A94F00;
  --border-default:#E3E8EA; --border-focus:#FE7902; --border-filled:#0E0E0E;
  --main-primary:#FE7902; --main-primary-pressed:#D66500; --main-primary-bg:#FFF4EA;
  --status-danger:#E5484D; --status-danger-bg:#FDE8E7;
  --status-success:#1FA75C; --status-success-bg:#E1F5E8;
  --status-info:#2E7DE0; --status-info-bg:#E4F0FD;
  --grade-good:#FE7902; --grade-good-bg:#FFE5CF;
  --grade-soso:#35704F; --grade-soso-bg:#E4EDE5;
  --grade-bad:#E5484D;  --grade-bad-bg:#FDE8E7;   /* 08-11 캐논: 별로=red */
  --overlay-scrim:rgba(14,14,14,.6);
  --alpha-ink-8:rgba(14,14,14,.08); --alpha-ink-12:rgba(14,14,14,.12);
  --alpha-ink-85:rgba(14,14,14,.85);
  --sp-xxs:4px; --sp-xs:8px; --sp-sm:12px; --sp-md:16px; --sp-page:20px;
  --sp-lg:24px; --sp-xl:32px; --sp-xxl:48px;
  --r-sm:4px; --r-md:8px; --r-lg:12px;
  --icon-sm:20px; --icon-md:24px; --op-disabled:.4;
}
```

### 모션 — 피그마 구현 가능 토큰만 (duration 8 + easing 7)

```css
:root{
  --d1:50ms; --d2:100ms; --d3:150ms; --d4:200ms;
  --d5:250ms; --d6:300ms; --d7:400ms; --d8:600ms;
  --linear:cubic-bezier(0,0,1,1);
  --standard:cubic-bezier(.35,0,.35,1);
  --enter:cubic-bezier(0,0,.15,1);
  --exit:cubic-bezier(.35,0,1,1);
  --emphasized-enter:cubic-bezier(.03,.4,.1,1);
  --emphasized-exit:cubic-bezier(.35,0,.95,.55);
  --overshoot:cubic-bezier(.34,1.29,.35,.98);
}
```

> 명세 표기는 항상 `d6 · enter` 형식(duration 토큰 + easing 토큰)으로 쓴다. 별칭 변수를 새로 만들지 않는다.

## 3. 화면 전환 — Trans 시스템 (08-11 튜닝 반영)

| 이름 | 용도 | 명세 |
|---|---|---|
| **Trans1-Push** | 계층 진입(리스트→상세 등) | 새 화면 X `100%→0` (d6·emphasized-enter) · 이전 화면 X `0→-25%` · **이전 화면 위 딤 레이어 `alpha/ink-12` opacity `0→1`** (동일 d6) |
| **Trans1-Pop** | 뒤로가기 | 현재 화면 X `0→100%` (d5·emphasized-exit) · 이전 화면 `-25%→0` · 딤 `1→0` (동일 d5). **엣지 스와이프(좌 20px)** = 동일 값 1:1 추종, 임계 40% or 0.5px/ms |
| **Trans2-Modal** | 흐름 이탈(기록 플로우) | 모달 Y `100%→0` (**d7·enter** — 400ms) · 배경 scale `→.94` + radius 12 + 딤 · 탭바 하강(d4·exit). 닫기: Y `0→100%` (d5·exit), 탭바 delay 60 복귀 |
| **Trans3-TabFade** | 탭 간 이동 | 이전 opacity `1→0` (d2·exit) → **100ms 뒤** 새 opacity `0→1` (d4·enter). **scale 없음.** 동시 페이드·수평 슬라이드 금지 |
| **Trans5-Root** | 로그인→홈 | 페이드 교체(d4·standard) · 탭바 delay 80 상승 · 방향 금지 |
| **Celebrate** | 점수 공개·기록 완료만 | d8·overshoot — 이 두 곳 외 사용 금지 |

공통: 전환 중 300ms 입력 잠금 · 퇴장은 등장보다 짧게 · 탭별 스크롤 위치 독립 보존 · 현재 탭 재탭 = 최상단 스크롤.

## 4. 컴포넌트 모션 규칙 (08-11 튜닝)

| 컴포넌트 | 규칙 |
|---|---|
| **버튼(전체)** | pressed = **배경색 전환만**(press d3·enter / release d2·exit). **scale 전면 금지**(하단 탭 아이콘 포함) |
| 칩 | 선택 = 색 전환(d3·standard) + 체크 등장(d3·overshoot). 상한 초과 = 미선택 흐려짐+Toast |
| **찜(하트/북마크)** | 낙관적 토글: 아이콘 색·채움 즉시(d3·standard) + Toast. **실패 = 역전+Toast만, shake 금지** |
| 토스트 | y +8→0 + fade (d4·enter), 2초(액션 4초), 스택 금지 교체 |
| 다이얼로그 | scale .94→1 + fade (d5·enter) / 닫기 d3·exit, scrim은 50ms 늦게 소멸 |
| 시트 | 등장 Y 100%→0 (d6·enter), 내용물 120/160/200ms 순차 fade · 퇴장 d4·exit |
| 스켈레톤 | opacity 1↔0.5 pulse 1200ms(shimmer 금지) |
| 스피너 | 800ms linear 무한 |
| 점수 공개 | 딤(d4) → 배지 scale .6→1(d8·overshoot, delay 80) → count-up 600ms linear(이전 점수부터) → 칩·CTA 순차. 탭 시 스킵 |

## 5. 탐색 — 시트·제스처 (08-11 튜닝)

| 항목 | 값 |
|---|---|
| 스냅 3단 | **Peek 200px / Half 50vh / Full 95vh** |
| 진입 기본 | Peek(그러버+`내 위치 중심` 헤더+첫 카드) |
| 그러버 | **32×4**, radius 4, 터치 영역은 상단 40px 전체 |
| 드래그 | 1:1 추종 · 위 초과분 0.3배 저항 · 판정 속도 0.5px/ms or 최근접 · 스냅 d5·enter |
| **Full 도달** | 검색바 fade-out 100ms, 이탈 즉시 복귀 |
| Dismiss | Peek에서 더 내리면 닫힘. 재등장은 ①탐색 탭 재진입 ②이 지역 재검색뿐 |
| 핀 탭 | 식당 미리보기 시트(고정 높이): 카테고리·지역/식당명/주소/지표 3종/찜·공유/방문 기록하기 CTA. **위로 드래그(높이 40% or 0.5px/ms) → 상세로 확장 전환**, 미달 시 복귀. 상세에서 뒤로 = 미리보기 상태 복원 |
| 이 지역 재검색 | 지도 이동(뷰포트 1/3) 시 pill 노출 → 탭 시 목록 갱신+시트 Peek 재등장. Half 이상에서 pill 숨김 |

## 6. 화면 목록 (전부 구현, 더미 데이터)

| # | 화면 | 핵심 요소 · 상태 |
|---|---|---|
| A0 | 로그인 | 이메일/비번 인풋(focus 2px 주황·filled 1px 검정), 소셜 버튼, CTA disabled→활성. 로그인 탭 → Trans5로 홈 |
| ON1 | 온보딩-식당 선택 | 스텝바, 검색(로컬 필터), 리스트+원형 체크, CTA `{n}곳 평가하기`(0=disabled), 건너뛰기 |
| ON2 | 온보딩-식당 평가 | 카드, 3버튼(soft→solid, 라디오), 모르겠어요=즉시 다음, CTA `(n/N)`, 마지막=`평가 완료하기` |
| S7 | 홈 피드 | 탭(추천/팔로잉, Trans3), 피드 카드 3+, **스켈레톤 200ms 지연+최소 300ms**, 찜 낙관적, 카드 탭→상세(Trans1) |
| S9 | 탐색 | §5 전체. 지도 목업+핀 8개+클러스터 1개, 시트 3단, 미리보기, 재검색, 현위치 버튼 |
| S4 | 식당 상세 | 히어로 사진(패럴랙스 0.4·앱바 진행률 연동 40px 구간), 점수 3종, 친구 기록 3행(배지: 9.5 good/5.5 soso/1.2 bad), 방문 기록하기 |
| REC | 기록 플로우(Trans2 모달) | ①식당 검색·선택 ②수준 택1(좋았어요/그저그래요/별로였어요 — soft→solid) ③비교 A vs B(카드 상하 진입, 모르겠어요) ④점수 공개(Celebrate) → 닫힘, 홈 최상단 새 기록 삽입(delay 200) |
| S11/S12 | 랭킹·프로필 | 스텁: 앱바+Empty State(순차 등장)만 |
| 공통 | 탭바 5(홈·탐색·기록·랭킹·프로필) | 기록=모달 진입(전환 아님). 활성 주황. 키보드 시 숨김은 생략 가능 |

더미 데이터: 식당 10곳(이름·카테고리·지역·거리·기록수·점수·등급), 사용자 기록 3, 친구 기록 3. `data.js` 한 곳에.

## 7. 전역 규칙

- 상태 4종: 홈·탐색 시트는 로딩/빈/에러 전환 데모 가능하게(개발 바 버튼 또는 URL 파라미터 `?state=empty` 등)
- **reduced-motion 토글**(프레임 상단 개발 바): ON 시 이동→페이드 치환, count-up 즉시, 패럴랙스 off
- 어휘: 선택형 `좋았어요/그저그래요/별로였어요` · 표시형 `좋음/그저/별로` — 혼용 금지
- 등급색: 좋음 orange / 그저 forest / **별로 red**
- 콘솔 에러·경고 0

## 8. 완료 기준 (DoD)

1. §6 화면 전부 이동 가능(끊긴 링크 0)
2. Trans1(딤 포함)·Pop(엣지 제스처)·Trans2(400ms)·Trans3(무scale) 육안 확인
3. 시트 200/50vh/95vh 스냅 + Full 검색바 숨김 + dismiss 규칙
4. 미리보기→상세 확장 전환 + 복귀 시 상태 복원
5. 점수 공개 타임라인 + 탭 스킵
6. 스켈레톤 200ms 정책 데모(개발 바에서 지연 슬라이더)
7. 버튼 scale 0건 · 이모지 0건 · hex 하드코딩 0건(tokens.css 제외) — 코드 검색으로 증명
8. 콘솔 에러 0 · reduced-motion 토글 동작
