import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { EmptyState, SearchInput, useIncrementalList } from '@/components/ui';
import { CustomExerciseSheet } from '@/components/CustomExerciseSheet';
import {
  ExerciseFilterChips,
  ExerciseRow,
  NO_FILTERS,
  useExerciseSearch,
  type ExerciseFilters,
} from '@/components/ExerciseSearch';
import { useExerciseIndex } from '@/store/selectors';

export function CatalogPage() {
  const navigate = useNavigate();
  const { items, loading, error } = useExerciseIndex();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [creating, setCreating] = useState(false);

  const results = useExerciseSearch(items, query, filters);
  const { visible, sentinel, hasMore } = useIncrementalList(results, 30);

  return (
    <Screen
      title="Exercices"
      subtitle={
        loading ? 'Chargement du catalogue…' : `${results.length} exercice${results.length > 1 ? 's' : ''}`
      }
      actions={
        <button
          className="btn-icon"
          onClick={() => setCreating(true)}
          aria-label="Créer un exercice"
        >
          <Icon name="plus" />
        </button>
      }
    >
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Développé couché, traction, ischios…"
      />
      <ExerciseFilterChips filters={filters} onChange={setFilters} />

      {!query && (
        <span className="tiny muted">Les exercices les plus courants d'abord.</span>
      )}

      {error && (
        <div className="card tight small">
          <span className="strong">Catalogue indisponible</span>
          <span className="muted">{error}</span>
        </div>
      )}

      {!loading && results.length === 0 && (
        <EmptyState
          icon="search"
          title="Aucun exercice trouvé"
          message="Essayez un autre mot-clé, ou ajoutez votre propre exercice."
          action={
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={18} /> Nouvel exercice
            </button>
          }
        />
      )}

      <div className="list">
        {visible.map(({ exercise }) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            onClick={() => navigate(`/exercices/${encodeURIComponent(exercise.id)}`)}
          />
        ))}
        {hasMore && (
          <div ref={sentinel} className="muted tiny center" style={{ padding: 12 }}>
            Chargement…
          </div>
        )}
      </div>

      <CustomExerciseSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(created) => navigate(`/exercices/${encodeURIComponent(created.id)}`)}
      />
    </Screen>
  );
}
