import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, EmptyState, SearchInput, Sheet, useToast } from '@/components/ui';
import { useActiveSession, useSettings, useTemplates } from '@/store/selectors';
import { useStore } from '@/store/store';
import { countExercises, countSets, estimateDurationSec, newTemplate } from '@/lib/templateOps';
import { sessionFromTemplate } from '@/lib/sessionOps';
import { formatDuration, plural } from '@/lib/format';
import { PHASE_FR, SPORT_FR } from '@/data/labels';
import { normalize } from '@/lib/search';
import type { Template } from '@/types';

export function TemplatesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const templates = useTemplates();
  const settings = useSettings();
  const active = useActiveSession();
  const { saveTemplate, deleteTemplate, duplicateTemplate, startSession } = useStore.getState();
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<Template | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = q
      ? templates.filter((t) =>
          normalize(`${t.name} ${t.description ?? ''} ${t.tags.join(' ')}`).includes(q),
        )
      : templates;
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [templates, query]);

  const create = () => {
    const template = newTemplate();
    saveTemplate(template);
    navigate(`/modeles/${template.id}`);
  };

  const start = (template: Template) => {
    if (active) {
      toast('Une séance est déjà en cours.', 'danger');
      navigate('/seance');
      return;
    }
    startSession(sessionFromTemplate(template));
    navigate('/seance');
  };

  return (
    <Screen
      title="Modèles"
      subtitle={`${plural(templates.length, 'modèle')} de séance`}
      actions={
        <button className="btn-icon" onClick={create} aria-label="Nouveau modèle">
          <Icon name="plus" />
        </button>
      }
    >
      {templates.length > 3 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Filtrer les modèles…" />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="templates"
          title={query ? 'Aucun modèle trouvé' : 'Aucun modèle'}
          message="Un modèle décrit une séance type : échauffement, exercices, séries et répétitions."
          action={
            <button className="btn btn-primary" onClick={create}>
              <Icon name="plus" size={18} /> Créer un modèle
            </button>
          }
        />
      ) : (
        <div className="list">
          {filtered.map((template) => (
            <div key={template.id} className="card">
              <div className="row-between">
                <button
                  className="grow"
                  style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/modeles/${template.id}`)}
                >
                  <div className="strong">{template.name}</div>
                  <div className="tiny muted">
                    {SPORT_FR[template.sport]} · {countExercises(template)} exercices ·{' '}
                    {countSets(template)} séries · ~
                    {formatDuration(estimateDurationSec(template, settings.defaultRestSec))}
                  </div>
                </button>
                <button
                  className="btn-icon small"
                  aria-label="Actions"
                  onClick={() => setMenuFor(template)}
                >
                  <Icon name="more" size={18} />
                </button>
              </div>

              {template.description && (
                <p className="small muted" style={{ margin: 0 }}>
                  {template.description}
                </p>
              )}

              <div className="chips">
                {template.phases
                  .filter((p) => p.items.length > 0)
                  .map((phase) => (
                    <span key={phase.id} className={`badge ${phase.kind}`}>
                      {PHASE_FR[phase.kind]} · {phase.items.length}
                    </span>
                  ))}
                {template.tags.map((tag) => (
                  <span key={tag} className="chip static">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="btn-row">
                <button className="btn btn-primary btn-sm" onClick={() => start(template)}>
                  <Icon name="play" filled size={14} /> Démarrer
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate(`/modeles/${template.id}`)}
                >
                  <Icon name="edit" size={14} /> Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(menuFor)}
        title={menuFor?.name ?? ''}
        onClose={() => setMenuFor(null)}
      >
        <div className="list">
          <button
            className="btn btn-block"
            onClick={() => {
              if (menuFor) navigate(`/modeles/${menuFor.id}`);
              setMenuFor(null);
            }}
          >
            <Icon name="edit" size={18} /> Modifier
          </button>
          <button
            className="btn btn-block"
            onClick={() => {
              if (menuFor) {
                const copy = duplicateTemplate(menuFor.id);
                if (copy) toast(`« ${copy.name} » créé.`);
              }
              setMenuFor(null);
            }}
          >
            <Icon name="copy" size={18} /> Dupliquer
          </button>
          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              setConfirmDelete(menuFor);
              setMenuFor(null);
            }}
          >
            <Icon name="trash" size={18} /> Supprimer
          </button>
        </div>
      </Sheet>

      <Confirm
        open={Boolean(confirmDelete)}
        title="Supprimer ce modèle ?"
        message={`« ${confirmDelete?.name} » sera définitivement supprimé. Les séances déjà enregistrées sont conservées.`}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteTemplate(confirmDelete.id);
            toast('Modèle supprimé.');
          }
          setConfirmDelete(null);
        }}
      />
    </Screen>
  );
}
