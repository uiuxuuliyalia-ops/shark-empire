import type { PGFLocale } from '../types/pgf';

export interface BiomeTheme {
  id: string;
  eraIndex: number; // 0..9
  top: number;
  mid: number;
  bot: number;
  skyTop: number;
  skyBot: number;
  glow: number;
  weedA: number;
  weedB: number;
  sand: number;
  coral: number;
  enemyBias: ('hunter' | 'puffer' | 'ray' | 'swordfish' | 'diver')[];
  names: Record<PGFLocale, string>;
}

export const BIOMES: BiomeTheme[] = [
  {
    id: 'shallow',
    eraIndex: 0,
    top: 0x0369a1, mid: 0x0284c7, bot: 0x031838,
    skyTop: 0x0284c7, skyBot: 0xe0f2fe,
    glow: 0x38bdf8, weedA: 0x10b981, weedB: 0x059669, sand: 0xd97706, coral: 0xf43f5e,
    enemyBias: ['hunter', 'puffer'],
    names: { ru: 'Лазурное мелководье', en: 'Azure Shallows', zh: '蔚蓝浅滩' }
  },
  {
    id: 'coast',
    eraIndex: 1,
    top: 0x0f766e, mid: 0x0d9488, bot: 0x042f2e,
    skyTop: 0x0ea5e9, skyBot: 0xfef3c7,
    glow: 0x2dd4bf, weedA: 0x10b981, weedB: 0x047857, sand: 0xb45309, coral: 0xfb923c,
    enemyBias: ['hunter', 'puffer', 'diver'],
    names: { ru: 'Прибрежные воды', en: 'Coastal Waters', zh: '近海礁区' }
  },
  {
    id: 'coral',
    eraIndex: 2,
    top: 0xbe123c, mid: 0xe11d48, bot: 0x4c0519,
    skyTop: 0xec4899, skyBot: 0xfce7f3,
    glow: 0xfb7185, weedA: 0xbe123c, weedB: 0x881337, sand: 0x92400e, coral: 0xf43f5e,
    enemyBias: ['puffer', 'ray', 'hunter'],
    names: { ru: 'Коралловый риф', en: 'Coral Reef', zh: '珊瑚花园' }
  },
  {
    id: 'cave',
    eraIndex: 3,
    top: 0x0369a1, mid: 0x075985, bot: 0x020617,
    skyTop: 0x1e293b, skyBot: 0x64748b,
    glow: 0x38bdf8, weedA: 0x064e3b, weedB: 0x022c22, sand: 0x334155, coral: 0x10b981,
    enemyBias: ['ray', 'puffer', 'hunter'],
    names: { ru: 'Тёмный грот', en: 'Shadow Grotto', zh: '幽暗海窟' }
  },
  {
    id: 'deep',
    eraIndex: 4,
    top: 0x6b21a8, mid: 0x7c3aed, bot: 0x1e1b4b,
    skyTop: 0x4c1d95, skyBot: 0xc4b5fd,
    glow: 0xc084fc, weedA: 0x4c1d95, weedB: 0x2e1065, sand: 0x312e81, coral: 0xd946ef,
    enemyBias: ['ray', 'swordfish', 'puffer'],
    names: { ru: 'Логово медузы', en: 'Jellyfish Lair', zh: '水母巢穴' }
  },
  {
    id: 'open',
    eraIndex: 5,
    top: 0x1e40af, mid: 0x2563eb, bot: 0x0f172a,
    skyTop: 0x0284c7, skyBot: 0xbae6fd,
    glow: 0x60a5fa, weedA: 0x1d4ed8, weedB: 0x1e40af, sand: 0xb45309, coral: 0x38bdf8,
    enemyBias: ['swordfish', 'hunter', 'diver'],
    names: { ru: 'Открытое море', en: 'Open Ocean', zh: '远洋深海' }
  },
  {
    id: 'ice',
    eraIndex: 6,
    top: 0x0284c7, mid: 0x38bdf8, bot: 0x0c4a6e,
    skyTop: 0x7dd3fc, skyBot: 0xf0f9ff,
    glow: 0xe0f2fe, weedA: 0x0284c7, weedB: 0x0369a1, sand: 0xe0f2fe, coral: 0xffffff,
    enemyBias: ['swordfish', 'ray', 'diver'],
    names: { ru: 'Ледяные воды', en: 'Glacial Waters', zh: '冰封海域' }
  },
  {
    id: 'volcano',
    eraIndex: 7,
    top: 0x991b1b, mid: 0xb91c1c, bot: 0x450a0a,
    skyTop: 0x7f1d1d, skyBot: 0xfdba74,
    glow: 0xfb923c, weedA: 0x991b1b, weedB: 0x7f1d1d, sand: 0x78350f, coral: 0xf97316,
    enemyBias: ['hunter', 'swordfish', 'puffer'],
    names: { ru: 'Подводный вулкан', en: 'Volcanic Trench', zh: '海底火山' }
  },
  {
    id: 'city',
    eraIndex: 8,
    top: 0x334155, mid: 0x475569, bot: 0x020617,
    skyTop: 0x0f172a, skyBot: 0x475569,
    glow: 0x94a3b8, weedA: 0x334155, weedB: 0x1e293b, sand: 0x475569, coral: 0x38bdf8,
    enemyBias: ['diver', 'ray', 'swordfish'],
    names: { ru: 'Затонувший город', en: 'Sunken City', zh: '沉没古城' }
  },
  {
    id: 'abyss',
    eraIndex: 9,
    top: 0x1e1b4b, mid: 0x312e81, bot: 0x000000,
    skyTop: 0x020617, skyBot: 0x312e81,
    glow: 0x818cf8, weedA: 0x1e1b4b, weedB: 0x0f172a, sand: 0x1e1b4b, coral: 0xa855f7,
    enemyBias: ['swordfish', 'ray', 'hunter', 'diver'],
    names: { ru: 'Бездна титана', en: 'Titan Abyss', zh: '泰坦深渊' }
  }
];

