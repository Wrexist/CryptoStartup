export type EventEffectType =
  | 'wear_add'
  | 'hash_mult_temp'
  | 'income_mult_temp'
  | 'wear_mult_temp'
  | 'bot_disable_temp'
  | 'cash_add'
  | 'insight_add'
  | 'no_effect';

export interface EventEffect {
  type: EventEffectType;
  value: number;
  durationTicks?: number;
  label: string;
}

export interface GameEventChoice {
  label: string;
  costCash?: number;
  costInsight?: number;
  effectDescription: string;
  recommended?: boolean;
  effect: EventEffect;
}

export interface GameEventTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'incident' | 'opportunity' | 'market_news';
  minRigs: number;
  fireEffect?: EventEffect;
  choices: GameEventChoice[];
}

export const GAME_EVENTS: GameEventTemplate[] = [
  {
    id: 'power_surge',
    title: 'Power Surge Detected',
    description: 'A sudden voltage spike is hitting your power infrastructure. Act fast to protect your rigs from immediate hardware damage.',
    icon: 'flash',
    color: '#FF4F5E',
    type: 'incident',
    minRigs: 1,
    fireEffect: { type: 'wear_add', value: 20, label: '+20 Wear' },
    choices: [
      {
        label: 'Emergency Shield',
        costCash: 800,
        effectDescription: 'Deploy surge protectors. Prevent all wear damage.',
        recommended: true,
        effect: { type: 'wear_add', value: -20, label: 'Prevented surge damage' },
      },
      {
        label: 'Divert Power',
        costCash: 250,
        effectDescription: 'Redistribute load. Reduce damage by 60%.',
        effect: { type: 'wear_add', value: -12, label: 'Reduced surge damage' },
      },
      {
        label: 'Accept Damage',
        effectDescription: 'Ride it out. Full +20 wear applied.',
        effect: { type: 'no_effect', value: 0, label: 'No action taken' },
      },
    ],
  },
  {
    id: 'flash_crash',
    title: 'Market Flash Crash',
    description: 'Crypto markets are dumping hard. A whale just liquidated $200M. Your mining income is collapsing in real-time.',
    icon: 'trending-down',
    color: '#FF4F5E',
    type: 'market_news',
    minRigs: 0,
    fireEffect: { type: 'income_mult_temp', value: 0.3, durationTicks: 40, label: '-70% income (2 min)' },
    choices: [
      {
        label: 'Short Positions',
        costCash: 1500,
        effectDescription: 'Profit from the crash. +60 instant insight.',
        recommended: true,
        effect: { type: 'insight_add', value: 60, label: '+60 Insight from shorting' },
      },
      {
        label: 'Emergency Sell',
        effectDescription: 'Liquidate 15% of holdings at 92% price to raise cash.',
        effect: { type: 'cash_add', value: 0, label: 'Partial holdings liquidated' },
      },
      {
        label: 'Ride It Out',
        effectDescription: 'Hold steady. Crash income debuff applies.',
        effect: { type: 'no_effect', value: 0, label: 'Waiting out the crash' },
      },
    ],
  },
  {
    id: 'hw_defect',
    title: 'Hardware Defect Notice',
    description: 'A batch defect alert from your rig manufacturer. Affected units are running at reduced efficiency.',
    icon: 'alert-circle',
    color: '#F5A623',
    type: 'incident',
    minRigs: 2,
    fireEffect: { type: 'hash_mult_temp', value: 0.75, durationTicks: 60, label: '-25% hash rate (3 min)' },
    choices: [
      {
        label: 'Emergency Repair',
        costCash: 1400,
        effectDescription: 'Full emergency fix. Remove hash rate penalty immediately.',
        recommended: true,
        effect: { type: 'hash_mult_temp', value: 1.0, durationTicks: 0, label: 'Defect repaired' },
      },
      {
        label: 'Patch Kit',
        costCash: 450,
        effectDescription: 'Partial fix. Reduce penalty to -10% hash rate.',
        effect: { type: 'hash_mult_temp', value: 0.9, durationTicks: 60, label: '-10% hash (partial fix)' },
      },
      {
        label: 'Keep Running',
        effectDescription: 'Ignore the defect. -25% hash rate for 3 minutes.',
        effect: { type: 'no_effect', value: 0, label: 'Defect unresolved' },
      },
    ],
  },
  {
    id: 'security_breach',
    title: 'Security Breach Detected',
    description: 'Unauthorized access detected in your trading systems. Your bots are compromised and have been automatically suspended.',
    icon: 'shield',
    color: '#FF4F5E',
    type: 'incident',
    minRigs: 0,
    fireEffect: { type: 'bot_disable_temp', value: 1, durationTicks: 40, label: 'Bots disabled (2 min)' },
    choices: [
      {
        label: 'Patch Immediately',
        costCash: 1000,
        effectDescription: 'Full security patch. Bots restored in 1 minute.',
        recommended: true,
        effect: { type: 'bot_disable_temp', value: 1, durationTicks: 20, label: 'Bots restore in 1 min' },
      },
      {
        label: 'Manual Override',
        costCash: 350,
        effectDescription: 'Half patch. Bots run at 50% for 2 minutes.',
        effect: { type: 'income_mult_temp', value: 0.5, durationTicks: 40, label: 'Bots at 50% capacity' },
      },
      {
        label: 'Full Lockdown',
        effectDescription: 'Maintain lockdown. Bots offline for full 2 minutes.',
        effect: { type: 'no_effect', value: 0, label: 'Bots suspended' },
      },
    ],
  },
  {
    id: 'mining_pool_bonus',
    title: 'Lucky Block Found!',
    description: 'Your mining pool just hit a lucky block at optimal difficulty. Windfall profits incoming — this is what you mine for.',
    icon: 'diamond',
    color: '#2DD4A0',
    type: 'opportunity',
    minRigs: 1,
    choices: [
      {
        label: 'Collect Reward',
        effectDescription: 'Claim your lucky block payout. Instant cash windfall!',
        recommended: true,
        effect: { type: 'cash_add', value: 5000, label: '+$5,000 lucky block' },
      },
      {
        label: 'Reinvest',
        effectDescription: 'Convert to insight for research. +80 insight instead.',
        effect: { type: 'insight_add', value: 80, label: '+80 Insight from reinvestment' },
      },
    ],
  },
  {
    id: 'regulatory_alert',
    title: 'Regulatory Crackdown',
    description: 'Authorities are tightening crypto mining regulations in your region. Operations must be scaled back to avoid scrutiny.',
    icon: 'megaphone',
    color: '#F5A623',
    type: 'market_news',
    minRigs: 2,
    fireEffect: { type: 'income_mult_temp', value: 0.6, durationTicks: 60, label: '-40% income (3 min)' },
    choices: [
      {
        label: 'Compliance Package',
        costCash: 2800,
        effectDescription: 'Full regulatory compliance. Reduce penalty to -10%.',
        recommended: true,
        effect: { type: 'income_mult_temp', value: 0.9, durationTicks: 60, label: 'Income at 90%' },
      },
      {
        label: 'Lobby Officials',
        costCash: 1200,
        effectDescription: 'Political influence. Reduce penalty to -25%.',
        effect: { type: 'income_mult_temp', value: 0.75, durationTicks: 60, label: 'Income at 75%' },
      },
      {
        label: 'Shadow Mode',
        effectDescription: 'Operate quietly. Full -40% but gain +30 insight.',
        effect: { type: 'insight_add', value: 30, label: '+30 Insight, income penalty' },
      },
    ],
  },
  {
    id: 'cooling_leak',
    title: 'Cooling System Leak',
    description: 'A coolant leak has been detected in your thermal management system. Wear is accelerating rapidly.',
    icon: 'thermometer',
    color: '#F5A623',
    type: 'incident',
    minRigs: 1,
    fireEffect: { type: 'wear_mult_temp', value: 3.0, durationTicks: 40, label: '3× wear rate (2 min)' },
    choices: [
      {
        label: 'Emergency Repair',
        costCash: 750,
        effectDescription: 'Seal the leak immediately. Cancel wear rate increase.',
        recommended: true,
        effect: { type: 'wear_mult_temp', value: 1.0, durationTicks: 0, label: 'Leak repaired' },
      },
      {
        label: 'Reduce Load',
        effectDescription: 'Lower hash output to manage heat. -20% hash but normal wear.',
        effect: { type: 'hash_mult_temp', value: 0.8, durationTicks: 40, label: '-20% hash, normal wear' },
      },
    ],
  },
  {
    id: 'hw_fire_sale',
    title: 'Hardware Fire Sale',
    description: 'A distressed mining farm is liquidating assets. Premium hardware at 40% off — limited time only.',
    icon: 'pricetag',
    color: '#2DD4A0',
    type: 'opportunity',
    minRigs: 0,
    choices: [
      {
        label: 'Buy Basic Rig ($480)',
        costCash: 480,
        effectDescription: 'Discounted Basic Rig added to your district.',
        effect: { type: 'no_effect', value: 0, label: 'Basic Rig at 40% off' },
      },
      {
        label: 'Buy GPU Array ($3,600)',
        costCash: 3600,
        effectDescription: 'Discounted GPU Array. 38 GH/s powerhouse.',
        effect: { type: 'no_effect', value: 0, label: 'GPU Array at 40% off' },
      },
      {
        label: 'Pass',
        effectDescription: 'Skip this deal. Save cash for other investments.',
        effect: { type: 'no_effect', value: 0, label: 'Deal skipped' },
      },
    ],
  },
  {
    id: 'grid_instability',
    title: 'Power Grid Instability',
    description: 'Regional power infrastructure is fluctuating heavily. Your power capacity is dropping unpredictably.',
    icon: 'pulse',
    color: '#F5A623',
    type: 'incident',
    minRigs: 1,
    fireEffect: { type: 'hash_mult_temp', value: 0.7, durationTicks: 30, label: '-30% hash (90 sec)' },
    choices: [
      {
        label: 'Backup Generator',
        costCash: 1600,
        effectDescription: 'Activate backup power. Cancel grid instability effect.',
        recommended: true,
        effect: { type: 'hash_mult_temp', value: 1.0, durationTicks: 0, label: 'Backup power active' },
      },
      {
        label: 'Restructure Load',
        effectDescription: 'Rebalance power draw. -15% hash instead of -30%.',
        effect: { type: 'hash_mult_temp', value: 0.85, durationTicks: 30, label: '-15% hash (load balanced)' },
      },
    ],
  },
  {
    id: 'discovery_bonus',
    title: 'Research Breakthrough',
    description: 'Your team made an unexpected breakthrough analyzing blockchain efficiency patterns. Insights are flooding in.',
    icon: 'bulb',
    color: '#9B7FE8',
    type: 'opportunity',
    minRigs: 0,
    choices: [
      {
        label: 'Publish Research (+100 Insight)',
        effectDescription: 'Share findings. Gain 100 insight points.',
        recommended: true,
        effect: { type: 'insight_add', value: 100, label: '+100 Insight' },
      },
      {
        label: 'Patent & Monetize (+$3,000)',
        effectDescription: 'Sell the discovery. Gain $3,000 cash.',
        effect: { type: 'cash_add', value: 3000, label: '+$3,000 from patent' },
      },
    ],
  },
  // ─── Late-Game Events ──────────────────────────────────────────────────────
  {
    id: 'whale_alert',
    title: 'Whale Alert',
    description: 'A massive crypto whale is offloading their portfolio through your mining pool. You get first dibs on the windfall.',
    icon: 'fish',
    color: '#2DD4A0',
    type: 'opportunity',
    minRigs: 3,
    choices: [
      {
        label: 'Collect Payout',
        effectDescription: 'Claim the whale premium. Instant $15,000 cash windfall!',
        recommended: true,
        effect: { type: 'cash_add', value: 15000, label: '+$15,000 whale premium' },
      },
      {
        label: 'Convert to Research',
        effectDescription: 'Analyze the whale patterns. +200 insight for your lab.',
        effect: { type: 'insight_add', value: 200, label: '+200 Insight from whale data' },
      },
    ],
  },
  {
    id: 'network_halving',
    title: 'Network Halving Event',
    description: 'The blockchain network has halved mining rewards. Income plummets, but scarcity is driving research breakthroughs.',
    icon: 'cut',
    color: '#F5A623',
    type: 'market_news',
    minRigs: 4,
    fireEffect: { type: 'income_mult_temp', value: 0.5, durationTicks: 60, label: '-50% income (3 min)' },
    choices: [
      {
        label: 'Pivot to Research',
        effectDescription: 'Accept the income hit but harvest insights. +150 insight.',
        recommended: true,
        effect: { type: 'insight_add', value: 150, label: '+150 Insight from halving research' },
      },
      {
        label: 'Lobby Network',
        costCash: 5000,
        effectDescription: 'Political pressure to soften the halving. Reduce to -25% income.',
        effect: { type: 'income_mult_temp', value: 0.75, durationTicks: 60, label: '-25% income (lobbied)' },
      },
    ],
  },
  {
    id: 'quantum_instability',
    title: 'Quantum Decoherence',
    description: 'Quantum fluctuations are destabilizing your highest-tier rigs. Hash output is dropping as qubits lose coherence.',
    icon: 'nuclear',
    color: '#FF4F5E',
    type: 'incident',
    minRigs: 5,
    fireEffect: { type: 'hash_mult_temp', value: 0.6, durationTicks: 45, label: '-40% hash rate (2.25 min)' },
    choices: [
      {
        label: 'Emergency Calibration',
        costCash: 15000,
        effectDescription: 'Full quantum recalibration. Cancel hash penalty immediately.',
        recommended: true,
        effect: { type: 'hash_mult_temp', value: 1.0, durationTicks: 0, label: 'Qubits stabilized' },
      },
      {
        label: 'Partial Shutdown',
        costCash: 3000,
        effectDescription: 'Shut down affected qubits. Reduce penalty to -20% hash.',
        effect: { type: 'hash_mult_temp', value: 0.8, durationTicks: 45, label: '-20% hash (partial fix)' },
      },
    ],
  },
  {
    id: 'govt_seizure',
    title: 'Government Inspection',
    description: 'Federal agents are at your door with a warrant to inspect your mining operation. Non-compliance means equipment confiscation.',
    icon: 'document-lock',
    color: '#FF4F5E',
    type: 'incident',
    minRigs: 4,
    choices: [
      {
        label: 'Pay Compliance Fine',
        costCash: 10000,
        effectDescription: 'Cooperate fully. Pay the fine and keep all equipment.',
        recommended: true,
        effect: { type: 'no_effect', value: 0, label: 'Fine paid, all clear' },
      },
      {
        label: 'Refuse Inspection',
        effectDescription: 'Stonewall the agents. They seize your last mining rig.',
        effect: { type: 'no_effect', value: 0, label: 'Rig confiscated' },
      },
    ],
  },
];
