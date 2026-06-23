# Focus Blocker

A Manifest V3 browser extension for Brave and Chrome. Runs Pomodoro-style focus
sessions and blocks distracting sites while a focus session is active.

## Features
- Pomodoro timer with configurable focus / break lengths.
- Editable blocklist (defaults include YouTube, Twitter/X, Reddit, etc.).
- During a focus session, blocked sites redirect to a "Stay focused" page that
  shows the time remaining.
- Timer runs in the background service worker, so it keeps counting even when the
  popup is closed. Blocking auto-lifts when the session ends or you press Stop.
- A toolbar badge shows session state (`ON` for focus, `•` for break).

## Install (load unpacked)
1. Open `brave://extensions` (or `chrome://extensions`).
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `focus-blocker` folder.
4. Pin the extension and click its icon to open the popup.

## Usage
- Set your focus/break minutes, then **Start focus**.
- Add sites to block by typing a domain (e.g. `youtube.com`) and clicking **Add**.
- Press **Stop** to end early; blocking is removed immediately.

## Files
| File | Purpose |
|------|---------|
| `manifest.json` | Extension config (MV3, permissions). |
| `background.js` | Service worker: timer, alarms, blocking rules, state. |
| `popup.html/.css/.js` | The toolbar popup UI. |
| `blocked.html` | Page shown when a blocked site is visited. |
| `icons/` | Toolbar icons. |

## Notes
- Blocking uses `declarativeNetRequest` dynamic rules and matches a domain plus
  its subdomains (`youtube.com` also blocks `m.youtube.com`).
- After editing any file, return to the extensions page and click the reload ↻
  icon on the extension card.
