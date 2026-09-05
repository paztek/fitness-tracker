/** Toutes les charges de l'application sont exprimées en kilogrammes. */
export const WEIGHT_UNIT = 'kg';

/** Arrondi « propre » : 2 décimales max, sans zéros inutiles. */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** « 62,5 kg ». Toutes les charges passent par ici. */
export function formatWeight(kg: number | undefined): string {
  if (kg === undefined || Number.isNaN(kg)) return '—';
  return `${formatNumber(round(kg, 1), 1)} ${WEIGHT_UNIT}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: decimals,
  }).format(value);
}

/** 95 → « 1:35 », 3725 → « 1:02:05 ». */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** 95 → « 1 min 35 s », 3725 → « 1 h 2 min ». */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  const sec = s % 60;
  return sec > 0 && s < 600 ? `${m} min ${sec} s` : `${m} min`;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const dateShortFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return dateShortFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

const DAY_MS = 86_400_000;

/** « Aujourd'hui », « Hier », « Il y a 4 jours », sinon la date courte. */
export function formatRelativeDay(iso: string): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(new Date(iso))) / DAY_MS);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 14) return 'La semaine dernière';
  if (days < 60) return `Il y a ${Math.round(days / 7)} semaines`;
  return formatDateShort(iso);
}

/** « 1 séance », « 3 séances » — accord automatique du pluriel. */
export function plural(count: number, singular: string, suffix = 's'): string {
  return `${formatNumber(count)} ${singular}${count > 1 ? suffix : ''}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Clé ISO d'une semaine, pour regrouper les séances. */
export function weekKey(iso: string): string {
  const d = new Date(iso);
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * DAY_MS) -
        ((firstThursday.getUTCDay() + 6) % 7) / 7,
    );
  return `${target.getUTCFullYear()}-S${String(week).padStart(2, '0')}`;
}
