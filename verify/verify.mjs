#!/usr/bin/env node
/* ============================================================
   호탐 모션 프로토타입 — 검증 스크립트
   실행: node verify/verify.mjs   (프로젝트 루트에서)
   종료코드: 0 = 통과, 1 = 실패
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warns = [];
const passes = [];

const err = (rule, msg) => errors.push({ rule, msg });
const warn = (rule, msg) => warns.push({ rule, msg });
const ok = (rule, msg) => passes.push({ rule, msg });

const rd = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const has = (p) => existsSync(resolve(ROOT, p));

/* 파일에서 줄번호 계산 */
function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

/* CSS 주석 제거 */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/* JS 주석 제거(대략) */
function stripJsComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/* 최내곽 CSS 블록 { selector, body, index } 추출 */
function cssBlocks(src) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const sel = m[1].split(/[{}]/).pop().trim();
    if (sel.startsWith('@')) continue;
    out.push({ sel, body: m[2], index: m.index });
  }
  return out;
}

/* ---------------------------------------------------------- */
/* 1. 필수 파일 존재                                            */
/* ---------------------------------------------------------- */
const REQUIRED_FILES = ['index.html', 'tokens.css', 'app.css', 'app.js', 'data.js'];
const REQUIRED_REF = ['reference/figma_nodes.json', 'reference/figma_vars.json'];

for (const f of [...REQUIRED_FILES, ...REQUIRED_REF]) {
  if (!has(f)) err('files', `필수 파일 없음: ${f}`);
}
if (!errors.length) ok('files', `필수 파일 ${REQUIRED_FILES.length + REQUIRED_REF.length}개 존재`);

const SRC_FILES = REQUIRED_FILES.filter(has);
const src = Object.fromEntries(SRC_FILES.map((f) => [f, rd(f)]));

/* ---------------------------------------------------------- */
/* 2. JS 문법 검사                                              */
/* ---------------------------------------------------------- */
for (const f of ['app.js', 'data.js'].filter(has)) {
  try {
    execFileSync(process.execPath, ['--check', resolve(ROOT, f)], { stdio: 'pipe' });
    ok('syntax', `${f} 문법 OK`);
  } catch (e) {
    err('syntax', `${f} 문법 오류:\n${String(e.stderr || e.message).trim().split('\n').slice(0, 6).join('\n')}`);
  }
}

/* ---------------------------------------------------------- */
/* 3. 이모지·픽토그램 금지                                       */
/* ---------------------------------------------------------- */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2900}-\u{297F}\u{22EF}\u{00A9}\u{00AE}\u{2122}\u{3297}\u{3299}]/u;
let emojiHits = 0;
for (const f of SRC_FILES) {
  const lines = src[f].split('\n');
  lines.forEach((ln, i) => {
    const m = ln.match(EMOJI);
    if (m) {
      emojiHits++;
      err('emoji', `${f}:${i + 1} 이모지/픽토그램 문자 "${m[0]}" (U+${m[0].codePointAt(0).toString(16).toUpperCase()}) — 인라인 SVG로 대체`);
    }
  });
}
if (!emojiHits) ok('emoji', '이모지 0건');

