/** Types du domaine. Tous les poids sont stockés en kilogrammes. */

export type ID = string;

/** Sport d'une séance. Extensible : la muscu est le cas principal, le reste suit. */
export type Sport =
  | 'muscu'
  | 'cardio'
  | 'mobilite'
  | 'course'
  | 'velo'
  | 'natation'
  | 'autre';

/** Nature d'une phase de séance. */
export type PhaseKind = 'warmup' | 'main' | 'cooldown';

/** Type d'une série, qui change sa comptabilisation dans les stats. */
export type SetKind = 'normal' | 'warmup' | 'dropset' | 'failure';

/** Ce que l'on mesure sur un exercice donné. */
export type TrackingMode = 'reps' | 'weight' | 'time' | 'distance';

/** Exercice ajouté par l'utilisateur, hors catalogue. */
export interface CustomExercise {
  id: ID;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  category: string;
  instructions: string[];
  /** URLs d'images ou de vidéos (YouTube, fichier distant…). */
  media: string[];
  createdAt: string;
}

/** Série planifiée dans un modèle. */
export interface PlannedSet {
  id: ID;
  kind: SetKind;
  reps?: number;
  weight?: number;
  durationSec?: number;
  distanceM?: number;
  restSec?: number;
}

/** Exercice planifié : un exercice du catalogue + ses séries cibles. */
export interface PlannedExercise {
  id: ID;
  exerciseId: string;
  /** Nom affiché, dénormalisé pour rester lisible si le catalogue change. */
  name: string;
  tracking: TrackingMode;
  notes?: string;
  restSec?: number;
  sets: PlannedSet[];
}

export interface Phase {
  id: ID;
  kind: PhaseKind;
  name: string;
  notes?: string;
  items: PlannedExercise[];
}

/** Modèle de séance type, réutilisable. */
export interface Template {
  id: ID;
  name: string;
  description?: string;
  sport: Sport;
  tags: string[];
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
  /** Nombre de séances démarrées depuis ce modèle. */
  timesUsed: number;
}

/** Série réellement effectuée (ou à effectuer) pendant une séance. */
export interface SessionSet {
  id: ID;
  kind: SetKind;
  /** Cibles issues du modèle, gardées pour comparaison. */
  targetReps?: number;
  targetWeight?: number;
  targetDurationSec?: number;
  targetDistanceM?: number;
  reps?: number;
  weight?: number;
  durationSec?: number;
  distanceM?: number;
  restSec?: number;
  rpe?: number;
  done: boolean;
  completedAt?: string;
}

export interface SessionExercise {
  id: ID;
  exerciseId: string;
  name: string;
  tracking: TrackingMode;
  notes?: string;
  restSec?: number;
  sets: SessionSet[];
}

export interface SessionPhase {
  id: ID;
  kind: PhaseKind;
  name: string;
  notes?: string;
  items: SessionExercise[];
}

export type SessionStatus = 'active' | 'done';

export interface Session {
  id: ID;
  name: string;
  sport: Sport;
  templateId?: ID;
  templateName?: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  /** Millisecondes passées en pause, retirées de la durée totale. */
  pausedMs: number;
  notes?: string;
  bodyweight?: number;
  phases: SessionPhase[];
}

export type Units = 'kg' | 'lb';
export type ImageSource = 'jsdelivr' | 'github' | 'none';
export type ThemeSetting = 'dark' | 'light' | 'auto';

export interface Settings {
  units: Units;
  /** Repos par défaut entre deux séries, en secondes. */
  defaultRestSec: number;
  restAutoStart: boolean;
  restSound: boolean;
  restVibration: boolean;
  keepAwake: boolean;
  imageSource: ImageSource;
  /** Pas d'incrément des boutons +/- de charge, en kg. */
  weightIncrement: number;
  theme: ThemeSetting;
  lastBodyweight?: number;
}

/** Format du fichier d'export / import JSON. */
export interface BackupFile {
  app: 'fitness-tracker';
  formatVersion: number;
  exportedAt: string;
  data: {
    settings: Settings;
    templates: Template[];
    sessions: Session[];
    customExercises: CustomExercise[];
  };
}
