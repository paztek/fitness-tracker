import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { EmptyState, SearchInput } from '@/components/ui';
import { useSessions } from '@/store/selectors';
import { sessionDurationSec, sessionVolumeKg, doneSetsCount } from '@/lib/sessionOps';
import {
  capitalize,
  formatDuration,
  formatNumber,
  formatRelativeDay,
  plural,
} from '@/lib/format';
import { normalize } from '@/lib/search';
import type { Session } from '@/types';

const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export function HistoryPage() {
  const navigate = useNavigate();
  const sessions = useSessions();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = normalize(query);
    const done = sessions
      .filter((s) => s.status === 'done')
      .filter((s) => !q || normalize(`${s.name} ${s.notes ?? ''}`).includes(q))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    const byMonth = new Map<string, Session[]>();
    for (const session of done) {
      const key = capitalize(monthFmt.format(new Date(session.startedAt)));
      byMonth.set(key, [...(byMonth.get(key) ?? []), session]);
    }
    return [...byMonth.entries()];
  }, [sessions, query]);

  const totalDone = sessions.filter((s) => s.status === 'done').length;

  return (
    <Screen
      title="Historique"
      subtitle={`${plural(totalDone, 'séance')} enregistrée${totalDone > 1 ? 's' : ''}`}
      back="/"
    >
      {totalDone > 5 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une séance…" />
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Rien pour l'instant"
          message="Vos séances terminées s'afficheront ici, avec leur volume et leur durée."
        />
      ) : (
        groups.map(([month, list]) => (
          <div key={month} className="list">
            <div className="section-title">
              <h2>{month}</h2>
              <span className="tiny muted">{list.length}</span>
            </div>
            {list.map((session) => (
              <button
                key={session.id}
                className="card tight"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => navigate(`/historique/${session.id}`)}
              >
                <div className="row-between">
                  <div className="grow">
                    <div className="strong nowrap">{session.name}</div>
                    <div className="tiny muted">
                      {formatRelativeDay(session.startedAt)} ·{' '}
                      {formatDuration(sessionDurationSec(session))} · {doneSetsCount(session)} séries
                      {sessionVolumeKg(session) > 0 &&
                        ` · ${formatNumber(sessionVolumeKg(session))} kg`}
                    </div>
                  </div>
                  <Icon name="chevron" size={16} />
                </div>
              </button>
            ))}
          </div>
        ))
      )}
    </Screen>
  );
}
