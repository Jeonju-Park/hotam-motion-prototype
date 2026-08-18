#!/usr/bin/env node
/* ============================================================
   호탐 프로토타입 — 전 화면 스크린샷 캡처
   Chrome 헤드리스만 사용(추가 설치 없음).
   실행: node verify/shots.mjs [baseUrl]
   기본 baseUrl = http://localhost:8899/index.html
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'reference/shots');
const BASE = process.argv[2] || 'http://localhost:8899/index.html';

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].find((p) => existsSync(p));

if (!CHROME) {
  console.error('헤드리스로 쓸 브라우저를 찾지 못했습니다. 캡처를 건너뜁니다.');
  process.exit(2);
}

/* 캡처 대상: [파일명, 해시, 쿼리] — rm=1 로 전환을 즉시 정착시킨 뒤 촬영 */
const SHOTS = [
  ['01_login', 'login', ''],
  ['02_onboard1', 'onboard1', ''],
  ['03_onboard2', 'onboard2', ''],
  ['04_home', 'home', '&delay=0'],
  ['05_home_loading', 'home', '&state=loading'],
  ['06_home_empty', 'home', '&state=empty&delay=0'],
  ['07_home_error', 'home', '&state=error&delay=0'],
  ['08_explore', 'explore', '&delay=0'],
  ['09_explore_empty', 'explore', '&state=empty&delay=0'],
  ['10_detail', 'detail', '&delay=0'],
  ['11_record_step1', 'record', '&delay=0'],
  ['12_rank', 'rank', ''],
  ['13_profile', 'profile', ''],
  ['14_search', 'search', ''],
  ['15_inbox', 'inbox', ''],
  ['16_settings', 'settings', ''],
  ['17_components', 'components', ''],
  ['18_demo_a', 'demoa', ''],
];

mkdirSync(OUT, { recursive: true });

let ok = 0, fail = 0;
for (const [name, hash, extra] of SHOTS) {
  const url = `${BASE}?bare=1&rm=1${extra}#${hash}`;
  const out = resolve(OUT, `${name}.png`);
  try {
    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      '--window-size=390,844',
      '--virtual-time-budget=4000',
      `--screenshot=${out}`,
      url,
    ], { stdio: 'pipe', timeout: 60000 });
    const kb = Math.round(statSync(out).size / 1024);
    console.log(`OK   ${name}.png  (${kb} KB)  ${url}`);
    ok++;
  } catch (e) {
    console.error(`FAIL ${name}: ${String(e.message).split('\n')[0]}`);
    fail++;
  }
}

console.log(`\n캡처 완료: ${ok} 성공 / ${fail} 실패`);
console.log(`출력: ${OUT}`);
console.log(readdirSync(OUT).join('\n'));
process.exit(fail ? 1 : 0);