const SUB_STAGE_SUFFIXES: Record<PGFLocale, string[]> = {
  ru: [
    'Окраина',
    'Отмель течений',
    'Заросли',
    'Каньон',
    'Логово стража',
    'Глубокий свал',
    'Охотничьи тропы',
    'Штормовая зона',
    'Преддверие трона',
    'Цитадель эры'
  ],
  en: [
    'Outskirts',
    'Current Shelf',
    'Kelp Maze',
    'Deep Canyon',
    'Guardian Lair',
    'Abyssal Drop',
    'Hunting Grounds',
    'Storm Zone',
    'Throne Approach',
    'Era Citadel'
  ],
  zh: [
    '外围水域',
    '洋流浅架',
    '海藻迷宫',
    '深海峡谷',
    '守卫巢穴',
    '深渊断崖',
    '狩猎场',
    '风暴区',
    '王座前哨',
    '纪元圣殿'
  ]
};

export interface StageConfig {
  stage: number; // 1..100
  eraIndex: number; // 0..9
  subStage: number; // 1..10
  biome: BiomeTheme;
  fishTarget: number;
  enemyTarget: number;
  bossKind: 'none' | 'miniboss' | 'eraBoss';
  bossHp: number;
  enemyHp: number;
  enemyDmg: number;
  coinMult: number;
  seabedPhase: number;
  currentForceX: number;
}

export const TOTAL_STAGES = 100;

