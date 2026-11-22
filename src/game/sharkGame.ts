/**
 * SHARK EMPIRE — LEGENDARY: 100-STAGE EVOLUTIONARY SAGA
 * Complete Combat, Biome, Boss AI & Visual Power Progression Engine
 */

import { TRANSLATIONS } from '../i18n/translations';
import {
  DAILY_REWARD_SCHEDULE,
  canClaimDailyToday,
  getLocalDateKey,
  getNextClaimDay,
  normalizeDailyRewards
} from './dailyRewards';
import {
  EVOLUTION_FORMS,
  MAX_SKILL_LEVEL,
  SKIN_PERKS,
  SKILL_PRICES_10,
  TOTAL_STAGES,
  getStageConfig,
  getStageDisplayName,
  type StageConfig
} from './worldData';
import type { DailyRewardsSave, PGFLocale, SharkSaveState, SharkSkills } from '../types/pgf';

export interface RunSummaryPayload {
  type: 'victory' | 'gameover';
  level: number;
  score: number;
  runCoins: number;
  fishEaten: number;
  enemyKilled: number;
  adDoubled: boolean;
}

export interface DailyClaimResult {
  day: number;
  coinsGranted: number;
  milestoneExtra?: string;
}

export interface SharkGameInstance {
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  performDash: () => void;
  toggleShield: () => void;
  toggleSound: () => boolean;
  setMuted: (muted: boolean) => boolean;
  setLocale: (lang: PGFLocale) => void;
  setTouchInput: (dx: number, dy: number, active: boolean, sprint?: boolean) => void;
  buySkill: (key: string) => boolean;
  buySkin: (id: string) => boolean;
  buyEvolution: (tier: number) => boolean;
  selectStage: (stage: number) => void;
  addCoins: (amount: number, reason?: 'ad' | 'iap') => void;
  grantRunAdDouble: () => number;
  claimDailyReward: (multiplier?: 1 | 2) => DailyClaimResult | null;
  getDailyRewards: () => DailyRewardsSave;
  proceedNextLevel: () => void;
  retryCurrentLevel: () => void;
  restartFullGame: () => void;
  getSkills: () => Record<string, number>;
  getSkinsOwned: () => string[];
  getCurrentSkin: () => string;
  getAchievements: () => Record<string, boolean>;
}

export interface GameStatePayload {
  hp: number;
  hpMax: number;
  energy: number;
  energyMax: number;
  coins: number;
  runCoins: number;
  score: number;
  highScore: number;
  level: number;
  highestLevel: number;
  eraIndex: number;
  levelName: string;
  evolutionTier: number;
  evolutionOwned: number;
  evolutionName: string;
  mightFactor: number;
  sharkScale: number;
  totalFishEaten: number;
  totalEnemiesDefeated: number;
  totalBossesDefeated: number;
  fishEaten: number;
  fishTarget: number;
  enemyKilled: number;
  enemyTarget: number;
  hasBoss: boolean;
  bossKind: 'none' | 'miniboss' | 'eraBoss';
  bossHp: number;
  bossMaxHp: number;
  combo: number;
  isFrenzy: boolean;
  isShieldActive: boolean;
  hasShieldUnlocked: boolean;
  isSoundMuted: boolean;
  magnetTimer: number;
  starTimer: number;
  clockTimer: number;
  netCaught: boolean;
  skinsOwned: string[];
  dailyRewards: DailyRewardsSave;
  canClaimDaily: boolean;
  nextDailyDay: number;
  runSummary: RunSummaryPayload | null;
  toast: string | null;
  banner: { title: string; sub: string } | null;
}

