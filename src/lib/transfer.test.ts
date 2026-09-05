import { describe, expect, it } from 'vitest';
import { backupFilename, parseBackup } from './transfer';

const modele = {
  id: 't1',
  name: 'Push',
  sport: 'muscu',
  tags: [],
  phases: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  timesUsed: 0,
};

const seance = {
  id: 'w1',
  name: 'Push',
  sport: 'muscu',
  status: 'done',
  startedAt: '2026-01-02T10:00:00.000Z',
  phases: [],
};

const complet = {
  app: 'fitness-tracker',
  formatVersion: 1,
  exportedAt: '2026-01-03T10:00:00.000Z',
  data: { settings: { defaultRestSec: 120 }, templates: [modele], sessions: [seance], customExercises: [] },
};

describe('parseBackup', () => {
  it('lit le format d’export complet', () => {
    const backup = parseBackup(JSON.stringify(complet));
    expect(backup.data.templates).toHaveLength(1);
    expect(backup.data.sessions[0].id).toBe('w1');
    expect(backup.data.settings.defaultRestSec).toBe(120);
  });

  it('complète les réglages absents par les valeurs par défaut', () => {
    const backup = parseBackup(JSON.stringify(complet));
    expect(backup.data.settings.theme).toBe('dark');
    expect(backup.data.settings.weightIncrement).toBe(2.5);
  });

  it('accepte un objet contenant directement modèles et séances', () => {
    const backup = parseBackup(JSON.stringify({ templates: [modele], sessions: [] }));
    expect(backup.data.templates).toHaveLength(1);
    expect(backup.formatVersion).toBe(1);
  });

  it('complète pausedMs quand il manque', () => {
    expect(parseBackup(JSON.stringify(complet)).data.sessions[0].pausedMs).toBe(0);
  });

  it('refuse un JSON invalide', () => {
    expect(() => parseBackup('{ ceci n’est pas du JSON')).toThrow(/JSON valide/);
  });

  it('refuse un fichier vide de contenu', () => {
    expect(() => parseBackup(JSON.stringify({ templates: [], sessions: [] }))).toThrow(
      /ni modèle, ni séance/,
    );
  });

  it('refuse des listes mal typées', () => {
    expect(() => parseBackup(JSON.stringify({ templates: 'oui', sessions: [] }))).toThrow(
      /doivent être des listes/,
    );
  });

  it('refuse un modèle incomplet', () => {
    expect(() => parseBackup(JSON.stringify({ templates: [{ id: 't' }], sessions: [] }))).toThrow(
      /modèle du fichier est incomplet/,
    );
  });

  it('refuse une séance incomplète', () => {
    expect(() =>
      parseBackup(JSON.stringify({ templates: [], sessions: [{ id: 'w', phases: [] }] })),
    ).toThrow(/séance du fichier est incomplète/);
  });
});

describe('backupFilename', () => {
  it('nomme le fichier avec la date du jour', () => {
    expect(backupFilename()).toMatch(/^seances-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
