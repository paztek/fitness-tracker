import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { BarChart, BarList } from '@/components/Charts';
import { EmptyState, SearchInput } from '@/components/ui';
import { Icon } from '@/components/icons';
import { useExerciseIndex, useSessions } from '@/store/selectors';
import {
  activitySummary,
  buildExerciseStats,
  buildWeeklySummary,
  muscleGroupBreakdown,
} from '@/lib/stats';
import {
  formatDuration,
  formatNumber,
  formatRelativeDay,
  formatWeight,
  round,
} from '@/lib/format';
import { MUSCLE_GROUPS } from '@/data/labels';
import { normalize } from '@/lib/search';
import { sessionDurationSec } from '@/lib/sessionOps';

export function ProgressPage() {
  const navigate = useNavigate();
  const sessions = useSessions();
  const { byId } = useExerciseIndex();
  const [query, setQuery] = useState('');

  const done = useMemo(() => sessions.filter((s) => s.status === 'done'), [sessions]);
  const summary = useMemo(() => activitySummary(sessions), [sessions]);
  const weeks = useMemo(() => buildWeeklySummary(sessions, 12), [sessions]);
  const stats = useMemo(() => buildExerciseStats(sessions), [sessions]);

  const groups = useMemo(() => {
    const counts = muscleGroupBreakdown(
      sessions,
      (exerciseId) => byId.get(exerciseId)?.groups ?? [],
      30,
    );
    return MUSCLE_GROUPS.map((group) => ({
      label: group.label,
      value: counts.get(group.id) ?? 0,
    })).sort((a, b) => b.value - a.value);
  }, [sessions, byId]);

  const exerciseRows = useMemo(() => {
    const q = normalize(query);
    return [...stats.values()]
      .filter((s) => !q || normalize(s.name).includes(q))
      .sort((a, b) => b.lastPerformed.localeCompare(a.lastPerformed));
  }, [stats, query]);

  const last30 = useMemo(() => {
    const since = Date.now() - 30 * 86_400_000;
    const recent = done.filter((s) => new Date(s.startedAt).getTime() > since);
    const volume = recent.reduce(
      (sum, session) =>
        sum +
        session.phases.reduce(
          (s, phase) =>
            s +
            phase.items.reduce(
              (v, item) =>
                v +
                item.sets.reduce(
                  (x, set) =>
                    x + (set.done && set.kind !== 'warmup' ? (set.weight ?? 0) * (set.reps ?? 0) : 0),
                  0,
                ),
              0,
            ),
          0,
        ),
      0,
    );
    const duration = recent.reduce((sum, session) => sum + sessionDurationSec(session), 0);
    return { count: recent.length, volume, avgDuration: recent.length ? duration / recent.length : 0 };
  }, [done]);

  if (done.length === 0) {
    return (
      <Screen title="Progression">
        <EmptyState
          icon="progress"
          title="Pas encore de données"
          message="Terminez une première séance : records, volume et régularité s'afficheront ici."
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Progression"
      subtitle={`${done.length} séance${done.length > 1 ? 's' : ''} au total`}
    >
      <div className="stat-grid two">
        <div className="stat">
          <span className="value">{last30.count}</span>
          <span className="label muted">séances / 30 j</span>
        </div>
        <div className="stat">
          <span className="value">{formatNumber(last30.volume)}</span>
          <span className="label muted">kg / 30 j</span>
        </div>
        <div className="stat">
          <span className="value">{formatDuration(last30.avgDuration)}</span>
          <span className="label muted">durée moyenne</span>
        </div>
        <div className="stat">
          <span className="value">{summary.currentWeeks}</span>
          <span className="label muted">semaines d'affilée</span>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Volume par semaine</h2>
        </div>
        <BarChart
          points={weeks.map((week) => ({
            label: week.label,
            value: round(week.volume),
            hint: `Semaine du ${week.label} · ${week.sessions} séance${week.sessions > 1 ? 's' : ''}`,
          }))}
          format={(value) => `${formatNumber(value)} kg`}
        />
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Séries par groupe · 30 jours</h2>
        </div>
        <BarList rows={groups} format={(value) => `${value} séries`} />
      </div>

      <div className="section-title">
        <h2>Records par exercice</h2>
      </div>
      {stats.size > 6 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Filtrer un exercice…" />
      )}
      <div className="list">
        {exerciseRows.map((row) => (
          <button
            key={row.exerciseId}
            className="exercise-row"
            onClick={() => navigate(`/exercices/${encodeURIComponent(row.exerciseId)}`)}
          >
            <span className="grow">
              <span className="strong small nowrap" style={{ display: 'block' }}>
                {row.name}
              </span>
              <span className="tiny muted">
                {formatRelativeDay(row.lastPerformed)} · {row.totalSets} séries
              </span>
            </span>
            <span className="mono small" style={{ textAlign: 'right' }}>
              {row.prWeight > 0 ? (
                <>
                  {formatWeight(row.prWeight)}
                  <span className="tiny muted" style={{ display: 'block' }}>
                    1RM ~{round(row.pr1RM, 1)}
                  </span>
                </>
              ) : (
                <>
                  {row.prReps} reps
                  <span className="tiny muted" style={{ display: 'block' }}>
                    record
                  </span>
                </>
              )}
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
    </Screen>
  );
}
