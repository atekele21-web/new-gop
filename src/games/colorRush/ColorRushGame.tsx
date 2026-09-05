/**
 * Color Rush - Production Reaction Game
 * 
 * Commercial-Grade Mobile Reaction Matcher:
 * - 10 Progressive Rounds (Automatic difficulty ramp, no difficulty select)
 * - Large Central Target Color with dimensional glass finish & chromatic glow
 * - Multiple Large Touch Targets (4-choice 2x2 grid in R1-4, 6-choice 3x2 grid in R5-10)
 * - Instant Responsive Touch Interaction (<16ms feedback)
 * - Normalized 400-Point Scoring Model:
 *     Base = 20 pts, Time Bonus = up to 15 pts, Combo Bonus = up to 5 pts (Max 40/round)
 * - Strict Score Clamp to 400 POINTS
 * - Instant Audio-Visual Feedback: Brief Green/Red confirmations, combo streaks, rapid automatic advancement
 * - Clean Minimalist HUD: Score (X/400 PTS), Combo, Round 1/10, Precision Timer Bar
 * - Final Screen: Score, Accuracy, Best Score, Tournament Points, PLAY AGAIN, EXIT
 * - Zero Ads, Zero Energy, Zero VIP, Zero Filler
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ColorItem, FloatingPoint } from './types';
import { generateProgressiveChallenge } from './colorGenerator';
import { SoundFX } from '../../engine/soundEffects';
import { GameDefinition } from '../../types';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Flame, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  X,
  Target,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface ColorRushGameProps {
  game: GameDefinition;
  onGameOver: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

const TOTAL_ROUNDS = 10;
const MAX_GAME_SCORE = 400;
const TOTAL_SESSION_SECONDS = 120; // 2 Minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const ColorRushGame: React.FC<ColorRushGameProps> = ({
  game,
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  // Game States
  const [status, setStatus] = useState<'playing' | 'paused' | 'game_over'>('playing');
  const [muted, setMuted] = useState(!isAudioEnabled);

  // Metrics
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(TOTAL_SESSION_SECONDS);

  // Active Challenge State
  const [targetColor, setTargetColor] = useState<ColorItem | null>(null);
  const [options, setOptions] = useState<ColorItem[]>([]);
  const [roundTimeLimit, setRoundTimeLimit] = useState(3500);
  const [timeRemaining, setTimeRemaining] = useState(3500);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);

  // Persistent Best Score (normalized, max 400)
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('teleplay_color_rush_best_normalized');
      return saved ? Math.min(MAX_GAME_SCORE, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });

  const sessionStartTimeRef = useRef<number>(Date.now());
  const timerRafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const isTransitioningRef = useRef<boolean>(false);
  const roundRef = useRef(round);
  roundRef.current = round;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const correctCountRef = useRef(correctCount);
  correctCountRef.current = correctCount;

  // Normalized Display Score clamped to 400
  const normalizedScore = Math.min(MAX_GAME_SCORE, Math.max(0, score));
  const progressPercent = Math.min(100, (normalizedScore / MAX_GAME_SCORE) * 100);
  const accuracy = round > 1 ? Math.round((correctCount / (round - (feedbackState ? 0 : 1))) * 100) : 100;

  // Sound sync
  useEffect(() => {
    SoundFX.setMuted(muted);
  }, [muted]);

  /**
   * Spawns floating score indicator
   */
  const spawnFloatingPoint = (pts: number, comboText?: string) => {
    const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setFloatingPoints((prev) => [...prev, { id, points: pts, comboText, isBonus: pts >= 35 }]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((p) => p.id !== id));
    }, 750);
  };

  /**
   * Loads a specific round challenge
   */
  const loadNewRound = useCallback((targetRound: number) => {
    const { target, options: newOptions, timeLimitMs } = generateProgressiveChallenge(targetRound);
    setTargetColor(target);
    setOptions(newOptions);
    setRoundTimeLimit(timeLimitMs);
    setTimeRemaining(timeLimitMs);
    setSelectedOptionId(null);
    setFeedbackState(null);
    isTransitioningRef.current = false;
    lastTickRef.current = performance.now();
  }, []);

  // Initialize first round
  useEffect(() => {
    loadNewRound(1);
    sessionStartTimeRef.current = Date.now();
  }, [loadNewRound]);

  /**
   * Concludes the 10-round match and records high scores
   */
  const handleEndGame = useCallback((finalScore: number) => {
    setStatus('game_over');
    SoundFX.playGameOver();

    const clampedFinal = Math.min(MAX_GAME_SCORE, Math.max(0, finalScore));

    setBestScore((prev) => {
      if (clampedFinal > prev) {
        try {
          localStorage.setItem('teleplay_color_rush_best_normalized', clampedFinal.toString());
        } catch {}
        return clampedFinal;
      }
      return prev;
    });

    const elapsed = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    onGameOver(clampedFinal, elapsed);
  }, [onGameOver]);

  // 2-Minute Game Session Timer
  useEffect(() => {
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      setSessionSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndGame(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, handleEndGame]);

  /**
   * Handles timeout when countdown expires on a round
   */
  const handleTimeout = useCallback(() => {
    if (isTransitioningRef.current || status !== 'playing') return;
    isTransitioningRef.current = true;

    // Timeout: Treat as wrong, reset combo, continue automatically
    SoundFX.playInvalid();
    setFeedbackState('wrong');
    setCombo(0);

    const currentRnd = roundRef.current;
    if (currentRnd >= TOTAL_ROUNDS) {
      setTimeout(() => handleEndGame(scoreRef.current), 300);
    } else {
      setTimeout(() => {
        const nextRnd = currentRnd + 1;
        setRound(nextRnd);
        loadNewRound(nextRnd);
      }, 190);
    }
  }, [status, handleEndGame, loadNewRound]);

  /**
   * High-Precision Countdown Loop
   */
  useEffect(() => {
    if (status !== 'playing' || isTransitioningRef.current) {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      return;
    }

    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setTimeRemaining((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          handleTimeout();
          return 0;
        }
        return next;
      });

      timerRafRef.current = requestAnimationFrame(loop);
    };

    timerRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, [status, round, handleTimeout]);

  /**
   * Handles User Tapping / Clicking an Option
   */
  const handleSelectOption = (option: ColorItem) => {
    if (isTransitioningRef.current || status !== 'playing') return;
    isTransitioningRef.current = true;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      // 1. CORRECT ANSWER
      // Calibrated skill-based scoring: Base scales with round difficulty + fast reaction bonus + streak bonus
      const currentRnd = round;
      const basePoints = currentRnd <= 3 ? 14 : currentRnd <= 6 ? 18 : currentRnd <= 8 ? 22 : 26;
      const maxTimeBonus = currentRnd <= 3 ? 10 : currentRnd <= 6 ? 14 : currentRnd <= 8 ? 16 : 20;
      
      const timeRatio = Math.max(0, Math.min(1, timeRemaining / roundTimeLimit));
      // Fast reaction exponent: rewarding sub-second reflexes
      const timeBonus = Math.round(Math.pow(timeRatio, 1.4) * maxTimeBonus);
      
      const currentCombo = combo;
      const maxComboBonus = currentRnd <= 3 ? 4 : currentRnd <= 6 ? 6 : currentRnd <= 8 ? 8 : 10;
      const comboBonus = Math.min(maxComboBonus, Math.round(currentCombo * 1.2));
      
      const roundPoints = basePoints + timeBonus + comboBonus;

      const newScore = Math.min(MAX_GAME_SCORE, score + roundPoints);
      const nextCombo = currentCombo + 1;

      setScore(newScore);
      setCorrectCount((c) => c + 1);
      setCombo(nextCombo);
      setMaxCombo((m) => Math.max(m, nextCombo));
      setFeedbackState('correct');

      SoundFX.playMatch(nextCombo);
      spawnFloatingPoint(roundPoints, nextCombo > 1 ? `x${nextCombo} Streak` : undefined);

      if (currentRnd >= TOTAL_ROUNDS) {
        setTimeout(() => handleEndGame(newScore), 320);
      } else {
        setTimeout(() => {
          const nextRnd = currentRnd + 1;
          setRound(nextRnd);
          loadNewRound(nextRnd);
        }, 160);
      }
    } else {
      // 2. WRONG ANSWER
      // Reset combo, 0 points, brief red warning, continue automatically
      SoundFX.playInvalid();
      setFeedbackState('wrong');
      setCombo(0);

      const currentRnd = round;
      if (currentRnd >= TOTAL_ROUNDS) {
        setTimeout(() => handleEndGame(score), 320);
      } else {
        setTimeout(() => {
          const nextRnd = currentRnd + 1;
          setRound(nextRnd);
          loadNewRound(nextRnd);
        }, 180);
      }
    }
  };

  /**
   * Reset session
   */
  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setRound(1);
    setCorrectCount(0);
    setFloatingPoints([]);
    setStatus('playing');
    setSessionSecondsRemaining(TOTAL_SESSION_SECONDS);
    sessionStartTimeRef.current = Date.now();
    loadNewRound(1);
    SoundFX.playTap();
  };

  const timerPercent = Math.max(0, Math.min(100, (timeRemaining / roundTimeLimit) * 100));

  return (
    <div 
      className="relative w-full max-w-md mx-auto flex flex-col items-center select-none rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl min-h-[580px] font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #0c3366 0%, #041b3a 50%, #010c1c 100%)',
      }}
    >
      {/* ARCADE SPEED & NEON AMBIENT BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-44 h-44 rounded-full bg-[#78BE20]/15 blur-2xl" />
        <div className="absolute top-1/2 right-4 w-40 h-40 rounded-full bg-blue-600/20 blur-3xl" />
        {/* Subtle arcade grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.2) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>
      
      {/* 1. STANDARDIZED TOP GAME HUD: [EXIT] [SCORE] [TIME] [SOUND] [PAUSE] */}
      <div 
        id="color-rush-hud"
        className="w-full bg-[#05234A]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-[#0B3B70] flex flex-col gap-2 z-20 shadow-md shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          {/* BUTTON 0: EXIT */}
          <button
            id="color-rush-exit-btn"
            onClick={onExit}
            className="h-11 px-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:scale-95 border border-slate-700 flex items-center gap-1 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
            title="Exit Game"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">EXIT</span>
          </button>

          {/* BUTTON 1: SCORE (Neon Electric Blue Theme) */}
          <div 
            id="color-rush-score-card"
            className="flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl bg-gradient-to-b from-[#003C78]/70 to-[#021B3A]/90 border border-cyan-500/40 text-white flex items-center gap-2 shadow-xs transition-transform"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.25)' }}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0057A8] to-[#00E5FF] flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-xs">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="text-[8px] sm:text-[9px] font-black text-[#38BDF8] uppercase tracking-wider">
                SCORE
              </span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight tabular-nums truncate">
                  {normalizedScore}
                </span>
                {combo > 1 && (
                  <span className="text-[8px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-1 py-0.2 rounded-full animate-bounce shrink-0">
                    {combo}x
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BUTTON 2: TIME (Countdown 02:00 -> 00:00) */}
          <div 
            id="color-rush-time-card"
            className={`flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl border flex items-center gap-2 shadow-xs transition-colors ${
              sessionSecondsRemaining <= 10
                ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse shadow-rose-900/50'
                : sessionSecondsRemaining <= 30
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-gradient-to-b from-[#0B3B70]/80 to-[#041D3F] border-[#78BE20]/40 text-white'
            }`}
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.25)' }}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              sessionSecondsRemaining <= 10
                ? 'bg-rose-500 text-white animate-spin'
                : sessionSecondsRemaining <= 30
                ? 'bg-amber-500 text-slate-950'
                : 'bg-gradient-to-tr from-[#78BE20] to-[#00E5FF] text-slate-950 font-bold'
            }`}>
              <Clock className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                sessionSecondsRemaining <= 10 ? 'text-rose-400' : sessionSecondsRemaining <= 30 ? 'text-amber-400' : 'text-[#78BE20]'
              }`}>
                TIME
              </span>
              <span className="text-sm sm:text-base font-black font-mono tracking-tight tabular-nums">
                {formatTime(sessionSecondsRemaining)}
              </span>
            </div>
          </div>

          {/* BUTTON 3: SOUND (Mute / Unmute Toggle) */}
          <button
            id="color-rush-sound-toggle"
            onClick={() => setMuted(!muted)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 transition-all cursor-pointer shadow-xs shrink-0"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4.5 h-4.5 text-slate-500" /> : <Volume2 className="w-4.5 h-4.5 text-[#78BE20]" />}
          </button>

          {/* BUTTON 4: PAUSE (Pause Game) */}
          <button
            id="color-rush-pause-toggle"
            onClick={() => setStatus('paused')}
            disabled={status !== 'playing'}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
            title="Pause Game"
          >
            <Pause className="w-4.5 h-4.5 fill-current text-white/80" />
          </button>
        </div>

        {/* Round Progression Badge & Precision Timer Bar */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="text-[10px] text-[#38BDF8] font-bold tracking-wider uppercase shrink-0">
            Round {round}/{TOTAL_ROUNDS}
          </div>
          <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                timerPercent > 50
                  ? 'bg-[#78BE20]'
                  : timerPercent > 25
                  ? 'bg-amber-400'
                  : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
            {Math.max(0, (timeRemaining / 1000)).toFixed(1)}s
          </div>
        </div>
      </div>

      {/* 2. HIGH-PRECISION COUNTDOWN TIMER BAR */}
      <div className="w-full h-2 bg-slate-900 overflow-hidden relative border-b border-[#0B3B70]">
        <div
          className={`h-full transition-all duration-75 ${
            timerPercent > 50
              ? 'bg-[#78BE20]'
              : timerPercent > 25
              ? 'bg-amber-400'
              : 'bg-rose-500 animate-pulse'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* 3. MAIN INTERACTIVE REACTION STAGE (Positioned slightly upward for ideal ergonomic focus) */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-start pt-2 pb-5 px-4 sm:px-5 overflow-hidden">
        
        {/* Floating Score Popups */}
        {floatingPoints.map((fp) => (
          <div
            key={fp.id}
            className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none font-mono font-black animate-bounce text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${
              fp.isBonus ? 'text-amber-300 text-2xl sm:text-3xl' : 'text-[#78BE20] text-xl sm:text-2xl'
            }`}
          >
            +{fp.points}
            {fp.comboText && (
              <div className="text-[10px] font-sans text-white font-black uppercase tracking-wider">
                {fp.comboText}
              </div>
            )}
          </div>
        ))}

        {/* TARGET COLOR STAGE: Large, Vibrant, Dimensional Shader */}
        <div className="w-full flex flex-col items-center mt-1 mb-4">
          <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-[#78BE20]" />
            <span>Target Color</span>
          </div>

          <div
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 shadow-2xl transition-transform duration-150 flex items-center justify-center ${
              feedbackState === 'correct'
                ? 'scale-105 ring-4 ring-[#78BE20]'
                : feedbackState === 'wrong'
                ? 'scale-95 ring-4 ring-rose-500 animate-shake'
                : ''
            }`}
            style={{
              boxShadow: targetColor ? `0 0 35px ${targetColor.hex}80` : undefined,
            }}
          >
            {/* Glossy Target Sphere Card */}
            <div
              className="w-full h-full rounded-2xl border-2 border-white/90 shadow-inner flex items-center justify-center overflow-hidden relative"
              style={{ backgroundColor: targetColor?.hex || '#ffffff' }}
            >
              {/* Glossy Curved Highlight Overlay */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent pointer-events-none rounded-t-xl" />
              
              {/* Specular Gleam */}
              <div className="absolute top-2 left-2.5 w-4 h-2 rounded-full bg-white/80 rotate-[-30deg] pointer-events-none" />

              {/* Center Target Ring */}
              <div className="w-7 h-7 rounded-full bg-black/20 backdrop-blur-xs border border-white/40 flex items-center justify-center text-white">
                <Target className="w-3.5 h-3.5 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* Target Color Name Badge */}
          {targetColor?.name && (
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/90 border border-[#0B3B70] text-slate-200 font-bold text-[11px] shadow-sm">
              {targetColor.name}
            </div>
          )}
        </div>

        {/* LARGE TOUCH TARGETS: Dimensional Arcade Game Buttons with Depth, Highlights, and Physical Click Feel */}
        <div className={`w-full grid gap-3 max-w-sm sm:max-w-md my-auto ${
          options.length === 6 ? 'grid-cols-3' : 'grid-cols-2'
        }`}>
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.isCorrect;

            let cardRing = 'border-t-white/40 border-b-black/40 border-x-white/20 hover:brightness-110';
            if (feedbackState && isSelected) {
              cardRing = isCorrect ? 'ring-4 ring-[#78BE20] brightness-125' : 'ring-4 ring-rose-500 brightness-75';
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={feedbackState !== null}
                className={`relative h-20 sm:h-22 rounded-2xl border-2 transition-all duration-75 flex items-center justify-center overflow-hidden cursor-pointer touch-none select-none active:translate-y-1 ${cardRing}`}
                style={{
                  backgroundColor: option.hex,
                  boxShadow: isSelected && feedbackState
                    ? '0 2px 0 rgba(0,0,0,0.6)'
                    : '0 5px 0 rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3)',
                }}
              >
                {/* Convex Arc Highlight (Mobile Game Bevel) */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-t-xl" />
                
                {/* Specular Pill Sheen */}
                <div className="absolute top-1.5 left-2 w-5 h-2 rounded-full bg-white/60 rotate-[-25deg] pointer-events-none" />
                
                {/* Bottom Shadow Lip for 3D depth */}
                <div className="absolute bottom-0 inset-x-0 h-2 bg-black/25 pointer-events-none rounded-b-xl" />

                {/* Instant Feedback Overlay */}
                {feedbackState && isSelected && (
                  <div className={`absolute inset-0 flex items-center justify-center ${
                    isCorrect ? 'bg-emerald-500/40 backdrop-blur-xs' : 'bg-rose-500/40 backdrop-blur-xs'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-9 h-9 text-white drop-shadow-lg animate-in zoom-in-75" />
                    ) : (
                      <XCircle className="w-9 h-9 text-white drop-shadow-lg animate-in zoom-in-75" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PAUSE OVERLAY MODAL */}
      {status === 'paused' && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#0057A8] text-white flex items-center justify-center mb-3 shadow-xl">
            <Pause className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-white mb-1">Game Paused</h3>
          <p className="text-xs text-slate-300 mb-5">
            Score: {normalizedScore} PTS • Round: {round}/{TOTAL_ROUNDS}
          </p>

          <div className="w-full max-w-xs space-y-2.5">
            <button
              onClick={() => setStatus('playing')}
              className="w-full py-3 rounded-xl bg-[#78BE20] hover:bg-[#68a81b] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Game</span>
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Match</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Exit to Arcade
            </button>
          </div>
        </div>
      )}

      {/* 5. FINAL / RESULTS SCREEN (Score, Accuracy, Best Score, Tournament Points, PLAY AGAIN, EXIT) */}
      {status === 'game_over' && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#0B3B70] via-[#05234A] to-[#02142B] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#78BE20]/20 border border-[#78BE20]/50 text-[#78BE20] text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>Reaction Match Completed</span>
          </div>

          {normalizedScore >= bestScore && normalizedScore > 0 && (
            <div className="mb-2 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          )}

          {/* FINAL SCORE */}
          <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight mb-0.5">
            {normalizedScore}
          </div>
          <div className="text-[11px] text-slate-300 uppercase tracking-widest font-semibold mb-5">
            FINAL SCORE
          </div>

          {/* 4-Metric Breakdown Matrix: Score, Accuracy, Best Score, Tournament Points */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2.5 mb-6 text-left">
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ACCURACY</div>
              <div className="text-cyan-400 font-black font-mono text-base">
                {Math.round((correctCount / TOTAL_ROUNDS) * 100)}%
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">BEST SCORE</div>
              <div className="text-amber-400 font-black font-mono text-base">
                {Math.max(normalizedScore, bestScore)} PTS
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">MAX COMBO</div>
              <div className="text-white font-black font-mono text-base">
                {maxCombo}x Streak
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">TOURNAMENT POINTS</div>
              <div className="text-[#78BE20] font-black font-mono text-base">
                +{normalizedScore} PTS
              </div>
            </div>
          </div>

          {/* Action Buttons: PLAY AGAIN & EXIT (Strictly No Ads, No Energy, No VIP) */}
          <div className="w-full max-w-xs space-y-2.5">
            <button
              onClick={handleRestart}
              className="w-full py-3.5 rounded-xl bg-[#78BE20] hover:bg-[#68a81b] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
