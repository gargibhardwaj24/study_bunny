// Focus Blocker — blocked page countdown.
// External file because MV3 extension pages disallow inline scripts.

function fmt(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return m + ":" + s;
}

async function tick() {
  const { session } = await chrome.storage.local.get("session");
  const wrap = document.getElementById("remainingWrap");
  if (session && session.endTime > Date.now()) {
    wrap.hidden = false;
    document.getElementById("remaining").textContent = fmt(session.endTime - Date.now());
  } else {
    wrap.hidden = true;
  }
}

tick();
setInterval(tick, 1000);
