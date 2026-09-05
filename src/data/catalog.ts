import { useEffect, useState } from 'react';
import type { CustomExercise, ImageSource } from '@/types';
import { normalize, type Searchable } from '@/lib/search';
import { FRENCH_NAMES } from './frenchNames';
import { prominenceBoost } from './popular';
import {
  CATEGORY_FR,
  EQUIPMENT_FR,
  LEVEL_FR,
  MUSCLE_FR,
  MUSCLE_TO_GROUP,
  SEARCH_ALIASES,
} from './labels';

export interface CatalogExercise {
  id: string;
  name: string;
  category: string;
  level: string | null;
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  /** Chemins relatifs dans free-exercise-db, ou URLs absolues (exercices perso). */
  images: string[];
  isCustom: boolean;
  /** Nom d'origine (anglais) quand `name` a été traduit. */
  originalName?: string;
}

export interface IndexedExercise extends Searchable {
  exercise: CatalogExercise;
  groups: string[];
}

const IMAGE_BASES: Record<Exclude<ImageSource, 'none'>, string> = {
  jsdelivr: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/',
  github: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/',
};

/** URL d'affichage d'un média : les exercices perso portent des URLs absolues. */
export function mediaUrl(path: string, source: ImageSource): string | null {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  if (source === 'none') return null;
  return IMAGE_BASES[source] + path;
}

export type MediaKind = 'image' | 'video' | 'youtube';

export function mediaKind(url: string): MediaKind {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'video';
  return 'image';
}

/** Identifiant de vidéo YouTube, pour construire une URL d'intégration. */
export function youtubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([\w-]{6,})/) ??
    url.match(/youtu\.be\/([\w-]{6,})/) ??
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? m[1] : null;
}

/** Recherche YouTube toute prête, utile quand le catalogue n'a que des photos. */
export function youtubeSearchUrl(exercise: Pick<CatalogExercise, 'name' | 'originalName'>): string {
  // Le nom français donne des tutoriels en français quand il existe.
  const query = exercise.originalName
    ? `${exercise.name} technique musculation`
    : `${exercise.name} exercise technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function customToCatalog(custom: CustomExercise): CatalogExercise {
  return {
    id: custom.id,
    name: custom.name,
    category: custom.category,
    level: null,
    force: null,
    mechanic: null,
    equipment: custom.equipment,
    primaryMuscles: custom.primaryMuscles,
    secondaryMuscles: custom.secondaryMuscles,
    instructions: custom.instructions,
    images: custom.media,
    isCustom: true,
  };
}

export function indexExercise(exercise: CatalogExercise): IndexedExercise {
  // Nom affiché + nom d'origine : « bench press » comme « développé couché »
  // doivent frapper le même champ fort.
  const name = normalize(`${exercise.name} ${exercise.originalName ?? ''}`);

  // Champ fort : synonymes français, muscles principaux, matériel.
  const keywords = [
    ...exercise.primaryMuscles.map((m) => normalize(MUSCLE_FR[m] ?? m)),
    normalize(EQUIPMENT_FR[exercise.equipment ?? ''] ?? exercise.equipment ?? ''),
  ];
  const englishName = normalize(exercise.originalName ?? exercise.name);
  for (const alias of SEARCH_ALIASES) {
    if (alias.en.some((en) => englishName.includes(normalize(en)))) keywords.push(...alias.fr);
  }

  // Champ faible : muscles secondaires, catégorie, niveau, noms anglais des muscles.
  const extra = [
    ...exercise.secondaryMuscles.map((m) => normalize(MUSCLE_FR[m] ?? m)),
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
    normalize(CATEGORY_FR[exercise.category] ?? exercise.category),
    normalize(LEVEL_FR[exercise.level ?? ''] ?? ''),
  ];

  const groups = [
    ...new Set(
      exercise.primaryMuscles
        .map((m) => MUSCLE_TO_GROUP[m])
        .filter((g): g is string => Boolean(g)),
    ),
  ];

  return {
    exercise,
    name,
    keywords: keywords.filter(Boolean).join(' '),
    extra: extra.filter(Boolean).join(' '),
    boost: exercise.isCustom
      ? 150 // les exercices personnels passent devant
      : prominenceBoost(exercise.id, exercise.name, exercise.mechanic, exercise.equipment),
    groups,
  };
}

let cache: Promise<CatalogExercise[]> | null = null;

export function loadCatalog(): Promise<CatalogExercise[]> {
  if (!cache) {
    const url = new URL(
      `${import.meta.env.BASE_URL}catalog/exercises.json`,
      window.location.href,
    );
    cache = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Catalogue indisponible (HTTP ${res.status})`);
        return res.json();
      })
      .then((json: { exercises: Omit<CatalogExercise, 'isCustom'>[] }) =>
        json.exercises.map((e) => {
          const french = FRENCH_NAMES[e.id];
          return {
            ...e,
            isCustom: false,
            name: french ?? e.name,
            originalName: french ? e.name : undefined,
          };
        }),
      )
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export interface CatalogState {
  exercises: CatalogExercise[];
  loading: boolean;
  error: string | null;
}

/** Charge le catalogue une fois pour toute l'application. */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    exercises: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    loadCatalog().then(
      (exercises) => alive && setState({ exercises, loading: false, error: null }),
      (err: Error) =>
        alive && setState({ exercises: [], loading: false, error: err.message }),
    );
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