export function getStageConfig(stageRaw: number): StageConfig {
  const stage = Math.max(1, Math.min(TOTAL_STAGES, Math.floor(stageRaw || 1)));
  const eraIndex = Math.floor((stage - 1) / 10);
  const subStage = ((stage - 1) % 10) + 1;
  const biome = BIOMES[eraIndex] || BIOMES[0];

  const bossKind: StageConfig['bossKind'] =
    stage % 10 === 0 ? 'eraBoss' : stage % 5 === 0 ? 'miniboss' : 'none';

  const fishTarget =
    bossKind !== 'none'
      ? 10 + Math.floor(stage * 0.14)
      : 14 + Math.floor(stage * 0.32);

  const enemyTarget =
    stage === 1
      ? 0
      : bossKind === 'eraBoss'
        ? 4 + Math.floor(eraIndex * 0.6)
        : bossKind === 'miniboss'
          ? 3 + Math.floor(eraIndex * 0.5)
          : Math.min(20, 2 + Math.floor(stage * 0.2));

  const enemyHp = Math.round(32 * Math.pow(stage, 0.56));
  const enemyDmg = Math.round(10 + stage * 0.42);
  const bossHp =
    bossKind === 'eraBoss'
      ? Math.round(420 * Math.pow(stage / 5, 0.68))
      : bossKind === 'miniboss'
        ? Math.round(250 * Math.pow(stage / 5, 0.62))
        : 0;

  return {
    stage,
    eraIndex,
    subStage,
    biome,
    fishTarget,
    enemyTarget,
    bossKind,
    bossHp,
    enemyHp,
    enemyDmg,
    coinMult: Number((1 + (stage - 1) * 0.08).toFixed(2)),
    seabedPhase: stage * 1.37,
    currentForceX: subStage === 2 || subStage === 8 ? (eraIndex % 2 === 0 ? 32 : -32) : 0
  };
}

export function getStageDisplayName(stage: number, locale: PGFLocale): string {
  const cfg = getStageConfig(stage);
  const biomeName = cfg.biome.names[locale] || cfg.biome.names.ru;
  const suffixList = SUB_STAGE_SUFFIXES[locale] || SUB_STAGE_SUFFIXES.ru;
  const subName = suffixList[cfg.subStage - 1] || '';
  return `${biomeName} · ${subName}`;
}

export interface EvolutionFormSpec {
  tier: number; // 1..6
  unlockStage: number;
  cost: number;
  scale: number;
  biteBonus: number;
  hpBonus: number;
  auraColor: number;
  mightFactor: number;
  names: Record<PGFLocale, string>;
  descs: Record<PGFLocale, string>;
}

