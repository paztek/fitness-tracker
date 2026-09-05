import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, NumberField, Segmented, Sheet, useToast } from '@/components/ui';
import { ExercisePicker } from '@/components/ExercisePicker';
import { useSettings, useTemplate } from '@/store/selectors';
import { useStore } from '@/store/store';
import {
  countExercises,
  countSets,
  estimateDurationSec,
  guessTracking,
  mapById,
  move,
  newPhase,
  newPlannedExercise,
  newSet,
} from '@/lib/templateOps';
import { formatDuration, formatWeight } from '@/lib/format';
import { PHASE_FR, SET_KIND_FR, SPORT_FR } from '@/data/labels';
import type {
  Phase,
  PhaseKind,
  PlannedExercise,
  SetKind,
  Sport,
  Template,
  TrackingMode,
} from '@/types';
import { sessionFromTemplate } from '@/lib/sessionOps';

const SET_KIND_CYCLE: SetKind[] = ['normal', 'warmup', 'dropset', 'failure'];

const TRACKING_OPTIONS: { value: TrackingMode; label: string }[] = [
  { value: 'weight', label: 'Charge × reps' },
  { value: 'reps', label: 'Reps' },
  { value: 'time', label: 'Durée' },
  { value: 'distance', label: 'Distance' },
];

