import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, Sheet, useToast } from '@/components/ui';
import { useSession, useSettings } from '@/store/selectors';
import { useStore } from '@/store/store';
import {
  doneSetsCount,
  sessionDurationSec,
  sessionVolumeKg,
  templateFromSession,
} from '@/lib/sessionOps';
import { uid } from '@/lib/id';
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatTime,
  kgToDisplay,
  round,
} from '@/lib/format';
import { PHASE_FR, SET_KIND_FR } from '@/data/labels';
import { estimate1RM } from '@/lib/stats';
import type { Session } from '@/types';

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const session = useSession(id);
  const settings = useSettings();
  const deleteSession = useStore((s) => s.deleteSession);
  const saveTemplate = useStore((s) => s.saveTemplate);
  const startSession = useStore((s) => s.startSession);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!session) {
    return (
      <Screen title="Séance introuvable" back="/historique">
        <p className="muted">Cette séance n'existe plus.</p>
      </Screen>
    );
  }

  const repeat = () => {
    if (activeSessionId) {
      toast('Une séance est déjà en cours.', 'danger');
      navigate('/seance');
      return;
    }
    const copy: Session = {
      ...structuredClone(session),
      id: uid('w'),
      status: 'active',
      startedAt: new Date().toISOString(),
      endedAt: undefined,
      pausedMs: 0,
      notes: undefined,
      phases: session.phases.map((phase) => ({
        ...phase,
        id: uid('sp'),
        items: phase.items.map((item) => ({
          ...item,
          id: uid('se'),
          sets: item.sets.map((set) => ({
            ...set,
            id: uid('ss'),
            done: false,
            completedAt: undefined,
            targetReps: set.reps ?? set.targetReps,
            targetWeight: set.weight ?? set.targetWeight,
          })),
        })),
      })),
    };
    startSession(copy);
    navigate('/seance');
  };

  const volume = sessionVolumeKg(session);

  return (
    <Screen
      title={session.name}
      subtitle={`${formatDate(session.startedAt)} · ${formatTime(session.startedAt)}`}
      back="/historique"
      actions={
        <button className="btn-icon" aria-label="Options" onClick={() => setMenu(true)}>
          <Icon name="more" />
        </button>
      }
    >
      <div className="stat-grid">
        <div className="stat">
          <span className="value">{formatDuration(sessionDurationSec(session))}</span>
          <span className="label muted">durée</span>
        </div>
        <div className="stat">
          <span className="value">{doneSetsCount(session)}</span>
          <span className="label muted">séries</span>
        </div>
        <div className="stat">
          <span className="value">{formatNumber(kgToDisplay(volume, settings.units))}</span>
          <span className="label muted">{settings.units} soulevés</span>
        </div>
      </div>

      {session.notes && (
        <div className="card tight">
          <span className="tiny muted">Notes</span>
          <p className="small" style={{ margin: 0 }}>
            {session.notes}
          </p>
        </div>
      )}

      {session.phases
        .filter((phase) => phase.items.length > 0)
        .map((phase) => (
          <div key={phase.id} className="list">
            <div className="section-title">
              <h2>
                <span className={`badge ${phase.kind}`}>{phase.name || PHASE_FR[phase.kind]}</span>
              </h2>
            </div>
            {phase.items.map((item) => (
              <div key={item.id} className="card tight">
                <button
                  className="row-between"
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/exercices/${encodeURIComponent(item.exerciseId)}`)}
                >
                  <span className="strong small grow nowrap" style={{ textAlign: 'left' }}>
                    {item.name}
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
                <div className="list" style={{ gap: 2 }}>
                  {item.sets.map((set, index) => (
                    <div key={set.id} className="row small">
                      <span className={`set-index ${set.kind}`}>
                        {set.kind === 'warmup' ? 'É' : index + 1}
                      </span>
                      <span className="grow mono">
                        {item.tracking === 'time'
                          ? formatDuration(set.durationSec ?? 0)
                          : item.tracking === 'distance'
                            ? `${formatNumber(set.distanceM ?? 0)} m`
                            : set.weight
                              ? `${round(kgToDisplay(set.weight, settings.units), 1)} ${settings.units} × ${set.reps ?? 0}`
                              : `${set.reps ?? 0} reps`}
                      </span>
                      {set.weight && set.reps ? (
                        <span className="tiny muted mono">
                          ~{round(kgToDisplay(estimate1RM(set.weight, set.reps), settings.units), 1)}{' '}
                          {settings.units} 1RM
                        </span>
                      ) : (
                        <span className="tiny muted">{SET_KIND_FR[set.kind]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

      <Sheet open={menu} title={session.name} onClose={() => setMenu(false)}>
        <div className="list">
          <button
            className="btn btn-block"
            onClick={() => {
              setMenu(false);
              repeat();
            }}
          >
            <Icon name="play" size={18} /> Refaire cette séance
          </button>
          <button
            className="btn btn-block"
            onClick={() => {
              saveTemplate(templateFromSession(session, session.name));
              setMenu(false);
              toast('Modèle créé depuis cette séance.');
            }}
          >
            <Icon name="templates" size={18} /> Enregistrer comme modèle
          </button>
          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              setMenu(false);
              setConfirmDelete(true);
            }}
          >
            <Icon name="trash" size={18} /> Supprimer la séance
          </button>
        </div>
      </Sheet>

      <Confirm
        open={confirmDelete}
        title="Supprimer cette séance ?"
        message="Elle disparaîtra de l'historique et des statistiques."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteSession(session.id);
          toast('Séance supprimée.');
          navigate('/historique');
        }}
      />
    </Screen>
  );
}
