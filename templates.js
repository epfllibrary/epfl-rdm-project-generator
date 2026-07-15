// templates.js — All file templates (content always in English)

import { STATE } from "./state.js";
import { evaluateState } from "./rules.js";

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const slug = s => (s || "project").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

// ── Naming convention system (Phase 3) ──────────────────────────────────────────
export const NAMING_PRESETS = {
  rdm:    { pattern: "{project}_{type}_{date}_v{version}.{ext}", sep: "_" },
  date_first: { pattern: "{date}_{project}_{type}_v{version}.{ext}", sep: "_" },
  type_first: { pattern: "{type}_{project}_{version}_{date}.{ext}", sep: "_" },
  hyphen: { pattern: "{project}-{type}-v{version}-{date}.{ext}", sep: "-" },
};

export function getNamingPattern(state) {
  const preset = NAMING_PRESETS[state.namingPattern];
  return preset ? preset.pattern : NAMING_PRESETS.rdm.pattern;
}

export function applyNaming(pattern, vars) {
  let r = pattern;
  for (const [k, v] of Object.entries(vars)) {
    r = r.replace(new RegExp(`\\{${k}\\}`, 'g'), v || `{${k}}`);
  }
  return r;
}

export function generateNamingExamples(state) {
  const p = slug(state.projectName || "project");
  const d = today().replace(/-/g, "");
  const pattern = getNamingPattern(state);
  // Use the first data row's identifier if available, else fallback
  const firstId = Array.isArray(state.dataDescription) && state.dataDescription[0]?.identifier
    ? slug(state.dataDescription[0].identifier) : "raw_tabular";
  return {
    raw:      applyNaming(pattern, { project: p, type: firstId, date: d, version: "01", ext: "csv" }),
    processed: applyNaming(pattern, { project: p, type: "processed_merged", date: d, version: "02", ext: "parquet" }),
    fig:      applyNaming(pattern, { project: p, type: "fig01_distribution", date: d, version: "", ext: "svg" }),
    notebook: applyNaming(pattern, { project: p, type: "analysis_exploration", date: d, version: "01", ext: "ipynb" }),
    script:   applyNaming(pattern, { project: p, type: "preprocessing", date: d, version: "01", ext: "py" }),
  };
}

// ── README enrichi (Phase 1 — modèle McMaster) ─────────────────────────────────
export function buildReadme(state, ctx, lang = "en") {
  const p = state.projectName || "mon_projet";
  const fill = "To be completed";
  const d = today().replace(/-/g,"");
  const slug = s => (s || "").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const unit = state.unit || fill;
  const description = state.projectDescription || fill;
  const methodology = state.methodology || "";
  const keywords = state.keywords || "";
  // publication removed — replaced by options checkboxes
  const dataDesc = Array.isArray(state.dataDescription) ? state.dataDescription : [];
  const dtList = ctx.dataFolders.map(d => d.label).join(", ") || fill;
  const grantNumber = state.grantNumber || "";
  const funderLabel = ctx.funderMeta?.label || fill;
  const contributors = Array.isArray(state.contributors) ? state.contributors : [];
  const leadRole = contributors.find(c => c.role === "Project leader" || c.role === "Project manager");
  const creator = leadRole ? `${leadRole.firstName || ""} ${leadRole.lastName || ""}`.trim() : fill;
  const pi = creator;
  const examples = generateNamingExamples(state);
  const pattern = getNamingPattern(state);

  return `# ${p}

> **${pi}** — ${unit}
> ${today()}

| Dataset creator | ${creator} |

---

## Description

${description}

${methodology ? `## Methodology\n\n${methodology}\n` : ""}
${keywords ? `**Keywords:** ${keywords}\n` : ""}
## Data

${dataDesc.length ? `| Type | Format | Volume | Sensitive | Personal | Identifier |
|---|---|---|---|---|---|---|
${dataDesc.map(r => `| ${r.type || "—"} | ${r.format || "—"} | ${r.volume || "—"} | ${r.sensitive ? "Yes (sensitive)" : "No"} | ${r.personal ? "Yes (personal)" : "No"} | ${r.identifier || "—"} |`).join("\n")}
` : `${dtList}`}

| Naming convention | \`${pattern}\` |
| License | ${state.dataLicense || "CC BY 4.0"} — see LICENSE.md |

## Project structure

\`\`\`
00_Admin/         Protocols, DMP, administrative documents
01_Raw_Data/      Raw Data — DO NOT MODIFY
02_Processed_Data/ Cleaned data, ready for analysis
03_Analysis/      Scripts, notebooks, statistical analyses
04_Results/       Figures, tables, reports
05_Publications/  Manuscripts, posters, presentations
06_Code/          Source code, pipelines, software
Documentation/    Guides, best practices, SOPs
Checklists/       RDM checklists
Resources/        EPFL resources (guides, templates)
\`\`\`

See [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md) for complete naming rules.

## Naming convention

Pattern: \`${pattern}\`

| File | Description |
|---|---|
| \`${examples.raw}\` | Raw tabular data |
| \`${examples.processed}\` | Processed data |
| \`${examples.fig}\` | Figure |
| \`${examples.notebook}\` | Notebook |

${contributors.length ? `## Contributors\n\n| Last name | First name | Email | ORCID | Role |\n|---|---|---|---|---|\n${contributors.map(c => `| ${c.lastName || ""} | ${c.firstName || ""} | ${c.email || "—"} | ${c.orcid || "—"} | ${c.role || "—"} |`).join("\n")}\n\n` : ""}## Funding

${grantNumber ? `Grant ${grantNumber} — ` : ""}${funderLabel}
`;
}

// ── NAMING CONVENTIONS (Phase 3 — généré dynamiquement) ─────────────────────────
export function buildNamingConventions(state, ctx, lang = "en") {
  const p = slug(state.projectName || "project");
  const d = today().replace(/-/g,"");
  const pattern = getNamingPattern(state);
  const ex = generateNamingExamples(state);
  const sep = NAMING_PRESETS[state.namingPattern]?.sep || "_";
  const sepDesc = sep === "_" ? "underscores" : "hyphens";

  return `# Naming convention — ${state.projectName || "my_project"}

## General pattern

\`\`\`
${pattern}
\`\`\`

All elements in **lowercase**, separated by **${sepDesc}**. No spaces, accents or special characters.

---

## Examples

### Raw data
\`\`\`
${ex.raw}
${applyNaming(pattern, { project: p, type: "raw_images", date: d, version: "01", ext: "zip" })}
${applyNaming(pattern, { project: p, type: "raw_survey", date: d, version: "01", ext: "xlsx" })}
\`\`\`

### Processed data
\`\`\`
${applyNaming(pattern, { project: p, type: "processed_tabular", date: d, version: "01", ext: "csv" })}
${ex.processed}
\`\`\`

### Scripts and analysis
\`\`\`
${ex.notebook}
${ex.script}
${applyNaming(pattern, { project: p, type: "analysis_report", date: d, version: "01", ext: "pdf" })}
\`\`\`

### Results and figures
\`\`\`
${ex.fig}
${applyNaming(pattern, { project: p, type: "fig02_heatmap", date: d, version: "", ext: "png" })}
${applyNaming(pattern, { project: p, type: "table01_descriptive", date: d, version: "01", ext: "csv" })}
\`\`\`

### Publications
\`\`\`
${applyNaming(pattern, { project: p, type: "manuscript_main", date: d, version: "03", ext: "docx" })}
${applyNaming(pattern, { project: p, type: "poster_CONFERENCENAME", date: d, version: "01", ext: "pdf" })}
${applyNaming(pattern, { project: p, type: "slides_seminar", date: d, version: "01", ext: "pptx" })}
\`\`\`

${state.multisite ? `### Multi-sites
\`\`\`
${applyNaming(pattern, { project: `${p}_SITEA`, type: "raw_tabular", date: d, version: "01", ext: "csv" })}
${applyNaming(pattern, { project: `${p}_SITEB`, type: "raw_tabular", date: d, version: "01", ext: "csv" })}
\`\`\`

` : ""}${Array.isArray(state.dataDescription) && state.dataDescription.some(d => d.sensitive || d.personal) ? `### Participants (sensitive data)
\`\`\`
${applyNaming(pattern, { project: p, type: "P001_raw_survey", date: d, version: "01", ext: "csv" })} ← Pseudonymised data
${applyNaming(pattern, { project: p, type: "P001_P050_comparison", date: d, version: "01", ext: "csv" })}
\`\`\`
> Never include identifiable information in file names! Use pseudonymized IDs (P001, P002, etc.) and never real names or initials.

` : ""}---

