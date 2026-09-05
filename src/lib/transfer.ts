import type { BackupFile, CustomExercise, Session, Template } from '@/types';
import { exportData, FORMAT_VERSION, sanitizeSettings } from '@/store/store';

export function backupFilename(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  return `seances-${stamp}.json`;
}

export function backupToJson(): string {
  return JSON.stringify(exportData(), null, 2);
}

/** Télécharge la sauvegarde en JSON. */
export function downloadBackup(): string {
  const json = backupToJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFilename();
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return json;
}

/** Partage la sauvegarde via la feuille de partage du système (iOS, Android). */
export async function shareBackup(): Promise<boolean> {
  const file = new File([backupToJson()], backupFilename(), { type: 'application/json' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (!nav.share || !nav.canShare?.({ files: [file] })) return false;
  try {
    await nav.share({ files: [file], title: 'Sauvegarde de mes séances' });
    return true;
  } catch {
    return false;
  }
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsText(file);
  });
}

function isArrayOfObjects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'object' && v !== null);
}

/**
 * Valide un JSON importé. Accepte le format d'export complet ou un objet
 * contenant directement `templates` / `sessions`.
 */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Fichier inattendu : un objet JSON est attendu.');
  }

  const candidate = raw as Record<string, unknown>;
  const data = (
    typeof candidate.data === 'object' && candidate.data !== null ? candidate.data : candidate
  ) as Record<string, unknown>;

  const templates = data.templates ?? [];
  const sessions = data.sessions ?? [];
  const customExercises = data.customExercises ?? [];

  if (!isArrayOfObjects(templates) || !isArrayOfObjects(sessions)) {
    throw new Error(
      'Fichier inattendu : « templates » et « sessions » doivent être des listes.',
    );
  }
  if (!isArrayOfObjects(customExercises)) {
    throw new Error('Fichier inattendu : « customExercises » doit être une liste.');
  }
  if (templates.length === 0 && sessions.length === 0 && customExercises.length === 0) {
    throw new Error('Ce fichier ne contient ni modèle, ni séance, ni exercice personnel.');
  }

  const badTemplate = templates.find(
    (t) => typeof t.id !== 'string' || typeof t.name !== 'string' || !Array.isArray(t.phases),
  );
  if (badTemplate) throw new Error('Un modèle du fichier est incomplet (id, nom ou phases).');

  const badSession = sessions.find(
    (w) => typeof w.id !== 'string' || typeof w.startedAt !== 'string' || !Array.isArray(w.phases),
  );
  if (badSession) throw new Error('Une séance du fichier est incomplète (id, date ou phases).');

  const settings = sanitizeSettings(data.settings);

  return {
    app: 'fitness-tracker',
    formatVersion:
      typeof candidate.formatVersion === 'number' ? candidate.formatVersion : FORMAT_VERSION,
    exportedAt:
      typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
    data: {
      settings,
      templates: templates as unknown as Template[],
      sessions: (sessions as unknown as Session[]).map((s) => ({
        ...s,
        pausedMs: typeof s.pausedMs === 'number' ? s.pausedMs : 0,
      })),
      customExercises: customExercises as unknown as CustomExercise[],
    },
  };
}
