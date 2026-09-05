/**
 * Génère public/catalog/exercises.json à partir de free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db — domaine public / Unlicense).
 *
 * Usage : npm run fetch:catalog
 * Le fichier généré est versionné dans le dépôt : ce script ne sert qu'à le rafraîchir.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/catalog/exercises.json',
);

const KEYS = [
  'id',
  'name',
  'category',
  'level',
  'force',
  'mechanic',
  'equipment',
  'primaryMuscles',
  'secondaryMuscles',
  'instructions',
  'images',
];

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Téléchargement impossible : HTTP ${res.status}`);

/** @type {Record<string, unknown>[]} */
const raw = await res.json();

const exercises = raw
  .map((e) => Object.fromEntries(KEYS.map((k) => [k, e[k] ?? null])))
  .sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));

await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({
    source: 'free-exercise-db',
    license: 'Unlicense (domaine public)',
    url: 'https://github.com/yuhonas/free-exercise-db',
    generatedAt: new Date().toISOString().slice(0, 10),
    exercises,
  }),
);

console.log(`${exercises.length} exercices écrits dans ${OUT}`);