## Versioning

| Notation | Meaning |
|---|---|
| \`_v01\` → \`_v02\` | Major revision (method change, reprocessing) |
| \`_v01a\` → \`_v01b\` | Minor correction (bug fix, typo) |
| \`_DRAFT\` | Document in progress |
| \`_FINAL\` | Final version before submission |

**Absolute rule: never overwrite raw data. Always create a new version.**

---

## Recommended formats by data type

| Type | Raw format | Processed format |
|---|---|---|
| Tabular | CSV (UTF-8) | CSV, Parquet, Feather |
| Images | TIFF | PNG, TIFF |
| Documents | PDF/A | Markdown, PDF |
| Text | TXT (UTF-8) | JSON, CSV |
| Code | Native | — |
| Genomics | FASTQ, BAM | VCF, BED |
| Spatial | GeoTIFF, Shapefile | GeoJSON, GPKG |
`;
}

// ── DATA DICTIONARY ───────────────────────────────────────────────────────────
export function buildDataDictionary(state, ctx) {
  const rows = [
    "variable_name, data_type, unit, description, allowed_values, missing_value, notes",
    "subject_id, string,,Anonymized Subject/Object Identifier, Format P001–P999, N/A,Generated by the anonymization protocol",
    "date_collect, date, YYYY-MM-DD,Collection Date (ISO 8601),, N/A,",
    "operator, string,,Operator/Researcher Initials,, N/A,",
    "batch_id, string,,Batch or Session Identifier,, N/A,",
    "condition, string,,Experimental Condition or Group,, N/A,To be listed in the Allow_values ​​column",
    "measure_1, float, [unit],Primary Measure (describe),,–999,–999 = not measured / N/A",
    "measure_2, float, [unit],Secondary Measure (describe),,–999,",
    "quality_flag,integer,,Measurement quality indicator,\"0=ok,1=suspect,2=rejected\",,",
    "notes,string,,Free observations,,empty=none,",
  ];

  if (ctx.dataFolders.some(d => d.key === "genomics")) {
    rows.push("sample_id,string,,Biological sample ID,,N/A,");
    rows.push("sequencing_platform,string,,Sequence platform,,N/A,Illumina / PacBio / Oxford Nanopore");
    rows.push("read_depth,integer,X,Sequencing depth,,N/A,");
  }
  if (ctx.dataFolders.some(d => d.key === "images")) {
    rows.push("image_id,string,,Image ID,,N/A,");
    rows.push("resolution_xy,string,px,Image resolution (ex: 1024x768),,N/A,");
    rows.push("magnification,float,X,Magnification,,N/A,");
    rows.push("staining,string,,Color/Contrast method,,N/A,");
  }
  if (ctx.dataFolders.some(d => d.key === "survey")) {
    rows.push("questionnaire_version,string,,Questionnaire version,,N/A,");
    rows.push("completion_time,integer,min,Completion time,,N/A,");
    rows.push("language,string,,Questionnaire language,,N/A,");
  }

  return rows.join("\n");
}

