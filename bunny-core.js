(function () {
  if (window.__focusBunnyCore) return;
  window.__focusBunnyCore = true;

  const DEFAULTS = { enabled: true, color: "cream", speed: 1, angry: true };

  const SPRITE = [
    "....o....o....",
    "...oWo..oWo...",
    "...oWo..oWo...",
    "...oPo..oPo...",
    "...oPo..oPo...",
    "...oWo..oWo...",
    "..oWWWWWWWWo..",
    "..oWWWWWWWWo..",
    "..oWWWWWWWWo..",
    "..oWEWWWWEWo..",
    "..oWEWWWWEWo..",
    "..oPWWMMWWPo..",
    "..oWWWWWWWWo..",
    "..oWWWWWWWWo..",
    "..oFFF..FFFo.."
  ];
  const GW = 14, GH = 15;

  const THEMES = {
    cream: { o: "#5b4a4a", W: "#fff7f3", P: "#f7a8c0", E: "#3a2b2b", M: "#caa0a8", S: "#f0e2db", R: "#ec4d52" },
    gray:  { o: "#3f4854", W: "#eceff3", P: "#f2a0b6", E: "#2c333d", M: "#aeb6c0", S: "#cfd6de", R: "#ec4d52" },
    brown: { o: "#4a2f1c", W: "#c9a27a", P: "#e58aa0", E: "#3a2415", M: "#7a5536", S: "#a87f59", R: "#e5484d" },
    mint:  { o: "#36584a", W: "#d7f3e4", P: "#f2a0b6", E: "#2a4338", M: "#8fc7ad", S: "#aee0c6", R: "#ec4d52" },
    pink:  { o: "#7a4a5a", W: "#ffd9e6", P: "#ff9ec0", E: "#5a3340", M: "#e090ab", S: "#f7b9cf", R: "#e5484d" }
  };

  const SCALE = 4;
  const DISP_W = GW * SCALE, DISP_H = GH * SCALE;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function retrigger(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function drawSprite(canvas, theme, angry) {
    canvas.width = GW; canvas.height = GH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, GW, GH);
    const map = { o: theme.o, W: theme.W, P: theme.P, E: theme.E, M: theme.M, F: theme.S };
    for (let y = 0; y < SPRITE.length; y++) {
      const row = SPRITE[y];
      for (let x = 0; x < row.length; x++) {
        const col = map[row[x]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (angry) {
      ctx.fillStyle = theme.o;

      ctx.fillRect(4, 8, 1, 1); ctx.fillRect(5, 9, 1, 1);
      ctx.fillRect(9, 8, 1, 1); ctx.fillRect(8, 9, 1, 1);

      ctx.fillRect(6, 12, 1, 1); ctx.fillRect(7, 12, 1, 1);

      ctx.fillStyle = theme.R;
      ctx.fillRect(3, 10, 1, 1); ctx.fillRect(3, 11, 1, 1);
      ctx.fillRect(10, 10, 1, 1); ctx.fillRect(10, 11, 1, 1);
    }
  }

  function drawAnger(canvas, theme) {
    const W = 10, H = 5;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = theme.R;
    const big = ["r...r", ".r.r.", "rrrrr", ".r.r.", "r...r"];
    for (let y = 0; y < big.length; y++)
      for (let x = 0; x < big[y].length; x++)
        if (big[y][x] === "r") ctx.fillRect(x, y, 1, 1);
    const small = ["r.r", ".r.", "r.r"];
    for (let y = 0; y < small.length; y++)
      for (let x = 0; x < small[y].length; x++)
        if (small[y][x] === "r") ctx.fillRect(7 + x, 1 + y, 1, 1);
  }

  function injectStyles() {
    if (document.getElementById("focus-bunny-style")) return;
    const css = `
#focus-bunny-root, #focus-bunny-root * { pointer-events: none; }
#focus-bunny-root {
  position: fixed; z-index: 2147483646;
}
#focus-bunny-root.fb-left { inset: 0; width: 100vw; height: 100vh; }
#focus-bunny-root.fb-center { left: 50%; bottom: 6px; width: ${DISP_W}px; height: ${DISP_H + 22}px; }
.fb-mover { position: absolute; top: 0; left: 0; will-change: transform;
  transition: transform .34s cubic-bezier(.4,0,.35,1); }
.fb-center .fb-mover { top: auto; bottom: 0; }
.fb-hopper { position: relative; width: ${DISP_W}px; height: ${DISP_H}px; }
.fb-sprite {
  position: absolute; bottom: 0; left: 0;
  width: ${DISP_W}px; height: ${DISP_H}px;
  image-rendering: pixelated; image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 0 rgba(0,0,0,.12));
}
.fb-anger {
  position: absolute; top: -6px; left: 56%;
  width: 40px; height: 20px; image-rendering: pixelated;
  display: none; transform-origin: center bottom;
  animation: fb-anger-pulse .55s ease-in-out infinite;
}
.fb-dust {
  position: absolute; bottom: 0; left: 50%; width: 26px; height: 10px;
  margin-left: -13px; opacity: 0;
  background: radial-gradient(circle at 50% 100%, rgba(180,170,160,.55), rgba(180,170,160,0) 70%);
}
.fb-hop { animation: fb-hop .34s ease-out; }
.fb-stomp { animation: fb-stomp .26s ease-out; }
.fb-dust.go { animation: fb-dust .5s ease-out; }
@keyframes fb-hop {
  0% { transform: translateY(0); }
  40% { transform: translateY(-16px); }
  100% { transform: translateY(0); }
}
@keyframes fb-stomp {
  0% { transform: translateY(0) scaleY(1); }
  35% { transform: translateY(2px) scaleY(.82) scaleX(1.08); }
  100% { transform: translateY(0) scaleY(1); }
}
@keyframes fb-anger-pulse {
  0%,100% { transform: scale(1); opacity: .9; }
  50% { transform: scale(1.22); opacity: 1; }
}
@keyframes fb-dust {
  0% { opacity: .7; transform: scaleX(.6); }
  100% { opacity: 0; transform: scaleX(1.6); }
}`;
    const style = document.createElement("style");
    style.id = "focus-bunny-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function mount(opts) {
    opts = opts || {};
    if (!document.body) return null;
    if (document.getElementById("focus-bunny-root")) return null;

    const settings = Object.assign({}, DEFAULTS, opts.settings || {});
    const theme = THEMES[settings.color] || THEMES.cream;
    const speed = clamp(Number(settings.speed) || 1, 0.5, 2);
    const anchor = opts.anchor === "center" ? "center" : "left";
    const roam = anchor === "left";

    injectStyles();

    const root = document.createElement("div");
    root.id = "focus-bunny-root";
    root.className = "fb-" + anchor;

    const mover = document.createElement("div");
    mover.className = "fb-mover";
    const hopper = document.createElement("div");
    hopper.className = "fb-hopper";

    const sprite = document.createElement("canvas");
    sprite.className = "fb-sprite";
    const anger = document.createElement("canvas");
    anger.className = "fb-anger";
    const dust = document.createElement("div");
    dust.className = "fb-dust";

    hopper.append(dust, anger, sprite);
    mover.appendChild(hopper);
    root.appendChild(mover);
    document.body.appendChild(root);

    drawAnger(anger, theme);

    let destroyed = false;
    let timer = null, stompTimer = null, calmTimer = null;
    let x = 0, y = 0, targetX = null, targetY = null;

    function maxX() { return Math.max(0, window.innerWidth - DISP_W); }
    function maxY() { return Math.max(0, window.innerHeight - DISP_H); }

    if (roam) {
      x = Math.round(Math.random() * maxX());
      y = Math.round(Math.random() * maxY());
      mover.style.transform = "translate(" + x + "px," + y + "px)";
    } else {
      mover.style.transform = "translateX(-50%)";
    }

    function hop() { retrigger(hopper, "fb-hop"); }
    function stomp() {
      retrigger(hopper, "fb-stomp");
      retrigger(dust, "go");
    }
    let facing = 1;
    function setFacing(dx) {
      const dir = dx < -1 ? -1 : dx > 1 ? 1 : facing;
      if (dir === facing) return;
      facing = dir;
      sprite.style.transform = "scaleX(" + dir + ")";
    }

    function setMood(mood) {
      drawSprite(sprite, theme, mood === "angry");
      anger.style.display = mood === "angry" && settings.angry ? "block" : "none";
    }

    function browseStep() {
      if (destroyed) return;
      if (!roam) {
        hop();
        timer = setTimeout(browseStep, (1000 + Math.random() * 2000) / speed);
        return;
      }
      const mx = maxX(), my = maxY();
      const reached = targetX === null || (Math.abs(targetX - x) < 8 && Math.abs(targetY - y) < 8);
      if (reached) {
        targetX = Math.round(Math.random() * mx);
        targetY = Math.round(Math.random() * my);
        timer = setTimeout(browseStep, (600 + Math.random() * 1500) / speed);
        return;
      }

      const step = 26 * speed;
      const dx = targetX - x, dy = targetY - y;
      const len = Math.hypot(dx, dy) || 1;
      x = clamp(x + (dx / len) * Math.min(step, Math.abs(dx) + 4), 0, mx);
      y = clamp(y + (dy / len) * Math.min(step * 0.7, Math.abs(dy) + 4), 0, my);
      setFacing(dx);
      mover.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      hop();
      timer = setTimeout(browseStep, 340 + 80 / speed);
    }

    function startBrowse() {
      setMood("happy");
      browseStep();
    }

    function startAngry() {
      setMood("angry");
      if (settings.angry) {
        stomp();
        stompTimer = setInterval(stomp, 1100);
      }

      calmTimer = setTimeout(function () {
        if (destroyed) return;
        if (stompTimer) { clearInterval(stompTimer); stompTimer = null; }
        startBrowse();
      }, 6000);
    }

    function onResize() {
      if (destroyed || !roam) return;
      x = clamp(x, 0, maxX());
      y = clamp(y, 0, maxY());
      mover.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    }
    window.addEventListener("resize", onResize);

    if (opts.mode === "angry") startAngry();
    else startBrowse();

    return {
      setMood,
      destroy() {
        destroyed = true;
        if (timer) clearTimeout(timer);
        if (stompTimer) clearInterval(stompTimer);
        if (calmTimer) clearTimeout(calmTimer);
        window.removeEventListener("resize", onResize);
        if (root.parentNode) root.parentNode.removeChild(root);
      }
    };
  }

  function pixelFontFace() {
    try {
      const url = chrome.runtime.getURL("fonts/PressStart2P.ttf");
      return `@font-face { font-family: "PixelFont"; src: url("${url}") format("truetype"); font-display: swap; }\n`;
    } catch (e) {
      return "";
    }
  }

  function injectRageStyles() {
    if (document.getElementById("focus-bunny-rage-style")) return;
    const css = pixelFontFace() + `
#focus-bunny-rage {
  position: fixed; inset: 0; z-index: 2147483647;
  width: 100vw; height: 100vh; overflow: hidden;
  background: rgba(20,4,6,.06);
  transition: background .45s ease;
  cursor: not-allowed; animation: fbr-fade .2s ease-out;
}
#focus-bunny-rage.fbr-raging {
  background: radial-gradient(circle at 50% 45%, rgba(60,8,12,.72), rgba(10,2,4,.92));
}
#focus-bunny-rage * { user-select: none; }
.fbr-stage {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  will-change: left, top;
}
.fbr-shaker {
  position: relative; transform-origin: center bottom;
  transform: scale(.16);
  transition: transform .55s cubic-bezier(.18,1.5,.4,1);
}
#focus-bunny-rage.fbr-raging .fbr-shaker { transform: scale(1); }
.fbr-sprite {
  display: block; image-rendering: pixelated; image-rendering: crisp-edges;
  filter: drop-shadow(0 8px 0 rgba(0,0,0,.25));
}
.fbr-anger {
  position: absolute; top: -8%; left: 52%;
  image-rendering: pixelated; display: none; opacity: 0;
  transform-origin: center bottom;
  transition: opacity .3s ease;
  animation: fbr-anger-pulse .5s ease-in-out infinite;
}
#focus-bunny-rage.fbr-raging .fbr-anger { opacity: 1; }
.fbr-caption {
  position: fixed; left: 0; right: 0; bottom: 7%; text-align: center;
  padding: 0 24px; opacity: 0; transition: opacity .4s ease;
  color: #ffd9dd; font: 400 13px/1.7 "PixelFont", "Lucida Console", monospace;
  text-transform: uppercase;
  text-shadow: 3px 3px 0 rgba(0,0,0,.55);
  animation: fbr-anger-pulse 1s ease-in-out infinite;
}
#focus-bunny-rage.fbr-raging .fbr-caption { opacity: 1; }
.fbr-shaker.fbr-stomp { animation: fbr-stomp .26s ease-out; }
@keyframes fbr-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fbr-stomp {
  0% { transform: translateY(0) scaleY(1); }
  20% { transform: translate(-8px,6px) scaleY(.86) scaleX(1.1) rotate(-2deg); }
  45% { transform: translate(8px,2px) scaleY(.94) rotate(2deg); }
  100% { transform: translateY(0) scaleY(1); }
}
@keyframes fbr-anger-pulse {
  0%,100% { transform: scale(1); opacity: .92; }
  50% { transform: scale(1.22); opacity: 1; }
}`;
    const style = document.createElement("style");
    style.id = "focus-bunny-rage-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function mountRage(opts) {
    opts = opts || {};
    if (!document.body) return null;
    if (document.getElementById("focus-bunny-rage")) return null;

    const settings = Object.assign({}, DEFAULTS, opts.settings || {});
    const theme = THEMES[settings.color] || THEMES.cream;

    injectRageStyles();

    const overlay = document.createElement("div");
    overlay.id = "focus-bunny-rage";
    const stage = document.createElement("div");
    stage.className = "fbr-stage";
    const shaker = document.createElement("div");
    shaker.className = "fbr-shaker";
    const sprite = document.createElement("canvas");
    sprite.className = "fbr-sprite";
    const anger = document.createElement("canvas");
    anger.className = "fbr-anger";
    const caption = document.createElement("div");
    caption.className = "fbr-caption";
    caption.textContent = "Get back to work — close this tab.";

    drawSprite(sprite, theme, false);
    drawAnger(anger, theme);

    shaker.append(anger, sprite);
    stage.appendChild(shaker);
    overlay.append(stage, caption);
    document.body.appendChild(overlay);

    function sizeBunny() {
      const h = Math.min(window.innerWidth, window.innerHeight) * 0.72;
      sprite.style.height = h + "px";
      sprite.style.width = (h * GW / GH) + "px";
      anger.style.width = (h * 0.5) + "px";
      anger.style.height = (h * 0.5 * 5 / 10) + "px";
    }
    sizeBunny();

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    function onMove(e) { tx = e.clientX; ty = e.clientY; }
    overlay.addEventListener("mousemove", onMove);

    let destroyed = false, raf = null;
    function loop() {
      if (destroyed) return;
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      stage.style.left = cx + "px";
      stage.style.top = cy + "px";
      raf = requestAnimationFrame(loop);
    }
    loop();

    let stompTimer = null, t1 = null, t2 = null;
    function stomp() { retrigger(shaker, "fbr-stomp"); }
    if (settings.angry) anger.style.display = "block";

    t1 = setTimeout(function () {
      if (destroyed) return;
      drawSprite(sprite, theme, true);
      overlay.classList.add("fbr-raging");
      t2 = setTimeout(function () {
        if (destroyed) return;
        stomp();
        if (settings.angry) stompTimer = setInterval(stomp, 900);
      }, 520);
    }, 700);

    function block(e) { e.preventDefault(); e.stopPropagation(); }
    overlay.addEventListener("click", block, true);
    overlay.addEventListener("contextmenu", block, true);
    overlay.addEventListener("wheel", block, { passive: false });
    const onResize = sizeBunny;
    window.addEventListener("resize", onResize);

    return {
      destroy() {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        if (stompTimer) clearInterval(stompTimer);
        if (t1) clearTimeout(t1);
        if (t2) clearTimeout(t2);
        window.removeEventListener("resize", onResize);
        document.documentElement.style.overflow = prevOverflow;
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
    };
  }

  window.FocusBunny = { mount, mountRage, DEFAULTS };
})();

