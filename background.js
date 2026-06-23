// Focus Blocker — background service worker
// Owns the timer + session state. Blocking itself is enforced in the content
// script (bunny.js): on a blocked site during a focus session, a giant angry
// bunny takes over the page. No redirecting — the tab stays open.

const ALARM_NAME = "focusSessionEnd";

const DEFAULTS = {
  blocklist: ["youtube.com", "twitter.com", "x.com", "reddit.com", "instagram.com", "facebook.com", "tiktok.com"],
  settings: { focusMinutes: 25, breakMinutes: 5 },
  session: null // { mode: "focus" | "break", endTime: <ms epoch> }
};

// --- storage helpers -------------------------------------------------------

async function getState() {
  const stored = await chrome.storage.local.get(["blocklist", "settings", "session"]);
  return {
    blocklist: stored.blocklist ?? DEFAULTS.blocklist,
    settings: stored.settings ?? DEFAULTS.settings,
    session: stored.session ?? DEFAULTS.session
  };
}

// Persist defaults so the content script always finds a blocklist in storage.
async function ensureDefaults() {
  const stored = await chrome.storage.local.get(["blocklist", "settings"]);
  const patch = {};
  if (stored.blocklist === undefined) patch.blocklist = DEFAULTS.blocklist;
  if (stored.settings === undefined) patch.settings = DEFAULTS.settings;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}

// Purge any leftover declarativeNetRequest redirect rules from older versions,
// so blocked tabs are no longer redirected.
async function clearLegacyRules() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map(r => r.id)
      });
    }
  } catch (e) {
    // declarativeNetRequest unavailable — nothing to clear
  }
}

// --- badge -----------------------------------------------------------------

function setBadge(session) {
  if (session && session.mode === "focus") {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#e5484d" });
  } else if (session && session.mode === "break") {
    chrome.action.setBadgeText({ text: "•" });
    chrome.action.setBadgeBackgroundColor({ color: "#30a46c" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// --- session control -------------------------------------------------------

async function startSession(mode) {
  const { settings } = await getState();
  const minutes = mode === "break" ? settings.breakMinutes : settings.focusMinutes;
  const endTime = Date.now() + minutes * 60 * 1000;
  const session = { mode, endTime };

  await chrome.storage.local.set({ session });
  await chrome.alarms.create(ALARM_NAME, { when: endTime });

  setBadge(session);
  return session;
}

async function stopSession() {
  await chrome.storage.local.set({ session: null });
  await chrome.alarms.clear(ALARM_NAME);
  setBadge(null);
  return null;
}

// Called when an alarm fires (session naturally ended).
async function onSessionEnd() {
  const { session } = await getState();
  await chrome.storage.local.set({ session: null });
  setBadge(null);

  const wasFocus = session && session.mode === "focus";
  try {
    chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: wasFocus ? "Focus session complete 🎉" : "Break over",
      message: wasFocus ? "Nice work. Take a break when you're ready." : "Ready for another focus session?"
    });
  } catch (e) {
    // notifications permission not granted — ignore
  }
}

// --- event wiring ----------------------------------------------------------

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) onSessionEnd();
});

// Re-sync state whenever the worker spins up (browser start, reload, etc.).
async function resync() {
  await ensureDefaults();
  await clearLegacyRules();
  const { session } = await getState();
  if (session && Date.now() >= session.endTime) {
    await onSessionEnd();
    return;
  }
  setBadge(session);
}

chrome.runtime.onStartup.addListener(resync);
chrome.runtime.onInstalled.addListener(resync);

// Messages from the popup.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "getState":
        sendResponse(await getState());
        break;
      case "start":
        sendResponse(await startSession(msg.mode || "focus"));
        break;
      case "stop":
        sendResponse(await stopSession());
        break;
      case "saveBlocklist":
        await chrome.storage.local.set({ blocklist: msg.blocklist });
        sendResponse({ ok: true });
        break;
      case "saveSettings":
        await chrome.storage.local.set({ settings: msg.settings });
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ error: "unknown message" });
    }
  })();
  return true; // keep the channel open for the async response
});
