export interface CloutTier {
  level: number;
  nameEn: string;
  nameHe: string;
  color: string;
  cssClass: string;
  requiredSuccesses: number;
  maxUsers: number;
  timeWindowMinutes: number;
  minUsers: number;
}

export const CLOUT_TIERS: CloutTier[] = [
  {
    level: 1,
    nameEn: 'Newcomer',
    nameHe: 'חדש',
    color: '#8B8B8B',
    cssClass: 'tier-gray',
    requiredSuccesses: 0,
    minUsers: 3,
    maxUsers: 3,
    timeWindowMinutes: 1,
  },
  {
    level: 2,
    nameEn: 'Whisperer',
    nameHe: 'לוחש',
    color: '#4A9EFF',
    cssClass: 'tier-blue',
    requiredSuccesses: 5,
    minUsers: 3,
    maxUsers: 8,
    timeWindowMinutes: 2,
  },
  {
    level: 3,
    nameEn: 'Echo',
    nameHe: 'הד',
    color: '#34D399',
    cssClass: 'tier-green',
    requiredSuccesses: 10,
    minUsers: 3,
    maxUsers: 15,
    timeWindowMinutes: 3,
  },
  {
    level: 4,
    nameEn: 'Signal',
    nameHe: 'אות',
    color: '#FBBF24',
    cssClass: 'tier-yellow',
    requiredSuccesses: 15,
    minUsers: 3,
    maxUsers: 25,
    timeWindowMinutes: 4,
  },
  {
    level: 5,
    nameEn: 'Beacon',
    nameHe: 'מגדלור',
    color: '#F97316',
    cssClass: 'tier-orange',
    requiredSuccesses: 20,
    minUsers: 3,
    maxUsers: 40,
    timeWindowMinutes: 5,
  },
  {
    level: 6,
    nameEn: 'Siren',
    nameHe: 'צופר',
    color: '#EF4444',
    cssClass: 'tier-red',
    requiredSuccesses: 25,
    minUsers: 3,
    maxUsers: 70,
    timeWindowMinutes: 6,
  },
  {
    level: 7,
    nameEn: 'Oracle',
    nameHe: 'נביא',
    color: '#A855F7',
    cssClass: 'tier-purple',
    requiredSuccesses: 30,
    minUsers: 3,
    maxUsers: 120,
    timeWindowMinutes: 8,
  },
  {
    level: 8,
    nameEn: 'Phantom',
    nameHe: 'פנטום',
    color: '#EC4899',
    cssClass: 'tier-pink',
    requiredSuccesses: 35,
    minUsers: 3,
    maxUsers: 200,
    timeWindowMinutes: 10,
  },
  {
    level: 9,
    nameEn: 'Specter',
    nameHe: 'רוח',
    color: '#06B6D4',
    cssClass: 'tier-turquoise',
    requiredSuccesses: 40,
    minUsers: 3,
    maxUsers: 350,
    timeWindowMinutes: 12,
  },
  {
    level: 10,
    nameEn: 'Legend',
    nameHe: 'אגדה',
    color: '#FFD700',
    cssClass: 'tier-gold',
    requiredSuccesses: 50,
    minUsers: 3,
    maxUsers: 500,
    timeWindowMinutes: 15,
  },
];

export function getTierByLevel(level: number): CloutTier {
  return CLOUT_TIERS[Math.min(Math.max(level - 1, 0), CLOUT_TIERS.length - 1)];
}

export function getTierForSuccesses(totalSuccessesPerTier: number[]): CloutTier {
  let currentTier = 1;
  for (let i = 0; i < CLOUT_TIERS.length - 1; i++) {
    const nextTier = CLOUT_TIERS[i + 1];
    const successesAtThisTier = totalSuccessesPerTier[i] || 0;
    if (successesAtThisTier >= nextTier.requiredSuccesses) {
      currentTier = nextTier.level;
    } else {
      break;
    }
  }
  return getTierByLevel(currentTier);
}
