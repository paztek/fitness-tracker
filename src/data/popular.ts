/**
 * Exercices « classiques » remontés en tête des résultats de recherche.
 * Le catalogue contient des centaines de variantes ; sans ce coup de pouce,
 * « développé couché » ferait remonter n'importe quelle variante à bandes.
 */
export const POPULAR_EXERCISE_IDS: string[] = [
  // Pectoraux
  'Barbell_Bench_Press_-_Medium_Grip',
  'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Dumbbell_Bench_Press',
  'Incline_Dumbbell_Press',
  'Dumbbell_Flyes',
  'Cable_Crossover',
  'Machine_Bench_Press',
  'Pushups',
  'Dips_-_Chest_Version',
  // Dos
  'Pullups',
  'Chin-Up',
  'Wide-Grip_Lat_Pulldown',
  'Close-Grip_Front_Lat_Pulldown',
  'Bent_Over_Barbell_Row',
  'One-Arm_Dumbbell_Row',
  'Seated_Cable_Rows',
  'Lying_T-Bar_Row',
  'Face_Pull',
  'Barbell_Shrug',
  'Dumbbell_Shrug',
  'Hyperextensions_Back_Extensions',
  // Épaules
  'Dumbbell_Shoulder_Press',
  'Seated_Dumbbell_Press',
  'Standing_Military_Press',
  'Arnold_Dumbbell_Press',
  'Side_Lateral_Raise',
  'Front_Dumbbell_Raise',
  'Reverse_Flyes',
  'Barbell_Rear_Delt_Row',
  'Upright_Barbell_Row',
  // Bras
  'Barbell_Curl',
  'Dumbbell_Bicep_Curl',
  'Hammer_Curls',
  'Preacher_Curl',
  'Triceps_Pushdown',
  'Triceps_Pushdown_-_Rope_Attachment',
  'Lying_Triceps_Press',
  'Close-Grip_Barbell_Bench_Press',
  'Standing_Dumbbell_Triceps_Extension',
  'Cable_Rope_Overhead_Triceps_Extension',
  'Dips_-_Triceps_Version',
  // Jambes / fessiers
  'Barbell_Squat',
  'Front_Barbell_Squat',
  'Bodyweight_Squat',
  'Barbell_Deadlift',
  'Romanian_Deadlift',
  'Sumo_Deadlift',
  'Leg_Press',
  'Leg_Extensions',
  'Lying_Leg_Curls',
  'Seated_Leg_Curl',
  'Barbell_Lunge',
  'Dumbbell_Lunges',
  'Bodyweight_Walking_Lunge',
  'Barbell_Hip_Thrust',
  'Barbell_Glute_Bridge',
  'Glute_Ham_Raise',
  'Good_Morning',
  'Standing_Calf_Raises',
  'Seated_Calf_Raise',
  // Abdos / gainage
  'Plank',
  'Crunches',
  'Sit-Up',
  'Decline_Crunch',
  'Cable_Crunch',
  'Ab_Crunch_Machine',
  'Hanging_Leg_Raise',
  'Flat_Bench_Lying_Leg_Raise',
  'Russian_Twist',
  'Air_Bike',
  'Mountain_Climbers',
  'Superman',
  // Cardio / haltérophilie
  'Jogging_Treadmill',
  'Running_Treadmill',
  'Bicycling_Stationary',
  'Rowing_Stationary',
  'Elliptical_Trainer',
  'One-Arm_Kettlebell_Swings',
  'Power_Clean',
  'Clean_and_Jerk',
  'Snatch',
];

/** Position dans la liste ci-dessus : plus l'exercice est canonique, plus il monte. */
const POPULAR_RANK = new Map(POPULAR_EXERCISE_IDS.map((id, index) => [id, index]));

/** Variantes de niche : présentes au catalogue, mais reléguées en fin de liste. */
const NICHE_PATTERNS = [
  ' with bands',
  ' with chains',
  '-smr',
  ' smr',
  'suspended',
  'band assisted',
  'partial',
  'to a bench',
];

/** Bonus de pertinence appliqué au score de recherche. */
export function prominenceBoost(
  id: string,
  name: string,
  mechanic: string | null,
  equipment: string | null,
): number {
  const rank = POPULAR_RANK.get(id);
  if (rank !== undefined) return 130 - rank;

  const lower = name.toLowerCase();
  if (NICHE_PATTERNS.some((pattern) => lower.includes(pattern))) return -40;

  let boost = 0;
  if (mechanic === 'compound') boost += 8;
  if (equipment === 'barbell' || equipment === 'dumbbell') boost += 6;
  else if (equipment === 'body only' || equipment === 'cable') boost += 4;
  else if (equipment === 'machine') boost += 2;
  return boost;
}