/* ---------------------------------------------------------- */
/* 4. 색 하드코딩 금지 (tokens.css 제외)                          */
/* ---------------------------------------------------------- */
const HEX = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b/g;
const FUNC_COLOR = /\b(rgba?|hsla?|color-mix|oklch|lab)\s*\(/g;
let colorHits = 0;
for (const f of SRC_FILES.filter((f) => f !== 'tokens.css')) {
  const body = f.endsWith('.css') ? stripCssComments(src[f]) : src[f];
  let m;
  HEX.lastIndex = 0;
  while ((m = HEX.exec(body))) {
    // href="#abc" 같은 앵커 오탐 제외: 따옴표 바로 앞에 오는 # 은 앵커
    const before = body.slice(Math.max(0, m.index - 12), m.index);
    if (/(href|url|xlink:href)\s*=\s*["']$/.test(before)) continue;
    colorHits++;
    err('color', `${f}:${lineOf(body, m.index)} hex 하드코딩 "${m[0]}" — tokens.css 변수 사용`);
  }
  FUNC_COLOR.lastIndex = 0;
  while ((m = FUNC_COLOR.exec(body))) {
    colorHits++;
    err('color', `${f}:${lineOf(body, m.index)} 색 함수 하드코딩 "${m[1]}(" — tokens.css 변수 사용`);
  }
}
if (!colorHits) ok('color', 'tokens.css 외 색 하드코딩 0건');

/* ---------------------------------------------------------- */
/* 5. 시간·easing 하드코딩 금지 (tokens.css 제외)                 */
/* ---------------------------------------------------------- */
let timeHits = 0;
for (const f of SRC_FILES.filter((f) => f !== 'tokens.css' && f.endsWith('.css'))) {
  const body = stripCssComments(src[f]);
  if (/cubic-bezier\s*\(/.test(body)) {
    const i = body.search(/cubic-bezier\s*\(/);
    timeHits++;
    err('motion', `${f}:${lineOf(body, i)} easing 하드코딩(cubic-bezier) — tokens.css 변수 사용`);
  }
  const declRe = /(transition|animation)(-duration|-delay)?\s*:\s*([^;{}]+)/g;
  let m;
  while ((m = declRe.exec(body))) {
    const val = m[3].replace(/var\([^)]*\)/g, ' ');
    const t = val.match(/(?<![\w.-])\d+(\.\d+)?\s*(ms|s)\b/);
    if (t) {
      timeHits++;
      err('motion', `${f}:${lineOf(body, m.index)} 시간 하드코딩 "${t[0]}" in ${m[1]} — tokens.css 변수 사용`);
    }
  }
}
for (const f of ['app.js', 'data.js'].filter(has)) {
  const body = stripJsComments(src[f]);
  if (/cubic-bezier\s*\(/.test(body)) {
    timeHits++;
    err('motion', `${f} easing 하드코딩(cubic-bezier) — CSS 변수를 읽어 쓸 것`);
  }
  const toRe = /\b(setTimeout|setInterval)\s*\(\s*(?:[^,()]|\([^()]*\))*?,\s*(-?\d+(?:\.\d+)?)\s*[,)]/g;
  let m;
  while ((m = toRe.exec(body))) {
    const v = Number(m[2]);
    if (v !== 0) {
      timeHits++;
      err('motion', `${f}:${lineOf(body, m.index)} ${m[1]} 지연 리터럴 ${v} — T.* (tokens.css 파생 상수) 사용`);
    }
  }
}
if (!timeHits) ok('motion', '시간·easing 하드코딩 0건');

/* ---------------------------------------------------------- */
/* 6. !important 금지                                           */
/* ---------------------------------------------------------- */
let bangHits = 0;
for (const f of SRC_FILES) {
  const body = f.endsWith('.css') ? stripCssComments(src[f]) : src[f];
  const re = /!\s*important/g;
  let m;
  while ((m = re.exec(body))) {
    bangHits++;
    err('important', `${f}:${lineOf(body, m.index)} !important 사용 금지 — 특이도로 해결`);
  }
}
if (!bangHits) ok('important', '!important 0건');

/* ---------------------------------------------------------- */
/* 7. 버튼 scale 금지                                           */
/* ---------------------------------------------------------- */
const BTN_SEL = /(^|[\s,>+~])(button|\.btn[\w-]*|\.tab-item|\.tabbar[\w-]*|\.chip[\w-]*|\.icon-btn)\b/;
let scaleHits = 0;
const scaleSelectors = [];
for (const f of SRC_FILES.filter((f) => f.endsWith('.css'))) {
  for (const b of cssBlocks(stripCssComments(src[f]))) {
    if (!/\bscale\s*\(|\bscale\s*:/.test(b.body)) continue;
    scaleSelectors.push(`${f}:${lineOf(src[f], b.index)} ${b.sel}`);
    if (BTN_SEL.test(b.sel)) {
      scaleHits++;
      err('btn-scale', `${f}:${lineOf(src[f], b.index)} 버튼 계열 셀렉터에 scale 사용 — "${b.sel}"`);
    }
  }
}
if (!scaleHits) ok('btn-scale', `버튼 scale 0건 (전체 scale 사용 ${scaleSelectors.length}곳: 전환·시트·배지 전용)`);
if (scaleSelectors.length) warn('btn-scale', `scale 사용 위치 점검:\n    ${scaleSelectors.join('\n    ')}`);

/* ---------------------------------------------------------- */
/* 8. index.html 필수 앵커                                       */
/* ---------------------------------------------------------- */
const REQUIRED_ANCHORS = [
  'login', 'onboard1', 'onboard2', 'home', 'explore',
  'detail', 'record', 'rank', 'profile', 'components',
];
if (has('index.html')) {
  const html = src['index.html'];
  const missing = REQUIRED_ANCHORS.filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
  if (missing.length) err('anchors', `index.html 필수 화면 앵커 누락: ${missing.map((x) => '#' + x).join(', ')}`);
  else ok('anchors', `필수 화면 앵커 ${REQUIRED_ANCHORS.length}개 존재`);

  for (const need of ['tokens.css', 'app.css', 'app.js', 'data.js']) {
    if (!html.includes(need)) err('anchors', `index.html이 ${need}를 로드하지 않음`);
  }
  if (/<script[^>]+src=["']https?:/i.test(html)) err('cdn', 'index.html에 외부 스크립트 CDN 사용 금지');
  const links = [...html.matchAll(/<link[^>]+href=["'](https?:[^"']+)["']/gi)].map((m) => m[1]);
  for (const l of links) {
    if (!/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard/.test(l)) {
      err('cdn', `허용되지 않은 외부 리소스: ${l} (Pretendard 폰트 CDN만 예외)`);
    }
  }
}

/* ---------------------------------------------------------- */
/* 9. tokens.css 필수 토큰                                       */
/* ---------------------------------------------------------- */
const REQUIRED_TOKENS = [
  '--bg-default', '--bg-surface', '--bg-disabled',
  '--text-primary', '--text-secondary', '--text-tertiary', '--text-disabled',
  '--text-brand', '--text-on-button',
  '--border-default', '--border-focus', '--border-filled',
  '--main-primary', '--main-primary-pressed', '--main-primary-bg',
  '--status-danger', '--status-success', '--status-info',
  '--grade-good', '--grade-soso', '--grade-bad',
  '--grade-good-bg', '--grade-soso-bg', '--grade-bad-bg',
  '--overlay-scrim', '--alpha-ink-8', '--alpha-ink-12',
  '--sp-xxs', '--sp-xs', '--sp-sm', '--sp-md', '--sp-page', '--sp-lg', '--sp-xl', '--sp-xxl',
  '--r-sm', '--r-md', '--r-lg', '--icon-sm', '--icon-md', '--op-disabled',
  '--d1', '--d2', '--d3', '--d4', '--d5', '--d6', '--d7', '--d8',
  '--linear', '--standard', '--enter', '--exit',
  '--emphasized-enter', '--emphasized-exit', '--overshoot',
  '--sheet-peek', '--push-offset', '--modal-bg-scale',
];
if (has('tokens.css')) {
  const t = src['tokens.css'];
  const missing = REQUIRED_TOKENS.filter((k) => !new RegExp(`${k}\\s*:`).test(t));
  if (missing.length) err('tokens', `tokens.css 토큰 누락: ${missing.join(', ')}`);
  else ok('tokens', `필수 토큰 ${REQUIRED_TOKENS.length}개 정의됨`);

  if (!/html\[data-rm="1"\]/.test(t)) err('tokens', 'tokens.css에 reduced-motion 토큰 오버라이드 없음');
}

/* ---------------------------------------------------------- */
/* 10. radius/pill 캐논 (app.css)                                */
/* ---------------------------------------------------------- */
if (has('app.css')) {
  const body = stripCssComments(src['app.css']);
  const re = /border-radius\s*:\s*([^;}]+)/g;
  let m;
  const bad = [];
  while ((m = re.exec(body))) {
    const v = m[1].trim();
    if (/^var\(/.test(v) || /^(50%|inherit|0)$/.test(v)) continue;
    const px = v.match(/(\d+)px/);
    if (px && Number(px[1]) > 12) bad.push(`${lineOf(body, m.index)}: ${v}`);
    else if (!px && !/var\(/.test(v)) bad.push(`${lineOf(body, m.index)}: ${v}`);
  }
  if (bad.length) err('radius', `app.css radius 토큰 미경유/12 초과:\n    ${bad.join('\n    ')}`);
  else ok('radius', 'radius 토큰 경유 · pill 없음');
}

/* ---------------------------------------------------------- */
/* 11. 외부 라이브러리 금지                                       */
/* ---------------------------------------------------------- */
for (const f of ['app.js', 'data.js'].filter(has)) {
  if (/\b(require\s*\(|from\s+["']https?:|import\s*\(\s*["']https?:)/.test(stripJsComments(src[f]))) {
    err('cdn', `${f}에 외부 모듈 로드 흔적`);
  }
}
ok('cdn', '외부 라이브러리·CDN 없음(Pretendard 폰트 제외)');

/* ---------------------------------------------------------- */
/* 출력                                                         */
/* ---------------------------------------------------------- */
const B = (s) => `[1m${s}[0m`;
const G = (s) => `[32m${s}[0m`;
const R = (s) => `[31m${s}[0m`;
const Y = (s) => `[33m${s}[0m`;

console.log(B('\n호탐 프로토타입 검증 — ') + relative(process.cwd(), ROOT || '.'));
console.log('-'.repeat(60));
for (const p of passes) console.log(`${G('PASS')} [${p.rule}] ${p.msg}`);
for (const w of warns) console.log(`${Y('WARN')} [${w.rule}] ${w.msg}`);
for (const e of errors) console.log(`${R('FAIL')} [${e.rule}] ${e.msg}`);
console.log('-'.repeat(60));
console.log(`${passes.length} pass · ${warns.length} warn · ${errors.length} fail\n`);
process.exit(errors.length ? 1 : 0);
