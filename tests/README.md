# Tests — EPFL RDM Project Generator

Unit tests for the EPFL RDM Project Generator (vanilla JS, ES modules, zero dependencies).

## Prerequisites

- Node.js 22+ (tested with v22.x)

No npm install needed — the app is zero-dependency.

## Run

```sh
node tests/tests.js
```

## Test structure

All tests are in a single file `tests.js`:

| Section | File tested | Tests | Description |
|---|---|---|---|
| `rules.js — evaluateState` | `rules.js` | 1–10 | Conditional rule evaluation with various state combinations |
| `templates.js` | `templates.js` | 11–16i | Content generation for README, naming conventions, DMP, licenses, notebooks, etc. |
| `zipgen.js` | `zipgen.js` | 17–19 | ZIP entry creation and valid ZIP buffer assembly |
| `i18n.js` | `i18n.js` | 20–23 | Translation function, missing key handling, template strings |

## Coverage areas

- **Empty / default state** — verifies sensible defaults (Other funder, tabular data folder)
- **Multisite projects** — correct folder rules and DMP sections
- **Human data** — clinical folder, ethics sections
- **Multi-team** — RDM Strategy resource trigger
- **Data type combinations** — folder derivation from chips and description table
- **Sensitive data** — GDPR/Sensitive folders, DMP sections
- **All funders** — SNSF, HorizonEU, NIH, ERC, Other with correct metadata
- **ZIP integrity** — valid PKZIP structure (local headers, central dir, EOCD)
- **Internationalisation** — FR/EN switching, missing key fallback, template functions
- **All templates** — README, naming conventions, DMP starter, licenses, checklists, data dictionary, config, changelog, gitignore, anonymisation guide, notebooks

## Adding tests

Add new `assert()` / `assertEqual()` / `assertIncludes()` calls in the relevant section.
Keep tests independent — each test function should not rely on state set by another.