// ── CHECKLISTS ────────────────────────────────────────────────────────────────
export function buildChecklistCollection(state) {
  const p = state.projectName || "my_project";
  return `# Checklist — Data collection
## Project: ${p}

### Before collection
- [ ] Approved protocol in \`00_Admin/protocols/\`
- [ ] Informed consent obtained (if human subjects)
- [ ] Ethical approval confirmed with reference number noted
- [ ] Instruments/equipment calibrated and certification documented
- [ ] Folder structure created and naming verified by the team
- [ ] Automatic backup configured, tested, and verified
- [ ] Naming convention communicated to all team members
- [ ] Data dictionary prepared with all variables listed
- [ ] Collection sheet / CRF prepared (if applicable)

### During Collection
- [ ] Log completed for each session (date, operator, conditions, anomalies)
- [ ] Participant/sample IDs verified before entry
- [ ] Files named according to convention **immediately** upon creation
- [ ] Immediate saving to \`01_Raw_Data/{type}/\`
- [ ] Visual quality control performed in real time (if possible)
- [ ] Anomalies and incidents documented in the log

### After Collection
- [ ] File integrity verified — MD5/SHA-256 checksums calculated and saved
- [ ] Metadata completed in the data dictionary
- [ ] Raw data **protected as read-only** (\`chmod 444\` or equivalent)
- [ ] Secondary backup confirmed and validated
- [ ] Entry created in the datasets registry (\`00_Admin/data_registry.md\`)
- [ ] Notification to the PI if large/critical data is collected
`;
}

export function buildChecklistQuality(state) {
  return `# Checklist — Data quality control
## Project: ${state.projectName || "my_projet"}

### Structural Check
- [ ] Column names consistent with the data dictionary
- [ ] No duplicates verified
- [ ] Missing values ​​coded according to convention (-999 / NA / empty)
- [ ] Correct data types (dates in ISO 8601, numbers without spaces)
- [ ] Text file encoding verified (UTF-8)
- [ ] No unexpected special characters in the values

### Value Check
- [ ] Value ranges checked (min/max according to protocol)
- [ ] Outliers identified and documented (quality_flag)
- [ ] Temporal consistency verified (dates within the correct range)
- [ ] Condition codes correct according to the protocol
- [ ] Inter-variable consistency verified (e.g., end_date > start_date)

### Completeness Check
- [ ] Number of Subjects/observations compliant with protocol
- [ ] All required variables completed
- [ ] Acceptable rate of missing values ​​(< X% according to protocol)

### Documentation
- [ ] QC script uploaded to \`03_Analysis/scripts/\`
- [ ] QC report generated and archived in \`04_Results/reports/\`
- [ ] Decisions on documented outliers
`;
}

export function buildChecklistArchiving(state, ctx) {
  return `# Checklist — Data archiving
## Project: ${state.projectName || "my_project"} | Funder: ${ctx.funderMeta.label}

### Final Dataset Preparation
- [ ] Selection of data to archive (documented criteria)
- [ ] Conversion to long-term formats: CSV, TIFF, PDF/A, XML
- [ ] Final README written (description, structure, methods, licenses)
- [ ] Finalized and verified data dictionary
- [ ] Complete metadata in English (title, authors, keywords, abstract)
- [ ] DOIs of associated publications available

### Deposit
- [ ] Selected repository:  Zenodo / disciplinary repository
- [ ] Account created and verified on the deposit platform
- [ ] Embargo configured if necessary (duration: ${ctx.funderMeta.label === "SNSF" ? "max 12 months" : "12 months recommended"})
- [ ] License specified: ${state.dataLicense || "CC BY 4.0"}
- [ ] DOI reserved (if the platform allows it)
- [ ] Submission completed and confirmed by email

### Post-submission
- [ ] Active DOI verified
- [ ] DOI link added to the project README
- [ ] DOI mentioned in the article (Data Availability Statement section)
- [ ] Notification sent to researchdata@epfl.ch
- [ ] Funder requirements verified:
${ctx.funderMeta.requirements.map(r => `  - [ ] ${r}`).join("\n")}
`;
}

export function buildChecklistEthics(state) {
  return `# Checklist — Ethics and conformity
## Project: ${state.projectName || "my_project"}

### Initial Assessment
- [ ] Nature of personal/sensitive data identified
- [ ] Legal basis for processing determined (GDPR Art. 6 / LPD)
- [ ] EPFL DPO consulted if necessary (dpo@epfl.ch)
- [ ] Competent ethics committee identified (CER-VD / CCER / other)

### Ethical Approval
- [ ] Protocol submitted to the ethics committee
- [ ] Approval received — reference number: [_____________]
- [ ] Conditions of approval documented and met

### Informed Consent
- [ ] Consent form drafted and validated
- [ ] Form approved by the ethics committee
- [ ] Documented consent collection procedure
- [ ] Signed forms archived in \`Sensitive_Data/consent_forms/\`
- [ ] Consent withdrawal procedure implemented

### Anonymization / Pseudonymization
- [ ] Documented anonymization protocol
- [ ] Personally identifiable data replaced with pseudonymized codes
- [ ] Secure lookup table (restricted access, encrypted)
- [ ] K-anonymity evaluated (k ≥ 5 recommended)
- [ ] Re-identification test performed
- [ ] Anonymized data transferred to \`02_Processed_Data/\`

### Security
- [ ] Data-at-rest encryption configured
- [ ] Role-based access control implemented
- [ ] Access logging enabled for sensitive data
- [ ] Data security training completed by the team
- [ ] Security incident response plan available
`;
}

