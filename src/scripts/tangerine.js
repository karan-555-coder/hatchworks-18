/*
 * Tangerine Cobalt skin: behaviour.
 *
 * Purely presentational. It never moves, removes or rewrites content; it only
 *   - tags existing elements (tg-card, tg-btn, tg-pill, tg-img, tg-prose-link) so styles/tangerine.css
 *     can restyle the site's hand-built blocks,
 *   - plays one-off blur-to-focus reveals as tagged elements scroll into view; large headings
 *     arrive as a glacier-blue outline that fills with ink (tg-ink),
 *   - lights hoverable cards with a spotlight that follows the pointer,
 *   - adds an aria-hidden, pointer-events:none dot grid that drifts with scroll, and a progress rule,
 *   - tangerines background film into a pale ice glow (tg-sunwash) and inks white logos (tg-inv).
 * No dependencies. Respects prefers-reduced-motion; the spotlight only runs for fine pointers.
 */
(function () {
  'use strict';
  if (window.__tgSkin) return;
  window.__tgSkin = true;

  var doc = document, root = doc.documentElement, body = doc.body;
  if (!body) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var seen = new WeakSet();
  var cardRects = new Map();
  var OWN_REVEAL = '[class*="reveal"],[data-aos],[class*="animat"],.elementor-invisible,[class*="fade"]';
  var SKIP_MOTION = '[class*="marquee"],[class*="swiper"],[class*="slick"],[class*="carousel"],[class*="ticker"],[class*="slider"]';

  var bodyScroller = false;
  function detectScroller() {
    var ho = getComputedStyle(root).overflowY, bo = getComputedStyle(body).overflowY;
    bodyScroller = (ho === 'hidden' || ho === 'clip') && (bo === 'auto' || bo === 'scroll') && body.scrollHeight > body.clientHeight + 40;
  }
  function scrollTop() { return bodyScroller ? body.scrollTop : window.scrollY; }

  // ---- helpers ---------------------------------------------------------------
  function rgba(str) {
    var m = /rgba?\(([^)]+)\)/.exec(str || '');
    if (!m) return [0, 0, 0, 0];
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1];
  }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function chroma(c) { return (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])) / 255; }
  function px(v) { return parseFloat(v) || 0; }
  function fourBorders(cs) {
    return px(cs.borderTopWidth) >= 1 && px(cs.borderRightWidth) >= 1 && px(cs.borderBottomWidth) >= 1 && px(cs.borderLeftWidth) >= 1 &&
      cs.borderTopStyle !== 'none' && cs.borderLeftStyle !== 'none' && rgba(cs.borderTopColor)[3] >= 0.1;
  }
  function ownText(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
    return false;
  }

  var CARD_TAGS = { DIV: 1, ARTICLE: 1, LI: 1, A: 1, SECTION: 1, ASIDE: 1, FIGURE: 1, FORM: 1, BLOCKQUOTE: 1, DETAILS: 1 };
  var PILL_TAGS = { SPAN: 1, DIV: 1, A: 1, LI: 1, BUTTON: 1, P: 1 };
  var BAND_TAGS = { DIV: 1, SECTION: 1, FOOTER: 1, HEADER: 1, MAIN: 1, ARTICLE: 1 };

  // ---- tagging ---------------------------------------------------------------
  function scan() {
    var vw = root.clientWidth, vh = window.innerHeight, sy = window.scrollY;
    var els = body.querySelectorAll('div,section,article,li,a,button,aside,figure,form,blockquote,details,span,p,img,footer,header,main');
    var todo = [];

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (seen.has(el) || el.__tgTagged) continue;
      if (el.closest('svg')) { seen.add(el); continue; }
      var r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 14) continue;          // hidden for now: look again later
      seen.add(el);
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var tag = el.tagName, w = r.width, h = r.height;
      var inNav = !!el.closest('#hwnav');
      var item = { el: el, r: r, cls: [] };

      if (tag === 'IMG') {
        var src = el.currentSrc || el.src || '';
        if (w >= 260 && h >= 150 && /\.(jpe?g|webp)(\?|$)/i.test(src) && !el.closest(SKIP_MOTION) && !inNav) {
          var pc = el.closest('.tg-card'), pr = pc && cardRects.get(pc);
          if (!(pr && w >= pr.width - 6)) { item.cls.push('tg-img'); item.fx = 'tg-fx-photo'; }
          else item.cls.push('tg-img');
        }
        if (item.cls.length) todo.push(item);
        continue;
      }

      var bg = rgba(cs.backgroundColor);
      var radius = px(cs.borderTopLeftRadius);
      var bordered = fourBorders(cs);
      var fixed = cs.position === 'fixed' || cs.position === 'sticky';
      var roundish = radius >= Math.min(w, h) / 2 - 2;
      var txt = null;

      if ((tag === 'A' || tag === 'BUTTON' || el.getAttribute('role') === 'button') && h >= 26 && h <= 86 && w >= 64 && w <= 480 &&
          (bg[3] >= 0.6 || bordered) && cs.display !== 'inline') {
        txt = ownText(el);
        if (txt.length >= 2 && txt.length <= 48 && !el.querySelector('img,picture,video')) item.cls.push('tg-btn');
      }

      if (!item.cls.length && PILL_TAGS[tag] && h >= 18 && h <= 42 && w >= 34 && w <= 280 && radius >= 8 &&
          (bg[3] >= 0.5 || bordered) && el.children.length <= 3 && !inNav) {
        txt = txt === null ? ownText(el) : txt;
        if (txt.length >= 2 && txt.length <= 34) item.cls.push('tg-pill');
      }

      if (!item.cls.length && CARD_TAGS[tag] && !inNav && !fixed && !roundish && w >= 150 && h >= 80 && w <= vw * 0.94) {
        var isCard = bordered || (radius >= 6 && bg[3] >= 0.5) || (cs.boxShadow !== 'none' && radius >= 4 && bg[3] >= 0.5);
        if (isCard) {
          var p = el.parentElement, dup = false, depth = 0;
          while (p && depth < 4) {
            var prc = cardRects.get(p);
            if (prc && Math.abs(prc.width - w) < 14 && Math.abs(prc.height - h) < 14) { dup = true; break; }
            p = p.parentElement; depth++;
          }
          if (!dup) {
            cardRects.set(el, r);
            item.cls.push('tg-card');
            item.fx = 'tg-fx-up';
            // lift only where nothing else owns the motion, and never inside moving strips
            if (h < 640 && (tag === 'A' || cs.cursor === 'pointer' || el.querySelector('a[href]')) &&
                cs.translate === 'none' && !el.closest(SKIP_MOTION) && !el.parentElement.closest('.tg-card')) item.cls.push('tg-hot');
          }
        }
      }

      // full-width bands: background film is sun-washed; dark photography keeps light ink
      if (!item.cls.length && BAND_TAGS[tag] && !inNav && !fixed && w >= vw * 0.98 && h >= 180 && !el.closest('.tg-darkzone')) {
        var media = el.querySelector('video');
        var mr = media && media.getBoundingClientRect();
        if (mr && mr.width >= w * 0.6 && mr.height >= h * 0.5) media.classList.add('tg-sunwash');   // background film: washed into the sand
        else if (/url\(/.test(cs.backgroundImage)) checkDarkImage(el, cs.backgroundImage);
      }

      if (!item.cls.length && tag === 'A' && cs.display === 'inline' && el.getAttribute('href') && !inNav &&
          el.closest('p,li') && !el.closest('footer,nav,.hwf-shell,[class*="menu"],[class*="breadcrumb"]') && !el.querySelector('img,svg') &&
          cs.backgroundImage === 'none') {
        item.cls.push('tg-prose-link');
      }

      if (!item.cls.length) continue;
      todo.push(item);
    }

    // display headings: masked rise + highlighter marks on their accent words
    var heads = body.querySelectorAll('h1,h2,h3,.elementor-heading-title');
    for (var k = 0; k < heads.length; k++) {
      var hd = heads[k];
      if (seen.has(hd) || hd.__tgTagged) continue;
      var hr = hd.getBoundingClientRect();
      if (hr.width < 24 || hr.height < 10) continue;
      seen.add(hd);
      if (hd.closest('#hwnav') || hd.closest('.tg-btn')) continue;
      var fs = parseFloat(getComputedStyle(hd).fontSize);
      if (fs < 24) continue;
      var it2 = { el: hd, r: hr, cls: [], marks: [], ink: false };   // no outline-to-fill in this variant
      if (hd.tagName !== 'H3' && !hd.closest(SKIP_MOTION) && !hd.closest('footer,[class*="hwf-"]')) it2.fx = 'tg-fx-rise';
      todo.push(it2);
    }

    // write phase
    var siblingIndex = new Map();
    for (var j = 0; j < todo.length; j++) {
      var it = todo[j], e = it.el;
      e.__tgTagged = true;
      if (it.ink) e.__tgInk = true;
      for (var c = 0; c < it.cls.length; c++) e.classList.add(it.cls[c]);
      if (it.marks) for (var g = 0; g < it.marks.length; g++) {
        var mk = it.marks[g];
        mk.classList.add('tg-mark');
        mk.style.setProperty('--tg-md', (0.35 + g * 0.18).toFixed(2) + 's');
        // on dark surfaces the accent text is light: a tangerine swipe reads better than saffron
        if (lum(rgba(getComputedStyle(mk).color)) > 0.45) mk.style.setProperty('--tg-mark-c', 'rgba(200,85,61,.6)');
        if (markIO) markIO.observe(mk); else mk.classList.add('tg-marked');
      }

      if (!heroDone && !reduce && e.tagName === 'H1' && it.r.top < vh * 0.8 && it.r.bottom > 0 && !e.matches(OWN_REVEAL)) {
        heroDone = true;
        var hcs2 = getComputedStyle(e);
        if (parseFloat(hcs2.opacity) >= 0.99 && hcs2.animationName === 'none') {
          e.classList.add('tg-hero-rise');
          if (e.__tgInk) e.classList.add('tg-ink');
          e.addEventListener('animationend', function done(ev) {
            if (ev.target !== this) return;
            this.classList.remove('tg-hero-rise', 'tg-ink');
            this.removeEventListener('animationend', done);
          });
        }
        continue;
      }

      if (it.fx && !reduce && io && it.r.top > vh * 0.92 && !e.closest('.tg-wait') && !e.closest(SKIP_MOTION) && !e.matches(OWN_REVEAL)) {
        var ecs = getComputedStyle(e);
        if (parseFloat(ecs.opacity) >= 0.99 && ecs.animationName === 'none') {
          var parent = e.parentElement, n = siblingIndex.get(parent) || 0;
          siblingIndex.set(parent, n + 1);
          e.style.setProperty('--tg-d', Math.min(n, 5) * 80 + 'ms');
          e.__tgFx = it.fx;
          e.classList.add('tg-wait');
          io.observe(e);
        }
      }
    }
    if (todo.length) inkImagesSoon();
  }
  var heroDone = false;

  // ---- dark photography -------------------------------------------------------------------
  var probe = doc.createElement('canvas');
  probe.width = probe.height = 40;
  var pctx = null;
  try { pctx = probe.getContext('2d', { willReadFrequently: true }); } catch (e) { pctx = null; }
  function sample(img) {
    pctx.clearRect(0, 0, 40, 40);
    pctx.drawImage(img, 0, 0, 40, 40);
    return pctx.getImageData(0, 0, 40, 40).data;
  }
  function checkDarkImage(band, bgi) {
    var m = /url\(["']?([^"')]+)["']?\)/.exec(bgi || '');
    if (!m || !pctx) return;
    var im = new Image();
    im.onload = function () {
      try {
        var d = sample(im), l = 0, n = 0;
        for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; l += lum([d[i], d[i + 1], d[i + 2]]); n++; }
        if (n < 800 || l / n > 0.22) return;
      } catch (e) { return; }
      var bcs = getComputedStyle(band);
      var zone = (bcs.position === 'absolute' || bcs.position === 'fixed') && !ownText(band) ? band.parentElement : band;
      if (zone) zone.classList.add('tg-darkzone');
    };
    im.src = m[1];
  }

  // ---- white logos on transparent backgrounds --------------------------------------------
  var inked = new WeakSet(), inkTimer = 0;
  function inkImagesSoon() { clearTimeout(inkTimer); inkTimer = setTimeout(inkImages, 300); }
  function inkImages() {
    var imgs = body.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (inked.has(im)) continue;
      if (!im.complete || !im.naturalWidth) {
        if (!im.__tgWait) { im.__tgWait = true; im.addEventListener('load', inkImagesSoon, { once: true }); }
        continue;
      }
      var src = im.currentSrc || im.src || '';
      if (!/\.(png|svg|gif|webp)(\?|#|$)/i.test(src)) { inked.add(im); continue; }
      var r = im.getBoundingClientRect();
      if (r.width < 14 || r.height < 10) continue;
      inked.add(im);
      if (im.closest('.tg-darkzone,.hwts')) continue;
      var f = getComputedStyle(im).filter;
      if (f && f !== 'none') {
        if (/invert\(/.test(f)) im.classList.add('tg-inv-force');   // logos forced to white
        continue;
      }
      if (pctx && isLightInk(im)) im.classList.add('tg-inv');
    }
  }
  function isLightInk(im) {
    try {
      var d = sample(im), clear = 0, ink = 0, l = 0, c = 0;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 24) { clear++; continue; }
        if (d[i + 3] < 160) continue;
        ink++;
        l += lum([d[i], d[i + 1], d[i + 2]]);
        c += chroma([d[i], d[i + 1], d[i + 2]]);
      }
      return clear / (d.length / 4) > 0.18 && ink > 12 && l / ink > 0.72 && c / ink < 0.2;
    } catch (e) { return false; }   // cross-origin or undecodable: leave as is
  }

  // Accent words: inline runs inside a heading whose colour is saturated (the brand accents,
  // now tangerine / olive / saffron) and differs from the heading's own colour.
  function markTargets(hd) {
    var out = [], base = getComputedStyle(hd).color;
    var kids = hd.querySelectorAll('span,strong,em,b,i,mark');
    for (var i = 0; i < kids.length && out.length < 4; i++) {
      var k = kids[i];
      if (!hasOwnText(k) || k.closest('a,svg') || k.parentElement.closest('.tg-mark')) continue;
      var kc = getComputedStyle(k);
      if (kc.color === base || kc.backgroundImage !== 'none' || rgba(kc.backgroundColor)[3] > 0.1) continue;
      if (chroma(rgba(kc.color)) < 0.22) continue;
      out.push(k);
    }
    return out;
  }
  var markIO = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { markIO.unobserve(en.target); en.target.classList.add('tg-marked'); }
    });
  }, { threshold: 0.6 }) : null;

  // ---- reveal on scroll ---------------------------------------------------------
  function reveal(el) {
    if (!el.classList.contains('tg-wait')) return;
    el.classList.remove('tg-wait');
    el.classList.add('tg-in', el.__tgFx || 'tg-fx-up');
    if (el.__tgInk) el.classList.add('tg-ink');
    var done = function () {
      el.classList.remove('tg-in', 'tg-fx-rise', 'tg-fx-up', 'tg-fx-photo', 'tg-ink');
      el.style.removeProperty('--tg-d');
      el.removeEventListener('animationend', onEnd);
    };
    var onEnd = function (ev) { if (ev.target === el) done(); };
    el.addEventListener('animationend', onEnd);
    setTimeout(done, 2200);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { io.unobserve(en.target); reveal(en.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }) : null;

  function sweep() {
    var waiting = doc.querySelectorAll('.tg-wait'), limit = window.innerHeight;
    for (var i = 0; i < waiting.length; i++) {
      var r = waiting[i].getBoundingClientRect();
      if (r.top < limit || r.width === 0) { if (io) io.unobserve(waiting[i]); reveal(waiting[i]); }
    }
  }
  window.addEventListener('beforeprint', function () {
    doc.querySelectorAll('.tg-wait').forEach(function (el) { el.classList.remove('tg-wait'); });
    doc.querySelectorAll('.tg-mark').forEach(function (el) { el.classList.add('tg-marked'); });
  });

  // ---- magnetic buttons -------------------------------------------------------------
  var magnet = null, magRect = null, magX = 0, magY = 0, magFrame = 0;
  function endMagnet() {
    if (!magnet) return;
    var m = magnet;
    magnet = null; magRect = null;
    m.classList.remove('tg-spot');
  }
  function paintMagnet() {
    magFrame = 0;
    if (!magnet || !magRect) return;
    var r = magRect;
    magnet.style.setProperty('--tg-mx', (magX - r.left).toFixed(0) + 'px');
    magnet.style.setProperty('--tg-my', (magY - r.top).toFixed(0) + 'px');
  }
  if (false) {   // no card spotlight in this variant: confetti + jelly instead
    doc.addEventListener('pointermove', function (ev) {
      if (ev.pointerType && ev.pointerType !== 'mouse') return;
      var t = ev.target && ev.target.closest ? ev.target.closest('.tg-card.tg-hot') : null;
      if (t && (t.closest(SKIP_MOTION) || t.classList.contains('tg-wait'))) t = null;
      if (t !== magnet) {
        endMagnet();
        if (t) {
          magnet = t;
          magRect = t.getBoundingClientRect();
          t.classList.add('tg-spot');
        }
      }
      if (!magnet) return;
      magRect = magnet.getBoundingClientRect();
      magX = ev.clientX; magY = ev.clientY;
      if (!magFrame) magFrame = requestAnimationFrame(paintMagnet);
    }, { passive: true });
    doc.addEventListener('pointerleave', endMagnet);
    window.addEventListener('blur', endMagnet);
  }

  // ---- paper grain + progress rule -----------------------------------------------------
  var grain = doc.createElement('div');
  grain.className = 'tg-grain';
  grain.setAttribute('aria-hidden', 'true');
  body.appendChild(grain);

  var bar = doc.createElement('div');
  bar.className = 'tg-progress';
  bar.setAttribute('aria-hidden', 'true');
  body.appendChild(bar);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var sy = scrollTop(), vh = window.innerHeight;
      var max = bodyScroller ? body.scrollHeight - body.clientHeight : root.scrollHeight - vh;
      bar.style.setProperty('--tg-progress', max > 0 ? Math.min(1, sy / max).toFixed(4) : 0);
      if (!reduce) grain.style.setProperty('--tg-par', (-sy * 0.18).toFixed(1) + 'px');
    });
  }
  var sweepAt = 0;
  doc.addEventListener('scroll', function () {
    onScroll();
    if (magnet) endMagnet();
    var now = Date.now();
    if (now - sweepAt > 140) { sweepAt = now; sweep(); }
  }, { passive: true, capture: true });
  doc.addEventListener('scrollend', sweep, { passive: true, capture: true });

  // ---- lifecycle ------------------------------------------------------------------------
  var scanTimer = 0;
  function scanSoon(ms) { clearTimeout(scanTimer); scanTimer = setTimeout(function () { scan(); sweep(); }, typeof ms === 'number' ? ms : 160); }

  detectScroller();
  scan();
  onScroll();
  function rescan() { seen = new WeakSet(); scanSoon(60); }
  doc.addEventListener('DOMContentLoaded', rescan);
  window.addEventListener('load', function () { detectScroller(); rescan(); inkImagesSoon(); setTimeout(sweep, 2500); });
  setTimeout(rescan, 1600);

  ['click', 'keyup', 'change'].forEach(function (t) {
    doc.addEventListener(t, function () { scanSoon(140); setTimeout(scanSoon, 650); }, { passive: true });
  });
  var nav = doc.getElementById('hwnav');
  if (nav) nav.addEventListener('pointerenter', function () { scanSoon(200); }, true);

  if ('MutationObserver' in window) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.target === grain || m.target === bar) continue;
        if (m.addedNodes && m.addedNodes.length) { scanSoon(300); inkImagesSoon(); return; }
      }
    }).observe(body, { childList: true, subtree: true });
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { endMagnet(); detectScroller(); scan(); sweep(); }, 250);
  });

  // ---- confetti burst: clicking a button pops tangerine / cobalt confetti from the click point ----
  if (!reduce) {
    var burst = doc.createElement('div');
    burst.className = 'tg-confetti';
    burst.setAttribute('aria-hidden', 'true');
    body.appendChild(burst);
    var COLORS = ['#ff6a1a', '#1b45d6', '#ffb800', '#ff9a52', '#9fb6ff'];
    var BTN = '.tg-btn,.elementor-button,.hs-button,#hwnav .hw-btn,button[type="submit"],input[type="submit"],[class*="cta"]';
    doc.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest(BTN) : null;
      if (!t || burst.childElementCount > 60) return;
      for (var i = 0; i < 16; i++) {
        var p = doc.createElement('i');
        var a = (Math.PI * 2 * i) / 16 + Math.random() * 0.4, d = 50 + Math.random() * 70;
        p.className = 'tg-bit' + (i % 3 === 0 ? ' tg-bit-round' : '');
        p.style.left = ev.clientX + 'px';
        p.style.top = ev.clientY + 'px';
        p.style.background = COLORS[i % COLORS.length];
        p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * d - 30).toFixed(0) + 'px');
        p.style.setProperty('--r', (Math.random() * 540 - 270).toFixed(0) + 'deg');
        p.addEventListener('animationend', function () { this.remove(); }, { once: true });
        burst.appendChild(p);
      }
    }, true);
  }
})();
