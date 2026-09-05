import { describe, expect, it } from 'vitest';
import { indexExercise, mediaUrl, youtubeId, youtubeSearchUrl, type CatalogExercise } from './catalog';
import { scoreMatch } from '@/lib/search';
import { tokenize } from '@/lib/search';

function exercise(patch: Partial<CatalogExercise> = {}): CatalogExercise {
  return {
    id: 'Barbell_Bench_Press_-_Medium_Grip',
    name: 'Développé couché à la barre',
    originalName: 'Barbell Bench Press - Medium Grip',
    category: 'strength',
    level: 'beginner',
    force: 'push',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [],
    images: ['Barbell_Bench_Press_-_Medium_Grip/0.jpg'],
    isCustom: false,
    ...patch,
  };
}

describe('indexExercise', () => {
  it('indexe le nom français et le nom anglais dans le champ fort', () => {
    const indexed = indexExercise(exercise());
    expect(indexed.name).toContain('developpe couche');
    expect(indexed.name).toContain('bench press');
  });

  it('ajoute les muscles en français et le matériel aux mots-clés', () => {
    const indexed = indexExercise(exercise());
    expect(indexed.keywords).toContain('pectoraux');
    expect(indexed.keywords).toContain('barre');
  });

  it('relègue les muscles secondaires dans le champ faible', () => {
    const indexed = indexExercise(exercise());
    expect(indexed.extra).toContain('triceps');
    expect(indexed.keywords).not.toContain('triceps');
  });

  it('déduit le groupe musculaire', () => {
    expect(indexExercise(exercise()).groups).toEqual(['chest']);
    expect(indexExercise(exercise({ primaryMuscles: ['hamstrings'] })).groups).toEqual(['legs']);
  });

  it('applique les alias français depuis le nom anglais', () => {
    const traction = indexExercise(
      exercise({ id: 'Pullups', name: 'Tractions (pronation)', originalName: 'Pullups' }),
    );
    expect(traction.keywords).toContain('traction');
  });

  it('fait remonter les exercices personnels', () => {
    const perso = indexExercise(exercise({ id: 'custom-1', isCustom: true }));
    expect(perso.boost).toBeGreaterThan(indexExercise(exercise()).boost);
  });
});

describe('classement des résultats', () => {
  const catalogue = [
    indexExercise(exercise()),
    indexExercise(
      exercise({
        id: 'Bench_Press_-_With_Bands',
        name: 'Bench Press - With Bands',
        originalName: undefined,
        equipment: 'bands',
      }),
    ),
    indexExercise(
      exercise({
        id: 'Machine_Bench_Press',
        name: 'Développé couché à la machine',
        originalName: 'Machine Bench Press',
        equipment: 'machine',
      }),
    ),
  ];

  const meilleur = (requete: string) => {
    const tokens = tokenize(requete);
    return catalogue
      .map((item) => ({ item, score: scoreMatch(item, tokens) }))
      .filter((r): r is { item: (typeof catalogue)[number]; score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score)[0]?.item.exercise.id;
  };

  it('place la variante canonique en tête, en français', () => {
    expect(meilleur('développé couché')).toBe('Barbell_Bench_Press_-_Medium_Grip');
  });

  it('fait de même pour la requête en anglais', () => {
    expect(meilleur('bench press')).toBe('Barbell_Bench_Press_-_Medium_Grip');
  });
});

describe('médias', () => {
  it('préfixe les chemins du catalogue selon la source choisie', () => {
    expect(mediaUrl('Exercice/0.jpg', 'github')).toContain('raw.githubusercontent.com');
    expect(mediaUrl('Exercice/0.jpg', 'jsdelivr')).toContain('cdn.jsdelivr.net');
    expect(mediaUrl('Exercice/0.jpg', 'none')).toBeNull();
  });

  it('laisse les URLs absolues intactes, même sans images', () => {
    const url = 'https://exemple.com/photo.jpg';
    expect(mediaUrl(url, 'none')).toBe(url);
  });

  it('extrait un identifiant YouTube de ses différentes formes', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=zQ82RYIFLN8')).toBe('zQ82RYIFLN8');
    expect(youtubeId('https://youtu.be/zQ82RYIFLN8')).toBe('zQ82RYIFLN8');
    expect(youtubeId('https://exemple.com/video.mp4')).toBeNull();
  });

  it('cherche en français quand le nom est traduit', () => {
    expect(youtubeSearchUrl(exercise())).toContain('musculation');
    expect(youtubeSearchUrl({ name: 'Ab Roller' })).toContain('exercise');
  });
});
