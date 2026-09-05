import { useMemo, type ReactNode } from 'react';
import type { CatalogExercise, IndexedExercise } from '@/data/catalog';
import { scoreMatch, tokenize } from '@/lib/search';
import { CATEGORY_FR, EQUIPMENT_FR, MUSCLE_FR, MUSCLE_GROUPS, label } from '@/data/labels';
import { ExerciseThumb } from './ExerciseMedia';
import { FilterChip } from './ui';
import { Icon } from './icons';

export interface ExerciseFilters {
  group: string | null;
  equipment: string | null;
  category: string | null;
  customOnly: boolean;
}

export const NO_FILTERS: ExerciseFilters = {
  group: null,
  equipment: null,
  category: null,
  customOnly: false,
};

/** Filtre puis classe les exercices selon la requête et les filtres actifs. */
export function useExerciseSearch(
  items: IndexedExercise[],
  query: string,
  filters: ExerciseFilters,
): IndexedExercise[] {
  const tokens = useMemo(() => tokenize(query), [query]);

  return useMemo(() => {
    const filtered = items.filter((item) => {
      if (filters.customOnly && !item.exercise.isCustom) return false;
      if (filters.group && !item.groups.includes(filters.group)) return false;
      if (filters.equipment && item.exercise.equipment !== filters.equipment) return false;
      if (filters.category && item.exercise.category !== filters.category) return false;
      return true;
    });

    if (tokens.length === 0) {
      // Sans recherche, on met les exercices les plus courants en tête :
      // une liste alphabétique commencerait par les variantes les plus obscures.
      return filtered.sort(
        (a, b) => b.boost - a.boost || a.exercise.name.localeCompare(b.exercise.name, 'fr'),
      );
    }

    const scored: { item: IndexedExercise; score: number }[] = [];
    for (const item of filtered) {
      const score = scoreMatch(item, tokens);
      if (score !== null) scored.push({ item, score });
    }
    return scored
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'fr'))
      .map((s) => s.item);
  }, [items, tokens, filters]);
}

export const EQUIPMENT_ORDER = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'body only',
  'kettlebells',
  'bands',
  'e-z curl bar',
  'exercise ball',
  'medicine ball',
  'foam roll',
  'other',
];

interface FiltersProps {
  filters: ExerciseFilters;
  onChange: (filters: ExerciseFilters) => void;
  showCustom?: boolean;
}

export function ExerciseFilterChips({ filters, onChange, showCustom = true }: FiltersProps) {
  const toggle = <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? null : value });

  return (
    <div className="list" style={{ gap: 6 }}>
      <div className="chips scroll">
        {showCustom && (
          <FilterChip
            label="Mes exercices"
            selected={filters.customOnly}
            onClick={() => onChange({ ...filters, customOnly: !filters.customOnly })}
          />
        )}
        {MUSCLE_GROUPS.map((group) => (
          <FilterChip
            key={group.id}
            label={group.label}
            selected={filters.group === group.id}
            onClick={() => toggle('group', group.id)}
          />
        ))}
      </div>
      <div className="chips scroll">
        {EQUIPMENT_ORDER.map((equipment) => (
          <FilterChip
            key={equipment}
            label={label(EQUIPMENT_FR, equipment)}
            selected={filters.equipment === equipment}
            onClick={() => toggle('equipment', equipment)}
          />
        ))}
        {Object.keys(CATEGORY_FR)
          .filter((c) => c !== 'strength')
          .map((category) => (
            <FilterChip
              key={category}
              label={label(CATEGORY_FR, category)}
              selected={filters.category === category}
              onClick={() => toggle('category', category)}
            />
          ))}
      </div>
    </div>
  );
}

export function exerciseSubtitle(exercise: CatalogExercise): string {
  const muscles = exercise.primaryMuscles.map((m) => label(MUSCLE_FR, m)).join(', ');
  const equipment = exercise.equipment ? label(EQUIPMENT_FR, exercise.equipment) : null;
  return [muscles || label(CATEGORY_FR, exercise.category), equipment]
    .filter(Boolean)
    .join(' · ');
}

interface RowProps {
  exercise: CatalogExercise;
  onClick?: () => void;
  right?: ReactNode;
}

export function ExerciseRow({ exercise, onClick, right }: RowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className="exercise-row" onClick={onClick} type={onClick ? 'button' : undefined}>
      <ExerciseThumb exercise={exercise} />
      <span className="grow">
        <span className="nowrap strong small" style={{ display: 'block' }}>
          {exercise.name}
        </span>
        <span className="nowrap tiny muted" style={{ display: 'block' }}>
          {exerciseSubtitle(exercise)}
        </span>
      </span>
      {exercise.isCustom && <span className="badge">Perso</span>}
      {right ?? (onClick && <Icon name="chevron" size={16} />)}
    </Tag>
  );
}
