// ui.js — UI rendering and interaction logic

import { STATE } from "./state.js";
import { evaluateState } from "./rules.js";
import * as T from "./templates.js";
import { getDefaultFolders, getStep, goToStep, nextStep, assembleAndDownload } from "./app.js";
import { checkLicenseCompatibility } from "./validation.js";
import { t, getLang } from "./i18n.js";

// ── XSS prevention (inline copy to avoid circular deps) ─────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── License quiz data mapping ────────────────────────────────────────────────
export const DATA_LICENSE_MAP = {
  'yes_yes': 'CC-BY-4.0',
  'yes_sa':  'CC-BY-SA-4.0',
  'yes_no':  'CC-BY-ND-4.0',
  'no_yes':  'CC-BY-NC-4.0',
  'no_sa':   'CC-BY-NC-SA-4.0',
  'no_no':   'CC-BY-NC-ND-4.0',
};

// ── License quiz ─────────────────────────────────────────────────────────────
export function updateQuizDataReco() {
  const q1 = document.querySelector("#quiz-data-q1 .on")?.dataset?.v || 'any';
  const q2 = document.querySelector("#quiz-data-q2 .on")?.dataset?.v || 'yes';
  let license = 'CC0-1.0';
  if (q1 !== 'any') {
    license = DATA_LICENSE_MAP[`${q1}_${q2}`] || 'CC-BY-4.0';
  }
  document.getElementById('quiz-data-reco').textContent = license;
}

export function applyQuizData() {
  const reco = document.getElementById('quiz-data-reco').textContent;
  const sel = document.getElementById('data-license');
  sel.value = reco;
  sel.dispatchEvent(new Event('change'));
}

export function updateQuizCodeReco() {
  const q1 = document.querySelector("#quiz-code-q1 .on")?.dataset?.v || 'os';
  const patents = document.getElementById('quiz-code-patents');
  if (q1 === 'closed') {
    document.getElementById('quiz-code-followup').style.display = 'none';
    document.getElementById('quiz-code-reco').textContent = 'none';
    return;
  } else {
    document.getElementById('quiz-code-followup').style.display = 'block';
  }
  const q2 = document.querySelector("#quiz-code-q2 .on")?.dataset?.v || 'perm';
  if (q2 === 'copyleft') {
    patents.style.display = 'none';
    document.getElementById('quiz-code-reco').textContent = 'GPL-3.0';
  } else {
    patents.style.display = 'block';
    const q3 = document.querySelector("#quiz-code-q3 .on")?.dataset?.v || 'no';
    document.getElementById('quiz-code-reco').textContent = q3 === 'yes' ? 'Apache-2.0' : 'MIT';
  }
}

export function applyQuizCode() {
  const reco = document.getElementById('quiz-code-reco').textContent;
  const sel = document.getElementById('code-license');
  sel.value = reco;
  sel.dispatchEvent(new Event('change'));
}

// ── License sections visibility ──────────────────────────────────────────────
export function updateLicenseSections() {
  const hasData = STATE.dataDescription.length > 0;
  const hasCode = STATE.codeDescription.length > 0;
  const dataSec = document.getElementById("data-license-section");
  const codeSec = document.getElementById("code-license-section");
  if (dataSec) dataSec.style.display = hasData ? "block" : "none";
  if (codeSec) codeSec.style.display = hasCode ? "block" : "none";
}

