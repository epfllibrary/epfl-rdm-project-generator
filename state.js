// state.js — Centralized state management

const STATE = {
  projectName: "", unit: "", grantNumber: "", projectDescription: "", methodology: "", keywords: "",
  funder: null, contributors: [], multisite: false, humanData: false, multiTeam: false,
  dataDescription: [], codeDescription: [], namingPattern: "rdm",
  dataLicense: "CC-BY-4.0", codeLicense: "MIT",
  generateNotebook: false, generateGitignore: false,
  reusedSources: {},
  _customFolders: {},
};

const _listeners = [];

export function getState() { return STATE; }

export function setState(key, value) {
  STATE[key] = value;
  _listeners.forEach(fn => fn(key, value));
}

export function updateState(updates) {
  Object.assign(STATE, updates);
  _listeners.forEach(fn => fn(null, null));
}

export function onStateChange(fn) { _listeners.push(fn); }

export { STATE };
