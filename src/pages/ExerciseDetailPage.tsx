import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, EmptyState, Sheet, useToast } from '@/components/ui';
import { ExerciseMediaViewer } from '@/components/ExerciseMedia';
import { CustomExerciseSheet } from '@/components/CustomExerciseSheet';
import { LineChart } from '@/components/Charts';
import { useExerciseIndex, useSessions, useSettings, useTemplates } from '@/store/selectors';
import { useStore } from '@/store/store';
import { youtubeSearchUrl } from '@/data/catalog';
import {
  CATEGORY_FR,
  EQUIPMENT_FR,
  FORCE_FR,
  LEVEL_FR,
  MECHANIC_FR,
  MUSCLE_FR,
  label,
} from '@/data/labels';
import { buildExerciseStats } from '@/lib/stats';
import { formatDateShort, formatRelativeDay, formatWeight, round } from '@/lib/format';
import { guessTracking, newPlannedExercise } from '@/lib/templateOps';

export function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const exerciseId = decodeURIComponent(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { byId, loading } = useExerciseIndex();
  const sessions = useSessions();
  const templates = useTemplates();
  const settings = useSettings();
  const customExercises = useStore((s) => s.customExercises);
  const deleteCustomExercise = useStore((s) => s.deleteCustomExercise);
  const updateTemplate = useStore((s) => s.updateTemplate);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [choosingTemplate, setChoosingTemplate] = useState(false);

  const entry = byId.get(exerciseId);
  const stats = useMemo(() => buildExerciseStats(sessions).get(exerciseId), [sessions, exerciseId]);
  const custom = customExercises.find((c) => c.id === exerciseId) ?? null;

  if (!entry) {
    return (
      <Screen title="Exercice" back="/exercices">
        {loading ? (
          <p className="muted center">Chargement…</p>
        ) : (
          <EmptyState
            icon="search"
            title="Exercice introuvable"
            message="Il a peut-être été supprimé du catalogue personnel."
          />
        )}
      </Screen>
    );
  }

  const exercise = entry.exercise;
  const chartPoints =
    stats?.entries
      .filter((e) => e.best1RM > 0)
      .map((e) => ({
        label: formatDateShort(e.date),
        value: round(e.best1RM, 1),
        hint: `${formatDateShort(e.date)} · ${formatWeight(e.bestWeight)} × ${e.bestReps}`,
      })) ?? [];

  const addToTemplate = (templateId: string, phaseId: string) => {
    updateTemplate(templateId, (template) => ({
      ...template,
      phases: template.phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              items: [
                ...phase.items,
                newPlannedExercise(exercise, 3, {
                  tracking: guessTracking(exercise),
                  restSec: settings.defaultRestSec,
                }),
              ],
            }
          : phase,
      ),
    }));
    setAddingTo(null);
    setChoosingTemplate(false);
    toast('Exercice ajouté au modèle.');
  };

  return (
    <Screen
      title={exercise.name}
      subtitle={[
        exercise.primaryMuscles.map((m) => label(MUSCLE_FR, m)).join(', '),
        exercise.originalName,
      ]
        .filter(Boolean)
        .join(' · ')}
      back="/exercices"
      actions={
        custom ? (
          <button className="btn-icon" aria-label="Modifier" onClick={() => setEditing(true)}>
            <Icon name="edit" />
          </button>
        ) : undefined
      }
    >
      <ExerciseMediaViewer exercise={exercise} />

      <div className="chips">
        {exercise.equipment && (
          <span className="chip static">{label(EQUIPMENT_FR, exercise.equipment)}</span>
        )}
        <span className="chip static">{label(CATEGORY_FR, exercise.category)}</span>
        {exercise.level && <span className="chip static">{label(LEVEL_FR, exercise.level)}</span>}
        {exercise.mechanic && (
          <span className="chip static">{label(MECHANIC_FR, exercise.mechanic)}</span>
        )}
        {exercise.force && <span className="chip static">{label(FORCE_FR, exercise.force)}</span>}
      </div>

      {exercise.secondaryMuscles.length > 0 && (
        <div className="card tight">
          <span className="tiny muted">Muscles secondaires</span>
          <span className="small">
            {exercise.secondaryMuscles.map((m) => label(MUSCLE_FR, m)).join(', ')}
          </span>
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={() => setChoosingTemplate(true)}>
          <Icon name="templates" size={16} /> Ajouter à un modèle
        </button>
        <a
          className="btn"
          href={youtubeSearchUrl(exercise)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="link" size={16} /> Vidéos
        </a>
      </div>

      {stats && (
        <div className="card">
          <div className="section-title">
            <h2>Votre progression</h2>
            <span className="tiny muted">{formatRelativeDay(stats.lastPerformed)}</span>
          </div>
          <div className="stat-grid">
            <div className="stat">
              <span className="value">
                {round(stats.prWeight, 1) || '—'}
              </span>
              <span className="label muted">record kg</span>
            </div>
            <div className="stat">
              <span className="value">{round(stats.pr1RM, 1) || '—'}</span>
              <span className="label muted">1RM estimée</span>
            </div>
            <div className="stat">
              <span className="value">{stats.totalSets}</span>
              <span className="label muted">séries au total</span>
            </div>
          </div>
          {chartPoints.length > 1 && (
            <LineChart
              points={chartPoints}
              format={(v) => `${v} kg (1RM est.)`}
            />
          )}
          <div className="list" style={{ gap: 4 }}>
            {stats.entries
              .slice(-5)
              .reverse()
              .map((historyEntry) => (
                <button
                  key={historyEntry.sessionId + historyEntry.date}
                  className="row small"
                  style={{ background: 'none', border: 0, padding: '4px 0', cursor: 'pointer' }}
                  onClick={() => navigate(`/historique/${historyEntry.sessionId}`)}
                >
                  <span className="grow muted" style={{ textAlign: 'left' }}>
                    {formatDateShort(historyEntry.date)}
                  </span>
                  <span className="mono">
                    {historyEntry.bestWeight > 0
                      ? `${formatWeight(historyEntry.bestWeight)} × ${historyEntry.bestReps}`
                      : `${historyEntry.totalReps} reps`}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {exercise.instructions.length > 0 && (
        <div className="card">
          <div className="section-title">
            <h2>Exécution</h2>
            <span className="tiny muted">consignes en anglais</span>
          </div>
          <ol className="instructions">
            {exercise.instructions.map((step, index) => (
              <li key={index}>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {custom && (
        <button className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={18} /> Supprimer cet exercice
        </button>
      )}

      <Sheet
        open={choosingTemplate}
        title="Ajouter à un modèle"
        onClose={() => {
          setChoosingTemplate(false);
          setAddingTo(null);
        }}
      >
        {templates.length === 0 ? (
          <EmptyState icon="templates" title="Aucun modèle" message="Créez d'abord un modèle." />
        ) : addingTo ? (
          <div className="list">
            <span className="label">Dans quelle phase ?</span>
            {templates
              .find((t) => t.id === addingTo)
              ?.phases.map((phase) => (
                <button
                  key={phase.id}
                  className="btn btn-block"
                  onClick={() => addToTemplate(addingTo, phase.id)}
                >
                  {phase.name}
                </button>
              ))}
          </div>
        ) : (
          <div className="list">
            {templates.map((template) => (
              <button
                key={template.id}
                className="btn btn-block"
                onClick={() => setAddingTo(template.id)}
              >
                {template.name}
              </button>
            ))}
          </div>
        )}
      </Sheet>

      <CustomExerciseSheet
        open={editing}
        editing={custom}
        onClose={() => setEditing(false)}
      />

      <Confirm
        open={confirmDelete}
        title="Supprimer cet exercice ?"
        message="Les séances déjà enregistrées le conservent, mais il disparaît du catalogue."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteCustomExercise(exerciseId);
          toast('Exercice supprimé.');
          navigate('/exercices');
        }}
      />
    </Screen>
  );
}