export function initSharkGame(
  container: HTMLElement,
  onStateUpdate?: (state: GameStatePayload) => void
): SharkGameInstance | null {
  if (typeof window === 'undefined' || typeof Phaser === 'undefined') return null;

  const W = 5200;
  const H = 1600;
  const SKY_H = 400;
  const CAM_W = 1280;
  const CAM_H = 720;

  // Звуковой синтезатор
  class SoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    public isMuted = false;

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15;
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Audio error', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute(): boolean {
      return this.setMuted(!this.isMuted);
    }

    setMuted(muted: boolean): boolean {
      this.isMuted = muted;
      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : 0.15;
      }
      return this.isMuted;
    }

    play(
      type:
        | 'eat'
        | 'bite'
        | 'dash'
        | 'coin'
        | 'hit'
        | 'boss'
        | 'level'
        | 'frenzy'
        | 'splash'
        | 'horn'
        | 'whale'
        | 'dolphin'
        | 'shieldOn'
        | 'shieldOff'
        | 'parry'
        | 'evolve'
    ) {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const tone = (f: number, dur: number, wave: OscillatorType = 'sine', vol = 0.08) => {
        if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + dur);
      };

      if (type === 'eat') {
        tone(520, 0.08, 'triangle', 0.1);
        setTimeout(() => tone(980, 0.1, 'sine', 0.08), 50);
      } else if (type === 'coin') {
        tone(1320, 0.08, 'sine', 0.1);
        setTimeout(() => tone(1760, 0.12, 'triangle', 0.1), 50);
      } else if (type === 'dash') {
        tone(180, 0.18, 'sine', 0.14);
      } else if (type === 'bite') {
        tone(140, 0.22, 'triangle', 0.16);
      } else if (type === 'hit') {
        tone(150, 0.2, 'sawtooth', 0.16);
      } else if (type === 'parry') {
        tone(920, 0.14, 'triangle', 0.16);
        setTimeout(() => tone(1480, 0.18, 'sine', 0.14), 50);
      } else if (type === 'evolve') {
        [440, 554, 659, 880, 1318].forEach((freq, idx) => {
          setTimeout(() => tone(freq, 0.28, 'triangle', 0.14), idx * 75);
        });
      } else if (type === 'boss') {
        tone(75, 0.8, 'sawtooth', 0.2);
      } else if (type === 'level') {
        [523, 659, 783, 1046].forEach((freq, idx) => {
          setTimeout(() => tone(freq, 0.22, 'sine', 0.12), idx * 80);
        });
      } else if (type === 'frenzy') {
        [440, 554, 659, 880, 1108].forEach((freq, idx) => {
          setTimeout(() => tone(freq, 0.25, 'triangle', 0.15), idx * 60);
        });
      } else if (type === 'splash') {
        tone(450, 0.22, 'sine', 0.1);
        setTimeout(() => tone(160, 0.25, 'triangle', 0.12), 40);
      } else if (type === 'horn') {
        tone(220, 0.5, 'sawtooth', 0.08);
        setTimeout(() => tone(277, 0.6, 'sawtooth', 0.07), 150);
      } else if (type === 'whale') {
        tone(120, 1.2, 'sine', 0.1);
      } else if (type === 'dolphin') {
        tone(1400, 0.12, 'sine', 0.09);
        setTimeout(() => tone(1800, 0.18, 'sine', 0.08), 70);
      } else if (type === 'shieldOn') {
        tone(350, 0.2, 'sine', 0.1);
        setTimeout(() => tone(700, 0.3, 'sine', 0.12), 100);
      } else if (type === 'shieldOff') {
        tone(600, 0.15, 'sine', 0.1);
        setTimeout(() => tone(300, 0.2, 'sine', 0.08), 80);
      }
    }
  }

  const audio = new SoundEngine();

  const SKIN_PRICES: Record<string, number> = {
    classic: 0,
    tiger: 600,
    neon: 1200,
    ruby: 2500,
    abyss: 5000
  };

  const SKIN_TINTS: Record<string, number> = {
    classic: 0xffffff,
    tiger: 0xfbbf24,
    neon: 0x22d3ee,
    ruby: 0xf43f5e,
    abyss: 0xc084fc
  };

  const DEFAULT_SAVE: SharkSaveState = {
    coins: 100,
    highScore: 0,
    currentLevel: 1,
    highestLevel: 1,
    evolutionTier: 1,
    evolutionOwned: 1,
    totalFishEaten: 0,
    totalEnemiesDefeated: 0,
    totalBossesDefeated: 0,
    shieldUnlocked: false,
    skills: { attack: 0, armor: 0, regen: 0, speed: 0, lifesteal: 0, crit: 0 },
    skinsOwned: ['classic'],
    currentSkin: 'classic',
    achievements: {},
    soundMuted: false,
    breachCount: 0,
    dailyRewards: {
      streakDay: 0,
      lastClaimDate: null,
      claimedDays: [],
      cycleCount: 0,
      lastClaimTimestamp: 0
    }
  };

  const loadedSave: SharkSaveState =
    (window.PGF &&
      window.PGF.load({
        defaultState: DEFAULT_SAVE
      })) ||
    DEFAULT_SAVE;

  let activeLocale: PGFLocale = (window.PGF && window.PGF.getLocale()) || 'ru';
  const tr = () => TRANSLATIONS[activeLocale] || TRANSLATIONS.ru;

  const skills: SharkSkills = {
    attack: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.attack) || 0)),
    armor: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.armor) || 0)),
    regen: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.regen) || 0)),
    speed: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.speed) || 0)),
    lifesteal: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.lifesteal) || 0)),
    crit: Math.min(MAX_SKILL_LEVEL, Math.max(0, Number(loadedSave.skills?.crit) || 0))
  };

  let skinsOwned: string[] =
    Array.isArray(loadedSave.skinsOwned) && loadedSave.skinsOwned.length > 0
      ? [...loadedSave.skinsOwned]
      : ['classic'];
  let currentSkin: string = loadedSave.currentSkin || 'classic';
  let achievements: Record<string, boolean> =
    loadedSave.achievements && typeof loadedSave.achievements === 'object'
      ? { ...loadedSave.achievements }
      : {};
  let dailyRewards: DailyRewardsSave = normalizeDailyRewards(loadedSave.dailyRewards);

  let coins = Math.max(0, Number(loadedSave.coins) || 0);
  let highScore = Math.max(0, Number(loadedSave.highScore) || 0);
  let runCoins = 0;
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let isFrenzy = false;
  let frenzyTimer = 0;

  if (loadedSave.soundMuted) {
    audio.setMuted(true);
  }

  let isShieldActive = false;
  let shieldActivatedAt = 0;
  let hasShieldUnlocked = Boolean(loadedSave.shieldUnlocked);

  let magnetTimer = 0;
  let starTimer = 0;
  let clockTimer = 0;
  let slowDebuffTimer = 0;

  let currentStageNum = Math.max(1, Math.min(TOTAL_STAGES, Number(loadedSave.currentLevel) || 1));
  let highestLevel = Math.max(
    currentStageNum,
    Math.min(TOTAL_STAGES, Number(loadedSave.highestLevel) || currentStageNum)
  );
  let evolutionTier = Math.max(1, Math.min(6, Number(loadedSave.evolutionTier) || 1));
  let evolutionOwned = Math.max(
    evolutionTier,
    Math.min(6, Number(loadedSave.evolutionOwned) || evolutionTier)
  );
  let totalFishEaten = Math.max(0, Number(loadedSave.totalFishEaten) || 0);
  let totalEnemiesDefeated = Math.max(0, Number(loadedSave.totalEnemiesDefeated) || 0);
  let totalBossesDefeated = Math.max(0, Number(loadedSave.totalBossesDefeated) || 0);

  let playerHpMax = 100;
  let playerHp = 100;
  let playerEnergy = 100;
  const playerEnergyMax = 100;

  let levelFishEaten = 0;
  let levelEnemyKilled = 0;
  let isLevelEnding = false;
  let isPaused = true;
  let breachCount = Math.max(0, Number(loadedSave.breachCount) || 0);
  let wasAboveWater = false;
  let activeSummary: RunSummaryPayload | null = null;

  let playerInvulnTimer = 0;
  let biteCooldownTimer = 0;
  let hitstopTimer = 0;

  // Сущности и графические слои биома
  let sceneRef: Phaser.Scene | null = null;
  let shark: Phaser.Physics.Arcade.Sprite | null = null;
  let shieldVisualGfx: Phaser.GameObjects.Graphics | null = null;
  let auraGfx: Phaser.GameObjects.Graphics | null = null;
  let telegraphGfx: Phaser.GameObjects.Graphics | null = null;
  let bossJelly: Phaser.Physics.Arcade.Sprite | null = null;

  let skyGfx: Phaser.GameObjects.Graphics | null = null;
  let bgGfx: Phaser.GameObjects.Graphics | null = null;
  let sandGfx: Phaser.GameObjects.Graphics | null = null;
  const rayGfxList: Phaser.GameObjects.Graphics[] = [];

  const fishes: any[] = [];
  const enemies: Phaser.Physics.Arcade.Sprite[] = [];
  const enemyProjectiles: Phaser.Physics.Arcade.Sprite[] = [];
  const drops: Phaser.Physics.Arcade.Sprite[] = [];
  const weeds: { g: Phaser.GameObjects.Graphics; x: number; y: number; h: number; color: number; seed: number }[] = [];
  const bubbles: { obj: Phaser.GameObjects.Arc; vy: number }[] = [];

  // Лодки, сети, крючки
  const boats: { sprite: Phaser.GameObjects.Image; speed: number; hornCd: number; hookCd: number; netCd: number }[] = [];
  const hooks: { sprite: Phaser.Physics.Arcade.Sprite; line: Phaser.GameObjects.Graphics; boatX: number }[] = [];
  const ropedNets: { sprite: Phaser.Physics.Arcade.Sprite; rope: Phaser.GameObjects.Graphics; boatX: number; hp: number; life: number }[] = [];
  let caughtInNetObj: { sprite: Phaser.Physics.Arcade.Sprite; rope: Phaser.GameObjects.Graphics; boatX: number; hp: number; life: number } | null = null;

  // Обитатели
  const dolphins: { sprite: Phaser.GameObjects.Image; vx: number; timer: number }[] = [];
  const whales: { sprite: Phaser.GameObjects.Image; vx: number; blowCd: number }[] = [];
  const seals: { sprite: Phaser.Physics.Arcade.Sprite; vx: number; diveTimer: number }[] = [];
  const gulls: { sprite: Phaser.GameObjects.Image; vx: number }[] = [];

  // Небо
  let sunObj: Phaser.GameObjects.Arc | null = null;
  let moonObj: Phaser.GameObjects.Arc | null = null;

  // Партиклы
  let pGold: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  let pBlood: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  let pBlue: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  let pWhite: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  let cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  let keys: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  const touchInput = { x: 0, y: 0, active: false, sprint: false };
  let dashBurstTimer = 0;
  let dashBurstDir = { x: 1, y: 0 };

  function getEvoSpec(tier: number = evolutionTier) {
    return EVOLUTION_FORMS[Math.max(0, Math.min(EVOLUTION_FORMS.length - 1, tier - 1))] || EVOLUTION_FORMS[0];
  }

  function sharkTexKey(pose: 'closed' | 'half' | 'wide', tier: number = evolutionTier): string {
    return `shark-${pose}-t${tier}`;
  }

  function getSkinPerk() {
    return SKIN_PERKS[currentSkin] || SKIN_PERKS.classic;
  }

  function computePlayerHpMax(): number {
    const evo = getEvoSpec();
    return 100 + skills.regen * 24 + evo.hpBonus;
  }

  playerHpMax = computePlayerHpMax();
  playerHp = playerHpMax;

  function computeMightFactor(): number {
    const evo = getEvoSpec();
    const skillSum =
      skills.attack + skills.armor + skills.regen + skills.speed + skills.lifesteal + skills.crit;
    return Number((evo.mightFactor + skillSum * 0.14).toFixed(1));
  }

  function buildSaveSnapshot(): SharkSaveState {
    return {
      coins,
      highScore,
      currentLevel: currentStageNum,
      highestLevel,
      evolutionTier,
      evolutionOwned,
      totalFishEaten,
      totalEnemiesDefeated,
      totalBossesDefeated,
      shieldUnlocked: hasShieldUnlocked,
      skills: { ...skills },
      skinsOwned: [...skinsOwned],
      currentSkin,
      achievements: { ...achievements },
      soundMuted: audio.isMuted,
      breachCount,
      dailyRewards: { ...dailyRewards, claimedDays: [...dailyRewards.claimedDays] }
    };
  }

  function persistSave() {
    if (score > highScore) highScore = score;
    if (window.PGF) {
      window.PGF.save(buildSaveSnapshot());
    }
  }

  function addEarnedCoins(amount: number) {
    const perk = getSkinPerk();
    const cfg = getStageConfig(currentStageNum);
    const boosted = Math.max(1, Math.round(amount * cfg.coinMult * (1 + perk.coinBonusPct / 100)));
    coins += boosted;
    runCoins += boosted;
    if (coins >= 5000) {
      unlockAchievement('rich');
    }
    return boosted;
  }

  function unlockAchievement(id: string) {
    if (achievements[id]) return;
    achievements[id] = true;
    persistSave();
    audio.play('level');
    const achName = tr().achievements[id]?.name || id;
    notifyState(tr().ingame.achievementToast(achName));
  }

  function spawnFloatingText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff', size = '18px') {
    const txt = scene.add
      .text(x, y, text, {
        fontFamily: 'Manrope, sans-serif',
        fontSize: size,
        fontStyle: 'bold',
        color,
        stroke: '#020617',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(45);
    scene.tweens.add({
      targets: txt,
      y: y - 48,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy()
    });
  }

  function notifyState(toastMsg: string | null = null, bannerData: { title: string; sub: string } | null = null) {
    if (!onStateUpdate) return;
    const cfg = getStageConfig(currentStageNum);
    const evo = getEvoSpec();
    onStateUpdate({
      hp: playerHp,
      hpMax: playerHpMax,
      energy: playerEnergy,
      energyMax: playerEnergyMax,
      coins,
      runCoins,
      score,
      highScore,
      level: cfg.stage,
      highestLevel,
      eraIndex: cfg.eraIndex,
      levelName: getStageDisplayName(cfg.stage, activeLocale),
      evolutionTier,
      evolutionOwned,
      evolutionName: evo.names[activeLocale] || evo.names.ru,
      mightFactor: computeMightFactor(),
      sharkScale: evo.scale,
      totalFishEaten,
      totalEnemiesDefeated,
      totalBossesDefeated,
      fishEaten: levelFishEaten,
      fishTarget: cfg.fishTarget,
      enemyKilled: levelEnemyKilled,
      enemyTarget: cfg.enemyTarget,
      hasBoss: cfg.bossKind !== 'none',
      bossKind: cfg.bossKind,
      bossHp: bossJelly && bossJelly.active ? Math.max(0, (bossJelly as any).hp) : 0,
      bossMaxHp: bossJelly && bossJelly.active ? (bossJelly as any).maxHp : 0,
      combo,
      isFrenzy,
      isShieldActive,
      hasShieldUnlocked,
      isSoundMuted: audio.isMuted,
      magnetTimer,
      starTimer,
      clockTimer,
      netCaught: caughtInNetObj !== null,
      skinsOwned: [...skinsOwned],
      dailyRewards: { ...dailyRewards, claimedDays: [...dailyRewards.claimedDays] },
      canClaimDaily: canClaimDailyToday(dailyRewards),
      nextDailyDay: getNextClaimDay(dailyRewards),
      runSummary: activeSummary ? { ...activeSummary } : null,
      toast: toastMsg,
      banner: bannerData
    });
  }

  // ============ PROCEDURAL EVOLUTION SHARK FACTORY ============
  function buildSharkEvolutionTextures(scene: Phaser.Scene, tier: number) {
    const mk = (w: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };

    const drawShark = (ctx: CanvasRenderingContext2D, jawAngle: number) => {
      ctx.save();
      ctx.translate(135, 95);

      // Shadow
      ctx.fillStyle = tier >= 5 ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 8, 25, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-10, 36, 112 + tier * 3, 22 + tier, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Main muscular body
      const gradBody = ctx.createLinearGradient(-115, -55, 100, 45);
      if (tier >= 6) {
        gradBody.addColorStop(0, '#090d24');
        gradBody.addColorStop(0.28, '#312e81');
        gradBody.addColorStop(0.6, '#4f46e5');
        gradBody.addColorStop(0.85, '#38bdf8');
        gradBody.addColorStop(1, '#f8fafc');
      } else if (tier >= 4) {
        gradBody.addColorStop(0, '#020617');
        gradBody.addColorStop(0.25, '#0f172a');
        gradBody.addColorStop(0.58, '#0369a1');
        gradBody.addColorStop(0.85, '#7dd3fc');
        gradBody.addColorStop(1, '#ffffff');
      } else {
        gradBody.addColorStop(0, '#020f2b');
        gradBody.addColorStop(0.22, '#034078');
        gradBody.addColorStop(0.55, '#0284c7');
        gradBody.addColorStop(0.8, '#38bdf8');
        gradBody.addColorStop(1, '#ffffff');
      }

      ctx.fillStyle = gradBody;
      ctx.beginPath();
      ctx.moveTo(106 + tier * 2, 0);
      ctx.bezierCurveTo(95, -36, 45, -49, -15, -44);
      ctx.bezierCurveTo(-65, -40, -100, -28, -120, -16);
      ctx.lineTo(-158, -50 - tier * 2);
      ctx.lineTo(-138, -6);
      ctx.lineTo(-158, 12);
      ctx.lineTo(-136, 24);
      ctx.lineTo(-154, 52 + tier * 2);
      ctx.bezierCurveTo(-95, 36, -45, 42, 15, 38);
      ctx.bezierCurveTo(65, 35, 92, 20, 106 + tier * 2, 0);
      ctx.closePath();
      ctx.fill();

      // Tier 2+: Battle stripes
      if (tier >= 2) {
        ctx.fillStyle = tier >= 5 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(2, 6, 23, 0.42)';
        for (let s = 0; s < 5; s++) {
          const sx = -55 + s * 22;
          ctx.beginPath();
          ctx.moveTo(sx, -38);
          ctx.lineTo(sx + 8, -38);
          ctx.lineTo(sx - 4, -8);
          ctx.lineTo(sx - 11, -8);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Dorsal fin (grows sharper & bladed with evolution)
      const finTipY = -92 - tier * 4;
      const finGrad = ctx.createLinearGradient(-35, -44, -5, finTipY);
      finGrad.addColorStop(0, tier >= 4 ? '#1e293b' : '#034078');
      finGrad.addColorStop(0.65, tier >= 5 ? '#f59e0b' : '#0284c7');
      finGrad.addColorStop(1, tier >= 6 ? '#c084fc' : tier >= 4 ? '#fef08a' : '#7dd3fc');
      ctx.fillStyle = finGrad;
      ctx.beginPath();
      ctx.moveTo(-36, -42);
      ctx.quadraticCurveTo(-15, finTipY + 4, -3, finTipY);
      ctx.quadraticCurveTo(6, -66, 18, -40);
      ctx.closePath();
      ctx.fill();

      // Pectoral fin
      const pectGrad = ctx.createLinearGradient(-10, 15, 38, 68 + tier * 2);
      pectGrad.addColorStop(0, '#034078');
      pectGrad.addColorStop(0.7, tier >= 4 ? '#f59e0b' : '#0284c7');
      pectGrad.addColorStop(1, tier >= 6 ? '#c084fc' : '#bae6fd');
      ctx.fillStyle = pectGrad;
      ctx.beginPath();
      ctx.moveTo(5, 18);
      ctx.quadraticCurveTo(34, 58, 44 + tier, 68 + tier * 2);
      ctx.quadraticCurveTo(24, 64, -12, 32);
      ctx.closePath();
      ctx.fill();

      // Tier 3+: Chitin / Gold Dorsal Armor Plates
      if (tier >= 3) {
        ctx.fillStyle = tier >= 5 ? '#fbbf24' : '#94a3b8';
        ctx.strokeStyle = tier >= 5 ? '#fef08a' : '#e2e8f0';
        ctx.lineWidth = 2;
        for (let p = 0; p < 3; p++) {
          const px = -24 + p * 26;
          ctx.beginPath();
          ctx.moveTo(px, -39);
          ctx.lineTo(px + 18, -36);
          ctx.lineTo(px + 14, -22);
          ctx.lineTo(px - 2, -24);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Tier 4+: Golden fin trim & battle scar
      if (tier >= 4) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(54, -22);
        ctx.lineTo(66, -4);
        ctx.stroke();
      }

      // Tier 5+: Royal Horned Crown Crest
      if (tier >= 5) {
        ctx.fillStyle = tier >= 6 ? '#c084fc' : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(35, -38);
        ctx.lineTo(52, -62);
        ctx.lineTo(58, -42);
        ctx.lineTo(74, -56);
        ctx.lineTo(72, -32);
        ctx.closePath();
        ctx.fill();
      }

      // Tier 6: Bioluminescent runes along lateral line
      if (tier >= 6) {
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-90, -2);
        ctx.quadraticCurveTo(-20, -10, 48, -2);
        ctx.stroke();
      }

      // Specular highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -42);
      ctx.quadraticCurveTo(35, -44, 88, -8);
      ctx.stroke();

      // Gills
      for (let i = 0; i < 5; i++) {
        const gx = 12 + i * 8;
        ctx.strokeStyle = tier >= 5 ? 'rgba(251, 191, 36, 0.85)' : 'rgba(3, 105, 161, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx, -18);
        ctx.quadraticCurveTo(gx + 3, 0, gx, 18);
        ctx.stroke();
      }

      // Eye (fiercer amber/crimson/violet on higher tiers)
      ctx.fillStyle = tier >= 6 ? '#c084fc' : tier >= 4 ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(68, -12, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(69, -12, 2.2, 5.2, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(71, -14, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Jaw & teeth (larger teeth on higher tiers)
      ctx.save();
      ctx.translate(76, 8);
      ctx.rotate(jawAngle);
      ctx.fillStyle = tier >= 6 ? '#312e81' : '#0369a1';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(20, 8, 32 + tier, 2);
      ctx.quadraticCurveTo(12, 16, -6, 11);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      const toothLen = 6.5 + tier * 0.65;
      for (let t = 0; t < 6; t++) {
        const tx = t * 4.7;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + 2.5, toothLen);
        ctx.lineTo(tx + 5, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    };

    [
      { k: sharkTexKey('closed', tier), j: 0.04 },
      { k: sharkTexKey('half', tier), j: 0.38 },
      { k: sharkTexKey('wide', tier), j: 0.78 }
    ].forEach(({ k, j }) => {
      if (scene.textures.exists(k)) return;
      const c = mk(295, 195);
      drawShark(c.getContext('2d')!, j);
      scene.textures.addCanvas(k, c);
    });
  }

  // ============ WORLD & ENEMY ARTWORK FACTORY ============
  function buildWorldTextures(scene: Phaser.Scene) {
    const mk = (w: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };

    // Enemy 1: Hunter Shark
    if (scene.textures.exists('enemy-hunter')) scene.textures.remove('enemy-hunter');
    const cE = mk(260, 150);
    const ctxE = cE.getContext('2d')!;
    ctxE.translate(130, 75);
    const gradE = ctxE.createLinearGradient(-90, -40, 80, 40);
    gradE.addColorStop(0, '#2e020d');
    gradE.addColorStop(0.35, '#991b1b');
    gradE.addColorStop(0.7, '#dc2626');
    gradE.addColorStop(0.9, '#f87171');
    gradE.addColorStop(1, '#ffffff');
    ctxE.fillStyle = gradE;
    ctxE.beginPath();
    ctxE.moveTo(95, 0);
    ctxE.bezierCurveTo(85, -28, 25, -36, -25, -32);
    ctxE.bezierCurveTo(-65, -26, -95, -16, -118, -10);
    ctxE.lineTo(-145, -34);
    ctxE.lineTo(-130, 0);
    ctxE.lineTo(-145, 34);
    ctxE.bezierCurveTo(-85, 30, -40, 34, 5, 30);
    ctxE.bezierCurveTo(45, 28, 75, 16, 95, 0);
    ctxE.closePath();
    ctxE.fill();
    ctxE.fillStyle = '#ef4444';
    ctxE.beginPath();
    ctxE.arc(60, -8, 6.5, 0, Math.PI * 2);
    ctxE.fill();
    ctxE.fillStyle = '#000000';
    ctxE.beginPath();
    ctxE.arc(62, -8, 2.5, 0, Math.PI * 2);
    ctxE.fill();
    scene.textures.addCanvas('enemy-hunter', cE);

    // Enemy 2: Pufferfish (spiked)
    if (scene.textures.exists('enemy-puffer')) scene.textures.remove('enemy-puffer');
    const cPf = mk(120, 120);
    const ctxPf = cPf.getContext('2d')!;
    ctxPf.translate(60, 60);
    ctxPf.fillStyle = '#f59e0b';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctxPf.beginPath();
      ctxPf.moveTo(Math.cos(a - 0.14) * 30, Math.sin(a - 0.14) * 30);
      ctxPf.lineTo(Math.cos(a) * 52, Math.sin(a) * 52);
      ctxPf.lineTo(Math.cos(a + 0.14) * 30, Math.sin(a + 0.14) * 30);
      ctxPf.closePath();
      ctxPf.fill();
    }
    const gPf = ctxPf.createRadialGradient(-8, -8, 4, 0, 0, 34);
    gPf.addColorStop(0, '#fef08a');
    gPf.addColorStop(0.6, '#d97706');
    gPf.addColorStop(1, '#78350f');
    ctxPf.fillStyle = gPf;
    ctxPf.beginPath();
    ctxPf.arc(0, 0, 34, 0, Math.PI * 2);
    ctxPf.fill();
    ctxPf.fillStyle = '#0f172a';
    ctxPf.beginPath();
    ctxPf.arc(14, -8, 4, 0, Math.PI * 2);
    ctxPf.fill();
    scene.textures.addCanvas('enemy-puffer', cPf);

    // Enemy 3: Electric Stingray
    if (scene.textures.exists('enemy-ray')) scene.textures.remove('enemy-ray');
    const cRay = mk(180, 120);
    const ctxRay = cRay.getContext('2d')!;
    ctxRay.translate(90, 60);
    const gRay = ctxRay.createLinearGradient(-50, -45, 50, 45);
    gRay.addColorStop(0, '#1e3a8a');
    gRay.addColorStop(0.5, '#0284c7');
    gRay.addColorStop(1, '#22d3ee');
    ctxRay.fillStyle = gRay;
    ctxRay.beginPath();
    ctxRay.moveTo(68, 0);
    ctxRay.quadraticCurveTo(0, -54, -46, -16);
    ctxRay.lineTo(-82, 0);
    ctxRay.lineTo(-46, 16);
    ctxRay.quadraticCurveTo(0, 54, 68, 0);
    ctxRay.closePath();
    ctxRay.fill();
    ctxRay.strokeStyle = '#67e8f9';
    ctxRay.lineWidth = 2.5;
    ctxRay.stroke();
    scene.textures.addCanvas('enemy-ray', cRay);

    // Enemy 4: Swordfish Charger
    if (scene.textures.exists('enemy-swordfish')) scene.textures.remove('enemy-swordfish');
    const cSw = mk(280, 110);
    const ctxSw = cSw.getContext('2d')!;
    ctxSw.translate(130, 55);
    ctxSw.fillStyle = '#cbd5e1';
    ctxSw.beginPath();
    ctxSw.moveTo(65, -4);
    ctxSw.lineTo(138, 0);
    ctxSw.lineTo(65, 5);
    ctxSw.closePath();
    ctxSw.fill();
    const gSw = ctxSw.createLinearGradient(-80, -24, 65, 24);
    gSw.addColorStop(0, '#0f172a');
    gSw.addColorStop(0.6, '#1d4ed8');
    gSw.addColorStop(1, '#93c5fd');
    ctxSw.fillStyle = gSw;
    ctxSw.beginPath();
    ctxSw.ellipse(0, 0, 72, 22, 0, 0, Math.PI * 2);
    ctxSw.fill();
    ctxSw.fillStyle = '#1e40af';
    ctxSw.beginPath();
    ctxSw.moveTo(-25, -18);
    ctxSw.lineTo(-5, -48);
    ctxSw.lineTo(12, -18);
    ctxSw.closePath();
    ctxSw.fill();
    ctxSw.fillStyle = '#ef4444';
    ctxSw.beginPath();
    ctxSw.arc(46, -5, 4.5, 0, Math.PI * 2);
    ctxSw.fill();
    scene.textures.addCanvas('enemy-swordfish', cSw);

    // Enemy 5: Harpoon Diver
    if (scene.textures.exists('enemy-diver')) scene.textures.remove('enemy-diver');
    const cDv = mk(140, 100);
    const ctxDv = cDv.getContext('2d')!;
    ctxDv.translate(70, 50);
    ctxDv.fillStyle = '#0f172a';
    ctxDv.fillRect(-34, -14, 52, 26);
    ctxDv.fillStyle = '#f97316';
    ctxDv.fillRect(-20, -22, 28, 10);
    ctxDv.fillStyle = '#fbbf24';
    ctxDv.beginPath();
    ctxDv.arc(24, -4, 15, 0, Math.PI * 2);
    ctxDv.fill();
    ctxDv.fillStyle = '#38bdf8';
    ctxDv.fillRect(24, -10, 12, 10);
    ctxDv.fillStyle = '#94a3b8';
    ctxDv.fillRect(10, 8, 46, 5);
    scene.textures.addCanvas('enemy-diver', cDv);

    // Harpoon Bolt
    if (scene.textures.exists('harpoon-bolt')) scene.textures.remove('harpoon-bolt');
    const cHb = mk(48, 16);
    const ctxHb = cHb.getContext('2d')!;
    ctxHb.fillStyle = '#fbbf24';
    ctxHb.fillRect(0, 6, 36, 4);
    ctxHb.fillStyle = '#ffffff';
    ctxHb.beginPath();
    ctxHb.moveTo(34, 2);
    ctxHb.lineTo(48, 8);
    ctxHb.lineTo(34, 14);
    ctxHb.closePath();
    ctxHb.fill();
    scene.textures.addCanvas('harpoon-bolt', cHb);

    // Boss Energy Orb
    if (scene.textures.exists('boss-orb')) scene.textures.remove('boss-orb');
    const cOrb = mk(36, 36);
    const ctxOrb = cOrb.getContext('2d')!;
    const gOrb = ctxOrb.createRadialGradient(18, 18, 2, 18, 18, 16);
    gOrb.addColorStop(0, '#ffffff');
    gOrb.addColorStop(0.5, '#f472b6');
    gOrb.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctxOrb.fillStyle = gOrb;
    ctxOrb.beginPath();
    ctxOrb.arc(18, 18, 16, 0, Math.PI * 2);
    ctxOrb.fill();
    scene.textures.addCanvas('boss-orb', cOrb);

    // Gem Fish
    const makeGemFish = (key: string, c1: string, c2: string, c3: string, finCol: string) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const c = mk(110, 75);
      const ctx = c.getContext('2d')!;
      ctx.translate(55, 38);
      const g = ctx.createLinearGradient(-35, -20, 30, 20);
      g.addColorStop(0, c1);
      g.addColorStop(0.5, c2);
      g.addColorStop(1, c3);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = finCol;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(46, -20);
      ctx.lineTo(38, 0);
      ctx.lineTo(46, 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-10, -8, 16, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-18, -4, 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-19, -4, 2.6, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas(key, c);
    };

    makeGemFish('fish-sapphire', '#bae6fd', '#0284c7', '#0369a1', '#38bdf8');
    makeGemFish('fish-emerald', '#a7f3d0', '#059669', '#064e3b', '#34d399');
    makeGemFish('fish-ruby', '#fecdd3', '#e11d48', '#881337', '#fb7185');
    makeGemFish('fish-amber', '#fef08a', '#d97706', '#78350f', '#fbbf24');
    makeGemFish('fish-amethyst', '#e9d5ff', '#9333ea', '#581c87', '#c084fc');

    // Boats
    const makeBoat = (key: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const c = mk(300, 180);
      draw(c.getContext('2d')!);
      scene.textures.addCanvas(key, c);
    };

    makeBoat('boat-fish', (x) => {
      x.fillStyle = '#78350f';
      x.beginPath();
      x.moveTo(25, 115);
      x.lineTo(55, 165);
      x.lineTo(245, 165);
      x.lineTo(275, 115);
      x.closePath();
      x.fill();
      x.fillStyle = '#f8fafc';
      x.fillRect(95, 60, 95, 55);
      x.fillStyle = '#0284c7';
      x.fillRect(105, 70, 24, 20);
      x.fillRect(145, 70, 24, 20);
    });

    makeBoat('boat-sail', (x) => {
      x.fillStyle = '#451a03';
      x.beginPath();
      x.moveTo(35, 125);
      x.lineTo(65, 165);
      x.lineTo(235, 165);
      x.lineTo(265, 125);
      x.closePath();
      x.fill();
      x.fillStyle = '#f1f5f9';
      x.beginPath();
      x.moveTo(150, 20);
      x.lineTo(150, 120);
      x.lineTo(65, 120);
      x.closePath();
      x.fill();
    });

    makeBoat('boat-yacht', (x) => {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.moveTo(20, 130);
      x.lineTo(48, 165);
      x.lineTo(252, 165);
      x.lineTo(280, 130);
      x.closePath();
      x.fill();
      x.fillStyle = '#0284c7';
      x.fillRect(75, 95, 140, 35);
    });

    makeBoat('boat-cargo', (x) => {
      x.fillStyle = '#1e293b';
      x.fillRect(25, 125, 250, 40);
      x.fillStyle = '#ef4444';
      x.fillRect(45, 90, 60, 35);
      x.fillStyle = '#f59e0b';
      x.fillRect(115, 90, 60, 35);
    });

    makeBoat('boat-canoe', (x) => {
      x.fillStyle = '#92400e';
      x.beginPath();
      x.moveTo(60, 140);
      x.lineTo(85, 165);
      x.lineTo(215, 165);
      x.lineTo(240, 140);
      x.closePath();
      x.fill();
    });

    // Fauna
    if (scene.textures.exists('dolphin')) scene.textures.remove('dolphin');
    const cDol = mk(240, 110);
    const ctxD = cDol.getContext('2d')!;
    ctxD.translate(120, 55);
    ctxD.fillStyle = '#38bdf8';
    ctxD.beginPath();
    ctxD.ellipse(0, 0, 65, 24, 0, 0, Math.PI * 2);
    ctxD.fill();
    scene.textures.addCanvas('dolphin', cDol);

    if (scene.textures.exists('whale')) scene.textures.remove('whale');
    const cWh = mk(360, 160);
    const ctxW = cWh.getContext('2d')!;
    ctxW.translate(180, 80);
    ctxW.fillStyle = '#0f172a';
    ctxW.beginPath();
    ctxW.ellipse(0, 0, 130, 52, 0, 0, Math.PI * 2);
    ctxW.fill();
    scene.textures.addCanvas('whale', cWh);

    if (scene.textures.exists('seal')) scene.textures.remove('seal');
    const cSeal = mk(140, 70);
    const ctxS = cSeal.getContext('2d')!;
    ctxS.fillStyle = '#78716c';
    ctxS.beginPath();
    ctxS.ellipse(70, 35, 48, 22, 0, 0, Math.PI * 2);
    ctxS.fill();
    ctxS.fillStyle = '#1c1917';
    ctxS.beginPath();
    ctxS.arc(104, 28, 3.5, 0, Math.PI * 2);
    ctxS.fill();
    scene.textures.addCanvas('seal', cSeal);

    if (scene.textures.exists('gull')) scene.textures.remove('gull');
    const cGull = mk(70, 50);
    const ctxG = cGull.getContext('2d')!;
    ctxG.fillStyle = '#ffffff';
    ctxG.beginPath();
    ctxG.moveTo(10, 25);
    ctxG.quadraticCurveTo(35, 5, 60, 25);
    ctxG.fill();
    scene.textures.addCanvas('gull', cGull);

    if (scene.textures.exists('net-trap')) scene.textures.remove('net-trap');
    const cNet = mk(130, 160);
    const ctxNet = cNet.getContext('2d')!;
    ctxNet.strokeStyle = '#e2e8f0';
    ctxNet.lineWidth = 2.2;
    for (let i = 0; i <= 9; i++) {
      ctxNet.beginPath();
      ctxNet.moveTo(i * 14, 0);
      ctxNet.lineTo(i * 14, 160);
      ctxNet.stroke();
    }
    for (let j = 0; j <= 10; j++) {
      ctxNet.beginPath();
      ctxNet.moveTo(0, j * 16);
      ctxNet.lineTo(130, j * 16);
      ctxNet.stroke();
    }
    scene.textures.addCanvas('net-trap', cNet);

    if (scene.textures.exists('fish-hook')) scene.textures.remove('fish-hook');
    const cHook = mk(34, 46);
    const ctxHook = cHook.getContext('2d')!;
    ctxHook.strokeStyle = '#cbd5e1';
    ctxHook.lineWidth = 3.5;
    ctxHook.beginPath();
    ctxHook.moveTo(17, 4);
    ctxHook.lineTo(17, 28);
    ctxHook.arc(17, 32, 8, Math.PI, 0, false);
    ctxHook.stroke();
    scene.textures.addCanvas('fish-hook', cHook);

    // Boss Jelly
    if (scene.textures.exists('boss-jelly')) scene.textures.remove('boss-jelly');
    const cJ = mk(240, 260);
    const ctxJ = cJ.getContext('2d')!;
    ctxJ.translate(120, 110);
    const jGrad = ctxJ.createRadialGradient(0, -10, 5, 0, 0, 95);
    jGrad.addColorStop(0, '#ffffff');
    jGrad.addColorStop(0.35, '#f472b6');
    jGrad.addColorStop(0.75, '#a855f7');
    jGrad.addColorStop(1, 'rgba(126, 34, 206, 0.15)');
    ctxJ.fillStyle = jGrad;
    ctxJ.beginPath();
    ctxJ.arc(0, 0, 90, Math.PI, 0);
    ctxJ.quadraticCurveTo(90, 48, 0, 48);
    ctxJ.quadraticCurveTo(-90, 48, -90, 0);
    ctxJ.closePath();
    ctxJ.fill();
    ctxJ.strokeStyle = '#f472b6';
    ctxJ.lineWidth = 3.5;
    for (let i = -3; i <= 3; i++) {
      ctxJ.beginPath();
      ctxJ.moveTo(i * 20, 45);
      ctxJ.bezierCurveTo(i * 24 + 14, 85, i * 20 - 18, 125, i * 22, 160);
      ctxJ.stroke();
    }
    scene.textures.addCanvas('boss-jelly', cJ);

    // Drops
    const makeDrop = (key: string, drawIcon: (ctx: CanvasRenderingContext2D) => void) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const c = mk(44, 44);
      const ctx = c.getContext('2d')!;
      ctx.translate(22, 22);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIcon(ctx);
      scene.textures.addCanvas(key, c);
    };

    makeDrop('drop-coin', (x) => {
      x.fillStyle = '#fbbf24';
      x.beginPath();
      x.arc(0, 0, 14, 0, Math.PI * 2);
      x.fill();
    });

    makeDrop('drop-gem', (x) => {
      x.fillStyle = '#c084fc';
      x.beginPath();
      x.moveTo(0, -13);
      x.lineTo(13, 0);
      x.lineTo(0, 13);
      x.lineTo(-13, 0);
      x.closePath();
      x.fill();
    });

    makeDrop('drop-shield', (x) => {
      x.fillStyle = '#38bdf8';
      x.font = 'bold 18px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('🛡️', 0, 1);
    });

    makeDrop('drop-magnet', (x) => {
      x.fillStyle = '#f472b6';
      x.font = 'bold 18px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('🧲', 0, 1);
    });

    makeDrop('drop-star', (x) => {
      x.fillStyle = '#facc15';
      x.font = 'bold 18px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('⭐', 0, 1);
    });

    makeDrop('drop-clock', (x) => {
      x.fillStyle = '#67e8f9';
      x.font = 'bold 18px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('⏳', 0, 1);
    });

    if (scene.textures.exists('chest-gold')) scene.textures.remove('chest-gold');
    const cCh = mk(84, 62);
    const ctxCh = cCh.getContext('2d')!;
    ctxCh.fillStyle = '#78350f';
    ctxCh.fillRect(10, 18, 64, 38);
    ctxCh.fillStyle = '#f59e0b';
    ctxCh.fillRect(10, 26, 64, 6);
    ctxCh.fillRect(38, 10, 8, 46);
    scene.textures.addCanvas('chest-gold', cCh);

    const mkSpark = (key: string, col: string) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const c = mk(24, 24);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas(key, c);
    };

    mkSpark('p-gold', '#fbbf24');
    mkSpark('p-blood', '#ef4444');
    mkSpark('p-blue', '#38bdf8');
    mkSpark('p-white', '#ffffff');
  }

  // ============ DYNAMIC BIOME ENVIRONMENT RENDERER ============
  function renderBiomeEnvironment(scene: Phaser.Scene, cfg: StageConfig) {
    const theme = cfg.biome;

    if (skyGfx) skyGfx.destroy();
    skyGfx = scene.add.graphics().setDepth(-99);
    skyGfx.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyBot, theme.skyBot, 1);
    skyGfx.fillRect(0, -SKY_H, W, SKY_H);

    if (bgGfx) bgGfx.destroy();
    bgGfx = scene.add.graphics().setDepth(-100);
    bgGfx.fillGradientStyle(theme.top, theme.mid, theme.bot, theme.bot, 1);
    bgGfx.fillRect(0, 0, W, H);

    while (rayGfxList.length > 0) {
      rayGfxList.pop()?.destroy();
    }
    for (let i = 0; i < 20; i++) {
      const ray = scene.add.graphics().setDepth(-90).setBlendMode(Phaser.BlendModes.ADD);
      const rx = 80 + i * 280 + ((cfg.stage * 37 + i * 19) % 50);
      ray.fillStyle(theme.glow, 0.08);
      ray.beginPath();
      ray.moveTo(rx, -20);
      ray.lineTo(rx + 70, -20);
      ray.lineTo(rx + 220, H);
      ray.lineTo(rx - 70, H);
      ray.closePath();
      ray.fillPath();
      rayGfxList.push(ray);
    }

    if (sandGfx) sandGfx.destroy();
    sandGfx = scene.add.graphics().setDepth(-60);
    sandGfx.fillStyle(theme.sand, 0.95);
    sandGfx.beginPath();
    sandGfx.moveTo(0, H);
    sandGfx.lineTo(0, H - 75);
    for (let x = 0; x <= W; x += 110) {
      sandGfx.lineTo(x, H - 75 + Math.sin(x * 0.015 + cfg.seabedPhase) * (16 + (cfg.subStage % 3) * 6));
    }
    sandGfx.lineTo(W, H);
    sandGfx.closePath();
    sandGfx.fillPath();

    // Coral / Ruin / Rock formations per biome
    sandGfx.fillStyle(theme.coral, 0.65);
    for (let k = 0; k < 14; k++) {
      const rx = 220 + k * 360 + ((cfg.stage * 73) % 90);
      const rh = 42 + ((k * 29 + cfg.stage * 11) % 64);
      sandGfx.fillRoundedRect(rx, H - 65 - rh * 0.5, 22 + (k % 3) * 10, rh, 8);
    }

    while (weeds.length > 0) {
      weeds.pop()?.g.destroy();
    }
    for (let i = 0; i < 75; i++) {
      const g = scene.add.graphics().setDepth(-55);
      weeds.push({
        g,
        x: Math.random() * W,
        y: H - 15,
        h: 120 + Math.random() * 230,
        color: i % 2 === 0 ? theme.weedA : theme.weedB,
        seed: Math.random() * 10
      });
    }
  }

  function spawnBoats(scene: Phaser.Scene) {
    boats.forEach(b => b.sprite.destroy());
    boats.length = 0;
    const boatTypes = ['boat-fish', 'boat-sail', 'boat-yacht', 'boat-cargo', 'boat-canoe'];
    for (let i = 0; i < 7; i++) {
      const type = boatTypes[i % boatTypes.length];
      const bx = 300 + i * 750 + Math.random() * 120;
      const bImg = scene.add.image(bx, 0, type).setOrigin(0.5, 1).setDepth(-30);
      bImg.setScale(0.75);
      boats.push({
        sprite: bImg,
        speed: (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 20),
        hornCd: 12000 + Math.random() * 20000,
        hookCd: 6000 + Math.random() * 8000,
        netCd: 15000 + Math.random() * 14000
      });
    }
  }

  function spawnCreatures(scene: Phaser.Scene) {
    dolphins.forEach(d => d.sprite.destroy());
    dolphins.length = 0;
    whales.forEach(w => w.sprite.destroy());
    whales.length = 0;
    seals.forEach(s => s.sprite.destroy());
    seals.length = 0;
    gulls.forEach(g => g.sprite.destroy());
    gulls.length = 0;

    for (let i = 0; i < 3; i++) {
      const d = scene.add.image(600 + i * 1400, -20, 'dolphin').setDepth(15).setScale(0.85);
      dolphins.push({ sprite: d, vx: 190, timer: i * 1.5 });
    }

    const w = scene.add.image(2800, 45, 'whale').setDepth(-20).setScale(0.9);
    whales.push({ sprite: w, vx: 45, blowCd: 5000 });

    for (let i = 0; i < 4; i++) {
      const s = scene.physics.add.sprite(700 + i * 1100, 26, 'seal').setDepth(8).setScale(0.75);
      seals.push({ sprite: s, vx: (i % 2 === 0 ? 1 : -1) * 65, diveTimer: 0 });
    }

    for (let i = 0; i < 6; i++) {
      const g = scene.add.image(400 + i * 850, -140 - Math.random() * 100, 'gull').setDepth(20).setScale(0.8);
      gulls.push({ sprite: g, vx: 75 + Math.random() * 40 });
    }
  }

  function spawnFish(scene: Phaser.Scene, nearX?: number, nearY?: number) {
    if (fishes.length >= 42) return;
    const types = ['fish-sapphire', 'fish-emerald', 'fish-ruby', 'fish-amber', 'fish-amethyst'];
    const type = types[Math.floor(Math.random() * types.length)];

    let sx = nearX !== undefined ? nearX + (Math.random() - 0.5) * 900 : Math.random() * W;
    let sy = nearY !== undefined ? nearY + (Math.random() - 0.5) * 550 : 120 + Math.random() * (H - 260);

    sx = Phaser.Math.Clamp(sx, 120, W - 120);
    sy = Phaser.Math.Clamp(sy, 120, H - 120);

    const f = scene.physics.add.sprite(sx, sy, type);
    f.setDepth(10);
    f.setScale(0.65 + Math.random() * 0.2);

    const baseSpd = 55 + Math.random() * 55 + currentStageNum * 0.35;
    const dir = Math.random() > 0.5 ? 1 : -1;
    f.setVelocityX(dir * baseSpd);
    f.setVelocityY((Math.random() - 0.5) * 30);
    f.setFlipX(dir > 0);

    (f as any).baseSpd = baseSpd;
    (f as any).dirTimer = 2000 + Math.random() * 3000;

    fishes.push(f);
  }

  function spawnEnemy(scene: Phaser.Scene) {
    const cfg = getStageConfig(currentStageNum);
    if (cfg.enemyTarget <= 0 || levelEnemyKilled >= cfg.enemyTarget || enemies.length >= 7) return;

    const sx = shark ? shark.x + (Math.random() > 0.5 ? 1 : -1) * (760 + Math.random() * 240) : Math.random() * W;
    const sy = 160 + Math.random() * (H - 360);

    const pool = cfg.biome.enemyBias;
    const kind = pool[Math.floor(Math.random() * pool.length)] || 'hunter';
    const texMap: Record<string, string> = {
      hunter: 'enemy-hunter',
      puffer: 'enemy-puffer',
      ray: 'enemy-ray',
      swordfish: 'enemy-swordfish',
      diver: 'enemy-diver'
    };

    const e = scene.physics.add.sprite(Phaser.Math.Clamp(sx, 120, W - 120), sy, texMap[kind]);
    e.setDepth(14);
    e.setScale(kind === 'puffer' ? 0.85 : kind === 'diver' ? 0.9 : 0.72);

    const hpMult = kind === 'swordfish' ? 1.25 : kind === 'puffer' ? 0.95 : kind === 'diver' ? 0.85 : 1;
    (e as any).kind = kind;
    (e as any).hp = Math.round(cfg.enemyHp * hpMult);
    (e as any).maxHp = (e as any).hp;
    (e as any).dmg = Math.round(cfg.enemyDmg * (kind === 'swordfish' ? 1.2 : 1));
    (e as any).hitCooldown = false;
    (e as any).stunTimer = 0;
    (e as any).actionTimer = 1800 + Math.random() * 1400;
    (e as any).chargeTimer = 0;
    (e as any).dashVx = 0;
    (e as any).dashVy = 0;
    (e as any).puffed = false;

    enemies.push(e);
  }

  function applySharkScaleAndSkin() {
    if (!shark || !shark.active || !shark.scene) return;
    const evo = getEvoSpec();
    const closedKey = sharkTexKey('closed', evolutionTier);
    if (shark.scene.textures.exists(closedKey) && shark.texture?.key !== closedKey) {
      shark.setTexture(closedKey);
    }
    shark.setScale(evo.scale);
    shark.setTint(SKIN_TINTS[currentSkin] || 0xffffff);
  }

  // Загрузка любого этапа 1..100
  function loadLevel(scene: Phaser.Scene, stageNumber: number) {
    isLevelEnding = false;
    activeSummary = null;
    currentStageNum = Math.max(1, Math.min(TOTAL_STAGES, stageNumber));
    if (currentStageNum > highestLevel) {
      highestLevel = currentStageNum;
    }

    // Гарантированная разблокировка Щита при достижении 3-го этапа
    let shieldAutoUnlocked = false;
    if (currentStageNum >= 3 && !hasShieldUnlocked) {
      hasShieldUnlocked = true;
      shieldAutoUnlocked = true;
      persistSave();
    }

    const cfg = getStageConfig(currentStageNum);
    levelFishEaten = 0;
    levelEnemyKilled = 0;
    runCoins = 0;
    playerInvulnTimer = 0;
    biteCooldownTimer = 0;
    slowDebuffTimer = 0;
    clockTimer = 0;
    magnetTimer = 0;
    starTimer = 0;
    if (scene.time) scene.time.timeScale = 1;

    playerHpMax = computePlayerHpMax();
    playerHp = playerHpMax;
    playerEnergy = playerEnergyMax;

    fishes.forEach(f => f.destroy());
    fishes.length = 0;
    enemies.forEach(e => e.destroy());
    enemies.length = 0;
    enemyProjectiles.forEach(p => p.destroy());
    enemyProjectiles.length = 0;
    drops.forEach(d => d.destroy());
    drops.length = 0;
    hooks.forEach(h => {
      h.line.destroy();
      h.sprite.destroy();
    });
    hooks.length = 0;
    ropedNets.forEach(n => {
      n.rope.destroy();
      n.sprite.destroy();
    });
    ropedNets.length = 0;
    caughtInNetObj = null;

    if (bossJelly) {
      bossJelly.destroy();
      bossJelly = null;
    }

    // Перерисовка биома под новый этап!
    renderBiomeEnvironment(scene, cfg);
    buildSharkEvolutionTextures(scene, evolutionTier);

    if (shark && shark.scene) {
      shark.setTexture(sharkTexKey('closed', evolutionTier));
      shark.setPosition(W / 2, H / 2);
      shark.setVelocity(0, 0);
      shark.setAlpha(1);
      applySharkScaleAndSkin();
      scene.cameras.main.centerOn(shark.x, shark.y);
    }

    // Стартовый косяк вокруг акулы
    for (let i = 0; i < 24; i++) {
      spawnFish(scene, W / 2, H / 2);
    }

    // 4 сундука на дне
    for (let c = 0; c < 4; c++) {
      const cx = W / 5 + c * (W / 5);
      const ch = scene.physics.add.sprite(cx, H - 90, 'chest-gold').setDepth(12);
      (ch as any).isChest = true;
      drops.push(ch);
    }

    spawnBoats(scene);
    spawnCreatures(scene);

    const stageLabel = getStageDisplayName(cfg.stage, activeLocale);

    if (cfg.bossKind !== 'none') {
      bossJelly = scene.physics.add.sprite(W / 2, 320, 'boss-jelly').setDepth(16);
      (bossJelly as any).hp = cfg.bossHp;
      (bossJelly as any).maxHp = cfg.bossHp;
      (bossJelly as any).phase = 1;
      (bossJelly as any).attackTimer = 2600;
      (bossJelly as any).telegraphTimer = 0;
      (bossJelly as any).attackMode = 'pulse';
      (bossJelly as any).contactCd = 0;
      (bossJelly as any).lungeVx = 0;
      (bossJelly as any).lungeVy = 0;
      bossJelly.setScale(cfg.bossKind === 'eraBoss' ? 1.05 : 0.85);
      if (cfg.bossKind === 'eraBoss') {
        bossJelly.setTint(0xf43f5e);
      }

      notifyState(
        shieldAutoUnlocked ? tr().ingame.shieldUnlockedLvl3 : null,
        {
          title: cfg.bossKind === 'eraBoss' ? tr().ingame.bossAlert : tr().ingame.miniBossAlert,
          sub: stageLabel
        }
      );
      audio.play('boss');
    } else {
      notifyState(
        shieldAutoUnlocked ? tr().ingame.shieldUnlockedLvl3 : null,
        {
          title: tr().ingame.levelTitle(cfg.stage),
          sub: stageLabel
        }
      );
    }
  }

  // Главная сцена Phaser
  class MainOceanScene extends Phaser.Scene {
    constructor() {
      super({ key: 'MainOceanScene' });
    }

    create() {
      sceneRef = this;
      buildWorldTextures(this);
      buildSharkEvolutionTextures(this, evolutionTier);

      sunObj = this.add.circle(CAM_W / 2, -SKY_H / 2, 40, 0xfef08a, 0.95).setDepth(-88);
      moonObj = this.add.circle(CAM_W / 2, -SKY_H / 2, 28, 0xf8fafc, 0.9).setDepth(-88);
      moonObj.setVisible(false);

      for (let i = 0; i < 110; i++) {
        const b = this.add
          .circle(Math.random() * W, Math.random() * H, 2 + Math.random() * 4.5, 0xffffff, 0.35)
          .setDepth(-40);
        bubbles.push({ obj: b, vy: -0.4 - Math.random() * 0.6 });
      }

      auraGfx = this.add.graphics().setDepth(19);
      telegraphGfx = this.add.graphics().setDepth(17);

      shark = this.physics.add.sprite(W / 2, H / 2, sharkTexKey('closed', evolutionTier)).setDepth(20);
      applySharkScaleAndSkin();
      shark.body!.setSize(180, 70).setOffset(40, 45);

      pGold = this.add
        .particles(0, 0, 'p-gold', { speed: { min: 60, max: 220 }, scale: { start: 1.1, end: 0 }, lifespan: 480, emitting: false })
        .setDepth(25);
      pBlood = this.add
        .particles(0, 0, 'p-blood', { speed: { min: 40, max: 180 }, scale: { start: 1.3, end: 0 }, lifespan: 550, emitting: false })
        .setDepth(25);
      pBlue = this.add
        .particles(0, 0, 'p-blue', { speed: { min: 50, max: 200 }, scale: { start: 1.1, end: 0 }, lifespan: 420, emitting: false })
        .setDepth(22);
      pWhite = this.add
        .particles(0, 0, 'p-white', { speed: { min: 70, max: 260 }, scale: { start: 1.2, end: 0 }, lifespan: 650, emitting: false })
        .setDepth(30);

      // Адаптивная камера под любые экраны (iPhone 13-16, планшеты, ПК)
      const applyCameraViewport = (vw: number, vh: number) => {
        if (!this.sys || !this.cameras || !this.cameras.main) return;
        const safeW = Math.max(320, vw);
        const safeH = Math.max(320, vh);
        const minWorldZoom = Math.max(safeW / W, safeH / (H + SKY_H)) + 0.02;
        const targetZoom = Math.min(safeW / 960, safeH / 620);
        const zoom = Phaser.Math.Clamp(targetZoom, Math.max(0.52, minWorldZoom), 1.35);
        this.cameras.main.setZoom(zoom);
        this.cameras.main.setBounds(0, -SKY_H, W, H + SKY_H);
      };

      applyCameraViewport(this.scale.width, this.scale.height);
      const handleScaleResize = (gameSize: { width: number; height: number }) => {
        applyCameraViewport(gameSize.width, gameSize.height);
      };
      this.scale.on('resize', handleScaleResize);
      this.events.once('shutdown', () => {
        this.scale.off('resize', handleScaleResize);
      });
      this.events.once('destroy', () => {
        this.scale.off('resize', handleScaleResize);
      });

      this.cameras.main.centerOn(shark.x, shark.y);
      this.cameras.main.startFollow(shark, true, 0.1, 0.1);

      if (this.input.keyboard) {
        cursors = this.input.keyboard.createCursorKeys();
        keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E') as any;
        this.input.keyboard.on('keydown-SPACE', () => doDash(this));
        this.input.keyboard.on('keydown-E', () => doKeyEAction(this));
      }

      this.time.addEvent({
        delay: 850,
        loop: true,
        callback: () => {
          if (!isPaused && !isLevelEnding) spawnFish(this);
        }
      });
      this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => {
          if (!isPaused && !isLevelEnding) spawnEnemy(this);
        }
      });

      loadLevel(this, currentStageNum);
    }

    update(time: number, delta: number) {
      if (isPaused || isLevelEnding || !shark) return;
      const rawDt = Math.min(delta, 50);

      // Хитстоп (краткая пауза кадра при мощном крите/добивании)
      if (hitstopTimer > 0) {
        hitstopTimer -= rawDt;
        shark.setVelocity(0, 0);
        return;
      }

      const dt = rawDt;
      const cfg = getStageConfig(currentStageNum);
      const evo = getEvoSpec();
      const perk = getSkinPerk();

      if (telegraphGfx) telegraphGfx.clear();

      // Таймеры игрока
      playerInvulnTimer = Math.max(0, playerInvulnTimer - dt);
      biteCooldownTimer = Math.max(0, biteCooldownTimer - dt);
      slowDebuffTimer = Math.max(0, slowDebuffTimer - dt);
      dashBurstTimer = Math.max(0, dashBurstTimer - dt);

      if (playerInvulnTimer > 0) {
        shark.setAlpha(Math.sin(time * 0.04) > 0 ? 0.45 : 1);
      } else {
        shark.setAlpha(1);
      }

      // Аура могущества эволюции
      if (auraGfx) {
        auraGfx.clear();
        if (evolutionTier >= 2 || isFrenzy) {
          const pulse = 1 + Math.sin(time * 0.006) * 0.08;
          const r = (46 + evolutionTier * 7) * pulse;
          const auraCol = isFrenzy ? 0xfbbf24 : evo.auraColor;
          auraGfx.lineStyle(isFrenzy ? 3 : 2, auraCol, isFrenzy ? 0.55 : 0.28 + evolutionTier * 0.04);
          auraGfx.strokeCircle(shark.x, shark.y, r);
        }
      }

      // Водоросли
      weeds.forEach(w => {
        w.g.clear();
        w.g.lineStyle(3, w.color, 0.85);
        w.g.beginPath();
        w.g.moveTo(w.x, w.y);
        const t = time * 0.002 + w.seed;
        const segs = 6;
        for (let s = 1; s <= segs; s++) {
          const f = s / segs;
          const sway = Math.sin(t + f * 2) * f * 35;
          w.g.lineTo(w.x + sway, w.y - w.h * f);
        }
        w.g.strokePath();
      });

      // Пузырьки
      bubbles.forEach(b => {
        b.obj.y += b.vy * dt * 0.1;
        if (b.obj.y < 0) {
          b.obj.y = H;
          b.obj.x = Math.random() * W;
        }
      });

      // Небо
      if (sunObj && moonObj) {
        const cycle = (time * 0.0001) % 1;
        const viewCenterX = this.cameras.main.worldView.centerX || W / 2;
        sunObj.x = viewCenterX + Math.cos(cycle * Math.PI * 2) * 380;
        sunObj.y = -SKY_H / 2 + Math.sin(cycle * Math.PI * 2) * 140;
        moonObj.x = viewCenterX - Math.cos(cycle * Math.PI * 2) * 380;
        moonObj.y = -SKY_H / 2 - Math.sin(cycle * Math.PI * 2) * 140;
        moonObj.setVisible(cycle > 0.5);
      }

      // Лодки + Крючки + Сети!
      boats.forEach(b => {
        b.sprite.x += b.speed * (dt / 1000);
        b.sprite.y = 0 + Math.sin(time * 0.002 + b.sprite.x) * 4;
        if (b.sprite.x > W + 200) b.sprite.x = -200;
        if (b.sprite.x < -200) b.sprite.x = W + 200;

        b.hornCd -= dt;
        if (b.hornCd <= 0) {
          b.hornCd = 26000 + Math.random() * 28000;
          if (shark && Math.abs(shark.x - b.sprite.x) < 950) {
            audio.play('horn');
            notifyState(tr().ingame.hornToast);
          }
        }

        b.hookCd -= dt;
        if (b.hookCd <= 0 && hooks.length < 3 && cfg.stage >= 2) {
          b.hookCd = 14000 + Math.random() * 12000;
          const hk = this.physics.add.sprite(b.sprite.x, 30, 'fish-hook').setDepth(15);
          const line = this.add.graphics().setDepth(14);
          hooks.push({ sprite: hk, line, boatX: b.sprite.x });
        }

        // Оживление сетей (ropedNets) начиная с 4 этапа!
        b.netCd -= dt;
        if (b.netCd <= 0 && ropedNets.length < 2 && cfg.stage >= 4 && !caughtInNetObj) {
          b.netCd = 18000 + Math.random() * 14000;
          if (Math.abs(b.sprite.x - shark!.x) < 1100) {
            const netSp = this.physics.add.sprite(b.sprite.x, 85, 'net-trap').setDepth(15);
            const rope = this.add.graphics().setDepth(14);
            ropedNets.push({ sprite: netSp, rope, boatX: b.sprite.x, hp: 7500, life: 12000 });
          }
        }
      });

      // Крючки рыбаков
      for (let i = hooks.length - 1; i >= 0; i--) {
        const hk = hooks[i];
        if (!hk.sprite.active) {
          hk.line.destroy();
          hooks.splice(i, 1);
          continue;
        }
        hk.sprite.y += 35 * (dt / 1000);
        hk.line.clear();
        hk.line.lineStyle(1.5, 0xe2e8f0, 0.7);
        hk.line.beginPath();
        hk.line.moveTo(hk.boatX, 0);
        hk.line.lineTo(hk.sprite.x, hk.sprite.y);
        hk.line.strokePath();

        if (Phaser.Math.Distance.Between(shark.x, shark.y, hk.sprite.x, hk.sprite.y) < 35) {
          hurtShark(this, Math.round(cfg.enemyDmg * 0.9), hk.sprite.x, hk.sprite.y);
          notifyState(tr().ingame.hookToast);
          hk.line.destroy();
          hk.sprite.destroy();
          hooks.splice(i, 1);
          continue;
        }

        if (hk.sprite.y > 460) {
          hk.line.destroy();
          hk.sprite.destroy();
          hooks.splice(i, 1);
        }
      }

      // Сети рыбаков
      for (let i = ropedNets.length - 1; i >= 0; i--) {
        const net = ropedNets[i];
        if (!net.sprite.active) {
          net.rope.destroy();
          ropedNets.splice(i, 1);
          continue;
        }
        net.life -= dt;
        if (net !== caughtInNetObj) {
          net.sprite.y = Math.min(260, net.sprite.y + 42 * (dt / 1000));
        } else {
          net.sprite.setPosition(shark.x, shark.y);
        }

        net.rope.clear();
        net.rope.lineStyle(2, 0xfef08a, 0.8);
        net.rope.beginPath();
        net.rope.moveTo(net.boatX, 0);
        net.rope.lineTo(net.sprite.x, net.sprite.y - 60);
        net.rope.strokePath();

        if (!caughtInNetObj && Phaser.Math.Distance.Between(shark.x, shark.y, net.sprite.x, net.sprite.y) < 68) {
          caughtInNetObj = net;
          audio.play('hit');
          notifyState(null, { title: tr().ingame.caughtInNetTitle, sub: tr().ingame.caughtInNetSub });
        }

        if (net.life <= 0 && net !== caughtInNetObj) {
          net.rope.destroy();
          net.sprite.destroy();
          ropedNets.splice(i, 1);
        }
      }

      // Фауна (дельфины, киты, живые тюлени, чайки)
      dolphins.forEach(d => {
        d.timer += dt * 0.002;
        d.sprite.x += d.vx * (dt / 1000);
        d.sprite.y = -20 - Math.abs(Math.sin(d.timer)) * 95;
        if (d.sprite.x > W + 300) d.sprite.x = -300;
      });

      whales.forEach(w => {
        w.sprite.x += w.vx * (dt / 1000);
        w.sprite.y = 45 + Math.sin(time * 0.001) * 8;
        if (w.sprite.x > W + 400) w.sprite.x = -400;

        w.blowCd -= dt;
        if (w.blowCd <= 0) {
          w.blowCd = 12000 + Math.random() * 10000;
          if (shark && Math.abs(shark.x - w.sprite.x) < 850) {
            audio.play('whale');
            pWhite?.emitParticleAt(w.sprite.x, -10, 18);
          }
        }
      });

      // Живые тюлени: плавают у поверхности, уворачиваются, съедобны с Tier 3+!
      for (let i = seals.length - 1; i >= 0; i--) {
        const s = seals[i];
        if (!s.sprite.active) continue;
        s.sprite.x += s.vx * (dt / 1000);
        if (s.sprite.x < 120) s.vx = Math.abs(s.vx);
        if (s.sprite.x > W - 120) s.vx = -Math.abs(s.vx);
        s.sprite.setFlipX(s.vx < 0);
        const sDist = Phaser.Math.Distance.Between(shark.x, shark.y, s.sprite.x, s.sprite.y);
        if (sDist < 220) {
          s.vx = (s.sprite.x >= shark.x ? 1 : -1) * 145;
          s.sprite.y = Phaser.Math.Clamp(s.sprite.y + 45 * (dt / 1000), 20, 160);
        } else {
          s.sprite.y = Phaser.Math.Linear(s.sprite.y, 26, 0.04);
        }
        if (evolutionTier >= 3 && sDist < 62) {
          audio.play('bite');
          pBlood?.emitParticleAt(s.sprite.x, s.sprite.y, 16);
          const gained = addEarnedCoins(20);
          playerHp = Math.min(playerHpMax, playerHp + 18);
          score += 90;
          spawnFloatingText(this, s.sprite.x, s.sprite.y, `+${gained}🪙 +18HP`, '#fde047', '15px');
          s.sprite.setPosition(shark.x > W / 2 ? 250 : W - 250, 26);
        }
      }

      gulls.forEach(g => {
        g.sprite.x += g.vx * (dt / 1000);
        g.sprite.y += Math.sin(time * 0.003 + g.sprite.x) * 0.5;
        if (g.sprite.x > W + 200) g.sprite.x = -200;
      });

      // Управление акулой
      let mx = 0;
      let my = 0;
      if (cursors?.left.isDown || keys?.A.isDown) mx -= 1;
      if (cursors?.right.isDown || keys?.D.isDown) mx += 1;
      if (cursors?.up.isDown || keys?.W.isDown) my -= 1;
      if (cursors?.down.isDown || keys?.S.isDown) my += 1;

      if (touchInput.active) {
        mx = touchInput.x;
        my = touchInput.y;
      }

      const len = Math.sqrt(mx * mx + my * my);
      if (touchInput.active) {
        if (len > 1) {
          mx /= len;
          my /= len;
        } else if (len < 0.015) {
          mx = 0;
          my = 0;
        }
      } else if (len > 0.1) {
        mx /= len;
        my /= len;
      }

      const touchSprintBoost = touchInput.active && touchInput.sprint ? 1.25 : 1;
      const slowMult = slowDebuffTimer > 0 ? 0.65 : 1;
      const baseSpd =
        430 *
        (1 + skills.speed * 0.08) *
        (isFrenzy ? 1.4 : 1) *
        touchSprintBoost *
        slowMult;

      if (caughtInNetObj) {
        shark.setVelocity(0, 0);
      } else if (shark.y < 0) {
        shark.setVelocityX(shark.body!.velocity.x * 0.98);
        shark.setVelocityY(shark.body!.velocity.y + 1200 * (dt / 1000));
        if (!wasAboveWater) {
          wasAboveWater = true;
          audio.play('splash');
          pWhite?.emitParticleAt(shark.x, 0, 22);
          breachCount++;
          if (breachCount >= 5) unlockAchievement('jumper');
        }
      } else {
        if (dashBurstTimer > 0) {
          const dashSpd = 880 * (1 + skills.speed * 0.05);
          shark.setVelocity(dashBurstDir.x * dashSpd, dashBurstDir.y * dashSpd);
        } else {
          const targetVx = mx * baseSpd + cfg.currentForceX;
          const targetVy = my * baseSpd;
          if (touchInput.active || len < 0.05) {
            const curVx = shark.body?.velocity.x ?? 0;
            const curVy = shark.body?.velocity.y ?? 0;
            const alpha = 1 - Math.exp(-18 * (dt / 1000));
            shark.setVelocity(
              Phaser.Math.Linear(curVx, targetVx, alpha),
              Phaser.Math.Linear(curVy, targetVy, alpha)
            );
          } else {
            shark.setVelocity(targetVx, targetVy);
          }
        }
        if (wasAboveWater) {
          wasAboveWater = false;
          audio.play('splash');
          pWhite?.emitParticleAt(shark.x, 0, 25);
        }
      }

      if (mx > 0.025) shark.setFlipX(false);
      else if (mx < -0.025) shark.setFlipX(true);

      if (shark.y >= 0) {
        const rotAlpha = 1 - Math.exp(-12 * (dt / 1000));
        if (len > 0.025) {
          const targetRot = Math.atan2(my, mx * (shark.flipX ? -1 : 1)) * 0.35;
          shark.rotation = Phaser.Math.Linear(shark.rotation, targetRot, rotAlpha);
        } else {
          shark.rotation = Phaser.Math.Linear(shark.rotation, 0, rotAlpha * 0.5);
        }
      }

      // Границы мира для акулы
      shark.x = Phaser.Math.Clamp(shark.x, 60, W - 60);
      shark.y = Phaser.Math.Clamp(shark.y, -SKY_H + 50, H - 55);

      // Визуал щита
      if (isShieldActive) {
        playerEnergy = Math.max(0, playerEnergy - 9 * (dt / 1000));
        if (playerEnergy <= 0) {
          isShieldActive = false;
          audio.play('shieldOff');
          notifyState(tr().ingame.shieldDepleted);
        }
        if (!shieldVisualGfx) {
          shieldVisualGfx = this.add.graphics().setDepth(22);
        }
        const parryFlash = time - shieldActivatedAt <= 250;
        shieldVisualGfx.clear();
        shieldVisualGfx.lineStyle(parryFlash ? 4 : 3, parryFlash ? 0xfef08a : 0x38bdf8, 0.9);
        shieldVisualGfx.fillStyle(parryFlash ? 0xfbbf24 : 0x0284c7, 0.22);
        const sr = (72 + evolutionTier * 6) + Math.sin(time * 0.008) * 4;
        shieldVisualGfx.beginPath();
        shieldVisualGfx.arc(shark.x, shark.y, sr, 0, Math.PI * 2);
        shieldVisualGfx.fillPath();
        shieldVisualGfx.strokePath();
      } else if (shieldVisualGfx) {
        shieldVisualGfx.clear();
      }

      // Баффы и регенерация
      if (magnetTimer > 0) magnetTimer -= dt;
      if (starTimer > 0) starTimer -= dt;
      if (clockTimer > 0) {
        clockTimer -= dt;
        if (clockTimer <= 0) this.time.timeScale = 1;
      }

      if (playerEnergy < playerEnergyMax && !isShieldActive) {
        playerEnergy = Math.min(playerEnergyMax, playerEnergy + 12 * perk.energyRegenMult * (dt / 1000));
      }
      if (skills.regen > 0 && playerHp < playerHpMax) {
        playerHp = Math.min(playerHpMax, playerHp + skills.regen * 1.4 * (dt / 1000));
      }

      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
          combo = 0;
          isFrenzy = false;
        }
      }
      if (isFrenzy) {
        frenzyTimer -= dt;
        if (frenzyTimer <= 0) isFrenzy = false;
      }

      // Поведение рыб
      const eatRadius = 56 + evolutionTier * 5;
      for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        if (!f || !f.active || !f.body) {
          fishes.splice(i, 1);
          continue;
        }
        f.dirTimer -= dt;
        if (f.dirTimer <= 0) {
          f.dirTimer = 2500 + Math.random() * 3500;
          f.body.velocity.y = (Math.random() - 0.5) * 40;
        }
        if (f.x < 140 && f.body.velocity.x < 0) f.body.velocity.x = Math.abs(f.baseSpd);
        if (f.x > W - 140 && f.body.velocity.x > 0) f.body.velocity.x = -Math.abs(f.baseSpd);
        if (f.y < 80 && f.body.velocity.y < 0) f.body.velocity.y = Math.abs(f.body.velocity.y);
        if (f.y > H - 80 && f.body.velocity.y > 0) f.body.velocity.y = -Math.abs(f.body.velocity.y);

        if (f.body.velocity.x > 5) f.setFlipX(true);
        else if (f.body.velocity.x < -5) f.setFlipX(false);

        const dist = Phaser.Math.Distance.Between(shark.x, shark.y, f.x, f.y);
        if (dist < 160) {
          const escAng = Math.atan2(f.y - shark.y, f.x - shark.x);
          f.setVelocity(Math.cos(escAng) * 210, Math.sin(escAng) * 210);
        }
        if (dist < eatRadius) {
          eatFishTarget(this, f);
          fishes.splice(i, 1);
        }
      }

      // Укус врагов спереди (без траты энергии)
      const autoBiteDmg = Math.round((12 + skills.attack * 5 + evo.biteBonus) * (isFrenzy ? 1.3 : 1));
      const facingDir = shark.flipX ? -1 : 1;

      // 5 Архетипов врагов + Телеграфы
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.active) {
          enemies.splice(i, 1);
          continue;
        }
        const ed = e as any;
        ed.stunTimer = Math.max(0, (ed.stunTimer || 0) - dt);
        if (ed.stunTimer > 0) {
          e.setVelocity(0, 0);
          continue;
        }

        const distE = Phaser.Math.Distance.Between(shark.x, shark.y, e.x, e.y);
        const kind = ed.kind as string;

        if (kind === 'puffer') {
          ed.actionTimer -= dt;
          if (ed.actionTimer <= 0 && ed.chargeTimer <= 0) {
            ed.chargeTimer = 750;
            ed.actionTimer = 4200;
          }
          if (ed.chargeTimer > 0) {
            ed.chargeTimer -= dt;
            e.setVelocity(0, 0);
            if (telegraphGfx) {
              telegraphGfx.lineStyle(2, 0xfbbf24, 0.75);
              telegraphGfx.strokeCircle(e.x, e.y, 78);
            }
            if (ed.chargeTimer <= 0) {
              ed.puffed = true;
              e.setScale(1.18);
              this.time.delayedCall(2200, () => {
                if (e.active) {
                  ed.puffed = false;
                  e.setScale(0.85);
                }
              });
            }
          } else if (distE < 360) {
            const a = Math.atan2(shark.y - e.y, shark.x - e.x);
            e.setVelocity(Math.cos(a) * 105, Math.sin(a) * 105);
          }
        } else if (kind === 'ray') {
          ed.actionTimer -= dt;
          if (ed.actionTimer <= 0 && distE < 320 && ed.chargeTimer <= 0) {
            ed.chargeTimer = 850;
            ed.actionTimer = 4600;
          }
          if (ed.chargeTimer > 0) {
            ed.chargeTimer -= dt;
            e.setVelocity(0, 0);
            if (telegraphGfx) {
              telegraphGfx.lineStyle(2.5, 0x22d3ee, 0.8);
              telegraphGfx.strokeCircle(e.x, e.y, 135 * (1 - ed.chargeTimer / 850));
            }
            if (ed.chargeTimer <= 0) {
              pBlue?.emitParticleAt(e.x, e.y, 16);
              if (distE < 140) {
                slowDebuffTimer = 1400;
                hurtShark(this, ed.dmg, e.x, e.y);
              }
            }
          } else if (distE < 420) {
            const a = Math.atan2(shark.y - e.y, shark.x - e.x);
            e.setVelocity(Math.cos(a) * 145, Math.sin(a) * 145);
            e.setFlipX(shark.x < e.x);
          }
        } else if (kind === 'swordfish') {
          ed.actionTimer -= dt;
          if (ed.actionTimer <= 0 && distE < 520 && ed.chargeTimer <= 0) {
            ed.chargeTimer = 700;
            ed.actionTimer = 3800;
            const ang = Math.atan2(shark.y - e.y, shark.x - e.x);
            ed.dashVx = Math.cos(ang) * 480;
            ed.dashVy = Math.sin(ang) * 480;
            e.setFlipX(ed.dashVx < 0);
          }
          if (ed.chargeTimer > 0) {
            ed.chargeTimer -= dt;
            e.setVelocity(0, 0);
            if (telegraphGfx) {
              telegraphGfx.lineStyle(2, 0xef4444, 0.75);
              telegraphGfx.lineBetween(e.x, e.y, e.x + ed.dashVx * 0.7, e.y + ed.dashVy * 0.7);
            }
            if (ed.chargeTimer <= 0) {
              e.setVelocity(ed.dashVx, ed.dashVy);
              this.time.delayedCall(550, () => {
                if (e.active) {
                  e.setVelocity(0, 0);
                  ed.stunTimer = 900;
                }
              });
            }
          } else if (ed.actionTimer > 1200 && distE < 460) {
            const a = Math.atan2(shark.y - e.y, shark.x - e.x);
            e.setVelocity(Math.cos(a) * 170, Math.sin(a) * 170);
            e.setFlipX(shark.x < e.x);
          }
        } else if (kind === 'diver') {
          ed.actionTimer -= dt;
          if (ed.actionTimer <= 0 && distE < 560 && ed.chargeTimer <= 0) {
            ed.chargeTimer = 850;
            ed.actionTimer = 3600;
            const ang = Math.atan2(shark.y - e.y, shark.x - e.x);
            ed.dashVx = Math.cos(ang) * 440;
            ed.dashVy = Math.sin(ang) * 440;
          }
          if (ed.chargeTimer > 0) {
            ed.chargeTimer -= dt;
            e.setVelocity(0, 0);
            if (telegraphGfx) {
              telegraphGfx.lineStyle(1.5, 0xfbbf24, 0.85);
              telegraphGfx.lineBetween(e.x, e.y, e.x + ed.dashVx * 0.9, e.y + ed.dashVy * 0.9);
            }
            if (ed.chargeTimer <= 0) {
              const bolt = this.physics.add.sprite(e.x, e.y, 'harpoon-bolt').setDepth(16);
              bolt.setVelocity(ed.dashVx, ed.dashVy);
              bolt.setRotation(Math.atan2(ed.dashVy, ed.dashVx));
              (bolt as any).dmg = ed.dmg;
              (bolt as any).life = 2200;
              enemyProjectiles.push(bolt);
            }
          } else if (distE < 480) {
            const desiredDist = 260;
            const a = Math.atan2(shark.y - e.y, shark.x - e.x);
            const sign = distE < desiredDist ? -1 : 1;
            e.setVelocity(Math.cos(a) * 110 * sign, Math.sin(a) * 110 * sign);
            e.setFlipX(shark.x < e.x);
          }
        } else {
          // Hunter
          if (distE < 460) {
            const a = Math.atan2(shark.y - e.y, shark.x - e.x);
            e.setVelocity(Math.cos(a) * (185 + cfg.eraIndex * 6), Math.sin(a) * (185 + cfg.eraIndex * 6));
            e.setFlipX(shark.x < e.x);
          }
        }

        // Авто-укус спереди при сближении!
        const isInFront = (e.x - shark.x) * facingDir > -10;
        if (distE < 66 * (evo.scale / 0.58) * 0.72 + 25 && isInFront && biteCooldownTimer <= 0 && !(kind === 'puffer' && ed.puffed)) {
          biteCooldownTimer = 450;
          if (shark.active && shark.scene) {
            shark.setTexture(sharkTexKey('wide', evolutionTier));
            this.time.delayedCall(180, () => {
              if (shark && shark.active && shark.scene) {
                shark.setTexture(sharkTexKey('closed', evolutionTier));
              }
            });
          }
          audio.play('bite');
          damageEnemy(this, e, autoBiteDmg, false);
          if (!e.active) continue;
        }

        // Урон врага по акуле
        if (distE < 64 && !ed.hitCooldown) {
          const hitDmg = kind === 'puffer' && ed.puffed ? Math.round(ed.dmg * 1.4) : ed.dmg;
          const parried = hurtShark(this, hitDmg, e.x, e.y);
          if (parried) {
            ed.stunTimer = 1300;
            damageEnemy(this, e, 40 + evolutionTier * 8, true);
          }
          ed.hitCooldown = true;
          this.time.delayedCall(950, () => {
            if (e.active) ed.hitCooldown = false;
          });
        }
      }

      // Снаряды врагов и босса (гарпуны + энергосферы)
      for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        if (!p.active) {
          enemyProjectiles.splice(i, 1);
          continue;
        }
        (p as any).life -= dt;
        if (Phaser.Math.Distance.Between(shark.x, shark.y, p.x, p.y) < 38) {
          hurtShark(this, (p as any).dmg || cfg.enemyDmg, p.x, p.y);
          p.destroy();
          enemyProjectiles.splice(i, 1);
          continue;
        }
        if ((p as any).life <= 0 || p.x < 0 || p.x > W || p.y < -SKY_H || p.y > H) {
          p.destroy();
          enemyProjectiles.splice(i, 1);
        }
      }

      // ============ БОСС МЕДУЗА: 3 РЕАЛЬНЫЕ ФАЗЫ С ТЕЛЕГРАФАМИ ============
      if (bossJelly && bossJelly.active) {
        const bj = bossJelly as any;
        const hpRatio = bj.hp / bj.maxHp;
        bj.phase = hpRatio > 0.65 ? 1 : hpRatio > 0.3 ? 2 : 3;
        bj.contactCd = Math.max(0, (bj.contactCd || 0) - dt);

        if (bj.telegraphTimer > 0) {
          bj.telegraphTimer -= dt;
          if (bj.attackMode === 'pulse' && telegraphGfx) {
            const pPct = 1 - bj.telegraphTimer / 850;
            telegraphGfx.lineStyle(3.5, 0xf472b6, 0.85);
            telegraphGfx.strokeCircle(bossJelly.x, bossJelly.y, 230 * pPct);
          } else if (bj.attackMode === 'lunge' && telegraphGfx) {
            telegraphGfx.lineStyle(3, 0xef4444, 0.85);
            telegraphGfx.lineBetween(bossJelly.x, bossJelly.y, bossJelly.x + bj.lungeVx * 0.65, bossJelly.y + bj.lungeVy * 0.65);
          }

          if (bj.telegraphTimer <= 0) {
            if (bj.attackMode === 'pulse') {
              pWhite?.emitParticleAt(bossJelly.x, bossJelly.y, 24);
              const dBoss = Phaser.Math.Distance.Between(shark.x, shark.y, bossJelly.x, bossJelly.y);
              if (dBoss < 235) {
                hurtShark(this, Math.round(cfg.enemyDmg * 1.25), bossJelly.x, bossJelly.y);
              }
            } else if (bj.attackMode === 'orbs') {
              const baseAng = Math.atan2(shark.y - bossJelly.y, shark.x - bossJelly.x);
              [-0.3, 0, 0.3].forEach((offset) => {
                const orb = this.physics.add.sprite(bossJelly!.x, bossJelly!.y, 'boss-orb').setDepth(18);
                orb.setVelocity(Math.cos(baseAng + offset) * 320, Math.sin(baseAng + offset) * 320);
                (orb as any).dmg = Math.round(cfg.enemyDmg * 1.1);
                (orb as any).life = 3200;
                enemyProjectiles.push(orb);
              });
            } else if (bj.attackMode === 'lunge') {
              bossJelly.setVelocity(bj.lungeVx, bj.lungeVy);
              this.time.delayedCall(600, () => {
                if (bossJelly && bossJelly.active) bossJelly.setVelocity(0, 0);
              });
            }
          }
        } else {
          // Патруль и таймер атак босса
          const spdMult = bj.phase === 3 ? 1.55 : bj.phase === 2 ? 1.2 : 1;
          bossJelly.x = Phaser.Math.Clamp(bossJelly.x + Math.cos(time * 0.0012 * spdMult) * 2.2 * spdMult, 280, W - 280);
          bossJelly.y = 300 + Math.sin(time * 0.0022 * spdMult) * 55;

          bj.attackTimer -= dt;
          if (bj.attackTimer <= 0) {
            bj.attackTimer = bj.phase === 3 ? 2300 : bj.phase === 2 ? 2900 : 3500;
            if (bj.phase === 1) {
              bj.attackMode = 'pulse';
              bj.telegraphTimer = 850;
            } else if (bj.phase === 2) {
              bj.attackMode = Math.random() > 0.45 ? 'orbs' : 'pulse';
              bj.telegraphTimer = bj.attackMode === 'orbs' ? 500 : 850;
            } else {
              bj.attackMode = Math.random() > 0.4 ? 'lunge' : 'orbs';
              if (bj.attackMode === 'lunge') {
                const ang = Math.atan2(shark.y - bossJelly.y, shark.x - bossJelly.x);
                bj.lungeVx = Math.cos(ang) * 440;
                bj.lungeVy = Math.sin(ang) * 440;
                bj.telegraphTimer = 700;
              } else {
                bj.telegraphTimer = 450;
              }
            }
          }
        }

        const bossDist = Phaser.Math.Distance.Between(shark.x, shark.y, bossJelly.x, bossJelly.y);
        // Укус босса спереди!
        if (bossDist < 118 && biteCooldownTimer <= 0) {
          biteCooldownTimer = 450;
          audio.play('bite');
          damageBoss(this, autoBiteDmg, false);
        }
        // Безопасный контактный урон с перезарядкой (НЕ 60 раз/сек!)
        if (bossJelly && bossJelly.active && bossDist < 96 && bj.contactCd <= 0) {
          bj.contactCd = 950;
          hurtShark(this, Math.round(cfg.enemyDmg * 1.15), bossJelly.x, bossJelly.y);
        }
      }

      // Дропы
      const magnetBonus = perk.magnetRadiusBonus;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (!d.active) {
          drops.splice(i, 1);
          continue;
        }
        const dDist = Phaser.Math.Distance.Between(shark.x, shark.y, d.x, d.y);
        const magnetR = (isFrenzy || magnetTimer > 0 ? 440 : 140) + magnetBonus;
        if (dDist < magnetR && !(d as any).isChest) {
          const ang = Math.atan2(shark.y - d.y, shark.x - d.x);
          d.x += Math.cos(ang) * 410 * (dt / 1000);
          d.y += Math.sin(ang) * 410 * (dt / 1000);
        }
        if (dDist < 48) {
          pickupDrop(this, d);
          drops.splice(i, 1);
        }
      }

      notifyState();
    }
  }

  function doDash(scene: Phaser.Scene) {
    if (!shark || playerEnergy < 20 || isLevelEnding || isPaused) return;
    playerEnergy -= 20;
    audio.play('dash');
    pBlue?.emitParticleAt(shark.x, shark.y, 16);

    const aimX =
      touchInput.active && Math.hypot(touchInput.x, touchInput.y) > 0.14
        ? touchInput.x
        : shark.flipX
          ? -1
          : 1;
    const aimY =
      touchInput.active && Math.hypot(touchInput.x, touchInput.y) > 0.14
        ? touchInput.y
        : 0;
    const aimLen = Math.hypot(aimX, aimY) || 1;
    dashBurstDir = { x: aimX / aimLen, y: aimY / aimLen };
    dashBurstTimer = 175;
    playerInvulnTimer = Math.max(playerInvulnTimer, 180);
    shark.setVelocity(dashBurstDir.x * 880, dashBurstDir.y * 880);

    const evo = getEvoSpec();
    const perk = getSkinPerk();
    const critChance = Math.min(0.75, skills.crit * 0.065 + perk.critBonus);
    const isCrit = Math.random() < critChance;
    const dmg = Math.round(
      (32 + evo.biteBonus * 1.4) *
        (1 + skills.attack * 0.28) *
        perk.dashDmgMult *
        (isCrit ? 2 : 1)
    );

    let landedHeavy = false;
    enemies.forEach(e => {
      if (e.active && Phaser.Math.Distance.Between(shark!.x, shark!.y, e.x, e.y) < 145) {
        damageEnemy(scene, e, dmg, isCrit);
        landedHeavy = true;
      }
    });

    if (bossJelly && bossJelly.active && Phaser.Math.Distance.Between(shark.x, shark.y, bossJelly.x, bossJelly.y) < 175) {
      damageBoss(scene, dmg, isCrit);
      landedHeavy = true;
    }

    if (landedHeavy && isCrit) {
      hitstopTimer = 40;
    }
    scene.cameras.main.shake(120, 0.006);
  }

  function damageBoss(scene: Phaser.Scene, dmg: number, isCrit: boolean) {
    if (!bossJelly || !bossJelly.active) return;
    audio.play('hit');
    pBlood?.emitParticleAt(bossJelly.x, bossJelly.y, isCrit ? 26 : 16);
    spawnFloatingText(
      scene,
      bossJelly.x + (Math.random() - 0.5) * 30,
      bossJelly.y - 45,
      isCrit ? `💥 ${dmg}!` : `${dmg}`,
      isCrit ? '#fde047' : '#ffffff',
      isCrit ? '22px' : '16px'
    );
    (bossJelly as any).hp -= dmg;
    bossJelly.setTint(0xffffff);
    scene.time.delayedCall(120, () => {
      if (bossJelly && bossJelly.active && bossJelly.scene) {
        const cfg = getStageConfig(currentStageNum);
        if (cfg.bossKind === 'eraBoss') bossJelly.setTint(0xf43f5e);
        else bossJelly.clearTint();
      }
    });

    if ((bossJelly as any).hp <= 0) {
      const cfg = getStageConfig(currentStageNum);
      pGold?.emitParticleAt(bossJelly.x, bossJelly.y, 40);
      bossJelly.destroy();
      bossJelly = null;
      totalBossesDefeated++;
      score += cfg.bossKind === 'eraBoss' ? 900 : 450;
      addEarnedCoins(cfg.bossKind === 'eraBoss' ? 180 : 95);
      unlockAchievement('jelly');
      notifyState(tr().ingame.bossDefeatedToast);
      persistSave();
      checkVictory(scene);
    }
  }

  function doKeyEAction(_scene: Phaser.Scene) {
    if (isPaused || isLevelEnding) return;

    if (caughtInNetObj) {
      caughtInNetObj.hp -= 2500;
      audio.play('bite');
      pGold?.emitParticleAt(caughtInNetObj.sprite.x, caughtInNetObj.sprite.y, 8);
      notifyState(tr().ingame.netEscapeToast);
      if (caughtInNetObj.hp <= 0) {
        caughtInNetObj.rope.destroy();
        caughtInNetObj.sprite.destroy();
        caughtInNetObj = null;
        audio.play('level');
        notifyState(null, { title: tr().ingame.netFreedTitle, sub: tr().ingame.netFreedSub });
      }
      return;
    }

    if (!hasShieldUnlocked) {
      notifyState(tr().ingame.shieldLockedToast);
      return;
    }

    if (isShieldActive) {
      isShieldActive = false;
      audio.play('shieldOff');
      notifyState(tr().ingame.shieldOff);
    } else {
      if (playerEnergy < 15) {
        notifyState(tr().ingame.shieldNoEnergy);
        return;
      }
      isShieldActive = true;
      shieldActivatedAt = performance.now();
      audio.play('shieldOn');
      notifyState(tr().ingame.shieldOn);
    }
  }

  function eatFishTarget(scene: Phaser.Scene, f: any) {
    audio.play('eat');
    pBlood?.emitParticleAt(f.x, f.y, 10);

    if (shark && shark.active && shark.scene) {
      shark.setTexture(sharkTexKey('half', evolutionTier));
      scene.time.delayedCall(150, () => {
        if (shark && shark.active && shark.scene) {
          shark.setTexture(sharkTexKey('closed', evolutionTier));
        }
      });
    }

    score += Math.round(25 * (isFrenzy ? 2 : 1) * getEvoSpec().mightFactor);
    if (score > highScore) highScore = score;
    addEarnedCoins(2);
    levelFishEaten++;
    totalFishEaten++;

    const perk = getSkinPerk();
    const lifestealHeal = skills.lifesteal * 2.5 + perk.lifestealBonus;
    playerHp = Math.min(playerHpMax, playerHp + 2 + lifestealHeal);

    combo++;
    comboTimer = 2600;
    unlockAchievement('first');

    if (combo >= 10 && !isFrenzy) {
      isFrenzy = true;
      frenzyTimer = 7000;
      audio.play('frenzy');
      notifyState(null, { title: tr().ingame.frenzyTitle, sub: tr().ingame.frenzySub });
      scene.cameras.main.flash(250, 251, 191, 36);
      unlockAchievement('combo10');
    }

    f.destroy();
    checkVictory(scene);
  }

  function damageEnemy(scene: Phaser.Scene, e: Phaser.Physics.Arcade.Sprite, dmg: number, isCrit: boolean) {
    audio.play('hit');
    pBlood?.emitParticleAt(e.x, e.y, isCrit ? 22 : 14);
    spawnFloatingText(
      scene,
      e.x,
      e.y - 24,
      isCrit ? `💥 ${dmg}!` : `${dmg}`,
      isCrit ? '#fde047' : '#ffffff',
      isCrit ? '20px' : '15px'
    );
    (e as any).hp -= dmg;
    e.setTint(0xffffff);
    scene.time.delayedCall(120, () => {
      if (e && e.active && e.scene) e.clearTint();
    });

    if ((e as any).hp <= 0) {
      score += Math.round(150 * getEvoSpec().mightFactor);
      if (score > highScore) highScore = score;
      addEarnedCoins(15);
      levelEnemyKilled++;
      totalEnemiesDefeated++;
      pGold?.emitParticleAt(e.x, e.y, 22);

      // Полная таблица дропов (включая star & clock!)
      const roll = Math.random();
      const dropKey =
        roll < 0.48
          ? 'drop-coin'
          : roll < 0.68
            ? 'drop-gem'
            : roll < 0.78
              ? 'drop-magnet'
              : roll < 0.87
                ? 'drop-star'
                : roll < 0.94
                  ? 'drop-clock'
                  : 'drop-shield';

      const d = scene.physics.add.sprite(e.x, e.y, dropKey).setDepth(15);
      (d as any).itemKey = dropKey;
      drops.push(d);

      e.destroy();
      notifyState(tr().ingame.enemyCoinToast);
      persistSave();
      checkVictory(scene);
    }
  }

  // Возвращает true если сработало Парирование!
  function hurtShark(scene: Phaser.Scene, rawDmg: number, srcX?: number, srcY?: number): boolean {
    if (isLevelEnding || isPaused || starTimer > 0 || playerInvulnTimer > 0) return false;

    // Если активен щит: окно <=250ms — Парирование (100% блок + стан + возврат энергии), иначе 70% поглощения!
    if (isShieldActive) {
      const now = performance.now();
      if (now - shieldActivatedAt <= 250) {
        audio.play('parry');
        playerEnergy = Math.min(playerEnergyMax, playerEnergy + 8);
        playerInvulnTimer = 450;
        scene.cameras.main.shake(110, 0.009);
        if (shark) spawnFloatingText(scene, shark.x, shark.y - 45, 'PARRY!', '#fde047', '20px');
        notifyState(tr().ingame.parryToast);
        return true;
      }

      const shieldReduction = 0.7;
      const dmgAfterShield = Math.max(1, Math.round(rawDmg * (1 - shieldReduction)));
      playerHp = Math.max(0, playerHp - dmgAfterShield);
      playerInvulnTimer = 650;
      audio.play('hit');
      if (shark) spawnFloatingText(scene, shark.x, shark.y - 36, `-${dmgAfterShield}`, '#38bdf8', '16px');
      notifyState(tr().ingame.shieldBlocked);
    } else {
      const armorReduction = Math.min(0.65, skills.armor * 0.065);
      const finalDmg = Math.max(1, Math.round(rawDmg * (1 - armorReduction)));
      playerHp = Math.max(0, playerHp - finalDmg);
      playerInvulnTimer = 700;

      audio.play('hit');
      scene.cameras.main.shake(170, 0.014);
      scene.cameras.main.flash(110, 239, 68, 68);
      if (shark) spawnFloatingText(scene, shark.x, shark.y - 36, `-${finalDmg}`, '#f87171', '18px');

      if (shark && srcX !== undefined && srcY !== undefined) {
        const pushAng = Math.atan2(shark.y - srcY, shark.x - srcX);
        shark.setVelocity(Math.cos(pushAng) * 320, Math.sin(pushAng) * 320);
      }

      combo = 0;
      isFrenzy = false;
    }

    if (playerHp <= 0) {
      isLevelEnding = true;
      isShieldActive = false;
      if (shark) shark.setVelocity(0, 0);
      audio.play('hit');
      activeSummary = {
        type: 'gameover',
        level: currentStageNum,
        score,
        runCoins,
        fishEaten: levelFishEaten,
        enemyKilled: levelEnemyKilled,
        adDoubled: false
      };
      persistSave();
      notifyState(null, { title: tr().ingame.gameOverTitle, sub: tr().ingame.gameOverSub });
    }
    return false;
  }

  function pickupDrop(scene: Phaser.Scene, d: Phaser.Physics.Arcade.Sprite) {
    audio.play('coin');
    pGold?.emitParticleAt(d.x, d.y, 14);

    const k = (d as any).itemKey;
    if ((d as any).isChest) {
      const c = addEarnedCoins(50);
      spawnFloatingText(scene, d.x, d.y, `+${c} 🪙`, '#fde047', '18px');
      notifyState(tr().ingame.chestToast);
    } else if (k === 'drop-shield') {
      hasShieldUnlocked = true;
      persistSave();
      notifyState(tr().ingame.shieldDropToast);
    } else if (k === 'drop-magnet') {
      magnetTimer = 9000;
      notifyState(tr().ingame.magnetToast);
    } else if (k === 'drop-star') {
      starTimer = 6000;
      notifyState(tr().ingame.starToast);
    } else if (k === 'drop-clock') {
      clockTimer = 6000;
      scene.time.timeScale = 0.45;
      notifyState(tr().ingame.clockToast);
    } else if (k === 'drop-gem') {
      playerHp = Math.min(playerHpMax, playerHp + 25);
      const c = addEarnedCoins(30);
      spawnFloatingText(scene, d.x, d.y, `+${c}🪙 +25HP`, '#c084fc', '16px');
      notifyState(tr().ingame.gemToast);
    } else {
      const c = addEarnedCoins(15);
      spawnFloatingText(scene, d.x, d.y, `+${c} 🪙`, '#fde047', '15px');
      notifyState(tr().ingame.coinToast);
    }

    persistSave();
    d.destroy();
  }

  function checkVictory(_scene: Phaser.Scene) {
    if (isLevelEnding) return;
    const cfg = getStageConfig(currentStageNum);
    const fishDone = cfg.fishTarget === 0 || levelFishEaten >= cfg.fishTarget;
    const enemyDone = cfg.enemyTarget === 0 || levelEnemyKilled >= cfg.enemyTarget;
    const bossDone = cfg.bossKind === 'none' || !bossJelly;

    if (fishDone && enemyDone && bossDone) {
      isLevelEnding = true;
      isShieldActive = false;
      if (shark) shark.setVelocity(0, 0);
      audio.play('level');

      if (currentStageNum >= 1) unlockAchievement('lvl1');
      if (currentStageNum >= 5) unlockAchievement('lvl5');
      if (currentStageNum >= 10) unlockAchievement('lvl10');

      const nextStage = Math.min(TOTAL_STAGES, currentStageNum + 1);
      if (nextStage > highestLevel) {
        highestLevel = nextStage;
      }

      activeSummary = {
        type: 'victory',
        level: cfg.stage,
        score,
        runCoins,
        fishEaten: levelFishEaten,
        enemyKilled: levelEnemyKilled,
        adDoubled: false
      };

      if (score > highScore) highScore = score;
      if (window.PGF) {
        const snap = buildSaveSnapshot();
        snap.currentLevel = nextStage;
        snap.highestLevel = highestLevel;
        window.PGF.save(snap);
      }

      notifyState(null, { title: tr().ingame.victoryTitle, sub: tr().ingame.victorySub });
    }
  }

  const initW = container.clientWidth || window.innerWidth || CAM_W;
  const initH = container.clientHeight || window.innerHeight || CAM_H;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: container,
    width: initW,
    height: initH,
    backgroundColor: '#020617',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [MainOceanScene]
  };

  const game = new Phaser.Game(config);
  const unregisterAutoSave = window.PGF
    ? window.PGF.registerAutoSave(() => buildSaveSnapshot())
    : () => {};

  return {
    destroy: () => {
      persistSave();
      unregisterAutoSave();
      isPaused = true;
      sceneRef = null;
      shark = null;
      bossJelly = null;
      shieldVisualGfx = null;
      auraGfx = null;
      telegraphGfx = null;
      game.destroy(true);
    },
    pause: () => {
      isPaused = true;
      if (sceneRef && sceneRef.physics) sceneRef.physics.pause();
    },
    resume: () => {
      isPaused = false;
      if (sceneRef && sceneRef.physics) sceneRef.physics.resume();
    },
    performDash: () => {
      audio.init();
      audio.resume();
      if (sceneRef) doDash(sceneRef);
    },
    toggleShield: () => {
      audio.init();
      audio.resume();
      if (sceneRef) doKeyEAction(sceneRef);
    },
    toggleSound: () => {
      audio.init();
      audio.resume();
      const muted = audio.toggleMute();
      persistSave();
      notifyState();
      return muted;
    },
    setMuted: (muted: boolean) => {
      const res = audio.setMuted(muted);
      notifyState();
      return res;
    },
    setLocale: (lang: PGFLocale) => {
      activeLocale = lang;
      notifyState();
    },
    setTouchInput: (dx: number, dy: number, active: boolean, sprint = false) => {
      audio.init();
      audio.resume();
      touchInput.x = dx;
      touchInput.y = dy;
      touchInput.active = active;
      touchInput.sprint = Boolean(sprint);
    },
    buySkill: (key: string) => {
      if (key === 'shield') {
        if (hasShieldUnlocked) return false;
        if (coins < 300) return false;
        coins -= 300;
        hasShieldUnlocked = true;
        persistSave();
        notifyState(tr().ingame.shieldPurchased);
        return true;
      }

      const skKey = key as keyof SharkSkills;
      const cur = skills[skKey] || 0;
      if (cur >= MAX_SKILL_LEVEL) return false;
      const prices = SKILL_PRICES_10[key] || SKILL_PRICES_10.attack;
      const p = prices[cur];
      if (coins < p) return false;
      coins -= p;
      skills[skKey] = cur + 1;
      playerHpMax = computePlayerHpMax();
      playerHp = Math.min(playerHpMax, playerHp + 24);
      persistSave();
      notifyState(tr().ingame.skillUpgraded);
      return true;
    },
    buyEvolution: (tier: number) => {
      const target = Math.max(1, Math.min(6, Math.floor(tier)));
      const spec = getEvoSpec(target);
      if (target <= evolutionOwned) {
        evolutionTier = target;
        playerHpMax = computePlayerHpMax();
        playerHp = Math.min(playerHpMax, playerHp);
        if (sceneRef) buildSharkEvolutionTextures(sceneRef, evolutionTier);
        applySharkScaleAndSkin();
        persistSave();
        notifyState();
        return true;
      }
      if (highestLevel < spec.unlockStage) return false;
      if (coins < spec.cost) return false;
      coins -= spec.cost;
      evolutionOwned = Math.max(evolutionOwned, target);
      evolutionTier = target;
      playerHpMax = computePlayerHpMax();
      playerHp = playerHpMax;
      if (sceneRef) {
        buildSharkEvolutionTextures(sceneRef, evolutionTier);
        pGold?.emitParticleAt(shark?.x || W / 2, shark?.y || H / 2, 36);
      }
      applySharkScaleAndSkin();
      audio.play('evolve');
      persistSave();
      notifyState(tr().ingame.evolutionUpgraded(spec.names[activeLocale] || spec.names.ru));
      return true;
    },
    buySkin: (id: string) => {
      if (!skinsOwned.includes(id)) {
        const price = SKIN_PRICES[id] ?? 0;
        if (coins < price) return false;
        coins -= price;
        skinsOwned.push(id);
        currentSkin = id;
        applySharkScaleAndSkin();
        persistSave();
        notifyState(tr().ingame.skinPurchased);
        return true;
      }
      currentSkin = id;
      applySharkScaleAndSkin();
      persistSave();
      notifyState(tr().ingame.skinEquipped);
      return true;
    },
    selectStage: (stage: number) => {
      const clamped = Math.max(1, Math.min(highestLevel, Math.floor(stage)));
      currentStageNum = clamped;
      if (sceneRef) {
        isPaused = false;
        if (sceneRef.physics) sceneRef.physics.resume();
        loadLevel(sceneRef, clamped);
      }
      persistSave();
      notifyState();
    },
    addCoins: (amount: number, reason?: 'ad' | 'iap') => {
      if (amount <= 0) return;
      coins += amount;
      if (coins >= 5000) unlockAchievement('rich');
      persistSave();
      if (reason === 'iap') {
        notifyState(tr().paySuccessToast(amount));
      } else if (reason === 'ad') {
        notifyState(tr().adRewardToast(amount));
      } else {
        notifyState();
      }
    },
    grantRunAdDouble: () => {
      if (!activeSummary || activeSummary.adDoubled || activeSummary.runCoins <= 0) return 0;
      const bonus = activeSummary.runCoins;
      activeSummary = { ...activeSummary, adDoubled: true };
      coins += bonus;
      if (coins >= 5000) unlockAchievement('rich');
      persistSave();
      audio.play('coin');
      notifyState(tr().adRewardToast(bonus));
      return bonus;
    },
    claimDailyReward: (multiplier: 1 | 2 = 1) => {
      const nowMs = Date.now();
      if (!canClaimDailyToday(dailyRewards, getLocalDateKey(), nowMs)) return null;
      const mult = multiplier === 2 ? 2 : 1;
      const todayKey = getLocalDateKey();
      const isNewCycle = dailyRewards.streakDay >= 30;
      const targetDay = getNextClaimDay(dailyRewards);
      const entry = DAILY_REWARD_SCHEDULE[targetDay - 1] || DAILY_REWARD_SCHEDULE[0];

      let coinsGranted = entry.coins * mult;
      let milestoneExtra: string | undefined;

      if (entry.milestone === 'shield') {
        if (!hasShieldUnlocked) {
          hasShieldUnlocked = true;
          milestoneExtra = tr().shieldItemName;
        } else {
          const fallback = entry.fallbackCoins || 500;
          coinsGranted += fallback;
          milestoneExtra = `+${fallback} 🪙`;
        }
      } else if (entry.milestone === 'skill') {
        const order: (keyof SharkSkills)[] = ['attack', 'armor', 'regen', 'speed', 'lifesteal', 'crit'];
        const targetSkill = order.find(k => (skills[k] || 0) < MAX_SKILL_LEVEL);
        if (targetSkill) {
          skills[targetSkill] = (skills[targetSkill] || 0) + 1;
          milestoneExtra = `${tr().skills[targetSkill]?.name || targetSkill} +1`;
        } else {
          const fallback = entry.fallbackCoins || 400;
          coinsGranted += fallback;
          milestoneExtra = `+${fallback} 🪙`;
        }
      } else if (entry.milestone === 'skin_tiger') {
        if (!skinsOwned.includes('tiger')) {
          skinsOwned.push('tiger');
          currentSkin = 'tiger';
          applySharkScaleAndSkin();
          milestoneExtra = tr().skins.tiger?.name || 'Golden Tiger';
        } else {
          const fallback = entry.fallbackCoins || 600;
          coinsGranted += fallback;
          milestoneExtra = `+${fallback} 🪙`;
        }
      } else if (entry.milestone === 'skin_abyss') {
        if (!skinsOwned.includes('abyss')) {
          skinsOwned.push('abyss');
          currentSkin = 'abyss';
          applySharkScaleAndSkin();
          milestoneExtra = tr().skins.abyss?.name || 'Astral Shadow';
        } else {
          const fallback = entry.fallbackCoins || 2500;
          coinsGranted += fallback;
          milestoneExtra = `+${fallback} 🪙`;
        }
      }

      const prevClaimed = isNewCycle ? [] : dailyRewards.claimedDays;
      dailyRewards = {
        streakDay: targetDay,
        lastClaimDate: todayKey,
        claimedDays: Array.from(new Set([...prevClaimed, targetDay])).sort((a, b) => a - b),
        cycleCount: isNewCycle ? dailyRewards.cycleCount + 1 : dailyRewards.cycleCount,
        lastClaimTimestamp: nowMs
      };

      coins += coinsGranted;
      if (coins >= 5000) unlockAchievement('rich');
      audio.play('level');
      persistSave();
      notifyState(tr().dailyClaimToast(coinsGranted, milestoneExtra));
      return { day: targetDay, coinsGranted, milestoneExtra };
    },
    getDailyRewards: () => ({ ...dailyRewards, claimedDays: [...dailyRewards.claimedDays] }),
    proceedNextLevel: () => {
      if (!sceneRef) return;
      currentStageNum = Math.min(TOTAL_STAGES, currentStageNum + 1);
      isPaused = false;
      if (sceneRef.physics) sceneRef.physics.resume();
      loadLevel(sceneRef, currentStageNum);
      persistSave();
      notifyState();
    },
    retryCurrentLevel: () => {
      if (!sceneRef) return;
      isPaused = false;
      if (sceneRef.physics) sceneRef.physics.resume();
      loadLevel(sceneRef, currentStageNum);
      notifyState();
    },
    restartFullGame: () => {
      if (!sceneRef) return;
      score = 0;
      currentStageNum = 1;
      isPaused = false;
      if (sceneRef.physics) sceneRef.physics.resume();
      loadLevel(sceneRef, 1);
      persistSave();
      notifyState();
    },
    getSkills: () => ({ ...skills }),
    getSkinsOwned: () => [...skinsOwned],
    getCurrentSkin: () => currentSkin,
    getAchievements: () => ({ ...achievements })
  };
}
