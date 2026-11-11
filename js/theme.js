/* Dark / Light theme state, CSS variable reader & localStorage persistence */

var THEME_STORAGE_KEY = 'cmos_nand_viewer_theme';
var currentTheme = 'dark';

var THEME_COLOR_FALLBACKS = {
  dark: {
    '--c-substrate': '#3a3f4b',
    '--c-well': '#3f8f6f',
    '--c-active-p': '#cf8a4a',
    '--c-active-n': '#4a92c9',
    '--c-sde-p': '#f0b47a',
    '--c-sde-n': '#8fd0f8',
    '--c-oxide': '#dff0f7',
    '--c-highk': '#a855f7',
    '--c-poly': '#d8503c',
    '--c-contact': '#e8e2d5',
    '--c-metal': '#4f86c9',
    '--c-vdd': '#e35d5d',
    '--c-gnd': '#6b7686',
    '--c-in': '#e6c94a',
    '--c-out': '#57cf8f',
    '--highlight': '#ff2fb0',
    '--accent': '#5fd9c4'
  },
  light: {
    '--c-substrate': '#475569',
    '--c-well': '#059669',
    '--c-active-p': '#d97706',
    '--c-active-n': '#0284c7',
    '--c-sde-p': '#f59e0b',
    '--c-sde-n': '#38bdf8',
    '--c-oxide': '#0284c7',
    '--c-highk': '#7c3aed',
    '--c-poly': '#dc2626',
    '--c-contact': '#334155',
    '--c-metal': '#2563eb',
    '--c-vdd': '#dc2626',
    '--c-gnd': '#475569',
    '--c-in': '#d97706',
    '--c-out': '#16a34a',
    '--highlight': '#db2777',
    '--accent': '#0d9488'
  }
};

function cssVar(name) {
  var val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (val) return val;
  var tbl = THEME_COLOR_FALLBACKS[currentTheme] || THEME_COLOR_FALLBACKS.dark;
  return tbl[name] || '#ffffff';
}

function loadSavedTheme() {
  try {
    var saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (_) {}
  return 'dark';
}

function applyTheme(theme) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  } catch (_) {}

  var btn = document.getElementById('btn-theme');
  if (btn) {
    btn.textContent = currentTheme === 'light' ? 'DARK' : 'LIGHT';
    btn.title = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  }

  if (typeof applySceneTheme === 'function') {
    applySceneTheme(currentTheme);
  }
  if (typeof updateMaterialsTheme === 'function') {
    updateMaterialsTheme();
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

currentTheme = loadSavedTheme();
applyTheme(currentTheme);
