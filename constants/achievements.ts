export type AchievementBonusType =
  | 'income_pct'
  | 'insight_pct'
  | 'hash_pct'
  | 'cash_flat'
  | 'wear_pct'
  | 'bot_income_pct'
  | 'crash_income_pct'
  | 'mania_income_pct'
  | 'none';

export interface AchievementBonus {
  type: AchievementBonusType;
  value: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bonusDescription: string;
  bonus: AchievementBonus;
  hidden?: boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_rig',
    title: 'Boot Camp',
    description: 'Deploy your first mining rig.',
    icon: 'server',
    color: '#4A8FE7',
    bonusDescription: '+2% all income',
    bonus: { type: 'income_pct', value: 2 },
  },
  {
    id: 'five_rigs',
    title: 'Growing Operation',
    description: 'Run 5 mining rigs simultaneously.',
    icon: 'server',
    color: '#4A8FE7',
    bonusDescription: '+3% all income',
    bonus: { type: 'income_pct', value: 3 },
  },
  {
    id: 'full_district',
    title: 'District Boss',
    description: 'Fill all 9 mining rig slots.',
    icon: 'business',
    color: '#4A8FE7',
    bonusDescription: '+5% hash rate',
    bonus: { type: 'hash_pct', value: 5 },
  },
  {
    id: 'first_bot',
    title: 'Automated',
    description: 'Activate your first trading bot.',
    icon: 'hardware-chip',
    color: '#2DD4A0',
    bonusDescription: '+3% bot income',
    bonus: { type: 'bot_income_pct', value: 3 },
  },
  {
    id: 'all_bots',
    title: 'Bot Army',
    description: 'Have all 4 trading bots active at once.',
    icon: 'hardware-chip',
    color: '#2DD4A0',
    bonusDescription: '+10% bot income',
    bonus: { type: 'bot_income_pct', value: 10 },
  },
  {
    id: 'first_research',
    title: 'Curious Mind',
    description: 'Unlock your first research node.',
    icon: 'flask',
    color: '#9B7FE8',
    bonusDescription: '+5% insight generation',
    bonus: { type: 'insight_pct', value: 5 },
  },
  {
    id: 'all_research',
    title: 'Full Stack',
    description: 'Unlock all 18 research nodes.',
    icon: 'flask',
    color: '#9B7FE8',
    bonusDescription: '+15% all income',
    bonus: { type: 'income_pct', value: 15 },
  },
  {
    id: 'first_prestige',
    title: 'The Fork',
    description: 'Complete your first prestige (Fork).',
    icon: 'git-branch',
    color: '#F5A623',
    bonusDescription: '+10% income per run',
    bonus: { type: 'income_pct', value: 10 },
  },
  {
    id: 'third_prestige',
    title: 'Chain Veteran',
    description: 'Reach prestige level 3.',
    icon: 'git-branch',
    color: '#F5A623',
    bonusDescription: '+5% extra per prestige level',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'first_gpu',
    title: 'GPU Farmer',
    description: 'Upgrade a rig slot to GPU Array.',
    icon: 'desktop',
    color: '#2DD4A0',
    bonusDescription: '+3% GPU hash rate',
    bonus: { type: 'hash_pct', value: 3 },
  },
  {
    id: 'first_asic',
    title: 'ASIC Lord',
    description: 'Upgrade a rig slot to ASIC Blade.',
    icon: 'desktop',
    color: '#F5A623',
    bonusDescription: '+5% ASIC hash rate',
    bonus: { type: 'hash_pct', value: 5 },
  },
  {
    id: 'first_quantum',
    title: 'Quantum Leap',
    description: 'Operate a Quantum Rig.',
    icon: 'planet',
    color: '#9B7FE8',
    bonusDescription: '+8% Quantum hash rate',
    bonus: { type: 'hash_pct', value: 8 },
  },
  {
    id: 'million_earned',
    title: 'Millionaire',
    description: 'Earn $1,000,000 lifetime.',
    icon: 'cash',
    color: '#2DD4A0',
    bonusDescription: '+5% all income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'ten_million',
    title: 'Blockchain Baron',
    description: 'Earn $10,000,000 lifetime.',
    icon: 'cash',
    color: '#2DD4A0',
    bonusDescription: '+5% all income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'hundred_million',
    title: 'Crypto Legend',
    description: 'Earn $100,000,000 lifetime.',
    icon: 'trophy',
    color: '#F5A623',
    bonusDescription: '+10% all income',
    bonus: { type: 'income_pct', value: 10 },
  },
  {
    id: 'survive_crash',
    title: 'Bear Survivor',
    description: 'Earn income during a market Crash regime.',
    icon: 'trending-down',
    color: '#FF4F5E',
    bonusDescription: '+10% crash income',
    bonus: { type: 'crash_income_pct', value: 10 },
  },
  {
    id: 'mania_peak',
    title: 'Bull Rider',
    description: 'Earn $10,000+ during a single Mania regime.',
    icon: 'rocket',
    color: '#2DD4A0',
    bonusDescription: '+15% mania income',
    bonus: { type: 'mania_income_pct', value: 15 },
  },
  {
    id: 'wear_master',
    title: 'Pristine',
    description: 'Keep hardware wear at 0% for 20 consecutive ticks.',
    icon: 'shield-checkmark',
    color: '#2DD4A0',
    bonusDescription: '+5% uptime',
    bonus: { type: 'wear_pct', value: 5 },
  },
  {
    id: 'event_hero',
    title: 'Crisis Manager',
    description: 'Handle 10 random events.',
    icon: 'alert-circle',
    color: '#F5A623',
    bonusDescription: '+5% all income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'contract_pro',
    title: 'Contract Killer',
    description: 'Complete 10 contracts.',
    icon: 'document-text',
    color: '#4A8FE7',
    bonusDescription: '+8% all income',
    bonus: { type: 'income_pct', value: 8 },
  },
  {
    id: 'contract_legend',
    title: 'Mission Legend',
    description: 'Complete 50 contracts.',
    icon: 'document-text',
    color: '#F5A623',
    bonusDescription: '+12% all income',
    bonus: { type: 'income_pct', value: 12 },
  },
  {
    id: 'btc_whale',
    title: "Satoshi's Friend",
    description: 'Hold 1 full BTC in your portfolio.',
    icon: 'logo-bitcoin',
    color: '#F5A623',
    bonusDescription: '+5% mining income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'trader',
    title: 'Day Trader',
    description: 'Execute 20 manual crypto trades.',
    icon: 'swap-horizontal',
    color: '#4A8FE7',
    bonusDescription: '+3% trade return (lower fee)',
    bonus: { type: 'income_pct', value: 3 },
  },
  {
    id: 'max_infra',
    title: 'Infrastructure King',
    description: 'Have 7 Power Plants and 7 Cooling Hubs.',
    icon: 'construct',
    color: '#4A8FE7',
    bonusDescription: '+4% hash rate efficiency',
    bonus: { type: 'hash_pct', value: 4 },
  },
  // ─── Mid/Late-Game Achievements ──────────────────────────────────────────
  {
    id: 'cash_hoarder',
    title: 'Cash Hoarder',
    description: 'Hold $50,000 cash at once.',
    icon: 'wallet',
    color: '#2DD4A0',
    bonusDescription: '+3% all income',
    bonus: { type: 'income_pct', value: 3 },
  },
  {
    id: 'security_chief',
    title: 'Security Chief',
    description: 'Build 3 security offices.',
    icon: 'shield',
    color: '#9B7FE8',
    bonusDescription: '+3% all income',
    bonus: { type: 'income_pct', value: 3 },
  },
  {
    id: 'fort_knox',
    title: 'Fort Knox',
    description: 'Build 5 security offices.',
    icon: 'shield-checkmark',
    color: '#F5A623',
    bonusDescription: '+5% all income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'diversified',
    title: 'Diversified',
    description: 'Hold all 4 crypto assets simultaneously.',
    icon: 'pie-chart',
    color: '#4A8FE7',
    bonusDescription: '+5% all income',
    bonus: { type: 'income_pct', value: 5 },
  },
  {
    id: 'silicon_valley',
    title: 'Silicon Valley',
    description: 'Upgrade 3 rigs to ASIC Blade or higher.',
    icon: 'hardware-chip',
    color: '#F5A623',
    bonusDescription: '+6% hash rate',
    bonus: { type: 'hash_pct', value: 6 },
  },
  {
    id: 'veteran',
    title: 'Chain Veteran',
    description: 'Reach prestige level 5.',
    icon: 'medal',
    color: '#F5A623',
    bonusDescription: '+8% all income',
    bonus: { type: 'income_pct', value: 8 },
  },
  {
    id: 'billionaire',
    title: 'Crypto Billionaire',
    description: 'Earn $1,000,000,000 lifetime.',
    icon: 'diamond',
    color: '#9B7FE8',
    bonusDescription: '+12% all income',
    bonus: { type: 'income_pct', value: 12 },
  },
  {
    id: 'zen_master',
    title: 'Zen Master',
    description: 'Keep hardware at 0% wear for 100 consecutive ticks.',
    icon: 'leaf',
    color: '#2DD4A0',
    bonusDescription: '+8% uptime',
    bonus: { type: 'wear_pct', value: 8 },
  },
  {
    id: 'first_fusion',
    title: 'Nuclear Option',
    description: 'Upgrade a rig to Fusion Core tier.',
    icon: 'flame',
    color: '#FF6B6B',
    bonusDescription: '+10% hash rate',
    bonus: { type: 'hash_pct', value: 10 },
  },
  {
    id: 'district_legend',
    title: 'Chain Legend',
    description: 'Unlock all other achievements.',
    icon: 'star',
    color: '#F5A623',
    bonusDescription: '+25% everything',
    bonus: { type: 'income_pct', value: 25 },
    hidden: true,
  },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function computeAchievementBonuses(earnedIds: string[]): {
  incomePct: number;
  hashPct: number;
  insightPct: number;
  botIncomePct: number;
  crashIncomePct: number;
  maniaIncomePct: number;
  wearPct: number;
} {
  let incomePct = 0, hashPct = 0, insightPct = 0, botIncomePct = 0, crashIncomePct = 0, maniaIncomePct = 0, wearPct = 0;
  for (const id of earnedIds) {
    const def = getAchievementById(id);
    if (!def) continue;
    switch (def.bonus.type) {
      case 'income_pct': incomePct += def.bonus.value; break;
      case 'hash_pct': hashPct += def.bonus.value; break;
      case 'insight_pct': insightPct += def.bonus.value; break;
      case 'bot_income_pct': botIncomePct += def.bonus.value; break;
      case 'crash_income_pct': crashIncomePct += def.bonus.value; break;
      case 'mania_income_pct': maniaIncomePct += def.bonus.value; break;
      case 'wear_pct': wearPct += def.bonus.value; break;
    }
  }
  return { incomePct, hashPct, insightPct, botIncomePct, crashIncomePct, maniaIncomePct, wearPct };
}
