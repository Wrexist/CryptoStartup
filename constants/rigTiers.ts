import Colors from './colors';

export interface RigTier {
  tier: number;
  name: string;
  shortName: string;
  hash: number;
  power: number;
  cooling: number;
  cost: number;
  color: string;
  glowColor: string;
  prestigeReq: number;
  description: string;
}

export const RIG_TIERS: RigTier[] = [
  {
    tier: 0,
    name: 'Basic Rig',
    shortName: 'Basic',
    hash: 10,
    power: 10,
    cooling: 8,
    cost: 800,
    color: Colors.accent,
    glowColor: Colors.accent + '30',
    prestigeReq: 0,
    description: 'Entry-level mining hardware. Reliable but limited hash output.',
  },
  {
    tier: 1,
    name: 'GPU Array',
    shortName: 'GPU',
    hash: 38,
    power: 25,
    cooling: 20,
    cost: 6000,
    color: Colors.accentGreen,
    glowColor: Colors.accentGreen + '30',
    prestigeReq: 0,
    description: 'Multi-GPU rig with dramatically improved hash rate per watt.',
  },
  {
    tier: 2,
    name: 'ASIC Blade',
    shortName: 'ASIC',
    hash: 150,
    power: 70,
    cooling: 50,
    cost: 32000,
    color: Colors.accentAmber,
    glowColor: Colors.accentAmber + '30',
    prestigeReq: 0,
    description: 'Purpose-built ASIC hardware. Maximum efficiency for serious operations.',
  },
  {
    tier: 3,
    name: 'Quantum Rig',
    shortName: 'QRig',
    hash: 600,
    power: 180,
    cooling: 120,
    cost: 200000,
    color: Colors.accentPurple,
    glowColor: Colors.accentPurple + '30',
    prestigeReq: 2,
    description: 'Experimental quantum-enhanced hardware. Requires prestige level 2+.',
  },
  {
    tier: 4,
    name: 'Fusion Core',
    shortName: 'Fusion',
    hash: 2000,
    power: 400,
    cooling: 280,
    cost: 1200000,
    color: Colors.accentCoral,
    glowColor: Colors.accentCoral + '30',
    prestigeReq: 4,
    description: 'Plasma-fusion powered compute array. The pinnacle of mining technology. Requires prestige level 4+.',
  },
];

export function getRigUpgradeCost(fromTier: number, toTier: number): number {
  const from = RIG_TIERS[fromTier];
  const to = RIG_TIERS[toTier];
  if (!from || !to || toTier <= fromTier) return 0;
  return to.cost - from.cost;
}

export function getTierByIndex(tier: number): RigTier {
  return RIG_TIERS[Math.max(0, Math.min(tier, RIG_TIERS.length - 1))];
}
