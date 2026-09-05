import { uid } from './id';
import type {
  PlannedExercise,
  Session,
  SessionExercise,
  SessionPhase,
  SessionSet,
  SetKind,
  Sport,
  Template,
  TrackingMode,
} from '@/types';
import { PHASE_FR } from '@/data/labels';

function toSessionSet(
  set: PlannedExercise['sets'][number],
  fallbackRest?: number,
): SessionSet {
  return {
    id: uid('ss'),
    kind: set.kind,
    targetReps: set.reps,
    targetWeight: set.weight,
    targetDurationSec: set.durationSec,
    targetDistanceM: set.distanceM,
    // Les cibles pré-remplissent la saisie : on ne tape que ce qui change.
    reps: set.reps,
    weight: set.weight,
    durationSec: set.durationSec,
    distanceM: set.distanceM,
    restSec: set.restSec ?? fallbackRest,
    done: false,
  };
}

export function newSessionSet(
  tracking: TrackingMode,
  kind: SetKind = 'normal',
  previous?: SessionSet,
): SessionSet {
  return {
    id: uid('ss'),
    kind,
    reps: previous?.reps ?? (tracking === 'time' ? undefined : 10),
    weight: previous?.weight,
    durationSec: previous?.durationSec ?? (tracking === 'time' ? 60 : undefined),
    distanceM: previous?.distanceM,
    targetReps: previous?.targetReps,
    targetWeight: previous?.targetWeight,
    restSec: previous?.restSec,
    done: false,
  };
}

export function toSessionExercise(item: PlannedExercise): SessionExercise {
  return {
    id: uid('se'),
    exerciseId: item.exerciseId,
    name: item.name,
    tracking: item.tracking,
    notes: item.notes,
    restSec: item.restSec,
    sets: item.sets.map((s) => toSessionSet(s, item.restSec)),
  };
}

export function sessionFromTemplate(template: Template): Session {
  return {
    id: uid('w'),
    name: template.name,
    sport: template.sport,
    templateId: template.id,
    templateName: template.name,
    status: 'active',
    startedAt: new Date().toISOString(),
    pausedMs: 0,
    phases: template.phases.map(
      (phase): SessionPhase => ({
        id: uid('sp'),
        kind: phase.kind,
        name: phase.name,
        notes: phase.notes,
        items: phase.items.map(toSessionExercise),
      }),
    ),
  };
}

export function freeSession(name = 'Séance libre', sport: Sport = 'muscu'): Session {
  return {
    id: uid('w'),
    name,
    sport,
    status: 'active',
    startedAt: new Date().toISOString(),
    pausedMs: 0,
    phases: [
      { id: uid('sp'), kind: 'warmup', name: PHASE_FR.warmup, items: [] },
      { id: uid('sp'), kind: 'main', name: PHASE_FR.main, items: [] },
    ],
  };
}

/** Convertit une séance terminée en modèle réutilisable. */
export function templateFromSession(session: Session, name: string): Template {
  const now = new Date().toISOString();
  return {
    id: uid('t'),
    name,
    description: `Créé depuis la séance du ${new Date(session.startedAt).toLocaleDateString('fr-FR')}`,
    sport: session.sport,
    tags: [],
    createdAt: now,
    updatedAt: now,
    timesUsed: 0,
    phases: session.phases.map((phase) => ({
      id: uid('p'),
      kind: phase.kind,
      name: phase.name,
      notes: phase.notes,
      items: phase.items.map((item) => ({
        id: uid('e'),
        exerciseId: item.exerciseId,
        name: item.name,
        tracking: item.tracking,
        notes: item.notes,
        restSec: item.restSec,
        sets: item.sets.map((set) => ({
          id: uid('s'),
          kind: set.kind,
          reps: set.reps ?? set.targetReps,
          weight: set.weight ?? set.targetWeight,
          durationSec: set.durationSec,
          distanceM: set.distanceM,
          restSec: set.restSec,
        })),
      })),
    })),
  };
}

export function sessionDurationSec(session: Session): number {
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return Math.max(0, (end - new Date(session.startedAt).getTime() - session.pausedMs) / 1000);
}

export function allSets(session: Session): SessionSet[] {
  return session.phases.flatMap((p) => p.items.flatMap((i) => i.sets));
}

export function doneSetsCount(session: Session): number {
  return allSets(session).filter((s) => s.done).length;
}

export function totalSetsCount(session: Session): number {
  return allSets(session).length;
}

/** Volume soulevé (kg × reps), hors séries d'échauffement. */
export function sessionVolumeKg(session: Session): number {
  let volume = 0;
  for (const set of allSets(session)) {
    if (!set.done || set.kind === 'warmup') continue;
    if (set.weight && set.reps) volume += set.weight * set.reps;
  }
  return volume;
}

export function sessionExercises(session: Session): SessionExercise[] {
  return session.phases.flatMap((p) => p.items);
}
