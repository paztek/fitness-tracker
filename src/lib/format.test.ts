import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatDuration,
  formatWeight,
  plural,
  round,
  weekKey,
} from './format';

describe('formatWeight', () => {
  it('affiche les kilogrammes avec la virgule française', () => {
    expect(formatWeight(62.5)).toBe('62,5 kg');
    expect(formatWeight(60)).toBe('60 kg');
  });

  it('arrondit au dixième', () => {
    expect(formatWeight(77.083)).toBe('77,1 kg');
  });

  it('rend un tiret pour une charge absente', () => {
    expect(formatWeight(undefined)).toBe('—');
    expect(formatWeight(Number.NaN)).toBe('—');
  });
});

describe('formatClock', () => {
  it('formate en minutes:secondes', () => {
    expect(formatClock(95)).toBe('1:35');
    expect(formatClock(0)).toBe('0:00');
  });

  it('ajoute les heures au-delà de 3600 s', () => {
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('ne descend jamais sous zéro', () => {
    expect(formatClock(-10)).toBe('0:00');
  });
});

describe('formatDuration', () => {
  it('reste en secondes sous la minute', () => {
    expect(formatDuration(45)).toBe('45 s');
  });

  it('donne minutes et secondes pour une durée courte', () => {
    expect(formatDuration(95)).toBe('1 min 35 s');
  });

  it('passe aux heures pour une longue séance', () => {
    expect(formatDuration(4200)).toBe('1 h 10 min');
  });
});

describe('plural', () => {
  it('accorde selon le nombre', () => {
    expect(plural(0, 'séance')).toBe('0 séance');
    expect(plural(1, 'séance')).toBe('1 séance');
    expect(plural(3, 'séance')).toBe('3 séances');
  });
});

describe('round', () => {
  it('arrondit au nombre de décimales demandé', () => {
    expect(round(2.345, 2)).toBe(2.35);
    expect(round(2.345, 0)).toBe(2);
  });
});

describe('weekKey', () => {
  it('regroupe les jours d’une même semaine ISO', () => {
    const lundi = weekKey('2026-09-07T08:00:00.000Z');
    const dimanche = weekKey('2026-09-13T20:00:00.000Z');
    expect(lundi).toBe(dimanche);
  });

  it('sépare deux semaines consécutives', () => {
    expect(weekKey('2026-09-06T12:00:00.000Z')).not.toBe(weekKey('2026-09-07T12:00:00.000Z'));
  });
});
