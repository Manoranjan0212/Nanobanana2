import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Gift, 
  Plus, 
  Lock, 
  TrendingUp, 
  Coins,
  MousePointerClick,
  Sprout,
  Send,
  User,
  Zap,
  Factory,
  Cpu,
  Hammer,
  HelpCircle,
  Gamepad2
} from 'lucide-react';
import { BananaSvg } from './components/BananaSvg';
import { ALL_SKINS, getSkinById, drawRandomSkin, DEFAULT_SKIN_ID } from './skins';
import { FlyingNumber, GoldenSpawn, Upgrade, BananaSkin } from './types';
import { 
  playTapSound, 
  playCritSound, 
  playUpgradeSound, 
  playClaimSound, 
  playFeverSound, 
  playGoldenSound, 
  setMutedState, 
  getMutedState 
} from './audio';
import { BananaArcade } from './components/BananaArcade';

const SAVE_KEY = 'nano_banana_2_save_v1.2';
const PACK_COOLDOWN_SECONDS = 45; // Fast cooldown for fun gameplay!

const UPGRADES_TEMPLATE = [
  { id: 'cursor', name: 'Nano Auto-Tapper', baseCost: 15, bpsToAdd: 0.2, clickPowerToAdd: 0, iconName: 'MousePointer', description: 'Robotic auto-finger that taps for you automatically.' },
  { id: 'fertilizer', name: 'Super Fertilizer', baseCost: 100, bpsToAdd: 0, clickPowerToAdd: 1, iconName: 'Sprout', description: 'Enriches soil nutrients to directly boost active tap power.' },
  { id: 'drone', name: 'Banana Drone', baseCost: 280, bpsToAdd: 1.5, clickPowerToAdd: 0, iconName: 'Navigation', description: 'Aero-copters that scan, water, and harvest plantations.' },
  { id: 'monkey', name: 'Monkey Recruiter', baseCost: 1200, bpsToAdd: 8.0, clickPowerToAdd: 0, iconName: 'Smile', description: 'A cute monkey trained in high-speed banana gathering.' },
  { id: 'cyber_peeler', name: 'Laser Peeler', baseCost: 3500, bpsToAdd: 0, clickPowerToAdd: 12, iconName: 'Zap', description: 'Utilizes precision beam tech to extract pulp faster.' },
  { id: 'refinery', name: 'Peel Bio-Refinery', baseCost: 9500, bpsToAdd: 60.0, clickPowerToAdd: 0, iconName: 'Factory', description: 'Refines excess fibrous peels into high-grade passive fuel.' },
  { id: 'quantum_splitter', name: 'Quantum Splitter', baseCost: 55000, bpsToAdd: 300.0, clickPowerToAdd: 0, iconName: 'Cpu', description: 'Fissions banana atoms to yield extreme passive output.' },
  { id: 'giga_harvester', name: 'Orbital Harvester', baseCost: 190000, bpsToAdd: 0, clickPowerToAdd: 150, iconName: 'Hammer', description: 'Mega satellite beam that boosts active clicks phenomenally.' }
];

