/** Libellés français du catalogue (source en anglais) et alias de recherche. */

export const MUSCLE_FR: Record<string, string> = {
  abdominals: 'Abdominaux',
  abductors: 'Abducteurs',
  adductors: 'Adducteurs',
  biceps: 'Biceps',
  calves: 'Mollets',
  chest: 'Pectoraux',
  forearms: 'Avant-bras',
  glutes: 'Fessiers',
  hamstrings: 'Ischio-jambiers',
  lats: 'Grand dorsal',
  'lower back': 'Lombaires',
  'middle back': 'Milieu du dos',
  neck: 'Cou',
  quadriceps: 'Quadriceps',
  shoulders: 'Épaules',
  traps: 'Trapèzes',
  triceps: 'Triceps',
};

/** Regroupements pour les filtres et les statistiques par groupe musculaire. */
export const MUSCLE_GROUPS: { id: string; label: string; muscles: string[] }[] = [
  { id: 'chest', label: 'Pectoraux', muscles: ['chest'] },
  { id: 'back', label: 'Dos', muscles: ['lats', 'middle back', 'lower back', 'traps'] },
  { id: 'shoulders', label: 'Épaules', muscles: ['shoulders', 'neck'] },
  { id: 'arms', label: 'Bras', muscles: ['biceps', 'triceps', 'forearms'] },
  {
    id: 'legs',
    label: 'Jambes',
    muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  },
  { id: 'core', label: 'Abdos / gainage', muscles: ['abdominals'] },
];

export const MUSCLE_TO_GROUP: Record<string, string> = Object.fromEntries(
  MUSCLE_GROUPS.flatMap((g) => g.muscles.map((m) => [m, g.id])),
);

export const EQUIPMENT_FR: Record<string, string> = {
  barbell: 'Barre',
  bands: 'Élastiques',
  'body only': 'Poids du corps',
  cable: 'Poulie',
  dumbbell: 'Haltères',
  'e-z curl bar': 'Barre EZ',
  'exercise ball': 'Swiss ball',
  'foam roll': 'Rouleau de massage',
  kettlebells: 'Kettlebell',
  machine: 'Machine',
  'medicine ball': 'Medicine ball',
  other: 'Autre',
};

export const CATEGORY_FR: Record<string, string> = {
  cardio: 'Cardio',
  'olympic weightlifting': 'Haltérophilie',
  plyometrics: 'Pliométrie',
  powerlifting: 'Force athlétique',
  strength: 'Musculation',
  stretching: 'Étirement',
  strongman: 'Strongman',
};

export const LEVEL_FR: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  expert: 'Confirmé',
};

export const FORCE_FR: Record<string, string> = {
  push: 'Poussée',
  pull: 'Tirage',
  static: 'Statique',
};

export const MECHANIC_FR: Record<string, string> = {
  compound: 'Polyarticulaire',
  isolation: 'Isolation',
};

export const SPORT_FR: Record<string, string> = {
  muscu: 'Musculation',
  cardio: 'Cardio',
  mobilite: 'Mobilité',
  course: 'Course à pied',
  velo: 'Vélo',
  natation: 'Natation',
  autre: 'Autre',
};

export const PHASE_FR: Record<string, string> = {
  warmup: 'Échauffement',
  main: 'Corps de séance',
  cooldown: 'Retour au calme',
};

export const SET_KIND_FR: Record<string, string> = {
  normal: 'Série',
  warmup: 'Échauffement',
  dropset: 'Dégressive',
  failure: 'Échec',
};

export function label(dict: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '—';
  return dict[key] ?? key;
}

/**
 * Ponts français → anglais : le catalogue est en anglais, on veut pouvoir
 * chercher « développé couché » ou « soulevé de terre ».
 * Chaque entrée : si le nom anglais contient un des `en`, les mots `fr`
 * rejoignent l'index de recherche de l'exercice.
 */
