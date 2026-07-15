import { BananaSkin } from './types';

export const DEFAULT_SKIN_ID = 'classic_nano';

export const ALL_SKINS: BananaSkin[] = [
  {
    id: 'classic_nano',
    name: 'Classic Nano',
    rarity: 'Common',
    description: 'The standard issue delicious yellow banana. Humble and reliable.',
    bpsMultiplier: 1.0,
    clickMultiplier: 1.0,
    colorFrom: '#FEF08A', // yellow-200
    colorTo: '#EAB308',   // yellow-500
    glowColor: 'rgba(234, 179, 8, 0.3)',
    emoji: '🍌',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
  },
  {
    id: 'zombie_peel',
    name: 'Zombie Peel',
    rarity: 'Rare',
    description: 'A decaying green banana. Spooky, but gives +15% Clicking Power!',
    bpsMultiplier: 1.0,
    clickMultiplier: 1.15,
    colorFrom: '#86EFAC', // green-300
    colorTo: '#15803D',   // green-700
    glowColor: 'rgba(21, 128, 61, 0.4)',
    emoji: '🧟',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  {
    id: 'hacker_matrix',
    name: 'Hacker Matrix',
    rarity: 'Rare',
    description: 'Dripping in green terminal code. Passive income boosts by +15%!',
    bpsMultiplier: 1.15,
    clickMultiplier: 1.0,
    colorFrom: '#22C55E', // green-500
    colorTo: '#022C22',   // green-950
    glowColor: 'rgba(34, 197, 94, 0.4)',
    emoji: '📟',
    badgeColor: 'bg-green-950 text-green-300 border-green-800',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Retro Cyberpunk',
    rarity: 'Rare',
    description: 'Synthwave aesthetics. +10% Clicks and +10% Passive BPS!',
    bpsMultiplier: 1.1,
    clickMultiplier: 1.1,
    colorFrom: '#FF007F', // hot pink
    colorTo: '#00FFFF',   // neon cyan
    glowColor: 'rgba(255, 0, 127, 0.5)',
    emoji: '👾',
    badgeColor: 'bg-pink-950 text-pink-300 border-pink-800',
  },
  {
    id: 'imperial_golden',
    name: 'Imperial Golden',
    rarity: 'Epic',
    description: 'Forged in royal gold. Boosts both Clicking and Passive power by +25%!',
    bpsMultiplier: 1.25,
    clickMultiplier: 1.25,
    colorFrom: '#FDE047', // yellow-300
    colorTo: '#CA8A04',   // yellow-600
    glowColor: 'rgba(251, 191, 36, 0.6)',
    emoji: '👑',
    badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-700',
  },
  {
    id: 'cosmic_void',
    name: 'Cosmic Void',
    rarity: 'Epic',
    description: 'Formed from dark nebula matter. Boosts Passive BPS by +40%!',
    bpsMultiplier: 1.4,
    clickMultiplier: 1.0,
    colorFrom: '#6366F1', // indigo-500
    colorTo: '#0F172A',   // slate-900
    glowColor: 'rgba(99, 102, 241, 0.5)',
    emoji: '🌌',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
  },
  {
    id: 'gamer_rgb',
    name: 'Gamer RGB',
    rarity: 'Legendary',
    description: 'Constantly overclocked. Grants a massive +50% Clicking Power!',
    bpsMultiplier: 1.0,
    clickMultiplier: 1.5,
    colorFrom: '#EC4899', // pink-500
    colorTo: '#3B82F6',   // blue-500
    glowColor: 'rgba(236, 72, 153, 0.6)',
    emoji: '🎮',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
  },
  {
    id: 'diamond_ice',
    name: 'Diamond Ice',
    rarity: 'Legendary',
    description: 'Frozen crystal diamond casing. Passive BPS increased by +60%!',
    bpsMultiplier: 1.6,
    clickMultiplier: 1.0,
    colorFrom: '#E0F2FE', // sky-100
    colorTo: '#0284C7',   // sky-600
    glowColor: 'rgba(14, 165, 233, 0.6)',
    emoji: '💎',
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
  },
  {
    id: 'magma_ember',
    name: 'Magma Ember',
    rarity: 'Mythic',
    description: 'Core temperature exceeds 5,000°C. Double (+100%) Clicking Power!',
    bpsMultiplier: 1.2,
    clickMultiplier: 2.0,
    colorFrom: '#F97316', // orange-500
    colorTo: '#7F1D1D',   // red-950
    glowColor: 'rgba(249, 115, 22, 0.8)',
    emoji: '🔥',
    badgeColor: 'bg-orange-950 text-orange-400 border-orange-700 ring-1 ring-orange-500/50',
  },
  {
    id: 'stellar_supernova',
    name: 'Stellar Supernova',
    rarity: 'Mythic',
    description: 'The absolute pinnacle of fruit evolution. Double BPS and Double Clicks!',
    bpsMultiplier: 2.0,
    clickMultiplier: 2.0,
    colorFrom: '#FFFFFF', // white
    colorTo: '#A855F7',   // purple-500
    glowColor: 'rgba(255, 255, 255, 0.9)',
    emoji: '⭐',
    badgeColor: 'bg-purple-950 text-fuchsia-300 border-fuchsia-700 ring-1 ring-fuchsia-500/50',
  },
];

export function getSkinById(id: string): BananaSkin {
  return ALL_SKINS.find((skin) => skin.id === id) || ALL_SKINS[0];
}

// Generate random skin based on custom drop weights
// Common: 45%, Rare: 30%, Epic: 15%, Legendary: 8%, Mythic: 2%
export function drawRandomSkin(): BananaSkin {
  const roll = Math.random() * 100;
  let targetRarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' = 'Common';

  if (roll < 2) {
    targetRarity = 'Mythic';
  } else if (roll < 10) {
    targetRarity = 'Legendary';
  } else if (roll < 25) {
    targetRarity = 'Epic';
  } else if (roll < 55) {
    targetRarity = 'Rare';
  } else {
    targetRarity = 'Common';
  }

  // Filter skins of target rarity
  const possibleSkins = ALL_SKINS.filter((s) => s.rarity === targetRarity);
  if (possibleSkins.length === 0) {
    // fallback to rare or epic
    return ALL_SKINS[1];
  }
  
  const randIdx = Math.floor(Math.random() * possibleSkins.length);
  return possibleSkins[randIdx];
}
