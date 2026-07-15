// form.js — Form binding, table sync, and import/export logic

import { STATE } from "./state.js";
import { goToStep } from "./app.js";
import { t, setLang, applyLang } from "./i18n.js";

// ── XSS prevention ──────────────────────────────────────────────────────────
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── Form field binding ───────────────────────────────────────────────────────
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

// ── Data table sync ──────────────────────────────────────────────────────────
export function syncDataTable() {
  const rows = document.querySelectorAll("#data-table-body tr");
  STATE.dataDescription = Array.from(rows).map(tr => ({
    type: tr.querySelector(".dt-type")?.value || "",
    format: tr.querySelector(".dt-format")?.value || "",
    volume: tr.querySelector(".dt-volume")?.value || "",
    sensitive: tr.querySelector(".dt-sensitive")?.checked || false,
    personal: tr.querySelector(".dt-personal")?.checked || false,
    identifier: tr.querySelector(".dt-id")?.value || "",
    origin: tr.querySelector(".dt-origin")?.value || "generated",
  })).filter(r => r.type || r.identifier);
  window._rdm.updateLicenseSections();
  syncReusedTable();
  window._rdm.renderFolderTree();
}

export function addDataRow() {
  const tbody = document.getElementById("data-table-body");
  const tr = document.createElement("tr");
  tr.innerHTML = '<td><input type="text" class="dt-id" placeholder="tabular_data"/></td><td><input type="text" class="dt-type" placeholder="Choisissez ou tapez…" list="datalist-types"/></td><td><input type="text" class="dt-format" placeholder="CSV, Parquet"/></td><td><input type="text" class="dt-volume" placeholder="~500 Go"/></td><td style="text-align:center"><input type="checkbox" class="dt-sensitive"/></td><td style="text-align:center"><input type="checkbox" class="dt-personal"/></td><td><select class="dt-origin" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)"><option value="generated">Généré</option><option value="reused">Réutilisé</option></select></td><td><button class="btn-icon" onclick="this.closest(\'tr\').remove();_rdm.syncDataTable()" title="Supprimer">✕</button></td>';
  tbody.appendChild(tr);
  tr.querySelector(".dt-id").focus();
}

// ── Code table sync ──────────────────────────────────────────────────────────
export function syncCodeTable() {
  const rows = document.querySelectorAll("#code-table-body tr");
  STATE.codeDescription = Array.from(rows).map(tr => ({
    language: tr.querySelector(".ct-lang")?.value || "",
    repository: tr.querySelector(".ct-repo")?.value || "",
    identifier: tr.querySelector(".ct-id")?.value || "",
    origin: tr.querySelector(".ct-origin")?.value || "generated",
  })).filter(r => r.identifier);
  window._rdm.updateLicenseSections();
  syncReusedTable();
  const hasGeneratedCode = STATE.codeDescription.some(r => r.origin === "generated");
  const opts = document.getElementById("code-options");
  if (opts) opts.style.display = hasGeneratedCode ? "block" : "none";
  window._rdm.renderFolderTree();
}

export function addCodeRow() {
  const tbody = document.getElementById("code-table-body");
  const tr = document.createElement("tr");
  tr.innerHTML = '<td><input type="text" class="ct-id" placeholder="src_analysis"/></td><td><input type="text" class="ct-lang" placeholder="Python 3" list="datalist-langs"/></td><td><input type="text" class="ct-repo" placeholder="gitlab.epfl.ch/…"/></td><td><select class="ct-origin" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)"><option value="generated">Généré</option><option value="reused">Réutilisé</option></select></td><td><button class="btn-icon" onclick="this.closest(\'tr\').remove();_rdm.syncCodeTable()" title="Supprimer">✕</button></td>';
  tbody.appendChild(tr);
  tr.querySelector(".ct-id").focus();
}

