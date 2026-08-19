/* ============================================================
   호탐 모션 프로토타입 — app.js
   라우터 · 전환 엔진 · 컴포넌트 · 화면
   시간 값은 전부 tokens.css 에서 읽어온다(T.*). 하드코딩 없음.
   ============================================================ */
(function () {
  'use strict';

  var D = window.HOTAM_DATA;
  var root = document.documentElement;
  var frame = document.getElementById('frame');
  var viewport = document.getElementById('viewport');
  var tabbar = document.getElementById('tabbar');
  var toastLayer = document.getElementById('toastLayer');
  var dialogLayer = document.getElementById('dialogLayer');
  var recordEl = document.getElementById('record');

  /* ==========================================================
     0. 토큰에서 시간 읽기
     ========================================================== */
  function readTime(name) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    if (!v) return 0;
    if (v.slice(-2) === 'ms') return parseFloat(v);
    if (v.slice(-1) === 's') return parseFloat(v) * 1000;
    return parseFloat(v) || 0;
  }
  function readPx(name) {
    return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  }
  function readNum(name) {
    return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  }
  var T = {};
  ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'].forEach(function (k) {
    Object.defineProperty(T, k, { get: function () { return readTime('--' + k); } });
  });
  [60, 80, 100, 120, 160, 200].forEach(function (n) {
    Object.defineProperty(T, 'dl' + n, { get: function () { return readTime('--dl-' + n); } });
  });
  Object.defineProperty(T, 'lock', { get: function () { return Math.max(readTime('--d6'), 0); } });

  function after(ms, fn) { return setTimeout(fn, ms); }
  function raf(fn) { return requestAnimationFrame(fn); }
  /* 마운트 직후 1회 트리거. rAF가 멈춘 탭(백그라운드·헤드리스)에서도
     반드시 실행되도록 타이머 폴백을 함께 건다. */
  function nextFrame(fn) {
    var done = false;
    function run() { if (done) return; done = true; fn(); }
    requestAnimationFrame(function () { requestAnimationFrame(run); });
    after(readTime('--d1'), run);
  }
  function reflow(el) { return el.offsetHeight; }
  function isRM() { return root.getAttribute('data-rm') === '1'; }

  /* ==========================================================
     1. 아이콘 (인라인 SVG · 24 box · currentColor)
     ========================================================== */
  var P = {
    home: '<path d="M4 10.6 12 4l8 6.6V19a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v1.5A3.5 3.5 0 0 0 8.5 10M16 5h3v1.5A3.5 3.5 0 0 1 15.5 10"/><path d="M12 13v4M9 20h6"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.8 4.2-5.7 7.5-5.7s6.1 1.9 7.5 5.7"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M5 9l7 7 7-7"/>',
    up: '<path d="M5 15l7-7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M5 12.5 9.5 17 19 7"/>',
    bookmark: '<path d="M6.5 4h11v16.5l-5.5-3.6-5.5 3.6z"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M15.7 6.8 8.3 10.7M8.3 13.3l7.4 3.9"/>',
    pin: '<path d="M12 21s6.5-5.8 6.5-10A6.5 6.5 0 1 0 5.5 11c0 4.2 6.5 10 6.5 10z"/><circle cx="12" cy="11" r="2.4"/>',
    locate: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.6"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2"/>',
    alert: '<circle cx="12" cy="12" r="8.2"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.4"/><path d="M4 17.5 9 13l3.5 2.8L16 13l4 4"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M20 4v4.5h-4.5"/>',
    more: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.8-1.4-1.8-3.1-2.1.8a7.6 7.6 0 0 0-1.8-1L15.2 4h-3.6l-.3 2.3a7.6 7.6 0 0 0-1.8 1l-2.1-.8-1.8 3.1L7.4 11a7.6 7.6 0 0 0 0 2l-1.8 1.4 1.8 3.1 2.1-.8a7.6 7.6 0 0 0 1.8 1l.3 2.3h3.6l.3-2.3a7.6 7.6 0 0 0 1.8-1l2.1.8 1.8-3.1z"/>',
    bell: '<path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 3.9 1.6 5.3 1.6 5.3H5s1.6-1.4 1.6-5.3z"/><path d="M10.1 18.8a2.1 2.1 0 0 0 3.8 0"/>',
    compass: '<circle cx="12" cy="12" r="8.4"/><path d="M15.4 8.6 13.7 13.7 8.6 15.4l1.7-5.1z"/>',
    pluscircle: '<circle cx="12" cy="12" r="8.4"/><path d="M12 8.6v6.8M8.6 12h6.8"/>',
    heart: '<path d="M12 20.1S4.7 15.6 4.7 10.6A4.05 4.05 0 0 1 12 7.7a4.05 4.05 0 0 1 7.3 2.9c0 5-7.3 9.5-7.3 9.5z"/>',
    comment: '<path d="M4.6 6.2a1.5 1.5 0 0 1 1.5-1.5h11.8a1.5 1.5 0 0 1 1.5 1.5v7.6a1.5 1.5 0 0 1-1.5 1.5h-7.3l-4.5 3.7v-3.7h-.5a1.5 1.5 0 0 1-1.5-1.5z"/>',
    inbox: '<path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z"/>',
    users: '<circle cx="9" cy="9" r="3.4"/><path d="M3 19c1.1-3.1 3.4-4.6 6-4.6s4.9 1.5 6 4.6"/><path d="M16 6.2a3.4 3.4 0 0 1 0 5.6M18 14.6c1.6.7 2.7 2 3.3 3.6"/>',
    noodle: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M3 20h18"/><path d="M8 8V5M12 8V4M16 8V5.5"/>',
    meat: '<path d="M4 10.5h16"/><path d="M6.2 10.5 7.6 20M17.8 10.5 16.4 20"/><path d="M8.8 7.6c0-1.3 1.1-1.7 1.1-3M12.4 7.6c0-1.3 1.1-1.7 1.1-3M16 7.6c0-1.3 1.1-1.7 1.1-3"/>',
    drink: '<path d="M7 4h10l-1.4 16H8.4z"/><path d="M8.2 10h7.6"/>',
    bakery: '<path d="M4 14a8 4.5 0 0 1 16 0v3.5H4z"/><path d="M8 14V9.5M12 14V8.5M16 14V9.5"/>',
    cafe: '<path d="M5 6h11v6.5a5.5 5.5 0 0 1-11 0z"/><path d="M16 7.5h1.8a2.6 2.6 0 0 1 0 5.2H16"/><path d="M4 20h13"/>',
    chinese: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M3 20h18"/><path d="M12 8c1.6-1.2 1.2-3 0-4-1 1.6-1.4 2.8 0 4z"/>',
    korean: '<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M6 9.5c1.5-1.2 3.5-1.8 6-1.8s4.5.6 6 1.8"/><path d="M3 20h18"/>',
    snack: '<path d="M12 3v18"/><circle cx="12" cy="7" r="2.6"/><circle cx="12" cy="13" r="2.6"/>',
    sushi: '<rect x="4.5" y="8.5" width="15" height="7" rx="3.5"/><circle cx="12" cy="12" r="2.2"/>'
  };

  function icon(name, size, sw) {
    var s = size || 24;
    return '<svg class="ico" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.image) + '</svg>';
  }
  /* 채움 아이콘 — 원형 아이콘은 안쪽 도형을 배경색으로 파낸다(.ko) */
  var PF = {
    compass: '<circle cx="12" cy="12" r="8.4"/><path class="ko" d="M15.4 8.6 13.7 13.7 8.6 15.4l1.7-5.1z"/>',
    pluscircle: '<circle cx="12" cy="12" r="8.4"/><path class="ko" d="M11.1 8.2h1.8v7.6h-1.8z"/><path class="ko" d="M8.2 11.1h7.6v1.8H8.2z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5.4v1.4A3.4 3.4 0 0 0 8.8 9.8V8.2A1.8 1.8 0 0 1 7 6.4V5zM16 5h2.6v1.4a3.4 3.4 0 0 1-3.4 3.4V8.2A1.8 1.8 0 0 0 17 6.4V5z"/><path d="M11.1 12.8h1.8v4.2h-1.8z"/><path d="M8.6 19h6.8v1.7H8.6z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.8 4.2-5.7 7.5-5.7s6.1 1.9 7.5 5.7z"/>'
  };
  function iconFill(name, size) {
    var s = size || 24;
    return '<svg class="ico" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="currentColor" stroke="none" stroke-linejoin="round" aria-hidden="true">' +
      (PF[name] || P[name] || P.image) + '</svg>';
  }

  /* ==========================================================
     2. DOM 헬퍼
     ========================================================== */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); }
  function delegate(rootEl, ev, sel, fn) {
    on(rootEl, ev, function (e) {
      var t = e.target.closest(sel);
      if (t && rootEl.contains(t)) fn(e, t);
    });
  }

  /* ==========================================================
     3. 앱 상태
     ========================================================== */
  var App = {
    stack: [],
    locked: false,
    tab: 'home',
    forceState: 'normal',
    netDelay: 600,
    wished: {},
    feedExtra: [],
    onboardPicked: [],
    onboardIndex: 0,
    onboardGrades: {},
    detailId: 'R02',
    exploreReady: false,
    homeReady: false
  };

  var TAB_ROUTES = { home: 'home', explore: 'explore', rank: 'rank', profile: 'profile' };

  /* ==========================================================
     4. 전환 엔진
     ========================================================== */
  function scr(id) { return document.getElementById(id); }

  function ensureDim(el) {
    if (!q('.scr__dim', el)) {
      var d = document.createElement('div');
      d.className = 'scr__dim';
      el.appendChild(d);
    }
  }

  function lock() {
    App.locked = true;
    frame.classList.add('is-locked');
    after(T.lock, function () { App.locked = false; frame.classList.remove('is-locked'); });
  }

  function show(el) { el.classList.add('is-active'); }
  function hide(el) {
    el.classList.remove('is-active', 'at-left', 'at-right', 'at-down', 'has-dim', 'is-fadeout', 'is-fadein');
    el.style.transform = '';
    el.style.opacity = '';
    var d = q('.scr__dim', el);
    if (d) d.style.opacity = '';
  }
  function clearAnim(el) {
    el.classList.remove('anim-push', 'anim-pop', 'anim-settle', 'anim-tabin', 'anim-tabout', 'anim-root', 'anim-modal-in', 'anim-modal-out', 'is-dragging');
  }

  function transPush(from, to, done) {
    ensureDim(from);
    show(to);
    to.classList.add('at-right');
    reflow(to);
    to.classList.add('anim-push');
    from.classList.add('anim-push');
    to.classList.remove('at-right');
    from.classList.add('at-left', 'has-dim');
    after(T.d6, function () {
      clearAnim(to); clearAnim(from); hide(from); done && done();
    });
  }

  function transPop(from, to, done) {
    ensureDim(to);
    show(to);
    to.classList.add('at-left', 'has-dim');
    reflow(to);
    to.classList.add('anim-pop');
    from.classList.add('anim-pop');
    to.classList.remove('at-left', 'has-dim');
    from.classList.add('at-right');
    after(T.d5, function () {
      clearAnim(to); clearAnim(from); hide(from); done && done();
    });
  }

  function transTabFade(from, to, done) {
    from.classList.add('anim-tabout', 'is-fadeout');
    after(T.d2, function () {
      clearAnim(from); hide(from);
      after(T.dl100, function () {
        show(to);
        to.classList.add('is-fadein');
        reflow(to);
        to.classList.add('anim-tabin');
        to.classList.remove('is-fadein');
        after(T.d4, function () { clearAnim(to); done && done(); });
      });
    });
  }

  function transRoot(from, to, done) {
    show(to);
    to.classList.add('is-fadein');
    reflow(to);
    to.classList.add('anim-root');
    from.classList.add('anim-root', 'is-fadeout');
    to.classList.remove('is-fadein');
    after(T.d4, function () { clearAnim(to); clearAnim(from); hide(from); done && done(); });
  }

  /* 탭바 승강 */
  function tabbarDown() { tabbar.classList.remove('is-up'); tabbar.classList.add('is-down'); }
  function tabbarUp(delay) {
    after(delay || 0, function () {
      tabbar.classList.add('is-up');
      tabbar.classList.remove('is-down');
    });
  }

  /* ==========================================================
     5. 라우터
     ========================================================== */
  var Screens = {};
  var ROUTE_ORDER = ['login', 'onboard1', 'onboard2', 'home', 'explore', 'rank', 'profile', 'detail', 'settings', 'search', 'inbox', 'emaillogin', 'components', 'demoa', 'demob', 'democ'];

  function renderIfNeeded(id, params) {
    var el = scr(id);
    var s = Screens[id];
    if (!s) return el;
    if (!el.dataset.rendered || s.always) {
      el.innerHTML = '';
      s.render(el, params || {});
      el.dataset.rendered = '1';
      ensureDim(el);
    } else if (s.onEnter) {
      s.onEnter(el, params || {});
    }
    return el;
  }

  function current() { return App.stack[App.stack.length - 1]; }

  function navigate(to, opts) {
    opts = opts || {};
    if (App.locked && !opts.force) return;
    var type = opts.type || 'push';
    var fromEntry = current();
    var fromEl = fromEntry ? scr(fromEntry.route) : null;
    if (fromEntry && fromEntry.route === to && type !== 'replace') {
      if (type === 'tab') { scrollTop(scr(to)); }
      return;
    }
    var toEl = renderIfNeeded(to, opts.params);
    lock();

    if (type === 'tab') {
      App.stack = [{ route: to, params: opts.params || {} }];
      applyChrome(to);
      transTabFade(fromEl, toEl, opts.done);
      App.tab = to;
      syncTabbar();
    } else if (type === 'root') {
      App.stack = [{ route: to, params: opts.params || {} }];
      applyChrome(to);
      transRoot(fromEl, toEl, opts.done);
      App.tab = TAB_ROUTES[to] ? to : App.tab;
      syncTabbar();
      if (scr(to).dataset.chrome === 'tab') { tabbar.classList.remove('is-hidden'); tabbarUp(T.dl80); }
    } else if (type === 'replace') {
      App.stack[App.stack.length - 1] = { route: to, params: opts.params || {} };
      applyChrome(to);
      transRoot(fromEl, toEl, opts.done);
    } else {
      App.stack.push({ route: to, params: opts.params || {} });
      applyChrome(to);
      transPush(fromEl, toEl, opts.done);
    }
    location.hash = to;
  }

  function back(opts) {
    opts = opts || {};
    if (App.locked && !opts.force) return;
    if (App.stack.length < 2) return;
    var fromEntry = App.stack.pop();
    var toEntry = current();
    var fromEl = scr(fromEntry.route);
    var toEl = renderIfNeeded(toEntry.route, toEntry.params);
    lock();
    applyChrome(toEntry.route);
    transPop(fromEl, toEl, opts.done);
    location.hash = toEntry.route;
  }

  function applyChrome(route) {
    var el = scr(route);
    var chrome = el.dataset.chrome;
    if (chrome === 'tab') {
      tabbar.classList.remove('is-hidden');
      tabbarUp(0);
    } else {
      tabbar.classList.add('is-hidden');
    }
  }

  function scrollTop(el) {
    var b = q('.body', el) || q('.sheet__body', el);
    if (b) b.scrollTo({ top: 0, behavior: isRM() ? 'auto' : 'smooth' });
  }

  /* ==========================================================
     6. 엣지 스와이프 뒤로가기 (1:1 추종)
     ========================================================== */
  var swipe = null;
  on(frame, 'pointerdown', function (e) {
    if (App.locked || Modal.open) return;
    if (App.stack.length < 2) return;
    var r = frame.getBoundingClientRect();
    if (e.clientX - r.left > readPx('--sp-page')) return;
    var fromEl = scr(current().route);
    var toEl = scr(App.stack[App.stack.length - 2].route);
    ensureDim(toEl);
    show(toEl);
    toEl.classList.add('is-dragging', 'has-dim');
    fromEl.classList.add('is-dragging');
    toEl.style.transform = 'translateX(' + (-0.25 * r.width) + 'px)';
    swipe = { x0: e.clientX, t0: performance.now(), lastX: e.clientX, lastT: performance.now(), v: 0, w: r.width, fromEl: fromEl, toEl: toEl, dim: q('.scr__dim', toEl) };
    frame.setPointerCapture(e.pointerId);
  });

  on(frame, 'pointermove', function (e) {
    if (!swipe) return;
    var dx = Math.max(0, e.clientX - swipe.x0);
    var p = Math.min(1, dx / swipe.w);
    var now = performance.now();
    if (now > swipe.lastT) swipe.v = (e.clientX - swipe.lastX) / (now - swipe.lastT);
    swipe.lastX = e.clientX; swipe.lastT = now;
    swipe.fromEl.style.transform = 'translateX(' + dx + 'px)';
    swipe.toEl.style.transform = 'translateX(' + (-0.25 * swipe.w * (1 - p)) + 'px)';
    if (swipe.dim) swipe.dim.style.opacity = String(1 - p);
  });

  function endSwipe(e) {
    if (!swipe) return;
    var s = swipe; swipe = null;
    var dx = Math.max(0, e.clientX - s.x0);
    var p = dx / s.w;
    var commit = p > 0.4 || s.v > 0.5;
    s.fromEl.classList.remove('is-dragging');
    s.toEl.classList.remove('is-dragging');
    /* 정주 결정(08-19): 엣지 스와이프 정착 = 버튼 Pop과 동일(d5·emphasized-exit).
       가이드 §2의 "남은 거리만 d4·exit"보다 일관성 우선. */
    s.fromEl.classList.add('anim-pop');
    s.toEl.classList.add('anim-pop');
    if (commit) haptic('light');
    if (commit) {
      s.fromEl.style.transform = 'translateX(100%)';
      s.toEl.style.transform = 'translateX(0)';
      if (s.dim) s.dim.style.opacity = '0';
      App.stack.pop();
      var toEntry = current();
      applyChrome(toEntry.route);
      location.hash = toEntry.route;
      after(T.d5, function () {
        clearAnim(s.fromEl); clearAnim(s.toEl);
        hide(s.fromEl);
        s.toEl.style.transform = ''; s.toEl.classList.remove('has-dim');
        if (s.dim) s.dim.style.opacity = '';
      });
    } else {
      s.fromEl.style.transform = 'translateX(0)';
      s.toEl.style.transform = 'translateX(' + (-0.25 * s.w) + 'px)';
      if (s.dim) s.dim.style.opacity = '1';
      after(T.d5, function () {
        clearAnim(s.fromEl); clearAnim(s.toEl);
        s.fromEl.style.transform = '';
        hide(s.toEl);
      });
    }
  }
  on(frame, 'pointerup', endSwipe);
  on(frame, 'pointercancel', endSwipe);

  /* ==========================================================
     7. 공통 컴포넌트
     ========================================================== */
  var Toast = {
    el: null, timer: null,
    show: function (msg, action) {
      if (Toast.timer) clearTimeout(Toast.timer);
      if (Toast.el) { Toast.el.remove(); Toast.el = null; }
      var t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = '<span class="t-body-sm">' + esc(msg) + '</span>' +
        (action ? '<button type="button" class="toast__action t-body-sm">' + esc(action.label) + '</button>' : '');
      toastLayer.appendChild(t);
      reflow(t);
      t.classList.add('is-on');
      Toast.el = t;
      if (action) on(q('.toast__action', t), 'click', function () { action.onClick && action.onClick(); Toast.hide(); });
      Toast.timer = after(action ? T.d8 * 6 + T.d7 : T.d8 * 3 + T.d4, Toast.hide);
    },
    /* 가이드 §3: 소멸은 d2·exit (등장 d4보다 짧게) */
    hide: function () {
      if (!Toast.el) return;
      var t = Toast.el; Toast.el = null;
      t.classList.add('is-out');
      t.classList.remove('is-on');
      after(T.d2, function () { t.remove(); });
    }
  };

  /* 햅틱 (가이드 §4) — 100ms 내 중복 병합, 일반 탭·스크롤에는 쓰지 않는다 */
  var lastHaptic = 0;
  function haptic(kind) {
    if (!navigator.vibrate) return;
    var now = performance.now();
    if (now - lastHaptic < T.d2) return;
    lastHaptic = now;
    navigator.vibrate(kind === 'success' ? [12, 40, 18] : kind === 'error' ? [24, 60, 24] : 8);
  }

  var Dialog = {
    opt: null,
    open: false,
    timer: null,
    show: function (opt) {
      /* 이전 닫힘 타이머가 새 다이얼로그를 지우지 않도록 취소 */
      if (Dialog.timer) { clearTimeout(Dialog.timer); Dialog.timer = null; }
      Dialog.opt = opt;
      Dialog.open = true;
      dialogLayer.innerHTML =
        '<div class="dialog__scrim"></div>' +
        '<div class="dialog" role="dialog" aria-modal="true">' +
        '<h3 class="dialog__title">' + esc(opt.title) + '</h3>' +
        '<p class="dialog__desc">' + esc(opt.desc || '') + '</p>' +
        '<div class="dialog__actions">' +
        '<button type="button" class="btn btn--text" data-act="cancel">' + esc(opt.cancel || '취소') + '</button>' +
        '<button type="button" class="btn ' + (opt.danger ? 'btn--danger' : 'btn--primary') + '" data-act="ok">' + esc(opt.ok || '확인') + '</button>' +
        '</div></div>';
      dialogLayer.classList.remove('is-closing');
      dialogLayer.classList.add('is-on');
      reflow(dialogLayer);
      dialogLayer.classList.add('is-shown');
    },
    hide: function () {
      if (!Dialog.open) return;   /* 열려 있지 않으면 no-op (지연 클리어가 새 다이얼로그를 죽이는 버그 방지) */
      Dialog.open = false;
      Dialog.opt = null;
      dialogLayer.classList.remove('is-shown');
      dialogLayer.classList.add('is-closing');
      Dialog.timer = after(T.d3 + T.dl60, function () {
        Dialog.timer = null;
        if (Dialog.open) return;
        dialogLayer.classList.remove('is-on', 'is-closing');
        dialogLayer.innerHTML = '';
      });
    }
  };
  /* 리스너는 1회만 바인딩 — show()마다 누적되던 delegate 제거 */
  delegate(dialogLayer, 'click', '[data-act]', function (e, t) {
    var opt = Dialog.opt, act = t.dataset.act;
    Dialog.hide();
    if (!opt) return;
    if (act === 'ok' && opt.onOk) opt.onOk();
    if (act === 'cancel' && opt.onCancel) opt.onCancel();
  });
  delegate(dialogLayer, 'click', '.dialog__scrim', function () {
    var opt = Dialog.opt;
    Dialog.hide();
    if (opt && opt.onCancel) opt.onCancel();
  });

  /* 스켈레톤: 200ms(d4) 지연 노출 + 최소 300ms(d6) 유지 */
  function deferredSkeleton(host, skeletonHTML, loadMs, renderFn) {
    var shown = false, shownAt = 0, doneData = false;
    var showTimer = after(T.d4, function () {
      if (doneData) return;
      shown = true; shownAt = performance.now();
      host.innerHTML = skeletonHTML;
    });
    after(loadMs, function () {
      doneData = true;
      clearTimeout(showTimer);
      if (!shown) { renderFn(); return; }
      var elapsed = performance.now() - shownAt;
      var wait = Math.max(0, T.d6 - elapsed);
      after(wait, renderFn);
    });
  }

  /* 스켈레톤은 실제 카드와 같은 실루엣(흰 면 + r-lg + page 여백)을 갖는다 */
  function skeletonFeed() {
    var one = '<div class="card"><div class="sk-card">' +
      '<div class="sk-row"><div class="sk sk--avatar"></div><div style="flex:1"><div class="sk sk--title"></div></div></div>' +
      '<div class="sk sk--thumb"></div><div class="sk sk--line"></div><div class="sk sk--line" style="width:70%"></div></div></div>';
    return one + one + one;
  }

  /* ==========================================================
     8. 시트 엔진 (스냅 3단 · 1:1 추종 · 저항 0.3 · 속도 0.5px/ms)
     ========================================================== */
  var SNAP_PEEK_PX = 200;      /* Peek */
  var SNAP_HALF_VH = 0.5;      /* Half = 50vh */
  var SNAP_FULL_VH = 0.95;     /* Full = 95vh */

  function Sheet(el, opts) {
    this.el = el;
    this.opts = opts || {};
    this.h = frame.clientHeight;
    /* 시트가 탭바 위에 앉을 때는 그만큼 가용 높이가 줄어든다.
       Peek·Half 는 스펙값 그대로, Full 만 화면 밖으로 나가지 않도록 클램프. */
    this.scrim = this.opts.scrim || null;
    this.bottomOffset = this.opts.bottomOffset || 0;
    this.avail = this.h - this.bottomOffset;
    this.snaps = [
      SNAP_PEEK_PX,
      Math.round(this.h * SNAP_HALF_VH),
      Math.min(this.avail, Math.round(this.h * SNAP_FULL_VH))
    ];
    this.index = 0;
    this.y = this.snaps[0];
    this.dismissed = true;
    this.bind();
  }
  Sheet.prototype.height = function () { return this.h; };
  Sheet.prototype.setY = function (px) {
    this.y = px;
    this.el.style.height = this.snaps[2] + 'px';
    this.el.style.transform = 'translateY(' + (this.snaps[2] - px) + 'px)';
  };
  Sheet.prototype.open = function (index) {
    this.dismissed = false;
    this.index = index == null ? 0 : index;
    this.el.classList.remove('is-out');
    this.el.classList.add('is-snapping');
    this.setY(this.snaps[this.index]);
    var self = this;
    nextFrame(function () { self.el.classList.add('is-shown'); });
    this.emit();
  };
  Sheet.prototype.dismiss = function () {
    this.dismissed = true;
    this.el.classList.remove('is-snapping', 'is-shown');
    this.el.classList.add('is-out');
    this.setY(0);
    this.emit();
  };
  Sheet.prototype.snapTo = function (i) {
    this.index = Math.max(0, Math.min(2, i));
    this.el.classList.remove('is-dragging');
    this.el.classList.add('is-snapping');
    this.setY(this.snaps[this.index]);
    this.emit();
  };
  Sheet.prototype.emit = function () {
    /* 가이드 §4: scrim 연동 = 1 - (이동량/높이) 를 시트 진행률로 환산 */
    if (this.scrim) {
      var full = this.snaps[2] || 1;
      var p = Math.max(0, Math.min(1, (this.y - this.snaps[0]) / (full - this.snaps[0])));
      this.scrim.style.opacity = String(this.dismissed ? 0 : p * readNum('--op-scrim'));
      this.scrim.style.pointerEvents = (!this.dismissed && p > 0.5) ? 'auto' : 'none';
    }
    if (this.opts.onChange) this.opts.onChange(this.index, this.dismissed, this.y);
  };
  Sheet.prototype.bind = function () {
    var self = this, drag = null;
    var grab = q('.sheet__grab', this.el);
    var body = q('.sheet__body', this.el);

    function start(e) {
      if (App.locked) return;
      drag = { y0: e.clientY, base: self.y, lastY: e.clientY, lastT: performance.now(), v: 0 };
      self.el.classList.remove('is-snapping', 'is-out');
      self.el.classList.add('is-dragging');
      self.el.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!drag) return;
      var dy = drag.y0 - e.clientY;
      var target = drag.base + dy;
      var max = self.snaps[2];
      if (target > max) target = max + (target - max) * 0.3;      /* 위 초과분 저항 0.3 */
      if (target < 0) target = target * 0.3;
      var now = performance.now();
      if (now > drag.lastT) drag.v = (drag.lastY - e.clientY) / (now - drag.lastT);
      drag.lastY = e.clientY; drag.lastT = now;
      self.setY(target);
      self.emit();
    }
    function end() {
      if (!drag) return;
      var v = drag.v, y = self.y;
      drag = null;
      self.el.classList.remove('is-dragging');
      var i;
      if (Math.abs(v) > 0.5) {                       /* 속도 판정 0.5px/ms */
        i = v > 0 ? Math.min(2, self.index + 1) : self.index - 1;
      } else {                                        /* 최근접 스냅 */
        i = 0; var best = Infinity;
        self.snaps.forEach(function (s, k) { var d = Math.abs(s - y); if (d < best) { best = d; i = k; } });
      }
      if (i < 0) { self.dismiss(); return; }           /* Peek 아래로 = dismiss */
      /* 가이드 §4: Peek 에서 30% 이상 내려가면 닫힘 */
      if (self.index === 0 && i === 0 && y < self.snaps[0] * 0.7) { self.dismiss(); return; }
      haptic('light');
      self.snapTo(i);
    }
    if (grab) {
      on(grab, 'pointerdown', start);
      on(self.el, 'pointermove', move);
      on(self.el, 'pointerup', end);
      on(self.el, 'pointercancel', end);
    }
    if (body) {
      on(body, 'pointerdown', function (e) { if (body.scrollTop <= 0 && self.index < 2) start(e); });
    }
  };

  /* ==========================================================
     9. 탭바
     ========================================================== */
  var TABS = [
    { key: 'home', label: '홈', ico: 'home' },
    { key: 'explore', label: '탐색', ico: 'compass' },
    { key: 'record', label: '기록', ico: 'pluscircle' },
    { key: 'rank', label: '랭킹', ico: 'trophy' },
    { key: 'profile', label: '프로필', ico: 'user' }
  ];
  function buildTabbar() {
    tabbar.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="tab-item" data-tab="' + t.key + '">' +
        '<span class="tab-item__ico">' + icon(t.ico, 24, 1.7) + '</span>' +
        '<span class="tab-item__ico tab-item__ico--on">' + iconFill(t.ico, 24) + '</span>' +
        '<span>' + t.label + '</span></button>';
    }).join('');
    delegate(tabbar, 'click', '[data-tab]', function (e, t) {
      var k = t.dataset.tab;
      if (k === 'record') { Modal.openRecord(); return; }
      if (App.tab === k && current() && current().route === k) { scrollTop(scr(k)); return; }
      navigate(k, { type: 'tab' });
    });
    syncTabbar();
  }
  function syncTabbar() {
    qa('.tab-item', tabbar).forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.tab === App.tab);
    });
  }

  /* ==========================================================
     10. 화면 — A0 로그인
     ========================================================== */
  /* 마스코트 탐이 — 상단 오렌지 면에서 얼굴이 내려다보고 앞발이 경계에 걸친다 */
  function tamiSvg() {
    return '<svg class="tami" viewBox="0 0 390 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g class="tami__face">' +
      '<path d="M195 34v42" />' +
      '<path d="M150 52c14-9 30-13 45-13s31 4 45 13" />' +
      '<path d="M163 76c10-5 21-8 32-8s22 3 32 8" />' +
      '<ellipse class="tami__eye" cx="158" cy="106" rx="10" ry="16" />' +
      '<ellipse class="tami__eye" cx="232" cy="106" rx="10" ry="16" />' +
      '<path class="tami__nose" d="M181 122h28l-14 15z" />' +
      '</g>' +
      '<circle class="tami__cheek" cx="174" cy="152" r="26" />' +
      '<circle class="tami__cheek" cx="216" cy="152" r="26" />' +
      '<g class="tami__paw">' +
      '<path d="M112 268h50a11 11 0 0 1 11 11v26a14 14 0 0 1-14 14h-44a14 14 0 0 1-14-14v-26a11 11 0 0 1 11-11z" />' +
      '<path class="tami__toe" d="M128 290v16M145 290v16" />' +
      '</g>' +
      '<g class="tami__paw">' +
      '<path d="M228 268h50a11 11 0 0 1 11 11v26a14 14 0 0 1-14 14h-44a14 14 0 0 1-14-14v-26a11 11 0 0 1 11-11z" />' +
      '<path class="tami__toe" d="M244 290v16M261 290v16" />' +
      '</g>' +
      '</svg>';
  }
  /* 워드마크 — 'o' 위의 오렌지 점이 signboard 마크 */
  function wordmark(size) {
    return '<span class="wm' + (size ? ' wm--' + size : '') + '">h<span class="wm__o">o</span>tam</span>';
  }
  var kakaoIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 4C7 4 3 7.1 3 10.9c0 2.4 1.6 4.5 4.1 5.7l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .9.1 1.3.1 5 0 9-3.1 9-6.9S17 4 12 4z"/></svg>';
  var naverIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M14.2 4v8.1L9.6 4H4v16h5.8v-8.1L14.4 20H20V4z"/></svg>';
  var googleIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
    '<path class="g-blue" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/>' +
    '<path class="g-green" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/>' +
    '<path class="g-yellow" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z"/>' +
    '<path class="g-red" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2a10 10 0 0 0-8.9 5.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"/></svg>';

  /* A0 로그인 (피그마 712:9161) — 마스코트 스플래시 + 소셜 3종 + 이메일 링크 */
  Screens.login = {
    render: function (el) {
      el.innerHTML =
        '<div class="login">' +
        '<div class="login__hero">' + tamiSvg() + '</div>' +
        '<div class="login__body">' +
        '<div class="login__brand">' + wordmark('lg') +
        '<p class="login__tag">맛집 하나 알려주면<br>안 잡아먹지</p></div>' +
        '<div class="login__social">' +
        '<button type="button" class="btn btn--lg btn--full btn--kakao" data-act="signup">' + kakaoIcon + '카카오로 시작하기</button>' +
        '<button type="button" class="btn btn--lg btn--full btn--google" data-act="signup">' + googleIcon + 'Google로 시작하기</button>' +
        '<button type="button" class="btn btn--lg btn--full btn--naver" data-act="signup">' + naverIcon + '네이버로 시작하기</button>' +
        '</div>' +
        '<div class="login__links">' +
        '<button type="button" class="login__link" data-act="email-login">이메일 로그인</button>' +
        '<span class="login__sep"></span>' +
        '<button type="button" class="login__link" data-act="signup">이메일 회원가입</button>' +
        '</div></div></div>';

      /* 소셜·회원가입 = Trans5로 온보딩 / 이메일 로그인 = 이메일 입력 화면 */
      delegate(el, 'click', '[data-act="signup"]', function () { navigate('onboard1', { type: 'root' }); });
      delegate(el, 'click', '[data-act="email-login"]', function () { navigate('emaillogin', { type: 'push' }); });
    }
  };

  /* A0-1 이메일 로그인 (피그마 712:9161 2행) */
  Screens.emaillogin = {
    render: function (el) {
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
        '<span class="appbar__title">이메일 로그인</span></div>' +
        '<div class="body pad" style="padding-top:var(--sp-lg)">' +
        '<label class="field" id="fEmail"><span class="field__label">이메일</span>' +
        '<span class="field__wrap"><input class="input" type="email" id="loginEmail" placeholder="hotam@example.com" autocomplete="off"></span>' +
        '<span class="field__help" id="loginEmailHelp"></span></label>' +
        '<label class="field" id="fPw"><span class="field__label">비밀번호</span>' +
        '<span class="field__wrap"><input class="input" type="password" id="loginPw" placeholder="6자 이상" autocomplete="off"></span>' +
        '<span class="field__help" id="loginPwHelp"></span></label>' +
        '</div>' +
        '<div class="cta-dock"><button type="button" class="btn btn--lg btn--primary btn--full" id="loginCta" disabled>로그인</button></div>';

      var email = q('#loginEmail', el), pw = q('#loginPw', el), cta = q('#loginCta', el);
      var eh = q('#loginEmailHelp', el), ph = q('#loginPwHelp', el);

      function validate() {
        var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
        var okPw = pw.value.length >= 6;
        email.classList.toggle('is-filled', !!email.value && okEmail);
        pw.classList.toggle('is-filled', !!pw.value && okPw);
        email.classList.toggle('is-error', !!email.value && !okEmail);
        pw.classList.toggle('is-error', !!pw.value && !okPw);
        eh.textContent = (!!email.value && !okEmail) ? '이메일 형식을 다시 확인해 주세요' : '';
        ph.textContent = (!!pw.value && !okPw) ? '6자 이상 입력해 주세요' : '';
        eh.classList.toggle('is-error', !!eh.textContent);
        ph.classList.toggle('is-error', !!ph.textContent);
        cta.disabled = !(okEmail && okPw);
      }
      on(email, 'input', validate);
      on(pw, 'input', validate);
      on(cta, 'click', function () { navigate('home', { type: 'root' }); });
      delegate(el, 'click', '[data-act="back"]', function () { back(); });
    }
  };

  /* ==========================================================
     11. 화면 — ON1 온보딩 식당 선택
     ========================================================== */
  Screens.onboard1 = {
    render: function (el) {
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button></div>' +
        '<div class="ob-head"><h2 class="ob-head__title">가보신 가게를 모두 골라주세요</h2>' +
        '<p class="ob-head__desc">많이 골라서 평가할수록 추천이 정확해져요</p></div>' +
        '<div class="pad"><span class="field__wrap">' + '<span class="field__ico">' + icon('search', 20) + '</span>' +
        '<input class="input input--md input--icon" id="obSearch" placeholder="식당 검색"></span></div>' +
        '<div class="body" id="obList"></div>' +
        '<div class="cta-dock cta-dock--ob">' +
        '<button type="button" class="ob-skip" data-act="skip">건너뛰기</button>' +
        '<button type="button" class="btn btn--lg btn--primary btn--full" id="obCta" disabled>평가하기</button></div>';

      var list = q('#obList', el), search = q('#obSearch', el), cta = q('#obCta', el);

      function draw(filter) {
        var f = (filter || '').trim();
        var items = D.onboardingPool.filter(function (r) { return !f || r.name.indexOf(f) > -1 || r.area.indexOf(f) > -1; });
        if (!items.length) {
          list.innerHTML = '<div class="state is-in">' +
            '<p class="state__desc state__seq">찾으시는 식당이 없나요? <button type="button" class="ob-addlink" data-act="add">식당 추가하기</button></p></div>';
          return;
        }
        list.innerHTML = items.map(function (r) {
          var on = App.onboardPicked.indexOf(r.id) > -1;
          return '<button type="button" class="row" data-pick="' + r.id + '">' +
            '<span class="row__thumb ph-' + r.tone + '">' + icon(r.category, 24, 1.6) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(r.name) + '</span>' +
            '<span class="row__meta">' + esc(r.area) + ' · ' + esc(r.categoryLabel) + '</span></span>' +
            '<span class="row__end"><span class="pick' + (on ? ' is-on' : '') + '"><span class="pick__ico">' + icon('check', 16, 2.4) + '</span></span></span>' +
            '</button>';
        }).join('');
      }
      function sync() {
        var n = App.onboardPicked.length;
        cta.textContent = n > 0 ? n + '곳 평가하기' : '평가하기';
        cta.disabled = n === 0;
      }
      draw('');
      sync();

      on(search, 'input', function () { draw(search.value); });
      delegate(list, 'click', '[data-pick]', function (e, t) {
        var id = t.dataset.pick, i = App.onboardPicked.indexOf(id);
        if (i > -1) App.onboardPicked.splice(i, 1); else App.onboardPicked.push(id);
        q('.pick', t).classList.toggle('is-on', i === -1);
        sync();
      });
      delegate(el, 'click', '[data-act="skip"]', function () { navigate('home', { type: 'root' }); });
      delegate(el, 'click', '[data-act="add"]', function () { Toast.show('식당 추가는 이번 범위 밖이에요'); });
      delegate(el, 'click', '[data-act="back"]', function () { navigate('login', { type: 'root' }); });
      on(cta, 'click', function () {
        App.onboardIndex = 0;
        App.onboardGrades = {};
        scr('onboard2').dataset.rendered = '';
        navigate('onboard2', { type: 'push' });
      });
    },
    onEnter: function (el) {
      var cta = q('#obCta', el);
      if (cta) {
        var n = App.onboardPicked.length;
        cta.textContent = n > 0 ? n + '곳 평가하기' : '평가하기';
        cta.disabled = !n;
      }
    }
  };

  /* ==========================================================
     12. 화면 — ON2 온보딩 평가
     ========================================================== */
  Screens.onboard2 = {
    always: true,
    render: function (el) {
      var picks = App.onboardPicked.length ? App.onboardPicked : D.onboardingPool.slice(0, 3).map(function (r) { return r.id; });
      var N = picks.length;

      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button></div>' +
        '<div class="body body--ob2">' +
        '<div class="ob-card ob-card--center" id="obCard"></div>' +
        '<h2 class="ob2-q">해당 식당, 어떠셨나요?</h2>' +
        '<div class="ob-grades ob-grades--row" id="obGrades">' +
        '<button type="button" class="gbtn gbtn--sm gbtn--good" data-grade="good">좋았어요</button>' +
        '<button type="button" class="gbtn gbtn--sm gbtn--soso" data-grade="soso">그저그래요</button>' +
        '<button type="button" class="gbtn gbtn--sm gbtn--bad" data-grade="bad">별로였어요</button>' +
        '</div>' +
        '<div class="pad" style="padding-top:var(--sp-sm)"><button type="button" class="btn btn--soft-gray btn--full" data-act="unknown">모르겠어요</button></div>' +
        '</div>' +
        '<div class="cta-dock cta-dock--ob">' +
        '<button type="button" class="ob-skip" data-act="skip">전체 건너뛰기</button>' +
        '<button type="button" class="btn btn--lg btn--primary btn--full" id="obNext" disabled></button></div>';

      var card = q('#obCard', el), next = q('#obNext', el);

      function draw() {
        var i = App.onboardIndex;
        if (i >= N) { finish(); return; }
        var r = D.byId(picks[i]);
        card.innerHTML = '<div class="ob-card__photo ph-' + r.tone + '">' + icon(r.category, 32, 1.5) + '</div>' +
          '<p class="t-title-lg">' + esc(r.name) + '</p>' +
          '<p class="t-caption c-secondary">' + esc(r.categoryLabel) + ' · ' + esc(r.area) + '</p>';
        qa('.gbtn', el).forEach(function (b) { b.classList.toggle('is-on', App.onboardGrades[r.id] === b.dataset.grade); });
        next.disabled = !App.onboardGrades[r.id];
        next.textContent = (i === N - 1) ? '평가 완료하기 (' + N + '/' + N + ')' : '다음 평가하기 (' + (i + 1) + '/' + N + ')';
      }
      function step() {
        App.onboardIndex++;
        if (App.onboardIndex >= N) { finish(); return; }
        draw();
      }
      function finish() {
        navigate('home', { type: 'root' });
        after(T.d4, function () { Toast.show('첫 기록 ' + N + '곳이 저장됐어요'); });
      }
      delegate(el, 'click', '[data-grade]', function (e, t) {
        var r = D.byId(picks[App.onboardIndex]);
        App.onboardGrades[r.id] = t.dataset.grade;
        qa('.gbtn', el).forEach(function (b) { b.classList.toggle('is-on', b === t); });
        next.disabled = false;
      });
      delegate(el, 'click', '[data-act="unknown"]', step);
      delegate(el, 'click', '[data-act="skip"]', function () { navigate('home', { type: 'root' }); });
      delegate(el, 'click', '[data-act="back"]', function () {
        if (App.onboardIndex > 0) { App.onboardIndex--; draw(); } else back();
      });
      on(next, 'click', step);
      draw();
    }
  };

  /* ==========================================================
     13. 화면 — S7 홈 피드
     ========================================================== */
  function gradeChip(g, tag) {
    var G = D.GRADE[g];
    return '<span class="chip chip--grade-' + g + (tag ? ' chip--tag' : '') + '">' + G.label + '</span>';
  }
  function scoreBadge(score, g, size) {
    return '<span class="score score--' + g + (size ? ' score--' + size : '') + '"><span class="num">' + score.toFixed(1) + '</span></span>';
  }
  /* 피그마 홈 피드의 링형 점수 배지(흰 면 + 등급색 링·숫자) */
  function scoreRing(score, g) {
    return '<span class="ring ring--' + g + '"><span class="num">' + score.toFixed(1) + '</span></span>';
  }
  function kcount(n) {
    if (n >= 1000) return Math.round(n / 100) / 10 + 'k';
    return String(n);
  }

  /* 피드 카드 — 피그마 S7 구조:
     아바타/닉/시간/점수링/팔로우 -> 사진 스트립 -> 장소 바 -> 본문 -> 액션행 */
  function feedCard(item) {
    var r = D.byId(item.rid);
    var wished = !!App.wished[item.rid];
    var liked = !!item.liked;
    var photos = item.photos == null ? (item.rid.charCodeAt(2) % 3 === 0 ? 0 : 2) : item.photos;
    var strip = '';
    if (photos > 0) {
      strip = '<div class="feed__photos">';
      for (var i = 0; i < photos; i++) {
        strip += '<span class="feed__photo ph-' + (((r.tone + i) % 10) + 1) + '">' + icon(r.category, 44, 1.3) + '</span>';
      }
      strip += '</div>';
    }
    return '<article class="feed" data-feed="' + item.id + '" data-opencard="' + r.id + '">' +
      '<div class="feed__head">' +
      '<span class="avatar av-' + item.avatar + '">' + esc(item.user.slice(0, 1)) + '</span>' +
      '<span class="feed__who"><span class="feed__nick">' + esc(item.user) + '</span>' +
      '<span class="feed__time">' + esc(item.ago) + '</span></span>' +
      scoreRing(item.score, item.grade) +
      '<button type="button" class="btn-follow" data-follow="' + item.id + '">팔로우</button>' +
      '</div>' +
      strip +
      '<button type="button" class="placebar" data-open="' + r.id + '">' +
      '<span class="placebar__ico">' + icon('pin', 18, 1.7) + '</span>' +
      '<span class="placebar__name">' + esc(r.name) + '</span>' +
      '<span class="placebar__end">' + icon('right', 18, 1.7) + '</span></button>' +
      '<p class="feed__text">' + esc(item.text) + '</p>' +
      '<div class="feed__acts">' +
      '<button type="button" class="act' + (liked ? ' is-liked' : '') + '" data-like="' + item.id + '">' +
      '<span class="act__ico">' + (liked ? iconFill('heart', 22) : icon('heart', 22)) + '</span>' +
      '<span class="act__n num">' + kcount(item.likes || 0) + '</span></button>' +
      '<button type="button" class="act" data-comment="' + item.id + '">' +
      '<span class="act__ico">' + icon('comment', 22) + '</span>' +
      '<span class="act__n num">' + kcount(item.comments || 0) + '</span></button>' +
      '<span class="feed__acts-end">' +
      '<button type="button" class="act-ico" data-share="' + r.id + '" aria-label="공유">' + icon('share', 22) + '</button>' +
      '<button type="button" class="act-ico' + (wished ? ' is-on' : '') + '" data-wish="' + r.id + '" aria-label="찜">' +
      (wished ? iconFill('bookmark', 22) : icon('bookmark', 22)) + '</button>' +
      '<button type="button" class="act-ico" data-more="1" aria-label="더보기">' + icon('more', 22) + '</button>' +
      '</span></div></article>';
  }

  function emptyState(title, desc, ctaLabel, ctaAttr, ico) {
    return '<div class="state"><span class="state__ico state__seq">' + icon(ico || 'inbox', 40, 1.5) + '</span>' +
      '<p class="state__title state__seq">' + esc(title) + '</p>' +
      '<p class="state__desc state__seq">' + esc(desc) + '</p>' +
      (ctaLabel ? '<span class="state__seq"><button type="button" class="btn btn--soft" ' + (ctaAttr || '') + '>' + esc(ctaLabel) + '</button></span>' : '') +
      '</div>';
  }
  function errorState(retryAttr) {
    return '<div class="state"><span class="state__ico state__seq">' + icon('alert', 40, 1.5) + '</span>' +
      '<p class="state__title state__seq">불러오지 못했어요</p>' +
      '<p class="state__desc state__seq">잠깐 사이에 길을 잃었네요. 다시 시도해 주세요</p>' +
      '<span class="state__seq"><button type="button" class="btn btn--soft" ' + (retryAttr || '') + '>다시 시도</button></span></div>';
  }
  function playState(host) {
    var s = q('.state', host);
    if (s) nextFrame(function () { s.classList.add('is-in'); });
  }

  Screens.home = {
    render: function (el) {
      el.innerHTML =
        '<div class="appbar"><span class="wordmark">h<span class="wm__o">o</span>tam</span>' +
        '<button type="button" class="icon-btn icon-btn--plain" data-act="search">' + icon('search') + '</button>' +
        '<button type="button" class="icon-btn icon-btn--plain" data-act="inbox">' + icon('bell') + '</button></div>' +
        '<div class="segs"><button type="button" class="seg is-on" data-pane="reco">추천</button>' +
        '<button type="button" class="seg" data-pane="follow">팔로잉</button></div>' +
        '<div class="body body--tab"><div class="tabpane" id="homePane"></div></div>';

      var pane = q('#homePane', el);
      var cur = 'reco';

      function dataFor(k) { return k === 'reco' ? D.feedRecommend : D.feedFollowing; }

      function paint(k) {
        if (App.forceState === 'error') { pane.innerHTML = errorState('data-act="retry"'); playState(pane); return; }
        var items = App.forceState === 'empty' ? [] : (k === 'reco' ? App.feedExtra.concat(dataFor(k)) : dataFor(k));
        if (!items.length) {
          pane.innerHTML = emptyState('아직 기록이 없어요', '팔로우한 미식가가 기록하면 여기에 쌓여요', '미식가 찾기', 'data-act="findpeople"', 'users');
          playState(pane);
          return;
        }
        pane.innerHTML = items.map(feedCard).join('');
      }

      function load(k) {
        pane.innerHTML = '';
        deferredSkeleton(pane, skeletonFeed(), loadDelay(), function () { paint(k); });
      }

      load(cur);

      delegate(el, 'click', '.seg', function (e, t) {
        var k = t.dataset.pane;
        if (k === cur) return;
        qa('.seg', el).forEach(function (s) { s.classList.toggle('is-on', s === t); });
        pane.classList.add('is-out');
        after(T.d2, function () {
          after(T.dl100, function () {
            cur = k;
            load(cur);
            pane.classList.remove('is-out');
          });
        });
      });

      delegate(el, 'click', '[data-open]', function (e, t) {
        App.detailId = t.dataset.open;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: t.dataset.open } });
      });
      /* 카드 아무 곳이나 탭 = 상세 (버튼류 제외) */
      delegate(el, 'click', '[data-opencard]', function (e, t) {
        if (e.target.closest('[data-open],[data-like],[data-comment],[data-share],[data-wish],[data-more],[data-follow]')) return;
        App.detailId = t.dataset.opencard;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: t.dataset.opencard } });
      });
      delegate(el, 'click', '[data-wish]', function (e, t) { toggleWish(t, t.dataset.wish); });
      delegate(el, 'click', '[data-share]', function () { Toast.show('공유 링크를 복사했어요'); });
      delegate(el, 'click', '[data-more]', function () { Toast.show('신고·차단은 준비 중이에요'); });
      delegate(el, 'click', '[data-like]', function (e, t) { toggleLike(t, t.dataset.like); });
      delegate(el, 'click', '[data-comment]', function () { Toast.show('댓글은 이번 프로토타입 범위 밖이에요'); });
      delegate(el, 'click', '[data-follow]', function (e, t) {
        var on = !t.classList.contains('is-on');
        t.classList.toggle('is-on', on);
        t.textContent = on ? '팔로잉' : '팔로우';
        Toast.show(on ? '팔로우했어요' : '팔로우를 취소했어요');
      });
      delegate(el, 'click', '[data-act="retry"]', function () { App.forceState = 'normal'; syncDevState(); load(cur); });
      delegate(el, 'click', '[data-act="findpeople"]', function () { navigate('rank', { type: 'tab' }); });
      delegate(el, 'click', '[data-act="search"]', function () { navigate('search', { type: 'push' }); });
      delegate(el, 'click', '[data-act="inbox"]', function () { navigate('inbox', { type: 'push' }); });

      el._reload = load;
      el._cur = function () { return cur; };
    },
    onEnter: function (el) { if (el._reload) el._reload(el._cur()); }
  };

  /* 찜 낙관적 토글 (실패 = 역전 + 토스트, shake 없음) */
  function toggleWish(btn, id) {
    var nowOn = !App.wished[id];
    App.wished[id] = nowOn;
    paintWish(btn, nowOn);
    if (App.forceState === 'error') {
      after(App.netDelay, function () {
        App.wished[id] = !nowOn;
        paintWish(btn, !nowOn);
        Toast.show('찜을 저장하지 못했어요', { label: '다시', onClick: function () { toggleWish(btn, id); } });
      });
      return;
    }
    Toast.show(nowOn ? '찜에 담았어요' : '찜에서 뺐어요');
  }
  function paintWish(btn, on) {
    btn.classList.toggle('is-on', on);
    var ico = q('.act__ico', btn) || btn;
    ico.innerHTML = on ? iconFill('bookmark', 22) : icon('bookmark', 22);
  }

  /* 좋아요 낙관적 토글 (실패 = 역전 + 토스트, shake 금지) */
  function toggleLike(btn, id) {
    var all = D.feedRecommend.concat(D.feedFollowing, App.feedExtra);
    var item = null;
    all.forEach(function (x) { if (x.id === id) item = x; });
    if (!item) return;
    var on = !item.liked;
    item.liked = on;
    item.likes = (item.likes || 0) + (on ? 1 : -1);
    paintLike(btn, item);
    if (App.forceState === 'error') {
      after(App.netDelay, function () {
        item.liked = !on;
        item.likes = (item.likes || 0) + (on ? -1 : 1);
        paintLike(btn, item);
        Toast.show('좋아요를 저장하지 못했어요', { label: '다시', onClick: function () { toggleLike(btn, id); } });
      });
    }
  }
  function paintLike(btn, item) {
    btn.classList.toggle('is-liked', !!item.liked);
    q('.act__ico', btn).innerHTML = item.liked ? iconFill('heart', 22) : icon('heart', 22);
    q('.act__n', btn).textContent = kcount(item.likes || 0);
  }

  /* ==========================================================
     14. 화면 — S9 탐색
     ========================================================== */
  Screens.explore = {
    render: function (el) {
      el.innerHTML =
        '<div class="map" id="map">' +
        '<div class="map__inner" id="mapInner"></div>' +
        '</div>' +
        '<div class="sheet-scrim" id="sheetScrim"></div>' +
        '<div class="map-search" id="mapSearch"><span class="field__wrap">' +
        '<span class="field__ico">' + icon('search', 20) + '</span>' +
        '<input class="input input--md input--icon" placeholder="지역·식당 이름으로 찾기" id="exploreSearch"></span></div>' +
        '<button type="button" class="research" id="research">' + icon('refresh', 16, 2) + '이 지역 재검색</button>' +
        '<button type="button" class="locate" id="locate" aria-label="현위치">' + icon('locate', 22, 1.8) + '</button>' +
        '<section class="sheet sheet--tab" id="exploreSheet">' +
        '<div class="sheet__grab"></div>' +
        '<div class="sheet__head sheet__seq"><span class="t-title-lg">내 위치 중심</span>' +
        '<span class="t-caption c-secondary" id="sheetCount"></span></div>' +
        '<div class="sheet__body sheet__seq" id="sheetList"></div>' +
        '</section>' +
        '<section class="sheet sheet--tab preview" id="previewSheet" hidden>' +
        '<div class="sheet__grab"></div><div id="previewBody"></div></section>';

      var mapInner = q('#mapInner', el);
      var sheetEl = q('#exploreSheet', el);
      var sheetList = q('#sheetList', el);
      var sheetCount = q('#sheetCount', el);
      var mapSearch = q('#mapSearch', el);
      var research = q('#research', el);
      var locate = q('#locate', el);
      var previewEl = q('#previewSheet', el);

      /* 핀 8 + 클러스터 1 */
      var pins = D.restaurants.slice(0, 8);
      mapInner.innerHTML = pins.map(function (r) {
        return '<button type="button" class="pin" data-pin="' + r.id + '" style="left:' + r.pin.x + 'px;top:' + r.pin.y + 'px" aria-label="' + esc(r.name) + '">' +
          icon('pin', 32, 1.8) + '<span class="pin__dot"></span></button>';
      }).join('') +
        '<button type="button" class="cluster" style="left:318px;top:236px">12</button>';

      var sheet = new Sheet(sheetEl, {
        bottomOffset: readPx('--tabbar-h'),
        scrim: q('#sheetScrim', el),
        onChange: function (index, dismissed) {
          mapSearch.classList.toggle('is-hidden', index === 2 && !dismissed);
          research.classList.toggle('is-mounted', index < 1 && !dismissed);
          var base = readPx('--tabbar-h');
          locate.style.bottom = (dismissed
            ? base + readPx('--sp-page')
            : base + Math.min(sheet.snaps[index], sheet.snaps[1]) + readPx('--sp-xs')) + 'px';
          if (index >= 1 && !dismissed) research.classList.remove('is-on');
        }
      });
      el._sheet = sheet;

      function paintList() {
        /* 빈·에러 상태는 Peek(200)에 안 들어가므로 Half 로 올려서 보여준다 */
        if (App.forceState === 'error') {
          sheetList.innerHTML = errorState('data-act="retry"');
          sheetCount.textContent = '';
          playState(sheetList);
          if (!sheet.dismissed && sheet.index < 1) sheet.snapTo(1);
          return;
        }
        var items = App.forceState === 'empty' ? [] : D.restaurants;
        sheetCount.textContent = items.length ? items.length + '곳' : '';
        if (!items.length) {
          sheetList.innerHTML = emptyState('이 지역엔 아직 없어요', '지도를 옮겨 다른 동네를 찾아보세요', '식당 추가하기', 'data-act="add"', 'pin');
          playState(sheetList);
          if (!sheet.dismissed && sheet.index < 1) sheet.snapTo(1);
          return;
        }
        /* 피그마 S9 시트 행: 썸네일 + 등급칩 + 이름 + 메타 + 찜 */
        sheetList.innerHTML = items.map(function (r) {
          return '<div class="row" data-open="' + r.id + '">' +
            '<span class="row__thumb row__thumb--lg ph-' + r.tone + '">' + icon(r.category, 28, 1.5) + '</span>' +
            '<span class="row__main">' + gradeChip(r.grade, true) +
            '<span class="row__title" style="margin-top:var(--sp-xxs)">' + esc(r.name) + '</span>' +
            '<span class="row__meta">' + esc(r.categoryLabel) + ' · ' + esc(r.area) + ' · 기록 ' + r.records.toLocaleString('ko-KR') + '</span></span>' +
            '<button type="button" class="act-ico' + (App.wished[r.id] ? ' is-on' : '') + '" data-wish="' + r.id + '" aria-label="찜">' +
            (App.wished[r.id] ? iconFill('bookmark', 22) : icon('bookmark', 22)) + '</button></div>';
        }).join('');
      }

      function load() {
        sheetList.innerHTML = '';
        deferredSkeleton(sheetList, skeletonFeed(), loadDelay(), paintList);
      }
      load();
      el._reload = load;

      /* 지도 드래그 -> 재검색 pill */
      var mdrag = null, mapOff = { x: 0, y: 0 };
      var mapEl = q('#map', el);
      on(mapEl, 'pointerdown', function (e) {
        if (e.target.closest('.pin,.cluster')) return;
        mdrag = { x: e.clientX, y: e.clientY, ox: mapOff.x, oy: mapOff.y };
        mapInner.classList.add('is-dragging');
      });
      on(mapEl, 'pointermove', function (e) {
        if (!mdrag) return;
        mapOff.x = mdrag.ox + (e.clientX - mdrag.x);
        mapOff.y = mdrag.oy + (e.clientY - mdrag.y);
        mapInner.style.transform = 'translate(' + mapOff.x + 'px,' + mapOff.y + 'px)';
      });
      function mend() {
        if (!mdrag) return;
        var moved = Math.abs(mapOff.x - mdrag.ox) + Math.abs(mapOff.y - mdrag.oy);
        mdrag = null;
        mapInner.classList.remove('is-dragging');
        if (moved > frame.clientWidth / 3 && sheet.index < 1) {
          research.classList.add('is-mounted');
          nextFrame(function () { research.classList.add('is-on'); });
        }
      }
      on(mapEl, 'pointerup', mend);
      on(mapEl, 'pointercancel', mend);

      on(research, 'click', function () {
        research.classList.remove('is-on');
        after(T.d4, function () { research.classList.remove('is-mounted'); });
        load();
        sheet.open(0);
        Toast.show('이 지역으로 다시 찾았어요');
      });

      on(locate, 'click', function () {
        mapOff = { x: 0, y: 0 };
        mapInner.style.transform = 'translate(0px,0px)';
        Toast.show('내 위치로 이동했어요');
      });

      /* 핀 탭 -> 미리보기 */
      delegate(mapInner, 'click', '[data-pin]', function (e, t) {
        qa('.pin', mapInner).forEach(function (p) { p.classList.toggle('is-on', p === t); });
        openPreview(t.dataset.pin);
      });
      delegate(mapInner, 'click', '.cluster', function () {
        Toast.show('이 구역에 12곳이 있어요');
        sheet.open(1);
      });
      delegate(sheetList, 'click', '[data-open]', function (e, t) {
        if (e.target.closest('[data-wish]')) return;
        goDetail(t.dataset.open);
      });
      delegate(sheetList, 'click', '[data-wish]', function (e, t) { toggleWish(t, t.dataset.wish); });
      delegate(el, 'click', '[data-act="retry"]', function () { App.forceState = 'normal'; syncDevState(); load(); });
      delegate(el, 'click', '[data-act="add"]', function () { Toast.show('식당 추가는 이번 범위 밖이에요'); });

      /* ---- 미리보기 시트 ---- */
      var pv = null;
      function openPreview(id) {
        var r = D.byId(id);
        sheet.dismiss();
        previewEl.hidden = false;
        q('#previewBody', el).innerHTML =
          '<div class="sheet__head sheet__seq" style="display:block">' +
          '<p class="t-caption c-secondary">' + esc(r.categoryLabel) + ' · ' + esc(r.area) + '</p>' +
          '<p class="t-h1" style="margin-top:var(--sp-xxs)">' + esc(r.name) + '</p>' +
          '<p class="t-caption c-secondary" style="margin-top:var(--sp-xxs)">' + esc(r.address) + '</p></div>' +
          '<div class="preview__metrics sheet__seq">' +
          '<span class="metric"><span class="metric__k">친구 점수</span><span class="metric__v num">' + r.friendScore.toFixed(1) + '</span></span>' +
          '<span class="metric"><span class="metric__k">전체 점수</span><span class="metric__v num">' + r.allScore.toFixed(1) + '</span></span>' +
          '<span class="metric"><span class="metric__k">기록</span><span class="metric__v num">' + r.records.toLocaleString('ko-KR') + '</span></span>' +
          '</div>' +
          '<div class="card__acts sheet__seq" style="padding-left:var(--sp-page);padding-right:var(--sp-page)">' +
          '<button type="button" class="act' + (App.wished[r.id] ? ' is-on' : '') + '" data-wish="' + r.id + '"><span class="act__ico">' +
          (App.wished[r.id] ? iconFill('bookmark', 20) : icon('bookmark', 20)) + '</span>찜</button>' +
          '<button type="button" class="act" data-share="' + r.id + '"><span class="act__ico">' + icon('share', 20) + '</span>공유</button>' +
          '</div>' +
          '<div class="pad" style="padding-bottom:var(--sp-page)"><button type="button" class="btn btn--lg btn--primary btn--full" data-rec="' + r.id + '">방문 기록하기</button></div>';

        if (!pv) {
          pv = new PreviewSheet(previewEl,
            function () { goDetail(previewCurrent, true); },
            /* 아래로 dismiss -> 핀 해제 + 목록 시트 Peek 복귀 */
            function () {
              previewCurrent = null;
              qa('.pin', mapInner).forEach(function (p) { p.classList.remove('is-on'); });
              after(T.d4, function () { sheet.open(0); });
            });
        }
        previewCurrent = id;
        pv.open();
      }
      var previewCurrent = null;
      el._closePreview = function () { if (pv) pv.close(); };
      el._reopenPreview = function () { if (pv && previewCurrent) { previewEl.hidden = false; pv.open(); } };

      delegate(previewEl, 'click', '[data-wish]', function (e, t) { toggleWish(t, t.dataset.wish); });
      delegate(previewEl, 'click', '[data-share]', function () { Toast.show('공유 링크를 복사했어요'); });
      delegate(previewEl, 'click', '[data-rec]', function () { Modal.openRecord(previewCurrent); });

      function goDetail(id) {
        App.detailId = id;
        App.fromPreview = true;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: id } });
      }

      /* 빈·에러는 Peek(200)에 안 들어가므로 진입부터 Half 로 연다 */
      function openIndex() { return (App.forceState === 'empty' || App.forceState === 'error') ? 1 : 0; }
      el._openIndex = openIndex;
      nextFrame(function () { sheet.open(openIndex()); });
    },
    onEnter: function (el) {
      if (App.fromPreview) { App.fromPreview = false; el._reopenPreview && el._reopenPreview(); }
      else {
        var pvEl = q('#previewSheet', el);
        var previewShowing = pvEl && !pvEl.hidden && pvEl.classList.contains('is-shown');
        /* 미리보기가 떠 있으면 목록 시트를 다시 올리지 않는다(대체 관계 유지) */
        if (!previewShowing && el._sheet && el._sheet.dismissed) el._sheet.open(el._openIndex ? el._openIndex() : 0);
      }
    }
  };

  /* 미리보기 시트: 고정 높이 · 위로 드래그(40% or 0.5px/ms) -> 상세 확장
     아래로 드래그(30% or 0.5px/ms) -> 닫힘 + 목록 시트 Peek 복귀 */
  function PreviewSheet(el, onExpand, onDismiss) {
    this.el = el;
    this.onExpand = onExpand;
    this.onDismiss = onDismiss;
    this.h = 0;
    this.bind();
  }
  PreviewSheet.prototype.open = function () {
    var self = this;
    this.el.classList.remove('is-out', 'is-snapping');
    this.el.style.transform = 'translateY(100%)';
    reflow(this.el);
    nextFrame(function () {
      self.el.style.transform = 'translateY(0)';
      self.el.classList.add('is-shown');
    });
  };
  PreviewSheet.prototype.close = function () {
    var self = this;
    this.el.classList.remove('is-shown', 'is-snapping');
    this.el.classList.add('is-out');
    this.el.style.transform = 'translateY(100%)';
    after(T.d4, function () { self.el.hidden = true; });
  };
  PreviewSheet.prototype.bind = function () {
    var self = this, drag = null;
    var grab = q('.sheet__grab', this.el);
    on(grab, 'pointerdown', function (e) {
      drag = { y0: e.clientY, lastY: e.clientY, lastT: performance.now(), v: 0, h: self.el.offsetHeight };
      self.el.classList.remove('is-snapping');
      self.el.classList.add('is-dragging');
      self.el.setPointerCapture(e.pointerId);
    });
    on(this.el, 'pointermove', function (e) {
      if (!drag) return;
      var dy = drag.y0 - e.clientY;   /* 위로 + / 아래로 - */
      var now = performance.now();
      if (now > drag.lastT) drag.v = (drag.lastY - e.clientY) / (now - drag.lastT);
      drag.lastY = e.clientY; drag.lastT = now;
      /* 위로는 0.6배 저항, 아래로는 1:1 추종 */
      self.el.style.transform = 'translateY(' + (dy > 0 ? -dy * 0.6 : -dy) + 'px)';
    });
    function end(e) {
      if (!drag) return;
      var d = drag; drag = null;
      var dy = d.y0 - e.clientY;
      self.el.classList.remove('is-dragging');
      if (dy > 0 && (dy / d.h > 0.4 || d.v > 0.5)) {
        self.el.classList.add('is-snapping');
        self.el.style.transform = 'translateY(0)';
        self.onExpand();
        return;
      }
      if (dy < 0 && (-dy / d.h > 0.3 || d.v < -0.5)) {
        self.close();
        self.onDismiss && self.onDismiss();
        return;
      }
      self.el.classList.add('is-snapping');
      self.el.style.transform = 'translateY(0)';
    }
    on(this.el, 'pointerup', end);
    on(this.el, 'pointercancel', end);
  };

  /* ==========================================================
     15. 화면 — S4 식당 상세
     ========================================================== */
  Screens.detail = {
    always: true,
    render: function (el, params) {
      var r = D.byId(params.id || App.detailId) || D.restaurants[0];
      var friends = D.friendRecords;
      el.innerHTML =
        '<div class="detail-appbar" id="dAppbar">' +
        '<span class="detail-appbar__bg" id="dBarBg"></span>' +
        '<button type="button" class="icon-btn icon-btn--float" data-act="back">' + icon('left') + '</button>' +
        '<span class="detail-appbar__title" id="dTitle">' + esc(r.name) + '</span>' +
        '<button type="button" class="icon-btn icon-btn--float icon-btn--plain" data-act="more">' + icon('more') + '</button>' +
        '</div>' +
        '<div class="body" id="dBody">' +
        '<div class="hero"><div class="hero__img ph-' + r.tone + '" id="dHero">' + icon(r.category, 64, 1.2) + '</div><div class="hero__fade"></div></div>' +
        '<div class="pad" style="padding-top:var(--sp-md)">' +
        '<p class="t-caption c-tertiary">' + esc(r.categoryLabel) + ' · ' + esc(r.area) + '</p>' +
        '<h2 class="t-h1" style="margin-top:var(--sp-xxs)">' + esc(r.name) + '</h2>' +
        '<p class="detail-addr">' + icon('pin', 16, 1.7) + '<span>' + esc(r.address) + '</span></p>' +
        '</div>' +
        '<div class="scorerow">' +
        '<span class="scorecell"><span class="scorecell__v num">' + r.friendScore.toFixed(1) + '</span><span class="scorecell__k">친구 평점</span></span>' +
        '<span class="scorecell"><span class="scorecell__v num">' + ((r.friendScore + r.allScore) / 2).toFixed(1) + '</span><span class="scorecell__k">내 취향 예상</span></span>' +
        '<span class="scorecell"><span class="scorecell__v num">' + r.allScore.toFixed(1) + '</span><span class="scorecell__k">전체 평점</span></span>' +
        '</div>' +
        '<div class="pairbtns">' +
        '<button type="button" class="btn btn--outline" data-wish="' + r.id + '">' +
        (App.wished[r.id] ? iconFill('bookmark', 20) : icon('bookmark', 20)) + '찜</button>' +
        '<button type="button" class="btn btn--outline" data-share="' + r.id + '">' + icon('share', 20) + '공유</button>' +
        '</div>' +
        '<div class="sect"><h3 class="sect__title">친구들의 기록 <span class="num c-tertiary">' + friends.length + '</span></h3>' +
        friends.map(function (f) {
          return '<div class="row"><span class="avatar av-' + f.avatar + '">' + esc(f.user.slice(0, 1)) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(f.user) +
            ' <span class="t-caption c-tertiary">' + esc(f.ago) + '</span></span>' +
            '<span class="row__meta">' + esc(f.text) + '</span></span>' +
            '<span class="row__end"><span class="scorenum scorenum--' + f.grade + ' num">' + f.score.toFixed(1) + '</span></span></div>';
        }).join('') + '</div>' +
        '<div class="sect"><h3 class="sect__title">한 줄 요약</h3><div class="pad"><div class="chip-row">' +
        gradeChip('good') + gradeChip('soso') + gradeChip('bad') +
        '</div><p class="t-caption c-secondary" style="margin-top:var(--sp-xs)">같은 등급 안에서 비교한 결과만 점수가 됩니다</p></div></div>' +
        '<div style="height:var(--sp-xxl)"></div>' +
        '</div>' +
        '<div class="cta-dock">' +
        '<button type="button" class="btn btn--lg btn--primary btn--full" data-rec="' + r.id + '">방문 기록하기</button>' +
        '</div>';

      var body = q('#dBody', el), hero = q('#dHero', el), title = q('#dTitle', el), barBg = q('#dBarBg', el);
      var PARALLAX = 0.4;      /* 히어로 패럴랙스 계수 */
      var BAR_RANGE = 40;      /* 앱바 진행률 구간(px) */

      on(body, 'scroll', function () {
        var y = body.scrollTop;
        hero.style.transform = isRM() ? '' : 'translateY(' + (y * PARALLAX) + 'px)';
        var p = Math.min(1, y / BAR_RANGE);
        barBg.style.opacity = String(p);
        title.style.opacity = String(p);
      });

      delegate(el, 'click', '[data-act="back"]', function () { back(); });
      delegate(el, 'click', '[data-act="more"]', function () { Toast.show('신고·차단은 준비 중이에요'); });
      delegate(el, 'click', '[data-rec]', function (e, t) { Modal.openRecord(t.dataset.rec); });
      delegate(el, 'click', '[data-share]', function () { Toast.show('공유 링크를 복사했어요'); });
      delegate(el, 'click', '[data-wish]', function (e, t) {
        var id = t.dataset.wish;
        var nowOn = !App.wished[id];
        App.wished[id] = nowOn;
        t.classList.toggle('is-on', nowOn);
        t.innerHTML = (nowOn ? iconFill('bookmark', 20) : icon('bookmark', 20)) + '찜';
        Toast.show(nowOn ? '찜에 담았어요' : '찜에서 뺐어요');
      });
    }
  };

  /* ==========================================================
     16. 기록 플로우 (Trans2 모달)
     ========================================================== */
  var Modal = {
    open: false,
    step: 0,
    picked: null,
    grade: null,
    compareIndex: 0,
    compareTotal: 3,
    score: 0,

    openRecord: function (presetId) {
      if (Modal.open || App.locked) return;
      Modal.open = true;
      Modal.step = presetId ? 1 : 0;
      Modal.picked = presetId || null;
      Modal.grade = null;
      Modal.compareIndex = 0;
      Modal.score = 0;
      /* 가이드 §3: count-up 은 "이전 점수부터" — 재방문 기록이면 그 값에서 시작 */
      Modal.prevScore = 0;
      if (presetId) {
        D.myRecords.forEach(function (m) { if (m.rid === presetId) Modal.prevScore = m.score; });
      }
      Modal.render();
      lock();
      tabbarDown();
      viewport.classList.add('is-behind');
      frame.classList.add('is-modalbg');
      recordEl.classList.add('is-active', 'at-down');
      reflow(recordEl);
      recordEl.classList.add('anim-modal-in');
      recordEl.classList.remove('at-down');
      after(T.d7, function () { clearAnim(recordEl); });
      location.hash = 'record';
    },

    close: function (opt) {
      if (!Modal.open) return;
      Modal.open = false;
      lock();
      recordEl.classList.add('anim-modal-out', 'at-down');
      viewport.classList.remove('is-behind');
      frame.classList.remove('is-modalbg');
      tabbarUp(T.dl60);
      after(T.d5, function () {
        clearAnim(recordEl);
        recordEl.classList.remove('is-active', 'at-down');
        recordEl.innerHTML = '';
        if (opt && opt.after) opt.after();
      });
      var cur = current();
      if (cur) location.hash = cur.route;
    },

    tryClose: function () {
      if (Modal.step === 0 && !Modal.picked) { Modal.close(); return; }
      Dialog.show({
        title: '기록을 그만둘까요?',
        desc: '지금 나가면 고른 내용은 저장되지 않아요.',
        cancel: '이어서 쓰기', ok: '그만두기', danger: true,
        onOk: function () { Modal.close(); }
      });
    },

    render: function () {
      recordEl.innerHTML =
        '<div class="appbar" style="margin-top:var(--sp-md)">' +
        '<button type="button" class="icon-btn" data-act="close">' + icon('close') + '</button>' +
        '<span class="appbar__title" id="recTitle">방문 기록</span></div>' +
        '<div class="stepbar"><div class="stepbar__fill" id="recFill" style="width:25%"></div></div>' +
        '<div class="rec-step" id="recStep"></div>' +
        '<div class="reveal" id="reveal"><div class="reveal__scrim"></div><div class="reveal__inner">' +
        '<p class="reveal__cap t-body-lg" id="revealCap"></p>' +
        '<div class="reveal__badge" id="revealBadge"></div>' +
        '<div class="reveal__chip" id="revealChip"></div>' +
        '<div class="reveal__cta" id="revealCta"></div>' +
        '</div></div>';
      delegate(recordEl, 'click', '[data-act="close"]', Modal.tryClose);
      Modal.paint();
    },

    paint: function () {
      var host = q('#recStep', recordEl);
      var fill = q('#recFill', recordEl);
      var title = q('#recTitle', recordEl);
      fill.style.width = ((Modal.step + 1) * 25) + '%';
      host.innerHTML = '';

      if (Modal.step === 0) {
        title.textContent = '어디에 다녀왔나요?';
        host.innerHTML = '<div class="pad" style="padding-top:var(--sp-md)"><span class="field__wrap">' +
          '<span class="field__ico">' + icon('search', 20) + '</span>' +
          '<input class="input input--icon" id="recSearch" placeholder="식당 이름으로 찾기"></span></div>' +
          '<div class="body" id="recList"></div>';
        var list = q('#recList', recordEl), search = q('#recSearch', recordEl);
        function draw(f) {
          var items = D.restaurants.filter(function (r) { return !f || r.name.indexOf(f) > -1 || r.area.indexOf(f) > -1; });
          list.innerHTML = items.length ? items.map(function (r) {
            return '<button type="button" class="row" data-pick="' + r.id + '">' +
              '<span class="row__thumb ph-' + r.tone + '">' + icon(r.category, 24, 1.6) + '</span>' +
              '<span class="row__main"><span class="row__title">' + esc(r.name) + '</span>' +
              '<span class="row__meta">' + esc(r.area) + ' · ' + esc(r.categoryLabel) + '</span></span>' +
              '<span class="row__end">' + icon('right', 20) + '</span></button>';
          }).join('') : emptyState('찾는 곳이 없어요', '이름을 조금 줄여서 다시 찾아보세요');
          if (!items.length) playState(list);
        }
        draw('');
        on(search, 'input', function () { draw(search.value); });
        delegate(list, 'click', '[data-pick]', function (e, t) {
          Modal.picked = t.dataset.pick;
          Modal.step = 1;
          Modal.paint();
        });
        return;
      }

      if (Modal.step === 1) {
        var r = D.byId(Modal.picked);
        title.textContent = '어느 정도였나요?';
        host.innerHTML = '<div class="body">' +
          '<div class="ob-card"><div class="ob-card__photo ph-' + r.tone + '">' + icon(r.category, 32, 1.5) + '</div>' +
          '<p class="t-title-lg">' + esc(r.name) + '</p><p class="t-body-sm c-secondary">' + esc(r.area) + ' · ' + esc(r.categoryLabel) + '</p></div>' +
          '<div class="ob-grades">' +
          '<button type="button" class="gbtn gbtn--good" data-grade="good">좋았어요</button>' +
          '<button type="button" class="gbtn gbtn--soso" data-grade="soso">그저그래요</button>' +
          '<button type="button" class="gbtn gbtn--bad" data-grade="bad">별로였어요</button>' +
          '</div></div>' +
          '<div class="cta-dock"><button type="button" class="btn btn--lg btn--primary btn--full" id="recNext" disabled>비교하러 가기</button></div>';
        delegate(host, 'click', '[data-grade]', function (e, t) {
          Modal.grade = t.dataset.grade;
          qa('.gbtn', host).forEach(function (b) { b.classList.toggle('is-on', b === t); });
          q('#recNext', host).disabled = false;
        });
        on(q('#recNext', host), 'click', function () { Modal.step = 2; Modal.compareIndex = 0; Modal.paint(); });
        return;
      }

      if (Modal.step === 2) {
        var G = D.GRADE[Modal.grade];
        var pool = D.comparePool(Modal.grade, Modal.picked);
        Modal.compareTotal = Math.max(1, Math.min(3, pool.length || 1));
        title.textContent = '어느 쪽이 더 좋았나요?';
        var mine = D.byId(Modal.picked);
        var rival = pool.length ? D.byId(pool[Modal.compareIndex % pool.length].rid) : D.restaurants[(Modal.compareIndex + 4) % D.restaurants.length];
        host.innerHTML =
          '<p class="t-caption c-secondary" style="padding:var(--sp-sm) var(--sp-page) 0">' +
          '&quot;' + G.choice + '&quot; 끼리 비교 중 · ' + (Modal.compareIndex + 1) + '/' + Modal.compareTotal + '</p>' +
          '<div class="rec-cards" id="recCards">' +
          recCard('a', mine) + '<span class="rec-vs">VS</span>' + recCard('b', rival) +
          '</div>' +
          '<div class="rec-dots">' + Array.from({ length: Modal.compareTotal }).map(function (_, i) {
            return '<span class="rec-dot' + (i <= Modal.compareIndex ? ' is-on' : '') + '"></span>';
          }).join('') + '</div>' +
          '<div class="cta-dock"><button type="button" class="btn btn--text btn--full" data-act="skipcmp">모르겠어요</button></div>';

        var cards = q('#recCards', host);
        nextFrame(function () { cards.classList.add('is-in'); });

        function step(side) {
          if (side) {
            var picked = q('[data-side="' + side + '"]', cards);
            picked.classList.add('is-picked');
          }
          after(T.d3, function () {
            Modal.compareIndex++;
            if (Modal.compareIndex >= Modal.compareTotal) { Modal.step = 3; Modal.paint(); return; }
            Modal.paint();
          });
        }
        delegate(cards, 'click', '[data-side]', function (e, t) { step(t.dataset.side); });
        delegate(host, 'click', '[data-act="skipcmp"]', function () { step(null); });
        return;
      }

      /* step 3 = 점수 공개 */
      title.textContent = '기록 완료';
      host.innerHTML = '';
      Modal.reveal();
    },

    reveal: function () {
      var base = { good: 9.0, soso: 6.0, bad: 2.0 }[Modal.grade];
      var score = Math.round((base + (Modal.compareIndex * 0.3)) * 10) / 10;
      Modal.score = score;
      var wrap = q('#reveal', recordEl);
      var badge = q('#revealBadge', recordEl);
      var chip = q('#revealChip', recordEl);
      var cta = q('#revealCta', recordEl);
      var cap = q('#revealCap', recordEl);

      cap.textContent = D.byId(Modal.picked).name + ' 기록이 완성됐어요';
      var prev = Modal.prevScore || 0;
      badge.innerHTML = '<span class="score score--' + Modal.grade + ' score--xl"><span class="num" id="revealNum">' + prev.toFixed(1) + '</span></span>';
      chip.innerHTML = gradeChip(Modal.grade);
      cta.innerHTML = '<button type="button" class="btn btn--lg btn--primary btn--full" data-act="done">내 리스트 보기</button>' +
        '<button type="button" class="btn btn--lg btn--text btn--full" data-act="again">계속 기록하기</button>';

      wrap.classList.add('is-mounted');
      var skipped = false;
      var timers = [];

      function finishAll() {
        skipped = true;
        timers.forEach(clearTimeout);
        wrap.classList.add('is-dim', 'is-badge', 'is-chip', 'is-cta');
        q('#revealNum', recordEl).textContent = score.toFixed(1);
      }

      nextFrame(function () { wrap.classList.add('is-dim'); });
      timers.push(after(T.d4, function () {
        if (skipped) return;
        timers.push(after(T.dl80, function () {
          if (skipped) return;
          wrap.classList.add('is-badge');
          haptic('success');
          countUp(q('#revealNum', recordEl), prev, score, T.d8, function () {
            if (skipped) return;
            wrap.classList.add('is-chip');
            timers.push(after(T.d3, function () { if (!skipped) wrap.classList.add('is-cta'); }));
          });
        }));
      }));

      on(q('.reveal__scrim', recordEl), 'click', finishAll);
      on(q('.reveal__inner', recordEl), 'click', function (e) { if (!e.target.closest('[data-act]')) finishAll(); });

      delegate(cta, 'click', '[data-act="done"]', function () {
        Modal.commit();
        Modal.close({ after: function () { navigate('home', { type: 'tab', force: true }); } });
      });
      delegate(cta, 'click', '[data-act="again"]', function () {
        Modal.commit();
        Modal.step = 0; Modal.picked = null; Modal.grade = null; Modal.compareIndex = 0;
        wrap.classList.remove('is-mounted', 'is-dim', 'is-badge', 'is-chip', 'is-cta');
        Modal.render();
      });
    },

    commit: function () {
      var r = D.byId(Modal.picked);
      App.feedExtra.unshift({
        id: 'NEW' + Date.now(), user: D.me.nick, avatar: D.me.avatar, rid: r.id,
        grade: Modal.grade, score: Modal.score, text: '방금 기록했어요.', ago: '방금'
      });
      var home = scr('home');
      after(T.dl200, function () {
        if (home._reload) home._reload(home._cur());
      });
    }
  };

  /* 제출 거부 shake (가이드 §3) — 인풋 그룹 ±6 x2. 찜 실패에는 절대 쓰지 않는다 */
  function rejectField(field) {
    if (!field) return;
    haptic('error');
    field.classList.remove('is-rejected');
    reflow(field);
    field.classList.add('is-rejected');
    var inp = q('.input', field);
    if (inp) inp.classList.add('is-error');
    after(T.d5 * 2 + T.d2, function () { field.classList.remove('is-rejected'); });
  }

  function recCard(side, r) {
    return '<button type="button" class="rec-card rec-card--' + side + '" data-side="' + side + '">' +
      '<span class="rec-card__ph ph-' + r.tone + '">' + icon(r.category, 40, 1.3) + '</span>' +
      '<span class="t-title-lg">' + esc(r.name) + '</span>' +
      '<span class="t-caption c-secondary">' + esc(r.area) + ' · ' + esc(r.categoryLabel) + '</span></button>';
  }

  function countUp(node, from, to, dur, done) {
    if (isRM() || dur <= 1) { node.textContent = to.toFixed(1); done && done(); return; }
    var t0 = performance.now(), finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      node.textContent = to.toFixed(1);
      done && done();
    }
    function tick(now) {
      if (finished) return;
      var p = Math.min(1, (now - t0) / dur);
      node.textContent = (from + (to - from) * p).toFixed(1);
      if (p < 1) raf(tick); else finish();
    }
    raf(tick);
    after(dur + readTime('--d1'), finish);   /* rAF 정지 탭 폴백 */
  }

  /* ==========================================================
     17. 화면 — S11 랭킹 / S12 프로필 (스텁)
     ========================================================== */
  /* S11 랭킹 — 미식 랭킹 / 식당 랭킹 (피그마 724:8837) */
  Screens.rank = {
    render: function (el) {
      var me = D.me;
      el.innerHTML =
        '<div class="appbar appbar--segs">' +
        '<button type="button" class="seg-lg is-on" data-top="people">미식 랭킹</button>' +
        '<button type="button" class="seg-lg" data-top="places">식당 랭킹</button></div>' +
        '<div class="body body--tab" id="rankBody"></div>';

      var body = q('#rankBody', el);
      var top = 'people', scope = 'friend', region = '전체 지역';

      function myCard() {
        return '<div class="mycard">' +
          '<span class="avatar avatar--lg av-' + me.avatar + '">' + esc(me.nick.slice(0, 1)) + '</span>' +
          '<span class="mycard__main">' +
          '<span class="t-caption c-secondary">내 순위 · 기록 ' + me.records + '개</span>' +
          '<span class="mycard__rank">' + me.rank + '위</span></span>' +
          '<span class="chip chip--tag chip--grade-good">상위 ' + (scope === 'friend' ? me.topPct : 98) + '%</span></div>';
      }

      function peopleRows() {
        return D.rankPeople.map(function (p) {
          return '<div class="rankrow' + (p.me ? ' is-me' : '') + '">' +
            '<span class="rankrow__n num">' + p.rank + '</span>' +
            '<span class="avatar av-' + p.avatar + '">' + esc(p.user.slice(0, 1)) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(p.user) + '</span>' +
            '<span class="row__meta">기록 ' + p.records + '개</span></span>' +
            (scope === 'all' && !p.me
              ? '<button type="button" class="btn-follow' + (p.following ? ' is-following' : ' is-cta') + '" data-follow="' + p.rank + '">' +
              (p.following ? '팔로잉' : '팔로우') + '</button>'
              : '') +
            '</div>';
        }).join('');
      }

      function placeRows() {
        return D.rankPlaces.map(function (p) {
          return '<div class="rankrow" data-open="' + p.rid + '">' +
            '<span class="rankrow__n num">' + p.rank + '</span>' +
            '<span class="row__thumb ph-' + p.tone + '">' + icon(p.category, 24, 1.6) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(p.name) + '</span>' +
            '<span class="row__meta">' + esc(p.meta) + '</span></span>' +
            '<span class="scorenum scorenum--' + p.grade + ' num">' + p.score.toFixed(1) + '</span>' +
            '<button type="button" class="act-ico' + (App.wished[p.rid] ? ' is-on' : '') + '" data-wish="' + p.rid + '" aria-label="찜">' +
            (App.wished[p.rid] ? iconFill('bookmark', 20) : icon('bookmark', 20)) + '</button></div>';
        }).join('');
      }

      function paint() {
        if (top === 'people') {
          body.innerHTML = myCard() +
            '<div class="segs segs--sub">' +
            '<button type="button" class="seg" data-scope="friend">친구</button>' +
            '<button type="button" class="seg" data-scope="all">전체</button></div>' +
            '<div id="rankList">' + peopleRows() + '</div>';
          qa('.seg', body).forEach(function (s) { s.classList.toggle('is-on', s.dataset.scope === scope); });
        } else {
          body.innerHTML =
            '<div class="chip-row chip-row--pad">' +
            '<button type="button" class="chip is-on" data-filter="region">' + esc(region) + '</button>' +
            '<button type="button" class="chip" data-filter="area">지역 선택</button>' +
            '<button type="button" class="chip" data-filter="cat">카테고리</button></div>' +
            '<div id="rankList">' + placeRows() + '</div>';
        }
      }
      paint();

      delegate(el, 'click', '[data-top]', function (e, t) {
        if (t.dataset.top === top) return;
        top = t.dataset.top;
        qa('.seg-lg', el).forEach(function (s) { s.classList.toggle('is-on', s === t); });
        body.classList.add('is-fadeout');
        after(T.d2, function () {
          after(T.dl100, function () { paint(); body.classList.remove('is-fadeout'); });
        });
      });
      delegate(el, 'click', '[data-scope]', function (e, t) {
        if (t.dataset.scope === scope) return;
        scope = t.dataset.scope;
        qa('.seg', body).forEach(function (s2) { s2.classList.toggle('is-on', s2.dataset.scope === scope); });
        var list = q('#rankList', body);
        if (list) {
          list.classList.add('is-fadeout');
          after(T.d2, function () {
            after(T.dl100, function () { paint(); });
          });
        } else paint();
      });
      delegate(el, 'click', '[data-filter]', function () { Toast.show('필터 시트는 이번 범위 밖이에요'); });
      delegate(el, 'click', '[data-follow]', function (e, t) {
        var on = !t.classList.contains('is-following');
        t.classList.toggle('is-following', on);
        t.classList.toggle('is-cta', !on);
        t.textContent = on ? '팔로잉' : '팔로우';
        Toast.show(on ? '팔로우했어요' : '팔로우를 취소했어요');
      });
      delegate(el, 'click', '[data-wish]', function (e, t) { toggleWish(t, t.dataset.wish); });
      delegate(el, 'click', '[data-open]', function (e, t) {
        if (e.target.closest('[data-wish]')) return;
        App.detailId = t.dataset.open;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: t.dataset.open } });
      });
    }
  };

  /* S10 프로필 (피그마 724:9698) */
  Screens.profile = {
    render: function (el) {
      var me = D.me;
      var grid = D.restaurants.slice(0, 9);
      el.innerHTML =
        '<div class="appbar"><span class="appbar__title"></span>' +
        '<button type="button" class="icon-btn icon-btn--plain" data-act="settings" aria-label="설정">' + icon('settings') + '</button></div>' +
        '<div class="body body--tab" id="profBody">' +
        '<div class="prof-head">' +
        '<span class="avatar avatar--lg av-' + me.avatar + '">' + esc(me.nick.slice(0, 1)) + '</span>' +
        '<span class="prof-stats">' +
        '<span class="stat"><span class="stat__v num">' + me.records + '</span><span class="stat__k">기록</span></span>' +
        '<span class="stat"><span class="stat__v num">' + me.followers + '</span><span class="stat__k">팔로워</span></span>' +
        '<span class="stat"><span class="stat__v num">' + me.following + '</span><span class="stat__k">팔로잉</span></span>' +
        '</span></div>' +
        '<div class="prof-id">' +
        '<span class="prof-id__main"><span class="t-title-lg">' + esc(me.nick) + '</span>' +
        '<span class="t-caption c-tertiary">' + esc(me.handle) + '</span></span>' +
        '<button type="button" class="btn btn--sm btn--soft" data-act="edit">프로필 수정</button></div>' +
        '<button type="button" class="placebar placebar--wide" data-act="mylist">' +
        '<span class="placebar__ico">' + icon('bookmark', 18, 1.7) + '</span>' +
        '<span class="placebar__name">내 식당 리스트</span>' +
        '<span class="placebar__end">' + icon('right', 18, 1.7) + '</span></button>' +
        '<div class="segs segs--sub" style="margin-top:var(--sp-md)">' +
        '<button type="button" class="seg is-on" data-pane="rec">기록</button>' +
        '<button type="button" class="seg" data-pane="wish">위시</button></div>' +
        '<div id="profPane"></div></div>';

      var pane = q('#profPane', el);
      var cur = 'rec';

      function paint() {
        if (cur === 'wish') {
          var ids = Object.keys(App.wished).filter(function (k) { return App.wished[k]; });
          if (!ids.length) {
            pane.innerHTML = emptyState('위시가 비어 있어요', '피드나 탐색에서 찜하면 여기에 모여요', '탐색 가기', 'data-act="go-explore"', 'bookmark');
            playState(pane);
            return;
          }
          pane.innerHTML = '<div class="pgrid">' + ids.map(cell).join('') + '</div>';
          return;
        }
        if (App.forceState === 'empty') {
          pane.innerHTML = emptyState('아직 기록이 없어요', '한 곳만 기록하면 바로 순위가 만들어져요', '기록 시작하기', 'data-act="rec"', 'bookmark');
          playState(pane);
          return;
        }
        pane.innerHTML = '<div class="pgrid">' + grid.map(function (r) { return cell(r.id); }).join('') + '</div>';
      }
      function cell(id) {
        var r = D.byId(id);
        var g = r.grade;
        return '<button type="button" class="pcell ph-' + r.tone + '" data-open="' + r.id + '">' +
          icon(r.category, 32, 1.3) +
          '<span class="pcell__bar"><span class="pcell__name">' + esc(r.name) + '</span>' +
          '<span class="pcell__score num scorenum--' + g + '">' + r.allScore.toFixed(1) + '</span></span></button>';
      }
      paint();

      delegate(el, 'click', '[data-pane]', function (e, t) {
        if (t.dataset.pane === cur) return;
        cur = t.dataset.pane;
        qa('.seg', el).forEach(function (s) { s.classList.toggle('is-on', s === t); });
        pane.classList.add('is-fadeout');
        after(T.d2, function () { after(T.dl100, function () { paint(); pane.classList.remove('is-fadeout'); }); });
      });
      delegate(el, 'click', '[data-open]', function (e, t) {
        App.detailId = t.dataset.open;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: t.dataset.open } });
      });
      delegate(el, 'click', '[data-act="rec"]', function () { Modal.openRecord(); });
      delegate(el, 'click', '[data-act="go-explore"]', function () { navigate('explore', { type: 'tab' }); });
      delegate(el, 'click', '[data-act="settings"]', function () { navigate('settings', { type: 'push' }); });
      delegate(el, 'click', '[data-act="edit"]', function () { Toast.show('프로필 수정은 이번 범위 밖이에요'); });
      delegate(el, 'click', '[data-act="mylist"]', function () { Toast.show('내 식당 리스트는 이번 범위 밖이에요'); });

      el._reload = paint;
    },
    onEnter: function (el) { if (el._reload) el._reload(); }
  };

  /* 설정 (피그마 724:11079) */
  Screens.settings = {
    render: function (el) {
      var groups = [
        { t: '계정', rows: ['프로필 수정', '계정 정보', '비공개 계정'] },
        { t: '알림', rows: ['푸시 알림', '팔로우 알림', '기록 반응 알림'] },
        { t: '이용 안내', rows: ['공지사항', '문의하기', '이용약관', '개인정보 처리방침'] }
      ];
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
        '<span class="appbar__title">설정</span></div>' +
        '<div class="body">' +
        groups.map(function (g) {
          return '<div class="sect"><h3 class="sect__title t-caption c-secondary">' + esc(g.t) + '</h3>' +
            g.rows.map(function (r) {
              return '<button type="button" class="row" data-set="1">' +
                '<span class="row__main"><span class="row__title">' + esc(r) + '</span></span>' +
                '<span class="row__end c-tertiary">' + icon('right', 20) + '</span></button>';
            }).join('') + '</div>';
        }).join('') +
        '<div class="pad" style="padding:var(--sp-lg) var(--sp-page) var(--sp-xxl)">' +
        '<button type="button" class="btn btn--text btn--full" data-act="logout">로그아웃</button>' +
        '<button type="button" class="btn btn--text btn--full" data-act="leave" style="color:var(--status-danger)">탈퇴하기</button>' +
        '</div></div>';
      delegate(el, 'click', '[data-act="back"]', function () { back(); });
      delegate(el, 'click', '[data-set]', function () { Toast.show('이번 프로토타입 범위 밖이에요'); });
      delegate(el, 'click', '[data-act="logout"]', function () {
        Dialog.show({
          title: '로그아웃할까요?', desc: '다시 로그인하면 기록은 그대로 있어요.',
          cancel: '취소', ok: '로그아웃',
          onOk: function () { navigate('login', { type: 'root' }); }
        });
      });
      delegate(el, 'click', '[data-act="leave"]', function () {
        Dialog.show({
          title: '정말 탈퇴할까요?', desc: '기록과 비교 결과가 모두 사라지고 되돌릴 수 없어요.',
          cancel: '그만두기', ok: '탈퇴하기', danger: true,
          onOk: function () { Toast.show('데모라서 탈퇴는 실행되지 않아요'); }
        });
      });
    }
  };

  /* S15 통합검색 (피그마 718:4325) */
  Screens.search = {
    render: function (el) {
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
        '<span class="field__wrap" style="flex:1">' +
        '<span class="field__ico">' + icon('search', 20) + '</span>' +
        '<input class="input input--md input--icon" id="searchInput" placeholder="식당·미식가 검색"></span></div>' +
        '<div class="segs segs--sub" id="searchSegs" hidden>' +
        '<button type="button" class="seg is-on" data-pane="place">식당</button>' +
        '<button type="button" class="seg" data-pane="user">미식가</button></div>' +
        '<div class="body" id="searchBody"></div>';

      var input = q('#searchInput', el), body = q('#searchBody', el), segs = q('#searchSegs', el);
      var pane = 'place';
      var recent = ['라멘', '연남동', '소금빵', '합정 고기'];

      function pre() {
        segs.hidden = true;
        body.innerHTML = '<div class="sect"><h3 class="sect__title t-caption c-secondary">최근 검색어</h3>' +
          '<div class="chip-row chip-row--pad">' + recent.map(function (k) {
            return '<button type="button" class="chip" data-kw="' + esc(k) + '">' + esc(k) + '</button>';
          }).join('') + '</div></div>';
      }
      function results(kw) {
        segs.hidden = false;
        if (pane === 'user') {
          body.innerHTML = D.rankPeople.slice(0, 4).map(function (p) {
            return '<div class="row"><span class="avatar av-' + p.avatar + '">' + esc(p.user.slice(0, 1)) + '</span>' +
              '<span class="row__main"><span class="row__title">' + esc(p.user) + '</span>' +
              '<span class="row__meta">기록 ' + p.records + '개</span></span></div>';
          }).join('');
          return;
        }
        var items = D.restaurants.filter(function (r) {
          return r.name.indexOf(kw) > -1 || r.area.indexOf(kw) > -1 || r.categoryLabel.indexOf(kw) > -1;
        });
        if (!items.length) {
          body.innerHTML = emptyState('검색 결과가 없어요', '다른 이름이나 동네로 찾아보세요', '식당 추가하기', 'data-act="add"', 'search');
          playState(body);
          return;
        }
        body.innerHTML = items.map(function (r) {
          return '<div class="row" data-open="' + r.id + '">' +
            '<span class="row__thumb ph-' + r.tone + '">' + icon(r.category, 24, 1.6) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(r.name) + '</span>' +
            '<span class="row__meta">' + esc(r.categoryLabel) + ' · ' + esc(r.area) + '</span></span>' +
            '<span class="scorenum scorenum--' + r.grade + ' num">' + r.allScore.toFixed(1) + '</span></div>';
        }).join('');
      }
      pre();

      on(input, 'input', function () {
        var v = input.value.trim();
        if (!v) { pre(); return; }
        body.innerHTML = '';
        deferredSkeleton(body, skeletonFeed(), loadDelay(), function () { results(v); });
      });
      delegate(el, 'click', '[data-kw]', function (e, t) {
        input.value = t.dataset.kw;
        input.dispatchEvent(new Event('input'));
      });
      delegate(el, 'click', '[data-pane]', function (e, t) {
        pane = t.dataset.pane;
        qa('.seg', segs).forEach(function (s) { s.classList.toggle('is-on', s === t); });
        results(input.value.trim());
      });
      delegate(el, 'click', '[data-open]', function (e, t) {
        App.detailId = t.dataset.open;
        scr('detail').dataset.rendered = '';
        navigate('detail', { type: 'push', params: { id: t.dataset.open } });
      });
      delegate(el, 'click', '[data-act="back"]', function () { back(); });
      delegate(el, 'click', '[data-act="add"]', function () { Toast.show('식당 추가는 이번 범위 밖이에요'); });
    }
  };

  /* S12 알림 (피그마 718:4325) */
  Screens.inbox = {
    render: function (el) {
      var items = [
        { user: '탐식가정주', avatar: 1, text: '님이 회원님을 팔로우하기 시작했어요', ago: '10분 전', unread: true, follow: true },
        { user: '주말미식', avatar: 2, text: '님이 회원님의 기록을 좋아합니다', ago: '2시간 전', unread: true },
        { user: '동네한바퀴', avatar: 3, text: '님이 댓글을 남겼어요', ago: '어제', unread: false },
        { user: '빵순이지도', avatar: 5, text: '님이 회원님과 같은 곳을 기록했어요', ago: '3일 전', unread: false }
      ];
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
        '<span class="appbar__title">알림</span></div>' +
        '<div class="body" id="inboxBody"></div>';
      var body = q('#inboxBody', el);
      if (App.forceState === 'empty') {
        body.innerHTML = emptyState('알림이 없어요', '기록을 남기면 반응이 여기에 쌓여요', '기록 시작하기', 'data-act="rec"', 'bell');
        playState(body);
      } else {
        body.innerHTML = items.map(function (n) {
          return '<div class="row' + (n.unread ? ' is-unread' : '') + '">' +
            '<span class="avatar av-' + n.avatar + '">' + esc(n.user.slice(0, 1)) + '</span>' +
            '<span class="row__main"><span class="row__title">' + esc(n.user) +
            '<span class="t-body-sm" style="font-weight:var(--fw-regular)">' + esc(n.text) + '</span></span>' +
            '<span class="row__meta">' + esc(n.ago) + '</span></span>' +
            (n.follow ? '<button type="button" class="btn-follow is-cta" data-follow="1">팔로우</button>' : '') +
            '</div>';
        }).join('');
      }
      delegate(el, 'click', '[data-act="back"]', function () { back(); });
      delegate(el, 'click', '[data-act="rec"]', function () { Modal.openRecord(); });
      delegate(el, 'click', '[data-follow]', function (e, t) {
        var on = !t.classList.contains('is-following');
        t.classList.toggle('is-following', on);
        t.classList.toggle('is-cta', !on);
        t.textContent = on ? '팔로잉' : '팔로우';
      });
    }
  };

  /* ==========================================================
     18. 화면 — 컴포넌트 데모 · 전환 데모 A/B/C
     ========================================================== */
  Screens.components = {
    render: function (el) {
      el.innerHTML =
        '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
        '<span class="appbar__title">컴포넌트</span></div>' +
        '<div class="body">' +

        '<div class="demo-sect"><p class="demo-sect__t">버튼 — pressed = 색 전환만(scale 금지)</p><div class="demo-row">' +
        '<button type="button" class="btn btn--primary">Primary</button>' +
        '<button type="button" class="btn btn--soft">Soft</button>' +
        '<button type="button" class="btn btn--text">Text</button>' +
        '<button type="button" class="btn btn--danger">Danger</button>' +
        '<button type="button" class="btn btn--primary" disabled>Disabled</button>' +
        '<button type="button" class="btn btn--primary"><span class="spinner spinner--on-button btn__spin">' + icon('refresh', 20, 2) + '</span></button>' +
        '</div></div>' +

        '<div class="demo-sect"><p class="demo-sect__t">인풋 4상태</p>' +
        '<label class="field"><span class="field__label">기본</span><span class="field__wrap"><input class="input input--md" placeholder="입력해 주세요"></span></label>' +
        '<label class="field"><span class="field__label">채움</span><span class="field__wrap"><input class="input input--md is-filled" value="연남동 손칼국수"></span></label>' +
        '<label class="field"><span class="field__label">에러</span><span class="field__wrap"><input class="input input--md is-error" value="hotam@"></span>' +
        '<span class="field__help is-error">' + icon('alert', 14, 2) + '이메일 형식을 다시 확인해 주세요</span></label>' +
        '<label class="field"><span class="field__label">비활성</span><span class="field__wrap"><input class="input input--md" value="수정 불가" disabled></span></label>' +
        '</div>' +

        '<div class="demo-sect"><p class="demo-sect__t">칩 · 점수 배지</p><div class="demo-row" style="margin-bottom:var(--sp-xs)">' +
        '<button type="button" class="chip" data-chip="1"><span class="chip__check">' + icon('check', 16, 2.4) + '</span>한식</button>' +
        '<button type="button" class="chip" data-chip="1"><span class="chip__check">' + icon('check', 16, 2.4) + '</span>일식</button>' +
        '<button type="button" class="chip" data-chip="1"><span class="chip__check">' + icon('check', 16, 2.4) + '</span>카페</button>' +
        '</div><div class="demo-row">' +
        scoreBadge(9.5, 'good') + scoreBadge(5.5, 'soso') + scoreBadge(1.2, 'bad') +
        scoreBadge(9.5, 'good', 'lg') + gradeChip('good') + gradeChip('soso') + gradeChip('bad') +
        '</div></div>' +

        '<div class="demo-sect"><p class="demo-sect__t">리스트 행</p>' +
        '<button type="button" class="row"><span class="row__thumb ph-1">' + icon('noodle', 24, 1.6) + '</span>' +
        '<span class="row__main"><span class="row__title">연남동 손칼국수</span><span class="row__meta">연남동 · 칼국수 · 240m</span></span>' +
        '<span class="row__end">' + scoreBadge(8.2, 'good') + '</span></button>' +
        '<button type="button" class="row"><span class="row__thumb ph-3">' + icon('drink', 24, 1.6) + '</span>' +
        '<span class="row__main"><span class="row__title">망원 삼거리 포차</span><span class="row__meta">망원동 · 술집 · 880m</span></span>' +
        '<span class="row__end"><span class="pick is-on"><span class="pick__ico">' + icon('check', 16, 2.4) + '</span></span></span></button>' +
        '</div>' +

        '<div class="demo-sect"><p class="demo-sect__t">피드백</p><div class="demo-row">' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="toast">토스트</button>' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="toast-action">토스트+액션</button>' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="dialog">다이얼로그</button>' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="sheet">시트</button>' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="banner">배너</button>' +
        '<button type="button" class="btn btn--sm btn--soft" data-demo="shake">제출 거부 shake</button>' +
        '</div>' +
        '<div class="banner" id="demoBanner"><div class="banner__in"><div class="banner__box">' +
        icon('alert', 18, 1.8) + '<span>지난주에 다녀온 곳이에요. 다시 기록할까요?</span></div></div></div>' +
        '<label class="field" id="demoField" style="margin-top:var(--sp-sm)">' +
        '<span class="field__label">닉네임</span><span class="field__wrap">' +
        '<input class="input input--md" value="탐" id="demoShakeInput"></span>' +
        '<span class="field__help">2자 이상 입력해야 제출됩니다</span></label>' +
        '</div>' +

        '<div class="demo-sect"><p class="demo-sect__t">버튼 loading — 라벨 fade-out d2 -> 스피너 fade-in d4</p><div class="demo-row">' +
        '<button type="button" class="btn btn--primary" data-demo="loading">' +
        '<span class="btn__label">저장하기</span>' +
        '<span class="btn__load"><span class="spinner spinner--on-button btn__spin">' + icon('refresh', 20, 2) + '</span></span></button>' +
        '</div></div>' +

        '<div class="demo-sect"><p class="demo-sect__t">로딩</p><div class="demo-row" style="align-items:flex-start">' +
        '<span class="spinner" style="color:var(--main-primary)">' + icon('refresh', 24, 2) + '</span>' +
        '<span class="sk sk--avatar"></span><span class="sk sk--line" style="width:120px"></span>' +
        '</div>' +
        '<div class="sk-card" style="padding-left:0;padding-right:0"><div class="sk sk--thumb"></div></div></div>' +

        '<div class="demo-sect"><p class="demo-sect__t">전환 데모</p><div class="demo-row">' +
        '<button type="button" class="btn btn--sm btn--primary" data-goto="demoa">A로 push</button>' +
        '</div></div>' +

        '<div style="height:var(--sp-xxl)"></div></div>' +

        '<section class="sheet" id="demoSheet"><div class="sheet__grab"></div>' +
        '<div class="sheet__head sheet__seq"><span class="t-title-lg">시트 데모</span></div>' +
        '<div class="sheet__body sheet__seq"><div class="pad"><p class="t-body-sm c-secondary">그러버를 잡고 위아래로 끌어 보세요. Peek 200 / Half 50vh / Full 95vh 로 스냅합니다.</p></div></div></section>';

      var ds = null;
      delegate(el, 'click', '[data-act="back"]', function () { back(); });
      delegate(el, 'click', '[data-chip]', function (e, t) { t.classList.toggle('is-on'); });
      delegate(el, 'click', '[data-goto]', function (e, t) { navigate(t.dataset.goto, { type: 'push' }); });
      delegate(el, 'click', '[data-demo]', function (e, t) {
        var k = t.dataset.demo;
        if (k === 'toast') Toast.show('기록이 저장됐어요');
        if (k === 'toast-action') Toast.show('찜을 저장하지 못했어요', { label: '다시', onClick: function () { Toast.show('다시 시도했어요'); } });
        if (k === 'dialog') Dialog.show({ title: '기록을 그만둘까요?', desc: '지금 나가면 고른 내용은 저장되지 않아요.', cancel: '이어서 쓰기', ok: '그만두기', danger: true });
        if (k === 'sheet') { if (!ds) ds = new Sheet(q('#demoSheet', el), {}); ds.dismissed ? ds.open(0) : ds.dismiss(); }
        if (k === 'banner') q('#demoBanner', el).classList.toggle('is-on');
        if (k === 'shake') rejectField(q('#demoField', el));
        if (k === 'loading') {
          t.classList.add('is-loading');
          after(T.d8 * 3, function () { t.classList.remove('is-loading'); Toast.show('저장했어요'); });
        }
      });
    }
  };

  ['demoa', 'demob', 'democ'].forEach(function (id, i) {
    var next = ['demob', 'democ', null][i];
    Screens[id] = {
      render: function (el) {
        el.innerHTML = '<div class="appbar"><button type="button" class="icon-btn" data-act="back">' + icon('left') + '</button>' +
          '<span class="appbar__title">전환 데모</span></div>' +
          '<div class="body demo-screen demo-' + id.slice(-1) + '">' +
          '<h2>' + id.slice(-1).toUpperCase() + '</h2>' +
          '<p class="t-body-sm c-secondary">왼쪽 가장자리에서 오른쪽으로 끌면 뒤로 갑니다</p>' +
          (next ? '<button type="button" class="btn btn--primary" data-goto="' + next + '">다음 화면 push</button>' : '') +
          '<button type="button" class="btn btn--text" data-act="back">뒤로 pop</button></div>';
        delegate(el, 'click', '[data-act="back"]', function () { back(); });
        delegate(el, 'click', '[data-goto]', function (e, t) { navigate(t.dataset.goto, { type: 'push' }); });
      }
    };
  });

  /* ==========================================================
     19. 개발 바
     ========================================================== */
  function syncDevState() {
    qa('.devbtn[data-state]').forEach(function (b) {
      b.dataset.on = b.dataset.state === App.forceState ? '1' : '0';
    });
  }
  function reloadCurrent() {
    var el = scr(current().route);
    if (el._reload) el._reload(el._cur ? el._cur() : undefined);
  }

  function bindDevbar() {
    var rm = document.getElementById('devRm');
    var slow = document.getElementById('devSlow');
    var delay = document.getElementById('devDelay');
    var out = document.getElementById('devDelayOut');

    on(rm, 'click', function () {
      var on1 = root.getAttribute('data-rm') === '1' ? '0' : '1';
      root.setAttribute('data-rm', on1);
      rm.dataset.on = on1;
    });
    on(slow, 'click', function () {
      var on1 = root.getAttribute('data-slow') === '1' ? '0' : '1';
      root.setAttribute('data-slow', on1);
      slow.dataset.on = on1;
    });
    delegate(document.getElementById('devbar'), 'click', '[data-state]', function (e, t) {
      App.forceState = t.dataset.state;
      syncDevState();
      reloadCurrent();
    });
    on(delay, 'input', function () {
      App.netDelay = Number(delay.value);
      out.textContent = App.netDelay + 'ms';
    });
    on(document.getElementById('devComponents'), 'click', function () { navigate('components', { type: 'push' }); });
    on(document.getElementById('devTrans'), 'click', function () { navigate('demoa', { type: 'push' }); });
    on(document.getElementById('devReset'), 'click', function () { location.hash = ''; location.reload(); });

    /* OS 설정 병행 지원 */
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function applyMQ() {
      if (mq.matches) { root.setAttribute('data-rm', '1'); rm.dataset.on = '1'; }
    }
    applyMQ();
    if (mq.addEventListener) mq.addEventListener('change', applyMQ);

    App.netDelay = Number(delay.value);
    out.textContent = App.netDelay + 'ms';
  }

  /* URL 파라미터로 상태 강제 (스펙 §7: ?state=empty 등)
     ?state=loading|empty|error · ?delay=0~1500 · ?rm=1 · ?slow=1 · ?bare=1(개발 바 숨김) */
  function applyUrlParams() {
    var p = new URLSearchParams(location.search);
    if (p.get('rm') === '1') root.setAttribute('data-rm', '1');
    if (p.get('slow') === '1') root.setAttribute('data-slow', '1');
    if (p.get('bare') === '1') document.body.classList.add('is-bare');
    var st = p.get('state');
    if (['loading', 'empty', 'error', 'normal'].indexOf(st) > -1) App.forceState = st;
    var dl = p.get('delay');
    if (dl !== null && !isNaN(Number(dl))) {
      App.netDelay = Number(dl);
      var slider = document.getElementById('devDelay');
      if (slider) { slider.value = App.netDelay; document.getElementById('devDelayOut').textContent = App.netDelay + 'ms'; }
    }
    var rmBtn = document.getElementById('devRm');
    if (rmBtn) rmBtn.dataset.on = root.getAttribute('data-rm') === '1' ? '1' : '0';
    var slowBtn = document.getElementById('devSlow');
    if (slowBtn) slowBtn.dataset.on = root.getAttribute('data-slow') === '1' ? '1' : '0';
  }

  /* 로딩 상태 강제 시에는 스켈레톤에서 멈춘다 */
  function loadDelay() {
    var HOLD = 10000000;
    return App.forceState === 'loading' ? HOLD : App.netDelay;
  }

  /* ==========================================================
     19-B. 모션 바로가기 바 (참고용)
     각 항목은 "해당 모션이 실제로 일어나는 상태"까지 앱을 몰고 간 뒤 재생한다.
     ========================================================== */
  var MOTIONS = [
    {
      k: 'trans1', label: 'Trans1 Push / Pop', spec: 'd6 · emphasized-enter + 딤 ink-12',
      run: function () {
        goto('home', function () {
          App.detailId = 'R02';
          scr('detail').dataset.rendered = '';
          navigate('detail', { type: 'push', params: { id: 'R02' }, force: true });
          after(T.d6 + T.d8 + T.d5, function () { back({ force: true }); });
        });
      }
    },
    {
      k: 'edge', label: '엣지 스와이프 Pop', spec: '1:1 추종 · 임계 40% / 0.5px/ms · 정착 = Pop 동일',
      run: function () {
        goto('home', function () {
          App.detailId = 'R04';
          scr('detail').dataset.rendered = '';
          navigate('detail', { type: 'push', params: { id: 'R04' }, force: true });
          after(T.d6 + T.d4, function () { simulateEdgeSwipe(); });
        });
      }
    },
    {
      k: 'trans2', label: 'Trans2 모달(기록)', spec: 'd7 · enter 400ms · 배경 0.94 · 탭바 d4',
      run: function () { goto('home', function () { Modal.openRecord('R01'); }); }
    },
    {
      k: 'trans3', label: 'Trans3 탭 페이드', spec: 'd2·exit -> 100ms -> d4·enter · scale 없음',
      run: function () {
        goto('home', function () {
          navigate('explore', { type: 'tab', force: true });
          after(T.d2 + T.dl100 + T.d4 + T.d5, function () { navigate('home', { type: 'tab', force: true }); });
        });
      }
    },
    {
      k: 'trans5', label: 'Trans5 루트 교체', spec: 'd4 · standard · 탭바 delay 80 상승',
      run: function () {
        goto('login', function () { after(T.d5, function () { navigate('home', { type: 'root', force: true }); }); });
      }
    },
    {
      k: 'sheet', label: '시트 스냅 3단', spec: 'Peek 200 / Half 50vh / Full 95vh · d5·enter',
      run: function () {
        goto('explore', function () {
          var s = scr('explore')._sheet;
          if (!s) return;
          s.open(0);
          after(T.d6 + T.d4, function () { s.snapTo(1); });
          after(T.d6 + T.d4 + T.d5 + T.d4, function () { s.snapTo(2); });
          after(T.d6 + T.d4 + (T.d5 + T.d4) * 2, function () { s.snapTo(0); });
        });
      }
    },
    {
      k: 'preview', label: '미리보기 -> 상세 확장', spec: '상향 40% / 0.5px/ms · 뒤로 = 복원',
      run: function () {
        goto('explore', function () {
          var p = q('[data-pin="R02"]', scr('explore'));
          if (p) p.click();
        });
      }
    },
    {
      k: 'reveal', label: '점수 공개 (Celebrate)', spec: '딤 d4 -> 배지 d8·overshoot -> count-up 600 linear',
      run: function () {
        goto('home', function () {
          Modal.openRecord('R01');
          after(T.d7 + T.d2, function () {
            Modal.grade = 'good';
            Modal.compareIndex = 2;
            Modal.compareTotal = 2;
            Modal.step = 3;
            Modal.paint();
          });
        });
      }
    },
    {
      k: 'skeleton', label: '스켈레톤 200/300 정책', spec: '200ms 지연 노출 · 최소 300ms 유지',
      run: function () {
        setDelay(1200);
        goto('home', function () { var h = scr('home'); if (h._reload) h._reload(h._cur()); });
      }
    },
    {
      k: 'wish', label: '찜 낙관적 + 실패 역전', spec: '즉시 반영 d3 · 실패 = 역전 + Toast (shake 금지)',
      run: function () {
        setState('error');
        setDelay(600);
        goto('home', function () {
          after(T.d5, function () {
            var b = q('#homePane [data-wish]', scr('home'));
            if (b) b.click();
          });
        });
      }
    },
    {
      k: 'dialog', label: '다이얼로그', spec: 'scale .94->1 + fade d5·enter · scrim 50ms 늦게 소멸',
      run: function () {
        goto('home', function () {
          Dialog.show({ title: '기록을 그만둘까요?', desc: '지금 나가면 고른 내용은 저장되지 않아요.', cancel: '이어서 쓰기', ok: '그만두기', danger: true });
        });
      }
    },
    {
      k: 'toast', label: '토스트 교체', spec: 'y+8->0 fade d4·enter / 소멸 d2·exit · 스택 금지',
      run: function () {
        goto('home', function () {
          Toast.show('첫 번째 토스트');
          after(T.d8 + T.d4, function () { Toast.show('교체된 토스트', { label: '실행 취소', onClick: function () { Toast.show('되돌렸어요'); } }); });
        });
      }
    },
    {
      k: 'components', label: '컴포넌트 모션 모음', spec: '버튼 loading · 배너 · 칩 · shake · 스켈레톤',
      run: function () { navigate('components', { type: 'push', force: true }); }
    },
    {
      k: 'empty', label: '빈 상태 순차 등장', spec: 'delay 60/120/160/200 순차 fade+up',
      run: function () { setState('empty'); goto('rank', function () { navigate('inbox', { type: 'push', force: true }); }); }
    }
  ];

  function setState(s) {
    App.forceState = s;
    syncDevState();
  }
  function setDelay(v) {
    App.netDelay = v;
    var sl = document.getElementById('devDelay');
    if (sl) { sl.value = v; document.getElementById('devDelayOut').textContent = v + 'ms'; }
  }
  /* 모달·다이얼로그를 닫고 목표 화면으로 이동한 뒤 콜백 */
  function goto(route, done) {
    if (Modal.open) Modal.close();
    Dialog.hide();
    var wait = Modal.open ? T.d5 + T.d2 : 0;
    after(wait, function () {
      var cur = current();
      if (cur && cur.route === route) { done && done(); return; }
      navigate(route, { type: TAB_ROUTES[route] ? 'tab' : 'root', force: true });
      after(T.d2 + T.dl100 + T.d4 + T.d2, function () { done && done(); });
    });
  }
  /* 엣지 스와이프 프로그램 재생 — 실제 포인터 로직과 같은 경로를 탄다 */
  function simulateEdgeSwipe() {
    var r = frame.getBoundingClientRect();
    var y = r.top + r.height / 2;
    function pe(type, x) {
      return new PointerEvent(type, { clientX: x, clientY: y, pointerId: 99, bubbles: true, isPrimary: true });
    }
    frame.dispatchEvent(pe('pointerdown', r.left + 6));
    var steps = 12, i = 0;
    (function tick() {
      i++;
      var x = r.left + 6 + (r.width * 0.55) * (i / steps);
      frame.dispatchEvent(pe('pointermove', x));
      if (i < steps) after(readTime('--d1') / 2, tick);
      else frame.dispatchEvent(pe('pointerup', x));
    })();
  }

  function buildMotionbar() {
    var list = document.getElementById('motionList');
    if (!list) return;
    list.innerHTML = MOTIONS.map(function (m, i) {
      return '<button type="button" class="motionbtn" data-motion="' + i + '" title="' + esc(m.spec) + '">' +
        '<span class="motionbtn__l">' + esc(m.label) + '</span>' +
        '<span class="motionbtn__s">' + esc(m.spec) + '</span></button>';
    }).join('');
    delegate(list, 'click', '[data-motion]', function (e, t) {
      var m = MOTIONS[Number(t.dataset.motion)];
      qa('.motionbtn', list).forEach(function (b) { b.classList.toggle('is-on', b === t); });
      document.getElementById('motionHint').textContent = m.label + ' — ' + m.spec;
      if (m.k !== 'wish') setState('normal');
      if (m.k !== 'skeleton') setDelay(m.k === 'wish' ? 600 : 200);
      m.run();
    });
  }

  /* ==========================================================
     20. 부팅
     ========================================================== */
  function boot() {
    buildTabbar();
    bindDevbar();
    buildMotionbar();
    applyUrlParams();
    syncDevState();

    var start = (location.hash || '').replace('#', '');
    var openModalOnBoot = start === 'record';
    if (openModalOnBoot) start = 'home';
    if (ROUTE_ORDER.indexOf(start) < 0) start = 'login';

    var el = renderIfNeeded(start, {});
    show(el);
    App.stack = [{ route: start, params: {} }];
    App.tab = TAB_ROUTES[start] || 'home';
    applyChrome(start);
    syncTabbar();
    location.hash = start;
    if (openModalOnBoot) after(readTime('--d1'), function () { Modal.openRecord(); });

    on(window, 'hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (!h || h === 'record') return;
      var cur = current();
      if (cur && cur.route === h) return;
      if (App.locked) return;
      var idx = -1;
      App.stack.forEach(function (s, i) { if (s.route === h) idx = i; });
      if (idx > -1 && idx === App.stack.length - 2) back({ force: true });
      else navigate(h, { type: ROUTE_ORDER.indexOf(h) < 3 ? 'root' : 'push', force: true });
    });

    window.HOTAM = { App: App, navigate: navigate, back: back, Modal: Modal, Toast: Toast, T: T };
  }

  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', boot);
  else boot();
})();
