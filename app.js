// app.js — Logique principale de l'application RDM Generator

import { STATE } from "./state.js";
import { RULES, evaluateState } from "./rules.js";
import * as T from "./templates.js";
import { makeFileEntry, makeDirEntry, downloadZip } from "./zipgen.js";

export { STATE };

// ── Accessibilité clavier pour les composants custom ──────────────────────────
export function makeKeyboardAccessible(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll("[data-v]").forEach(el => {
    if (!el.getAttribute("tabindex")) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
    }
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────
let currentStep = 0;
const TOTAL_STEPS = 5; // 0=onboarding, 1=projet, 2=données, 3=licences, 4=résultat

export function getStep() { return currentStep; }

export function goToStep(n) {
  if (n < 0 || n >= TOTAL_STEPS) return;
  const prev = document.getElementById(`step-${currentStep}`);
  const next = document.getElementById(`step-${n}`);
  if (prev) prev.classList.remove("active");
  if (next) next.classList.add("active");
  currentStep = n;
  updateNav();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function nextStep() { goToStep(currentStep + 1); }
export function prevStep() { goToStep(currentStep - 1); }

function updateNav() {
  const pct = Math.round((currentStep / (TOTAL_STEPS - 1)) * 100);
  const fill = document.getElementById("prog-fill");
  if (fill) {
    fill.style.width = pct + "%";
    fill.setAttribute("aria-valuenow", pct);
  }
  document.getElementById("prog-pct").textContent = pct + "%";
  // top-step géré par updateDynamicTexts() dans index.html (i18n-aware)

  document.querySelectorAll(".nav-step").forEach((el, i) => {
    el.classList.toggle("done", i < currentStep);
    el.classList.toggle("active", i === currentStep);
    el.classList.toggle("pending", i > currentStep);
  });
}

// ── Liaison des champs de formulaire ──────────────────────────────────────────
export function bindInput(id, stateKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    STATE[stateKey] = el.value.trim();
  });
}

export function bindChip(containerId, stateKey, multi = true) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll("[data-v]").forEach(chip => {
    chip.addEventListener("click", () => {
      const v = chip.dataset.v;
      if (!multi) {
        container.querySelectorAll("[data-v]").forEach(c => c.classList.remove("on"));
        chip.classList.add("on");
        STATE[stateKey] = v;
      } else {
        chip.classList.toggle("on");
        const arr = STATE[stateKey];
        const idx = arr.indexOf(v);
        if (idx === -1) arr.push(v); else arr.splice(idx, 1);
      }
    });
  });
}

export function bindToggle(containerId, stateKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll("[data-v]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-v]").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      STATE[stateKey] = btn.dataset.v;
    });
  });
}

export function bindRadio(containerId, stateKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll("[data-v]").forEach(card => {
    card.addEventListener("click", () => {
      container.querySelectorAll("[data-v]").forEach(c => c.classList.remove("on"));
      card.classList.add("on");
      STATE[stateKey] = card.dataset.v;
    });
  });
}

export function bindCheckbox(id, stateKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", () => {
    STATE[stateKey] = el.checked;
  });
}

export function bindSelect(id, stateKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", () => {
    STATE[stateKey] = el.value;
  });
}

