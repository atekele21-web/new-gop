/**
 * Pop Balloon - Fast Reflex Arcade Game
 * 
 * Rules:
 * - Pure White Background (#FFFFFF)
 * - 7 distinct vibrant colors from second 1
 * - Fast start with 3-5 active balloons immediately at GO
 * - Difficulty escalates starting at exactly 00:10
 * - TAP BALLOON -> POP + SCORE + COMBO
 * - TAP EMPTY SPACE / WHITE BACKGROUND -> IMMEDIATE GAME OVER
 * - MISSED BALLOON REACHES BOTTOM -> IMMEDIATE GAME OVER
 * - 2-minute countdown (02:00 -> 00:00) with pause freeze support
 * - Scoring capped internally at 400 (never displayed to user)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameDefinition } from '../../types';
import { RotateCcw, Home, Play, Zap, Volume2, VolumeX, Pause, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { PopBalloonAudio } from './popBalloonAudio';

interface PopBalloonGameProps {
  game: GameDefinition;
  onGameOver: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

interface Balloon {
  id: number;
  x: number;            // center X
  y: number;            // center Y
  radius: number;       // radius px
  speed: number;        // px/s
  color: string;        // hex color
  spawnTime: number;    // performance.now() timestamp
  isPopping: boolean;
  popProgress: number;  // 0 to 1
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  points: number;
  life: number;
  maxLife: number;
}

// 7 exact mandatory vibrant colors
const BALLOON_COLORS = [
  '#FF3B30', // RED
  '#007AFF', // BLUE
  '#34C759', // GREEN
  '#FFD60A', // YELLOW
  '#AF52DE', // PURPLE
  '#FF9500', // ORANGE
  '#FF2D55', // PINK
];

const GAME_DURATION_SECONDS = 120; // Exactly 2 minutes
const STORAGE_BEST_KEY = 'teleplay_pop_balloon_best';

export const PopBalloonGame: React.FC<PopBalloonGameProps> = ({
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Game Flow States
  const [gameState, setGameState] = useState<'intro' | 'countdown' | 'playing' | 'paused' | 'gameover'>('intro');
  const [countdownNum, setCountdownNum] = useState<string>('3');
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [isSoundOn, setIsSoundOn] = useState<boolean>(isAudioEnabled);

  // Live HUD States
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEST_KEY);
      return saved ? Math.min(400, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(GAME_DURATION_SECONDS);
  const [combo, setCombo] = useState<number>(0);

  // Visual Entities
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);

  // Simulation Refs for 60fps loop
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const gameStateRef = useRef<'intro' | 'countdown' | 'playing' | 'paused' | 'gameover'>('intro');
  const gameStartTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const nextBalloonId = useRef<number>(1);
  const nextParticleId = useRef<number>(1);
  const nextPopupId = useRef<number>(1);
  const lastSpawnTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  // Keep Audio Mute State Synced with local sound toggle
  useEffect(() => {
    PopBalloonAudio.setMuted(!isSoundOn);
  }, [isSoundOn]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSoundOn((prev) => {
      const next = !prev;
      PopBalloonAudio.setMuted(!next);
      return next;
    });
  };

  // Sync ref with states
  gameStateRef.current = gameState;
  scoreRef.current = score;
  comboRef.current = combo;

  /**
   * Get current phase parameters based on real elapsed game seconds
   * Balloon sizes increased by approximately 10-15% for enhanced visibility
   */
  const getPhaseConfig = useCallback((elapsedSec: number) => {
    if (elapsedSec < 15) {
      // 00:00 - 00:15 (Fast & Demanding Start)
      return {
        targetActive: 4,
        minSpeed: 360,
        maxSpeed: 420,
        minRadius: 30,
        maxRadius: 35,
        spawnIntervalMs: 350,
        tierMultiplier: 1.0,
      };
    } else if (elapsedSec < 35) {
      // 00:15 - 00:35 (Harder)
      return {
        targetActive: 5,
        minSpeed: 410,
        maxSpeed: 470,
        minRadius: 28,
        maxRadius: 33,
        spawnIntervalMs: 310,
        tierMultiplier: 1.15,
      };
    } else if (elapsedSec < 60) {
      // 00:35 - 01:00 (Hard)
      return {
        targetActive: 5,
        minSpeed: 460,
        maxSpeed: 520,
        minRadius: 26,
        maxRadius: 31,
        spawnIntervalMs: 270,
        tierMultiplier: 1.3,
      };
    } else if (elapsedSec < 90) {
      // 01:00 - 01:30 (Very Hard)
      return {
        targetActive: 6,
        minSpeed: 500,
        maxSpeed: 560,
        minRadius: 24.5,
        maxRadius: 29,
        spawnIntervalMs: 240,
        tierMultiplier: 1.45,
      };
    } else if (elapsedSec < 110) {
      // 01:30 - 01:50 (Extreme)
      return {
        targetActive: 6,
        minSpeed: 540,
        maxSpeed: 600,
        minRadius: 23,
        maxRadius: 27.5,
        spawnIntervalMs: 220,
        tierMultiplier: 1.6,
      };
    } else {
      // 01:50 - 02:00 (Elite)
      return {
        targetActive: 7,
        minSpeed: 580,
        maxSpeed: 640,
        minRadius: 22,
        maxRadius: 26.5,
        spawnIntervalMs: 200,
        tierMultiplier: 1.75,
      };
    }
  }, []);

  /**
   * Spawn a new falling colored balloon
   */
  const spawnSingleBalloon = useCallback((customY?: number) => {
    if (!containerRef.current || gameStateRef.current !== 'playing') return;
    const width = containerRef.current.clientWidth || 360;

    const elapsed = (performance.now() - gameStartTimeRef.current) / 1000;
    const phase = getPhaseConfig(elapsed);

    const radius = phase.minRadius + Math.random() * (phase.maxRadius - phase.minRadius);
    const speed = phase.minSpeed + Math.random() * (phase.maxSpeed - phase.minSpeed);

    // Pick horizontal X coordinate avoiding extreme edge overlap with existing active balloons
    const minX = radius + 14;
    const maxX = Math.max(minX + 30, width - radius - 14);

    let bestX = minX + Math.random() * (maxX - minX);
    // Attempt 3 tries to avoid close horizontal clustering with recent top balloons
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidateX = minX + Math.random() * (maxX - minX);
      const isClustered = balloonsRef.current.some(
        (b) => !b.isPopping && b.y < 130 && Math.abs(b.x - candidateX) < radius * 1.8
      );
      if (!isClustered) {
        bestX = candidateX;
        break;
      }
    }

    // Pick 1 of the 7 vibrant colors
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const startY = customY !== undefined ? customY : -radius - 14;

    const newBalloon: Balloon = {
      id: nextBalloonId.current++,
      x: bestX,
      y: startY,
      radius,
      speed,
      color,
      spawnTime: performance.now(),
      isPopping: false,
      popProgress: 0,
    };

    balloonsRef.current.push(newBalloon);
  }, [getPhaseConfig]);

  /**
   * Spawn burst particles upon popping
   */
  const spawnPopParticles = (x: number, y: number, color: string) => {
    const count = 9;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 95 + Math.random() * 95;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 4,
        opacity: 1,
        life: 0,
        maxLife: 0.22,
      });
    }
  };

  /**
   * Spawn floating score indicator
   */
  const spawnScorePopup = (x: number, y: number, points: number) => {
    scorePopupsRef.current.push({
      id: nextPopupId.current++,
      x,
      y,
      points,
      life: 0,
      maxLife: 0.5,
    });
  };

  /**
   * Trigger Immediate Game Over
   */
  const triggerGameOver = useCallback((reason: string) => {
    if (gameStateRef.current === 'gameover') return;
    gameStateRef.current = 'gameover';
    setGameState('gameover');
    setGameOverReason(reason);

    PopBalloonAudio.playGameOver();

    // Final score strictly capped at 400
    const finalScore = Math.min(400, Math.floor(scoreRef.current));

    // Update Local Best
    try {
      const currentBest = parseInt(localStorage.getItem(STORAGE_BEST_KEY) || '0', 10) || 0;
      if (finalScore > currentBest) {
        const newBest = Math.min(400, finalScore);
        localStorage.setItem(STORAGE_BEST_KEY, newBest.toString());
        setBestScore(newBest);
      }
    } catch {
      // Storage errors ignored
    }

    const durationSeconds = Math.max(1, Math.round((performance.now() - gameStartTimeRef.current) / 1000));
    onGameOver(finalScore, durationSeconds);
  }, [onGameOver]);

  /**
   * Start 3-2-1-GO Countdown Sequence
   */
  const startCountdown = () => {
    PopBalloonAudio.init();
    setGameState('countdown');
    setCountdownNum('3');
    PopBalloonAudio.playCountdownBeep(false);

    setTimeout(() => {
      setCountdownNum('2');
      PopBalloonAudio.playCountdownBeep(false);

      setTimeout(() => {
        setCountdownNum('1');
        PopBalloonAudio.playCountdownBeep(false);

        setTimeout(() => {
          setCountdownNum('GO!');
          PopBalloonAudio.playCountdownBeep(true);

          setTimeout(() => {
            // Start Active Gameplay
            setGameState('playing');
            gameStateRef.current = 'playing';
            gameStartTimeRef.current = performance.now();
            lastFrameTime.current = performance.now();
            lastSpawnTime.current = performance.now();

            // FAST START: Immediately spawn 3 to 5 balloons staggered vertically/horizontally
            balloonsRef.current = [];
            particlesRef.current = [];
            scorePopupsRef.current = [];
            setBalloons([]);
            setParticles([]);
            setScorePopups([]);
            setScore(0);
            setCombo(0);
            setTimeLeftSeconds(GAME_DURATION_SECONDS);

            // Stagger 4 initial balloons at varying heights right at GO
            spawnSingleBalloon(35);
            spawnSingleBalloon(110);
            spawnSingleBalloon(185);
            spawnSingleBalloon(-20);
          }, 350);
        }, 800);
      }, 800);
    }, 800);
  };

  /**
   * Pause the game
   */
  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameStateRef.current !== 'playing') return;
    pauseStartTimeRef.current = performance.now();
    gameStateRef.current = 'paused';
    setGameState('paused');
  };

  /**
   * Resume the game from exact paused state
   * Paused duration is added to gameStartTime and balloon spawnTimes so it does not count towards the 2-minute timer!
   */
  const handleResume = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (gameStateRef.current !== 'paused') return;

    const pauseDuration = performance.now() - pauseStartTimeRef.current;
    gameStartTimeRef.current += pauseDuration;
    lastSpawnTime.current += pauseDuration;
    lastFrameTime.current = performance.now();

    // Adjust spawn time of active balloons so reaction bonus is preserved accurately
    for (const b of balloonsRef.current) {
      b.spawnTime += pauseDuration;
    }

    gameStateRef.current = 'playing';
    setGameState('playing');
  };

  /**
   * Main 60FPS Game Loop
   */
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastFrameTime.current) / 1000, 0.1);
      lastFrameTime.current = currentTime;

      if (gameStateRef.current === 'playing' && containerRef.current) {
        const height = containerRef.current.clientHeight || 600;
        const elapsedSec = (currentTime - gameStartTimeRef.current) / 1000;
        const phase = getPhaseConfig(elapsedSec);

        // 1. Time Countdown
        const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsedSec);
        setTimeLeftSeconds(Math.ceil(remaining));

        // 2-minute time limit check
        if (remaining <= 0) {
          triggerGameOver("Time's up! Exceptional survival!");
          return;
        }

        // 2. Dynamic Spawning - Maintain active balloon count
        const activeUnpoppedCount = balloonsRef.current.filter((b) => !b.isPopping).length;
        if (
          activeUnpoppedCount < phase.targetActive &&
          currentTime - lastSpawnTime.current > phase.spawnIntervalMs
        ) {
          spawnSingleBalloon();
          lastSpawnTime.current = currentTime;
        }

        // 3. Update Balloons Position & Check Misses
        const nextBalloons: Balloon[] = [];
        let missedBalloon = false;

        for (const b of balloonsRef.current) {
          if (b.isPopping) {
            b.popProgress += dt / 0.14; // 140ms pop duration
            if (b.popProgress < 1.0) {
              nextBalloons.push(b);
            }
          } else {
            b.y += b.speed * dt;

            // MISSED BALLOON REACHES BOTTOM -> IMMEDIATE GAME OVER
            if (b.y + b.radius >= height) {
              missedBalloon = true;
            } else {
              nextBalloons.push(b);
            }
          }
        }

        balloonsRef.current = nextBalloons;
        setBalloons([...nextBalloons]);

        if (missedBalloon) {
          PopBalloonAudio.playMiss();
          triggerGameOver('A balloon reached the bottom!');
          return;
        }

        // 4. Update Particles
        const nextParticles: Particle[] = [];
        for (const p of particlesRef.current) {
          p.life += dt;
          if (p.life < p.maxLife) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.opacity = 1 - p.life / p.maxLife;
            nextParticles.push(p);
          }
        }
        particlesRef.current = nextParticles;
        setParticles(nextParticles);

        // 5. Update Score Popups
        const nextPopups: ScorePopup[] = [];
        for (const pop of scorePopupsRef.current) {
          pop.life += dt;
          if (pop.life < pop.maxLife) {
            pop.y -= 45 * dt; // Float up
            nextPopups.push(pop);
          }
        }
        scorePopupsRef.current = nextPopups;
        setScorePopups(nextPopups);
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, getPhaseConfig, spawnSingleBalloon, triggerGameOver]);

  /**
   * Pointer/Touch Input Handling
   * - Hits active colored balloon -> POP + SCORE
   * - Hits empty space / background -> IMMEDIATE GAME OVER
   */
  const handlePlayAreaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameStateRef.current !== 'playing' || !containerRef.current) return;

    // Get exact touch/click coordinates relative to play area
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    // Check collision against active balloons (topmost/lowest in Y order for best touch priority)
    let hitIndex = -1;
    let hitDist = 0;

    // Sort search by lowest balloon first (most urgent)
    const sortedIndices = balloonsRef.current
      .map((b, idx) => ({ b, idx }))
      .filter((item) => !item.b.isPopping)
      .sort((a, b) => b.b.y - a.b.y);

    for (const item of sortedIndices) {
      const b = item.b;
      const dist = Math.hypot(touchX - b.x, touchY - b.y);
      // Precise circular collision with mobile forgiving tolerance of 8px
      if (dist <= b.radius + 8) {
        hitIndex = item.idx;
        hitDist = dist;
        break;
      }
    }

    if (hitIndex !== -1) {
      // SUCCESSFUL HIT ON A COLORED BALLOON
      const popped = balloonsRef.current[hitIndex];
      popped.isPopping = true;
      popped.popProgress = 0;

      // 1. Calculate Skill-Based Score Increment
      const elapsedSec = (performance.now() - gameStartTimeRef.current) / 1000;
      const phase = getPhaseConfig(elapsedSec);

      // Base hit score (1.2 to 2.2 based on tier)
      const basePoints = 1.2 * phase.tierMultiplier;

      // Reaction time bonus (faster tap after screen entry gives up to +0.8)
      const timeOnScreen = (performance.now() - popped.spawnTime) / 1000;
      const reactionBonus = Math.max(0, 0.8 * (1 - Math.min(1, timeOnScreen / 1.4)));

      // Precision bonus (tapping near center gives up to +0.6)
      const precisionRatio = Math.max(0, 1 - hitDist / popped.radius);
      const precisionBonus = precisionRatio * 0.6;

      // Combo multiplier
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);

      const comboMultiplier = nextCombo >= 20 ? 1.25 : nextCombo >= 10 ? 1.15 : nextCombo >= 5 ? 1.08 : 1.0;

      // Total earned points for this pop
      const pointsEarned = (basePoints + reactionBonus + precisionBonus) * comboMultiplier;

      // Internal Hard Cap strictly enforced at 400
      const newScore = Math.min(400, scoreRef.current + pointsEarned);
      scoreRef.current = newScore;
      setScore(newScore);

      // 2. Visual & Audio Feedback
      PopBalloonAudio.playPop(nextCombo);
      spawnPopParticles(popped.x, popped.y, popped.color);
      spawnScorePopup(popped.x, popped.y, Math.round(pointsEarned * 10) / 10);

      setBalloons([...balloonsRef.current]);
    } else {
      // WRONG TAP ON EMPTY SPACE / WHITE BACKGROUND -> IMMEDIATE GAME OVER
      PopBalloonAudio.playWrongTap();
      triggerGameOver('You tapped empty space!');
    }
  };

  /**
   * Reset and restart match
   */
  const handleRestart = () => {
    startCountdown();
  };

  // Format time (e.g. "01:42")
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine timer visual urgency
  const getTimerUrgencyClass = (secs: number) => {
    if (secs <= 10) {
      return 'bg-red-50 text-red-600 border-red-200 shadow-sm animate-pulse';
    } else if (secs <= 30) {
      return 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs';
    }
    return 'bg-slate-50 text-slate-800 border-slate-200/80';
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto h-[600px] sm:h-[650px] bg-[#FFFFFF] rounded-3xl overflow-hidden flex flex-col select-none touch-none shadow-2xl border border-slate-200 font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* 1. STANDARDIZED TOP HUD: [EXIT] [SCORE] [TIME] [SOUND] [PAUSE] */}
      <div 
        id="pop-balloon-hud"
        className="w-full bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 border-b border-slate-200/80 flex items-center justify-between gap-2 z-20 shrink-0 shadow-xs"
      >
        {/* BUTTON 0: EXIT */}
        <button
          id="pop-balloon-exit-btn"
          onClick={onExit}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-11 px-3 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 active:scale-95 border border-slate-200 flex items-center gap-1 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
          style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.06)' }}
          title="Exit Game"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">EXIT</span>
        </button>

        {/* BUTTON 1: SCORE (Balloon Theme) */}
        <div 
          id="pop-balloon-score-card"
          className="flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl bg-gradient-to-b from-[#FFF0F5] to-[#FFE4E6] border border-[#FF3B30]/30 flex items-center gap-2 shadow-xs transition-transform"
          style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 3px rgba(255, 59, 48, 0.12)' }}
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF3B30] via-[#FF9500] to-[#FFD60A] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Trophy className="w-3.5 h-3.5 fill-white text-white" />
          </div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-[8px] sm:text-[9px] font-black text-[#FF3B30] uppercase tracking-wider">
              SCORE
            </span>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight tabular-nums truncate">
                {Math.floor(score)}
              </span>
              {combo >= 5 && (
                <span className="text-[8px] font-black bg-[#FF3B30] text-white px-1 py-0.2 rounded-full animate-pulse shrink-0">
                  {combo}x
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BUTTON 2: TIME (Countdown 02:00 -> 00:00) */}
        <div 
          id="pop-balloon-time-card"
          className={`flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl border flex items-center gap-2 shadow-xs transition-colors ${
            timeLeftSeconds <= 10
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse shadow-rose-100'
              : timeLeftSeconds <= 30
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-gradient-to-b from-[#F0F8FF] to-[#E6F0FA] border-[#007AFF]/30 text-slate-900'
          }`}
          style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 3px rgba(0, 122, 255, 0.12)' }}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            timeLeftSeconds <= 10
              ? 'bg-rose-500 text-white'
              : timeLeftSeconds <= 30
              ? 'bg-amber-500 text-white'
              : 'bg-gradient-to-tr from-[#007AFF] to-[#34C759] text-white'
          }`}>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
              timeLeftSeconds <= 10 ? 'text-rose-500' : timeLeftSeconds <= 30 ? 'text-amber-700' : 'text-[#007AFF]'
            }`}>
              TIME
            </span>
            <span className="text-sm sm:text-base font-black font-mono tracking-tight tabular-nums">
              {formatTime(timeLeftSeconds)}
            </span>
          </div>
        </div>

        {/* BUTTON 3: SOUND (Mute / Unmute Toggle) */}
        <button
          id="pop-balloon-sound-btn"
          onClick={toggleSound}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 active:scale-95 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs shrink-0"
          style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.06)' }}
          aria-label={isSoundOn ? 'Mute Sound' : 'Unmute Sound'}
          title={isSoundOn ? 'Mute Sound' : 'Unmute Sound'}
        >
          {isSoundOn ? (
            <Volume2 className="w-4.5 h-4.5 text-[#34C759]" />
          ) : (
            <VolumeX className="w-4.5 h-4.5 text-slate-400" />
          )}
        </button>

        {/* BUTTON 4: PAUSE (Pause Game) */}
        <button
          id="pop-balloon-pause-btn"
          onClick={handlePause}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={gameState !== 'playing'}
          className={`w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 active:scale-95 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs shrink-0 ${
            gameState !== 'playing' ? 'opacity-40 pointer-events-none' : ''
          }`}
          style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.06)' }}
          aria-label="Pause Game"
          title="Pause Game"
        >
          <Pause className="w-4.5 h-4.5 fill-slate-700/20 text-slate-700" />
        </button>
      </div>

      {/* 2. MAIN PLAY AREA - PURE WHITE (#FFFFFF), No center circle */}
      <div
        ref={containerRef}
        onPointerDown={handlePlayAreaPointerDown}
        className="relative flex-1 w-full bg-[#FFFFFF] overflow-hidden cursor-crosshair"
      >
        {/* Falling Colored Circular Balloons */}
        {balloons.map((balloon) => {
          const isPopping = balloon.isPopping;
          const scale = isPopping ? 1.0 + balloon.popProgress * 0.25 : 1.0;
          const opacity = isPopping ? Math.max(0, 1.0 - balloon.popProgress) : 1.0;

          return (
            <div
              key={balloon.id}
              className="absolute rounded-full pointer-events-none transition-transform"
              style={{
                left: `${balloon.x - balloon.radius}px`,
                top: `${balloon.y - balloon.radius}px`,
                width: `${balloon.radius * 2}px`,
                height: `${balloon.radius * 2}px`,
                backgroundColor: balloon.color,
                transform: `scale(${scale})`,
                opacity: opacity,
                // Polished dimensional styling: specular light highlight + soft bottom shadow
                boxShadow: isPopping
                  ? 'none'
                  : '0 4px 10px rgba(0, 0, 0, 0.12), inset 0 -3px 6px rgba(0, 0, 0, 0.18), inset 0 3px 6px rgba(255, 255, 255, 0.45)',
              }}
            >
              {/* Subtle top-left light reflection highlight */}
              {!isPopping && (
                <div
                  className="absolute rounded-full bg-white/40 pointer-events-none"
                  style={{
                    top: `${balloon.radius * 0.2}px`,
                    left: `${balloon.radius * 0.25}px`,
                    width: `${balloon.radius * 0.4}px`,
                    height: `${balloon.radius * 0.3}px`,
                    transform: 'rotate(-30deg)',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Pop Burst Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x - p.size / 2}px`,
              top: `${p.y - p.size / 2}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
            }}
          />
        ))}

        {/* Floating Score Popups */}
        {scorePopups.map((popup) => (
          <div
            key={popup.id}
            className="absolute pointer-events-none font-black font-mono text-sm text-slate-800"
            style={{
              left: `${popup.x - 12}px`,
              top: `${popup.y - 12}px`,
              opacity: Math.max(0, 1 - popup.life / popup.maxLife),
              transform: `scale(${1 + popup.life * 0.4})`,
            }}
          >
            +{Math.floor(popup.points) || 1}
          </div>
        ))}

        {/* 3. START SCREEN */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 bg-[#FFFFFF] flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
              <span className="text-4xl">🎈</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              POP BALLOON
            </h1>
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase mb-8">
              TAP THE FALLING BALLOONS
            </p>

            <button
              onClick={startCountdown}
              className="w-full max-w-xs py-4 px-6 rounded-2xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>START</span>
            </button>

            <div className="mt-6 flex flex-col gap-1 text-[11px] text-slate-400">
              <span>⚠️ Tapping empty white space = Game Over</span>
              <span>⚠️ Missed balloon reaching bottom = Game Over</span>
            </div>
          </div>
        )}

        {/* 4. 3-2-1-GO COUNTDOWN OVERLAY */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-[#FFFFFF]/90 backdrop-blur-xs flex flex-col items-center justify-center z-40 pointer-events-none">
            <span className="text-7xl font-black text-slate-900 font-mono animate-in zoom-in-50 duration-200">
              {countdownNum}
            </span>
          </div>
        )}

        {/* 5. PAUSE OVERLAY */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in duration-150">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-3">
                <Pause className="w-7 h-7 fill-[#007AFF]" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1">PAUSED</h2>
              <p className="text-xs font-semibold text-slate-400 mb-5">Game is frozen</p>

              <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 flex flex-col gap-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">CURRENT SCORE</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {Math.floor(score)}
                  </span>
                </div>
                <div className="h-px bg-slate-200/70" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">TIME REMAINING</span>
                  <span className="text-base font-bold text-slate-700 font-mono">
                    {formatTime(timeLeftSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={(e) => handleResume(e)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>RESUME</span>
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>EXIT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. GAME OVER SCREEN */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 z-40">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
                <Zap className="w-7 h-7 fill-red-500" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1">GAME OVER</h2>
              <p className="text-xs font-semibold text-red-500 mb-4">{gameOverReason}</p>

              <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 flex flex-col gap-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">SCORE</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {Math.floor(score)}
                  </span>
                </div>
                <div className="h-px bg-slate-200/70" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">BEST</span>
                  <span className="text-base font-bold text-slate-700 font-mono">
                    {bestScore}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={handleRestart}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>HOME</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

