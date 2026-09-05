# Séances — planifier & tracker ses entraînements

Application **mobile, 100 % front-end** pour préparer ses séances de sport (musculation
en premier lieu) et les suivre en salle. Aucune inscription, aucun serveur : toutes les
données restent dans le navigateur et s'exportent en JSON.

## Fonctionnalités

**Modèles de séance**
- Séances type réutilisables, organisées en **phases** (échauffement, corps de séance,
  retour au calme) que l'on peut renommer, réordonner ou supprimer.
- Par exercice : nombre de séries, répétitions, charge cible, temps de repos, notes.
  Chaque série peut être marquée normale, échauffement, dégressive ou à l'échec.
- Quatre modes de suivi selon l'exercice : charge × reps, reps seules, durée, distance.
- Trois modèles d'exemple (Push / Pull / Legs) sont installés au premier lancement.

**Séances**
- Démarrage depuis un modèle **ou séance libre**, à composer au fur et à mesure.
- Saisie série par série, cible pré-remplie, rappel de la performance précédente
  (« 25/08 : 62,5 kg × 8 »).
- Minuteur de repos automatique à la validation d'une série, avec bip et vibration,
  bouton +30 s, et écran maintenu allumé pendant la séance.
- Ajout d'exercices en cours de route, séries d'échauffement, notes de séance.
- À la fin : résumé (durée, séries, volume) et enregistrement possible **en tant que
  nouveau modèle**.
- La séance en cours survit à un rechargement ou à la fermeture de l'onglet.

**Catalogue d'exercices**
- 876 exercices avec groupes musculaires, matériel, niveau et **illustrations animées**
  (deux images début / fin de mouvement), plus un lien direct vers des vidéos.
- Recherche **en français comme en anglais** : « développé couché », « soulevé de terre »,
  « ischio », « bench press »… Les exercices classiques sont traduits et remontés en tête
  des résultats ; accents et ponctuation sont ignorés.
- Filtres par groupe musculaire, matériel et catégorie.
- **Exercices personnels** : nom, muscles, matériel, consignes et médias (une URL YouTube
  est intégrée directement dans la fiche). C'est la porte d'entrée pour les autres sports.

**Progression**
- Volume hebdomadaire, répartition des séries par groupe musculaire, régularité.
- Par exercice : record de charge, 1RM estimée (Epley), historique et courbe d'évolution.

**Données**
- Tout est stocké dans le `localStorage` du navigateur.
- Export JSON (téléchargement, partage système ou copie), réimport en **fusion** ou en
  **remplacement**, remise à zéro complète.
- Réglages : repos par défaut, incrément de charge, son/vibration, thème
  sombre / clair / système, source des images (ou aucune image, pour un usage hors ligne).
- Les charges sont exprimées en **kilogrammes** partout, sans conversion.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # génère dist/
npm run preview    # sert dist/ localement
```

L'application se construit avec `base: './'` : le dossier `dist/` fonctionne tel quel à la
racine d'un domaine, dans un sous-dossier (GitHub Pages…) ou en local. La navigation
utilise un routeur à `#`, donc aucune règle de réécriture n'est nécessaire côté serveur.

Sur mobile : ouvrir l'URL puis « Ajouter à l'écran d'accueil » — le manifeste et le
service worker rendent l'application installable et utilisable hors ligne.

## Structure

```
src/
  data/        catalogue (chargement, index de recherche), libellés FR, noms français,
               exercices populaires, modèles d'exemple
  lib/         recherche, statistiques, formats, opérations sur modèles et séances,
               export/import, minuteur, wake lock
  store/       état global (Zustand + persistance localStorage) et sélecteurs
  components/  briques d'interface (feuilles modales, champs, graphiques SVG, catalogue)
  pages/       accueil, modèles, éditeur, séance, historique, catalogue, progression, réglages
public/
  catalog/exercises.json   catalogue généré (voir ci-dessous)
```

Le catalogue est un fichier statique versionné dans le dépôt. Pour le régénérer depuis la
source :

```bash
npm run fetch:catalog
```

## Format d'export

```jsonc
{
  "app": "fitness-tracker",
  "formatVersion": 1,
  "exportedAt": "2026-09-05T09:12:00.000Z",
  "data": {
    "settings": { "defaultRestSec": 90, "weightIncrement": 2.5, "…": "…" },
    "templates": [ /* modèles de séance */ ],
    "sessions":  [ /* séances réalisées */ ],
    "customExercises": [ /* exercices personnels */ ]
  }
}
```

Les charges sont **toujours exprimées en kilogrammes**. À l'import, un fichier contenant
directement `templates` / `sessions` est également accepté ; les entrées sont fusionnées
par identifiant, et les réglages inconnus (issus d'une version antérieure) sont ignorés.

## Limites connues

- Les **consignes d'exécution du catalogue sont en anglais** (c'est la langue de la source).
  Les noms des exercices courants, eux, sont traduits ; les autres gardent leur nom d'origine.
- Les illustrations sont chargées depuis un dépôt public : sans connexion, les fiches
  affichent les initiales de l'exercice. Le réglage « Images : Aucune » évite toute requête
  externe.
- Le stockage navigateur peut être vidé par le système ou la navigation privée :
  exportez régulièrement.

## Crédits

Catalogue d'exercices et illustrations :
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) — domaine public (Unlicense).
