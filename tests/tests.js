// tests/tests.js — Unit tests for EPFL RDM Project Generator
// Run: node tests/tests.js
//
// NB: i18n.js reads localStorage at module level, so we mock it
// before the dynamic import. All other modules are imported statically.

// ── Mock localStorage for Node.js (needed by i18n.js) ──────────────────────────
if (typeof globalThis.localStorage === "undefined") {
  const _store = {};
  globalThis.localStorage = {
    getItem: (k) => _store[k] ?? null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach((k) => delete _store[k]); },
  };
}

// ── Static imports (no browser deps) ──────────────────────────────────────────
import { RULES, evaluateState } from "../rules.js";
import { STATE, getDefaultFolders } from "../app.js";
import * as T from "../templates.js";
import {
  makeDirEntry,
  makeFileEntry,
  buildZipBuffer,
} from "../zipgen.js";

// ── Dynamic import for i18n (depends on localStorage mock) ────────────────────
const { t, setLang, getLang } = await import("../i18n.js");

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    passed++;
    console.log(`  \u2705 ${name}`);
  } else {
    failed++;
    console.error(`  \u274c ${name}`);
  }
}

function assertEqual(actual, expected, name) {
  total++;
  if (actual === expected) {
    passed++;
    console.log(`  \u2705 ${name}`);
  } else {
    failed++;
    console.error(
      `  \u274c ${name} \u2014 expected "${expected}", got "${String(actual).substring(0, 200)}"`,
    );
  }
}

function assertIncludes(str, substr, name) {
  total++;
  if (str.includes(substr)) {
    passed++;
    console.log(`  \u2705 ${name}`);
  } else {
    failed++;
    console.error(
      `  \u274c ${name} \u2014 expected "${substr}" in "${str.substring(0, 120)}..."`,
    );
  }
}

// ── 1. rules.js — evaluateState ────────────────────────────────────────────────
console.log("\n\u{1F4E6} rules.js — evaluateState");

const emptyConfig = {
  funder: null,
  dataDescription: [],
  humanData: false,
  multisite: false,
  multiTeam: false,
};

// Test 1: config minimale (vide)
(function testEmptyConfig() {
  const ctx = evaluateState(emptyConfig);

  // activeFolders should be empty
  assert(ctx.activeFolders.length === 0, "empty: activeFolders is empty");

  // dataFolders defaults to ["tabular"]
  assert(ctx.dataFolders.length === 1, "empty: dataFolders has 1 entry");
  assert(ctx.dataFolders[0].key === "tabular", "empty: dataFolders[0].key === tabular");
  assertEqual(
    ctx.dataFolders[0].label,
    "Tabulaire / CSV",
    "empty: dataFolders[0].label === Tabulaire / CSV",
  );

  // funderMeta should be Other when funder is null
  assertEqual(
    ctx.funderMeta.label,
    "Other / Internal",
    "empty: funderMeta.label === Other / Internal",
  );

  // Fast Guides and DPA Template are active (condition: projectName !== "" — undefined !== "" → true)
  assert(
    ctx.activeResources.some((r) => r.id === "fast_guides"),
    "empty: fast_guides resource is active",
  );
  assert(
    ctx.activeResources.some((r) => r.id === "DPA_Template"),
    "empty: DPA_Template resource is active",
  );
})();

// Test 2: multi-site activé
(function testMultisite() {
  const state = { ...emptyConfig, multisite: true };
  const ctx = evaluateState(state);

  assert(
    ctx.activeFolders.some((f) => f.id === "multisite"),
    "multisite: activeFolders contains 'multisite'",
  );
  assert(
    ctx.activeFolders.some((f) => f.id === "external_collab"),
    "multisite: activeFolders contains 'external_collab'",
  );
  // multisite folder has subfolders
  const msFolder = ctx.activeFolders.find((f) => f.id === "multisite");
  assert(
    msFolder.folders.includes("Multi_Site/site_A"),
    "multisite: contains Multi_Site/site_A subfolder",
  );

  // Check dmpSections
  assert(
    RULES.dmpSections.multisite(state) === true,
    "multisite: dmpSections.multisite === true",
  );
})();

