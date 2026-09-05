import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { EmptyState, Sheet, useToast } from '@/components/ui';
import { useActiveSession, useSessions, useSettings, useTemplates } from '@/store/selectors';
import { useStore } from '@/store/store';
import { freeSession, sessionFromTemplate, sessionDurationSec } from '@/lib/sessionOps';
import { activitySummary, setVolume } from '@/lib/stats';
import {
  formatClock,
  formatDuration,
  formatNumber,
  formatRelativeDay,
} from '@/lib/format';
import { countExercises, estimateDurationSec } from '@/lib/templateOps';
import { SPORT_FR } from '@/data/labels';
import { useNow } from '@/lib/useNow';

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const templates = useTemplates();
  const sessions = useSessions();
  const settings = useSettings();
  const active = useActiveSession();
  const startSession = useStore((s) => s.startSession);
  const [picking, setPicking] = useState(false);
  useNow(active ? 1000 : null);

  const summary = useMemo(() => activitySummary(sessions), [sessions]);
  const recent = useMemo(
    () => sessions.filter((s) => s.status === 'done').slice(0, 4),
    [sessions],
  );
  const weekVolume = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000;
    let volume = 0;
    for (const session of sessions) {
      if (session.status !== 'done') continue;
      if (new Date(session.startedAt).getTime() < since) continue;
      for (const phase of session.phases)
        for (const item of phase.items) for (const set of item.sets) volume += setVolume(set);
    }
    return volume;
  }, [sessions]);

  const suggested = useMemo(
    () => [...templates].sort((a, b) => b.timesUsed - a.timesUsed).slice(0, 4),
    [templates],
  );

  const start = (templateId?: string) => {
    if (active) {
      toast('Une séance est déjà en cours.', 'danger');
      navigate('/seance');
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    startSession(template ? sessionFromTemplate(template) : freeSession());
    setPicking(false);
    navigate('/seance');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <Screen
      title={greeting}
      subtitle={
        summary.thisWeekSessions > 0
          ? `${summary.thisWeekSessions} séance${summary.thisWeekSessions > 1 ? 's' : ''} cette semaine`
          : 'Prêt pour la prochaine séance ?'
      }
      actions={
        <button className="btn-icon" onClick={() => navigate('/historique')} aria-label="Historique">
          <Icon name="calendar" />
        </button>
      }
    >
      {active ? (
        <div className="card">
          <div className="row-between">
            <div>
              <span className="badge live">En cours</span>
              <h2 style={{ marginTop: 6 }}>{active.name}</h2>
            </div>
            <span className="mono strong">{formatClock(sessionDurationSec(active))}</span>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/seance')}>
            <Icon name="play" filled size={18} /> Reprendre la séance
          </button>
        </div>
      ) : (
        <div className="card">
          <h2>Démarrer une séance</h2>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => setPicking(true)}>
              <Icon name="templates" size={18} /> Depuis un modèle
            </button>
            <button className="btn" onClick={() => start()}>
              <Icon name="plus" size={18} /> Séance libre
            </button>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <span className="value">{summary.last30Days}</span>
          <span className="label muted">séances / 30 j</span>
        </div>
        <div className="stat">
          <span className="value">{formatNumber(weekVolume)}</span>
          <span className="label muted">kg soulevés / 7 j</span>
        </div>
        <div className="stat">
          <span className="value">{summary.currentWeeks}</span>
          <span className="label muted">semaines d'affilée</span>
        </div>
      </div>

      {suggested.length > 0 && (
        <>
          <div className="section-title">
            <h2>Vos modèles</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/modeles')}>
              Tout voir
            </button>
          </div>
          <div className="list">
            {suggested.map((template) => (
              <div key={template.id} className="card tight">
                <div className="row-between">
                  <div className="grow">
                    <div className="strong nowrap">{template.name}</div>
                    <div className="tiny muted">
                      {SPORT_FR[template.sport]} · {countExercises(template)} exercices ·{' '}
                      ~{formatDuration(estimateDurationSec(template, settings.defaultRestSec))}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => start(template.id)}>
                    <Icon name="play" filled size={14} /> Go
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">
        <h2>Dernières séances</h2>
      </div>
      {recent.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="Aucune séance enregistrée"
          message="Lancez votre première séance : elle apparaîtra ici."
        />
      ) : (
        <div className="list">
          {recent.map((session) => (
            <button
              key={session.id}
              className="card tight card-link"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => navigate(`/historique/${session.id}`)}
            >
              <div className="row-between">
                <div className="grow">
                  <div className="strong nowrap">{session.name}</div>
                  <div className="tiny muted">
                    {formatRelativeDay(session.startedAt)} ·{' '}
                    {formatDuration(sessionDurationSec(session))}
                  </div>
                </div>
                <Icon name="chevron" size={16} />
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={picking} title="Choisir un modèle" onClose={() => setPicking(false)}>
        {templates.length === 0 ? (
          <EmptyState
            icon="templates"
            title="Aucun modèle"
            message="Créez un modèle depuis l'onglet Modèles."
          />
        ) : (
          <div className="list">
            {templates.map((template) => (
              <button
                key={template.id}
                className="exercise-row"
                onClick={() => start(template.id)}
              >
                <span className="grow">
                  <span className="strong small nowrap" style={{ display: 'block' }}>
                    {template.name}
                  </span>
                  <span className="tiny muted">
                    {countExercises(template)} exercices ·{' '}
                    ~{formatDuration(estimateDurationSec(template, settings.defaultRestSec))}
                  </span>
                </span>
                <Icon name="play" filled size={16} />
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
