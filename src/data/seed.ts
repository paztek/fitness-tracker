import { uid } from '@/lib/id';
import type { Phase, PhaseKind, PlannedExercise, PlannedSet, Template, TrackingMode } from '@/types';
import { FRENCH_NAMES } from './frenchNames';
import { PHASE_FR } from './labels';

/** Modèles fournis au premier lancement, pour ne pas démarrer sur une page vide. */

function reps(count: number, value: number, restSec: number): PlannedSet[] {
  return Array.from({ length: count }, () => ({
    id: uid('s'),
    kind: 'normal' as const,
    reps: value,
    restSec,
  }));
}

function timed(count: number, durationSec: number, restSec = 0): PlannedSet[] {
  return Array.from({ length: count }, () => ({
    id: uid('s'),
    kind: 'normal' as const,
    durationSec,
    restSec,
  }));
}

function item(
  exerciseId: string,
  name: string,
  sets: PlannedSet[],
  tracking: TrackingMode = 'weight',
  notes?: string,
): PlannedExercise {
  return {
    id: uid('e'),
    exerciseId,
    // Le nom affiché est dénormalisé : on prend la traduction quand elle existe.
    name: FRENCH_NAMES[exerciseId] ?? name,
    tracking,
    sets,
    notes,
  };
}

function phase(kind: PhaseKind, items: PlannedExercise[], name?: string): Phase {
  return { id: uid('p'), kind, name: name ?? PHASE_FR[kind], items };
}

function template(
  name: string,
  description: string,
  tags: string[],
  phases: Phase[],
): Template {
  const now = new Date().toISOString();
  return {
    id: uid('t'),
    name,
    description,
    sport: 'muscu',
    tags,
    phases,
    createdAt: now,
    updatedAt: now,
    timesUsed: 0,
  };
}

export function seedTemplates(): Template[] {
  return [
    template(
      'Push — Pecs / Épaules / Triceps',
      'Séance de poussée, 3 exercices lourds puis 2 en isolation.',
      ['push', 'haut du corps'],
      [
        phase('warmup', [
          item('Rowing_Stationary', 'Rowing, Stationary', timed(1, 300), 'time', 'Rythme facile'),
          item('Pushups', 'Pushups', reps(2, 12, 45), 'reps'),
        ]),
        phase('main', [
          item('Barbell_Bench_Press_-_Medium_Grip', 'Barbell Bench Press - Medium Grip', reps(4, 8, 150)),
          item('Barbell_Incline_Bench_Press_-_Medium_Grip', 'Barbell Incline Bench Press - Medium Grip', reps(3, 10, 120)),
          item('Dumbbell_Shoulder_Press', 'Dumbbell Shoulder Press', reps(3, 10, 120)),
          item('Side_Lateral_Raise', 'Side Lateral Raise', reps(3, 15, 60)),
          item('Triceps_Pushdown_-_Rope_Attachment', 'Triceps Pushdown - Rope Attachment', reps(3, 12, 60)),
        ]),
        phase('cooldown', [
          item('Behind_Head_Chest_Stretch', 'Behind Head Chest Stretch', timed(2, 45), 'time'),
        ]),
      ],
    ),
    template(
      'Pull — Dos / Biceps',
      'Séance de tirage : vertical, horizontal, puis bras.',
      ['pull', 'haut du corps'],
      [
        phase('warmup', [
          item('Bicycling_Stationary', 'Bicycling, Stationary', timed(1, 300), 'time'),
          item('Face_Pull', 'Face Pull', reps(2, 15, 45)),
        ]),
        phase('main', [
          item('Pullups', 'Pullups', reps(4, 8, 150), 'reps', 'Ajouter du lest si > 10 reps'),
          item('Bent_Over_Barbell_Row', 'Bent Over Barbell Row', reps(4, 10, 120)),
          item('Seated_Cable_Rows', 'Seated Cable Rows', reps(3, 12, 90)),
          item('Dumbbell_Bicep_Curl', 'Dumbbell Bicep Curl', reps(3, 12, 60)),
          item('Hammer_Curls', 'Hammer Curls', reps(3, 12, 60)),
        ]),
        phase('cooldown', [item('Cat_Stretch', 'Cat Stretch', timed(2, 45), 'time')]),
      ],
    ),
    template(
      'Legs — Jambes / Fessiers',
      'Squat lourd, chaîne postérieure, puis mollets et gainage.',
      ['legs', 'bas du corps'],
      [
        phase('warmup', [
          item('Jogging_Treadmill', 'Jogging, Treadmill', timed(1, 300), 'time'),
          item('Bodyweight_Squat', 'Bodyweight Squat', reps(2, 15, 45), 'reps'),
        ]),
        phase('main', [
          item('Barbell_Squat', 'Barbell Squat', reps(5, 5, 180)),
          item('Romanian_Deadlift', 'Romanian Deadlift', reps(3, 10, 150)),
          item('Leg_Press', 'Leg Press', reps(3, 12, 120)),
          item('Lying_Leg_Curls', 'Lying Leg Curls', reps(3, 12, 90)),
          item('Standing_Calf_Raises', 'Standing Calf Raises', reps(4, 15, 60)),
        ]),
        phase('cooldown', [
          item('Plank', 'Plank', timed(3, 45, 30), 'time'),
          item('Childs_Pose', "Child's Pose", timed(1, 60), 'time'),
        ]),
      ],
    ),
  ];
}