// Test 3: données humaines
(function testHumanData() {
  const state = { ...emptyConfig, humanData: true };
  const ctx = evaluateState(state);

  assert(
    ctx.activeFolders.some((f) => f.id === "clinical"),
    "humanData: activeFolders contains 'clinical'",
  );
  const clinicalFolder = ctx.activeFolders.find((f) => f.id === "clinical");
  assertEqual(
    clinicalFolder.label,
    "Données cliniques",
    "humanData: clinical folder label is 'Données cliniques'",
  );

  // dmpSections.ethics should be true
  assert(
    RULES.dmpSections.ethics(state) === true,
    "humanData: dmpSections.ethics === true",
  );
})();

// Test 4: multi-team
(function testMultiTeam() {
  const state = { ...emptyConfig, multiTeam: true };
  const ctx = evaluateState(state);

  assert(
    ctx.activeResources.some((r) => r.id === "RDM_Strategy_EPFL"),
    "multiTeam: RDM_Strategy_EPFL resource is active",
  );
  assert(
    ctx.activeFolders.some((f) => f.id === "external_collab"),
    "multiTeam: activeFolders contains 'external_collab'",
  );
})();

// Test 5: data types via dataDescription
(function testDataTypes() {
  const state = {
    ...emptyConfig,
    dataDescription: [
      { type: "Tabulaire / CSV", identifier: "tabular_data" },
      { type: "Images / Microscopie", identifier: "microscopy" },
    ],
  };
  const ctx = evaluateState(state);

  assert(ctx.dataFolders.length === 2, "dataTypes: dataFolders has 2 entries");
  assert(
    ctx.dataFolders.some((d) => d.key === "tabular"),
    "dataTypes: contains tabular",
  );
  assert(
    ctx.dataFolders.some((d) => d.key === "images"),
    "dataTypes: contains images",
  );
})();

// Test 6: dataDescription (nouveau format tableau)
(function testDataDescription() {
  const state = {
    ...emptyConfig,
    dataDescription: [
      { type: "Tabulaire / CSV", format: "CSV", volume: "500 GB" },
    ],
  };
  const ctx = evaluateState(state);

  assert(ctx.dataFolders.length === 1, "dataDesc: dataFolders has 1 entry");
  assert(
    ctx.dataFolders[0].key === "tabular",
    "dataDesc: dataFolders[0].key === tabular (mapped from label)",
  );
  assertEqual(
    ctx.dataFolders[0].raw,
    "tabular_csv",
    "dataDesc: dataFolders[0].raw === tabular_csv",
  );
})();

// Test 7: dataDescription with sensitive/personal
(function testSensitiveDataDesc() {
  const state = {
    ...emptyConfig,
    dataDescription: [
      { type: "Images / Microscopie", sensitive: true, personal: false },
    ],
  };
  const ctx = evaluateState(state);

  assert(
    ctx.activeFolders.some((f) => f.id === "sensitive_data"),
    "sensitiveDataDesc: activeFolders contains 'sensitive_data'",
  );
  // data folders should include "images"
  assert(
    ctx.dataFolders.some((d) => d.key === "images"),
    "sensitiveDataDesc: dataFolders contains images",
  );

  // dmpSections.ethics/.security now check dataDescription array (consistency fix)
  assert(
    RULES.dmpSections.ethics(state) === true,
    "sensitiveDataDesc: dmpSections.ethics === true (via dataDescription)",
  );
  assert(
    RULES.dmpSections.security(state) === true,
    "sensitiveDataDesc: dmpSections.security === true (via dataDescription)",
  );
})();

// Test 8: SNSF funder
(function testSnsf() {
  const state = { ...emptyConfig, funder: "SNSF" };
  const ctx = evaluateState(state);

  assertEqual(
    ctx.funderMeta.label,
    "SNSF / FNS",
    "SNSF: funderMeta.label === SNSF / FNS",
  );
  assert(
    ctx.funderMeta.requirements.length > 0,
    "SNSF: requirements not empty",
  );
  assertEqual(
    ctx.funderMeta.dmpTemplate,
    "snsf",
    "SNSF: dmpTemplate === snsf",
  );
  assert(
    ctx.funderMeta.requirements.some((r) => r.includes("DMP")),
    "SNSF: requirements mention DMP",
  );
  // SNSF resources active
  assert(
    ctx.activeResources.some((r) => r.id === "DMP_SNSF"),
    "SNSF: DMP_SNSF resource active",
  );
  assert(
    ctx.activeResources.some((r) => r.id === "DMP_SNSF_EPFL_Help"),
    "SNSF: DMP_SNSF_EPFL_Help resource active",
  );
})();