// ── Assemblage du ZIP ─────────────────────────────────────────────────────────
export async function assembleAndDownload(onProgress) {
  const ctx = evaluateState(STATE);
  const p = (STATE.projectName || "mon_projet").replace(/[^a-zA-Z0-9_]/g, "_");
  const entries = [];

  const dir = path => entries.push(makeDirEntry(`${p}/${path}`));
  const file = (path, content) => entries.push(makeFileEntry(`${p}/${path}`, content));

  onProgress?.(5, "Building structure…");

  // ── Dossiers (utilise _customFolders si disponible, sinon logique existante) ─
  const customFolders = STATE._customFolders;
  if (customFolders && Object.keys(customFolders).length > 0) {
    // Utilise la configuration personnalisée de l'utilisateur
    Object.entries(customFolders).forEach(([path, active]) => {
      if (active) {
        dir(path);
        file(`${path}/.gitkeep`, "");
      }
    });
  } else {
    // Logique existante par défaut
    const baseDirs = [
      "00_Admin/protocols", "00_Admin/ethics", "00_Admin/contracts",
      "00_Admin/meetings", "00_Admin/dmp",
      "03_Analysis/statistical", "03_Analysis/exploratory",
      "04_Results/figures", "04_Results/tables", "04_Results/reports",
      "05_Publications/manuscripts", "05_Publications/posters", "05_Publications/presentations",
      "Documentation", "Resources", "Checklists"
    ];
    if (ctx.hasCode) {
      baseDirs.push("06_Code/src", "06_Code/tests", "06_Code/docs");
    }
    baseDirs.forEach(d => dir(d));

    // ── Dossiers conditionnels (règles) ──────────────────────────────────────
    ctx.activeFolders.forEach(rule => {
      rule.folders.forEach(f => {
        dir(f);
        file(`${f}/.gitkeep`, "");
      });
    });
  }

  onProgress?.(15, "Creating data folders…");

  // ── Dossiers de données (adaptatifs) — toujours créés ──────────────────────
  ctx.dataFolders.forEach(df => {
    dir(`01_Raw_Data/${df.raw}`);
    file(`01_Raw_Data/${df.raw}/.gitkeep`, "");
    dir(`02_Processed_Data/${df.proc}`);
    file(`02_Processed_Data/${df.proc}/.gitkeep`, "");
  });
  dir("02_Processed_Data/merged");

  // ── Dossier notebooks (si demandé) ────────────────────────────────────────
  if (ctx.hasCode && STATE.generateNotebook) {
    dir("03_Analysis/notebooks");
  }

  onProgress?.(30, "Generating main files…");

  // ── Fichiers racine ─────────────────────────────────────────────────────────
  file("README.md", T.buildReadme(STATE, ctx));
  file("NAMING_CONVENTIONS.md", T.buildNamingConventions(STATE, ctx));
  file("LICENSE.md", T.buildLicense(STATE));
  // Fichier LICENSE séparé avec le texte officiel complet (OSI uniquement)
  const licensePlain = T.buildLicensePlain(STATE);
  if (licensePlain) file("LICENSE", licensePlain);
  file("config_rdm.json", T.buildConfig(STATE, ctx));

  // ── Templates ───────────────────────────────────────────────────────────────
  file("Documentation/data_dictionary_template.csv", T.buildDataDictionary(STATE, ctx));
  file("Checklists/checklist_data_collection.md", T.buildChecklistCollection(STATE));
  file("Checklists/checklist_data_quality.md", T.buildChecklistQuality(STATE));
  file("Checklists/checklist_archiving.md", T.buildChecklistArchiving(STATE, ctx));
  if (STATE.humanData || (Array.isArray(STATE.dataDescription) && STATE.dataDescription.some(d => d.sensitive || d.personal))) {
    file("Checklists/checklist_ethics.md", T.buildChecklistEthics(STATE));
    file("Checklists/guide_anonymization.md", T.buildAnonymizationGuide(STATE));
  }
  if (STATE.multisite || STATE.multiTeam) {
    file("Documentation/data_transfer_agreement_template.md", T.buildDataTransferAgreement(STATE));
  }

  onProgress?.(55, "Generating conditional files…");

  // ── Fichiers conditionnels ────────────────────────────────────────────────
  // Notebook Jupyter (un seul, ML-focused)
  if (ctx.hasCode && STATE.generateNotebook) {
    file("03_Analysis/notebooks/01_exploration.ipynb", T.buildNotebook("01_exploration", STATE));
  }
  // .gitignore
  if (ctx.hasCode && STATE.generateGitignore) {
    file(".gitignore", T.buildGitignore(STATE));
  }

  // Documentation avancée — uniquement si code présent
  if (ctx.hasCode) file("CHANGELOG.md", T.buildChangelog(STATE));

  // ── DMP Starter ──────────────────────────────────────────────────────────────
  file("00_Admin/dmp/DMP_STARTER.md", T.buildDmpStarter(STATE, ctx));

  // ── Export configuration ──────────────────────────────────────────────────────
  file("rdm_config.json", JSON.stringify({
    generated: new Date().toISOString(),
    version: "1.0",
    state: {
      projectName: STATE.projectName,
      unit: STATE.unit,
      grantNumber: STATE.grantNumber,
      projectDescription: STATE.projectDescription,
      methodology: STATE.methodology,
      keywords: STATE.keywords,
      funder: STATE.funder,
      contributors: STATE.contributors,
      multisite: STATE.multisite,
      humanData: STATE.humanData,
      multiTeam: STATE.multiTeam,
      dataDescription: STATE.dataDescription,
      codeDescription: STATE.codeDescription,
      namingPattern: STATE.namingPattern,
      dataLicense: STATE.dataLicense,
      codeLicense: STATE.codeLicense,
      generateNotebook: STATE.generateNotebook,
      generateGitignore: STATE.generateGitignore,
      reusedSources: STATE.reusedSources,
    }
  }, null, 2));

  onProgress?.(80, "Fetching EPFL resources…");

  // ── Resources PDF — fetch depuis assets/resources/ et inclusion dans le ZIP ──
  const resourceIndex = [];
  const pdfResults = await Promise.allSettled(
    ctx.activeResources.map(async res => {
      const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      const url = `${base}assets/resources/${res.file}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      return { res, buffer };
    })
  );

  let failedCount = 0;
  pdfResults.forEach((result, i) => {
    const res = ctx.activeResources[i];
    if (result.status === "fulfilled") {
      resourceIndex.push(`- [${res.label}](${res.file})`);
      entries.push(makeFileEntry(`${p}/Resources/${res.file}`, new Uint8Array(result.value.buffer)));
    } else {
      failedCount++;
      resourceIndex.push(`- [${res.label}](${res.file}.txt) — fichier original non trouvé`);
      console.warn(`[RDM] PDF non trouvé : ${res.file} —`, result.reason?.message);
      file(`Resources/${res.file}.txt`,
        `[PDF not available — ${res.label}]\n\nExpected file: assets/resources/${res.file}\nContact: researchdata@epfl.ch\n`
      );
    }
  });
  if (failedCount > 0) {
    onProgress?.(85, `${failedCount} ressource(s) non trouvée(s) — fichiers .txt générés`);
  }

  file("Resources/README.md",
    `# EPFL RDM Resources\n\nThis folder contains EPFL guides and checklists for research data management.\n\n${resourceIndex.join("\n")}\n\nContact: researchdata@epfl.ch | go.epfl.ch/rdm\n`
  );

  onProgress?.(90, "Compressing ZIP…");

  // ── Téléchargement ─────────────────────────────────────────────────────────
  downloadZip(entries, `${p}_rdm_package.zip`);

  onProgress?.(100, "Download started!");
}

// ── Liste des dossiers par défaut (customisable) ───────────────────────────────
export function getDefaultFolders(state, ctx) {
  const folders = [
    { path: "00_Admin/protocols", label: "Protocols", active: true },
    { path: "00_Admin/ethics", label: "Ethics", active: true },
    { path: "00_Admin/contracts", label: "Contracts", active: true },
    { path: "00_Admin/meetings", label: "Meetings", active: true },
    { path: "00_Admin/dmp", label: "DMP", active: true },
    ...ctx.dataFolders.flatMap(df => [
      { path: `01_Raw_Data/${df.raw}`, label: `Raw — ${df.label}`, active: true },
      { path: `02_Processed_Data/${df.proc}`, label: `Processed — ${df.label}`, active: true },
    ]),
    { path: "03_Analysis/statistical", label: "Statistical Analysis", active: true },
    { path: "03_Analysis/exploratory", label: "Exploratory Analysis", active: true },
    { path: "04_Results/figures", label: "Figures", active: true },
    { path: "04_Results/tables", label: "Tables", active: true },
    { path: "04_Results/reports", label: "Reports", active: true },
    { path: "05_Publications/manuscripts", label: "Manuscripts", active: true },
    { path: "05_Publications/posters", label: "Posters", active: true },
    { path: "05_Publications/presentations", label: "Presentations", active: true },
    { path: "06_Code/src", label: "Source Code", active: !!ctx.hasCode },
    { path: "06_Code/tests", label: "Code Tests", active: !!ctx.hasCode },
    { path: "06_Code/docs", label: "Code Docs", active: !!ctx.hasCode },
    { path: "Documentation", label: "Documentation", active: true },
    { path: "Checklists", label: "Checklists", active: true },
    { path: "Resources", label: "Resources", active: true },
  ];
  // Dossiers conditionnels
  if (ctx.activeFolders.some(f => f.id === "sensitive_data")) {
    folders.push({ path: "Sensitive_Data/raw_restricted", label: "Sensitive Data (restricted)", active: true });
    folders.push({ path: "Sensitive_Data/anonymized", label: "Anonymized Data", active: true });
    folders.push({ path: "Sensitive_Data/consent_forms", label: "Consent Forms", active: true });
  }
  if (ctx.activeFolders.some(f => f.id === "multisite")) {
    folders.push({ path: "Multi_Site/site_A", label: "Multi-Site A", active: true });
    folders.push({ path: "Multi_Site/site_B", label: "Multi-Site B", active: true });
    folders.push({ path: "Multi_Site/harmonization", label: "Harmonization", active: true });
  }
  return folders;
}


// ── (buildTreePreview and buildSummary moved to templates.js) ─────────────────