// ── GUIDE ANONYMISATION ───────────────────────────────────────────────────────
export function buildAnonymizationGuide(state) {
  return `# Guide d'anonymisation des données
## Project: ${state.projectName || "my_project"}

> This guide is based on the recommendations of the EDPB (formerly Article 29 Working Party), the Swiss Federal Act on Data Protection (FADP),
> and EPFL best practices. For complex situations, please contact researchdata@epfl.ch.

---

## 1. Distinguishing between Pseudonymization and Anonymization

| Appearance | Pseudonymization | Complete Anonymization |
|---|---|---|
| Personal Data? | **Yes** (Art. 4 GDPR) | No |
| Re-identification Possible? | Yes (with key) | No (in principle) |
| Applicable to the project | Processing in progress | Sharing / Publication |
| Matching key | Stored separately | Destroyed |

---

## 2. Identifiers to be processed

### Direct identifiers (to be systematically removed)
- Last names, first names, initials
- Addresses (postal, email)
- Telephone numbers
- Official identification numbers (social security, passport, etc.)
- Biometric data
- Facial photographs

### Indirect identifiers (to be evaluated)
- Full date of birth → keep the year or age range
- Precise postal code → keep the region/canton
- Rare profession → group into categories
- Combinations of variables that could identify an individual

---

## 3. EPFL Standard Procedure

### Step 1 — Inventory
1. List all variables containing personal data
2. Assess the risk of re-identification (k-anonymity)
3. Document in the data dictionary (column "personal_data: yes/no")

### Step 2 — Pseudonymization (processing in progress)
\`\`\`python
import pandas as pd, hashlib, secrets

def pseudonymize(df, id_col, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    def hash_id(raw_id):
        return hashlib.sha256(f"{salt}{raw_id}".encode()).hexdigest()[:10]
    df = df.copy()
    mapping = {id: hash_id(id) for id in df[id_col].unique()}
    df[id_col] = df[id_col].map(mapping)
    return df, mapping, salt

df_raw = pd.read_csv("01_Raw_Data/surveys_raw/data.csv")
df_pseudo, mapping, salt = pseudonymize(df_raw, "participant_id")
# Save corresponding table separately
pd.DataFrame(mapping.items(), columns=["original","pseudo"]).to_csv(
    "Sensitive_Data/access_log/id_mapping_RESTRICTED.csv", index=False)
# Save pseudonymized
df_pseudo.to_csv("02_Processed_Data/surveys_cleaned/data_pseudo.csv", index=False)
\`\`\`

### Step 3 — k-anonymat verification
\`\`\`python
def check_k_anonymity(df, quasi_identifiers, k=5):
    groups = df.groupby(quasi_identifiers).size()
    violations = groups[groups < k]
    print(f"Violations k-anonymat (k={k}) : {len(violations)}")
    return violations

check_k_anonymity(df_pseudo, ["age_group", "canton", "profession_group"])
\`\`\`

### Step 4 — Documentation
- [ ] Anonymized variables listed in the data dictionary
- [ ] Anonymization protocol archived in \`00_Admin/protocols/\`
- [ ] Third-party validation performed

---

## 4. Resources
- EDPB — Recommendation 05/2014 on anonymization techniques
- EDÖB / IFPDT — Guide on anonymization (en.edoeb.admin.ch)
- EPFL DPO: research@epfl.ch
`;
}

// ── DATA TRANSFER AGREEMENT ───────────────────────────────────────────────────
export function buildDataTransferAgreement(state) {
  return `# Data Transfer Agreement — Template
## Projet : ${state.projectName || "mon_projet"}

**ENTRE :**
- Partie A (expéditeur) : EPFL, ${state.unit || "[unité]"}, représentée par [PI — À compléter]
- Partie B (destinataire) : [Institution partenaire, représentant]

**Date :** ${today()}

---

## 1. Objet du transfert

Description des données transférées :
- Type : [À compléter selon le projet]
- Format : [CSV / TIFF / FASTQ / autre]
- Volume : [À préciser]
- Période couverte : [dates]
- Finalité du transfert : [Analyse collaborative / validation / méta-analyse]

---

## 2. Conditions d'utilisation

Les données transférées ne peuvent être utilisées que pour :
- [ ] La finalité décrite ci-dessus
- [ ] Par les personnes autorisées listées en Annexe A
- [ ] Pendant la durée du projet (jusqu'au [date])

**Interdictions :**
- Ré-identification des sujets
- Cession à des tiers non autorisés
- Utilisation à des fins commerciales sans accord préalable

---

## 3. Sécurité et confidentialité

- Transfert via canal sécurisé (SFTP chiffré / SWITCHdrive / solution institutionnelle)
- Stockage sur infrastructure sécurisée uniquement
- Chiffrement au repos si données sensibles
- Signalement immédiat de tout incident à [email PI — À compléter]

---

## 4. Propriété intellectuelle et publications

- Les données restent propriété de l'institution d'origine
- Toute publication utilisant ces données doit mentionner les deux parties
- Embargo de publication à convenir : [X mois]
- Co-authorship : [selon contribution — critères ICMJE recommandés]

---

## 5. Fin du transfert

À la fin du projet ou de l'accord :
- Les données sont détruites ou retournées (au choix de la Partie A)
- Confirmation écrite de destruction fournie sous [X] jours

---

## Signatures

| Partie A (EPFL) | Partie B ([Institution]) |
|---|---|
| Nom : [PI — À compléter] | Nom : [À compléter] |
| Date : | Date : |
| Signature : | Signature : |

---
*Ce template doit être revu par le service juridique EPFL avant signature.*
`;
}