// Test 9: HorizonEU funder
(function testHorizonEU() {
  const state = { ...emptyConfig, funder: "HorizonEU" };
  const ctx = evaluateState(state);

  assertEqual(
    ctx.funderMeta.label,
    "Horizon Europe",
    "HorizonEU: funderMeta.label === Horizon Europe",
  );
  assertEqual(
    ctx.funderMeta.dmpTemplate,
    "horizon",
    "HorizonEU: dmpTemplate === horizon",
  );
  assert(
    ctx.funderMeta.requirements.length > 0,
    "HorizonEU: requirements not empty",
  );
  assert(
    ctx.activeResources.some((r) => r.id === "DMP_H2020"),
    "HorizonEU: DMP_H2020 resource active",
  );
})();

// Test 10: NIH funder with massive data types
(function testNih() {
  const state = {
    ...emptyConfig,
    funder: "NIH",
    dataDescription: [
      { type: "Données massives (> 1 TB)", identifier: "large_data" },
    ],
  };
  const ctx = evaluateState(state);

  assertEqual(ctx.funderMeta.label, "NIH", "NIH: funderMeta.label === NIH");
  assertEqual(
    ctx.funderMeta.dmpTemplate,
    "nih",
    "NIH: dmpTemplate === nih",
  );
  // HPC folder should be active (massive data types)
  assert(
    ctx.activeFolders.some((f) => f.id === "hpc"),
    "NIH+large: activeFolders contains 'hpc'",
  );
  // dataFolders should include "large"
  assert(
    ctx.dataFolders.some((d) => d.key === "large"),
    "NIH+large: dataFolders contains large",
  );
  // NIH resource active
  assert(
    ctx.activeResources.some((r) => r.id === "DMP_NIH_DMS"),
    "NIH: DMP_NIH_DMS resource active",
  );
})();

// ── 2. templates.js — Content generation ───────────────────────────────────────
console.log("\n\u{1F4E6} templates.js");

const testState = {
  projectName: "test_project",
  unit: "LSMS",
  funder: "SNSF",
  codeDescription: [
    { type: "Script", language: "Python 3", identifier: "src_analysis" },
  ],
  dataLicense: "CC-BY-4.0",
  codeLicense: "MIT",
  projectDescription: "A test project",
  methodology: "We test things",
  keywords: "test, demo",
  dataDescription: [
    { type: "Tabulaire / CSV", identifier: "tabular_data" },
    { type: "Images / Microscopie", identifier: "microscopy" },
  ],
  namingPattern: "rdm",
  contributors: [
    { firstName: "Jane", lastName: "Doe", role: "Project leader" },
  ],
};
const testCtx = evaluateState(testState);

// Test 11: buildReadme generates without error
(function testBuildReadme() {
  const readme = T.buildReadme(testState, testCtx);
  assert(typeof readme === "string", "readme: returns a string");
  assert(readme.length > 50, "readme: string has substantial length");
  assertIncludes(readme, "test_project", "readme: contains project name");
  assertIncludes(readme, "Jane Doe", "readme: contains creator");
  assertIncludes(readme, "LSMS", "readme: contains unit");
  assertIncludes(readme, "SNSF / FNS", "readme: contains funder label");
})();

// Test 12: buildNamingConventions generates
(function testBuildNamingConventions() {
  const naming = T.buildNamingConventions(testState, testCtx);
  assert(typeof naming === "string", "naming: returns a string");
  assertIncludes(naming, "General pattern", "naming: contains 'General pattern'");
  assertIncludes(
    naming,
    "test_project",
    "naming: contains project name",
  );
})();

// Test 13: buildDmpStarter generates
(function testBuildDmpStarter() {
  const dmp = T.buildDmpStarter(testState, testCtx);
  assert(typeof dmp === "string", "dmp: returns a string");
  assertIncludes(dmp, "DMP Starter", "dmp: contains 'DMP Starter'");
  assertIncludes(dmp, "test_project", "dmp: contains project name");
})();

// Test 14: buildLicense generates
(function testBuildLicense() {
  const license = T.buildLicense(testState);
  assert(typeof license === "string", "license: returns a string");
  assertIncludes(license, "LICENSE", "license: contains 'LICENSE'");
  assertIncludes(
    license,
    "Creative Commons Attribution 4.0",
    "license: contains CC-BY-4.0 name",
  );
  assertIncludes(license, "MIT License", "license: contains MIT License");
})();

