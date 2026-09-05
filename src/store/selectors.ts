import { useMemo } from 'react';
import { useStore } from './store';
import { customToCatalog, indexExercise, useCatalog, type IndexedExercise } from '@/data/catalog';

export const useSettings = () => useStore((s) => s.settings);
export const useTemplates = () => useStore((s) => s.templates);
export const useSessions = () => useStore((s) => s.sessions);
export const useCustomExercises = () => useStore((s) => s.customExercises);
export const useActiveSession = () =>
  useStore((s) => s.sessions.find((w) => w.id === s.activeSessionId) ?? null);

export function useTemplate(id: string | undefined) {
  return useStore((s) => s.templates.find((t) => t.id === id) ?? null);
}

export function useSession(id: string | undefined) {
  return useStore((s) => s.sessions.find((w) => w.id === id) ?? null);
}

export interface ExerciseIndex {
  loading: boolean;
  error: string | null;
  /** Catalogue + exercices perso, prêts pour la recherche. */
  items: IndexedExercise[];
  byId: Map<string, IndexedExercise>;
}

/** Index de recherche global : catalogue public + exercices personnels. */
export function useExerciseIndex(): ExerciseIndex {
  const { exercises, loading, error } = useCatalog();
  const customExercises = useCustomExercises();

  return useMemo(() => {
    const items = [
      ...customExercises.map((c) => indexExercise(customToCatalog(c))),
      ...exercises.map(indexExercise),
    ];
    return {
      loading,
      error,
      items,
      byId: new Map(items.map((item) => [item.exercise.id, item])),
    };
  }, [exercises, customExercises, loading, error]);
}