export const SEARCH_ALIASES: { en: string[]; fr: string[] }[] = [
  { en: ['bench press'], fr: ['developpe couche', 'bench'] },
  { en: ['incline'], fr: ['incline'] },
  { en: ['decline'], fr: ['decline'] },
  { en: ['military press', 'overhead press', 'shoulder press'], fr: ['developpe militaire', 'developpe epaules'] },
  { en: ['press'], fr: ['developpe', 'presse'] },
  { en: ['front squat'], fr: ['squat avant'] },
  { en: ['hack squat'], fr: ['hack squat'] },
  { en: ['squat'], fr: ['squat', 'flexion jambes'] },
  { en: ['romanian deadlift', 'stiff leg deadlift'], fr: ['souleve de terre roumain', 'sdt roumain'] },
  { en: ['deadlift'], fr: ['souleve de terre', 'sdt'] },
  { en: ['pull-up', 'pullup', 'chin-up', 'chinup'], fr: ['traction', 'tractions'] },
  { en: ['push-up', 'pushup'], fr: ['pompes'] },
  { en: ['dip'], fr: ['dips'] },
  { en: ['pulldown'], fr: ['tirage vertical', 'tirage poitrine', 'lat pulldown'] },
  { en: ['upright row'], fr: ['tirage menton', 'rowing menton'] },
  { en: ['row'], fr: ['rowing', 'tirage horizontal'] },
  { en: ['curl'], fr: ['curl', 'flexion bras'] },
  { en: ['pullover'], fr: ['pullover'] },
  { en: ['fly', 'flye'], fr: ['ecarte', 'ecartes'] },
  { en: ['pec deck'], fr: ['butterfly', 'pec deck'] },
  { en: ['lateral raise', 'side lateral'], fr: ['elevations laterales'] },
  { en: ['front raise'], fr: ['elevations frontales'] },
  { en: ['rear delt', 'reverse fly'], fr: ['arriere epaule', 'oiseau'] },
  { en: ['face pull'], fr: ['face pull', 'tirage visage'] },
  { en: ['shrug'], fr: ['shrug', 'haussement epaules'] },
  { en: ['lunge'], fr: ['fente', 'fentes'] },
  { en: ['step-up', 'step up'], fr: ['montee sur banc'] },
  { en: ['leg press'], fr: ['presse a cuisses'] },
  { en: ['leg curl'], fr: ['leg curl', 'ischios machine'] },
  { en: ['leg extension'], fr: ['leg extension', 'extension jambes'] },
  { en: ['hip thrust'], fr: ['hip thrust', 'poussee de hanches'] },
  { en: ['glute'], fr: ['fessier', 'fessiers'] },
  { en: ['calf'], fr: ['mollet', 'mollets'] },
  { en: ['crunch'], fr: ['crunch', 'abdos'] },
  { en: ['sit-up', 'situp'], fr: ['abdos', 'releve de buste'] },
  { en: ['plank'], fr: ['gainage', 'planche'] },
  { en: ['twist'], fr: ['rotation', 'russian twist'] },
  { en: ['hyperextension', 'back extension'], fr: ['extension lombaire', 'lombaires', 'banc a lombaires'] },
  { en: ['good morning'], fr: ['good morning'] },
  { en: ['triceps extension', 'skullcrusher', 'lying triceps'], fr: ['barre au front', 'extension triceps'] },
  { en: ['pushdown'], fr: ['extension triceps poulie'] },
  { en: ['clean'], fr: ['epaule'] },
  { en: ['snatch'], fr: ['arrache'] },
  { en: ['jerk'], fr: ['jete'] },
  { en: ['thruster'], fr: ['thruster'] },
  { en: ['burpee'], fr: ['burpee'] },
  { en: ['box jump'], fr: ['saut sur boite'] },
  { en: ['jump rope', 'rope jumping'], fr: ['corde a sauter'] },
  { en: ['muscle up'], fr: ['muscle up'] },
  { en: ['farmer'], fr: ['marche du fermier'] },
  { en: ['sled'], fr: ['traineau'] },
  { en: ['tire flip'], fr: ['retournement de pneu'] },
  { en: ['run', 'treadmill', 'jog'], fr: ['course', 'tapis de course', 'footing'] },
  { en: ['bike', 'cycling'], fr: ['velo', 'cardio'] },
  { en: ['rower', 'rowing machine', 'rowing, stationary'], fr: ['rameur'] },
  { en: ['leg raise', 'knee raise'], fr: ['releve de jambes', 'abdos'] },
  { en: ['glute bridge'], fr: ['pont fessier', 'fessiers'] },
  { en: ['chest press'], fr: ['developpe pectoraux'] },
  { en: ['jumping jack', 'mountain climber'], fr: ['cardio', 'echauffement'] },
  { en: ['elliptical'], fr: ['elliptique'] },
  { en: ['stretch'], fr: ['etirement', 'souplesse'] },
  { en: ['smith machine'], fr: ['smith machine', 'cadre guide'] },
  { en: ['cable'], fr: ['poulie', 'cable'] },
  { en: ['dumbbell'], fr: ['haltere', 'halteres'] },
  { en: ['barbell'], fr: ['barre'] },
  { en: ['kettlebell'], fr: ['kettlebell'] },
  { en: ['band'], fr: ['elastique'] },
  { en: ['machine'], fr: ['machine'] },
  { en: ['seated'], fr: ['assis'] },
  { en: ['standing'], fr: ['debout'] },
  { en: ['lying'], fr: ['allonge', 'couche'] },
  { en: ['close-grip', 'close grip'], fr: ['prise serree'] },
  { en: ['wide-grip', 'wide grip'], fr: ['prise large'] },
  { en: ['reverse'], fr: ['inverse'] },
  { en: ['one-arm', 'single-arm', 'one arm'], fr: ['unilateral', 'un bras'] },
  { en: ['one leg', 'single leg', 'pistol'], fr: ['unilateral', 'une jambe'] },
  { en: ['isometric'], fr: ['isometrique'] },
  { en: ['warm'], fr: ['echauffement'] },
];
