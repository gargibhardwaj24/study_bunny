(function () {
  const DEF = (window.FocusBunny && window.FocusBunny.DEFAULTS) ||
    { enabled: true, color: "cream", speed: 1, angry: true };

  let ctrl = null;

  function apply(raw) {
    const s = Object.assign({}, DEF, raw || {});
    if (ctrl) { ctrl.destroy(); ctrl = null; }
    if (!s.enabled || !window.FocusBunny) return;
    ctrl = window.FocusBunny.mount({ mode: "angry", anchor: "center", settings: s });
  }

  chrome.storage.local.get("bunny", r => apply(r && r.bunny));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.bunny) apply(changes.bunny.newValue);
  });
})();

