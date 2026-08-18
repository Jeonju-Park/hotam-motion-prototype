#!/usr/bin/env node
/* ============================================================
   PNG 크롭 유틸 — 외부 라이브러리 없이 Chrome 헤드리스로 처리
   실행: node verify/crop.mjs <src.png> <out.png> <x> <y> <w> <h> [scale]
   좌표는 원본 픽셀 기준. scale 기본 1.
   ============================================================ */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find((p) => existsSync(p));
if (!CHROME) { console.error('브라우저 없음'); process.exit(2); }

export function crop(src, out, x, y, w, h, scale = 1) {
  const tmpDir = resolve(ROOT, '.croptmp');
  mkdirSync(tmpDir, { recursive: true });
  const html = resolve(tmpDir, 'crop_' + basename(out) + '.html');
  writeFileSync(html, `<!doctype html><meta charset="utf-8">
<style>
html,body{margin:0;padding:0;background:#fff;overflow:hidden}
#w{position:relative;width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px;overflow:hidden}
#w img{position:absolute;left:${-Math.round(x * scale)}px;top:${-Math.round(y * scale)}px;
       width:auto;transform-origin:0 0;transform:scale(${scale});image-rendering:auto}
</style><div id="w"><img src="${pathToFileURL(resolve(src)).href}"></div>`);

  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--window-size=${Math.round(w * scale)},${Math.round(h * scale)}`,
    '--virtual-time-budget=3000',
    `--screenshot=${resolve(out)}`,
    pathToFileURL(html).href,
  ], { stdio: 'pipe', timeout: 60000 });
  rmSync(html, { force: true });
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [src, out, x, y, w, h, s] = process.argv.slice(2);
  if (!src || !out) {
    console.error('사용법: node verify/crop.mjs <src.png> <out.png> <x> <y> <w> <h> [scale]');
    process.exit(1);
  }
  crop(src, out, +x, +y, +w, +h, s ? +s : 1);
  console.log('크롭 완료:', out);
}