// Test 15: buildNamingConventions with custom naming pattern
(function testCustomNamingPattern() {
  const customState = { ...testState, namingPattern: "date_first" };
  const customCtx = evaluateState(customState);
  const naming2 = T.buildNamingConventions(customState, customCtx);
  assertIncludes(
    naming2,
    "{date}",
    "naming date_first: pattern includes {date}",
  );
  assertIncludes(
    naming2,
    "{date}_{project}",
    "naming date_first: pattern starts with {date}_{project}",
  );
  // The "separated by underscores" text should appear
  assertIncludes(
    naming2,
    "underscores",
    "naming date_first: mentions underscores separator",
  );
})();

// Test 16: buildReadme with sensitive data
(function testReadmeSensitive() {
  const sensState = {
    ...testState,
    dataDescription: [{ type: "Images", format: "TIFF", sensitive: true }],
  };
  const sensCtx = evaluateState(sensState);
  const readme2 = T.buildReadme(sensState, sensCtx);
  assertIncludes(
    readme2,
    "Images",
    "readme sensitive: data table includes 'Images' type",
  );
  assertIncludes(
    readme2,
    "TIFF",
    "readme sensitive: data table includes 'TIFF' format",
  );
  // The sensitive_data folder is active in ctx
  assert(
    sensCtx.activeFolders.some((f) => f.id === "sensitive_data"),
    "readme sensitive: ctx has sensitive_data active folder",
  );
})();

// Test 16b: buildChecklistEthics (sensitive data checklist)
(function testBuildChecklistEthics() {
  const ethics = T.buildChecklistEthics(testState);
  assert(typeof ethics === "string", "ethics checklist: returns a string");
  assertIncludes(
    ethics,
    "Ethics and conformity",
    "ethics checklist: contains title",
  );
  assertIncludes(
    ethics,
    "test_project",
    "ethics checklist: contains project name",
  );
})();

// Test 16c: buildChecklistArchiving
(function testBuildChecklistArchiving() {
  const archiving = T.buildChecklistArchiving(testState, testCtx);
  assert(
    typeof archiving === "string",
    "archiving checklist: returns a string",
  );
  assertIncludes(
    archiving,
    "archiving",
    "archiving checklist: contains title",
  );
  assertIncludes(
    archiving,
    "SNSF / FNS",
    "archiving checklist: contains funder label",
  );
})();

// Test 16d: buildDataDictionary with images data
(function testBuildDataDictionary() {
  const dict = T.buildDataDictionary(testState, testCtx);
  assert(typeof dict === "string", "data dictionary: returns a string");
  assertIncludes(
    dict,
    "variable_name",
    "data dictionary: contains header row",
  );
  // testCtx has images → should include image_id
  assertIncludes(
    dict,
    "image_id",
    "data dictionary: contains image_id (from images data type)",
  );
  assertIncludes(
    dict,
    "resolution_xy",
    "data dictionary: contains resolution_xy",
  );
})();

// Test 16e: buildConfig
(function testBuildConfig() {
  const config = T.buildConfig(testState, testCtx);
  assert(typeof config === "string", "config: returns a string");
  assertIncludes(config, "rdm_generator_version", "config: contains version");
  assertIncludes(config, "test_project", "config: contains project name");
  // Parse and verify structure
  const parsed = JSON.parse(config);
  assert(
    parsed.project.name === "test_project",
    "config parsed: project.name is test_project",
  );
  assert(
    parsed.compliance.funder === "SNSF",
    "config parsed: compliance.funder is SNSF",
  );
  assert(
    Array.isArray(parsed.data.types) && parsed.data.types.length === 2,
    "config parsed: data.types has 2 entries",
  );
})();

// Test 16f: buildChangelog
(function testBuildChangelog() {
  const changelog = T.buildChangelog(testState);
  assert(typeof changelog === "string", "changelog: returns a string");
  assertIncludes(changelog, "Changelog", "changelog: contains title");
  assertIncludes(
    changelog,
    "test_project",
    "changelog: contains project name",
  );
  assertIncludes(changelog, "0.1.0", "changelog: contains version 0.1.0");
})();

