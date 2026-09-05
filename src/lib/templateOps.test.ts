import { describe, expect, it } from 'vitest';
import {
  countExercises,
  countSets,
  estimateDurationSec,
  guessTracking,
  mapById,
  move,
  newPlannedExercise,
  newTemplate,
} from './templateOps';
import type { CatalogExercise } from '@/data/catalog';

function exercise(patch: Partial<CatalogExercise> = {}): CatalogExercise {
  return {
    id: 'Barbell_Squat',
    name: 'Squat à la barre',
    category: 'strength',
    level: 'beginner',
    force: 'push',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: [],
    instructions: [],
    images: [],
    isCustom: false,
    ...patch,
  };
}

describe('guessTracking', () => {
  it('suit la durée pour le cardio et les étirements', () => {
    expect(guessTracking(exercise({ category: 'cardio' }))).toBe('time');
    expect(guessTracking(exercise({ category: 'stretching' }))).toBe('time');
  });

  it('suit les répétitions au poids du corps', () => {
    expect(guessTracking(exercise({ equipment: 'body only' }))).toBe('reps');
  });

  it('suit la charge dès qu’il y a du matériel', () => {
    expect(guessTracking(exercise())).toBe('weight');
  });
});

describe('newPlannedExercise', () => {
  it('crée le nombre de séries demandé, pré-remplies', () => {
    const item = newPlannedExercise(exercise(), 4);
    expect(item.sets).toHaveLength(4);
    expect(item.sets.every((s) => s.reps === 10)).toBe(true);
  });

  it('passe en durée pour un exercice de cardio', () => {
    const item = newPlannedExercise(exercise({ category: 'cardio' }), 1);
    expect(item.tracking).toBe('time');
    expect(item.sets[0].durationSec).toBe(60);
  });
});

describe('move', () => {
  it('déplace un élément', () => {
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('ignore les positions hors limites', () => {
    const items = ['a', 'b'];
    expect(move(items, 0, -1)).toBe(items);
    expect(move(items, 0, 5)).toBe(items);
  });
});

describe('mapById', () => {
  it('ne remplace que l’élément visé', () => {
    const items = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];
    const result = mapById(items, 'b', (item) => ({ ...item, n: 9 }));
    expect(result).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 9 }]);
    expect(result[0]).toBe(items[0]);
  });
});

describe('comptages et estimation', () => {
  const template = newTemplate({
    phases: [
      {
        id: 'p1',
        kind: 'main',
        name: 'Corps de séance',
        items: [newPlannedExercise(exercise(), 3), newPlannedExercise(exercise(), 2)],
      },
    ],
  });

  it('compte exercices et séries', () => {
    expect(countExercises(template)).toBe(2);
    expect(countSets(template)).toBe(5);
  });

  it('estime une durée croissante avec le repos', () => {
    const court = estimateDurationSec(template, 60);
    const long = estimateDurationSec(template, 120);
    expect(long).toBeGreaterThan(court);
    expect(court).toBeGreaterThan(0);
  });
});
