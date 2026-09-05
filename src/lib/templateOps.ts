import { uid } from './id';
import type {
  Phase,
  PhaseKind,
  PlannedExercise,
  PlannedSet,
  SetKind,
  Template,
  TrackingMode,
} from '@/types';
import { PHASE_FR } from '@/data/labels';
import type { CatalogExercise } from '@/data/catalog';

/** Devine ce qu'on mesure sur un exercice à partir de sa catégorie. */
export function guessTracking(exercise: CatalogExercise): TrackingMode {
  if (exercise.category === 'cardio') return 'time';
  if (exercise.category === 'stretching') return 'time';
  if (exercise.equipment === 'body only' || exercise.equipment === null) return 'reps';
  return 'weight';
}

export function newSet(kind: SetKind = 'normal', patch: Partial<PlannedSet> = {}): PlannedSet {
  return { id: uid('s'), kind, ...patch };
}

export function newPlannedExercise(
  exercise: CatalogExercise,
  setCount = 3,
  patch: Partial<PlannedExercise> = {},
): PlannedExercise {
  const tracking = patch.tracking ?? guessTracking(exercise);
  const defaults: Partial<PlannedSet> =
    tracking === 'time' ? { durationSec: 60 } : tracking === 'distance' ? {} : { reps: 10 };
  return {
    id: uid('e'),
    exerciseId: exercise.id,
    name: exercise.name,
    tracking,
    sets: Array.from({ length: setCount }, () => newSet('normal', defaults)),
    ...patch,
  };
}

export function newPhase(kind: PhaseKind, name?: string): Phase {
  return { id: uid('p'), kind, name: name ?? PHASE_FR[kind], items: [] };
}

export function newTemplate(patch: Partial<Template> = {}): Template {
  const now = new Date().toISOString();
  return {
    id: uid('t'),
    name: 'Nouveau modèle',
    sport: 'muscu',
    tags: [],
    phases: [newPhase('warmup'), newPhase('main')],
    createdAt: now,
    updatedAt: now,
    timesUsed: 0,
    ...patch,
  };
}

/** Remplace un élément d'un tableau par sa version modifiée. */
export function mapById<T extends { id: string }>(
  items: T[],
  id: string,
  fn: (item: T) => T,
): T[] {
  return items.map((item) => (item.id === id ? fn(item) : item));
}

export function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function countSets(template: Template): number {
  return template.phases.reduce(
    (sum, phase) => sum + phase.items.reduce((s, item) => s + item.sets.length, 0),
    0,
  );
}

export function countExercises(template: Template): number {
  return template.phases.reduce((sum, phase) => sum + phase.items.length, 0);
}

/** Estimation grossière de la durée d'un modèle, pour l'afficher dans la liste. */
export function estimateDurationSec(template: Template, defaultRestSec: number): number {
  let total = 0;
  for (const phase of template.phases) {
    for (const item of phase.items) {
      for (const set of item.sets) {
        total += set.durationSec ?? (set.reps ?? 10) * 4;
        total += set.restSec ?? item.restSec ?? defaultRestSec;
      }
      total += 45; // installation / changement d'exercice
    }
  }
  return total;
}
