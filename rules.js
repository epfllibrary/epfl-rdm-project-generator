// rules.js — Moteur de règles conditionnelles
// Toute la logique de personnalisation est ici, configurable sans toucher au reste

export const RULES = {

  // ── Règles sur la structure des dossiers ──────────────────────────────────
  folders: [
    {
      id: "sensitive_data",
      condition: s => (Array.isArray(s.dataDescription) && s.dataDescription.some(d => d.sensitive || d.personal)),
      folders: ["Sensitive_Data/raw_restricted", "Sensitive_Data/anonymized", "Sensitive_Data/consent_forms", "Sensitive_Data/access_log"],
      label: "Données sensibles / GDPR"
    },
    {
      id: "multisite",
      condition: s => s.multisite,
      folders: ["Multi_Site/site_A", "Multi_Site/site_B", "Multi_Site/site_C", "Multi_Site/harmonization", "Multi_Site/data_transfer_logs"],
      label: "Multi-site"
    },
    {
      id: "external_collab",
      condition: s => s.multiTeam || s.multisite,
      folders: ["External_Collab/incoming", "External_Collab/outgoing", "External_Collab/agreements"],
      label: "Collaboration externe"
    },
    {
      id: "hpc",
      condition: s => Array.isArray(s.dataDescription) && s.dataDescription.some(d => d.type && d.type.includes("massives")),
      folders: ["HPC_Jobs/scripts", "HPC_Jobs/logs", "HPC_Jobs/configs"],
      label: "Calcul HPC"
    },
    {
      id: "clinical",
      condition: s => s.humanData,
      folders: ["Clinical/CRF_templates", "Clinical/adverse_events", "Clinical/protocol_amendments"],
      label: "Données cliniques"
    }
  ],

  // ── Règles sur les sous-dossiers de données ───────────────────────────────
  dataSubfolders: {
    tabular:    { raw: "tabular_csv",         proc: "tabular_cleaned",     label: "Tabulaire / CSV" },
    images:     { raw: "images",              proc: "images_processed",    label: "Images / Microscopie" },
    video:      { raw: "video",               proc: "video_processed",     label: "Vidéo" },
    audio:      { raw: "audio_signals",       proc: "audio_processed",     label: "Audio / Signal" },
    text:       { raw: "text_corpus",         proc: "text_processed",      label: "Texte / Corpus" },
    genomics:   { raw: "genomics_raw",        proc: "genomics_aligned",    label: "Génomique / NGS" },
    survey:     { raw: "surveys_raw",         proc: "surveys_cleaned",     label: "Enquêtes" },
    "3d":       { raw: "3d_raw",              proc: "3d_processed",        label: "3D / Mesh" },
    spatial:    { raw: "spatial_raw",         proc: "spatial_processed",   label: "Spatial / GIS" },
    simulation: { raw: "simulation_inputs",   proc: "simulation_outputs",  label: "Simulation" },
    large:      { raw: "large_datasets",      proc: "large_processed",     label: "Données massives" },
  },

  // ── Règles sur les resources PDF à inclure ───────────────────────────────
  resources: [
    {
      id: "fast_guides",
      condition: s => s.projectName !== "",
      file: "Fast_Guides_EPFL.pdf",
      label: "RDM Fast Guides EPFL"
    },
    {
      id: "DMP_SNSF",
      condition: s => s.funder === "SNSF",
      file: "DMP_SNSF.odt",
      label: "Empty SNSF DMP Template"
    },
    {
      id: "DMP_EPFL",
      condition: s => s.funder === "Other",
      file: "DMP_EPFL.odt",
      label: "EPFL DMP Template"
    },
    {
      id: "DMP_ERC",
      condition: s => s.funder === "ERC",
      file: "DMP_ERC.docx",
      label: "ERC DMP Template"
    },
    {
      id: "DMP_H2020",
      condition: s => s.funder === "HorizonEU",
      file: "DMP_H2020.pdf",
      label: "H2020 DMP Template"
    },
    {
      id: "DMP_NIH_DMS",
      condition: s => s.funder === "NIH",
      file: "DMP_NIH_DMS.docx",
      label: "NIH DMP Template"
    },
    {
      id: "DMP_SNSF_EPFL_Help",
      condition: s => s.funder === "SNSF",
      file: "DMP_SNSF_EPFL_Help.pdf",
      label: "EPFL tailored SNSF DMP Template"
    },
    {
      id: "RDM_Strategy_EPFL",
      condition: s => s.multiTeam,
      file: "RDM_Strategy_EPFL.docx",
      label: "RDM Strategy EPFL Template"
    },
    {
      id: "DPA_Template",
      condition: s => s.projectName !== "",
      file: "DPA_Template.docx",
      label: "DPA Template"
    }
  ],

  // ── Règles sur le contenu DMP ─────────────────────────────────────────────
  dmpSections: {
    ethics: s => s.humanData || (Array.isArray(s.dataDescription) && s.dataDescription.some(d => d.sensitive || d.personal)),
    security: s => Array.isArray(s.dataDescription) && s.dataDescription.some(d => d.sensitive || d.personal),
    fair: s => s.funder === "HorizonEU" || s.funder === "ERC",
    openaccess: s => false,
    multisite: s => s.multisite,
    hpc: s => Array.isArray(s.dataDescription) && s.dataDescription.some(d => d.type && d.type.includes("massives"))
  },

  // ── Métadonnées funders ───────────────────────────────────────────────────
  funders: {
    SNSF: {
      label: "SNSF / FNS",
      dmpTemplate: "snsf",
      requirements: [
        "DMP submitted with funding application, updated at mid-term",
        "Data sharing plan (Open Research Data)",
        "Deposit in a recognised repository (Zenodo, Yareta, domain repository)",
        "Minimum metadata in English",
        "10-year minimum retention after publication"
      ],
      openDataPolicy: "Open Research Data — sharing required unless justified exceptions",
      dmpDeadline: "At the time of the funding application"
    },
    HorizonEU: {
      label: "Horizon Europe",
      dmpTemplate: "horizon",
      requirements: [
        "DMP submitted within 6 months of project start",
        "Updated at mid-term and at project end",
        "FAIR principles mandatory",
        "Open access to publications and data by default",
        "Deposit in a FAIR-certified repository",
        "Metadata available immediately even if data under embargo"
      ],
      openDataPolicy: "Open by default — exceptions possible (IPR, confidentiality, security)",
      dmpDeadline: "6 months after project start"
    },
    ERC: {
      label: "ERC",
      dmpTemplate: "horizon",
      requirements: [
        "DMP submitted within 6 months (same structure as Horizon Europe)",
        "Open access to publications mandatory",
        "Research data underlying publications must be accessible",
        "FAIR principles",
        "Deposit in a certified repository"
      ],
      openDataPolicy: "Open access publications mandatory, data strongly encouraged",
      dmpDeadline: "6 months after project start"
    },
    NIH: {
      label: "NIH",
      dmpTemplate: "nih",
      requirements: [
        "Data Management and Sharing Plan (DMSP) mandatory since 2023",
        "Data sharing budget included in the application",
        "Sharing within 12 months of project end",
        "NIH-approved repository",
        "Metadata in standardised format"
      ],
      openDataPolicy: "Final data sharing mandatory",
      dmpDeadline: "Submitted with the funding application"
    },
    Other: {
      label: "Other / Internal",
      dmpTemplate: "generic",
      requirements: [
        "Check the specific requirements of your funder",
        "RDM best practices recommended"
      ],
      openDataPolicy: "To be defined per contract",
      dmpDeadline: "To be defined"
    }
  }
};

