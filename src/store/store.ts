import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  BackupFile,
  CustomExercise,
  ID,
  Session,
  Settings,
  Template,
} from '@/types';
import { uid } from '@/lib/id';
import { seedTemplates } from '@/data/seed';

export const STORAGE_KEY = 'fitness-tracker';
/** Version du format des fichiers d'export / import. */
export const FORMAT_VERSION = 1;
/** Version du schéma stocké dans localStorage (indépendante de l'export). */
const STORAGE_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  defaultRestSec: 90,
  restAutoStart: true,
  restSound: true,
  restVibration: true,
  keepAwake: true,
  imageSource: 'github',
  weightIncrement: 2.5,
  theme: 'dark',
};

/**
 * Ne conserve que les réglages connus. Une sauvegarde — ou un localStorage —
 * plus ancien peut porter des clés retirées depuis (l'unité de charge, par
 * exemple, désormais toujours le kilogramme).
 */
export function sanitizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const source = raw as Record<string, unknown>;
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result as unknown as Settings;
}

interface Data {
  settings: Settings;
  templates: Template[];
  sessions: Session[];
  customExercises: CustomExercise[];
  activeSessionId: ID | null;
  /** Évite de réinjecter les modèles d'exemple après leur suppression. */
  seeded: boolean;
}

interface Actions {
  setSettings: (patch: Partial<Settings>) => void;

  saveTemplate: (template: Template) => void;
  updateTemplate: (id: ID, fn: (template: Template) => Template) => void;
  deleteTemplate: (id: ID) => void;
  duplicateTemplate: (id: ID) => Template | undefined;

  addCustomExercise: (
    exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
  ) => CustomExercise;
  updateCustomExercise: (id: ID, patch: Partial<CustomExercise>) => void;
  deleteCustomExercise: (id: ID) => void;

  startSession: (session: Session) => Session;
  updateSession: (id: ID, fn: (session: Session) => Session) => void;
  finishSession: (id: ID) => void;
  deleteSession: (id: ID) => void;

  importBackup: (backup: BackupFile, mode: 'replace' | 'merge') => ImportReport;
  resetAll: () => void;
}

export interface ImportReport {
  templates: number;
  sessions: number;
  customExercises: number;
  mode: 'replace' | 'merge';
}

export type Store = Data & Actions;

const initialData: Data = {
  settings: DEFAULT_SETTINGS,
  templates: [],
  sessions: [],
  customExercises: [],
  activeSessionId: null,
  seeded: false,
};

function touch(template: Template): Template {
  return { ...template, updatedAt: new Date().toISOString() };
}

/** Fusion par identifiant : ce qui existe déjà n'est pas écrasé deux fois. */
function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()];
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      saveTemplate: (template) =>
        set((s) => ({
          templates: s.templates.some((t) => t.id === template.id)
            ? s.templates.map((t) => (t.id === template.id ? touch(template) : t))
            : [...s.templates, touch(template)],
        })),

      updateTemplate: (id, fn) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? touch(fn(t)) : t)),
        })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      duplicateTemplate: (id) => {
        const source = get().templates.find((t) => t.id === id);
        if (!source) return undefined;
        const now = new Date().toISOString();
        const copy: Template = {
          ...structuredClone(source),
          id: uid('t'),
          name: `${source.name} (copie)`,
          createdAt: now,
          updatedAt: now,
          timesUsed: 0,
        };
        set((s) => ({ templates: [...s.templates, copy] }));
        return copy;
      },

      addCustomExercise: (exercise) => {
        const created: CustomExercise = {
          ...exercise,
          id: uid('custom-'),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customExercises: [...s.customExercises, created] }));
        return created;
      },

      updateCustomExercise: (id, patch) =>
        set((s) => ({
          customExercises: s.customExercises.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),

      deleteCustomExercise: (id) =>
        set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) })),

      startSession: (session) => {
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.id,
          templates: session.templateId
            ? s.templates.map((t) =>
                t.id === session.templateId ? { ...t, timesUsed: t.timesUsed + 1 } : t,
              )
            : s.templates,
        }));
        return session;
      },

      updateSession: (id, fn) =>
        set((s) => ({ sessions: s.sessions.map((w) => (w.id === id ? fn(w) : w)) })),

      finishSession: (id) =>
        set((s) => ({
          sessions: s.sessions.map((w) =>
            w.id === id
              ? { ...w, status: 'done' as const, endedAt: new Date().toISOString() }
              : w,
          ),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((w) => w.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      importBackup: (backup, mode) => {
        const incoming = backup.data;
        set((s) => {
          if (mode === 'replace') {
            return {
              settings: sanitizeSettings(incoming.settings),
              templates: incoming.templates ?? [],
              sessions: incoming.sessions ?? [],
              customExercises: incoming.customExercises ?? [],
              activeSessionId:
                incoming.sessions?.find((w) => w.status === 'active')?.id ?? null,
              seeded: true,
            };
          }
          return {
            settings: sanitizeSettings({ ...s.settings, ...incoming.settings }),
            templates: mergeById(s.templates, incoming.templates ?? []),
            sessions: mergeById(s.sessions, incoming.sessions ?? []).sort(
              (a, b) => b.startedAt.localeCompare(a.startedAt),
            ),
            customExercises: mergeById(
              s.customExercises,
              incoming.customExercises ?? [],
            ),
            seeded: true,
          };
        });
        return {
          mode,
          templates: incoming.templates?.length ?? 0,
          sessions: incoming.sessions?.length ?? 0,
          customExercises: incoming.customExercises?.length ?? 0,
        };
      },

      resetAll: () => set({ ...initialData, seeded: true }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<Data>;
        return { ...state, settings: sanitizeSettings(state.settings) };
      },
      partialize: (state): Data => ({
        settings: state.settings,
        templates: state.templates,
        sessions: state.sessions,
        customExercises: state.customExercises,
        activeSessionId: state.activeSessionId,
        seeded: state.seeded,
      }),
    },
  ),
);

/**
 * Premier lancement : on installe quelques modèles d'exemple.
 * Appelé une fois au démarrage, après l'hydratation (synchrone avec localStorage).
 */
export function ensureSeeded(): void {
  const state = useStore.getState();
  if (!state.seeded && state.templates.length === 0) {
    useStore.setState({ templates: seedTemplates(), seeded: true });
  }
}

/** Les données brutes, telles qu'elles partent à l'export. */
export function exportData(): BackupFile {
  const { settings, templates, sessions, customExercises } = useStore.getState();
  return {
    app: 'fitness-tracker',
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: { settings, templates, sessions, customExercises },
  };
}
