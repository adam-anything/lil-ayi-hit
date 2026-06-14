/* ============================================================
   LIL AYI HIT // APHELION  —  warp engine
   ============================================================ */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- STARFIELD / WARP ---------- */
  const cv = $('#stars'), cx = cv.getContext('2d');
  let W, H, CX, CY, DPR = Math.min(devicePixelRatio || 1, 2);
  let stars = [], N = 0;
  let speed = 0.6, target = 0.6;          // warp throttle
  let mx = 0, my = 0, px = 0, py = 0;     // parallax

  function resize() {
    W = cv.width = innerWidth * DPR;
    H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    CX = W / 2; CY = H / 2;
    N = Math.min(820, Math.floor((innerWidth * innerHeight) / 1600));
    stars = [];
    for (let i = 0; i < N; i++) stars.push(newStar(true));
  }
  function newStar(spread) {
    const z = spread ? Math.random() * W : W;
    return {
      x: (Math.random() * 2 - 1) * W,
      y: (Math.random() * 2 - 1) * H,
      z,
      pz: z,
      // tint: mostly white, some phosphor green / faint red
      t: Math.random()
    };
  }
  function colorFor(t, a) {
    if (t > 0.92) return `rgba(255,90,110,${a})`;      // red glitter sparks
    if (t > 0.74) return `rgba(125,252,174,${a})`;     // phosphor
    return `rgba(220,240,255,${a})`;                   // white
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(40, now - last) / 16.67; last = now;
    speed += (target - speed) * 0.06;
    px += (mx - px) * 0.05; py += (my - py) * 0.05;

    cx.fillStyle = 'rgba(4,6,13,0.32)';
    cx.fillRect(0, 0, W, H);

    const cxp = CX + px * 60 * DPR, cyp = CY + py * 60 * DPR;
    const warp = speed > 4;
    for (let i = 0; i < N; i++) {
      const s = stars[i];
      s.pz = s.z;
      s.z -= speed * 6 * dt;
      if (s.z < 1) { stars[i] = newStar(false); continue; }
      const k = 128 / s.z, kp = 128 / s.pz;
      const x = s.x * k + cxp, y = s.y * k + cyp;
      const xp = s.x * kp + cxp, yp = s.y * kp + cyp;
      if (x < 0 || x > W || y < 0 || y > H) continue;
      const depth = 1 - s.z / W;
      const a = Math.min(1, depth * 1.3);
      const r = Math.max(0.4, depth * 2.4) * DPR;
      if (warp) {
        cx.strokeStyle = colorFor(s.t, a);
        cx.lineWidth = r;
        cx.beginPath(); cx.moveTo(xp, yp); cx.lineTo(x, y); cx.stroke();
      } else {
        cx.fillStyle = colorFor(s.t, a);
        cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.fill();
      }
    }
    requestAnimationFrame(loop);
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);

  // gentle idle pulse so the field never feels dead
  if (!reduce) setInterval(() => { if (target <= 0.7) target = 1.4; setTimeout(() => { if (target === 1.4) target = 0.6; }, 700); }, 9000);

  /* ---------- PARALLAX + RETICLE ---------- */
  const ret = $('#reticle');
  addEventListener('pointermove', e => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
    if (ret) { ret.style.left = e.clientX + 'px'; ret.style.top = e.clientY + 'px'; }
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    const hot = e.target.closest('a,button,iframe');
    if (ret) ret.classList.toggle('hot', !!hot);
  });

  /* ---------- WARP NAVIGATION ---------- */
  const flash = $('#warpflash');
  const screens = { hero: $('#hero'), music: $('#music'), video: $('#video'), about: $('#about'), connect: $('#connect') };
  const navBtns = [...document.querySelectorAll('#nav button')];
  let current = 'hero', busy = false;

  const DEST = {
    hero:    { name: 'APHELION',  coord: '[47.92, -122.33, 10.01]', spd: '34.4' },
    music:   { name: 'LISTEN-01', coord: '[12.07,  88.41,  4.20]',  spd: '61.7' },
    video:   { name: 'VISUAL-02', coord: '[-9.55,  33.10, 27.88]',  spd: '47.3' },
    about:   { name: 'ORIGIN-03', coord: '[ 0.00,   0.00,  0.00]',  spd: '12.9' },
    connect: { name: 'SIRIUS',    coord: '[88.21, -14.66, 99.04]',  spd: '88.0' }
  };

  function setHud(id) {
    const d = DEST[id]; if (!d) return;
    $('#hudDest').textContent = d.name;
    $('#hudCoord').textContent = d.coord;
    $('#hudSpeed').textContent = d.spd;
  }

  function go(id) {
    if (busy || id === current || !screens[id]) return;
    busy = true;
    target = reduce ? 0.6 : 30;            // engage warp
    flash.classList.add('on');
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.go === id));

    setTimeout(() => {
      screens[current].classList.remove('active');
      screens[id].classList.add('active');
      screens[id].scrollTop = 0;
      setHud(id);
      current = id;
    }, reduce ? 60 : 320);

    setTimeout(() => { flash.classList.remove('on'); target = 0.6; busy = false; }, reduce ? 200 : 760);
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go]');
    if (t) { e.preventDefault(); go(t.dataset.go); }
  });

  // keyboard: arrows / numbers
  const order = ['hero', 'music', 'video', 'about', 'connect'];
  addEventListener('keydown', e => {
    const i = order.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(order[Math.min(order.length - 1, i + 1)]);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(order[Math.max(0, i - 1)]);
    else if (/^[1-5]$/.test(e.key)) go(order[+e.key - 1]);
  });

  /* ---------- SATURN (about) ---------- */
  const sc = $('#aboutSaturn');
  if (sc) {
    const g = sc.getContext('2d'), S = sc.width, c = S / 2, R = S * 0.20;
    let rot = 0;
    function saturn() {
      g.clearRect(0, 0, S, S);
      g.save(); g.translate(c, c);
      // glow
      const gl = g.createRadialGradient(0, 0, R, 0, 0, R * 3.4);
      gl.addColorStop(0, 'rgba(125,252,174,0.18)'); gl.addColorStop(1, 'rgba(125,252,174,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(0, 0, R * 3.4, 0, 6.283); g.fill();

      // back half of rings
      g.rotate(-0.45);
      drawRings(g, R, true);
      g.rotate(0.45);

      // planet body
      const bg = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.15);
      bg.addColorStop(0, '#bfe8cf'); bg.addColorStop(0.45, '#5fae84'); bg.addColorStop(1, '#143524');
      g.fillStyle = bg; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();
      // bands
      g.save(); g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.clip();
      for (let i = -4; i <= 4; i++) {
        g.globalAlpha = 0.12 + (i % 2 ? 0.06 : 0);
        g.fillStyle = i % 2 ? '#0c2a1c' : '#a7dcbd';
        g.fillRect(-R, i * R * 0.22 + Math.sin(rot + i) * 2, R * 2, R * 0.16);
      }
      g.restore(); g.globalAlpha = 1;
      // terminator shadow
      const sh = g.createLinearGradient(-R, 0, R, 0);
      sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = sh; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();

      // front half of rings
      g.rotate(-0.45);
      drawRings(g, R, false);
      g.restore();

      rot += 0.01;
      requestAnimationFrame(saturn);
    }
    function drawRings(g, R, back) {
      const rx = R * 2.15, ry = R * 0.62;
      const bands = [[1.35, 'rgba(220,240,255,0.0)'], [1.55, 'rgba(190,230,210,0.85)'],
                     [1.78, 'rgba(125,252,174,0.55)'], [1.95, 'rgba(120,170,150,0.25)'],
                     [2.15, 'rgba(255,90,110,0.30)']];
      g.lineWidth = R * 0.11;
      for (let i = 1; i < bands.length; i++) {
        const f = bands[i][0];
        g.strokeStyle = bands[i][1];
        g.beginPath();
        g.ellipse(0, 0, R * f, R * f * 0.29, 0, back ? Math.PI : 0, back ? 2 * Math.PI : Math.PI);
        g.stroke();
      }
    }
    if (reduce) { saturn = (function (orig) { return function () { rot = 0.3; orig(); }; })(saturn); }
    requestAnimationFrame(saturn);
  }

  /* ---------- BOOT SEQUENCE ---------- */
  const boot = $('#boot'), term = $('#bootTerm'), bar = $('#bootBar');
  const lines = [
    '> APHELION OS v2.6 // cold start',
    '> calibrating star charts ........ OK',
    '> locking signal: LIL AYI HIT .... OK',
    '> ring orbit: SATURN ............. STABLE',
    '> genre constraints .............. NONE FOUND',
    '> ready. welcome aboard, traveler.'
  ];
  let li = 0, ch = 0, txt = '';
  function type() {
    if (li >= lines.length) { finishBoot(); return; }
    const line = lines[li];
    if (ch <= line.length) {
      txt = lines.slice(0, li).map(l => `<span class="c">${l}</span>`).join('<br>');
      txt += (li ? '<br>' : '') + line.slice(0, ch) + '<span class="blink">▍</span>';
      term.innerHTML = txt;
      bar.style.width = Math.min(100, ((li + ch / line.length) / lines.length) * 100) + '%';
      ch++;
      setTimeout(type, reduce ? 4 : 16 + Math.random() * 26);
    } else { li++; ch = 0; setTimeout(type, reduce ? 30 : 230); }
  }
  function finishBoot() {
    bar.style.width = '100%';
    setTimeout(() => {
      boot.classList.add('gone');
      target = reduce ? 0.6 : 16;
      flash.classList.add('on');
      setTimeout(() => { flash.classList.remove('on'); target = 0.6; }, 900);
      setHud('hero');
    }, 650);
  }
  // allow skip
  boot.addEventListener('click', finishBoot);
  setTimeout(type, 500);
})();
