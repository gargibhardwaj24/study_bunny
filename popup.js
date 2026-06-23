const $ = sel => document.querySelector(sel);

const els = {
  status: $("#status"),
  time: $("#time"),
  startFocus: $("#startFocus"),
  startBreak: $("#startBreak"),
  stop: $("#stop"),
  focusMinutes: $("#focusMinutes"),
  breakMinutes: $("#breakMinutes"),
  addForm: $("#addForm"),
  newSite: $("#newSite"),
  sites: $("#sites"),
  bunnyEnabled: $("#bunnyEnabled"),
  bunnyAngry: $("#bunnyAngry"),
  bunnyColor: $("#bunnyColor"),
  bunnySpeed: $("#bunnySpeed")
};

const BUNNY_DEFAULTS = { enabled: true, color: "cream", speed: 1, angry: true };

let blocklist = [];
let session = null;
let ticker = null;

function send(msg) {
  return chrome.runtime.sendMessage(msg);
}

function fmt(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function renderTimer() {
  if (session) {
    const remaining = session.endTime - Date.now();
    if (remaining <= 0) {

      refresh();
      return;
    }
    els.time.textContent = fmt(remaining);
  } else {
    const mins = parseInt(els.focusMinutes.value, 10) || 25;
    els.time.textContent = `${String(mins).padStart(2, "0")}:00`;
  }
}

function renderControls() {
  const active = !!session;
  els.stop.hidden = !active;
  els.startFocus.hidden = active;
  els.startBreak.hidden = active;

  els.status.className = "status " + (session ? session.mode : "idle");
  els.status.textContent = session
    ? (session.mode === "focus" ? "Focusing" : "On break")
    : "Idle";
}

function renderBlocklist() {
  els.sites.innerHTML = "";
  if (blocklist.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No sites blocked yet";
    els.sites.appendChild(li);
    return;
  }
  for (const site of blocklist) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = site;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.textContent = "×";
    btn.title = `Remove ${site}`;
    btn.addEventListener("click", () => removeSite(site));
    li.append(span, btn);
    els.sites.appendChild(li);
  }
}

function startTicker() {
  stopTicker();
  ticker = setInterval(renderTimer, 1000);
}
function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

function normalize(input) {
  return input.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

async function refresh() {
  const state = await send({ type: "getState" });
  blocklist = state.blocklist;
  session = state.session;
  els.focusMinutes.value = state.settings.focusMinutes;
  els.breakMinutes.value = state.settings.breakMinutes;

  renderControls();
  renderBlocklist();
  renderTimer();
  if (session) startTicker(); else stopTicker();

  await refreshBunny();
}

async function refreshBunny() {
  const { bunny } = await chrome.storage.local.get("bunny");
  const b = { ...BUNNY_DEFAULTS, ...(bunny || {}) };
  els.bunnyEnabled.checked = b.enabled;
  els.bunnyAngry.checked = b.angry;
  els.bunnyColor.value = b.color;
  els.bunnySpeed.value = b.speed;
}

async function saveBunny() {
  const bunny = {
    enabled: els.bunnyEnabled.checked,
    angry: els.bunnyAngry.checked,
    color: els.bunnyColor.value,
    speed: Math.min(2, Math.max(0.5, parseFloat(els.bunnySpeed.value) || 1))
  };
  await chrome.storage.local.set({ bunny });
}

async function saveSettings() {
  const settings = {
    focusMinutes: Math.min(180, Math.max(1, parseInt(els.focusMinutes.value, 10) || 25)),
    breakMinutes: Math.min(60, Math.max(1, parseInt(els.breakMinutes.value, 10) || 5))
  };
  els.focusMinutes.value = settings.focusMinutes;
  els.breakMinutes.value = settings.breakMinutes;
  await send({ type: "saveSettings", settings });
}

async function addSite(raw) {
  const site = normalize(raw);
  if (!site || blocklist.includes(site)) return;
  blocklist = [...blocklist, site];
  await send({ type: "saveBlocklist", blocklist });
  renderBlocklist();
}

async function removeSite(site) {
  blocklist = blocklist.filter(s => s !== site);
  await send({ type: "saveBlocklist", blocklist });
  renderBlocklist();
}

els.startFocus.addEventListener("click", async () => {
  await saveSettings();
  session = await send({ type: "start", mode: "focus" });
  renderControls();
  renderTimer();
  startTicker();
});

els.startBreak.addEventListener("click", async () => {
  await saveSettings();
  session = await send({ type: "start", mode: "break" });
  renderControls();
  renderTimer();
  startTicker();
});

els.stop.addEventListener("click", async () => {
  session = await send({ type: "stop" });
  renderControls();
  renderTimer();
  stopTicker();
});

els.addForm.addEventListener("submit", e => {
  e.preventDefault();
  addSite(els.newSite.value);
  els.newSite.value = "";
});

els.focusMinutes.addEventListener("change", () => { saveSettings(); renderTimer(); });
els.breakMinutes.addEventListener("change", saveSettings);

els.bunnyEnabled.addEventListener("change", saveBunny);
els.bunnyAngry.addEventListener("change", saveBunny);
els.bunnyColor.addEventListener("change", saveBunny);
els.bunnySpeed.addEventListener("change", saveBunny);

refresh();