// ── License compatibility warnings ───────────────────────────────────────────
export function updateLicenseWarnings() {
  const dataLic = document.getElementById("data-license")?.value || "CC-BY-4.0";
  const codeLic = document.getElementById("code-license")?.value || "MIT";
  const { dataWarnings, codeWarnings, dataCompatItems, codeCompatItems } =
    checkLicenseCompatibility(STATE.reusedSources, dataLic, codeLic);

  const dataWarn = document.getElementById("compat-warn-data");
  const codeWarn = document.getElementById("compat-warn-code");
  if (dataWarn) {
    dataWarn.style.display = dataWarnings.length ? "block" : "none";
    dataWarn.innerHTML = dataWarnings.length ? `Attention : ${dataWarnings.length} source(s) réutilisée(s) incompatible(s). Vérifiez le tableau des sources ci-dessous.` : "";
  }
  if (codeWarn) {
    codeWarn.style.display = codeWarnings.length ? "block" : "none";
    codeWarn.innerHTML = codeWarnings.length ? `Attention : ${codeWarnings.length} source(s) réutilisée(s) incompatible(s). Vérifiez le tableau des sources ci-dessous.` : "";
  }

  const allItems = [...dataCompatItems, ...codeCompatItems];
  const summaryBody = document.getElementById("reused-summary-body");
  const summaryEmpty = document.getElementById("reused-summary-empty");
  const summaryWrap = document.getElementById("reused-summary-table-wrap");
  if (!summaryBody) return;

  if (allItems.length === 0) {
    summaryBody.innerHTML = "";
    if (summaryEmpty) summaryEmpty.style.display = "block";
    if (summaryWrap) summaryWrap.style.display = "none";
    return;
  }
  if (summaryEmpty) summaryEmpty.style.display = "none";
  if (summaryWrap) summaryWrap.style.display = "block";

  summaryBody.innerHTML = allItems.map(item => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.lic)}</td>
      <td style="color:${item.isIncompat ? 'var(--red)' : 'var(--teal)'}">${escapeHtml(item.status)}</td>
    </tr>
  `).join("");
}

// ── Naming convention preview ────────────────────────────────────────────────
export function updateNamingPreview() {
  const ex = T.generateNamingExamples(STATE);
  const el = document.getElementById("naming-preview-example");
  if (el && ex.raw) el.textContent = ex.raw;
}

// ── Funder UI ────────────────────────────────────────────────────────────────
export function updateFunderUI(funder) {
  const ctx = evaluateState({ ...STATE, funder });
  const f = ctx.funderMeta;
  if (!f) return;
  const info = document.getElementById("funder-info");
  const reqLabel      = getLang() === "fr" ? "Exigences clés"     : "Key requirements";
  const policyLabel   = getLang() === "fr" ? "Politique open data" : "Open data policy";
  const deadlineLabel = getLang() === "fr" ? "Délai DMP"          : "DMP deadline";

  const labelT  = t(`funder.${funder}.label`) || f.label;
  const reqsRaw = t(`funder.${funder}.requirements`) || "";
  const reqs    = reqsRaw ? reqsRaw.split(";") : f.requirements;
  const openData = t(`funder.${funder}.openDataPolicy`) || f.openDataPolicy;
  const deadline = t(`funder.${funder}.dmpDeadline`) || f.dmpDeadline;

  info.innerHTML = `<strong>${labelT}</strong>
    <ul>${reqs.map(r => `<li>${r}</li>`).join("")}</ul>
    <strong>${policyLabel}:</strong> ${openData}<br>
    <strong>${deadlineLabel}:</strong> ${deadline}`;
  info.style.display = "block";
}

// ── Dynamic texts ────────────────────────────────────────────────────────────
export function updateDynamicTexts() {
  if (!getLang()) return;
  const step = getStep();
  const topStep = document.getElementById("top-step");
  if (topStep) {
    if (step === 0) {
      topStep.textContent = "🏠 " + t("onboarding.title");
    } else if (step < 4) {
      topStep.textContent = t("topbar.step", step, 3);
    } else {
      topStep.textContent = t("topbar.result");
    }
  }
  document.querySelectorAll(".nav-step").forEach((el, i) => {
    el.querySelectorAll("[data-i18n]").forEach(titleEl => {
      if (titleEl.dataset.i18n) titleEl.textContent = t(titleEl.dataset.i18n);
    });
  });
  // clearAllErrors is imported from validation, but we call it via _rdm
  if (window._rdm && window._rdm.clearAllErrors) {
    window._rdm.clearAllErrors();
  }
  updateLicenseWarnings();
}

// ── Sidebar max step ─────────────────────────────────────────────────────────
export function updateSidebarMax() {
  const cur = getStep();
  document.querySelectorAll(".nav-step").forEach((el, i) => {
    el.classList.toggle("done",    i < cur || (i <= (window._rdm._maxStep || 0) && i !== cur));
    el.classList.toggle("active",  i === cur);
    el.classList.toggle("pending", i > (window._rdm._maxStep || 0) && i !== cur);
  });
}

// ── Overlay ──────────────────────────────────────────────────────────────────
export function showOverlay(msgKey, sub) {
  const o = document.getElementById("loading-overlay");
  if (o) o.classList.add("show");
  const msg = document.getElementById("overlay-msg");
  if (msg && t) msg.textContent = t(msgKey);
  const subEl = document.getElementById("overlay-sub");
  if (subEl) subEl.textContent = sub || "";
}

export function hideOverlay() {
  const o = document.getElementById("loading-overlay");
  if (o) o.classList.remove("show");
}

// ── Folder tree customisation ────────────────────────────────────────────────
export function renderFolderTree() {
  const container = document.getElementById("tree-preview");
  if (!container) return;
  const ctx = evaluateState(STATE);
  const folders = getDefaultFolders(STATE, ctx);

  STATE._customFolders = STATE._customFolders || {};

  const tree = {};
  folders.forEach(f => {
    const parts = f.path.split("/");
    const root = parts[0];
    if (!tree[root]) tree[root] = [];
    tree[root].push(f);
  });

  const rootKeys = Object.keys(tree);
  const p = STATE.projectName || "mon_projet";

  const totalItems = folders.length;
  const checkedItems = folders.filter(f => {
    const val = STATE._customFolders[f.path];
    return val !== undefined ? val : f.active;
  }).length;

  let html = `<div class="folder-root">
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
      <input type="checkbox" id="toggle-all" ${checkedItems === totalItems ? "checked" : ""}/>
      <span>${p}/</span>
      <span class="folder-count">${checkedItems}/${totalItems}</span>
    </label>
  </div>`;

  rootKeys.forEach((root, i) => {
    const children = tree[root];
    const allChecked = children.every(f => {
      const val = STATE._customFolders[f.path];
      return val !== undefined ? val : f.active;
    });
    const checkedCount = children.filter(f => {
      const val = STATE._customFolders[f.path];
      return val !== undefined ? val : f.active;
    }).length;
    const isLast = i === rootKeys.length - 1;

    html += `<div class="folder-tree-line">
      <span class="tree-char">${isLast ? "└" : "├"}</span>
      <label class="folder-parent" style="flex:1">
        <input type="checkbox" data-root="${root}" ${allChecked ? "checked" : ""}/>
        <span>${root}/</span>
        <span class="folder-count">${checkedCount}/${children.length}</span>
      </label>
    </div>`;

    if (children.length > 0) {
      html += `<div class="folder-children">`;
      children.forEach((f, j) => {
        const checked = STATE._customFolders[f.path] !== undefined ? STATE._customFolders[f.path] : f.active;
        const sub = f.path.split("/")[1];
        html += `<label class="folder-child">
          <input type="checkbox" data-path="${f.path}" ${checked ? "checked" : ""}/>
          <span>${sub || f.path}</span>
        </label>`;
      });
      html += `</div>`;
    }
  });

  container.innerHTML = html;

  container.querySelectorAll("[data-root]").forEach(cb => {
    cb.addEventListener("change", function() {
      const root = this.dataset.root;
      const children = tree[root];
      children.forEach(f => { STATE._customFolders[f.path] = this.checked; });
      renderFolderTree();
    });
  });

  container.querySelectorAll("[data-path]").forEach(cb => {
    cb.addEventListener("change", function() {
      STATE._customFolders[this.dataset.path] = this.checked;
      renderFolderTree();
    });
  });

  const toggleAll = document.getElementById("toggle-all");
  if (toggleAll) {
    toggleAll.addEventListener("change", function() {
      folders.forEach(f => { STATE._customFolders[f.path] = this.checked; });
      renderFolderTree();
    });
  }
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export function showTab(n) {
  document.querySelectorAll(".tab").forEach((t,i) => t.classList.toggle("on", i===n));
  document.querySelectorAll(".tab-panel").forEach((p,i) => p.classList.toggle("on", i===n));
}

// ── Copy ─────────────────────────────────────────────────────────────────────
export function copyEl(id, btn) {
  const text = document.getElementById(id)?.textContent || "";
  const doCopy = () => {
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = t ? t("btn.copied") : "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = t ? t("btn.copy") : "Copy";
      btn.classList.remove("copied");
    }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(doCopy).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      doCopy();
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    doCopy();
  }
}

// ── Result screen builder ────────────────────────────────────────────────────
export function buildResult() {
  showOverlay("overlay.generating");
  const ctx = evaluateState(STATE);
  const summary = T.buildSummary(ctx);

  const grid = document.getElementById("summary-grid");
  const cells = [
    [t("sum.project"),   summary.project],
    [t("sum.unit"),      summary.unit],
    [t("sum.funder"),    summary.funder],
  ];
  if (summary.dataCount > 0) {
    cells.push([t("sum.datasets"),  summary.dataCount + " jeu(x)"]);
    cells.push([t("sum.datalic"),   summary.dataLicense]);
  }
  if (summary.codeCount > 0) {
    cells.push([t("sum.codes"),     summary.codeCount + " log."]);
    cells.push([t("sum.codelic"),   summary.codeLicense]);
  }
  if (summary.hasSensitive) cells.push([t("sum.sensitive"), t("sum.yes_warn")]);
  grid.innerHTML = cells.map(([k,v]) =>
    `<div class="stat-cell"><div class="stat-key">${escapeHtml(k)}</div><div class="stat-val">${escapeHtml(v) || "—"}</div></div>`
  ).join("");

  renderFolderTree();

  document.getElementById("naming-preview").textContent = T.buildNamingConventions(STATE, ctx, "en");
  document.getElementById("readme-preview").textContent = T.buildReadme(STATE, ctx, "en");

  const resDiv = document.getElementById("resources-preview");
  if (resDiv) {
    const typeColors = {
      PDF:  "background:#FEF0F0;color:#A80013;border:1px solid #FCE4E4",
      DOCX: "background:#E6F1FB;color:#0C447C;border:1px solid #B5D4F4",
      ODT:  "background:#E0F0EB;color:#0F6E56;border:1px solid #9FE1CB",
      MD:   "background:#F1EFE8;color:#444441;border:1px solid #D3D1C7",
      CSV:  "background:#FDF4E1;color:#633806;border:1px solid #FAC775",
    };
    const getType = f => f.split(".").pop().toUpperCase();
    const row = (label, file) => {
      const type = getType(file);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--bg-card);border:1px solid var(--line);border-radius:var(--r-lg);margin-bottom:6px">
        <span style="font-size:13px;color:var(--ink-2)">${label}</span>
        <span style="font-size:10px;font-weight:500;padding:2px 7px;border-radius:99px;${typeColors[type]||typeColors.MD}">${type}</span>
      </div>`;
    };
    const section = (title, rows) => rows.length ? `
      <div style="margin-bottom:1.25rem">
        <div style="font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:8px">${title}</div>
        ${rows.join("")}
      </div>` : "";

    const dmpRows    = ctx.activeResources.filter(r => r.file.toLowerCase().startsWith("dmp")).map(r => row(r.label, r.file));
    const guideRows  = ctx.activeResources.filter(r => !r.file.toLowerCase().startsWith("dmp") && !r.file.toLowerCase().startsWith("rdm_strategy")).map(r => row(r.label, r.file));
    const stratRows  = ctx.activeResources.filter(r => r.file.toLowerCase().startsWith("rdm_strategy")).map(r => row(r.label, r.file));
    const checkRows  = [
      row(t("res.checklist.collection"), "checklist_data_collection.md"),
      row(t("res.checklist.quality"),    "checklist_data_quality.md"),
      row(t("res.checklist.archiving"),  "checklist_archiving.md"),
      ...(Array.isArray(STATE.dataDescription) && STATE.dataDescription.some(d => d.sensitive || d.personal) ? [
        row(t("res.checklist.ethics"), "checklist_ethics.md"),
        row(t("res.guide.anon"),       "guide_anonymization.md"),
      ] : []),
      row(t("res.dict"),    "data_dictionary_template.csv"),
      row(t("res.readme"),  "README.md"),
      row(t("res.naming"),  "NAMING_CONVENTIONS.md"),
    ];

    resDiv.innerHTML =
      section(t("res.dmp"),        dmpRows) +
      section(t("res.guides"),     guideRows) +
      section(t("res.strategy"),   stratRows) +
      section(t("res.checks"), checkRows);
  }

  const fileCount = 12 + ctx.dataFolders.length * 2 + ctx.activeResources.length + (STATE.generateNotebook ? 1 : 0) + (STATE.generateGitignore ? 1 : 0);
  const filesLabel    = getLang() === "fr" ? "fichiers" : "files";
  const resourceLabel = getLang() === "fr" ? "ressources EPFL" : "EPFL resources";
  document.getElementById("dl-meta").innerHTML = [
    `<div class="dl-meta-item"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h8M4 10h8M4 14h8M2 2h12v14H2z"/></svg>${fileCount}+ ${filesLabel}</div>`,
    `<div class="dl-meta-item"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>DMP Template — ${ctx.funderMeta.label}</div>`,
    `<div class="dl-meta-item"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v12M2 8h12"/></svg>${ctx.activeResources.length} ${resourceLabel}</div>`,
  ].join("");

  nextStep();
  window._rdm._maxStep = Math.max(window._rdm._maxStep || 0, getStep());
  updateSidebarMax();
  hideOverlay();
}

// ── Download ─────────────────────────────────────────────────────────────────
export async function triggerDownload() {
  const btn = document.getElementById("dl-btn");
  const progressWrap = document.getElementById("progress-dl");
  const fill = document.getElementById("dl-fill");
  const label = document.getElementById("dl-label");
  btn.disabled = true;
  progressWrap.classList.add("show");
  showOverlay("overlay.downloading", t("s6.dl.prep"));
  try {
    await assembleAndDownload((pct, msg) => {
      fill.style.width = pct + "%";
      fill.setAttribute("aria-valuenow", pct);
      label.textContent = msg;
    });
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg> ${t("btn.download.again")}`;
      fill.style.width = "100%";
      fill.setAttribute("aria-valuenow", 100);
      label.textContent = t("s6.dl.done");
    }, 1000);
  } catch (e) {
    console.error("[RDM] Download failed:", e);
    label.textContent = t("s6.dl.error") || "Download error";
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg> ${t("btn.download")}`;
  } finally {
    hideOverlay();
  }
}