// ── Reused sources sync ──────────────────────────────────────────────────────
export function syncReusedTable() {
  const tbody = document.getElementById("reused-table-body");
  const section = document.getElementById("reused-section");
  const empty = document.getElementById("reused-empty");
  if (!tbody) return;
  const reused = {};
  STATE.dataDescription.forEach(row => {
    if (row.origin === "reused" && row.identifier) {
      reused[row.identifier] = {
        doi: "", link: "", sourceLicense: "CC-BY-4.0", citation: "",
        sourceTable: "data",
        ...(STATE.reusedSources[row.identifier] || {}),
        sourceTable: "data",
      };
    }
  });
  STATE.codeDescription.forEach(row => {
    if (row.origin === "reused" && row.identifier) {
      reused[row.identifier] = {
        doi: "", link: "", sourceLicense: "MIT", citation: "",
        sourceTable: "code",
        ...(STATE.reusedSources[row.identifier] || {}),
        sourceTable: "code",
      };
    }
  });
  Object.entries(STATE.reusedSources).forEach(([id, data]) => {
    if (data.manual) reused[id] = data;
  });
  STATE.reusedSources = reused;

  const ids = Object.keys(reused);
  if (ids.length === 0) {
    tbody.innerHTML = "";
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "block";
  if (empty) empty.style.display = "none";
  tbody.innerHTML = ids.map(id => {
    const r = reused[id];
    const icon = r.sourceTable === "code" ? "[Code]" : "[Data]";
    const safeId = escapeHtml(id);
    const safeDoi = escapeHtml(r.doi || "");
    const safeLink = escapeHtml(r.link || "");
    const safeCitation = escapeHtml(r.citation || "");
    return `<tr>
      <td><span style="cursor:pointer;color:var(--teal);text-decoration:underline" onclick="_rdm.scrollToSource('${safeId}')" title="Voir la source" data-id="${safeId}">${icon} ${safeId}</span></td>
      <td><input type="text" class="rs-doi" value="${safeDoi}" placeholder="10.5281/zenodo.…" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)"/></td>
      <td><input type="text" class="rs-link" value="${safeLink}" placeholder="https://github.com/…" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)"/></td>
      <td><select class="rs-license" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)">
        <optgroup label="Creative Commons">
          <option value="CC0-1.0">CC0 1.0</option>
          <option value="CC-BY-4.0">CC BY 4.0</option>
          <option value="CC-BY-SA-4.0">CC BY-SA 4.0</option>
          <option value="CC-BY-ND-4.0">CC BY-ND 4.0</option>
          <option value="CC-BY-NC-4.0">CC BY-NC 4.0</option>
          <option value="CC-BY-NC-SA-4.0">CC BY-NC-SA 4.0</option>
          <option value="CC-BY-NC-ND-4.0">CC BY-NC-ND 4.0</option>
          <option value="CC-BY-2.0">CC BY 2.0</option>
        </optgroup>
        <optgroup label="Open Database">
          <option value="ODbL-1.0">ODbL 1.0</option>
        </optgroup>
        <optgroup label="Open Source">
          <option value="MIT">MIT</option>
          <option value="Apache-2.0">Apache 2.0</option>
          <option value="GPL-3.0">GPL v3</option>
          <option value="BSD-3-Clause">BSD 3-Clause</option>
        </optgroup>
        <option value="restricted">Accès restreint</option>
      </select></td>
      <td><input type="text" class="rs-citation" value="${safeCitation}" placeholder="Auteur(s) (année). Titre." style="width:100%;padding:4px 6px;font-size:11px;border:1px solid var(--line-2);border-radius:var(--r)"/></td>
      <td><button class="btn-icon" onclick="_rdm.removeReusedSource('${safeId}')" title="Supprimer">✕</button></td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll("tr").forEach(tr => {
    const idSpan = tr.querySelector("[data-id]");
    const rowSel = tr.querySelector(".rs-license");
    if (idSpan && rowSel) {
      const key = idSpan.dataset.id;
      if (reused[key]?.sourceLicense) rowSel.value = reused[key].sourceLicense;
    }
  });

  window._rdm.updateLicenseWarnings();
}

export function syncReusedMeta() {
  const rows = document.querySelectorAll("#reused-table-body tr");
  rows.forEach(tr => {
    const idSpan = tr.querySelector("[data-id]");
    if (!idSpan) return;
    const id = idSpan.dataset.id;
    if (!id) return;
    STATE.reusedSources[id] = STATE.reusedSources[id] || {};
    STATE.reusedSources[id].doi = tr.querySelector(".rs-doi")?.value || "";
    STATE.reusedSources[id].link = tr.querySelector(".rs-link")?.value || "";
    STATE.reusedSources[id].sourceLicense = tr.querySelector(".rs-license")?.value || "CC-BY-4.0";
    STATE.reusedSources[id].citation = tr.querySelector(".rs-citation")?.value || "";
  });
  window._rdm.updateLicenseWarnings();
}

export function scrollToSource(encodedId) {
  const id = decodeURIComponent(encodedId);
  const dtInput = Array.from(document.querySelectorAll("#data-table-body .dt-id")).find(el => el.value === id);
  if (dtInput) { dtInput.closest("tr").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  const ctInput = Array.from(document.querySelectorAll("#code-table-body .ct-id")).find(el => el.value === id);
  if (ctInput) { ctInput.closest("tr").scrollIntoView({ behavior: "smooth", block: "center" }); }
}

export function removeReusedSource(id) {
  delete STATE.reusedSources[id];
  const dtInput = document.querySelector(`#data-table-body .dt-id[value="${id}"]`);
  if (dtInput) { const sel = dtInput.closest("tr").querySelector(".dt-origin"); if (sel) sel.value = "generated"; }
  const ctInput = document.querySelector(`#code-table-body .ct-id[value="${id}"]`);
  if (ctInput) { const sel = ctInput.closest("tr").querySelector(".ct-origin"); if (sel) sel.value = "generated"; }
  syncDataTable();
  syncCodeTable();
  syncReusedTable();
}

export function addManualSource() {
  const id = "src_" + Date.now().toString(36);
  STATE.reusedSources[id] = { doi: "", link: "", sourceLicense: "CC-BY-4.0", citation: "", sourceTable: "data", manual: true };
  syncReusedTable();
  setTimeout(() => {
    const input = document.querySelector("#reused-table-body tr:last-child .rs-doi");
    if (input) input.focus();
  }, 100);
}

// ── Contributors sync ────────────────────────────────────────────────────────
export function syncContributors() {
  const rows = document.querySelectorAll("#contributors-body tr");
  STATE.contributors = Array.from(rows).map(tr => ({
    lastName: tr.querySelector(".ct-last")?.value || "",
    firstName: tr.querySelector(".ct-first")?.value || "",
    email: tr.querySelector(".ct-email")?.value || "",
    orcid: tr.querySelector(".ct-orcid")?.value || "",
    ror: tr.querySelector(".ct-ror")?.value || "",
    role: tr.querySelector(".ct-role")?.value || "",
  })).filter(r => r.lastName || r.firstName);
}

export function addContributorRow() {
  const tbody = document.getElementById("contributors-body");
  const tr = document.createElement("tr");
  tr.innerHTML = '<td><input type="text" class="ct-last" placeholder="Doe"/></td><td><input type="text" class="ct-first" placeholder="Jane"/></td><td><input type="email" class="ct-email" placeholder="jane.doe@epfl.ch"/></td><td><input type="text" class="ct-orcid" placeholder="0000-0000-0000-0000"/></td><td><input type="text" class="ct-ror" placeholder="https://ror.org/..."/></td><td><select class="ct-role" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line-2);border-radius:var(--r)"><option value="">—</option><option value="Project leader">Project leader</option><option value="Principal investigator">Principal investigator</option><option value="Project manager">Project manager</option><option value="Data collector">Data collector</option><option value="Data curator">Data curator</option><option value="Data manager">Data manager</option><option value="Researcher">Researcher</option><option value="Supervisor">Supervisor</option><option value="Contact person">Contact person</option><option value="Producer">Producer</option><option value="Editor">Editor</option><option value="Distributor">Distributor</option><option value="Sponsor">Sponsor</option><option value="Hosting institution">Hosting institution</option><option value="Other">Other</option></select></td><td><button class="btn-icon" onclick="this.closest(\'tr\').remove();_rdm.syncContributors()" title="Supprimer">✕</button></td>';
  tbody.appendChild(tr);
  tr.querySelector(".ct-last").focus();
}

// ── Import / Export ──────────────────────────────────────────────────────────
export function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.state) throw new Error("Invalid config file");
      Object.assign(STATE, data.state);
      document.getElementById("contributors-body").innerHTML = "";
      document.getElementById("data-table-body").innerHTML = "";
      document.getElementById("code-table-body").innerHTML = "";
      document.getElementById("reused-table-body").innerHTML = "";
      const contribCount = STATE.contributors?.length || 1;
      for (let i = 0; i < contribCount; i++) addContributorRow();
      const dataCount = STATE.dataDescription?.length || 1;
      for (let i = 0; i < dataCount; i++) addDataRow();
      const codeCount = STATE.codeDescription?.length || 1;
      for (let i = 0; i < codeCount; i++) addCodeRow();
      const contribRows = document.querySelectorAll("#contributors-body tr");
      contribRows.forEach((tr, i) => {
        if (STATE.contributors?.[i]) {
          const c = STATE.contributors[i];
          const inputs = tr.querySelectorAll("input, select");
          if (inputs[0]) inputs[0].value = c.lastName || "";
          if (inputs[1]) inputs[1].value = c.firstName || "";
          if (inputs[2]) inputs[2].value = c.email || "";
          if (inputs[3]) inputs[3].value = c.orcid || "";
          if (inputs[4]) inputs[4].value = c.ror || "";
          if (inputs[5]) inputs[5].value = c.role || "";
        }
      });
      const dataRows = document.querySelectorAll("#data-table-body tr");
      dataRows.forEach((tr, i) => {
        if (STATE.dataDescription?.[i]) {
          const d = STATE.dataDescription[i];
          if (tr.querySelector(".dt-id")) tr.querySelector(".dt-id").value = d.identifier || "";
          if (tr.querySelector(".dt-type")) tr.querySelector(".dt-type").value = d.type || "";
          if (tr.querySelector(".dt-format")) tr.querySelector(".dt-format").value = d.format || "";
          if (tr.querySelector(".dt-volume")) tr.querySelector(".dt-volume").value = d.volume || "";
          if (tr.querySelector(".dt-sensitive")) tr.querySelector(".dt-sensitive").checked = !!d.sensitive;
          if (tr.querySelector(".dt-personal")) tr.querySelector(".dt-personal").checked = !!d.personal;
          if (tr.querySelector(".dt-origin")) tr.querySelector(".dt-origin").value = d.origin || "generated";
        }
      });
      const codeRows = document.querySelectorAll("#code-table-body tr");
      codeRows.forEach((tr, i) => {
        if (STATE.codeDescription?.[i]) {
          const c = STATE.codeDescription[i];
          if (tr.querySelector(".ct-id")) tr.querySelector(".ct-id").value = c.identifier || "";
          if (tr.querySelector(".ct-lang")) tr.querySelector(".ct-lang").value = c.language || "";
          if (tr.querySelector(".ct-repo")) tr.querySelector(".ct-repo").value = c.repository || "";
          if (tr.querySelector(".ct-origin")) tr.querySelector(".ct-origin").value = c.origin || "generated";
        }
      });
      syncContributors();
      syncDataTable();
      syncCodeTable();
      syncReusedTable();
      window._rdm.updateLicenseSections();
      if (document.getElementById("proj-name")) document.getElementById("proj-name").value = STATE.projectName || "";
      if (document.getElementById("proj-unit")) document.getElementById("proj-unit").value = STATE.unit || "";
      if (document.getElementById("proj-desc")) document.getElementById("proj-desc").value = STATE.projectDescription || "";
      if (document.getElementById("proj-method")) document.getElementById("proj-method").value = STATE.methodology || "";
      if (document.getElementById("proj-keywords")) document.getElementById("proj-keywords").value = STATE.keywords || "";
      if (document.getElementById("proj-grant")) document.getElementById("proj-grant").value = STATE.grantNumber || "";
      if (document.getElementById("data-license")) document.getElementById("data-license").value = STATE.dataLicense || "CC-BY-4.0";
      if (document.getElementById("code-license")) document.getElementById("code-license").value = STATE.codeLicense || "MIT";
      if (document.getElementById("cb-multisite")) document.getElementById("cb-multisite").checked = !!STATE.multisite;
      if (document.getElementById("cb-humandata")) document.getElementById("cb-humandata").checked = !!STATE.humanData;
      if (document.getElementById("cb-multiteam")) document.getElementById("cb-multiteam").checked = !!STATE.multiTeam;
      if (document.getElementById("cb-notebook")) document.getElementById("cb-notebook").checked = !!STATE.generateNotebook;
      if (document.getElementById("cb-gitignore")) document.getElementById("cb-gitignore").checked = !!STATE.generateGitignore;
      const namingRadios = document.querySelectorAll("#naming-radios [data-v]");
      namingRadios.forEach(el => el.classList.toggle("on", el.dataset.v === (STATE.namingPattern || "rdm")));
      if (STATE.funder) {
        document.querySelectorAll("#funder-radios [data-v]").forEach(el => {
          el.classList.toggle("on", el.dataset.v === STATE.funder);
        });
        window._rdm.updateFunderUI(STATE.funder);
      }
      window._rdm.updateNamingPreview();
      applyLang();
      goToStep(1);
      window._rdm.updateSidebarMax();
      window._rdm.updateDynamicTexts();
    } catch(err) {
      alert("Erreur : fichier de configuration invalide.");
      console.error("[RDM] Import error:", err);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

export function startNew() {
  if (!confirm(t("confirm.new"))) return;
  Object.assign(STATE, {
    projectName: "", unit: "", contributors: [],
    projectDescription: "", methodology: "", keywords: "",
    grantNumber: "",
    multisite: false, humanData: false, multiTeam: false,
    dataDescription: [],
    codeDescription: [],
    namingPattern: "rdm",
    funder: null, dataLicense: "CC-BY-4.0", codeLicense: "MIT",
    generateNotebook: false, generateGitignore: false,
    reusedSources: {},
  });
  document.getElementById("contributors-body").innerHTML = "";
  addContributorRow();
  document.getElementById("data-table-body").innerHTML = "";
  addDataRow();
  document.getElementById("code-table-body").innerHTML = "";
  addCodeRow();
  document.getElementById("reused-table-body").innerHTML = "";
  document.getElementById("funder-info").style.display = "none";
  document.querySelectorAll("input[type=text], input[type=email]").forEach(el => el.value = "");
  document.querySelectorAll("input[type=checkbox]").forEach(el => el.checked = false);
  document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
  document.querySelectorAll(".chip.on, .radio-card.on, .toggle-btn.on, .funder-card.on").forEach(el => el.classList.remove("on"));
  window._rdm._maxStep = 0;
  goToStep(0);
  window._rdm.updateSidebarMax();
  window._rdm.updateDynamicTexts();
}

// ── Language switching ─────────────────────────────────────────────────────────
export function switchLang(lang) {
  setLang(lang);
  applyLang();
  window._rdm.updateDynamicTexts();
  document.getElementById("lang-fr").classList.toggle("active", lang === "fr");
  document.getElementById("lang-en").classList.toggle("active", lang === "en");
}
