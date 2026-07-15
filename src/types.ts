export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface BananaSkin {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  bpsMultiplier: number; // e.g. 1.1 = +10% BPS
  clickMultiplier: number; // e.g. 1.2 = +20% click power
  colorFrom: string; // Tailwind color class or hex
  colorTo: string;
  glowColor: string;
  emoji: string;
  badgeColor: string;
}

export interface Upgrade {
  id: string;
  name: string;
  cost: number;
  baseCost: number;
  bpsToAdd: number;
  clickPowerToAdd: number;
  count: number;
  iconName: string;
  description: string;
}

export interface FlyingNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  isCrit?: boolean;
}

export interface GoldenSpawn {
  id: number;
  x: number; // 0 to 100 percentage
  y: number;
  value: number;
  scale: number;
  speedY: number;
  speedX: number;
}
