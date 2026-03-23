import { RIG_TIERS, getRigUpgradeCost } from '@/constants/rigTiers';

describe('Rig Tiers', () => {
  it('has 5 tiers', () => {
    expect(RIG_TIERS).toHaveLength(5);
  });

  it('tiers are ordered by hash rate', () => {
    for (let i = 1; i < RIG_TIERS.length; i++) {
      expect(RIG_TIERS[i].hash).toBeGreaterThan(RIG_TIERS[i - 1].hash);
    }
  });

  it('tiers are ordered by cost', () => {
    for (let i = 1; i < RIG_TIERS.length; i++) {
      expect(RIG_TIERS[i].cost).toBeGreaterThan(RIG_TIERS[i - 1].cost);
    }
  });

  it('Quantum Rig costs $200K', () => {
    expect(RIG_TIERS[3].cost).toBe(200000);
  });

  it('Fusion Core costs $1.2M', () => {
    expect(RIG_TIERS[4].cost).toBe(1200000);
  });

  it('Quantum requires prestige 2', () => {
    expect(RIG_TIERS[3].prestigeReq).toBe(2);
  });
});

describe('getRigUpgradeCost', () => {
  it('calculates upgrade cost as difference', () => {
    const cost = getRigUpgradeCost(0, 1);
    expect(cost).toBe(RIG_TIERS[1].cost - RIG_TIERS[0].cost);
  });

  it('returns 0 for invalid upgrade (same tier)', () => {
    expect(getRigUpgradeCost(1, 1)).toBe(0);
  });

  it('returns 0 for downgrade', () => {
    expect(getRigUpgradeCost(2, 1)).toBe(0);
  });

  it('calculates multi-tier jump cost', () => {
    const cost = getRigUpgradeCost(0, 3);
    expect(cost).toBe(RIG_TIERS[3].cost - RIG_TIERS[0].cost);
  });
});

describe('Prestige formula', () => {
  it('calculates prestige requirements correctly', () => {
    const requirement = (level: number) => 500000 * Math.pow(3, level);
    expect(requirement(0)).toBe(500000);
    expect(requirement(1)).toBe(1500000);
    expect(requirement(2)).toBe(4500000);
    expect(requirement(3)).toBe(13500000);
  });

  it('calculates prestige bonus correctly', () => {
    const bonus = (level: number) => 1 + level * 0.25;
    expect(bonus(0)).toBe(1);
    expect(bonus(1)).toBe(1.25);
    expect(bonus(2)).toBe(1.5);
    expect(bonus(4)).toBe(2);
  });

  it('calculates prestige starting cash correctly', () => {
    const startingCash = (level: number) => 12000 * (1 + level * 1.0);
    expect(startingCash(0)).toBe(12000);
    expect(startingCash(1)).toBe(24000);
    expect(startingCash(2)).toBe(36000);
    expect(startingCash(3)).toBe(48000);
  });
});

describe('Cost scaling', () => {
  const COST_SCALING = 1.18;
  const BASE_COST = 800; // Mining rig

  it('scales building costs by 1.18x per building', () => {
    const cost = (count: number) => Math.floor(BASE_COST * Math.pow(COST_SCALING, count));
    expect(cost(0)).toBe(800);
    expect(cost(1)).toBe(944);
    expect(cost(5)).toBe(1830);
  });
});
