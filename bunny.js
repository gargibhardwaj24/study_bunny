(function () {
  if (window.__focusBunnyLoaded) return;
  window.__focusBunnyLoaded = true;

  const DEF = (window.FocusBunny && window.FocusBunny.DEFAULTS) ||
    { enabled: true, color: "cream", speed: 1, angry: true };
  const DEFAULT_BLOCKLIST =
    ["youtube.com", "twitter.com", "x.com", "reddit.com", "instagram.com", "facebook.com", "tiktok.com"];

  let ctrl = null;
  let mode = null;
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

    if (!bunny.enabled || !focusActive) { teardown(); return; }

    const blocked = hostIsBlocked(location.hostname, state.blocklist);
    const want = blocked ? "rage" : "browse";

    if (mode === want && ctrl) return;
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

  }

  setInterval(() => {
    const s = state.session;
    if (s && s.endTime <= Date.now()) { state.session = null; evaluate(); }
  }, 1000);
})();

