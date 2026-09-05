import { useState } from 'react';
import type { CatalogExercise } from '@/data/catalog';
import { useExerciseIndex } from '@/store/selectors';
import {
  ExerciseFilterChips,
  ExerciseRow,
  NO_FILTERS,
  useExerciseSearch,
  type ExerciseFilters,
} from './ExerciseSearch';
import { CustomExerciseSheet } from './CustomExerciseSheet';
import { EmptyState, SearchInput, Sheet, useIncrementalList } from './ui';
import { Icon } from './icons';
import { customToCatalog } from '@/data/catalog';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: CatalogExercise) => void;
  title?: string;
  /** Ferme la feuille après le premier choix. */
  closeOnPick?: boolean;
}

/** Sélecteur d'exercice : recherche dans le catalogue + exercices perso. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  title = 'Ajouter un exercice',
  closeOnPick = false,
}: Props) {
  const { items, loading, error } = useExerciseIndex();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [added, setAdded] = useState(0);
  const [creating, setCreating] = useState(false);

  const results = useExerciseSearch(items, query, filters);
  const { visible, sentinel, hasMore } = useIncrementalList(results, 30);

  const pick = (exercise: CatalogExercise) => {
    onPick(exercise);
    setAdded((n) => n + 1);
    if (closeOnPick) close();
  };

  const close = () => {
    setQuery('');
    setFilters(NO_FILTERS);
    setAdded(0);
    onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        title={added > 0 ? `${title} · ${added} ajouté${added > 1 ? 's' : ''}` : title}
        onClose={close}
        footer={
          <>
            <button className="btn" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> Exercice perso
            </button>
            <button className="btn btn-primary" onClick={close}>
              Terminé
            </button>
          </>
        }
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Développé couché, squat, dos…"
        />
        <ExerciseFilterChips filters={filters} onChange={setFilters} />

        {error && <div className="card tight small">{error}</div>}
        {loading && <div className="muted small center">Chargement du catalogue…</div>}

        {!loading && results.length === 0 && (
          <EmptyState
            icon="search"
            title="Aucun exercice trouvé"
            message="Essayez un autre mot-clé ou créez votre propre exercice."
          />
        )}

        <div className="list">
          {visible.map(({ exercise }) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              onClick={() => pick(exercise)}
              right={<Icon name="plus" size={18} />}
            />
          ))}
          {hasMore && <div ref={sentinel} className="muted tiny center" style={{ padding: 8 }}>Chargement…</div>}
        </div>
      </Sheet>

      <CustomExerciseSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(created) => pick(customToCatalog(created))}
      />
    </>
  );
}
