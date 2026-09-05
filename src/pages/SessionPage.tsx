import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, NumberField, Sheet, useToast } from '@/components/ui';
import { ExercisePicker } from '@/components/ExercisePicker';
import { useActiveSession, useSettings } from '@/store/selectors';
import { useStore } from '@/store/store';
import {
  doneSetsCount,
  newSessionSet,
  sessionDurationSec,
  sessionVolumeKg,
  templateFromSession,
  toSessionExercise,
  totalSetsCount,
} from '@/lib/sessionOps';
import { guessTracking, mapById, newPlannedExercise } from '@/lib/templateOps';
import { buildExerciseStats } from '@/lib/stats';
import {
  displayToKg,
  formatClock,
  formatDuration,
  formatNumber,
  formatRelativeDay,
  kgToDisplay,
  round,
} from '@/lib/format';
import { PHASE_FR } from '@/data/labels';
import { beep, primeAudio, vibrate } from '@/lib/feedback';
import { useWakeLock } from '@/lib/useWakeLock';
import { useNow } from '@/lib/useNow';
import type { Session, SessionExercise, SessionPhase, SessionSet } from '@/types';

interface Rest {
  endsAt: number;
  total: number;
}

export function SessionPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const session = useActiveSession();
  const settings = useSettings();
  const sessions = useStore((s) => s.sessions);
  const updateSession = useStore((s) => s.updateSession);
  const finishSession = useStore((s) => s.finishSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const saveTemplate = useStore((s) => s.saveTemplate);

  const [rest, setRest] = useState<Rest | null>(null);
  const [pickerPhase, setPickerPhase] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<{ phaseId: string; item: SessionExercise } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [asTemplate, setAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const now = useNow(1000);
  useWakeLock(Boolean(session) && settings.keepAwake);

  // Historique des autres séances : sert à afficher « la dernière fois ».
  const history = useMemo(
    () => buildExerciseStats(sessions.filter((s) => s.id !== session?.id)),
    [sessions, session?.id],
  );

  useEffect(() => {
    if (!rest) return;
    if (now < rest.endsAt) return;
    setRest(null);
    if (settings.restSound) beep();
    if (settings.restVibration) vibrate();
  }, [now, rest, settings.restSound, settings.restVibration]);

  if (!session) {
    return (
      <Screen title="Séance" fullscreen back="/">
        <div className="card">
          <h2>Aucune séance en cours</h2>
          <p className="muted small">
            Démarrez une séance depuis l'accueil ou depuis un de vos modèles.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </Screen>
    );
  }

  const patch = (fn: (s: Session) => Session) => updateSession(session.id, fn);

  const updatePhase = (phaseId: string, fn: (phase: SessionPhase) => SessionPhase) =>
    patch((s) => ({ ...s, phases: mapById(s.phases, phaseId, fn) }));

  const updateItem = (
    phaseId: string,
    itemId: string,
    fn: (item: SessionExercise) => SessionExercise,
  ) => updatePhase(phaseId, (phase) => ({ ...phase, items: mapById(phase.items, itemId, fn) }));

  const updateSet = (
    phaseId: string,
    itemId: string,
    setId: string,
    changes: Partial<SessionSet>,
  ) =>
    updateItem(phaseId, itemId, (item) => ({
      ...item,
      sets: mapById(item.sets, setId, (set) => ({ ...set, ...changes })),
    }));

  const startRest = (seconds: number) => {
    primeAudio();
    setRest({ endsAt: Date.now() + seconds * 1000, total: seconds });
  };

  const toggleDone = (phaseId: string, item: SessionExercise, set: SessionSet) => {
    const done = !set.done;
    updateSet(phaseId, item.id, set.id, {
      done,
      completedAt: done ? new Date().toISOString() : undefined,
    });
    if (done && settings.restAutoStart) {
      const seconds = set.restSec ?? item.restSec ?? settings.defaultRestSec;
      if (seconds > 0) startRest(seconds);
    }
  };

  const done = doneSetsCount(session);
  const total = totalSetsCount(session);
  const volume = sessionVolumeKg(session);
  const duration = sessionDurationSec(session);

  const finish = () => {
    if (asTemplate) {
      const name = templateName.trim() || session.name;
      saveTemplate(templateFromSession(session, name));
      toast(`Modèle « ${name} » enregistré.`);
    }
    // Les séries non cochées ne sont pas comptabilisées : on les retire.
    patch((s) => ({
      ...s,
      phases: s.phases.map((phase) => ({
        ...phase,
        items: phase.items
          .map((item) => ({ ...item, sets: item.sets.filter((set) => set.done) }))
          .filter((item) => item.sets.length > 0),
      })),
    }));
    finishSession(session.id);
    setFinishing(false);
    navigate(`/historique/${session.id}`, { replace: true });
  };

  return (
    <Screen
      title={session.name}
      subtitle={`${done}/${total} séries · ${formatClock(duration)}`}
      back="/"
      fullscreen
      actions={
        <button className="btn btn-sm btn-primary" onClick={() => setFinishing(true)}>
          Terminer
        </button>
      }
    >
      <div className="progress" aria-label="Progression de la séance">
        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      {session.phases.map((phase) => (
        <div key={phase.id} className="list">
          <div className="section-title">
            <h2>
              <span className={`badge ${phase.kind}`}>{phase.name || PHASE_FR[phase.kind]}</span>
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setPickerPhase(phase.id)}>
              <Icon name="plus" size={16} /> Exercice
            </button>
          </div>

          {phase.items.length === 0 && (
            <button className="btn btn-block btn-sm" onClick={() => setPickerPhase(phase.id)}>
              <Icon name="plus" size={16} /> Ajouter un exercice
            </button>
          )}

          {phase.items.map((item) => {
            const stats = history.get(item.exerciseId);
            const last = stats?.entries.at(-1);
            return (
              <div key={item.id} className="card">
                <div className="row-between">
                  <button
                    className="grow"
                    style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => navigate(`/exercices/${encodeURIComponent(item.exerciseId)}`)}
                  >
                    <span className="strong nowrap" style={{ display: 'block' }}>
                      {item.name}
                    </span>
                    {last && (
                      <span className="tiny muted">
                        {formatRelativeDay(last.date)} :{' '}
                        {last.bestWeight > 0
                          ? `${round(kgToDisplay(last.bestWeight, settings.units), 1)} ${settings.units} × ${last.bestReps}`
                          : `${last.totalReps} reps`}
                      </span>
                    )}
                  </button>
                  <button
                    className="btn-icon small"
                    aria-label="Options de l'exercice"
                    onClick={() => setMenuFor({ phaseId: phase.id, item })}
                  >
                    <Icon name="more" size={18} />
                  </button>
                </div>

                {item.notes && <p className="tiny muted" style={{ margin: 0 }}>{item.notes}</p>}

                <div>
                  {item.sets.map((set, index) => (
                    <div
                      key={set.id}
                      className={`set-row ${item.tracking === 'weight' ? '' : 'time'} ${set.done ? 'is-done' : ''}`}
                    >
                      <span className={`set-index ${set.kind}`}>
                        {set.kind === 'warmup' ? 'É' : index + 1}
                      </span>

                      {item.tracking === 'time' ? (
                        <div className="cell">
                          <NumberField
                            value={set.durationSec}
                            onChange={(durationSec) =>
                              updateSet(phase.id, item.id, set.id, { durationSec })
                            }
                            step={15}
                            ariaLabel="Durée en secondes"
                            withButtons={false}
                          />
                          <span className="cell-hint">
                            {set.targetDurationSec
                              ? `cible ${formatDuration(set.targetDurationSec)}`
                              : 'secondes'}
                          </span>
                        </div>
                      ) : item.tracking === 'distance' ? (
                        <div className="cell">
                          <NumberField
                            value={set.distanceM}
                            onChange={(distanceM) =>
                              updateSet(phase.id, item.id, set.id, { distanceM })
                            }
                            step={100}
                            ariaLabel="Distance en mètres"
                            withButtons={false}
                          />
                          <span className="cell-hint">mètres</span>
                        </div>
                      ) : (
                        <>
                          <div className="cell">
                            <NumberField
                              value={set.reps}
                              onChange={(reps) => updateSet(phase.id, item.id, set.id, { reps })}
                              ariaLabel="Répétitions"
                              withButtons={false}
                            />
                            <span className="cell-hint">
                              {set.targetReps ? `cible ${set.targetReps}` : 'reps'}
                            </span>
                          </div>
                          {item.tracking === 'weight' && (
                            <div className="cell">
                              <NumberField
                                value={
                                  set.weight === undefined
                                    ? undefined
                                    : round(kgToDisplay(set.weight, settings.units), 1)
                                }
                                onChange={(value) =>
                                  updateSet(phase.id, item.id, set.id, {
                                    weight:
                                      value === undefined ? undefined : displayToKg(value, settings.units),
                                  })
                                }
                                step={settings.weightIncrement}
                                ariaLabel="Charge"
                                withButtons={false}
                              />
                              <span className="cell-hint">
                                {set.targetWeight
                                  ? `cible ${round(kgToDisplay(set.targetWeight, settings.units), 1)} ${settings.units}`
                                  : settings.units}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      <button
                        className={`check ${set.done ? 'done' : ''}`}
                        aria-label={set.done ? 'Annuler la série' : 'Valider la série'}
                        onClick={() => toggleDone(phase.id, item, set)}
                      >
                        <Icon name="check" size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="btn-row">
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      updateItem(phase.id, item.id, (current) => ({
                        ...current,
                        sets: [...current.sets, newSessionSet(current.tracking, 'normal', current.sets.at(-1))],
                      }))
                    }
                  >
                    <Icon name="plus" size={14} /> Série
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startRest(item.restSec ?? settings.defaultRestSec)}
                  >
                    <Icon name="timer" size={14} /> Repos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="card">
        <div className="field">
          <label htmlFor="session-notes">Notes de séance</label>
          <textarea
            id="session-notes"
            className="textarea"
            style={{ minHeight: 60 }}
            value={session.notes ?? ''}
            onChange={(e) => patch((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Sensations, douleurs, énergie…"
          />
        </div>
      </div>

      <button className="btn btn-danger btn-block" onClick={() => setConfirmDiscard(true)}>
        <Icon name="trash" size={18} /> Abandonner la séance
      </button>

      {rest && (
        <RestBar
          rest={rest}
          now={now}
          onAdd={(seconds) => setRest({ endsAt: rest.endsAt + seconds * 1000, total: rest.total + seconds })}
          onSkip={() => setRest(null)}
        />
      )}

      <ExercisePicker
        open={Boolean(pickerPhase)}
        onClose={() => setPickerPhase(null)}
        onPick={(exercise) => {
          if (!pickerPhase) return;
          const planned = newPlannedExercise(exercise, 3, {
            tracking: guessTracking(exercise),
            restSec: settings.defaultRestSec,
          });
          updatePhase(pickerPhase, (phase) => ({
            ...phase,
            items: [...phase.items, toSessionExercise(planned)],
          }));
        }}
      />

      <Sheet
        open={Boolean(menuFor)}
        title={menuFor?.item.name ?? ''}
        onClose={() => setMenuFor(null)}
      >
        <div className="list">
          <button
            className="btn btn-block"
            onClick={() => {
              if (menuFor) navigate(`/exercices/${encodeURIComponent(menuFor.item.exerciseId)}`);
              setMenuFor(null);
            }}
          >
            <Icon name="info" size={18} /> Voir la fiche
          </button>
          <button
            className="btn btn-block"
            onClick={() => {
              if (menuFor) {
                updateItem(menuFor.phaseId, menuFor.item.id, (item) => ({
                  ...item,
                  sets: [
                    ...item.sets,
                    newSessionSet(item.tracking, 'warmup', item.sets[0]),
                  ],
                }));
              }
              setMenuFor(null);
            }}
          >
            <Icon name="flame" size={18} /> Ajouter une série d'échauffement
          </button>
          <button
            className="btn btn-block"
            onClick={() => {
              if (menuFor) {
                updateItem(menuFor.phaseId, menuFor.item.id, (item) => ({
                  ...item,
                  sets: item.sets.slice(0, -1),
                }));
              }
              setMenuFor(null);
            }}
          >
            <Icon name="minus" size={18} /> Retirer la dernière série
          </button>
          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              if (menuFor) {
                updatePhase(menuFor.phaseId, (phase) => ({
                  ...phase,
                  items: phase.items.filter((i) => i.id !== menuFor.item.id),
                }));
              }
              setMenuFor(null);
            }}
          >
            <Icon name="trash" size={18} /> Retirer l'exercice
          </button>
        </div>
      </Sheet>

      <Sheet
        open={finishing}
        title="Terminer la séance"
        onClose={() => setFinishing(false)}
        footer={
          <>
            <button className="btn" onClick={() => setFinishing(false)}>
              Continuer
            </button>
            <button className="btn btn-primary" onClick={finish}>
              Enregistrer
            </button>
          </>
        }
      >
        <div className="stat-grid">
          <div className="stat">
            <span className="value">{formatDuration(duration)}</span>
            <span className="label muted">durée</span>
          </div>
          <div className="stat">
            <span className="value">
              {done}/{total}
            </span>
            <span className="label muted">séries</span>
          </div>
          <div className="stat">
            <span className="value">
              {formatNumber(kgToDisplay(volume, settings.units))}
            </span>
            <span className="label muted">{settings.units} soulevés</span>
          </div>
        </div>

        {done < total && (
          <p className="small muted">
            {total - done} série{total - done > 1 ? 's' : ''} non validée
            {total - done > 1 ? 's' : ''} : elles ne seront pas enregistrées.
          </p>
        )}

        <label className="switch">
          <span className="grow">
            <span className="strong">Enregistrer comme modèle</span>
            <span className="tiny muted" style={{ display: 'block' }}>
              Réutilisez cette séance telle quelle plus tard.
            </span>
          </span>
          <input
            type="checkbox"
            checked={asTemplate}
            onChange={(e) => {
              setAsTemplate(e.target.checked);
              if (e.target.checked && !templateName) setTemplateName(session.name);
            }}
          />
        </label>

        {asTemplate && (
          <div className="field">
            <label htmlFor="new-template-name">Nom du modèle</label>
            <input
              id="new-template-name"
              className="input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
        )}
      </Sheet>

      <Confirm
        open={confirmDiscard}
        title="Abandonner la séance ?"
        message="Tout ce qui a été saisi sera perdu."
        confirmLabel="Abandonner"
        danger
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          deleteSession(session.id);
          setConfirmDiscard(false);
          toast('Séance abandonnée.');
          navigate('/');
        }}
      />
    </Screen>
  );
}

function RestBar({
  rest,
  now,
  onAdd,
  onSkip,
}: {
  rest: Rest;
  now: number;
  onAdd: (seconds: number) => void;
  onSkip: () => void;
}) {
  const remaining = Math.max(0, (rest.endsAt - now) / 1000);
  const progress = rest.total > 0 ? (remaining / rest.total) * 100 : 0;

  return (
    <div className="rest-bar no-tabbar">
      <span className="rest-progress" style={{ width: `${progress}%` }} />
      <Icon name="timer" size={20} />
      <span className="time">{formatClock(remaining)}</span>
      <span className="grow tiny muted">Repos</span>
      <button className="btn btn-sm" onClick={() => onAdd(30)}>
        +30 s
      </button>
      <button className="btn btn-sm btn-primary" onClick={onSkip}>
        Passer
      </button>
    </div>
  );
}
