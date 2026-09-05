import type { Session, SessionSet } from '@/types';
import { weekKey } from './format';

/** 1RM estimée (formule d'Epley), plafonnée : au-delà de 12 reps c'est du bruit. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) return weight * (1 + 12 / 30);
  return weight * (1 + reps / 30);
}

export function setVolume(set: SessionSet): number {
  if (!set.done || set.kind === 'warmup') return 0;
  return (set.weight ?? 0) * (set.reps ?? 0);
}

export interface ExerciseSessionEntry {
  sessionId: string;
  date: string;
  bestWeight: number;
  bestReps: number;
  best1RM: number;
  volume: number;
  sets: number;
  totalReps: number;
  totalDurationSec: number;
}

export interface ExerciseStats {
  exerciseId: string;
  name: string;
  entries: ExerciseSessionEntry[];
  lastPerformed: string;
  totalSets: number;
  totalVolume: number;
  prWeight: number;
  prReps: number;
  pr1RM: number;
}

/** Historique par exercice, à partir des séances terminées. */
export function buildExerciseStats(sessions: Session[]): Map<string, ExerciseStats> {
  const stats = new Map<string, ExerciseStats>();
  const done = sessions
    .filter((s) => s.status === 'done')
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  for (const session of done) {
    for (const phase of session.phases) {
      for (const item of phase.items) {
        const performed = item.sets.filter((s) => s.done && s.kind !== 'warmup');
        if (performed.length === 0) continue;

        let entry: ExerciseSessionEntry = {
          sessionId: session.id,
          date: session.startedAt,
          bestWeight: 0,
          bestReps: 0,
          best1RM: 0,
          volume: 0,
          sets: 0,
          totalReps: 0,
          totalDurationSec: 0,
        };

        for (const set of performed) {
          const weight = set.weight ?? 0;
          const reps = set.reps ?? 0;
          entry = {
            ...entry,
            sets: entry.sets + 1,
            volume: entry.volume + weight * reps,
            totalReps: entry.totalReps + reps,
            totalDurationSec: entry.totalDurationSec + (set.durationSec ?? 0),
            bestWeight: Math.max(entry.bestWeight, weight),
            bestReps: Math.max(entry.bestReps, reps),
            best1RM: Math.max(entry.best1RM, estimate1RM(weight, reps)),
          };
        }

        const current = stats.get(item.exerciseId) ?? {
          exerciseId: item.exerciseId,
          name: item.name,
          entries: [],
          lastPerformed: session.startedAt,
          totalSets: 0,
          totalVolume: 0,
          prWeight: 0,
          prReps: 0,
          pr1RM: 0,
        };

        current.entries.push(entry);
        current.name = item.name;
        current.lastPerformed = session.startedAt;
        current.totalSets += entry.sets;
        current.totalVolume += entry.volume;
        current.prWeight = Math.max(current.prWeight, entry.bestWeight);
        current.prReps = Math.max(current.prReps, entry.bestReps);
        current.pr1RM = Math.max(current.pr1RM, entry.best1RM);
        stats.set(item.exerciseId, current);
      }
    }
  }
  return stats;
}

export interface WeekSummary {
  key: string;
  label: string;
  start: Date;
  sessions: number;
  volume: number;
  sets: number;
  durationSec: number;
}

/** Résumé des `weeks` dernières semaines, la plus ancienne d'abord. */
export function buildWeeklySummary(sessions: Session[], weeks = 12): WeekSummary[] {
  const buckets = new Map<string, WeekSummary>();
  const now = new Date();
  const monday = (d: Date) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
    return copy;
  };

  for (let i = weeks - 1; i >= 0; i--) {
    const start = monday(new Date(now.getTime() - i * 7 * 86_400_000));
    const key = weekKey(start.toISOString());
    buckets.set(key, {
      key,
      label: `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`,
      start,
      sessions: 0,
      volume: 0,
      sets: 0,
      durationSec: 0,
    });
  }

  for (const session of sessions) {
    if (session.status !== 'done') continue;
    const bucket = buckets.get(weekKey(session.startedAt));
    if (!bucket) continue;
    bucket.sessions += 1;
    for (const phase of session.phases) {
      for (const item of phase.items) {
        for (const set of item.sets) {
          if (!set.done) continue;
          bucket.sets += 1;
          bucket.volume += setVolume(set);
        }
      }
    }
    if (session.endedAt) {
      bucket.durationSec +=
        (new Date(session.endedAt).getTime() -
          new Date(session.startedAt).getTime() -
          session.pausedMs) /
        1000;
    }
  }

  return [...buckets.values()];
}

/** Répartition des séries par groupe musculaire sur une période donnée. */
export function muscleGroupBreakdown(
  sessions: Session[],
  groupsOf: (exerciseId: string) => string[],
  sinceDays = 30,
): Map<string, number> {
  const since = Date.now() - sinceDays * 86_400_000;
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (session.status !== 'done') continue;
    if (new Date(session.startedAt).getTime() < since) continue;
    for (const phase of session.phases) {
      for (const item of phase.items) {
        const performed = item.sets.filter((s) => s.done && s.kind !== 'warmup').length;
        if (!performed) continue;
        for (const group of groupsOf(item.exerciseId)) {
          counts.set(group, (counts.get(group) ?? 0) + performed);
        }
      }
    }
  }
  return counts;
}

export interface Streak {
  currentWeeks: number;
  thisWeekSessions: number;
  last30Days: number;
}

export function activitySummary(sessions: Session[]): Streak {
  const done = sessions.filter((s) => s.status === 'done');
  const thisWeek = weekKey(new Date().toISOString());
  const weeks = new Set(done.map((s) => weekKey(s.startedAt)));

  let currentWeeks = 0;
  for (let i = 0; i < 104; i++) {
    const key = weekKey(new Date(Date.now() - i * 7 * 86_400_000).toISOString());
    if (weeks.has(key)) currentWeeks += 1;
    else if (i > 0) break;
  }

  return {
    currentWeeks,
    thisWeekSessions: done.filter((s) => weekKey(s.startedAt) === thisWeek).length,
    last30Days: done.filter(
      (s) => new Date(s.startedAt).getTime() > Date.now() - 30 * 86_400_000,
    ).length,
  };
}
