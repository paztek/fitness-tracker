import { describe, expect, it } from 'vitest';
import { activitySummary, buildExerciseStats, buildWeeklySummary, estimate1RM, muscleGroupBreakdown } from './stats';
import type { Session, SessionSet } from '@/types';

function set(patch: Partial<SessionSet> = {}): SessionSet {
  return { id: `s${Math.random()}`, kind: 'normal', done: true, reps: 10, weight: 50, ...patch };
}

function session(patch: Partial<Session> = {}, sets: SessionSet[] = [set()]): Session {
  return {
    id: `w${Math.random()}`,
    name: 'Séance',
    sport: 'muscu',
    status: 'done',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    pausedMs: 0,
    phases: [
      {
        id: 'p1',
        kind: 'main',
        name: 'Corps de séance',
        items: [
          {
            id: 'i1',
            exerciseId: 'Barbell_Squat',
            name: 'Squat à la barre',
            tracking: 'weight',
            sets,
          },
        ],
      },
    ],
    ...patch,
  };
}

describe('estimate1RM', () => {
  it('rend la charge telle quelle à une répétition', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('applique la formule d’Epley', () => {
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it('plafonne au-delà de douze répétitions', () => {
    expect(estimate1RM(100, 20)).toBe(estimate1RM(100, 12));
  });

  it('rend zéro pour une saisie vide', () => {
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
  });
});

describe('buildExerciseStats', () => {
  it('ignore les séries non validées et les échauffements', () => {
    const stats = buildExerciseStats([
      session({}, [
        set({ weight: 40, reps: 10, kind: 'warmup' }),
        set({ weight: 100, reps: 5, done: false }),
        set({ weight: 60, reps: 8 }),
      ]),
    ]);
    const squat = stats.get('Barbell_Squat')!;
    expect(squat.totalSets).toBe(1);
    expect(squat.prWeight).toBe(60);
    expect(squat.totalVolume).toBe(480);
  });

  it('ignore les séances en cours', () => {
    const stats = buildExerciseStats([session({ status: 'active', endedAt: undefined })]);
    expect(stats.size).toBe(0);
  });

  it('garde les records sur plusieurs séances, dans l’ordre chronologique', () => {
    const stats = buildExerciseStats([
      session({ startedAt: '2026-02-01T10:00:00.000Z' }, [set({ weight: 80, reps: 5 })]),
      session({ startedAt: '2026-01-01T10:00:00.000Z' }, [set({ weight: 100, reps: 3 })]),
    ]);
    const squat = stats.get('Barbell_Squat')!;
    expect(squat.entries.map((e) => e.bestWeight)).toEqual([100, 80]);
    expect(squat.prWeight).toBe(100);
    expect(squat.lastPerformed).toBe('2026-02-01T10:00:00.000Z');
  });
});

describe('buildWeeklySummary', () => {
  it('agrège le volume de la semaine en cours', () => {
    const weeks = buildWeeklySummary([session({}, [set({ weight: 50, reps: 10 })])], 4);
    expect(weeks).toHaveLength(4);
    expect(weeks.at(-1)!.volume).toBe(500);
    expect(weeks.at(-1)!.sessions).toBe(1);
  });

  it('laisse les semaines sans séance à zéro', () => {
    const weeks = buildWeeklySummary([], 3);
    expect(weeks.every((w) => w.volume === 0 && w.sessions === 0)).toBe(true);
  });
});

describe('muscleGroupBreakdown', () => {
  it('compte les séries par groupe musculaire', () => {
    const counts = muscleGroupBreakdown(
      [session({}, [set(), set(), set({ kind: 'warmup' })])],
      () => ['legs'],
      30,
    );
    expect(counts.get('legs')).toBe(2);
  });

  it('exclut les séances hors période', () => {
    const vieille = session({ startedAt: '2020-01-01T10:00:00.000Z' });
    expect(muscleGroupBreakdown([vieille], () => ['legs'], 30).size).toBe(0);
  });
});

describe('activitySummary', () => {
  it('compte les séances récentes', () => {
    const summary = activitySummary([session(), session()]);
    expect(summary.last30Days).toBe(2);
    expect(summary.thisWeekSessions).toBe(2);
    expect(summary.currentWeeks).toBe(1);
  });
});