// Test 16g: buildGitignore
(function testBuildGitignore() {
  const gitignore = T.buildGitignore(testState);
  assert(typeof gitignore === "string", "gitignore: returns a string");
  assertIncludes(
    gitignore,
    "Sensitive_Data/raw_restricted/",
    "gitignore: contains Sensitive_Data exclusions",
  );
  assertIncludes(
    gitignore,
    "__pycache__",
    "gitignore: contains Python cache exclusions",
  );
})();

// Test 16h: buildAnonymizationGuide
(function testBuildAnonymizationGuide() {
  const guide = T.buildAnonymizationGuide(testState);
  assert(typeof guide === "string", "anon guide: returns a string");
  assertIncludes(
    guide,
    "anonymisation",
    "anon guide: contains 'anonymisation'",
  );
  assertIncludes(
    guide,
    "test_project",
    "anon guide: contains project name",
  );
})();

// Test 16j: getDefaultFolders returns expected folders
(function testGetDefaultFolders() {
  const ctx = evaluateState(testState);
  const folders = getDefaultFolders(testState, ctx);
  assert(folders.length > 10, "getDefaultFolders: returns many folders");
  const adminProtocols = folders.find(f => f.path === "00_Admin/protocols");
  assert(adminProtocols !== undefined, "getDefaultFolders: contains 00_Admin/protocols");
  assert(adminProtocols.active === true, "getDefaultFolders: admin/protocols is active by default");
  // hasCode is true in testState → 06_Code folders should be active
  const codeSrc = folders.find(f => f.path === "06_Code/src");
  assert(codeSrc !== undefined && codeSrc.active === true, "getDefaultFolders: 06_Code/src is active when hasCode");
  // Test with empty state (no code)
  const emptyCtx = evaluateState(emptyConfig);
  const emptyFolders = getDefaultFolders(emptyConfig, emptyCtx);
  const emptyCodeSrc = emptyFolders.find(f => f.path === "06_Code/src");
  assert(emptyCodeSrc !== undefined && emptyCodeSrc.active === false, "getDefaultFolders: 06_Code/src is inactive when no code");
  // Sensitive data folders
  const sensState = { ...emptyConfig, dataDescription: [{ type: "Images", sensitive: true }] };
  const sensCtx = evaluateState(sensState);
  const sensFolders = getDefaultFolders(sensState, sensCtx);
  assert(sensFolders.some(f => f.path === "Sensitive_Data/raw_restricted"), "getDefaultFolders: sensitive_data adds Sensitive_Data/raw_restricted");
})();

// Test 16k: buildDmpStarter with licenses in FAIR section
(function testDmpStarterLicenses() {
  const dmp = T.buildDmpStarter(testState, testCtx);
  assertIncludes(dmp, "Creative Commons Attribution 4.0", "dmp FAIR: contains CC-BY-4.0 full name");
  assertIncludes(dmp, "MIT License", "dmp FAIR: contains MIT License full name");
  // Check that the licenses appear in the Reusable section of FAIR
  assertIncludes(dmp, "Reusable:", "dmp FAIR: contains 'Reusable:' sub-section");
  assertIncludes(dmp, "Clear licensing", "dmp FAIR: contains 'Clear licensing' text");
})();

// Test 16l: buildDmpStarter with reused sources
(function testDmpStarterReusedSources() {
  const stateWithReused = {
    ...testState,
    reusedSources: {
      "ext_dataset_1": { doi: "10.5281/zenodo.12345", sourceLicense: "CC-BY-4.0", sourceTable: "data" },
      "ext_code_1": { doi: "10.5281/zenodo.67890", sourceLicense: "MIT", sourceTable: "code" },
    },
  };
  const ctxWithReused = evaluateState(stateWithReused);
  const dmp = T.buildDmpStarter(stateWithReused, ctxWithReused);
  assertIncludes(dmp, "Sources réutilisées", "dmp reused: contains section title");
  assertIncludes(dmp, "ext_dataset_1", "dmp reused: contains reused source identifier");
  assertIncludes(dmp, "ext_code_1", "dmp reused: contains code source identifier");
  assertIncludes(dmp, "Creative Commons Attribution 4.0", "dmp reused: contains full license name");
  assertIncludes(dmp, "MIT License", "dmp reused: contains MIT full name");
  assertIncludes(dmp, "Compatibility note", "dmp reused: contains compatibility note");
})();

