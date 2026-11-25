// Guest settings saved in the browser. No login, nothing leaves the device.
const KEY = 'dragoon.settings';
const DEFAULTS = { name: 'Player', color: '#e8453c', glow: true };

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ponytail: storage blocked (private mode), settings just last this session
  }
}
