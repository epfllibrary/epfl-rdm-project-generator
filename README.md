# EPFL RDM Project Generator

Application web statique pour générer automatiquement un package complet de Research Data Management (RDM), personnalisé selon le projet, le domaine scientifique et le financeur.

Génére une arborescence de dossiers, des templates README/DMP/checklists, des scripts Python/R, des notebooks Jupyter, et inclut les ressources EPFL (guides PDF, templates ODT/DOCX) — le tout dans une archive ZIP.

## Utilisation

```sh
python3 -m http.server 8000
# ouvrir http://localhost:8000
```

L'application nécessite un serveur HTTP car les modules ES ne fonctionnent pas en `file://`.

## Structure du projet

```
index.html          — Shell HTML + UI du wizard + bootstrap module ES
style.css           — Design system EPFL (couleurs, layout, typographie, responsive)
app.js              — Logique principale : état, navigation, binding formulaire, autosave, assemblage ZIP
templates.js        — Tous les templates générés : README, DMP, naming conventions, checklists, scripts, notebooks, licences
rules.js            — Moteur de règles conditionnelles : dossiers, ressources, métadonnées funder
zipgen.js           — Générateur ZIP pur JS (méthode STORE, zéro dépendance)
i18n.js             — Module de traduction FR/EN pour l'interface
AGENTS.md           — Notes pour les agents opencode (architecture, APIs, historique des sessions)
assets/resources/   — Ressources EPFL incluses dans le ZIP (PDF, ODT, DOCX)
```

## Personnalisation

| Élément | Où modifier |
|---|---|
| Marque / couleurs | `style.css` (variables CSS personnalisées) |
| Financeurs et règles | `rules.js` — section `RULES.funders` |
| Ressources à inclure | `rules.js` — section `RULES.resources` |
| Structure des dossiers | `rules.js` — section `RULES.folders` |
| Sous-dossiers de données | `rules.js` — section `RULES.dataSubfolders` |
| Templates de fichiers | `templates.js` — chaque fonction `build*` |
| Traductions | `i18n.js` — dictionnaire `UI` |
| Fichiers ressources | `assets/resources/` |

## Ajouter un nouveau financeur

Dans `rules.js`, ajouter une entrée dans `RULES.funders` :

```js
MonFunder: {
  label: "Mon Financeur",
  dmpTemplate: "monfunder",
  requirements: ["Exigence 1", "Exigence 2"],
  openDataPolicy: "Description de la politique",
  dmpDeadline: "Délai"
}
```

Ajouter ensuite une entrée correspondante dans `RULES.resources` (si un template DMP spécifique existe) et placer le fichier dans `assets/resources/`.

## Déploiement GitHub Pages

1. Pusher le repo sur GitHub
2. Aller dans **Settings → Pages → Source : Deploy from branch → main / root**
3. L'URL sera `https://{username}.github.io/{repo-name}/`

> Le fichier `.nojekyll` à la racine est nécessaire pour GitHub Pages (empêche Jekyll de traiter les dossiers commençant par `_`).

## Contact

EPFL Library — Research Data Management : [researchdata@epfl.ch](mailto:researchdata@epfl.ch) — [go.epfl.ch/rdm](https://go.epfl.ch/rdm)
