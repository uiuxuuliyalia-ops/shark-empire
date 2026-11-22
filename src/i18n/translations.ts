import type { PGFLocale } from '../types/pgf';

export interface GameTranslations {
  subtitle: string;
  play: string;
  continue: string;
  restart: string;
  pause: string;
  shop: string;
  settings: string;
  sound: string;
  soundOn: string;
  soundOff: string;
  record: string;
  coins: string;
  level: string;
  score: string;
  exit: string;
  reefsValue: string;
  locationsLabel: string;
  evolutionTitle: string;
  tabEvolution: string;
  stagesBtn: string;
  stagesModalTitle: string;
  stagesModalSub: string;
  stageCurrentTag: string;
  stageClearedTag: string;
  stageLockedTag: string;
  miniBossTag: string;
  eraBossTag: string;
  evolveBtn: string;
  evolveEquipped: string;
  evolveLockedStage: (s: number) => string;
  mightLabel: string;
  scaleLabel: string;
  chronicleSummary: (fish: number, enemies: number, bosses: number) => string;
  skinPerks: Record<string, string>;
  hpLabel: string;
  energyLabel: string;
  fishLabel: string;
  enemiesLabel: string;
  bossLabel: string;
  shieldActive: string;
  shieldReady: string;
  shieldLockedHint: string;
  frenzyBanner: string;
  comboLabel: string;
  moveStick: string;
  dashBtn: string;
  shieldBtn: string;
  breakNetBtn: string;
  turboLabel: string;
  shieldLockedShort: string;
  hintSwim: string;
  hintDash: string;
  hintShield: string;
  pauseTitle: string;
  pauseSubtitle: string;
  languageLabel: string;
  shopTitle: string;
  balanceLabel: string;
  tabSkills: string;
  tabSkins: string;
  tabAch: string;
  tabBank: string;
  shieldItemName: string;
  shieldItemDesc: string;
  unlockedBadge: string;
  boughtLabel: string;
  maxLabel: string;
  equippedLabel: string;
  selectLabel: string;
  completedLabel: string;
  bankIntro: string;
  popularTag: string;
  bestValueTag: string;
  buyUsdBtn: string;
  bonusPercent: (pct: number) => string;
  summaryVictoryTitle: string;
  summaryVictorySub: string;
  summaryGameOverTitle: string;
  summaryGameOverSub: string;
  runCoinsLabel: string;
  totalCoinsLabel: string;
  doubleCoinsBtn: string;
  doubledDoneBtn: string;
  nextReefBtn: string;
  retryReefBtn: string;
  backMenuBtn: string;
  adModalTitle: string;
  adModalDesc: string;
  adSecondsLeft: (sec: number) => string;
  adSkipBtn: string;
  adRewardLabel: string;
  payModalTitle: string;
  payProviderLabel: string;
  payAmountLabel: string;
  payCoinsLabel: string;
  payTestBtn: string;
  payCancelBtn: string;
  payDisclaimer: string;
  paySuccessToast: (coins: number) => string;
  adRewardToast: (coins: number) => string;
  adCancelledToast: string;
  dailyBtn: string;
  dailyReadyBadge: string;
  dailyDoneBadge: string;
  dailyTitle: string;
  dailySubtitle: string;
  dailyDayLabel: (day: number) => string;
  dailyCycleLabel: (cycle: number) => string;
  dailyClaimedLabel: string;
  dailyReadyLabel: string;
  dailyClaimBtn: string;
  dailyClaim2xBtn: string;
  dailyComeBackTomorrow: string;
  dailyClaimToast: (coins: number, extra?: string) => string;
  dailyMilestones: {
    shield: string;
    skill: string;
    skin_tiger: string;
    skin_abyss: string;
  };
  levels: Record<number, string>;
  skills: Record<string, { name: string; desc: string }>;
  skins: Record<string, { name: string; desc: string }>;
  achievements: Record<string, { name: string; desc: string }>;
  ingame: {
    levelTitle: (n: number) => string;
    bossAlert: string;
    miniBossAlert: string;
    victoryTitle: string;
    victorySub: string;
    gameOverTitle: string;
    gameOverSub: string;
    frenzyTitle: string;
    frenzySub: string;
    netFreedTitle: string;
    netFreedSub: string;
    netEscapeToast: string;
    shieldBlocked: string;
    parryToast: string;
    shieldLockedToast: string;
    shieldOn: string;
    shieldOff: string;
    shieldNoEnergy: string;
    shieldDepleted: string;
    shieldPurchased: string;
    skillUpgraded: string;
    evolutionUpgraded: (name: string) => string;
    skinEquipped: string;
    skinPurchased: string;
    achievementToast: (name: string) => string;
    hornToast: string;
    hookToast: string;
    chestToast: string;
    shieldDropToast: string;
    magnetToast: string;
    starToast: string;
    clockToast: string;
    gemToast: string;
    coinToast: string;
    enemyCoinToast: string;
    bossDefeatedToast: string;
    caughtInNetTitle: string;
    caughtInNetSub: string;
    shieldUnlockedLvl3: string;
  };
}