// ── Évaluateur de règles ──────────────────────────────────────────────────────
export function evaluateState(state) {
  const activeFolders = RULES.folders.filter(r => r.condition(state));
  const activeResources = RULES.resources.filter(r => r.condition(state));
  const funderMeta    = RULES.funders[state.funder] || RULES.funders.Other;
  // Derive dataFolders from the dataDescription table
  let typeKeys = [];
  if (Array.isArray(state.dataDescription) && state.dataDescription.length) {
    // Map display names from the table back to internal keys
    const labelToKey = {
      "Tabulaire / CSV": "tabular", "Images / Microscopie": "images",
      "Vidéo / Time-lapse": "video", "Audio / Signal": "audio",
      "Texte / Corpus": "text", "Génomique / NGS": "genomics",
      "Enquêtes / Questionnaires": "survey", "3D / Point cloud / Mesh": "3d",
      "Spatial / GIS": "spatial", "Sorties de simulation": "simulation",
      "Données massives (> 1 TB)": "large",
    };
    typeKeys = state.dataDescription.map(d => labelToKey[d.type]).filter(Boolean);
  }
  const dataFolders   = (typeKeys.length ? typeKeys : ["tabular"])
                          .filter(t => RULES.dataSubfolders[t])
                          .map(t => ({ key: t, ...RULES.dataSubfolders[t] }));

  const hasCode = Array.isArray(state.codeDescription) && state.codeDescription.length > 0;

  return { activeFolders, activeResources, funderMeta, dataFolders, hasCode };
}
