import { describe, expect, it } from 'vitest';
import { normalize, scoreMatch, tokenize, type Searchable } from './search';

function item(name: string, keywords = '', extra = '', boost = 0): Searchable {
  return { name: normalize(name), keywords: normalize(keywords), extra: normalize(extra), boost };
}

describe('normalize', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(normalize('Développé Couché — prise serrée')).toBe(
      'developpe couche prise serree',
    );
    expect(normalize("Child's Pose")).toBe('child s pose');
    expect(normalize('Dips - Triceps Version')).toBe('dips triceps version');
  });
});

describe('tokenize', () => {
  it('découpe la requête en jetons', () => {
    expect(tokenize('  Squat   BARRE ')).toEqual(['squat', 'barre']);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('scoreMatch', () => {
  const bench = item('developpe couche a la barre barbell bench press', 'pectoraux barre');

  it('exige tous les jetons (recherche en ET)', () => {
    expect(scoreMatch(bench, ['developpe', 'couche'])).not.toBeNull();
    expect(scoreMatch(bench, ['developpe', 'squat'])).toBeNull();
  });

  it('accepte une requête vide', () => {
    expect(scoreMatch(bench, [])).toBe(0);
  });

  it('privilégie le nom sur les mots-clés', () => {
    const parNom = item('rowing barre');
    const parMotCle = item('exercice inconnu', 'rowing barre');
    expect(scoreMatch(parNom, ['rowing'])!).toBeGreaterThan(scoreMatch(parMotCle, ['rowing'])!);
  });

  it('privilégie les mots-clés sur le champ faible', () => {
    const parMotCle = item('exercice', 'ischio jambiers');
    const parExtra = item('exercice', '', 'ischio jambiers');
    expect(scoreMatch(parMotCle, ['ischio'])!).toBeGreaterThan(scoreMatch(parExtra, ['ischio'])!);
  });

  it('récompense la locution complète', () => {
    const locution = item('developpe couche a la barre');
    const jetonsEpars = item('developpe militaire couche au sol');
    expect(scoreMatch(locution, ['developpe', 'couche'])!).toBeGreaterThan(
      scoreMatch(jetonsEpars, ['developpe', 'couche'])!,
    );
  });

  it('départage deux variantes par la notoriété', () => {
    const canonique = item('developpe couche a la barre', '', '', 130);
    const obscure = item('developpe couche a la barre avec elastiques', '', '', -40);
    expect(scoreMatch(canonique, ['developpe', 'couche'])!).toBeGreaterThan(
      scoreMatch(obscure, ['developpe', 'couche'])!,
    );
  });
});