// ── AUTRES TEMPLATES TECHNIQUES ───────────────────────────────────────────────
export function buildGitignore(state) {
  return `# === Données sensibles — JAMAIS versionnées ===
Sensitive_Data/raw_restricted/
Sensitive_Data/access_log/
*.key
*.pem
.env
.env.*
secrets/
*_RESTRICTED*

# === Données volumineuses (gérer avec EPFL NAS ou DVC) ===
*.parquet
*.h5
*.hdf5
*.zarr
*.nc
*.npy
*.npz
*.bam
*.fastq
*.fastq.gz
01_Raw_Data/**/*.zip
01_Raw_Data/**/*.tar.gz
01_Raw_Data/**/*.tiff

# === Python / Jupyter ===
__pycache__/
*.pyc
*.pyo
.ipynb_checkpoints/
*.egg-info/
.venv/
venv/
env/
.conda/
dist/
build/
.pytest_cache/
.mypy_cache/
*.so

# === Système ===
.DS_Store
.DS_Store?
Thumbs.db
desktop.ini
*.tmp
*.bak
*.swp
*~
.Trash-*

# === Éditeurs ===
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# === Logs ===
logs/
*.log
`;
}

export function buildChangelog(state) {
  return `# Changelog — ${state.projectName || "my_projet"}

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Unpublished]

## [0.1.0] — ${today()}

### Added
- Initial RDM project structure
- DMP templates, README, data dictionary
- RDM checklists
- Starter scripts
`;
}

export function buildNotebook(name, state) {
  const titles = {
    "01_exploration":   "Data Exploration",
    "02_preprocessing": "Preprocessing",
    "03_analysis":      "Main Analysis"
  };
  const p = state.projectName || "mon_projet";
  return JSON.stringify({
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python", version: "3.11.0" }
    },
    cells: [
      {
        cell_type: "markdown", metadata: {},
        source: [`# ${titles[name] || name}\n\n**Projet :** ${p}  \n**Date :** ${today()}  \n**Auteur :** [PI — À compléter]\n\n---\n`]
      },
      {
        cell_type: "code", metadata: {}, outputs: [], execution_count: null,
        source: [
          "import sys\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n",
          "sys.path.insert(0, '../scripts')\n",
          "from utils import RAW, PROC, RESULTS, rdm_name\nfrom preprocessing import load_raw\nfrom visualization import save_fig, plot_distribution\n\n",
          "print('Environment ready')\nprint(f'pandas: {pd.__version__} | numpy: {np.__version__}')"
        ]
      },
      {
        cell_type: "markdown", metadata: {},
        source: ["## 1. Chargement des données\n"]
      },
      {
        cell_type: "code", metadata: {}, outputs: [], execution_count: null,
        source: ["# df = load_raw('votre_fichier.csv', 'tabular_csv')\n# df.head()"]
      },
      {
        cell_type: "markdown", metadata: {},
        source: ["## 2. Exploration\n"]
      },
      {
        cell_type: "code", metadata: {}, outputs: [], execution_count: null,
        source: ["# df.describe()\n# df.info()"]
      },
      {
        cell_type: "markdown", metadata: {},
        source: ["## 3. Analyse\n\n*Développer l'analyse ici.*\n"]
      },
      {
        cell_type: "markdown", metadata: {},
        source: ["## 4. Sauvegarde des résultats\n"]
      },
      {
        cell_type: "code", metadata: {}, outputs: [], execution_count: null,
        source: [
          "# Exemple : sauvegarder une figure\n",
          "# fig = plot_distribution(df['ma_variable'], title='Distribution', xlabel='Variable')\n",
          `# save_fig(fig, rdm_name('fig01_distribution', ext='svg').replace('.svg',''), fmt='svg')`
        ]
      }
    ]
  }, null, 2);
}

// ── config_rdm.json ───────────────────────────────────────────────────────────
export function buildConfig(state, ctx) {
  const dataDescs = Array.isArray(state.dataDescription) ? state.dataDescription : [];
  const hasSensitive = dataDescs.some(d => d.sensitive);
  const hasPersonal = dataDescs.some(d => d.personal);
  return JSON.stringify({
    rdm_generator_version: "2.0.0",
    generated: today(),
    project: {
      name: state.projectName || "my_project",
      unit: state.unit || "",
      multisite: state.multisite || false,
      human_data: state.humanData || false,
      multi_team: state.multiTeam || false,
    },
    data: {
      types: dataDescs.map(d => d.type).filter(Boolean),
      sensitive: hasSensitive,
      personal: hasPersonal,
    },
    compliance: {
      funder: state.funder || "Other",
      data_license: state.dataLicense || "CC-BY-4.0",
      code_license: state.codeLicense || "MIT",
    },
    technical: {
      generate_notebook: state.generateNotebook || false,
      generate_gitignore: state.generateGitignore || false,
    },
    epfl: {
      rdm_support: "researchdata@epfl.ch",
      rdm_guide: "go.epfl.ch/rdm",
    }
  }, null, 2);
}

