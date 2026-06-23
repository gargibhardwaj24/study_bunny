// Focus Blocker — content script. Runs on every page.
// During a focus session: a roaming bunny on normal sites, and a giant
// cursor-chasing rage bunny that takes over blocked sites. When the focus
// timer ends (session cleared), everything is removed.

(function () {
  if (window.__focusBunnyLoaded) return;
  window.__focusBunnyLoaded = true;

  const DEF = (window.FocusBunny && window.FocusBunny.DEFAULTS) ||
    { enabled: true, color: "cream", speed: 1, angry: true };
  const DEFAULT_BLOCKLIST =
    ["youtube.com", "twitter.com", "x.com", "reddit.com", "instagram.com", "facebook.com", "tiktok.com"];

  let ctrl = null;        // current bunny controller (roaming or rage)
  let mode = null;        // "browse" | "rage" | null
  let state = { bunny: DEF, session: null, blocklist: DEFAULT_BLOCKLIST };

  function normalizeDomain(d) {
    return String(d).trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
  }

  function hostIsBlocked(host, blocklist) {
    host = host.toLowerCase().replace(/^www\./, "");
    return (blocklist || []).some(raw => {
      const d = normalizeDomain(raw);
      return d && (host === d || host.endsWith("." + d));
    });
  }

  function teardown() {
    if (ctrl) { ctrl.destroy(); ctrl = null; }
    mode = null;
  }

  function evaluate() {
    if (!window.FocusBunny) return;
    const bunny = Object.assign({}, DEF, state.bunny || {});
    const session = state.session;
    const focusActive = !!session && session.mode === "focus" && session.endTime > Date.now();

    // Bunny only exists while a focus session is running (and if enabled).
    if (!bunny.enabled || !focusActive) { teardown(); return; }

    // Angry takeover on a blocked site; roaming bunny everywhere else.
    const blocked = hostIsBlocked(location.hostname, state.blocklist);
    const want = blocked ? "rage" : "browse";

    if (mode === want && ctrl) return; // already in the right state
    teardown();
    mode = want;
    ctrl = want === "rage"
      ? window.FocusBunny.mountRage({ settings: bunny })
      : window.FocusBunny.mount({ mode: "browse", anchor: "left", settings: bunny });
  }

  function load() {
    chrome.storage.local.get(["bunny", "session", "blocklist"], r => {
      state.bunny = r.bunny || DEF;
      state.session = r.session || null;
      state.blocklist = r.blocklist || DEFAULT_BLOCKLIST;
      evaluate();
    });
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.bunny) state.bunny = changes.bunny.newValue || DEF;
      if (changes.session) state.session = changes.session.newValue || null;
      if (changes.blocklist) state.blocklist = changes.blocklist.newValue || DEFAULT_BLOCKLIST;
      evaluate();
    });
    load();
  } catch (e) {
    // storage unavailable — do nothing
  }

  // Safety net: drop the bunny exactly when the timer runs out, even if the
  // background's storage update is delayed.
  setInterval(() => {
    const s = state.session;
    if (s && s.endTime <= Date.now()) { state.session = null; evaluate(); }
  }, 1000);
})();