// Test 16i: buildNotebook
(function testBuildNotebook() {
  const notebook = T.buildNotebook("01_exploration", testState);
  assert(typeof notebook === "string", "notebook: returns a string");
  const parsed = JSON.parse(notebook);
  assert(parsed.nbformat === 4, "notebook: nbformat is 4");
  assert(
    parsed.cells.length > 0,
    "notebook: has cells",
  );
  assert(
    parsed.metadata.kernelspec.display_name === "Python 3",
    "notebook: kernelspec is Python 3",
  );
})();

// ── 3. zipgen.js — ZIP generation ──────────────────────────────────────────────
console.log("\n\u{1F4E6} zipgen.js");

// Test 17: makeDirEntry creates proper entry
(function testMakeDirEntry() {
  const dirEntry = makeDirEntry("test/folder/");

  assertEqual(dirEntry.name, "test/folder/", "dirEntry: name ends with /");
  assert(dirEntry.isDir === true, "dirEntry: isDir is true");
  assert(
    dirEntry.content instanceof Uint8Array,
    "dirEntry: content is Uint8Array",
  );
  assert(dirEntry.content.length === 0, "dirEntry: content is empty");
})();

// Test 17b: makeDirEntry adds trailing slash if missing
(function testMakeDirEntryNoSlash() {
  const dirEntry = makeDirEntry("test/folder");
  assertEqual(
    dirEntry.name,
    "test/folder/",
    "dirEntry no-slash: trailing slash added",
  );
})();

// Test 18: makeFileEntry creates proper entry
(function testMakeFileEntry() {
  const fileEntry = makeFileEntry("test/file.txt", "hello world");

  assertEqual(fileEntry.name, "test/file.txt", "fileEntry: name is correct");
  assert(fileEntry.isDir === false, "fileEntry: isDir is false");
  assert(
    fileEntry.content instanceof Uint8Array,
    "fileEntry: content is Uint8Array",
  );
  // "hello world" is 11 bytes in UTF-8
  assert(fileEntry.content.length === 11, "fileEntry: content has 11 bytes");
})();

// Test 19: buildZipBuffer returns valid ZIP
(function testBuildZipBuffer() {
  const entries = [
    makeDirEntry("test/"),
    makeFileEntry("test/hello.txt", "Hello World"),
    makeFileEntry("test/data.csv", "a,b,c\n1,2,3"),
  ];
  const zipBuffer = buildZipBuffer(entries);

  assert(
    zipBuffer instanceof Uint8Array,
    "zipBuffer: is instance of Uint8Array",
  );
  assert(zipBuffer.length > 50, "zipBuffer: has substantial length");
  // ZIP local file header signature: PK\03\04
  assert(
    zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4b,
    "zipBuffer: starts with PK (0x50 0x4B)",
  );
  // The first 4 bytes should be PK\x03\x04
  assert(
    zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4b && zipBuffer[2] === 0x03 && zipBuffer[3] === 0x04,
    "zipBuffer: starts with ZIP local header signature (PK\\x03\\x04)",
  );
  // Verify central directory and EOCD are present by checking last ~22 bytes for EOCD signature
  const last22 = zipBuffer.slice(-22);
  // EOCD signature: PK\x05\x06 = 0x50 0x4b 0x05 0x06
  assert(
    last22[0] === 0x50 && last22[1] === 0x4b && last22[2] === 0x05 && last22[3] === 0x06,
    "zipBuffer: ends with EOCD signature (PK\\x05\\x06)",
  );
  // EOCD has the number of entries at offset 10 in the record
  const entryCount = last22[8] | (last22[9] << 8);
  assert(entryCount === 3, "zipBuffer: EOCD reports 3 entries");
})();

// ── 4. i18n.js — Translations ──────────────────────────────────────────────────
console.log("\n\u{1F4E6} i18n.js");

// Test 20: t() returns correct translation
(function testTranslations() {
  // Set to English
  setLang("en");
  assertEqual(getLang(), "en", "i18n: getLang returns 'en' after setLang('en')");
  assertEqual(
    t("btn.next"),
    "Next step",
    "i18n: t('btn.next') in EN returns 'Next step'",
  );

  // Set to French
  setLang("fr");
  assertEqual(getLang(), "fr", "i18n: getLang returns 'fr' after setLang('fr')");
  assertEqual(
    t("btn.next"),
    "Étape suivante",
    "i18n: t('btn.next') in FR returns 'Étape suivante'",
  );

  // Test a few more keys
  assertEqual(
    t("btn.download"),
    "Télécharger le projet (.zip)",
    "i18n: t('btn.download') in FR",
  );

  setLang("en");
  assertEqual(
    t("btn.prev"),
    "Previous step",
    "i18n: t('btn.prev') in EN returns 'Previous step'",
  );
})();

