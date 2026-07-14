// i18n.js — UI translations only (FR / EN)
// Templates and generated files are always in English

const LANG_KEY = "rdm_lang";
let _lang = localStorage.getItem(LANG_KEY) || "en"; // default EN

export const getLang = () => _lang;
export const setLang = (lang) => { _lang = lang; localStorage.setItem(LANG_KEY, lang); };

// All UI strings
const UI = {
  // Topbar
  "topbar.step":      { fr: (c,t) => `Étape ${c} / ${t}`,  en: (c,t) => `Step ${c} of ${t}` },
  "topbar.result":    { fr: "Résultat",                     en: "Result" },

  // Nav steps (Phase 4 — 3 steps + result)
  "nav.0.title": { fr: "Projet",                   en: "Project" },
  "nav.0.hint":  { fr: "Infos, financeur",         en: "Info, funder" },
  "nav.1.title": { fr: "Données & code",           en: "Data & code" },
  "nav.1.hint":  { fr: "Types, nommage, sources",  en: "Types, naming, sources" },
  "nav.2.title": { fr: "Licences",                 en: "Licenses" },
  "nav.2.hint":  { fr: "Licences et compatibilité",en: "Licenses & compatibility" },
  "nav.3.title": { fr: "Téléchargement",           en: "Download" },
  "nav.3.hint":  { fr: "Aperçu & ZIP",             en: "Preview & ZIP" },

  // Buttons
  "btn.next":       { fr: "Étape suivante",    en: "Next step" },
  "btn.prev":       { fr: "Étape précédente",  en: "Previous step" },
  "btn.generate":   { fr: "Générer mon projet", en: "Generate my project" },
  "btn.download":   { fr: "Télécharger le projet (.zip)", en: "Download project (.zip)" },
  "btn.download.again": { fr: "Télécharger à nouveau", en: "Download again" },
  "btn.modify":     { fr: "Modifier",          en: "Modify" },
  "btn.new":        { fr: "Nouveau projet",    en: "New project" },
  "btn.copy":       { fr: "Copier",            en: "Copy" },
  "btn.copied":     { fr: "Copié !",           en: "Copied!" },

  // Confirmation dialogs
  "confirm.new": { fr: "Êtes-vous sûr de vouloir créer un nouveau projet ? Les données non sauvegardées seront perdues.", en: "Are you sure you want to start a new project? Unsaved data will be lost." },

  // Step 0 — Projet & financement
  "s0.eyebrow": { fr: "Étape 1 sur 3", en: "Step 1 of 3" },
  "s0.title":   { fr: "Projet & financement", en: "Project & funding" },
  "s0.desc":    { fr: "Ces informations seront intégrées dans le README et tous les templates du projet.", en: "This information will be included in the README and all project templates." },

  // Step 1 — Données & code
  "s1.eyebrow": { fr: "Étape 2 sur 3", en: "Step 2 of 3" },
  "s1.title":   { fr: "Données & code", en: "Data & code" },
  "s1.desc":    { fr: "Décrivez vos données, choisissez une convention de nommage et les sources réutilisées.", en: "Describe your data, choose a naming convention and reused sources." },

  // Step 2 — Licences
  "s2.eyebrow": { fr: "Étape 3 sur 3", en: "Step 3 of 3" },
  "s2.title":   { fr: "Licences", en: "Licenses" },
  "s2.desc":    { fr: "Choisissez les licences pour vos données et votre code.", en: "Choose licenses for your data and code." },
  "s1.id":      { fr: "Identification du projet", en: "Project identification" },
  "s1.name":    { fr: "Nom du projet",            en: "Project name" },
  "s1.name.hint":{ fr: "Max 32 caractères, underscores, pas d'espaces. Ex :", en: "Max 32 characters, underscores, no spaces. E.g.:" },
  "s1.name.ph": { fr: "nom_projet",               en: "project_name" },
  "s1.unit":    { fr: "Laboratoire / Unité EPFL",  en: "Laboratory / EPFL Unit" },
  "s1.unit.ph": { fr: "Ex : LSMS, LCAV, CHILI…",  en: "E.g. LSMS, LCAV, CHILI…" },
  "s1.grant":     { fr: "Numéro de subvention (optionnel)", en: "Grant number (optional)" },
  "s1.grant.ph":  { fr: "Ex : 200021_212344",            en: "E.g. 200021_212344" },

  // Collaborators
  "collaborators.title":   { fr: "Personnes et rôles", en: "People and roles" },
  "collaborators.desc":    { fr: "Ajoutez les personnes impliquées dans le projet.", en: "Add people involved in this project." },
  "collaborators.last":    { fr: "Nom", en: "Last name" },
  "collaborators.first":   { fr: "Prénom", en: "First name" },
  "collaborators.email":   { fr: "Email professionnel", en: "Professional email" },
  "collaborators.role":    { fr: "Rôle", en: "Role" },
  "collaborators.ror":     { fr: "ROR", en: "ROR" },
  "collaborators.add":     { fr: "+ Ajouter un collaborateur", en: "+ Add contributor" },

  // Roles
  "role.project_leader":     { fr: "Project leader", en: "Project leader" },
  "role.project_manager":    { fr: "Project manager", en: "Project manager" },
  "role.data_collector":     { fr: "Data collector", en: "Data collector" },
  "role.data_curator":       { fr: "Data curator", en: "Data curator" },
  "role.data_manager":       { fr: "Data manager", en: "Data manager" },
  "role.researcher":         { fr: "Researcher", en: "Researcher" },
  "role.supervisor":         { fr: "Supervisor", en: "Supervisor" },
  "role.contact_person":     { fr: "Contact person", en: "Contact person" },
  "role.producer":           { fr: "Producer", en: "Producer" },
  "role.editor":             { fr: "Editor", en: "Editor" },
  "role.distributor":        { fr: "Distributor", en: "Distributor" },
  "role.sponsor":            { fr: "Sponsor", en: "Sponsor" },
  "role.hosting_institution":{ fr: "Hosting institution", en: "Hosting institution" },
  "role.other":              { fr: "Autre", en: "Other" },

  // Options (new checkboxes replacing project type & team size)

  // Step 4
  "s4.funding": { fr: "Source de financement", en: "Funding source" },
  "s4.snsf.hint":{ fr: "Fonds national suisse", en: "Swiss National Science Foundation" },
  "s4.heu.hint": { fr: "Programme-cadre EU",    en: "EU Framework Programme" },
  "s4.erc.hint": { fr: "European Research Council", en: "European Research Council" },
  "s4.nih.hint": { fr: "National Institutes of Health", en: "National Institutes of Health" },
  "s4.other.name": { fr: "Autre / Interne EPFL",  en: "Other / EPFL Internal" },
  "s4.other.hint": { fr: "Financement interne, industrie, fondation", en: "Internal funding, industry, foundation" },
  "s4.other.badge":{ fr: "Template générique",    en: "Generic template" },
  "s4.lic.data": { fr: "Licence pour les données", en: "Data license" },
  "s4.lic.code": { fr: "Licence pour le code",     en: "Code license" },


  // Step 6 — Result
  "s6.eyebrow":   { fr: "Votre projet RDM",        en: "Your RDM project" },
  "s6.title":     { fr: "Aperçu & téléchargement", en: "Preview & download" },
  "s6.desc":      { fr: "Vérifiez la configuration, consultez les aperçus, puis téléchargez votre package.", en: "Review your configuration, check the previews, then download your package." },
  "s6.tab.tree":  { fr: "Arborescence",      en: "File tree" },
  "s6.tab.naming":{ fr: "Nomenclature",      en: "Naming" },
  "s6.tab.readme":{ fr: "README",            en: "README" },
  "s6.tab.res":   { fr: "Ressources incluses", en: "Included resources" },
  "s6.dl.title":  { fr: "Package RDM complet", en: "Complete RDM package" },
  "s6.dl.desc":   { fr: "Votre package contient la structure complète et toutes les ressources EPFL.", en: "Your package contains the complete structure and all EPFL resources." },
  "s6.dl.prep":   { fr: "Préparation…",       en: "Preparing…" },
  "s6.dl.done":   { fr: "Téléchargement terminé.", en: "Download complete." },
  "s6.dl.error":  { fr: "Erreur lors du téléchargement. Veuillez réessayer.", en: "Download error. Please try again." },

  // Summary cells
  "sum.project":  { fr: "Projet",           en: "Project" },
  "sum.unit":     { fr: "Unité",            en: "Unit" },
  "sum.funder":   { fr: "Financeur",        en: "Funder" },
  "sum.sensitive":{ fr: "Données sensibles", en: "Sensitive data" },
  "sum.datalic":  { fr: "Licence données",  en: "Data license" },
  "sum.codelic":  { fr: "Licence code",     en: "Code license" },
  "sum.datasets": { fr: "Jeux de données",  en: "Datasets" },
  "sum.codes":    { fr: "Logiciels",        en: "Software" },
  "sum.yes_warn": { fr: "Oui",              en: "Yes" },
  "sum.no":       { fr: "Non",              en: "No" },

  // Resources
  "res.dmp":      { fr: "Template DMP",                    en: "DMP Template" },
  "res.guides":   { fr: "Guides & ressources EPFL",        en: "EPFL guides & resources" },
  "res.strategy": { fr: "Templates stratégie",             en: "Strategy templates" },
  "res.checks":   { fr: "Checklists & documentation",      en: "Checklists & documentation" },

  // Validation
  "val.name":     { fr: "Le nom du projet est obligatoire",         en: "Project name is required" },
  "val.unit":     { fr: "Le laboratoire / unité est obligatoire",   en: "Laboratory / unit is required" },
  "val.funder":   { fr: "Sélectionnez une source de financement",   en: "Please select a funding source" },
  "val.datatypes":{ fr: "Ajoutez au moins un jeu de données ou un logiciel", en: "Add at least one dataset or software" },

  // Field hints (HTML content)
  "s1.name.hint.full": {
    fr: 'Max 32 caractères, underscores, pas d\'espaces. Ex : <code style="font-family:monospace;font-size:12px;background:var(--bg);padding:1px 5px;border-radius:3px">morphology_neurons</code>. <a href="https://go.epfl.ch/rdm-naming" target="_blank" rel="noopener noreferrer">Voir le guide →</a>',
    en: 'Max 32 characters, underscores, no spaces. E.g.: <code style="font-family:monospace;font-size:12px;background:var(--bg);padding:1px 5px;border-radius:3px">morphology_neurons</code>. <a href="https://go.epfl.ch/rdm-naming" target="_blank" rel="noopener noreferrer">See the guide →</a>',
  },
  // Funder badges
  "s4.snsf.badge": { fr: "Open Research Data",      en: "Open Research Data" },
  "s4.heu.badge":  { fr: "FAIR + Open by default",  en: "FAIR + Open by default" },
  "s4.erc.badge":  { fr: "Open access obligatoire", en: "Open access required" },
  "s4.nih.badge":  { fr: "DMSP depuis 2023",        en: "DMSP since 2023" },
  "s4.other.badge":{ fr: "Template générique",      en: "Generic template" },

  // Sensitive data warning (HTML)
  // Sidebar (keys that were sidebar.support.title → sidebar.help.title in current i18n)
  // The HTML uses sidebar.support.title but i18n has sidebar.help.title — align:
  "sidebar.support.title": { fr: "Support EPFL RDM",                      en: "EPFL RDM Support" },
  "sidebar.support.body":  { fr: "Questions sur la gestion des données ?", en: "Questions about research data?" },

  // Overlay
  "overlay.generating":   { fr: "Génération en cours…", en: "Generating…" },
  "overlay.downloading":  { fr: "Préparation du téléchargement…", en: "Preparing download…" },

  // README form fields (Phase 1 — enriched)
  "s1.desc.l":    { fr: "Description du projet",          en: "Project description" },
  "s1.desc.ph":   { fr: "Décrivez l'objectif scientifique en 2-3 phrases…", en: "Describe the scientific objective in 2-3 sentences…" },
  "s1.method.l":  { fr: "Méthodologie (optionnel)",       en: "Methodology (optional)" },
  "s1.method.ph": { fr: "Approche expérimentale, protocole, outils utilisés…", en: "Experimental approach, protocol, tools used…" },
  "s1.keywords.l":{ fr: "Mots-clés",                     en: "Keywords" },
  "s1.keywords.ph":{ fr: "Ajouter des mots-clés (séparés par des virgules)", en: "Add keywords (comma-separated)" },
  // s1.pub removed — replaced by new options checkboxes
  "s2.data_desc.l":  { fr: "Description des données",     en: "Data description" },
  "s2.data_desc.ph": { fr: "Types de données, formats, volume estimé, source…", en: "Data types, formats, estimated volume, source…" },
  "s2.grant":     { fr: "Numéro de subvention (optionnel)", en: "Grant number (optional)" },
  "s2.grant.ph":  { fr: "Ex : 200021_212344",            en: "E.g. 200021_212344" },

  // License assistant (Phase 2)
  "lic.quiz.data":        { fr: "Assistant — Licence des données", en: "Assistant — Data license" },
  "lic.quiz.code":        { fr: "Assistant — Licence du code", en: "Assistant — Code license" },
  "lic.quiz.q1":          { fr: "Usage commercial autorisé ?", en: "Commercial use allowed?" },
  "lic.quiz.q1.yes":      { fr: "Oui", en: "Yes" },
  "lic.quiz.q1.no":       { fr: "Non", en: "No" },
  "lic.quiz.q1.any":      { fr: "Peu importe", en: "No preference" },
  "lic.quiz.q2":          { fr: "Modifications autorisées ?", en: "Modifications allowed?" },
  "lic.quiz.q2.yes":      { fr: "Oui, sans conditions", en: "Yes, unconditionally" },
  "lic.quiz.q2.sa":       { fr: "Oui, à partager à l'identique", en: "Yes, must share alike" },
  "lic.quiz.q2.no":       { fr: "Non", en: "No" },
  "lic.quiz.reco":        { fr: "Licence recommandée :", en: "Recommended license:" },
  "lic.quiz.apply":       { fr: "Appliquer", en: "Apply" },
  "lic.quiz.code.q1":     { fr: "Ouverture du code ?", en: "Code openness?" },
  "lic.quiz.code.q1.os":  { fr: "Open source", en: "Open source" },
  "lic.quiz.code.q1.cl":  { fr: "Interne seulement", en: "Internal only" },
  "lic.quiz.code.q2":     { fr: "Style de licence ?", en: "License style?" },
  "lic.quiz.code.q2.copyleft": { fr: "Copyleft (GPL)", en: "Copyleft (GPL)" },
  "lic.quiz.code.q2.perm":    { fr: "Permissif (MIT/Apache)", en: "Permissive (MIT/Apache)" },
  "lic.quiz.code.q3":     { fr: "Protection des brevets nécessaire ?", en: "Patent protection needed?" },
  "lic.quiz.code.q3.yes": { fr: "Oui", en: "Yes" },
  "lic.quiz.code.q3.no":  { fr: "Non", en: "No" },

  // Naming convention (Phase 3)
  "naming.title":     { fr: "Convention de nommage", en: "Naming convention" },
  "naming.desc":      { fr: "Choisissez comment vos fichiers seront nommés. Tous les exemples dans le projet suivront cette règle.", en: "Choose how your files will be named. All examples in the project will follow this rule." },
  "naming.preview":   { fr: "Aperçu", en: "Preview" },
  "naming.preset.rdm":    { fr: "Standard", en: "Standard" },
  "naming.preset.date":   { fr: "Tri chronologique", en: "Chronological sort" },
  "naming.preset.type":   { fr: "Par catégorie", en: "By category" },
  "naming.preset.hyphen": { fr: "Project-type", en: "Project-type" },

  // Data description table (refactored)
  "data_table.title": { fr: "Liste des données du projet", en: "Project data listing" },
  "data_table.desc":  { fr: "Ajoutez une ligne par type de données. Chaque ligne générera les dossiers correspondants dans la structure.", en: "Add one row per data type. Each row will generate the corresponding folders in the project structure." },
  "data_table.type":  { fr: "Type de données", en: "Data type" },
  "data_table.format":{ fr: "Formats", en: "Formats" },
  "data_table.volume":{ fr: "Volume estimé", en: "Estimated volume" },
  "data_table.id":   { fr: "Identifiant", en: "Identifier" },
  "data_table.sensitive": { fr: "Sensible", en: "Sensitive" },
  "data_table.personal":  { fr: "Personnel", en: "Personal" },
  "data_table.origin":    { fr: "Origine", en: "Origin" },

  // Code table headers
  "code_table.title": { fr: "Code / Logiciel", en: "Code / Software" },
  "code_table.lang":  { fr: "Langage", en: "Language" },
  "code_table.repo":  { fr: "Entrepôt", en: "Repository" },
  "code_table.id":    { fr: "Identifiant", en: "Identifier" },
  "code_table.add":   { fr: "+ Ajouter un logiciel", en: "+ Add software" },

  // Resources checklist labels (used in buildResult)
  "res.checklist.collection": { fr: "Checklist collecte de données",   en: "Data collection checklist" },
  "res.checklist.quality":    { fr: "Checklist qualité des données",   en: "Data quality checklist" },
  "res.checklist.archiving":  { fr: "Checklist archivage",             en: "Archiving checklist" },
  "res.checklist.ethics":     { fr: "Checklist éthique & conformité",  en: "Ethics & compliance checklist" },
  "res.guide.anon":           { fr: "Guide anonymisation",             en: "Anonymisation guide" },
  "res.dict":                 { fr: "Data dictionary template",        en: "Data dictionary template" },
  "res.readme":               { fr: "README projet",                   en: "Project README" },
  "res.naming":               { fr: "Conventions de nommage",          en: "Naming conventions" },

  // Structure du projet
  "structure.title": { fr: "Structure du projet",          en: "Project structure" },
  "structure.desc":  { fr: "Activez ou désactivez les dossiers à inclure dans le projet.", en: "Enable or disable folders to include in the project." },

  // Code options
  "code.notebook":      { fr: "Générer un notebook Jupyter", en: "Generate a Jupyter notebook" },
  "code.notebook.desc": { fr: "Notebook d'exploration avec pandas, numpy, matplotlib, scikit-learn, PyTorch", en: "Exploration notebook with pandas, numpy, matplotlib, scikit-learn, PyTorch" },
  "code.gitignore":      { fr: "Inclure un .gitignore adapté", en: "Include a tailored .gitignore" },
  "code.gitignore.desc": { fr: "Pour projet Jupyter / ML — exclut données, caches, environnements", en: "For Jupyter/ML projects — excludes data, caches, environments" },

  // Help tooltips
  "tip.orcid":    { fr: 'Pas encore d\'ORCID ? Créez-en un ici : <a href="https://orcid.org" target="_blank" rel="noopener noreferrer">https://orcid.org</a>', en: 'No ORCID yet? Create one here: <a href="https://orcid.org" target="_blank" rel="noopener noreferrer">https://orcid.org</a>' },
  "tip.sensitive": { fr: "Données révélant l'origine raciale, les convictions, la santé... (GDPR Art. 9)", en: "Data revealing racial origin, beliefs, health... (GDPR Art. 9)" },
  "tip.personal":  { fr: "Toute information identifiant directement ou indirectement une personne (GDPR Art. 4)", en: "Any information directly or indirectly identifying a person (GDPR Art. 4)" },
  "tip.notebook":  { fr: "Génère un notebook Jupyter avec pandas, numpy, matplotlib, scikit-learn pré-importés", en: "Generates a Jupyter notebook with pandas, numpy, matplotlib, scikit-learn pre-imported" },
  "tip.gitignore": { fr: "Exclut les caches Python, les données sensibles, les notebooks de checkpoint", en: "Excludes Python caches, sensitive data, checkpoint notebooks" },

  // Reused sources
  "reused.title":    { fr: "Sources réutilisées",          en: "Reused sources" },
  "reused.desc":     { fr: "Sources marquées comme réutilisées dans les tableaux ci-dessus.", en: "Sources marked as reused in the tables above." },
  "reused.id":       { fr: "Identifiant",                  en: "Identifier" },
  "reused.doi":      { fr: "DOI",                          en: "DOI" },
  "reused.link":     { fr: "Lien",                         en: "Link" },
  "reused.license":  { fr: "Licence source",               en: "Source license" },
  "reused.citation": { fr: "Citation",                     en: "Citation" },
  "reused.empty":    { fr: "Aucune source réutilisée.",    en: "No reused sources." },
  "reused.manual":   { fr: "+ Ajouter une source manuelle",en: "+ Add manual source" },

  // Options checkboxes (replacing project type / team size)
  "options.title":    { fr: "Options",                     en: "Options" },
  "options.multisite":   { fr: "Multi-site",                 en: "Multi-site" },
  "options.multisite.desc": { fr: "Ajoute un dossier Multi_Site/ et un template de Data Transfer Agreement", en: "Adds a Multi_Site/ folder and a Data Transfer Agreement template" },
  "options.humandata":   { fr: "Données humaines",            en: "Human data" },
  "options.humandata.desc": { fr: "Ajoute des dossiers Clinical/ et des checklists éthiques", en: "Adds Clinical/ folders and ethics checklists" },
  "options.multiteam":   { fr: "Équipe multi-acteurs",        en: "Multi-actor team" },
  "options.multiteam.desc": { fr: "Ajoute un dossier External_Collab/ et une stratégie RDM", en: "Adds an External_Collab/ folder and an RDM strategy" },

  // ── Traductions des informations financeurs ──────────────────────────────────
  "funder.SNSF.label":         { fr: "SNSF / FNS", en: "SNSF / FNS" },
  "funder.SNSF.requirements":  { fr: "DMP soumis avec la demande, mis à jour à mi-parcours;Plan de partage des données (Open Research Data);Dépôt dans un entrepôt reconnu (Zenodo, Yareta, entrepôt disciplinaire);Métadonnées minimales en anglais;Conservation minimale de 10 ans après publication", en: "DMP submitted with funding application, updated at mid-term;Data sharing plan (Open Research Data);Deposit in a recognised repository (Zenodo, Yareta, domain repository);Minimum metadata in English;10-year minimum retention after publication" },
  "funder.SNSF.openDataPolicy": { fr: "Open Research Data — partage requis sauf exceptions justifiées", en: "Open Research Data — sharing required unless justified exceptions" },
  "funder.SNSF.dmpDeadline":   { fr: "Au moment de la demande de financement", en: "At the time of the funding application" },

  "funder.HorizonEU.label":    { fr: "Horizon Europe", en: "Horizon Europe" },
  "funder.HorizonEU.requirements": { fr: "DMP soumis dans les 6 mois suivant le début du projet;Mis à jour à mi-parcours et en fin de projet;Principes FAIR obligatoires;Accès ouvert aux publications et données par défaut;Dépôt dans un entrepôt certifié FAIR;Métadonnées disponibles immédiatement même si données sous embargo", en: "DMP submitted within 6 months of project start;Updated at mid-term and at project end;FAIR principles mandatory;Open access to publications and data by default;Deposit in a FAIR-certified repository;Metadata available immediately even if data under embargo" },
  "funder.HorizonEU.openDataPolicy": { fr: "Ouvert par défaut — exceptions possibles (PI, confidentialité, sécurité)", en: "Open by default — exceptions possible (IPR, confidentiality, security)" },
  "funder.HorizonEU.dmpDeadline": { fr: "6 mois après le début du projet", en: "6 months after project start" },

  "funder.ERC.label":          { fr: "ERC", en: "ERC" },
  "funder.ERC.requirements":   { fr: "DMP soumis dans les 6 mois (même structure que Horizon Europe);Accès ouvert aux publications obligatoire;Les données sous-tendant les publications doivent être accessibles;Principes FAIR;Dépôt dans un entrepôt certifié", en: "DMP submitted within 6 months (same structure as Horizon Europe);Open access to publications mandatory;Research data underlying publications must be accessible;FAIR principles;Deposit in a certified repository" },
  "funder.ERC.openDataPolicy": { fr: "Accès ouvert aux publications obligatoire, données fortement encouragées", en: "Open access publications mandatory, data strongly encouraged" },
  "funder.ERC.dmpDeadline":    { fr: "6 mois après le début du projet", en: "6 months after project start" },

  "funder.NIH.label":          { fr: "NIH", en: "NIH" },
  "funder.NIH.requirements":   { fr: "Plan de gestion et de partage des données (DMSP) obligatoire depuis 2023;Budget de partage des données inclus dans la demande;Partage dans les 12 mois suivant la fin du projet;Entrepôt approuvé par le NIH;Métadonnées en format standardisé", en: "Data Management and Sharing Plan (DMSP) mandatory since 2023;Data sharing budget included in the application;Sharing within 12 months of project end;NIH-approved repository;Metadata in standardised format" },
  "funder.NIH.openDataPolicy": { fr: "Partage final des données obligatoire", en: "Final data sharing mandatory" },
  "funder.NIH.dmpDeadline":    { fr: "Soumis avec la demande de financement", en: "Submitted with the funding application" },

  "funder.Other.label":        { fr: "Autre / Interne", en: "Other / Internal" },
  "funder.Other.requirements": { fr: "Vérifiez les exigences spécifiques de votre financeur;Bonnes pratiques RDM recommandées", en: "Check the specific requirements of your funder;RDM best practices recommended" },
  "funder.Other.openDataPolicy": { fr: "À définir selon le contrat", en: "To be defined per contract" },
  "funder.Other.dmpDeadline":  { fr: "À définir", en: "To be defined" },
};

// ── Translate function ────────────────────────────────────────────────────────
export function t(key, ...args) {
  if (!_lang) return key; // lang not chosen yet
  const entry = UI[key];
  if (!entry) { console.warn(`[i18n] Missing key: ${key}`); return key; }
  const val = entry[_lang] ?? entry.fr ?? key;
  return typeof val === "function" ? val(...args) : val;
}

// ── Apply language to all data-i18n elements ──────────────────────────────────
export function applyLang() {
  if (!_lang) return;
  // Texte simple
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === "string") el.textContent = val;
  });
  // HTML (liens, code, etc.)
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const val = t(el.dataset.i18nHtml);
    if (typeof val === "string") el.innerHTML = val;
  });
  // Placeholders
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const val = t(el.dataset.i18nPh);
    if (typeof val === "string") el.placeholder = val;
  });
  // Tooltips (data-i18n-tip → data-tip)
  document.querySelectorAll("[data-i18n-tip]").forEach(el => {
    const val = t(el.dataset.i18nTip);
    if (typeof val === "string") el.setAttribute("data-tip", val);
  });
  document.documentElement.lang = _lang;
}
