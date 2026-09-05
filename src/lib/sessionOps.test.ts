import { describe, expect, it } from 'vitest';
import {
  doneSetsCount,
  freeSession,
  sessionFromTemplate,
  sessionVolumeKg,
  templateFromSession,
  totalSetsCount,
} from './sessionOps';
import type { Template } from '@/types';

const template: Template = {
  id: 't1',
  name: 'Push',
  sport: 'muscu',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  timesUsed: 0,
  phases: [
    {
      id: 'p1',
      kind: 'warmup',
      name: 'Échauffement',
      items: [
        {
          id: 'e0',
          exerciseId: 'Rowing_Stationary',
          name: 'Rameur',
          tracking: 'time',
          sets: [{ id: 's0', kind: 'normal', durationSec: 300 }],
        },
      ],
    },
    {
      id: 'p2',
      kind: 'main',
      name: 'Corps de séance',
      items: [
        {
          id: 'e1',
          exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
          name: 'Développé couché à la barre',
          tracking: 'weight',
          restSec: 150,
          sets: [
            { id: 's1', kind: 'normal', reps: 8, weight: 60 },
            { id: 's2', kind: 'normal', reps: 8, weight: 60, restSec: 90 },
          ],
        },
      ],
    },
  ],
};

describe('sessionFromTemplate', () => {
  it('reprend la structure du modèle', () => {
    const session = sessionFromTemplate(template);
    expect(session.status).toBe('active');
    expect(session.templateId).toBe('t1');
    expect(session.phases.map((p) => p.kind)).toEqual(['warmup', 'main']);
    expect(totalSetsCount(session)).toBe(3);
    expect(doneSetsCount(session)).toBe(0);
  });

  it('pré-remplit la saisie avec les cibles', () => {
    const set = sessionFromTemplate(template).phases[1].items[0].sets[0];
    expect(set.targetReps).toBe(8);
    expect(set.targetWeight).toBe(60);
    expect(set.reps).toBe(8);
    expect(set.weight).toBe(60);
    expect(set.done).toBe(false);
  });

  it('hérite du repos de l’exercice, sauf réglage propre à la série', () => {
    const sets = sessionFromTemplate(template).phases[1].items[0].sets;
    expect(sets[0].restSec).toBe(150);
    expect(sets[1].restSec).toBe(90);
  });

  it('attribue de nouveaux identifiants', () => {
    const session = sessionFromTemplate(template);
    expect(session.phases[0].id).not.toBe('p1');
    expect(session.phases[1].items[0].sets[0].id).not.toBe('s1');
  });
});

describe('freeSession', () => {
  it('démarre avec un échauffement et un corps de séance vides', () => {
    const session = freeSession();
    expect(session.templateId).toBeUndefined();
    expect(session.phases.map((p) => p.kind)).toEqual(['warmup', 'main']);
    expect(totalSetsCount(session)).toBe(0);
  });
});

describe('sessionVolumeKg', () => {
  it('ne compte que les séries validées, hors échauffement', () => {
    const session = sessionFromTemplate(template);
    const sets = session.phases[1].items[0].sets;
    sets[0].done = true;
    sets[1].kind = 'warmup';
    sets[1].done = true;
    expect(sessionVolumeKg(session)).toBe(480);
  });

  it('vaut zéro quand rien n’est validé', () => {
    expect(sessionVolumeKg(sessionFromTemplate(template))).toBe(0);
  });
});

describe('templateFromSession', () => {
  it('reconstruit un modèle depuis une séance', () => {
    const session = sessionFromTemplate(template);
    session.phases[1].items[0].sets[0].weight = 65;
    const nouveau = templateFromSession(session, 'Push v2');
    expect(nouveau.name).toBe('Push v2');
    expect(nouveau.timesUsed).toBe(0);
    expect(nouveau.phases[1].items[0].sets[0].weight).toBe(65);
    expect(nouveau.id).not.toBe(template.id);
  });
});