export default function App() {
  // --- States ---
  const [bananas, setBananas] = useState<number>(0);
  const [totalClicked, setTotalClicked] = useState<number>(0);
  const [equippedSkinId, setEquippedSkinId] = useState<string>(DEFAULT_SKIN_ID);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>([DEFAULT_SKIN_ID]);
  const [upgradeCounts, setUpgradeCounts] = useState<{ [key: string]: number }>({
    cursor: 0, fertilizer: 0, drone: 0, monkey: 0, cyber_peeler: 0, refinery: 0, quantum: 0, giga_harvester: 0
  });
  
  const [lastPackClaimTime, setLastPackClaimTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Gameplay session states (non-persisted on launch)
  const [feverGauge, setFeverGauge] = useState<number>(0);
  const [feverActive, setFeverActive] = useState<boolean>(false);
  const [feverTimeLeft, setFeverTimeLeft] = useState<number>(0);
  
  const [flyingNumbers, setFlyingNumbers] = useState<FlyingNumber[]>([]);
  const [goldenSpawns, setGoldenSpawns] = useState<GoldenSpawn[]>([]);
  const [activeTab, setActiveTab] = useState<'upgrades' | 'skins' | 'pack' | 'arcade'>('upgrades');

  // Pack animation and claim overlays
  const [isOpeningPack, setIsOpeningPack] = useState<boolean>(false);
  const [revealedSkin, setRevealedSkin] = useState<BananaSkin | null>(null);
  const [packAnimationState, setPackAnimationState] = useState<'closed' | 'shaking' | 'revealed'>('closed');

  const [packTimeLeft, setPackTimeLeft] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [statBps, setStatBps] = useState<number>(0);
  const [statClickPower, setStatClickPower] = useState<number>(0);

  // Refs for tracking sequential animation counters
  const nextNumberId = useRef<number>(0);
  const lastTickTime = useRef<number>(Date.now());

  const currentSkin = getSkinById(equippedSkinId);

  // --- Load Save Game on Mount ---
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (typeof parsed.bananas === 'number') setBananas(parsed.bananas);
        if (typeof parsed.totalClicked === 'number') setTotalClicked(parsed.totalClicked);
        if (parsed.equippedSkinId) setEquippedSkinId(parsed.equippedSkinId);
        if (Array.isArray(parsed.unlockedSkinIds)) setUnlockedSkinIds(parsed.unlockedSkinIds);
        if (parsed.upgradeCounts) setUpgradeCounts(parsed.upgradeCounts);
        if (typeof parsed.lastPackClaimTime === 'number') setLastPackClaimTime(parsed.lastPackClaimTime);
        if (typeof parsed.isMuted === 'boolean') {
          setIsMuted(parsed.isMuted);
          setMutedState(parsed.isMuted);
        }
      } else {
        // Welcoming state: pack immediately openable on first load
        setLastPackClaimTime(Date.now() - (PACK_COOLDOWN_SECONDS * 1000));
      }
    } catch (e) {
      console.warn("Could not load save game from localStorage:", e);
    }
  }, []);

  // --- Save Game on State Changes ---
  useEffect(() => {
    try {
      const saveData = {
        bananas,
        totalClicked,
        equippedSkinId,
        unlockedSkinIds,
        upgradeCounts,
        lastPackClaimTime,
        isMuted
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn("Could not save progress to localStorage:", e);
    }
  }, [bananas, totalClicked, equippedSkinId, unlockedSkinIds, upgradeCounts, lastPackClaimTime, isMuted]);

  // --- Mute Toggle Handler ---
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    setMutedState(nextMute);
  };

  // --- Dynamic Stat Calculations ---
  useEffect(() => {
    // 1. Calculate base values from upgrades template
    let baseBps = 0;
    let baseClickPower = 1;

    UPGRADES_TEMPLATE.forEach((upgrade) => {
      const count = upgradeCounts[upgrade.id] || 0;
      baseBps += upgrade.bpsToAdd * count;
      baseClickPower += upgrade.clickPowerToAdd * count;
    });

    // 2. Apply skin multipliers
    let finalBps = baseBps * currentSkin.bpsMultiplier;
    let finalClick = baseClickPower * currentSkin.clickMultiplier;

    // 3. Apply Fever multipliers (5x both passive and active)
    if (feverActive) {
      finalBps *= 5;
      finalClick *= 5;
    }

    setStatBps(finalBps);
    setStatClickPower(finalClick);
  }, [upgradeCounts, equippedSkinId, feverActive]);

  // --- Pack Claim Timer Countdowns ---
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedMs = Date.now() - lastPackClaimTime;
      const cooldownMs = PACK_COOLDOWN_SECONDS * 1000;
      const remainingSecs = Math.max(0, Math.ceil((cooldownMs - elapsedMs) / 1000));
      setPackTimeLeft(remainingSecs);
    }, 200);

    return () => clearInterval(timer);
  }, [lastPackClaimTime]);

  // --- Passive Income Roll Stream (100ms) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      if (statBps > 0) {
        setBananas((prev) => prev + (statBps * deltaSec));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [statBps]);

  // --- Fever Decay / Timer Core Loops ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (feverActive) {
        setFeverTimeLeft((prev) => {
          if (prev <= 1) {
            setFeverActive(false);
            setFeverGauge(0);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Slowly decay fever gauge if not clicking
        setFeverGauge((prev) => Math.max(0, prev - 1.2));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [feverActive]);

  // --- Golden Banana Floating Spawn Logic ---
  useEffect(() => {
    // Attempt spawn every 25s - 45s
    const spawnTimer = setInterval(() => {
      if (Math.random() > 0.4 && goldenSpawns.length < 2) {
        const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
        const randomY = -15; // start off-screen top
        const speedX = (Math.random() - 0.5) * 1.5; // slow horizontal drift
        const speedY = Math.random() * 0.8 + 0.6; // slow vertical fall
        const value = Math.max(250, Math.round(statClickPower * 15 * (Math.random() * 2 + 1)));

        const newSpawn: GoldenSpawn = {
          id: Date.now(),
          x: randomX,
          y: randomY,
          value,
          scale: Math.random() * 0.4 + 0.8,
          speedY,
          speedX
        };

        setGoldenSpawns((prev) => [...prev, newSpawn]);
      }
    }, 20000);

    return () => clearInterval(spawnTimer);
  }, [statClickPower, goldenSpawns]);

  // --- Move Golden Bananas Downwards ---
  useEffect(() => {
    const animationFrame = setInterval(() => {
      setGoldenSpawns((prev) => 
        prev
          .map((spawn) => ({
            ...spawn,
            y: spawn.y + spawn.speedY,
            x: Math.max(5, Math.min(95, spawn.x + spawn.speedX))
          }))
          .filter((spawn) => spawn.y < 110) // Filter out items that fell off screen
      );
    }, 50);

    return () => clearInterval(animationFrame);
  }, []);

  // --- Tap Banana Main Click Action ---
  const handleBananaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Play cute bubbly synth plucking sound
    const isCrit = Math.random() < 0.12; // 12% critical hit rate
    
    // Pitch up the clicking sound if fever is active!
    const pitch = feverActive ? 1.5 : 1.0 + (feverGauge / 100) * 0.3;
    
    if (isCrit) {
      playCritSound();
    } else {
      playTapSound(pitch);
    }

    // 2. Calculate clicking yield
    const multiplier = isCrit ? 5 : 1;
    const earned = Math.round(statClickPower * multiplier);
    
    setBananas((prev) => prev + earned);
    setTotalClicked((prev) => prev + 1);

    // 3. Feed Fever gauge
    if (!feverActive) {
      setFeverGauge((prev) => {
        const next = prev + 3;
        if (next >= 100) {
          playFeverSound();
          setFeverActive(true);
          setFeverTimeLeft(12); // 12 Seconds of glorious 5X multiplier
          return 100;
        }
        return next;
      });
    }

    // 4. Generate flying numbers at the exact click location
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const numId = nextNumberId.current++;
    const newNum: FlyingNumber = {
      id: numId,
      value: isCrit ? `🔥 CRIT +${earned}!` : `+${earned}`,
      x: clickX,
      y: clickY,
      isCrit
    };

    setFlyingNumbers((prev) => [...prev, newNum]);

    // Clean up flying numbers after animation completes
    setTimeout(() => {
      setFlyingNumbers((prev) => prev.filter((item) => item.id !== numId));
    }, 800);
  };

  // --- Click Golden Spawn Event ---
  const handleGoldenClick = (spawn: GoldenSpawn, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    playGoldenSound();

    // Multiply golden payout by 2x if stellar supernova skin is active!
    const payoutFactor = equippedSkinId === 'stellar_supernova' ? 2 : 1;
    const finalPayout = spawn.value * payoutFactor;

    setBananas((prev) => prev + finalPayout);
    setGoldenSpawns((prev) => prev.filter((s) => s.id !== spawn.id));

    // Show massive indicator
    const numId = nextNumberId.current++;
    const newNum: FlyingNumber = {
      id: numId,
      value: `👑 GOLDEN BONUS +${finalPayout}!`,
      x: e.clientX - 100,
      y: e.clientY - 200,
      isCrit: true
    };
    setFlyingNumbers((prev) => [...prev, newNum]);
    setTimeout(() => {
      setFlyingNumbers((prev) => prev.filter((item) => item.id !== numId));
    }, 1200);
  };

  // --- Buy Store Upgrade ---
  const handleBuyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES_TEMPLATE.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    const count = upgradeCounts[upgradeId] || 0;
    const cost = Math.round(upgrade.baseCost * Math.pow(1.15, count));

    if (bananas >= cost) {
      setBananas((prev) => prev - cost);
      setUpgradeCounts((prev) => ({
        ...prev,
        [upgradeId]: count + 1
      }));
      playUpgradeSound();
    }
  };

  // --- Equipping Skin ---
  const handleEquipSkin = (skinId: string) => {
    if (unlockedSkinIds.includes(skinId)) {
      setEquippedSkinId(skinId);
      playTapSound(1.2);
    }
  };

  // --- Gacha: Open Free Nano Pack ---
  const handleOpenPack = () => {
    if (packTimeLeft > 0 || isOpeningPack) return;

    // Trigger opening sequence states
    setIsOpeningPack(true);
    setPackAnimationState('shaking');
    playTapSound(0.8);

    // Roll random skin
    const rolled = drawRandomSkin();
    setRevealedSkin(rolled);

    // Animate shaking, then reveal
    setTimeout(() => {
      setPackAnimationState('revealed');
      playClaimSound();
      
      // Add unlocked skin to inventory
      setUnlockedSkinIds((prev) => {
        if (!prev.includes(rolled.id)) {
          return [...prev, rolled.id];
        }
        return prev;
      });

      // Update timer stamp
      setLastPackClaimTime(Date.now());
    }, 1500);
  };

  // --- Close Pack Overlay & Equip rolled skin ---
  const handleClosePackAndEquip = (equip: boolean) => {
    if (revealedSkin) {
      if (equip) {
        setEquippedSkinId(revealedSkin.id);
      }
      playTapSound(1.1);
    }
    setIsOpeningPack(false);
    setRevealedSkin(null);
    setPackAnimationState('closed');
  };

  // --- Cheat/Dev Code to claim pack immediately ---
  const forceClaimPackReady = () => {
    setLastPackClaimTime(Date.now() - (PACK_COOLDOWN_SECONDS * 1000));
  };

  // --- Reset Entire Progress ---
  const handleResetProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    setBananas(0);
    setTotalClicked(0);
    setEquippedSkinId(DEFAULT_SKIN_ID);
    setUnlockedSkinIds([DEFAULT_SKIN_ID]);
    setUpgradeCounts({
      cursor: 0, fertilizer: 0, drone: 0, monkey: 0, cyber_peeler: 0, refinery: 0, quantum: 0, giga_harvester: 0
    });
    setLastPackClaimTime(Date.now());
    setFeverGauge(0);
    setFeverActive(false);
    setShowResetConfirm(false);
    playUpgradeSound();
  };

  // Dynamic cost helper
  const getUpgradeCost = (upgrade: typeof UPGRADES_TEMPLATE[0]) => {
    const count = upgradeCounts[upgrade.id] || 0;
    return Math.round(upgrade.baseCost * Math.pow(1.15, count));
  };

  // Icon dynamic selector component mapper
  const DynamicIcon = ({ name, className }: { name: string; className: string }) => {
    switch (name) {
      case 'MousePointer': return <MousePointerClick className={className} />;
      case 'Sprout': return <Sprout className={className} />;
      case 'Navigation': return <Send className={className} />;
      case 'Smile': return <User className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Factory': return <Factory className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      default: return <Zap className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-between overflow-x-hidden relative selection:bg-amber-500/30 selection:text-amber-300">
      
      {/* Falling star particles in Fever Mode */}
      {feverActive && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
          {Array.from({ length: 25 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-1 h-1 bg-amber-400 rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 1}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* --- FLOATING GOLDEN SPAWNS --- */}
      {goldenSpawns.map((spawn) => (
        <div
          key={spawn.id}
          className="absolute z-40 cursor-pointer no-select flex flex-col items-center justify-center filter drop-shadow-[0_0_15px_rgba(251,191,36,0.85)] active:scale-95 transition-transform"
          style={{
            top: `${spawn.y}%`,
            left: `${spawn.x}%`,
            transform: `scale(${spawn.scale})`,
          }}
          onClick={(e) => handleGoldenClick(spawn, e)}
        >
          {/* Glowing Golden Banana Icon */}
          <div className="relative animate-bounce bg-amber-500/10 p-3 rounded-full border border-amber-400">
            <span className="text-4xl filter drop-shadow-md">👑</span>
            <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping opacity-60" />
          </div>
          <span className="text-amber-300 font-display font-black text-xs bg-slate-900/95 border border-amber-500/40 px-2 py-0.5 rounded-md mt-1 shadow-lg tracking-wider animate-pulse">
            TAP ME!
          </span>
        </div>
      ))}

      {/* --- HEADER --- */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between border-b border-slate-900 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="relative p-1.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <span className="text-2xl animate-pulse">🍌</span>
          </div>
          <div>
            <h1 className="font-display font-black text-xl md:text-2xl tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              NANO BANANA <span className="text-xs font-black font-mono bg-rose-500 text-white px-1.5 py-0.5 rounded-full rotate-2 shadow-lg ring-1 ring-white/10">2.0</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-wide">
              THE PRESTIGE AESTHETIC TAPPER
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mute toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 text-slate-400 hover:text-amber-400 transition-all cursor-pointer shadow-inner"
            title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Reset progress */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20 active:scale-95 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
            title="Reset Game Data"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* --- GAME BOARD CONTENT --- */}
      <main className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 flex-grow">
        
        {/* LEFT COLUMN: ACTIVE TAP ZONE (5/12 cols) */}
        <section className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-900/80 rounded-3xl p-6 glow-gold relative select-none">
          
          {/* Decorative Corner Borders */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-800" />

          {/* COUNTER GRID */}
          <div className="text-center w-full mb-6 z-10">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Coins size={16} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">BANANA RESERVES</span>
            </div>
            
            {/* Rolling Counter */}
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-amber-300 drop-shadow-md select-all font-mono">
              {Math.floor(bananas).toLocaleString()}
            </h2>

            {/* Sub-counters */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
              <div className="bg-slate-950/75 border border-slate-900/60 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  +{statBps.toFixed(1)} <span className="text-[9px] text-slate-500">BPS</span>
                </span>
              </div>
              <div className="bg-slate-950/75 border border-slate-900/60 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  💪 {Math.round(statClickPower)} <span className="text-[9px] text-slate-500">Tap Power</span>
                </span>
              </div>
            </div>
          </div>

          {/* CENTRAL ACTIVE BANANA BUTTON */}
          <div className="relative my-4 flex items-center justify-center">
            
            {/* Click Trigger */}
            <button
              onClick={handleBananaClick}
              className="relative outline-none active:scale-95 transition-transform duration-75 select-none no-select cursor-pointer block focus:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Dynamic Banana Drawing */}
              <BananaSvg
                colorFrom={currentSkin.colorFrom}
                colorTo={currentSkin.colorTo}
                glowColor={currentSkin.glowColor}
                skinId={currentSkin.id}
                isFever={feverActive}
              />

              {/* Rarity Label Floating */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                <span className={`text-[10px] font-black font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border shadow-md ${currentSkin.badgeColor}`}>
                  {currentSkin.emoji} {currentSkin.name}
                </span>
              </div>
            </button>

            {/* Flying Tap Numbers Container */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {flyingNumbers.map((num) => (
                <span
                  key={num.id}
                  className={`absolute float-number font-display font-extrabold text-xl whitespace-nowrap drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter ${
                    num.isCrit
                      ? 'text-gradient bg-gradient-to-r from-yellow-300 via-orange-400 to-amber-500 bg-clip-text text-transparent font-black scale-125 select-none glow-gold-lg'
                      : 'text-amber-300'
                  }`}
                  style={{
                    left: `${num.x}px`,
                    top: `${num.y}px`,
                  }}
                >
                  {num.value}
                </span>
              ))}
            </div>
          </div>

          {/* FEVER PROGRESS BAR GAUGE */}
          <div className="w-full mt-6 bg-slate-950/80 border border-slate-900 rounded-2xl p-4 shadow-inner relative z-10 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-orange-400">
                <Flame size={15} className={feverActive ? 'animate-bounce text-orange-400' : 'text-slate-500'} />
                <span className="text-xs font-semibold font-mono tracking-wide uppercase">
                  {feverActive ? 'FEVER MODE ACTIVE' : 'FEVER METER'}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {feverActive ? `${feverTimeLeft}s LEFT (5x Boost!)` : `${Math.round(feverGauge)}%`}
              </span>
            </div>

            {/* Bar Track */}
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  feverActive
                    ? 'bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 glow-gold animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                }`}
                style={{ width: `${feverActive ? (feverTimeLeft / 12) * 100 : feverGauge}%` }}
              />

              {/* Decorative stripes inside fever bar */}
              {feverActive && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:15px_15px] animate-[pulse_1s_infinite]" />
              )}
            </div>

            <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
              {feverActive 
                ? '🚀 CRUSH THE PEEL! EVERYTHING IS MULTIPLIED BY 5X!' 
                : '⚡ Tap rapidly to trigger wild 5X fever booster mode!'}
            </p>
          </div>

          {/* Quick stats panel */}
          <div className="w-full mt-4 grid grid-cols-2 gap-3 z-10">
            <div className="bg-slate-950/45 border border-slate-900/60 p-2.5 rounded-xl text-center">
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">TOTAL CLICKS</span>
              <span className="font-mono text-sm font-bold text-slate-300">{totalClicked.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950/45 border border-slate-900/60 p-2.5 rounded-xl text-center">
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">PEEL UNLOCKED</span>
              <span className="font-mono text-sm font-bold text-slate-300">{unlockedSkinIds.length}/10</span>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: TABS PANEL (7/12 cols) */}
        <section className="lg:col-span-7 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl relative min-h-[580px] flex flex-col justify-between">
          <div>
            
            {/* TABS BUTTON HEADER */}
            <div className="flex bg-slate-950 border border-slate-900 rounded-2xl p-1 mb-5 relative">
              <button
                onClick={() => { setActiveTab('upgrades'); playTapSound(1.05); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'upgrades'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={14} />
                Upgrades
              </button>
              
              <button
                onClick={() => { setActiveTab('skins'); playTapSound(1.05); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'skins'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={14} />
                Skins
                <span className="bg-slate-900 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-[8px] font-mono">
                  {unlockedSkinIds.length}
                </span>
              </button>
              
              <button
                onClick={() => { setActiveTab('pack'); playTapSound(1.05); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer relative ${
                  activeTab === 'pack'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gift size={14} />
                Pack
                {packTimeLeft === 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </button>

              <button
                onClick={() => { setActiveTab('arcade'); playTapSound(1.05); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer relative ${
                  activeTab === 'arcade'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gamepad2 size={14} />
                Arcade
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </button>
            </div>

            {/* TAB PANES CONTENT */}
            <div className="max-h-[460px] overflow-y-auto pr-1">

              {/* --- 1. UPGRADES TAB --- */}
              {activeTab === 'upgrades' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1 mb-1">
                    <TrendingUp size={14} className="text-amber-400" />
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">STORE UPGRADES & FARMS</span>
                  </div>

                  {UPGRADES_TEMPLATE.map((upgrade) => {
                    const count = upgradeCounts[upgrade.id] || 0;
                    const cost = getUpgradeCost(upgrade);
                    const canAfford = bananas >= cost;

                    return (
                      <div
                        key={upgrade.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                          canAfford
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 shadow-md'
                            : 'bg-slate-950/40 border-slate-950/80 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          {/* Upgrade Icon wrapper */}
                          <div className={`p-2.5 rounded-xl border ${
                            canAfford 
                              ? 'bg-slate-950 border-slate-800 text-amber-400' 
                              : 'bg-slate-950/80 border-slate-900 text-slate-500'
                          }`}>
                            <DynamicIcon name={upgrade.iconName} className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-xs md:text-sm text-slate-200">
                                {upgrade.name}
                              </h4>
                              {count > 0 && (
                                <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-md">
                                  Lvl {count}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium max-w-[200px] md:max-w-xs mt-0.5">
                              {upgrade.description}
                            </p>
                            <p className="text-[10px] text-amber-400/80 font-mono mt-1">
                              {upgrade.bpsToAdd > 0 && `+${upgrade.bpsToAdd} BPS each`}
                              {upgrade.clickPowerToAdd > 0 && `+${upgrade.clickPowerToAdd} Click power each`}
                            </p>
                          </div>
                        </div>

                        {/* Cost & Buy Button */}
                        <div className="text-right z-10 flex flex-col items-end justify-center min-w-[100px]">
                          <div className="flex items-center gap-1 mb-1.5 font-mono">
                            <span className="text-[9px] font-bold text-slate-500">COST:</span>
                            <span className={`text-xs font-bold ${canAfford ? 'text-amber-300' : 'text-slate-500'}`}>
                              {cost.toLocaleString()}
                            </span>
                          </div>

                          <button
                            disabled={!canAfford}
                            onClick={() => handleBuyUpgrade(upgrade.id)}
                            className={`px-3 py-1.5 rounded-xl font-display text-xs font-black tracking-wide transition-all cursor-pointer w-20 text-center select-none ${
                              canAfford
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 shadow-md'
                                : 'bg-slate-950/80 text-slate-600 border border-slate-900 cursor-not-allowed'
                            }`}
                          >
                            BUY
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- 2. SKINS TAB --- */}
              {activeTab === 'skins' && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">COLLECTIBLE PEELS INVENTORY</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-500">
                      Rarity multipliers stack
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {ALL_SKINS.map((skin) => {
                      const isUnlocked = unlockedSkinIds.includes(skin.id);
                      const isEquipped = equippedSkinId === skin.id;

                      return (
                        <div
                          key={skin.id}
                          onClick={() => isUnlocked && handleEquipSkin(skin.id)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden select-none ${
                            isUnlocked
                              ? isEquipped
                                ? 'bg-slate-900/80 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                                : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 cursor-pointer hover:bg-slate-900/60'
                              : 'bg-slate-950/30 border-slate-950 opacity-45'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Colorful thumbnail with gradient stops */}
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center relative shadow-inner overflow-hidden border border-slate-800/60"
                              style={{
                                background: isUnlocked 
                                  ? `linear-gradient(135deg, ${skin.colorFrom} 0%, ${skin.colorTo} 100%)` 
                                  : '#1e293b'
                              }}
                            >
                              <span className="text-xl relative z-10 filter drop-shadow-md">
                                {isUnlocked ? skin.emoji : '❓'}
                              </span>
                              {isUnlocked && (
                                <div 
                                  className="absolute inset-0 opacity-40 blur-sm pointer-events-none"
                                  style={{ background: skin.glowColor }}
                                />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-display font-bold text-xs text-slate-200">
                                  {skin.name}
                                </h4>
                                <span className={`text-[8px] font-bold font-mono px-1.5 py-0.2 rounded-md border ${
                                  skin.rarity === 'Common' ? 'bg-slate-950 text-slate-400 border-slate-800' :
                                  skin.rarity === 'Rare' ? 'bg-blue-950/60 text-blue-300 border-blue-800' :
                                  skin.rarity === 'Epic' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                                  skin.rarity === 'Legendary' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                                  'bg-red-950 text-red-300 border-red-800 ring-1 ring-red-500/20'
                                }`}>
                                  {skin.rarity}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 max-w-[170px] mt-0.5 leading-tight font-medium">
                                {isUnlocked ? skin.description : 'Locked peel. Unlock by claiming Nano Packs!'}
                              </p>
                              
                              {/* Perks summary */}
                              {isUnlocked && (
                                <div className="flex gap-2 mt-1">
                                  {skin.bpsMultiplier > 1 && (
                                    <span className="text-[9px] font-mono font-bold text-green-400/90">
                                      +{Math.round((skin.bpsMultiplier - 1) * 100)}% BPS
                                    </span>
                                  )}
                                  {skin.clickMultiplier > 1 && (
                                    <span className="text-[9px] font-mono font-bold text-sky-400/90">
                                      +{Math.round((skin.clickMultiplier - 1) * 100)}% Clicks
                                    </span>
                                  )}
                                  {skin.bpsMultiplier === 1 && skin.clickMultiplier === 1 && (
                                    <span className="text-[9px] font-mono text-slate-500">Standard stats</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action indicator on far right */}
                          <div>
                            {isUnlocked ? (
                              isEquipped ? (
                                <span className="text-[10px] font-black font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-lg shadow-inner uppercase tracking-wider">
                                  Equipped
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold font-mono text-slate-500 group-hover:text-amber-400 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 border border-slate-800 bg-slate-950 px-2 py-0.5 rounded-lg transition-colors uppercase tracking-wider">
                                  Equip
                                </span>
                              )
                            ) : (
                              <Lock size={12} className="text-slate-600 mr-1" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- 3. NANO PACKS TAB --- */}
              {activeTab === 'pack' && (
                <div className="flex flex-col items-center justify-center py-6 text-center select-none">
                  
                  <div className="relative mb-6">
                    {/* Glowing background halo */}
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl animate-pulse scale-125" />
                    
                    {/* Box Icon Container */}
                    <div className={`w-32 h-32 rounded-3xl border border-slate-800 flex items-center justify-center relative ${
                      packTimeLeft === 0 
                        ? 'bg-slate-900/80 border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.15)] animate-bounce' 
                        : 'bg-slate-950/60'
                    }`} style={{ animationDuration: '3s' }}>
                      <span className="text-6xl filter drop-shadow-md">🎁</span>
                      <div className="absolute -top-2 -right-2 bg-rose-500 text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded-full rotate-6 border border-white/20 uppercase shadow-md">
                        FREE
                      </div>
                    </div>
                  </div>

                  <h3 className="font-display font-extrabold text-lg text-slate-200">
                    Nano Gacha Chest
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 font-medium">
                    Claim and open free Nano chests containing random peel skins. Multipliers scale and help you reach legendary scores!
                  </p>

                  {packTimeLeft === 0 ? (
                    <button
                      onClick={handleOpenPack}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-display font-black tracking-widest text-sm py-3 px-8 rounded-2xl shadow-xl transition-all cursor-pointer uppercase animate-pulse select-none"
                    >
                      🎁 OPEN FREE PACK NOW!
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {/* Timer Bar */}
                      <div className="w-56 bg-slate-950 border border-slate-900 rounded-full h-2 mb-3 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full transition-all duration-1000"
                          style={{ width: `${((PACK_COOLDOWN_SECONDS - packTimeLeft) / PACK_COOLDOWN_SECONDS) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        Next pack ready in <span className="text-amber-400">{packTimeLeft}s</span>
                      </span>

                      {/* Secret button to cheat timer for ease in testing / checking out skins */}
                      <button 
                        onClick={forceClaimPackReady}
                        className="text-[9px] text-slate-600 mt-6 hover:text-slate-400 font-mono tracking-wider underline opacity-50 uppercase"
                      >
                        [ Skip Pack Timer ]
                      </button>
                    </div>
                  )}

                  {/* Loot weights guide */}
                  <div className="mt-8 bg-slate-950/70 border border-slate-900 rounded-xl p-3.5 w-full max-w-md">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drop Probability Rates</span>
                    <div className="grid grid-cols-5 gap-1.5 text-[9px] font-mono font-bold">
                      <div className="bg-slate-900 border border-slate-800/80 rounded px-1 py-1 flex flex-col">
                        <span className="text-slate-400">Common</span>
                        <span className="text-slate-500 mt-0.5">45%</span>
                      </div>
                      <div className="bg-green-950/40 border border-green-900/60 rounded px-1 py-1 flex flex-col">
                        <span className="text-green-400">Rare</span>
                        <span className="text-slate-500 mt-0.5">30%</span>
                      </div>
                      <div className="bg-indigo-950/40 border border-indigo-900/60 rounded px-1 py-1 flex flex-col">
                        <span className="text-indigo-400">Epic</span>
                        <span className="text-slate-500 mt-0.5">15%</span>
                      </div>
                      <div className="bg-amber-950/40 border border-amber-900/60 rounded px-1 py-1 flex flex-col">
                        <span className="text-amber-400">Legend</span>
                        <span className="text-slate-500 mt-0.5">8%</span>
                      </div>
                      <div className="bg-red-950/40 border border-red-900/60 rounded px-1 py-1 flex flex-col animate-pulse">
                        <span className="text-rose-400">Mythic</span>
                        <span className="text-slate-500 mt-0.5">2%</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* --- 4. ARCADE TAB --- */}
              {activeTab === 'arcade' && (
                <BananaArcade
                  bananas={bananas}
                  setBananas={setBananas}
                  statClickPower={statClickPower}
                  isMuted={isMuted}
                />
              )}

            </div>
          </div>

          {/* QUICK FOOTER / PROMPT HELP */}
          <div className="border-t border-slate-950/60 pt-4 flex items-center justify-between text-[11px] text-slate-600 font-semibold select-none">
            <div className="flex items-center gap-1.5">
              <HelpCircle size={13} className="text-slate-600" />
              <span>Autoclicker bots operate offline & on active tabs.</span>
            </div>
            <span>V2.0 STABLE</span>
          </div>
        </section>

      </main>

      {/* --- RESET CONFIRM OVERLAY --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <h3 className="font-display font-extrabold text-lg text-slate-200 mb-2">
              ⚠️ RESET PROGRESS?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">
              This will permanently delete all your bananas, bought auto-tappers, click upgrades, and rare unlocked skins. Are you absolutely sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetConfirm(false); playTapSound(1.0); }}
                className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-display font-bold text-xs py-3 rounded-2xl cursor-pointer transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={handleResetProgress}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-xs py-3 rounded-2xl cursor-pointer shadow-lg transition-colors"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PACK GACHA OPENING OVERLAY MODAL --- */}
      {isOpeningPack && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none no-select">
          
          {/* BACKGROUND DECORATIVE GLOWS */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {packAnimationState === 'revealed' && revealedSkin && (
              <div 
                className="w-[450px] h-[450px] rounded-full blur-[120px] opacity-70 transition-all duration-1000 animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${revealedSkin.glowColor} 0%, transparent 75%)`
                }}
              />
            )}
          </div>

          {/* 1. Closed/Shaking animation phase */}
          {packAnimationState === 'shaking' && (
            <div className="text-center animate-bounce duration-300">
              <div className="text-[120px] mb-6 filter drop-shadow-[0_0_35px_rgba(251,191,36,0.35)] select-none">
                🎁
              </div>
              <h2 className="font-display font-black text-2xl tracking-widest text-amber-300 uppercase animate-pulse">
                UNWRAPPING NANO CHEST...
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1 font-bold">
                Synthesizing rare genetic code peel...
              </p>
            </div>
          )}

          {/* 2. Revealed skin card phase */}
          {packAnimationState === 'revealed' && revealedSkin && (
            <div className="text-center max-w-md w-full flex flex-col items-center justify-center relative">
              
              {/* Star Rays in Background */}
              <div className="absolute -z-10 w-96 h-96 border border-white/5 rounded-full animate-spin" style={{ animationDuration: '40s' }} />

              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase font-mono mb-2">
                GACHA REVEAL COMPLETED
              </span>
              
              <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight mb-6">
                NEW PEEL UNLOCKED!
              </h2>

              {/* Majestic Display Card */}
              <div className="bg-slate-900 border-2 rounded-3xl p-6 w-full mb-8 relative glow-gold flex flex-col items-center justify-center transition-all duration-500 shadow-2xl"
                   style={{ borderColor: revealedSkin.colorTo }}>
                
                {/* Rarity Aura */}
                <div 
                  className="absolute inset-0 pointer-events-none rounded-3xl opacity-10"
                  style={{ background: `linear-gradient(135deg, ${revealedSkin.colorFrom}, ${revealedSkin.colorTo})` }}
                />

                {/* Card Sparkles */}
                <span className="text-7xl mb-4 relative filter drop-shadow-md z-10 animate-pulse">
                  {revealedSkin.emoji}
                </span>

                {/* Rarity tag badge */}
                <span className={`text-[10px] font-black font-mono tracking-widest uppercase px-3 py-1 rounded-full border mb-3 shadow-md ${revealedSkin.badgeColor}`}>
                  {revealedSkin.rarity}
                </span>

                <h3 className="font-display font-black text-2xl text-slate-100 mb-1.5 tracking-tight">
                  {revealedSkin.name}
                </h3>

                <p className="text-xs text-slate-400 px-4 max-w-xs mb-5 leading-relaxed font-medium">
                  "{revealedSkin.description}"
                </p>

                {/* Stats list */}
                <div className="w-full bg-slate-950/80 border border-slate-950 p-3.5 rounded-2xl flex items-center justify-around font-mono text-xs">
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">BPS Boost</span>
                    <span className={`font-bold ${revealedSkin.bpsMultiplier > 1 ? 'text-green-400' : 'text-slate-400'}`}>
                      {revealedSkin.bpsMultiplier === 1 ? 'None' : `+${Math.round((revealedSkin.bpsMultiplier - 1) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Click Boost</span>
                    <span className={`font-bold ${revealedSkin.clickMultiplier > 1 ? 'text-sky-400' : 'text-slate-400'}`}>
                      {revealedSkin.clickMultiplier === 1 ? 'None' : `+${Math.round((revealedSkin.clickMultiplier - 1) * 100)}%`}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full px-4">
                <button
                  onClick={() => handleClosePackAndEquip(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 font-display font-bold py-3.5 px-6 rounded-2xl cursor-pointer transition-colors"
                >
                  Send to Inventory
                </button>
                <button
                  onClick={() => handleClosePackAndEquip(true)}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-display font-black py-3.5 px-6 rounded-2xl shadow-xl hover:shadow-amber-500/10 cursor-pointer transition-all uppercase tracking-wider"
                >
                  Equip Now!
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="w-full py-4 text-center border-t border-slate-950 bg-slate-950 text-slate-700 text-[10px] md:text-xs z-10 font-mono tracking-wider">
        NANO BANANA 2 &copy; 2026. FOR THE TRU MEME AFICIONADO. PREVIEW MODE.
      </footer>

    </div>
  );
}
