# EPFL RDM Project Generator

Application web statique destinée aux chercheuses et chercheurs de l'EPFL pour générer automatiquement une archive ZIP contenant la structure complète d'un projet de recherche.

L'archive produite inclut un README de projet, des conventions de nommage, des fichiers de licence, un modèle de DMP (Data Management Plan), des checklists, et les ressources EPFL pertinentes (guides PDF, modèles ODT/DOCX) — le tout personnalisé selon les réponses fournies dans l'assistant.

Aucune installation ni dépendance n'est requise : l'application s'exécute entièrement dans le navigateur.

---

## Démarrage rapide

Un serveur HTTP est nécessaire pour le chargement des modules ES. Depuis la racine du projet :

```sh
python3 -m http.server 8000
```

Ouvrir ensuite [http://localhost:8000](http://localhost:8000) dans un navigateur.

> L'ouverture directe du fichier `index.html` en `file://` ne fonctionne pas avec les modules JavaScript ES.

---

## Structure du projet

| Fichier / Dossier | Rôle |
|---|---|
| `index.html` | Shell de l'application, interface utilisateur de l'assistant, bootstrap des modules ES |
| `style.css` | Design system EPFL — couleurs, grille, typographie, responsive |
| `app.js` | Logique principale — état global, navigation, liaison formulaire-état, assemblage ZIP, arbre de preview |
| `templates.js` | Générateurs de contenu pour tous les fichiers livrés dans le ZIP (README, DMP, licences, conventions, scripts, notebooks) |
| `rules.js` | Moteur de règles conditionnelles — dossiers, ressources, métadonnées financeur, sous-dossiers données |
| `zipgen.js` | Générateur ZIP pur JavaScript (méthode STORE, zéro dépendance) |
| `i18n.js` | Module de traduction français / anglais pour l'interface et les fichiers générés |
| `tests/tests.js` | Tests unitaires exécutables avec Node.js |
| `assets/resources/` | Fichiers ressources EPFL inclus dans le ZIP (PDF, ODT, DOCX) |
| `.nojekyll` | Requis pour le déploiement GitHub Pages (empêche Jekyll de traiter les dossiers commençant par `_`) |
| `AGENTS.md` | Notes d'architecture à l'usage des agents opencode |

---

## Fonctionnalités

- **Assistant en 3 étapes** : projet → données & code → licences
- **Génération ZIP complète** : arborescence de dossiers, fichiers README, DMP_STARTER, conventions de nommage, licences, checklists
- **Assistant licence guidé** : quiz interactif qui oriente vers la licence recommandée, avec vérification de compatibilité entre licences
- **Conventions de nommage** : 4 presets au choix (snake_case, camelCase, kebab-case, dot.case)
- **Arbre interactif** : dans l'écran résultat, visualisation de l'arborescence avec cases à cocher pour sélectionner les fichiers à inclure
- **Sources réutilisées** : déclaration de données ou code existants avec vérification de compatibilité de licence
- **DMP_STARTER.md pré-rempli** : plan de gestion de données amorcé à partir des informations saisies
- **Structure de dossiers personnalisable** : activation conditionnelle de dossiers (docs, scripts, notebooks, conf, etc.) selon le type de projet
- **Ressources EPFL intégrées** : guides, modèles et documents officiels inclus dans l'archive
- **Bilinguisme FR/EN** : interface et fichiers générés disponibles en français ou en anglais
- **Génération 100 % côté client** : aucune donnée transmise à un serveur, aucune dépendance externe

---

## Parcours utilisateur

1. **Étape 1 — Projet** : saisir le nom du projet, l'unité EPFL, le numéro de grant, une description, des mots-clés, le financeur, les collaborateurs, et activer les options souhaitées (dossier docs, notebooks, scripts, etc.)
2. **Étape 2 — Données & code** : décrire les jeux de données et le code produit, choisir une convention de nommage, déclarer les sources réutilisées
3. **Étape 3 — Licences** : sélectionner les licences pour les données et le code (assistant quiz ou sélecteur manuel), vérifier la compatibilité
4. **Résultat** : visualiser l'arborescence du projet, cocher/décocher les éléments, puis télécharger l'archive ZIP

---

## Personnalisation

| Élément | Emplacement |
|---|---|
| Marque, couleurs, métadonnées visuelles | `style.css` — variables CSS personnalisées |
| Liste des financeurs et leurs exigences | `rules.js` — section `RULES.funders` |
| Ressources EPFL à inclure dans le ZIP | `rules.js` — section `RULES.resources` |
| Structure des dossiers du projet | `rules.js` — section `RULES.folders` |
| Sous-dossiers de données (raw, processed, etc.) | `rules.js` — section `RULES.dataSubfolders` |
| Contenu des fichiers générés | `templates.js` — chaque fonction `build*` |
| Traductions de l'interface | `i18n.js` — dictionnaire `UI` |
| Fichiers ressources sur disque | `assets/resources/` |

### Ajouter un nouveau financeur

Dans `rules.js`, ajouter une entrée dans `RULES.funders` :

```js
MonFunder: {
  label: "Mon Financeur",
  dmpTemplate: "monfunder",
  requirements: ["Exigence 1", "Exigence 2"],
  openDataPolicy: "Description de la politique Open Data",
  dmpDeadline: "6 mois après le début du projet"
}
```

Ajouter ensuite une entrée correspondante dans `RULES.resources` (si un modèle DMP spécifique à ce financeur existe) et placer le fichier dans `assets/resources/`.

---

## Déploiement sur GitHub Pages

1. Pusher le dépôt sur GitHub
2. Dans le dépôt, aller dans **Settings → Pages → Source : Deploy from branch**
3. Sélectionner la branche `main` et le dossier racine (`/`)
4. L'application sera accessible à l'adresse `https://{organisation}.github.io/{depot}/`

> Le fichier `.nojekyll` à la racine du dépôt est nécessaire pour GitHub Pages. Sans lui, Jekyll ignore les dossiers et fichiers dont le nom commence par un tiret bas (`_`), ce qui peut interrompre le chargement des ressources.

---

## Développement

### Prérequis

- Python 3 (pour le serveur HTTP local) ou tout autre serveur HTTP statique
- Node.js (pour l'exécution des tests unitaires)

### Tests

Les tests unitaires se trouvent dans `tests/tests.js` et s'exécutent avec Node.js :

```sh
node tests/tests.js
```

Ils couvrent la génération de contenu (templates), l'évaluation des règles conditionnelles, la construction du ZIP et les traductions.

### Principes

- Aucune dépendance externe ni build : le code source est exécuté directement par le navigateur
- Les modules ES sont importés depuis `index.html` dans un ordre défini (i18n → rules → templates → app)
- L'état global (`STATE`) est mutable et lié aux champs du formulaire via des fonctions de binding (`bindInput`, `bindChip`, `bindToggle`, etc.)
- La compression ZIP utilise la méthode STORE (aucune compression) pour rester en pur JS sans bibliothèque

---

## Contact

EPFL Library — Research Data Management  
[researchdata@epfl.ch](mailto:researchdata@epfl.ch)  
[go.epfl.ch/rdm](https://go.epfl.ch/rdm)