// Test 21: t() returns key for missing translations (with console.warn)
(function testMissingKey() {
  setLang("en");

  // Capture console.warn
  const originalWarn = console.warn;
  let warned = false;
  console.warn = (...args) => {
    if (args[0] && args[0].includes("Missing key: nonexistent_key_xyz")) {
      warned = true;
    }
  };

  const result = t("nonexistent_key_xyz");
  assertEqual(
    result,
    "nonexistent_key_xyz",
    "i18n: missing key returns the key itself",
  );
  assert(warned, "i18n: missing key triggers console.warn");

  // Restore
  console.warn = originalWarn;
})();

// Test 22: t() with template arguments
(function testTWithArgs() {
  setLang("en");
  // "topbar.step" is a function (c, t) => `Step ${c} of ${t}`
  const result = t("topbar.step", 2, 5);
  assertEqual(result, "Step 2 of 5", "i18n: t('topbar.step', 2, 5) in EN");

  setLang("fr");
  const resultFr = t("topbar.step", 2, 5);
  assertEqual(
    resultFr,
    "Étape 2 / 5",
    "i18n: t('topbar.step', 2, 5) in FR",
  );
})();

// Test 23: t() when lang is null (edge case)
(function testTLangNull() {
  // We can't easily test the `if (!_lang) return key` branch since _lang
  // is module-private and initialized to "en" via localStorage mock.
  // This test verifies that setLang works with any value.
  setLang("en");
  assertEqual(getLang(), "en", "i18n: getLang after reset to en");
})();

// ── 5. reusedSources tests ─────────────────────────────────────────────────────
console.log("\n\u{1F4E6} reusedSources");

// Test 24: reusedSources exists in default STATE
(function testReusedSourcesDefault() {
  assert(
    STATE.hasOwnProperty("reusedSources"),
    "reusedSources: STATE has reusedSources property",
  );
  assert(
    typeof STATE.reusedSources === "object" && !Array.isArray(STATE.reusedSources),
    "reusedSources: is an object (dictionary)",
  );
  assertEqual(
    Object.keys(STATE.reusedSources).length,
    0,
    "reusedSources: starts empty",
  );
})();

// Test 25: can add manual source to reusedSources
(function testAddSource() {
  const id = "src_test123";
  STATE.reusedSources[id] = {
    doi: "10.5281/zenodo.12345",
    link: "https://github.com/example/repo",
    sourceLicense: "CC-BY-4.0",
    citation: "Author (2024). Title.",
    sourceTable: "data",
    manual: true,
  };
  assert(
    STATE.reusedSources[id] !== undefined,
    "reusedSources: manual source added successfully",
  );
  assertEqual(
    STATE.reusedSources[id].doi,
    "10.5281/zenodo.12345",
    "reusedSources: doi stored correctly",
  );
  assertEqual(
    STATE.reusedSources[id].sourceLicense,
    "CC-BY-4.0",
    "reusedSources: sourceLicense stored correctly",
  );
  assertEqual(
    STATE.reusedSources[id].manual,
    true,
    "reusedSources: manual flag stored correctly",
  );
  
  // Clean up
  delete STATE.reusedSources[id];
  assert(
    STATE.reusedSources[id] === undefined,
    "reusedSources: source deleted correctly",
  );
})();

// Test 26: reusedSources survives Object.assign (discardSession pattern)
(function testReusedSourcesReset() {
  // Simulate adding a source
  STATE.reusedSources["test_id"] = { doi: "10.1234/test", sourceTable: "data" };
  
  // Simulate discardSession reset
  Object.assign(STATE, {
    reusedSources: {},
  });
  
  assertEqual(
    Object.keys(STATE.reusedSources).length,
    0,
    "reusedSources: reset via Object.assign works",
  );
})();

// ── Results ────────────────────────────────────────────────────────────────────
const success = failed === 0;
console.log(
  `\n\u{1F4CA} Results: ${passed}/${total} passed, ${failed} failed${failed > 0 ? " \u274c" : " \u2705"}`,
);
if (!success) process.exit(1);
