/** Recherche texte tolérante aux accents, à la casse et à la ponctuation. */

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(query: string): string[] {
  return normalize(query).split(' ').filter(Boolean);
}

export interface Searchable {
  /** Nom de l'exercice, normalisé. */
  name: string;
  /** Synonymes français, muscles principaux, matériel. */
  keywords: string;
  /** Muscles secondaires, catégorie, niveau : signal plus faible. */
  extra: string;
  /** Notoriété de l'exercice : départage les centaines de variantes. */
  boost: number;
}

function fieldScore(haystack: string, token: string, base: number): number | null {
  const at = haystack.indexOf(token);
  if (at < 0) return null;
  let score = base;
  if (at === 0) score += base * 0.6;
  else if (haystack[at - 1] === ' ') score += base * 0.3;
  return score;
}

/**
 * Score un élément pour une requête déjà découpée en jetons.
 * Tous les jetons doivent être présents (recherche en ET) ; sinon `null`.
 */
export function scoreMatch(item: Searchable, tokens: string[]): number | null {
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    const hit =
      fieldScore(item.name, token, 100) ??
      fieldScore(item.keywords, token, 40) ??
      fieldScore(item.extra, token, 12);
    if (hit === null) return null;
    score += hit;
  }

  // Bonus de locution : « développé couché » doit battre « développé » + « couché ».
  if (tokens.length > 1) {
    const phrase = tokens.join(' ');
    if (item.name.includes(phrase)) score += 250;
    else if (item.keywords.includes(phrase)) score += 150;
  }

  // À score égal, le nom le plus court colle le mieux à la requête.
  score -= Math.min(20, item.name.length / 6);
  return score + item.boost;
}