export const EVOLUTION_FORMS: EvolutionFormSpec[] = [
  {
    tier: 1,
    unlockStage: 1,
    cost: 0,
    scale: 0.58,
    biteBonus: 0,
    hpBonus: 0,
    auraColor: 0x38bdf8,
    mightFactor: 1.0,
    names: { ru: 'Молодой хищник', en: 'Reef Striker', zh: '浅海幼鲨' },
    descs: {
      ru: 'Быстрая стартовая форма',
      en: 'Agile starter predator',
      zh: '敏捷的基础形态'
    }
  },
  {
    tier: 2,
    unlockStage: 5,
    cost: 600,
    scale: 0.66,
    biteBonus: 6,
    hpBonus: 25,
    auraColor: 0x22d3ee,
    mightFactor: 1.4,
    names: { ru: 'Полосатый рейдер', en: 'Tiger Raider', zh: '虎纹突袭者' },
    descs: {
      ru: 'Боевые полосы, спинной гребень, +25 HP, +6 укус',
      en: 'Battle stripes, dorsal crest, +25 HP, +6 bite',
      zh: '战纹与背脊，+25生命，+6撕咬'
    }
  },
  {
    tier: 3,
    unlockStage: 15,
    cost: 1800,
    scale: 0.74,
    biteBonus: 14,
    hpBonus: 60,
    auraColor: 0x34d399,
    mightFactor: 2.0,
    names: { ru: 'Бронированный громила', en: 'Armored Crusher', zh: '重甲粉碎者' },
    descs: {
      ru: 'Хитиновые пластины, акулья аура, +60 HP, +14 укус',
      en: 'Chitin armor plates, power aura, +60 HP, +14 bite',
      zh: '甲壳护板与光环，+60生命，+14撕咬'
    }
  },
  {
    tier: 4,
    unlockStage: 30,
    cost: 4200,
    scale: 0.83,
    biteBonus: 26,
    hpBonus: 110,
    auraColor: 0xfbbf24,
    mightFactor: 2.8,
    names: { ru: 'Глубинный палач', en: 'Abyss Executioner', zh: '深渊处刑者' },
    descs: {
      ru: 'Золотые плавники-лезвия, шрамы, +110 HP, +26 укус',
      en: 'Gilded fin blades, apex jaws, +110 HP, +26 bite',
      zh: '金刃鱼鳍与巨颚，+110生命，+26撕咬'
    }
  },
  {
    tier: 5,
    unlockStage: 55,
    cost: 9000,
    scale: 0.93,
    biteBonus: 44,
    hpBonus: 180,
    auraColor: 0xf43f5e,
    mightFactor: 4.0,
    names: { ru: 'Коронованный мегалодон', en: 'Crowned Megalodon', zh: '冠冕巨齿鲨' },
    descs: {
      ru: 'Корона владыки, двойная броня, +180 HP, +44 укус',
      en: 'Royal crest, dual armor, +180 HP, +44 bite',
      zh: '王者头冠与双层重甲，+180生命，+44撕咬'
    }
  },
  {
    tier: 6,
    unlockStage: 80,
    cost: 18000,
    scale: 1.04,
    biteBonus: 70,
    hpBonus: 280,
    auraColor: 0xc084fc,
    mightFactor: 5.5,
    names: { ru: 'Древний Левиафан', en: 'Ancient Leviathan', zh: '远古利维坦' },
    descs: {
      ru: 'Биолюминесцентные руны и мощь бездны (+280 HP, +70 укус)',
      en: 'Bioluminescent abyssal runes (+280 HP, +70 bite)',
      zh: '深渊灵光符文（+280生命，+70撕咬）'
    }
  }
];

export const MAX_SKILL_LEVEL = 10;

export const SKILL_PRICES_10: Record<string, number[]> = {
  attack: [150, 350, 700, 1200, 2000, 3200, 4800, 6800, 9200, 12500],
  armor: [150, 350, 700, 1200, 2000, 3200, 4800, 6800, 9200, 12500],
  regen: [150, 350, 700, 1200, 2000, 3200, 4800, 6800, 9200, 12500],
  speed: [180, 400, 800, 1400, 2300, 3500, 5200, 7200, 9800, 13200],
  lifesteal: [200, 450, 900, 1600, 2600, 3900, 5600, 7800, 10500, 14000],
  crit: [200, 450, 900, 1600, 2600, 3900, 5600, 7800, 10500, 14000]
};

export interface SkinPerk {
  dashDmgMult: number;
  energyRegenMult: number;
  lifestealBonus: number;
  magnetRadiusBonus: number;
  critBonus: number;
  coinBonusPct: number;
}

export const SKIN_PERKS: Record<string, SkinPerk> = {
  classic: { dashDmgMult: 1, energyRegenMult: 1, lifestealBonus: 0, magnetRadiusBonus: 0, critBonus: 0, coinBonusPct: 0 },
  tiger: { dashDmgMult: 1.15, energyRegenMult: 1, lifestealBonus: 0, magnetRadiusBonus: 0, critBonus: 0, coinBonusPct: 15 },
  neon: { dashDmgMult: 1, energyRegenMult: 1.25, lifestealBonus: 0, magnetRadiusBonus: 60, critBonus: 0, coinBonusPct: 10 },
  ruby: { dashDmgMult: 1.1, energyRegenMult: 1, lifestealBonus: 4, magnetRadiusBonus: 0, critBonus: 0.05, coinBonusPct: 15 },
  abyss: { dashDmgMult: 1.2, energyRegenMult: 1.15, lifestealBonus: 2, magnetRadiusBonus: 120, critBonus: 0.1, coinBonusPct: 25 }
};
