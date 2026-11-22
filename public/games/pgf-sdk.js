(function (global) {
  'use strict';

  var SUPPORTED_LOCALES = ['ru', 'en', 'zh'];
  var DEFAULT_LOCALE = 'ru';
  var GAME_VERSION = '2.0.0';

  function detectSlug() {
    try {
      var cur = document.currentScript;
      if (cur && cur.getAttribute('data-game')) {
        return String(cur.getAttribute('data-game')).trim();
      }
      var scripts = document.querySelectorAll('script[data-game]');
      if (scripts.length > 0) {
        return String(scripts[scripts.length - 1].getAttribute('data-game')).trim();
      }
    } catch (_) {}
    return 'shark-empire';
  }

  var slug = detectSlug() || 'shark-empire';
  var PRIMARY_KEY = 'playgamefree-' + slug + '-save-v2';
  var TMP_KEY = PRIMARY_KEY + '-tmp';
  var CORRUPT_BACKUP_KEY = PRIMARY_KEY + '-corrupt-backup';
  var LOCALE_STORAGE_KEY = 'playgamefree-locale';

  // Standard PlayGameFree portal dictionary for [data-pgf] auto-translation
  var PORTAL_DICT = {
    ru: {
      play: 'Играть',
      continue: 'Продолжить',
      restart: 'Заново',
      pause: 'Пауза',
      shop: 'Магазин',
      settings: 'Настройки',
      sound: 'Звук',
      record: 'Рекорд',
      coins: 'Монеты',
      level: 'Уровень',
      score: 'Счёт',
      exit: 'Выход'
    },
    en: {
      play: 'Play',
      continue: 'Continue',
      restart: 'Restart',
      pause: 'Pause',
      shop: 'Shop',
      settings: 'Settings',
      sound: 'Sound',
      record: 'Best',
      coins: 'Coins',
      level: 'Level',
      score: 'Score',
      exit: 'Exit'
    },
    zh: {
      play: '开始游戏',
      continue: '继续',
      restart: '重新开始',
      pause: '暂停',
      shop: '商店',
      settings: '设置',
      sound: '声音',
      record: '最高分',
      coins: '金币',
      level: '关卡',
      score: '分数',
      exit: '退出'
    }
  };

  function normalizeLocale(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var shortCode = raw.trim().toLowerCase().slice(0, 2);
    if (shortCode === 'cn') shortCode = 'zh';
    return SUPPORTED_LOCALES.indexOf(shortCode) !== -1 ? shortCode : null;
  }

  function detectInitialLocale() {
    try {
      var params = new URLSearchParams(global.location.search || '');
      var urlLang = normalizeLocale(params.get('lang'));
      if (urlLang) return urlLang;
    } catch (_) {}

    try {
      var stored = normalizeLocale(global.localStorage.getItem(LOCALE_STORAGE_KEY));
      if (stored) return stored;
    } catch (_) {}

    try {
      var navLang = normalizeLocale(global.navigator && global.navigator.language);
      if (navLang) return navLang;
    } catch (_) {}

    return DEFAULT_LOCALE;
  }

  var currentLocale = detectInitialLocale();
  var localeListeners = [];
  var syncListeners = [];
  var autoSaveProvider = null;

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function safeGetItem(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeRemoveItem(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (_) {}
  }

  function parseEnvelope(raw) {
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (
        isPlainObject(parsed) &&
        parsed.schemaVersion === 2 &&
        isPlainObject(parsed.state)
      ) {
        return parsed;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function buildEnvelope(state) {
    var cleanState = isPlainObject(state) ? state : {};
    return {
      schemaVersion: 2,
      gameId: slug,
      gameVersion: GAME_VERSION,
      updatedAt: new Date().toISOString(),
      meta: {
        hasProgress: true,
        locale: currentLocale
      },
      state: cleanState
    };
  }

  function migrateSharkEmpireLegacy() {
    var hasLegacy =
      safeGetItem('shark_coins') !== null ||
      safeGetItem('shark_level') !== null ||
      safeGetItem('shark_shield_unlocked') !== null ||
      safeGetItem('shark_owned_skins') !== null ||
      safeGetItem('shark_ach') !== null ||
      safeGetItem('shark_sk_attack') !== null;

    if (!hasLegacy) return null;

    var parseNum = function (key, fallback) {
      var raw = safeGetItem(key);
      if (raw === null) return fallback;
      var n = parseInt(raw, 10);
      return isNaN(n) ? fallback : n;
    };

    var parseJson = function (key, fallback) {
      var raw = safeGetItem(key);
      if (!raw) return fallback;
      try {
        return JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    };

    var skins = parseJson('shark_owned_skins', ['classic']);
    if (!Array.isArray(skins) || skins.length === 0) skins = ['classic'];

    var ach = parseJson('shark_ach', {});
    if (!isPlainObject(ach)) ach = {};

    return {
      coins: Math.max(0, parseNum('shark_coins', 100)),
      highScore: 0,
      currentLevel: Math.max(1, parseNum('shark_level', 1)),
      shieldUnlocked: safeGetItem('shark_shield_unlocked') === 'true',
      skills: {
        attack: Math.min(3, Math.max(0, parseNum('shark_sk_attack', 0))),
        armor: Math.min(3, Math.max(0, parseNum('shark_sk_armor', 0))),
        regen: Math.min(3, Math.max(0, parseNum('shark_sk_regen', 0))),
        speed: Math.min(3, Math.max(0, parseNum('shark_sk_speed', 0))),
        lifesteal: Math.min(3, Math.max(0, parseNum('shark_sk_lifesteal', 0))),
        crit: Math.min(3, Math.max(0, parseNum('shark_sk_crit', 0)))
      },
      skinsOwned: skins,
      currentSkin: safeGetItem('shark_skin') || 'classic',
      achievements: ach,
      soundMuted: false,
      breachCount: 0,
      dailyRewards: {
        streakDay: 0,
        lastClaimDate: null,
        claimedDays: [],
        cycleCount: 0
      }
    };
  }

  function migrateGenericLegacy(legacyKeys) {
    if (!Array.isArray(legacyKeys)) return null;
    for (var i = 0; i < legacyKeys.length; i++) {
      var raw = safeGetItem(legacyKeys[i]);
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (isPlainObject(parsed)) {
            return parsed;
          }
        } catch (_) {}
      }
    }
    return null;
  }

  function postToPortal(message) {
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage(message, '*');
      }
    } catch (_) {}
  }

  function save(state) {
    var envelope = buildEnvelope(state);
    var serialized;
    try {
      serialized = JSON.stringify(envelope);
    } catch (_) {
      return null;
    }

    // Atomic two-phase write via -tmp staging buffer
    var wroteTmp = safeSetItem(TMP_KEY, serialized);
    if (!wroteTmp) {
      safeSetItem(PRIMARY_KEY, serialized);
      postToPortal({ type: 'PGF_SAVE', slug: slug, envelope: envelope });
      return envelope;
    }

    var verifyRaw = safeGetItem(TMP_KEY);
    if (parseEnvelope(verifyRaw)) {
      safeSetItem(PRIMARY_KEY, verifyRaw);
      safeRemoveItem(TMP_KEY);
    }

    postToPortal({ type: 'PGF_SAVE', slug: slug, envelope: envelope });
    return envelope;
  }

  function load(options) {
    var opts = isPlainObject(options) ? options : {};

    // 1. Check primary key
    var rawPrimary = safeGetItem(PRIMARY_KEY);
    if (rawPrimary !== null) {
      var primaryEnv = parseEnvelope(rawPrimary);
      if (primaryEnv) {
        return primaryEnv.state;
      }
      // Quarantine corrupted payload into protective backup before recovering
      safeSetItem(CORRUPT_BACKUP_KEY, rawPrimary);
      safeRemoveItem(PRIMARY_KEY);
    }

    // 2. Recover from interrupted -tmp write if valid
    var rawTmp = safeGetItem(TMP_KEY);
    if (rawTmp !== null) {
      var tmpEnv = parseEnvelope(rawTmp);
      if (tmpEnv) {
        safeSetItem(PRIMARY_KEY, rawTmp);
        safeRemoveItem(TMP_KEY);
        return tmpEnv.state;
      }
      safeRemoveItem(TMP_KEY);
    }

    // 3. Transparent migration from legacy keys
    var migrated = null;
    if (slug === 'shark-empire') {
      migrated = migrateSharkEmpireLegacy();
    }
    if (!migrated) {
      var legacyCandidates = Array.isArray(opts.legacyKeys)
        ? opts.legacyKeys
        : ['dinoFightLegendaryV4', 'catGarden_v16'];
      migrated = migrateGenericLegacy(legacyCandidates);
    }

    if (migrated) {
      save(migrated);
      return migrated;
    }

    return isPlainObject(opts.defaultState) ? opts.defaultState : null;
  }

  function loadEnvelope() {
    var raw = safeGetItem(PRIMARY_KEY);
    return parseEnvelope(raw);
  }

  function translateDOM(root) {
    try {
      var scope = root || document;
      if (!scope || !scope.querySelectorAll) return;
      var dict = PORTAL_DICT[currentLocale] || PORTAL_DICT[DEFAULT_LOCALE];
      var nodes = scope.querySelectorAll('[data-pgf]');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var key = el.getAttribute('data-pgf');
        if (key && dict[key]) {
          el.textContent = dict[key];
        }
      }
    } catch (_) {}
  }

  function setLocale(nextLang, options) {
    var normalized = normalizeLocale(nextLang);
    if (!normalized || normalized === currentLocale) {
      translateDOM();
      return currentLocale;
    }

    currentLocale = normalized;
    safeSetItem(LOCALE_STORAGE_KEY, currentLocale);

    try {
      document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : currentLocale;
    } catch (_) {}

    translateDOM();

    for (var i = 0; i < localeListeners.length; i++) {
      try {
        localeListeners[i](currentLocale);
      } catch (_) {}
    }

    if (!options || !options.silentPortal) {
      postToPortal({ type: 'PGF_LOCALE_ACK', slug: slug, lang: currentLocale });
    }

    return currentLocale;
  }

  function flushAutoSave() {
    if (typeof autoSaveProvider === 'function') {
      try {
        var snapshot = autoSaveProvider();
        if (isPlainObject(snapshot)) {
          save(snapshot);
        }
      } catch (_) {}
    }
  }

  // Automatic page lifecycle persistence
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        flushAutoSave();
      }
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        translateDOM();
      });
    } else {
      translateDOM();
    }
  }

  global.addEventListener('pagehide', flushAutoSave);
  global.addEventListener('beforeunload', flushAutoSave);

  // Portal bidirectional message channel
  global.addEventListener('message', function (event) {
    var data = event && event.data;
    if (!isPlainObject(data)) return;

    if (data.type === 'PGF_LOCALE' && data.lang) {
      setLocale(data.lang, { silentPortal: true });
    } else if (
      (data.type === 'PGF_SYNC' || data.type === 'PGF_LOAD_STATE') &&
      isPlainObject(data.envelope) &&
      parseEnvelope(JSON.stringify(data.envelope))
    ) {
      var localEnv = loadEnvelope();
      var incomingTime = Date.parse(data.envelope.updatedAt || '') || 0;
      var localTime = localEnv ? Date.parse(localEnv.updatedAt || '') || 0 : 0;
      if (!localEnv || incomingTime >= localTime) {
        save(data.envelope.state);
        for (var i = 0; i < syncListeners.length; i++) {
          try {
            syncListeners[i](data.envelope.state);
          } catch (_) {}
        }
      }
    }
  });

  // Notify parent portal that game SDK is initialized
  postToPortal({
    type: 'PGF_READY',
    slug: slug,
    schemaVersion: 2,
    locale: currentLocale
  });

  // Expose unified PGF micro-SDK API
  global.PGF = {
    slug: slug,
    storageKey: PRIMARY_KEY,
    schemaVersion: 2,
    save: save,
    load: load,
    loadEnvelope: loadEnvelope,
    flush: flushAutoSave,
    registerAutoSave: function (providerFn) {
      autoSaveProvider = typeof providerFn === 'function' ? providerFn : null;
      return function () {
        if (autoSaveProvider === providerFn) autoSaveProvider = null;
      };
    },
    getLocale: function () {
      return currentLocale;
    },
    setLocale: function (lang) {
      return setLocale(lang);
    },
    onLocaleChange: function (cb) {
      if (typeof cb !== 'function') return function () {};
      localeListeners.push(cb);
      return function () {
        localeListeners = localeListeners.filter(function (fn) {
          return fn !== cb;
        });
      };
    },
    onRemoteSync: function (cb) {
      if (typeof cb !== 'function') return function () {};
      syncListeners.push(cb);
      return function () {
        syncListeners = syncListeners.filter(function (fn) {
          return fn !== cb;
        });
      };
    },
    t: function (key) {
      var dict = PORTAL_DICT[currentLocale] || PORTAL_DICT[DEFAULT_LOCALE];
      return dict[key] || key;
    },
    translateDOM: translateDOM,
    exitToPortal: function () {
      flushAutoSave();
      postToPortal({ type: 'PGF_EXIT', slug: slug });
    },
    ad: {
      // Hooks into CrazyGames SDK if present on host window, otherwise delegates to game's simulated 5s UI player
      requestRewarded: function (callbacks, simulatorTrigger) {
        var cbs = isPlainObject(callbacks) ? callbacks : {};
        var cg = global.CrazyGames && global.CrazyGames.SDK && global.CrazyGames.SDK.ad;
        if (cg && typeof cg.requestAd === 'function') {
          try {
            cg.requestAd('rewarded', {
              adStarted: function () {
                if (typeof cbs.adStarted === 'function') cbs.adStarted();
              },
              adFinished: function () {
                if (typeof cbs.adFinished === 'function') cbs.adFinished();
              },
              adError: function (err) {
                if (typeof cbs.adError === 'function') cbs.adError(err);
              }
            });
            return;
          } catch (_) {}
        }
        if (typeof simulatorTrigger === 'function') {
          simulatorTrigger(cbs);
        } else if (typeof cbs.adError === 'function') {
          cbs.adError(new Error('No rewarded ad handler registered'));
        }
      }
    },
    payments: {
      createSession: function (intent) {
        var session = {
          sessionId: 'pgf_sim_' + Date.now().toString(36),
          gameSlug: slug,
          provider: intent && intent.provider ? intent.provider : 'stripe',
          sku: intent && intent.sku ? intent.sku : 'pack_500',
          amountUsd: intent && intent.amountUsd ? intent.amountUsd : 0.99,
          currency: 'USD',
          coins: intent && intent.coins ? intent.coins : 500,
          mode: 'preview',
          createdAt: new Date().toISOString()
        };
        postToPortal({ type: 'PGF_PAYMENT_INTENT', slug: slug, session: session });
        return session;
      }
    }
  };
})(window);