export const TRANSLATIONS: Record<PGFLocale, GameTranslations> = {
  ru: {
    subtitle: 'Океаническая аркада · SafeSave v2',
    play: 'Играть',
    continue: 'Продолжить',
    restart: 'Заново',
    pause: 'Пауза',
    shop: 'Магазин',
    settings: 'Настройки',
    sound: 'Звук',
    soundOn: 'Звук вкл.',
    soundOff: 'Без звука',
    record: 'Рекорд',
    coins: 'Монеты',
    level: 'Уровень',
    score: 'Счёт',
    exit: 'Выход',
    reefsValue: '100 этапов',
    locationsLabel: 'Локации',
    evolutionTitle: 'Эволюция акулы',
    tabEvolution: 'Эволюция',
    stagesBtn: 'Карта 100 ур.',
    stagesModalTitle: 'Хроника океана · 100 локаций',
    stagesModalSub: '10 биомов × 10 этапов · Мини-боссы каждые 5 ур. · Боссы эры каждые 10 ур.',
    stageCurrentTag: 'Текущий',
    stageClearedTag: 'Пройден',
    stageLockedTag: 'Закрыт',
    miniBossTag: 'Мини-босс',
    eraBossTag: 'Босс эры',
    evolveBtn: 'Эволюция',
    evolveEquipped: 'Активна',
    evolveLockedStage: (s) => `Откроется на ${s} ур.`,
    mightLabel: 'Мощь',
    scaleLabel: 'Размер',
    chronicleSummary: (f, e, b) => `Рыб: ${f} · Врагов: ${e} · Боссов: ${b}`,
    skinPerks: {
      classic: 'Базовый сбалансированный хищник',
      tiger: '+15% урон рывка · +15% монет',
      neon: '+25% реген энергии · +60px магнит · +10% монет',
      ruby: '+4 HP вампиризм · +10% рывок · +5% крит',
      abyss: '+20% рывок · +10% крит · +120px магнит · +25% монет'
    },
    hpLabel: 'Здоровье',
    energyLabel: 'Энергия',
    fishLabel: 'Рыбы',
    enemiesLabel: 'Враги',
    bossLabel: 'БОСС',
    shieldActive: 'Щит активен [E]',
    shieldReady: 'Щит готов [E]',
    shieldLockedHint: 'Щит: магазин (300 🪙)',
    frenzyBanner: 'SHARK FRENZY · СКОРОСТЬ X2 · МАГНИТ',
    comboLabel: 'КОМБО',
    moveStick: 'Движение',
    dashBtn: 'Рывок',
    shieldBtn: 'Щит',
    breakNetBtn: 'Рвать сеть',
    turboLabel: 'ТУРБО',
    shieldLockedShort: 'Магазин',
    hintSwim: 'Плавание',
    hintDash: 'Турбо-рывок',
    hintShield: 'Щит / Сети',
    pauseTitle: 'Пауза',
    pauseSubtitle: 'Прогресс сохранён автоматически',
    languageLabel: 'Язык',
    shopTitle: 'Магазин хищника',
    balanceLabel: 'Баланс',
    tabSkills: 'Навыки',
    tabSkins: 'Окрасы',
    tabAch: 'Награды',
    tabBank: 'Банк $',
    shieldItemName: 'Силовой щит',
    shieldItemDesc: 'Поглощает 70% урона. Включение за <0.25с до удара — парирование с оглушением (100% блок)!',
    unlockedBadge: 'Разблокирован',
    boughtLabel: 'Куплен',
    maxLabel: 'Макс.',
    equippedLabel: 'Надето',
    selectLabel: 'Выбрать',
    completedLabel: 'Выполнено',
    bankIntro: 'Пакеты монет в USD (заготовка Stripe / Xsolla перед подключением платёжного шлюза)',
    popularTag: 'Популярный',
    bestValueTag: 'Лучшая выгода',
    buyUsdBtn: 'Купить',
    bonusPercent: (pct) => `+${pct}% бонус`,
    summaryVictoryTitle: 'Риф зачищен',
    summaryVictorySub: 'Отличная охота — награда начислена',
    summaryGameOverTitle: 'Охота прервана',
    summaryGameOverSub: 'Собранные монеты сохранены',
    runCoinsLabel: 'За заплыв',
    totalCoinsLabel: 'Всего монет',
    doubleCoinsBtn: 'x2 монет за рекламу',
    doubledDoneBtn: 'Награда x2 получена',
    nextReefBtn: 'Следующий риф',
    retryReefBtn: 'Повторить риф',
    backMenuBtn: 'В меню',
    adModalTitle: 'Рекламный ролик',
    adModalDesc: 'Имитация rewarded-рекламы (5 сек) перед подключением сети CrazyGames / IMA',
    adSecondsLeft: (sec) => `Награда через ${sec} с`,
    adSkipBtn: 'Закрыть без удвоения',
    adRewardLabel: 'Удвоение монет за заплыв',
    payModalTitle: 'Предпросмотр оплаты',
    payProviderLabel: 'Платёжный адаптер',
    payAmountLabel: 'К оплате',
    payCoinsLabel: 'Начисление',
    payTestBtn: 'Тестовая покупка',
    payCancelBtn: 'Отмена',
    payDisclaimer: 'Платёжная система в режиме предпросмотра. Сессия передаётся в адаптер Stripe/Xsolla и начисляет монеты в SafeSave v2.',
    paySuccessToast: (c) => `Зачислено +${c} 🪙 (тест)`,
    adRewardToast: (c) => `Бонус рекламы: +${c} 🪙`,
    adCancelledToast: 'Просмотр отменён — начислены обычные монеты',
    dailyBtn: 'Награды 30д',
    dailyReadyBadge: 'Готово',
    dailyDoneBadge: 'Получено',
    dailyTitle: 'Календарь наград · 30 дней',
    dailySubtitle: 'Мягкая серия: пропуск дня не сбрасывает прогресс. Супер-бонусы на 7, 14, 21 и 30 день.',
    dailyDayLabel: (d) => `День ${d}`,
    dailyCycleLabel: (c) => `Цикл ${c + 1}`,
    dailyClaimedLabel: 'Получено',
    dailyReadyLabel: 'Доступно',
    dailyClaimBtn: 'Забрать',
    dailyClaim2xBtn: 'Забрать x2 · Реклама',
    dailyComeBackTomorrow: 'Награда на сегодня получена — возвращайтесь завтра',
    dailyClaimToast: (c, extra) =>
      extra ? `Награда дня: +${c} 🪙 · ${extra}` : `Награда дня: +${c} 🪙`,
    dailyMilestones: {
      shield: 'Щит (или +500 🪙)',
      skill: '+1 навык (или +400 🪙)',
      skin_tiger: 'Золотой тигр (или +600 🪙)',
      skin_abyss: 'Астральная тень (или +2500 🪙)'
    },
    levels: {
      1: 'Лазурное мелководье',
      2: 'Прибрежные воды',
      3: 'Коралловый риф',
      4: 'Тёмный грот',
      5: 'Логово медузы',
      6: 'Открытое море',
      7: 'Ледяные воды',
      8: 'Подводный вулкан',
      9: 'Затонувший город',
      10: 'Бездна титана'
    },
    skills: {
      attack: { name: 'Сила укуса', desc: '+60% к мощности удара челюстью' },
      armor: { name: 'Акулья броня', desc: 'Снижает входящий урон от хищников' },
      regen: { name: 'Регенерация', desc: 'Постоянное восстановление здоровья в воде' },
      speed: { name: 'Турбо-плавник', desc: 'Увеличивает скорость плавания и рывка' },
      lifesteal: { name: 'Вампиризм', desc: 'Восстанавливает HP за каждую добычу' },
      crit: { name: 'Критический укус', desc: 'Шанс нанести сокрушительный урон' }
    },
    skins: {
      classic: { name: 'Королевский сапфир', desc: 'Классический хищник лазурных глубин' },
      tiger: { name: 'Золотой тигр', desc: 'Солнечная чешуя с янтарным отливом' },
      neon: { name: 'Неоновый импульс', desc: 'Биолюминесцентная волна глубин' },
      ruby: { name: 'Кровавый рубин', desc: 'Легендарный багровый левиафан' },
      abyss: { name: 'Астральная тень', desc: 'Древний владыка вечной бездны' }
    },
    achievements: {
      first: { name: 'Первая кровь', desc: 'Съешь свою первую рыбку' },
      lvl1: { name: 'Покоритель мелководья', desc: 'Заверши Уровень 1' },
      lvl5: { name: 'Владыка рифов', desc: 'Заверши Уровень 5' },
      lvl10: { name: 'Легенда океана', desc: 'Пройди все 10 уровней' },
      jelly: { name: 'Победитель бездны', desc: 'Победи гигантскую медузу' },
      combo10: { name: 'Комбо-мастер X10', desc: 'Сделай 10 укусов подряд' },
      rich: { name: 'Океанический богач', desc: 'Накопи 5000 золота' },
      jumper: { name: 'Прыгун бездны', desc: 'Выпрыгни из воды 5 раз' }
    },
    ingame: {
      levelTitle: (n) => `ЭТАП ${n} / 100`,
      bossAlert: 'БОСС ЭРЫ!',
      miniBossAlert: 'СТРАЖ ЭТАПА!',
      victoryTitle: 'ЭТАП ПРОЙДЕН!',
      victorySub: 'Награды готовы к сбору',
      gameOverTitle: 'ОХОТА ПРЕРВАНА',
      gameOverSub: 'Акула потеряла силы',
      frenzyTitle: 'SHARK FRENZY!',
      frenzySub: 'Скорость +40% · Золотой магнит',
      netFreedTitle: 'СЕТЬ РАЗОРВАНА!',
      netFreedSub: 'Свобода!',
      netEscapeToast: 'Грызём сеть! Нажимай E!',
      shieldBlocked: 'Щит поглотил 70% урона!',
      parryToast: 'ПАРИРОВАНИЕ! Враг оглушён!',
      shieldLockedToast: 'Щит откроется на 3 этапе или в магазине',
      shieldOn: 'Щит активирован (клавиша E)',
      shieldOff: 'Щит деактивирован',
      shieldNoEnergy: 'Мало энергии для щита',
      shieldDepleted: 'Энергия истощена — щит отключён',
      shieldPurchased: 'Силовой щит куплен! Включай клавишей E',
      skillUpgraded: 'Навык улучшен',
      evolutionUpgraded: (name) => `ЭВОЛЮЦИЯ: ${name}!`,
      skinEquipped: 'Окрас надет',
      skinPurchased: 'Новый окрас куплен и надет',
      achievementToast: (name) => `Достижение: ${name}`,
      hornToast: 'Гудок шхуны вдали...',
      hookToast: 'Острый крючок!',
      chestToast: '+50+ 🪙 из сундука',
      shieldDropToast: 'Щит получен! Нажми E чтобы включить',
      magnetToast: 'Магнит монет активирован',
      starToast: 'Неуязвимость активна',
      clockToast: 'Замедление времени',
      gemToast: 'Самоцвет глубин: +25 HP, +30 🪙',
      coinToast: '+15 🪙',
      enemyCoinToast: 'Хищник повержен!',
      bossDefeatedToast: 'Босс повержен! Награда получена!',
      caughtInNetTitle: 'ПОЙМАНЫ В СЕТЬ!',
      caughtInNetSub: 'Жмите E или Space чтобы вырваться',
      shieldUnlockedLvl3: 'Силовой щит [E] разблокирован!'
    }
  },
  en: {
    subtitle: 'Ocean Action Arcade · SafeSave v2',
    play: 'Play',
    continue: 'Continue',
    restart: 'Restart',
    pause: 'Pause',
    shop: 'Shop',
    settings: 'Settings',
    sound: 'Sound',
    soundOn: 'Sound On',
    soundOff: 'Muted',
    record: 'Best',
    coins: 'Coins',
    level: 'Level',
    score: 'Score',
    exit: 'Exit',
    reefsValue: '100 Stages',
    locationsLabel: 'Biomes',
    evolutionTitle: 'Shark Evolution',
    tabEvolution: 'Evolution',
    stagesBtn: '100-Stage Map',
    stagesModalTitle: 'Ocean Chronicle · 100 Locations',
    stagesModalSub: '10 Biomes × 10 Stages · Mini-bosses every 5th · Era Bosses every 10th',
    stageCurrentTag: 'Current',
    stageClearedTag: 'Cleared',
    stageLockedTag: 'Locked',
    miniBossTag: 'Mini-Boss',
    eraBossTag: 'Era Boss',
    evolveBtn: 'Evolve',
    evolveEquipped: 'Active',
    evolveLockedStage: (s) => `Unlocks Stage ${s}`,
    mightLabel: 'Might',
    scaleLabel: 'Size',
    chronicleSummary: (f, e, b) => `Fish: ${f} · Predators: ${e} · Bosses: ${b}`,
    skinPerks: {
      classic: 'Balanced starter predator',
      tiger: '+15% Dash DMG · +15% Coins',
      neon: '+25% Energy Regen · +60px Magnet · +10% Coins',
      ruby: '+4 HP Lifesteal · +10% Dash · +5% Crit',
      abyss: '+20% Dash · +10% Crit · +120px Magnet · +25% Coins'
    },
    hpLabel: 'Health',
    energyLabel: 'Energy',
    fishLabel: 'Fish',
    enemiesLabel: 'Predators',
    bossLabel: 'BOSS',
    shieldActive: 'Shield Active [E]',
    shieldReady: 'Shield Ready [E]',
    shieldLockedHint: 'Shield: Shop (300 🪙)',
    frenzyBanner: 'SHARK FRENZY · SPEED X2 · MAGNET',
    comboLabel: 'COMBO',
    moveStick: 'Move',
    dashBtn: 'Dash',
    shieldBtn: 'Shield',
    breakNetBtn: 'Break Net',
    turboLabel: 'TURBO',
    shieldLockedShort: 'Shop',
    hintSwim: 'Swim',
    hintDash: 'Turbo Dash',
    hintShield: 'Shield / Break Net',
    pauseTitle: 'Paused',
    pauseSubtitle: 'Progress saved automatically',
    languageLabel: 'Language',
    shopTitle: 'Apex Armory',
    balanceLabel: 'Balance',
    tabSkills: 'Skills',
    tabSkins: 'Skins',
    tabAch: 'Awards',
    tabBank: 'Store $',
    shieldItemName: 'Energy Shield',
    shieldItemDesc: 'Absorbs 70% damage. Activating within 0.25s before a hit triggers a Parry stun!',
    unlockedBadge: 'Unlocked',
    boughtLabel: 'Owned',
    maxLabel: 'Max',
    equippedLabel: 'Equipped',
    selectLabel: 'Select',
    completedLabel: 'Completed',
    bankIntro: 'USD Coin Bundles (Stripe / Xsolla gateway-ready checkout preview)',
    popularTag: 'Popular',
    bestValueTag: 'Best Value',
    buyUsdBtn: 'Buy',
    bonusPercent: (pct) => `+${pct}% bonus`,
    summaryVictoryTitle: 'Reef Cleared',
    summaryVictorySub: 'Clean hunt — rewards ready to claim',
    summaryGameOverTitle: 'Hunt Interrupted',
    summaryGameOverSub: 'Collected coins have been saved',
    runCoinsLabel: 'Run Coins',
    totalCoinsLabel: 'Total Balance',
    doubleCoinsBtn: '2x Coins · Watch Ad',
    doubledDoneBtn: '2x Bonus Claimed',
    nextReefBtn: 'Next Reef',
    retryReefBtn: 'Retry Reef',
    backMenuBtn: 'Main Menu',
    adModalTitle: 'Rewarded Video Ad',
    adModalDesc: '5-second rewarded ad preview ready for CrazyGames / IMA Ad SDK',
    adSecondsLeft: (sec) => `Reward in ${sec}s`,
    adSkipBtn: 'Close without 2x',
    adRewardLabel: 'Double run coins reward',
    payModalTitle: 'Checkout Preview',
    payProviderLabel: 'Payment Adapter',
    payAmountLabel: 'Total Due',
    payCoinsLabel: 'Grant Amount',
    payTestBtn: 'Complete Test Purchase',
    payCancelBtn: 'Cancel',
    payDisclaimer: 'Payment system is in preview mode. Intent routes through the Stripe/Xsolla adapter and commits coins to SafeSave v2.',
    paySuccessToast: (c) => `Credited +${c} 🪙 (test)`,
    adRewardToast: (c) => `Ad bonus: +${c} 🪙`,
    adCancelledToast: 'Ad closed early — base coins kept',
    dailyBtn: '30-Day Gifts',
    dailyReadyBadge: 'Ready',
    dailyDoneBadge: 'Claimed',
    dailyTitle: '30-Day Daily Rewards',
    dailySubtitle: 'Soft streak: missed days never reset your progress. Milestone rewards on Days 7, 14, 21 & 30.',
    dailyDayLabel: (d) => `Day ${d}`,
    dailyCycleLabel: (c) => `Cycle ${c + 1}`,
    dailyClaimedLabel: 'Claimed',
    dailyReadyLabel: 'Ready',
    dailyClaimBtn: 'Claim',
    dailyClaim2xBtn: 'Claim 2x · Watch Ad',
    dailyComeBackTomorrow: 'Today’s reward claimed — come back tomorrow',
    dailyClaimToast: (c, extra) =>
      extra ? `Daily reward: +${c} 🪙 · ${extra}` : `Daily reward: +${c} 🪙`,
    dailyMilestones: {
      shield: 'Shield (or +500 🪙)',
      skill: '+1 Skill (or +400 🪙)',
      skin_tiger: 'Golden Tiger (or +600 🪙)',
      skin_abyss: 'Astral Shadow (or +2500 🪙)'
    },
    levels: {
      1: 'Azure Shallows',
      2: 'Coastal Waters',
      3: 'Coral Reef',
      4: 'Shadow Grotto',
      5: 'Jellyfish Lair',
      6: 'Open Ocean',
      7: 'Glacial Waters',
      8: 'Volcanic Trench',
      9: 'Sunken City',
      10: 'Titan Abyss'
    },
    skills: {
      attack: { name: 'Jaw Power', desc: '+60% bite damage per rank' },
      armor: { name: 'Shark Armor', desc: 'Reduces damage taken from predators' },
      regen: { name: 'Regeneration', desc: 'Continuous passive health recovery' },
      speed: { name: 'Turbo Fin', desc: 'Boosts base swim and dash speed' },
      lifesteal: { name: 'Vampirism', desc: 'Restores HP on every fish eaten' },
      crit: { name: 'Critical Bite', desc: 'Chance to deal crushing double damage' }
    },
    skins: {
      classic: { name: 'Royal Sapphire', desc: 'Classic apex predator of azure reefs' },
      tiger: { name: 'Golden Tiger', desc: 'Sunlit amber scales with golden sheen' },
      neon: { name: 'Neon Pulse', desc: 'Bioluminescent deep-sea glow' },
      ruby: { name: 'Blood Ruby', desc: 'Legendary crimson leviathan' },
      abyss: { name: 'Astral Shadow', desc: 'Ancient sovereign of the eternal abyss' }
    },
    achievements: {
      first: { name: 'First Blood', desc: 'Eat your very first fish' },
      lvl1: { name: 'Shallows Conqueror', desc: 'Complete Level 1' },
      lvl5: { name: 'Reef Sovereign', desc: 'Complete Level 5' },
      lvl10: { name: 'Ocean Legend', desc: 'Complete all 10 levels' },
      jelly: { name: 'Abyss Vanquisher', desc: 'Defeat the Giant Jellyfish' },
      combo10: { name: 'Combo Master X10', desc: 'Chain 10 rapid bites' },
      rich: { name: 'Ocean Tycoon', desc: 'Accumulate 5,000 coins' },
      jumper: { name: 'Sky Breacher', desc: 'Leap out of the water 5 times' }
    },
    ingame: {
      levelTitle: (n) => `STAGE ${n} / 100`,
      bossAlert: 'ERA BOSS!',
      miniBossAlert: 'STAGE GUARDIAN!',
      victoryTitle: 'STAGE CLEARED!',
      victorySub: 'Rewards ready to claim',
      gameOverTitle: 'HUNT ENDED',
      gameOverSub: 'Shark ran out of health',
      frenzyTitle: 'SHARK FRENZY!',
      frenzySub: 'Speed +40% · Coin Magnet',
      netFreedTitle: 'NET SHREDDED!',
      netFreedSub: 'Back to open water',
      netEscapeToast: 'Bite the net! Mash E!',
      shieldBlocked: 'Shield absorbed 70% damage!',
      parryToast: 'PARRY! Predator stunned!',
      shieldLockedToast: 'Shield unlocks at Stage 3 or in Shop',
      shieldOn: 'Shield activated (key E)',
      shieldOff: 'Shield deactivated',
      shieldNoEnergy: 'Not enough energy for shield',
      shieldDepleted: 'Energy depleted — shield off',
      shieldPurchased: 'Energy Shield unlocked! Press E to toggle',
      skillUpgraded: 'Skill upgraded',
      evolutionUpgraded: (name) => `EVOLUTION: ${name}!`,
      skinEquipped: 'Skin equipped',
      skinPurchased: 'New skin unlocked and equipped',
      achievementToast: (name) => `Achievement: ${name}`,
      hornToast: 'Schooner horn echoes nearby...',
      hookToast: 'Sharp fishing hook!',
      chestToast: '+50+ 🪙 from treasure chest',
      shieldDropToast: 'Shield acquired! Press E to activate',
      magnetToast: 'Coin magnet active',
      starToast: 'Invulnerability active',
      clockToast: 'Time slow active',
      gemToast: 'Deep Sea Gem: +25 HP, +30 🪙',
      coinToast: '+15 🪙',
      enemyCoinToast: 'Predator defeated!',
      bossDefeatedToast: 'Boss defeated! Bonus coins claimed!',
      caughtInNetTitle: 'TRAPPED IN NET!',
      caughtInNetSub: 'Mash E or Space to break free',
      shieldUnlockedLvl3: 'Energy Shield [E] unlocked!'
    }
  },
  zh: {
    subtitle: '深海动作街机 · SafeSave v2',
    play: '开始游戏',
    continue: '继续',
    restart: '重新开始',
    pause: '暂停',
    shop: '商店',
    settings: '设置',
    sound: '声音',
    soundOn: '声音开启',
    soundOff: '已静音',
    record: '最高分',
    coins: '金币',
    level: '关卡',
    score: '分数',
    exit: '退出',
    reefsValue: '100 关卡',
    locationsLabel: '海域',
    evolutionTitle: '鲨鱼进化',
    tabEvolution: '进化',
    stagesBtn: '百关地图',
    stagesModalTitle: '深海编年史 · 100 关卡',
    stagesModalSub: '10 大生态 × 10 小关 · 每 5 关精英守卫 · 每 10 关纪元首领',
    stageCurrentTag: '当前',
    stageClearedTag: '已通关',
    stageLockedTag: '未解锁',
    miniBossTag: '精英守卫',
    eraBossTag: '纪元首领',
    evolveBtn: '进化形态',
    evolveEquipped: '已激活',
    evolveLockedStage: (s) => `第 ${s} 关解锁`,
    mightLabel: '战力',
    scaleLabel: '体型',
    chronicleSummary: (f, e, b) => `鱼群: ${f} · 敌鱼: ${e} · 首领: ${b}`,
    skinPerks: {
      classic: '均衡的基础掠食者',
      tiger: '冲刺伤害 +15% · 金币 +15%',
      neon: '能量恢复 +25% · 磁铁 +60px · 金币 +10%',
      ruby: '吸血 +4 HP · 冲刺 +10% · 暴击 +5%',
      abyss: '冲刺 +20% · 暴击 +10% · 磁铁 +120px · 金币 +25%'
    },
    hpLabel: '生命值',
    energyLabel: '能量',
    fishLabel: '鱼群',
    enemiesLabel: '敌鱼',
    bossLabel: '首领',
    shieldActive: '护盾开启 [E]',
    shieldReady: '护盾就绪 [E]',
    shieldLockedHint: '护盾：商店解锁 (300 🪙)',
    frenzyBanner: '狂暴模式 · 速度翻倍 · 磁铁吸附',
    comboLabel: '连击',
    moveStick: '移动',
    dashBtn: '冲刺',
    shieldBtn: '护盾',
    breakNetBtn: '挣脱渔网',
    turboLabel: '加速',
    shieldLockedShort: '商店',
    hintSwim: '游动',
    hintDash: '极速冲刺',
    hintShield: '护盾 / 挣脱渔网',
    pauseTitle: '游戏暂停',
    pauseSubtitle: '进度已自动保存',
    languageLabel: '语言',
    shopTitle: '掠食者商店',
    balanceLabel: '余额',
    tabSkills: '技能',
    tabSkins: '外观',
    tabAch: '成就',
    tabBank: '充值 $',
    shieldItemName: '能量护盾',
    shieldItemDesc: '抵挡 70% 伤害；受击前 0.25 秒开启可触发完美格挡并眩晕敌人！',
    unlockedBadge: '已解锁',
    boughtLabel: '已拥有',
    maxLabel: '已满级',
    equippedLabel: '已装备',
    selectLabel: '选择',
    completedLabel: '已达成',
    bankIntro: '美元金币礼包（已预留 Stripe / Xsolla 支付接口预览）',
    popularTag: '热门',
    bestValueTag: '超值推荐',
    buyUsdBtn: '购买',
    bonusPercent: (pct) => `+${pct}% 赠送`,
    summaryVictoryTitle: '关卡完成',
    summaryVictorySub: '精彩狩猎，可领取本局奖励',
    summaryGameOverTitle: '狩猎结束',
    summaryGameOverSub: '本局收集的金币已保存',
    runCoinsLabel: '本局金币',
    totalCoinsLabel: '当前总金币',
    doubleCoinsBtn: '看广告双倍金币',
    doubledDoneBtn: '已领取双倍奖励',
    nextReefBtn: '下一关',
    retryReefBtn: '重试本关',
    backMenuBtn: '返回菜单',
    adModalTitle: '激励视频广告',
    adModalDesc: '5 秒激励广告模拟预览（可直接对接 CrazyGames / IMA 广告 SDK）',
    adSecondsLeft: (sec) => `${sec} 秒后发放奖励`,
    adSkipBtn: '关闭且不翻倍',
    adRewardLabel: '本局金币翻倍奖励',
    payModalTitle: '支付预览',
    payProviderLabel: '支付通道',
    payAmountLabel: '应付金额',
    payCoinsLabel: '获得金币',
    payTestBtn: '模拟支付并到账',
    payCancelBtn: '取消',
    payDisclaimer: '当前为支付预览模式，订单会发送至 Stripe/Xsolla 适配器并将金币写入 SafeSave v2。',
    paySuccessToast: (c) => `已到账 +${c} 🪙（测试模式）`,
    adRewardToast: (c) => `广告翻倍奖励：+${c} 🪙`,
    adCancelledToast: '广告已提前关闭，保留基础金币',
    dailyBtn: '30日签到',
    dailyReadyBadge: '可领取',
    dailyDoneBadge: '已领取',
    dailyTitle: '30 天连续签到奖励',
    dailySubtitle: '温和连签：漏签不会清零进度。第 7、14、21、30 天可获超级里程碑奖励。',
    dailyDayLabel: (d) => `第 ${d} 天`,
    dailyCycleLabel: (c) => `第 ${c + 1} 轮`,
    dailyClaimedLabel: '已领',
    dailyReadyLabel: '今日可领',
    dailyClaimBtn: '领取奖励',
    dailyClaim2xBtn: '双倍领取 · 看广告',
    dailyComeBackTomorrow: '今日奖励已领取 — 明天再来吧',
    dailyClaimToast: (c, extra) =>
      extra ? `签到奖励：+${c} 🪙 · ${extra}` : `签到奖励：+${c} 🪙`,
    dailyMilestones: {
      shield: '能量护盾 (或 +500 🪙)',
      skill: '+1 技能等级 (或 +400 🪙)',
      skin_tiger: '黄金虎鲨 (或 +600 🪙)',
      skin_abyss: '星界暗影 (或 +2500 🪙)'
    },
    levels: {
      1: '蔚蓝浅滩',
      2: '近海礁区',
      3: '珊瑚花园',
      4: '幽暗海窟',
      5: '水母巢穴',
      6: '远洋深海',
      7: '冰封海域',
      8: '海底火山',
      9: '沉没古城',
      10: '泰坦深渊'
    },
    skills: {
      attack: { name: '撕咬力量', desc: '每次升级提升 60% 咬合伤害' },
      armor: { name: '鲨鱼鳞甲', desc: '减少来自敌方掠食者的伤害' },
      regen: { name: '生命再生', desc: '在水中持续缓慢恢复生命值' },
      speed: { name: '涡轮鱼鳍', desc: '提升基础游动与冲刺速度' },
      lifesteal: { name: '嗜血回复', desc: '吞噬鱼类时回复生命值' },
      crit: { name: '暴击撕咬', desc: '有几率造成双倍致命伤害' }
    },
    skins: {
      classic: { name: '皇家蓝宝石', desc: '蔚蓝浅海的经典掠食者' },
      tiger: { name: '黄金虎鲨', desc: '闪耀琥珀光泽的阳光战甲' },
      neon: { name: '霓虹脉冲', desc: '深海生物荧光幻影' },
      ruby: { name: '血色红宝石', desc: '传说中的深红海皇' },
      abyss: { name: '星界暗影', desc: '永恒深渊的远古巨兽' }
    },
    achievements: {
      first: { name: '初试锋芒', desc: '吞噬第一条小鱼' },
      lvl1: { name: '浅滩征服者', desc: '完成第 1 关' },
      lvl5: { name: '珊瑚主宰', desc: '完成第 5 关' },
      lvl10: { name: '海洋传奇', desc: '通关全部 10 个海域' },
      jelly: { name: '深渊克星', desc: '击败巨型水母首领' },
      combo10: { name: '连击大师 X10', desc: '连续完成 10 次吞噬' },
      rich: { name: '深海富豪', desc: '累计拥有 5,000 金币' },
      jumper: { name: '跃海飞鲨', desc: '跃出水面 5 次' }
    },
    ingame: {
      levelTitle: (n) => `第 ${n} / 100 关`,
      bossAlert: '纪元首领降临！',
      miniBossAlert: '关卡守卫出现！',
      victoryTitle: '关卡完成！',
      victorySub: '可领取本局奖励',
      gameOverTitle: '狩猎结束',
      gameOverSub: '鲨鱼生命耗尽',
      frenzyTitle: '狂暴模式开启！',
      frenzySub: '速度 +40% · 金币磁铁',
      netFreedTitle: '冲破渔网！',
      netFreedSub: '重获自由',
      netEscapeToast: '撕咬渔网！快按 E 键！',
      shieldBlocked: '护盾抵消 70% 伤害！',
      parryToast: '完美弹反！敌人眩晕！',
      shieldLockedToast: '第 3 关自动解锁护盾或前往商店购买',
      shieldOn: '护盾已开启 (E 键)',
      shieldOff: '护盾已关闭',
      shieldNoEnergy: '能量不足，无法开启护盾',
      shieldDepleted: '能量耗尽，护盾已自动关闭',
      shieldPurchased: '护盾已购买！按 E 键开启',
      skillUpgraded: '技能已升级',
      evolutionUpgraded: (name) => `进化突破：${name}！`,
      skinEquipped: '外观已装备',
      skinPurchased: '已购买并装备新外观',
      achievementToast: (name) => `解锁成就：${name}`,
      hornToast: '远处传来渔船汽笛声...',
      hookToast: '小心锋利鱼钩！',
      chestToast: '宝箱奖励 +50+ 🪙',
      shieldDropToast: '获得护盾！按 E 键激活',
      magnetToast: '金币磁铁已激活',
      starToast: '无敌状态激活',
      clockToast: '时间减缓已激活',
      gemToast: '深海宝石：+25 生命，+30 🪙',
      coinToast: '+15 🪙',
      enemyCoinToast: '击败敌鱼！',
      bossDefeatedToast: '首领已被击败！',
      caughtInNetTitle: '被渔网困住了！',
      caughtInNetSub: '连按 E 或空格键挣脱',
      shieldUnlockedLvl3: '能量护盾 [E] 已解锁！'
    }
  }
};

export interface UsdCoinPack {
  sku: string;
  amountUsd: number;
  coins: number;
  bonusPct?: number;
  highlight?: 'popular' | 'best';
}

export const USD_COIN_PACKS: UsdCoinPack[] = [
  { sku: 'pack_500', amountUsd: 0.99, coins: 500 },
  { sku: 'pack_3000', amountUsd: 4.99, coins: 3000, bonusPct: 20, highlight: 'popular' },
  { sku: 'pack_7500', amountUsd: 9.99, coins: 7500, bonusPct: 50 },
  { sku: 'pack_20000', amountUsd: 19.99, coins: 20000, bonusPct: 100, highlight: 'best' }
];
