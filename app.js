// app.js — Logique principale de l'application RDM Generator

import { RULES, evaluateState } from "./rules.js";
import * as T from "./templates.js";
import { makeFileEntry, makeDirEntry, downloadZip } from "./zipgen.js";

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

// ── État global ────────────────────────────────────────────────────────────────
export const STATE = {
  // Étape 1 — Informations générales (enriched README) + Options
  projectName: "",
  unit: "",
  contributors: [],
  projectDescription: "",
  methodology: "",
  keywords: "",
  grantNumber: "",
  multisite: false,
  humanData: false,
  multiTeam: false,
  // Étape 3 — Données
  dataDescription: [],
  namingPattern: "rdm",
  // Étape 4 — Funder & conformité
  funder: null,
  dataLicense: "CC-BY-4.0",
  codeLicense: "MIT",
  // Options techniques
  codeDescription: [],
  generateNotebook: false,
  generateGitignore: false,
  reusedSources: {}, // { identifier: { doi, link, sourceLicense, citation, sourceTable } }
};

// ── Navigation ────────────────────────────────────────────────────────────────
let currentStep = 0;
const TOTAL_STEPS = 4; // 0-2 = form steps, 3 = résultat

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

  onProgress?.(80, "Fetching EPFL resources…");

  // ── Resources PDF — fetch depuis assets/resources/ et inclusion dans le ZIP ──
  const resourceIndex = [];
  const pdfResults = await Promise.allSettled(
    ctx.activeResources.map(async res => {
      const url = `/assets/resources/${res.file}`;
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

// ── Prévisualisation de la structure ─────────────────────────────────────────
export function buildTreePreview(ctx) {
  if (!ctx) ctx = evaluateState(STATE);
  const p = (STATE.projectName || "mon_projet").replace(/[^a-zA-Z0-9_]/g, "_");
  const lines = [];

  lines.push(p + "/");

  function branch(indent, name, isLast, extra = "") {
    lines.push(`${indent}${isLast ? "└── " : "├── "}${name}${extra}`);
    return indent + (isLast ? "    " : "│   ");
  }

  // ── Si l'utilisateur a personnalisé la structure, générer l'arbre depuis _customFolders
  const customFolders = STATE._customFolders;
  if (customFolders && Object.keys(customFolders).length > 0) {
    const activePaths = Object.entries(customFolders)
      .filter(([, active]) => active)
      .map(([path]) => path)
      .sort();

    // Grouper par premier niveau
    const groups = {};
    activePaths.forEach(path => {
      const parts = path.split("/");
      const top = parts[0];
      if (!groups[top]) groups[top] = [];
      if (parts.length > 1) {
        groups[top].push(parts.slice(1).join("/"));
      }
    });

    const topKeys = Object.keys(groups).sort();
    topKeys.forEach((name, i) => {
      const isLast = i === topKeys.length - 1;
      const children = groups[name].sort();
      const childIndent = branch("", name + "/", isLast);
      if (children.length > 0) {
        children.forEach((child, j) => {
          const childIsLast = j === children.length - 1;
          lines.push(`${childIndent}${childIsLast ? "└── " : "├── "}${child}/`);
        });
      }
    });

    // Fichiers racine
    const rootFiles = ["README.md", "NAMING_CONVENTIONS.md", "config_rdm.json"];
    if (STATE.generateGitignore) rootFiles.push(".gitignore");
    if (ctx.hasCode) rootFiles.push("CHANGELOG.md");
    rootFiles.push("LICENSE.md");

    rootFiles.forEach((f, i) => {
      lines.push(`${i === rootFiles.length - 1 ? "└" : "├"}── ${f}`);
    });

    return lines.join("\n");
  }

  // ── Logique existante (si pas de _customFolders) ──────────────────────────
  const topLevel = [
    ["00_Admin/", false, ["protocols/", "ethics/", "contracts/", "dmp/"]],
    ["01_Raw_Data/", false, ctx.dataFolders.map(d => d.raw + "/")],
    ["02_Processed_Data/", false, [...ctx.dataFolders.map(d => d.proc + "/"), "merged/"]],
    ["03_Analysis/", false, buildAnalysisFolders()],
    ["04_Results/", false, ["figures/", "tables/", "reports/"]],
    ["05_Publications/", false, ["manuscripts/", "posters/", "presentations/"]],
    ["Documentation/", false, []],
    ["Checklists/", false, []],
    ["Resources/", false, ctx.activeResources.map(r => r.file)],
  ];

  if (ctx.hasCode) {
    topLevel.splice(6, 0, ["06_Code/", false, ["src/", "tests/", "docs/"]]);
  }

  // Dossiers conditionnels
  if (ctx.activeFolders.some(f => f.id === "sensitive_data")) {
    topLevel.push(["Sensitive_Data/   [accès restreint]", false, ["raw_restricted/", "anonymized/", "consent_forms/"]]);
  }
  if (ctx.activeFolders.some(f => f.id === "multisite")) {
    topLevel.push(["Multi_Site/", false, ["site_A/", "site_B/", "harmonization/"]]);
  }
  if (ctx.activeFolders.some(f => f.id === "external_collab")) {
    topLevel.push(["External_Collab/", false, ["incoming/", "outgoing/"]]);
  }
  if (ctx.activeFolders.some(f => f.id === "hpc")) {
    topLevel.push(["HPC_Jobs/", false, ["scripts/", "logs/", "configs/"]]);
  }

  // Fichiers racine
  const rootFiles = ["README.md", "NAMING_CONVENTIONS.md", "config_rdm.json"];
  if (STATE.generateGitignore) rootFiles.push(".gitignore");
  if (ctx.hasCode) rootFiles.push("CHANGELOG.md");
  rootFiles.push("LICENSE.md");

  topLevel.forEach(([name, last, children], i) => {
    const isLast = i === topLevel.length - 1 && rootFiles.length === 0;
    const childIndent = branch("", name, isLast);
    children.slice(0, 4).forEach((child, j) => {
      const childIsLast = j === Math.min(children.length, 4) - 1;
      lines.push(`${childIndent}${childIsLast && children.length <= 4 ? "└" : "├"}── ${child}`);
    });
    if (children.length > 4) lines.push(`${childIndent}└── … (${children.length - 4} autres)`);
  });

  rootFiles.forEach((f, i) => {
    lines.push(`${i === rootFiles.length - 1 ? "└" : "├"}── ${f}`);
  });

  return lines.join("\n");

  function buildAnalysisFolders() {
    const folders = ["statistical/", "exploratory/"];
    if (ctx.hasCode && STATE.generateNotebook) folders.unshift("notebooks/");
    return folders;
  }

}

// ── Résumé pour l'écran de confirmation ──────────────────────────────────────
export function buildSummary(ctx) {
  if (!ctx) ctx = evaluateState(STATE);

  const dataCount = Array.isArray(STATE.dataDescription) ? STATE.dataDescription.filter(r => r.type || r.identifier).length : 0;
  const codeCount = Array.isArray(STATE.codeDescription) ? STATE.codeDescription.filter(r => r.identifier).length : 0;
  const hasSensitive = Array.isArray(STATE.dataDescription) && STATE.dataDescription.some(d => d.sensitive || d.personal);

  return {
    project: STATE.projectName || "—",
    unit: STATE.unit || "—",
    funder: ctx.funderMeta.label,
    hasSensitive,
    dataCount,
    codeCount,
    dataLicense: STATE.dataLicense || "CC-BY-4.0",
    codeLicense: STATE.codeLicense || "MIT",
    funderRequirements: ctx.funderMeta.requirements,
    resourceCount: ctx.activeResources.length,
    resources: ctx.activeResources.map(r => r.label),
  };
}
