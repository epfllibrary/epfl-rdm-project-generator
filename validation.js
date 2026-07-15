// validation.js — License compatibility and form validation
// Single source of truth for all validation logic

import { STATE } from "./state.js";
import { getStep } from "./app.js";

// ── License compatibility check (pure function) ──────────────────────────────
export function checkLicenseCompatibility(reusedSources, dataLicense, codeLicense) {
  const strongCopyleft = ["GPL-2.0", "GPL-3.0", "AGPL-3.0"];
  const ncLicenses = ["CC-BY-NC-4.0", "CC-BY-NC-SA-4.0", "CC-BY-NC-ND-4.0"];
  const restricted = ["restricted"];
  let dataWarnings = [], codeWarnings = [];
  let dataCompatItems = [], codeCompatItems = [];

  Object.entries(reusedSources || {}).forEach(([id, r]) => {
    if (!r.sourceLicense) return;
    const isData = r.sourceTable === "data" || r.sourceTable === "data_manual";
    const srcLic = r.sourceLicense;
    let status = "Compatible";
    let isIncompat = false;

    if (isData) {
      if (ncLicenses.includes(srcLic) && dataLicense === "CC-BY-4.0") {
        status = "Incompatible avec CC BY 4.0";
        isIncompat = true;
        dataWarnings.push(id);
      } else if (restricted.includes(srcLic) && !restricted.includes(dataLicense)) {
        status = "Incompatible (accès restreint)";
        isIncompat = true;
        dataWarnings.push(id);
      }
      dataCompatItems.push({ id, lic: srcLic, status, isIncompat });
    } else {
      if (strongCopyleft.includes(srcLic) && !strongCopyleft.includes(codeLicense)) {
        status = "Incompatible avec " + codeLicense;
        isIncompat = true;
        codeWarnings.push(id);
      } else if (restricted.includes(srcLic) && !restricted.includes(codeLicense)) {
        status = "Incompatible (accès restreint)";
        isIncompat = true;
        codeWarnings.push(id);
      }
      codeCompatItems.push({ id, lic: srcLic, status, isIncompat });
    }
  });

  return { dataWarnings, codeWarnings, dataCompatItems, codeCompatItems };
}

// ── Validation rules by step ─────────────────────────────────────────────────
export const STEP_RULES = [
  // Étape 0 — Onboarding (pas de validation)
  () => [],
  // Étape 1 — Projet & financement
  () => {
    const errors = [];
    if (!STATE.projectName.trim()) errors.push({ id: "proj-name",    msg: t("val.name") });
    if (!STATE.unit.trim())        errors.push({ id: "proj-unit",    msg: t("val.unit") });
    if (!STATE.funder)             errors.push({ id: "funder-radios", msg: t("val.funder") });
    if (!STATE.projectDescription.trim()) errors.push({ id: "proj-desc", msg: "Description requise" });
    if (!STATE.keywords.trim())          errors.push({ id: "proj-keywords", msg: "Mots-clés requis" });
    return errors;
  },
  // Étape 2 — Données & code
  () => {
    const errors = [];
    const dataRows = Array.isArray(STATE.dataDescription) ? STATE.dataDescription : [];
    const codeRows = Array.isArray(STATE.codeDescription) ? STATE.codeDescription : [];
    if (!dataRows.length && !codeRows.length) {
      errors.push({ id: "data-table", msg: t("val.datatypes") });
    }
    dataRows.forEach((r, i) => {
      if (r.type && !r.identifier) errors.push({ id: "data-table", msg: `Ligne ${i+1} : identifiant requis` });
      if (r.type && !r.format)  errors.push({ id: "data-table", msg: `Ligne ${i+1} : format requis` });
      if (r.type && !r.volume)  errors.push({ id: "data-table", msg: `Ligne ${i+1} : volume requis` });
    });
    codeRows.forEach((r, i) => {
      if (r.identifier && !r.language) errors.push({ id: "code-table", msg: `Ligne ${i+1} : langage requis` });
    });
    return errors;
  },
  // Étape 3 — Licences (vérifier compatibilité)
  () => {
    const errors = [];
    const dataLic = STATE.dataLicense || "CC-BY-4.0";
    const codeLic = STATE.codeLicense || "MIT";
    const { dataWarnings, codeWarnings } = checkLicenseCompatibility(STATE.reusedSources, dataLic, codeLic);
    if (dataWarnings.length > 0) {
      errors.push({ id: "compat-warn-data", msg: `Attention : ${dataWarnings.length} source(s) réutilisée(s) avec licence incompatible avec ${dataLic}. Vérifiez la compatibilité.` });
    }
    if (codeWarnings.length > 0) {
      errors.push({ id: "compat-warn-code", msg: `Attention : ${codeWarnings.length} source(s) réutilisée(s) avec licence incompatible avec ${codeLic}. Vérifiez la compatibilité.` });
    }
    return errors;
  },
  // Étape 4 — Résultat (pas de validation)
  () => [],
];

// ── Validation functions ─────────────────────────────────────────────────────
export function validate() {
  clearAllErrors();
  const step = getStep();
  if (step >= STEP_RULES.length) return true;
  const errors = STEP_RULES[step]();
  if (!errors.length) return true;
  errors.forEach(showError);
  const firstEl = document.getElementById(errors[0].id);
  if (firstEl) firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

export function showError({ id, msg }) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "block";
  el.classList.add("has-error");
  let err = el.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("div");
    err.className = "field-error";
    el.insertAdjacentElement("afterend", err);
  }
  err.textContent = msg;
}

export function clearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("has-error");
  const err = el.parentElement?.querySelector(".field-error");
  if (err) err.remove();
}

export function clearAllErrors() {
  document.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
  document.querySelectorAll(".field-error").forEach(el => el.remove());
  document.querySelectorAll(".license-compat-warning").forEach(el => el.style.display = "none");
}

// ── i18n helper (needed by STEP_RULES for validation messages) ───────────────
// Minimal t() — the full t() from i18n.js is used at runtime in the browser.
// In Node tests, t() returns the key (or a fallback).
let _t = (key) => {
  // In browser context, use the global t function
  if (typeof window !== "undefined" && window._rdm && window._rdm.t) {
    return window._rdm.t(key);
  }
  // In test context, return the key
  return key;
};

export function setValidationT(fn) { _t = fn; }
function t(key) { return _t(key); }
