# 호탐(hotam) — 모션 프로토타입

미식 비교랭킹 소셜 앱 **호탐**의 인터랙션·모션 검증용 hi-fi 프로토타입.
순수 HTML/CSS/JS 단일 페이지. 빌드 도구·프레임워크·외부 라이브러리 없음(Pretendard 폰트 CDN만 예외).

## 실행

```bash
npx serve .
# 또는
python3 -m http.server 8899
```

## 화면 상단 도구

| 영역 | 내용 |
|---|---|
| **모션 바로가기** | 14개 모션을 항목별로 재생. 각 버튼은 해당 모션이 실제로 일어나는 상태까지 앱을 몰고 간 뒤 재생한다 |
| **개발 바** | reduced-motion · 4x 슬로우 · 상태 강제(정상/로딩/빈/에러) · 네트워크 지연(0~1500ms) · 컴포넌트 · 전환 데모 · 초기화 |

URL 파라미터: `?state=loading|empty|error` `?delay=0~1500` `?rm=1` `?slow=1` `?bare=1`

## 라우트

`#login` `#onboard1` `#onboard2` `#home` `#explore` `#detail` `#record` `#rank` `#profile`
`#search` `#inbox` `#settings` `#components` `#demoa`

## 모션 시스템

`handoff_모션가이드_개발.md` v1.0.0 준거. duration 8종(d1~d8) + easing 7종만 사용하며
색·간격·시간·easing은 전부 `tokens.css` 변수를 경유한다(하드코딩 0건, 검증 스크립트가 강제).

- **Trans1-Push/Pop** d6·emphasized-enter + 딤 ink-12 / 엣지 스와이프 1:1 추종(임계 40% 또는 0.5px/ms, 정착 d4·exit)
- **Trans2-Modal** d7·enter 400ms · 배경 scale .94 + radius 12 + 딤 · 탭바 d4·exit
- **Trans3-TabFade** d2·exit → 100ms → d4·enter · **scale 없음**
- **Trans5-Root** d4·standard · 탭바 delay 80 상승
- **시트** Peek 200px / Half 50vh / Full 95vh · 저항 0.3 · 속도 판정 0.5px/ms · scrim 진행률 연동
- **점수 공개** 딤 d4 → 배지 d8·overshoot(delay 80) → count-up 600ms linear(이전 점수부터) → 칩·CTA

## 검증

```bash
node verify/verify.mjs   # 정적 검증 12종 (이모지·hex·시간·easing 하드코딩, 버튼 scale, radius, CDN 등)
node verify/shots.mjs    # 전 화면 스크린샷 (서버 실행 중일 때)
```

## 구조

```
index.html    단일 진입점 (390x844 프레임 + 모션 바로가기 + 개발 바)
tokens.css    디자인 토큰 (피그마 Variables 실측 기준)
app.css       화면·컴포넌트 스타일
app.js        라우터 · 전환 엔진 · 컴포넌트 · 화면
data.js       더미 데이터
verify/       검증·캡처·크롭 스크립트
reference/    화면별 스크린샷 + 피그마 토큰 메타
```

자세한 내용은 `QA_REPORT.md` 참고.