export function TemplateEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const template = useTemplate(id);
  const settings = useSettings();
  const updateTemplate = useStore((s) => s.updateTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const startSession = useStore((s) => s.startSession);
  const activeSessionId = useStore((s) => s.activeSessionId);

  const [pickerPhase, setPickerPhase] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ phaseId: string; itemId: string } | null>(null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!template) {
    return (
      <Screen title="Modèle introuvable" back="/modeles" fullscreen>
        <p className="muted">Ce modèle n'existe plus.</p>
      </Screen>
    );
  }

  const patch = (fn: (t: Template) => Template) => updateTemplate(template.id, fn);

  const updatePhase = (phaseId: string, fn: (phase: Phase) => Phase) =>
    patch((t) => ({ ...t, phases: mapById(t.phases, phaseId, fn) }));

  const updateItem = (
    phaseId: string,
    itemId: string,
    fn: (item: PlannedExercise) => PlannedExercise,
  ) => updatePhase(phaseId, (phase) => ({ ...phase, items: mapById(phase.items, itemId, fn) }));

  const openItem =
    editingItem &&
    template.phases
      .find((p) => p.id === editingItem.phaseId)
      ?.items.find((i) => i.id === editingItem.itemId);

  const start = () => {
    if (activeSessionId) {
      toast('Une séance est déjà en cours.', 'danger');
      navigate('/seance');
      return;
    }
    startSession(sessionFromTemplate(template));
    navigate('/seance');
  };

  return (
    <Screen
      title={template.name || 'Modèle'}
      subtitle={`${countExercises(template)} exercices · ${countSets(template)} séries · ~${formatDuration(
        estimateDurationSec(template, settings.defaultRestSec),
      )}`}
      back="/modeles"
      fullscreen
      actions={
        <button className="btn btn-sm btn-primary" onClick={start}>
          <Icon name="play" filled size={14} /> Démarrer
        </button>
      }
    >
      <div className="card">
        <div className="field">
          <label htmlFor="tpl-name">Nom du modèle</label>
          <input
            id="tpl-name"
            className="input"
            value={template.name}
            onChange={(e) => patch((t) => ({ ...t, name: e.target.value }))}
            placeholder="Ex. : Push A — Pecs / Épaules"
          />
        </div>
        <div className="field">
          <label htmlFor="tpl-sport">Sport</label>
          <select
            id="tpl-sport"
            className="select"
            value={template.sport}
            onChange={(e) => patch((t) => ({ ...t, sport: e.target.value as Sport }))}
          >
            {Object.entries(SPORT_FR).map(([key, fr]) => (
              <option key={key} value={key}>
                {fr}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tpl-desc">Description</label>
          <textarea
            id="tpl-desc"
            className="textarea"
            style={{ minHeight: 60 }}
            value={template.description ?? ''}
            onChange={(e) => patch((t) => ({ ...t, description: e.target.value }))}
            placeholder="Objectif, remarques, matériel…"
          />
        </div>
        <div className="field">
          <label htmlFor="tpl-tags">Étiquettes (séparées par des virgules)</label>
          <input
            id="tpl-tags"
            className="input"
            value={template.tags.join(', ')}
            onChange={(e) =>
              patch((t) => ({
                ...t,
                tags: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="push, haut du corps"
          />
        </div>
      </div>

      {template.phases.map((phase, phaseIndex) => (
        <div key={phase.id} className="card">
          <div className="row-between">
            <span className={`badge ${phase.kind}`}>{PHASE_FR[phase.kind]}</span>
            <div className="row" style={{ gap: 2 }}>
              <button
                className="btn-icon small"
                aria-label="Monter la phase"
                disabled={phaseIndex === 0}
                onClick={() => patch((t) => ({ ...t, phases: move(t.phases, phaseIndex, phaseIndex - 1) }))}
              >
                <Icon name="up" size={16} />
              </button>
              <button
                className="btn-icon small"
                aria-label="Descendre la phase"
                disabled={phaseIndex === template.phases.length - 1}
                onClick={() => patch((t) => ({ ...t, phases: move(t.phases, phaseIndex, phaseIndex + 1) }))}
              >
                <Icon name="down" size={16} />
              </button>
              <button
                className="btn-icon small"
                aria-label="Supprimer la phase"
                onClick={() =>
                  patch((t) => ({ ...t, phases: t.phases.filter((p) => p.id !== phase.id) }))
                }
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>

          <input
            className="input"
            value={phase.name}
            onChange={(e) => updatePhase(phase.id, (p) => ({ ...p, name: e.target.value }))}
            aria-label="Nom de la phase"
          />

          <div className="list">
            {phase.items.map((item, itemIndex) => (
              <div key={item.id} className="exercise-row" style={{ alignItems: 'flex-start' }}>
                <span className="grow">
                  <span className="strong small nowrap" style={{ display: 'block' }}>
                    {item.name}
                  </span>
                  <span className="tiny muted">{summarizeSets(item)}</span>
                </span>
                <span className="row" style={{ gap: 2 }}>
                  <button
                    className="btn-icon small"
                    aria-label="Monter"
                    disabled={itemIndex === 0}
                    onClick={() =>
                      updatePhase(phase.id, (p) => ({
                        ...p,
                        items: move(p.items, itemIndex, itemIndex - 1),
                      }))
                    }
                  >
                    <Icon name="up" size={16} />
                  </button>
                  <button
                    className="btn-icon small"
                    aria-label="Descendre"
                    disabled={itemIndex === phase.items.length - 1}
                    onClick={() =>
                      updatePhase(phase.id, (p) => ({
                        ...p,
                        items: move(p.items, itemIndex, itemIndex + 1),
                      }))
                    }
                  >
                    <Icon name="down" size={16} />
                  </button>
                  <button
                    className="btn-icon small"
                    aria-label="Modifier les séries"
                    onClick={() => setEditingItem({ phaseId: phase.id, itemId: item.id })}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <button className="btn btn-sm btn-block" onClick={() => setPickerPhase(phase.id)}>
            <Icon name="plus" size={16} /> Ajouter un exercice
          </button>
        </div>
      ))}

      <button className="btn btn-block" onClick={() => setAddingPhase(true)}>
        <Icon name="plus" size={18} /> Ajouter une phase
      </button>

      <button className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
        <Icon name="trash" size={18} /> Supprimer le modèle
      </button>

      <ExercisePicker
        open={Boolean(pickerPhase)}
        onClose={() => setPickerPhase(null)}
        onPick={(exercise) => {
          if (!pickerPhase) return;
          const phase = template.phases.find((p) => p.id === pickerPhase);
          const item = newPlannedExercise(
            exercise,
            phase?.kind === 'warmup' ? 2 : 3,
            { tracking: guessTracking(exercise), restSec: settings.defaultRestSec },
          );
          updatePhase(pickerPhase, (p) => ({ ...p, items: [...p.items, item] }));
        }}
      />

      <Sheet
        open={addingPhase}
        title="Ajouter une phase"
        onClose={() => setAddingPhase(false)}
      >
        <div className="list">
          {(['warmup', 'main', 'cooldown'] as PhaseKind[]).map((kind) => (
            <button
              key={kind}
              className="btn btn-block"
              onClick={() => {
                patch((t) => ({ ...t, phases: [...t.phases, newPhase(kind)] }));
                setAddingPhase(false);
              }}
            >
              {PHASE_FR[kind]}
            </button>
          ))}
        </div>
      </Sheet>

      {editingItem && openItem && (
        <SetsEditor
          item={openItem}
          onClose={() => setEditingItem(null)}
          onChange={(fn) => updateItem(editingItem.phaseId, editingItem.itemId, fn)}
          onRemove={() => {
            updatePhase(editingItem.phaseId, (p) => ({
              ...p,
              items: p.items.filter((i) => i.id !== editingItem.itemId),
            }));
            setEditingItem(null);
          }}
        />
      )}

      <Confirm
        open={confirmDelete}
        title="Supprimer ce modèle ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTemplate(template.id);
          toast('Modèle supprimé.');
          navigate('/modeles');
        }}
      />
    </Screen>
  );
}

function summarizeSets(item: PlannedExercise): string {
  if (item.sets.length === 0) return 'Aucune série';
  const parts = item.sets.map((set) => {
    if (item.tracking === 'time') return `${set.durationSec ?? 0} s`;
    if (item.tracking === 'distance') return `${set.distanceM ?? 0} m`;
    const reps = set.reps ?? '?';
    return set.weight ? `${reps} × ${formatWeight(set.weight)}` : `${reps}`;
  });
  const unique = [...new Set(parts)];
  return unique.length === 1
    ? `${item.sets.length} × ${unique[0]}`
    : `${item.sets.length} séries · ${parts.join(' / ')}`;
}

interface SetsEditorProps {
  item: PlannedExercise;
  onClose: () => void;
  onChange: (fn: (item: PlannedExercise) => PlannedExercise) => void;
  onRemove: () => void;
}

/** Édition des séries d'un exercice planifié. */
function SetsEditor({ item, onClose, onChange, onRemove }: SetsEditorProps) {
  const { defaultRestSec, weightIncrement } = useSettings();

  const updateSet = (setId: string, patch: Partial<PlannedExercise['sets'][number]>) =>
    onChange((current) => ({
      ...current,
      sets: mapById(current.sets, setId, (s) => ({ ...s, ...patch })),
    }));

  return (
    <Sheet
      open
      title={item.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={onRemove}>
            <Icon name="trash" size={16} /> Retirer
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Terminé
          </button>
        </>
      }
    >
      <div className="field">
        <span className="label">Ce que l'on suit</span>
        <Segmented
          value={item.tracking}
          options={TRACKING_OPTIONS}
          onChange={(tracking) => onChange((current) => ({ ...current, tracking }))}
        />
      </div>

      <div className="field">
        <label className="label">Repos par défaut entre séries</label>
        <NumberField
          value={item.restSec ?? defaultRestSec}
          onChange={(restSec) => onChange((current) => ({ ...current, restSec }))}
          step={15}
          ariaLabel="Repos en secondes"
        />
      </div>

      <div className="divider" />

      <div className="list">
        {item.sets.map((set, index) => (
          <div key={set.id} className={`set-row ${item.tracking === 'weight' ? '' : 'time'}`}>
            <button
              className={`set-index ${set.kind}`}
              title={SET_KIND_FR[set.kind]}
              onClick={() =>
                updateSet(set.id, {
                  kind: SET_KIND_CYCLE[(SET_KIND_CYCLE.indexOf(set.kind) + 1) % SET_KIND_CYCLE.length],
                })
              }
            >
              {set.kind === 'warmup' ? 'É' : index + 1}
            </button>

            {item.tracking === 'time' ? (
              <div className="cell">
                <NumberField
                  value={set.durationSec}
                  onChange={(durationSec) => updateSet(set.id, { durationSec })}
                  step={15}
                  ariaLabel="Durée en secondes"
                />
                <span className="cell-hint">secondes</span>
              </div>
            ) : item.tracking === 'distance' ? (
              <div className="cell">
                <NumberField
                  value={set.distanceM}
                  onChange={(distanceM) => updateSet(set.id, { distanceM })}
                  step={100}
                  ariaLabel="Distance en mètres"
                />
                <span className="cell-hint">mètres</span>
              </div>
            ) : (
              <>
                <div className="cell">
                  <NumberField
                    value={set.reps}
                    onChange={(reps) => updateSet(set.id, { reps })}
                    ariaLabel="Répétitions"
                    withButtons={false}
                  />
                  <span className="cell-hint">reps</span>
                </div>
                {item.tracking === 'weight' && (
                  <div className="cell">
                    <NumberField
                      value={set.weight}
                      onChange={(weight) => updateSet(set.id, { weight })}
                      step={weightIncrement}
                      ariaLabel="Charge en kilogrammes"
                      withButtons={false}
                    />
                    <span className="cell-hint">kg</span>
                  </div>
                )}
              </>
            )}

            <button
              className="btn-icon small"
              aria-label="Supprimer la série"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  sets: current.sets.filter((s) => s.id !== set.id),
                }))
              }
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-block"
        onClick={() =>
          onChange((current) => {
            const last = current.sets.at(-1);
            return {
              ...current,
              sets: [
                ...current.sets,
                newSet('normal', {
                  reps: last?.reps ?? 10,
                  weight: last?.weight,
                  durationSec: last?.durationSec,
                  distanceM: last?.distanceM,
                  restSec: last?.restSec,
                }),
              ],
            };
          })
        }
      >
        <Icon name="plus" size={18} /> Ajouter une série
      </button>

      <div className="field">
        <label htmlFor="item-notes">Notes</label>
        <textarea
          id="item-notes"
          className="textarea"
          style={{ minHeight: 60 }}
          value={item.notes ?? ''}
          onChange={(e) => onChange((current) => ({ ...current, notes: e.target.value }))}
          placeholder="Réglage du siège, tempo, consigne technique…"
        />
      </div>
    </Sheet>
  );
}