// ── LICENSE.md ────────────────────────────────────────────────────────────────
export function buildLicense(state) {
  const p = state.projectName || "my_project";
  const year = new Date().getFullYear();
  const pi = state.projectName || "Les auteurs";

  const CC_TEXTS = {
    "CC0-1.0": {
      name: "Creative Commons Zero v1.0 Universal (CC0 1.0)",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
      summary: `The person who associated a work with this document has dedicated this work to the Commons by waiving all of his or her rights to the work under copyright law and all related or neighboring legal rights he or she had in the work, to the extent allowable by law.`,
    },
    "CC-BY-4.0": {
      name: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
      url: "https://creativecommons.org/licenses/by/4.0/",
      summary: `${p} by ${pi} is licensed under a Creative Commons Attribution 4.0 International License. \n\n You should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by/4.0/.`,
    },
    "CC-BY-SA-4.0": {
      name: "Creative Commons Attribution — Partage dans les Mêmes Conditions 4.0 (CC BY-SA 4.0)",
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
      summary: `${p} is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License. \n\n You should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by-sa/4.0/.`,
    },
    "CC-BY-ND-4.0": {
      name: "Creative Commons Attribution — Pas de Modification 4.0 (CC BY-ND 4.0)",
      url: "https://creativecommons.org/licenses/by-nd/4.0/",
      summary: `${p} is licensed under a Creative Commons Attribution-NoDerivatives 4.0 International License.\n\nYou should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by-nd/4.0/.`,
    },
    "CC-BY-NC-4.0": {
      name: "Creative Commons Attribution — Pas d'Utilisation Commerciale 4.0 (CC BY-NC 4.0)",
      url: "https://creativecommons.org/licenses/by-nc/4.0/",
      summary: `${p} is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License.\n\nYou should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by-nc/4.0/.
`,
    },
    "CC-BY-NC-SA-4.0": {
      name: "Creative Commons Attribution — Pas d'Utilisation Commerciale — Partage dans les Mêmes Conditions 4.0 (CC BY-NC-SA 4.0)",
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      summary: `${p} is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. \n\n You should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by-nc-sa/4.0/.`,
    },
    "CC-BY-NC-ND-4.0": {
      name: "Creative Commons Attribution — Pas d'Utilisation Commerciale — Pas de Modification 4.0 (CC BY-NC-ND 4.0)",
      url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      summary: `${p} is licensed under a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. \n\nYou should have received a copy of the license along with this
work. If not, see https://creativecommons.org/licenses/by-nc-nd/4.0/.
`,
    },
    "restricted": {
      name: "Restricted Access — All rights reserved",
      url: null,
      summary: `This data is protected by copyright. Any reproduction, distribution, or use without explicit permission is prohibited. Contact the project PI for any access requests.`,
    },
  };

  const CODE_TEXTS = {
    "MIT": {
      name: "MIT License",
      url: "https://opensource.org/licenses/MIT",
      text: `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
    },
    "Apache-2.0": {
      name: "Apache License 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
      text: `Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at\n\nhttps://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.`,
    },
    "GPL-3.0": {
      name: "GNU General Public License v3.0",
      url: "https://www.gnu.org/licenses/gpl-3.0.en.html",
      text: `This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/.`,
    },
    "BSD-3-Clause": {
      name: "BSD 3-Clause License",
      url: "https://opensource.org/licenses/BSD-3-Clause",
      text: `Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\n3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.`,
    },
    "none": {
      name: "Proprietary — All rights reserved",
      url: null,
      text: `This code is proprietary. Any reproduction or use without explicit permission is prohibited.`,
    },
  };

  const dataLic = CC_TEXTS[state.dataLicense] || CC_TEXTS["CC-BY-4.0"];
  const codeLic = CODE_TEXTS[state.codeLicense] || CODE_TEXTS["MIT"];

  let codeSection = "No source code or scripts are included in this project.";
  if (Array.isArray(state.codeDescription) && state.codeDescription.length > 0) {
    codeSection = `**Licence :** ${codeLic.name}
${codeLic.url ? `**URL :** ${codeLic.url}` : ""}

${codeLic.text}

This licence applies to all files in:
- \`03_Analysis/\`
- \`06_Code/\``;
  }

  const dataScope = dataLic.url && !state.dataLicense.startsWith("restricted")
    ? `This license applies to all the files in this :
- \`01_Raw_Data/\`
- \`02_Processed_Data/\`
- \`04_Results/\`

`
    : "";

  return `# LICENSE — ${p}

Copyright © ${year} ${pi}, EPFL

---

## Research Data

**Licence :** ${dataLic.name}
${dataLic.url ? `**URL :** ${dataLic.url}` : ""}

${dataLic.summary}

${dataScope}
---

## Source code and scripts

${codeSection}
`;
}
// ── Plain license file (official text only) ─────────────────────────────────────
export function buildLicensePlain(state) {
  // Returns the official license text for the chosen code license
  // For CC-BY-2.0, the official text is at the URL (not reproduced here)
  if (state.codeLicense === "CC-BY-2.0" || state.codeLicense === "none") return null;
  const CODE_PLAIN = {
    "MIT": `MIT License

Copyright (c) ${new Date().getFullYear()} ${state.projectName || "EPFL"}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
    "Apache-2.0": `Apache License, Version 2.0

Copyright ${new Date().getFullYear()} ${state.projectName || "EPFL"}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    "GPL-3.0": `GNU GENERAL PUBLIC LICENSE, Version 3, 29 June 2007

Copyright (C) ${new Date().getFullYear()} ${state.projectName || "EPFL"}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
    "BSD-3-Clause": `BSD 3-Clause License

Copyright (c) ${new Date().getFullYear()} ${state.projectName || "EPFL"}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED.`,
  };
  return CODE_PLAIN[state.codeLicense] || null;
}

// ── DMP STARTER (Phase 6 — SNSF template structure) ────────────────────────────
export function buildDmpStarter(state, ctx) {
  const p = state.projectName || "mon_projet";
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const dataRows = Array.isArray(state.dataDescription) ? state.dataDescription : [];
  const contributors = Array.isArray(state.contributors) ? state.contributors : [];
  const firstContributor = contributors.length > 0 ? `${contributors[0].firstName || ""} ${contributors[0].lastName || ""}`.trim() : "the PI";
  const firstEmail = contributors.length > 0 && contributors[0].email ? contributors[0].email : "researchdata@epfl.ch";
  const hasSensitive = dataRows.some(r => r.sensitive || r.personal) || state.humanData;
  const hasHumanData = state.humanData || hasSensitive;
  const dataLic = state.dataLicense || "CC-BY-4.0";
  const codeLic = state.codeLicense || "MIT";
  const fill = "To be completed";
  const creator = firstContributor || fill;
  const reused = state.reusedSources || {};

  function licenseFullName(lic) {
    const map = {
      "CC0-1.0": "CC0 1.0 Universal (Public Domain)",
      "CC-BY-4.0": "Creative Commons Attribution 4.0 International",
      "CC-BY-SA-4.0": "Creative Commons Attribution-ShareAlike 4.0 International",
      "CC-BY-ND-4.0": "Creative Commons Attribution-NoDerivatives 4.0 International",
      "CC-BY-NC-4.0": "Creative Commons Attribution-NonCommercial 4.0 International",
      "CC-BY-NC-SA-4.0": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
      "CC-BY-NC-ND-4.0": "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International",
      "MIT": "MIT License",
      "Apache-2.0": "Apache License 2.0",
      "GPL-3.0": "GNU General Public License v3.0",
      "BSD-3-Clause": "BSD 3-Clause License",
      "restricted": "Restricted Access (All rights reserved)",
      "none": "Proprietary / Not defined",
    };
    return map[lic] || lic;
  }

  const reusedEntries = Object.entries(reused).filter(([id, r]) => r.sourceLicense);
  const reusedSection = reusedEntries.length > 0 ? `

### 4.5 Sources réutilisées et licences applicables

The following third-party sources are reused in this project, each under its own license:

| Identifier | Source License | Type |
|---|---|---|
${reusedEntries.map(([id, r]) => `| ${id} | ${licenseFullName(r.sourceLicense)} | ${r.sourceTable === "code" ? "Code" : "Data"} |`).join("\n")}

**Compatibility note:** The licenses of reused sources have been checked against the project's chosen licenses (data: ${licenseFullName(dataLic)}, code: ${licenseFullName(codeLic)}). Any incompatibilities are flagged in the license compatibility section of the generator.

` : "";

  return `# DMP Starter — ${p}

> Generated on ${today()} by EPFL RDM Project Generator  
> Complete sections marked *[To be completed]* and adapt to your project.  
> Adaptez les sections à votre template DMP (SNSF, Horizon Europe, NIH, ERC, etc.).

---

## 1. Types de données et collecte

### 1.1 Description des données

| Dataset | Type | Format(s) | Volume |
|---|---|---|---|
${dataRows.map((r, i) => `| Dataset ${String.fromCharCode(65+i)} | ${r.type || "—"} | ${r.format || "—"} | ${r.volume || "—"} |`).join("\n")}

**Estimated total volume:** ${dataRows.map(r => r.volume).filter(Boolean).join(", ") || fill}

${state.projectDescription ? `**Project description:** ${state.projectDescription}\n` : ""}
${state.keywords ? `**Keywords:** ${state.keywords}\n` : ""}

---

### 1.2 Méthodes de collecte ou de génération

${state.methodology ? `**Methodology:** ${state.methodology}\n\n` : ""}
**File organisation:** The project follows a structured folder hierarchy (see README.md). Raw data is stored in \`01_Raw_Data/\` and is never modified. Processed data is in \`02_Processed_Data/\`.

**Naming convention:** Standard — \`{project}_{type}_{date}_v{version}.{ext}\` (see NAMING_CONVENTIONS.md).

**Quality assurance:** *[Describe quality assurance processes: calibration, validation, SOPs...]*

**Software/tools:** *[List software used: name, version, source, license...]*

---

### 1.3 Documentation et métadonnées associées

The following documentation is included in the project package:
- **README.md** — Project description, methodology, data overview, naming, license
- **NAMING_CONVENTIONS.md** — Complete naming rules and examples
- **Data dictionary** (CSV) — Variables, units, descriptions
- **Checklists** — Data collection, quality, archiving${hasSensitive ? ", ethics" : ""}

**Metadata standards:** *[Specify metadata standard, e.g. Dublin Core, DataCite, discipline-specific]*

---

## 2. Éthique, aspects légaux et sécurité

${hasHumanData ? `### 2.1 Gestion des aspects éthiques

This project involves human data. The following measures apply:
- ${state.humanData ? "Ethics authorization from competent committee (EPFL HREC or cantonal commission)" : fill}
- Informed consent procedures in place
- Data anonymization/pseudonymization where possible
- Restricted access to sensitive data

**Contact:** EPFL HREC — research@epfl.ch | EPFL DPO — dpo@epfl.ch

` : `### 2.1 How will Ethical Issues be Addressed and Handled?

No ethical issues are anticipated in this project.

`}
### 2.2 Accès aux données et sécurité

**Data access:** ${contributors.length ? `The following people have access:\n\n${contributors.map(c => `- ${c.firstName || ""} ${c.lastName || ""} (${c.role || "member"}) — ${c.email || "—"}`).join("\n")}` : "*[List who has access to which data]*"}

${hasSensitive ? `**Security:** Sensitive/personal data requires restricted access. EPFL NAS with GASPAR authentication recommended.\n` : `**Security:** Standard EPFL IT security measures apply.\n`}
**Backup:** EPFL NAS provides automated daily backups.

---

### 2.3 Copyright et propriété intellectuelle

**Data license:** ${dataLic}
**Software license:** ${codeLic}

${state.funder === "SNSF" ? "As recommended by EPFL and SNSF, data will be shared under CC-BY-4.0 unless restrictions apply." : "Licenses are indicated in LICENSE.md."}

${hasSensitive ? "**Restrictions:** Some data may be subject to privacy or contractual limitations.\n" : ""}
*[Contact EPFL TTO for patent issues: tto@epfl.ch]*

---

## 3. Stockage et conservation

### 3.1 Stockage et sauvegarde pendant le projet

**Primary storage:** EPFL NAS — automatic daily backups, access via GASPAR.
**Estimated storage:** ${dataRows.map(r => r.volume).filter(Boolean).join(", ") || fill}
**Backup frequency:** Daily (automated)

*[Describe additional storage: laptops, external drives, cloud services...]*

---

### 3.2 Plan de préservation à long terme

**Preservation platform:** [ACOUA](https://go.epfl.ch/acoua)
**Selection criteria:** Data underlying publications will be preserved.
**Preparation:** Convert to open formats, clean, document.
**Retention:** Minimum 10 years (SNSF recommendation).
**Start:** End of project or at publication.

---

## 4. Partage et réutilisation

### 4.1 Modalités de partage

**Repository:** [Zenodo](https://zenodo.org) — DOI, standardised metadata, FAIR-aligned.
**License:** ${dataLic}
**Timing:** At publication or project end.

---

### 4.2 Limitations éventuelles (données sensibles)

${hasSensitive ? "**Yes.** Sensitive/personal data will be anonymised before sharing, or access restricted if anonymisation is not possible. Contact researchdata@epfl.ch for support." : "No limitations anticipated. Data will be shared as openly as possible."}

---

### 4.3 Conformité FAIR du dépôt choisi

**Findable:** Zenodo assigns DOIs, supports rich metadata and standardised keywords. Dataset title, description, and authors are documented in English.

**Accessible:** The data will be published under the **${licenseFullName(dataLic)}** license${dataLic.startsWith("CC") ? ", which allows open access and reuse with attribution" : ""}. ${codeLic !== "none" ? `The code is provided under **${licenseFullName(codeLic)}**.` : "The code license is to be determined."} Metadata will be available immediately even if an embargo is needed.

**Interoperable:** Data is formatted in open, standardised formats (CSV, JSON, TIFF, etc.) as documented in the naming conventions. Metadata follows the DataCite schema via Zenodo.

**Reusable:** Clear licensing (${dataLic} for data, ${codeLic} for code), detailed provenance in README.md, and a completed data dictionary ensure reusability by others.

[YES] — Zenodo, DOI, rich metadata, license selection, preservation plan.
[NO] — *[Explain why if not]*

### 4.4 Organisme à but non lucratif

[YES] — Zenodo is operated by CERN, a non-profit organisation.
[NO] — *[Explain why if not]*${reusedSection}
---

> Generated by EPFL RDM Project Generator. Review and adapt to your project needs.  
> Support: researchdata@epfl.ch | go.epfl.ch/rdm
`;
}

// ── Tree preview (moved from app.js) ───────────────────────────────────────────
export function buildTreePreview(ctx) {
  if (!ctx) ctx = evaluateState(STATE);
  const p = (STATE.projectName || "mon_projet").replace(/[^a-zA-Z0-9_]/g, "_");
  const lines = [];

  lines.push(p + "/");

  function branch(indent, name, isLast, extra = "") {
    lines.push(`${indent}${isLast ? "└── " : "├── "}${name}${extra}`);
    return indent + (isLast ? "    " : "│   ");
  }

  const customFolders = STATE._customFolders;
  if (customFolders && Object.keys(customFolders).length > 0) {
    const activePaths = Object.entries(customFolders)
      .filter(([, active]) => active)
      .map(([path]) => path)
      .sort();
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
    const rootFiles = ["README.md", "NAMING_CONVENTIONS.md", "config_rdm.json"];
    if (STATE.generateGitignore) rootFiles.push(".gitignore");
    if (ctx.hasCode) rootFiles.push("CHANGELOG.md");
    rootFiles.push("LICENSE.md");
    rootFiles.forEach((f, i) => {
      lines.push(`${i === rootFiles.length - 1 ? "└" : "├"}── ${f}`);
    });
    return lines.join("\n");
  }

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

// ── Summary for result screen (moved from app.js) ──────────────────────────────
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
