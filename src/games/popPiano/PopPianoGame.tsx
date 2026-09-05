/**
 * POP PIANO - Mobile Piano Tiles Game for TelePlus
 * 
 * Rebuilt strictly adhering to Piano Tiles specifications:
 * 1. True 4-lane vertical Piano Tiles layout on clean ivory canvas.
 * 2. Long vertical deep black rectangular tiles with realistic depth, subtle sheen, rounded corners.
 * 3. ZERO musical notation text (no D#5, E5, #4 labels).
 * 4. Immediate single-tap Android touch response.
 * 5. Robust hit/collision detection (NO false misses, generous hit window around the hit line).
 * 6. Smooth progressive difficulty:
 *    - 0–20%: Slow (accessible opening, ample reaction time)
 *    - 20–45%: Moderate
 *    - 45–70%: Fast
 *    - 70–90%: Very Fast
 *    - 90–100%: Challenging Maximum Speed
 * 7. Decoupled 60 FPS animation loop (no re-render cancellations on tap).
 * 8. Deterministic scoring capped strictly at 400 PTS.
 * 9. Audio stop & cleanup on Exit / Back / Pause / Game Over / Restart.
 * 10. Start Screen -> 3-2-1-GO sequence -> Continuous Play -> Clean Results Screen.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameStatus, JudgementType, PianoTileModel, HitEffectParticle } from './types';
import { PianoSynth } from './audioEngine';
import { SONGS_CATALOG, SongTrack } from './melodyTracks';
import { PianoCanvasRenderer } from './pianoCanvasRenderer';
import { GameDefinition } from '../../types';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  X,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  Music,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface PopPianoGameProps {
  game: GameDefinition;
  onGameOver: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

const MAX_TOTAL_SCORE = 400;
const TOTAL_SONG_NOTES = 100;
const TOTAL_GAME_SECONDS = 120; // 2 Minutes
const STORAGE_KEY = 'teleplus_pop_piano_best_score';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Progressive downward travel speed (px/s)
 * START = already fast and challenging (~360 px/s)
 * EARLY = difficult (~420 px/s)
 * MID = very difficult (~500 px/s)
 * LATE = extremely difficult (~580 px/s)
 * END = highest practical difficulty (~670 px/s)
 */
function getProgressiveSpeed(hitCount: number): number {
  const p = Math.min(1.0, Math.max(0, hitCount / TOTAL_SONG_NOTES));
  if (p < 0.15) {
    return 360 + (p / 0.15) * 50;
  } else if (p < 0.40) {
    return 410 + ((p - 0.15) / 0.25) * 70;
  } else if (p < 0.70) {
    return 480 + ((p - 0.40) / 0.30) * 80;
  } else if (p < 0.90) {
    return 560 + ((p - 0.70) / 0.20) * 70;
  } else {
    return 630 + ((p - 0.90) / 0.10) * 40;
  }
}

/**
 * Returns current difficulty stage (1 to 5)
 */
function getDifficultyStage(hitCount: number): number {
  const p = hitCount / TOTAL_SONG_NOTES;
  if (p < 0.15) return 1;
  if (p < 0.40) return 2;
  if (p < 0.70) return 3;
  if (p < 0.90) return 4;
  return 5;
}

export const PopPianoGame: React.FC<PopPianoGameProps> = ({
  game,
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  // Game Lifecycle State
  const [gameState, setGameState] = useState<GameStatus>('start');
  const [countdown, setCountdown] = useState<number | 'GO'>('READY' as unknown as number);
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(0);
  const [muted, setMuted] = useState(!isAudioEnabled);

  // HUD & Display State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [notesHitCount, setNotesHitCount] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [currentStage, setCurrentStage] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_GAME_SECONDS);

  // Best Score Persistence
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? Math.min(MAX_TOTAL_SCORE, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });

  // Real-time Physics & Simulation Refs (Decoupled from React render cycles)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PianoCanvasRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tilesRef = useRef<PianoTileModel[]>([]);
  const nextNoteIndexRef = useRef<number>(0);
  const particlesRef = useRef<HitEffectParticle[]>([]);
  const pressedLanesRef = useRef<Record<number, boolean>>({ 0: false, 1: false, 2: false, 3: false });
  const laneFlashesRef = useRef<Record<number, 'hit' | 'miss' | null>>({ 0: null, 1: null, 2: null, 3: null });

  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const hitCountRef = useRef<number>(0);
  const perfectCountRef = useRef<number>(0);
  const greatCountRef = useRef<number>(0);
  const missCountRef = useRef<number>(0);

  const isPlayingRef = useRef<boolean>(false);
  const isTerminatedRef = useRef<boolean>(false);
  const lastFrameTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const canvasDimensionsRef = useRef<{ width: number; height: number }>({ width: 360, height: 600 });
  const hitLineYRef = useRef<number>(500);

  // Ref to hold onGameOver callback safely
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Sync mute with Audio Engine
  useEffect(() => {
    PianoSynth.setMuted(muted);
  }, [muted]);

  // Clean up all audio and animation frames on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      isTerminatedRef.current = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      PianoSynth.stopAll();
    };
  }, []);

  /**
   * Spawns the next tile from the active song track
   */
  const spawnNextTile = (currentSong: SongTrack, customY?: number): PianoTileModel | null => {
    const noteIdx = nextNoteIndexRef.current;
    if (noteIdx >= currentSong.notes.length) return null;

    const note = currentSong.notes[noteIdx];
    const canvasHeight = canvasDimensionsRef.current.height;
    const tileHeight = Math.max(125, Math.min(160, canvasHeight * 0.23));

    let spawnY = -tileHeight - 20;
    if (customY !== undefined) {
      spawnY = customY;
    } else {
      const activeTiles = tilesRef.current.filter((t) => !t.isHit && !t.isMissed);
      if (activeTiles.length > 0) {
        const topMostY = Math.min(...activeTiles.map((t) => t.y));
        const spacing = tileHeight * 1.32;
        spawnY = Math.min(-tileHeight - 10, topMostY - spacing);
      }
    }

    const newTile: PianoTileModel = {
      id: `tile_${noteIdx}_${Date.now()}_${Math.random()}`,
      noteIndex: noteIdx,
      lane: note.lane,
      y: spawnY,
      height: tileHeight,
      width: canvasDimensionsRef.current.width / 4,
      pitch: note.pitch,
      frequency: note.frequency,
      isHit: false,
      isMissed: false,
      hitAnimTime: 0,
    };

    nextNoteIndexRef.current++;
    tilesRef.current.push(newTile);
    return newTile;
  };

  /**
   * Initializes Canvas & High-DPI Scaling
   */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width || 360;
    const height = rect.height || 580;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvasDimensionsRef.current = { width, height };
    hitLineYRef.current = height * 0.80;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
      rendererRef.current = new PianoCanvasRenderer(ctx);
      rendererRef.current.setDimensions(width, height);
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  /**
   * Concludes the run on Miss or Song Completion
   */
  const handleEndGame = useCallback((finalScore: number) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    isPlayingRef.current = false;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    PianoSynth.stopAll();
    setGameState('game_over');

    const clampedFinal = Math.min(MAX_TOTAL_SCORE, Math.max(0, Math.round(finalScore)));
    setScore(clampedFinal);

    setBestScore((prev) => {
      if (clampedFinal > prev) {
        try {
          localStorage.setItem(STORAGE_KEY, clampedFinal.toString());
        } catch {}
        return clampedFinal;
      }
      return prev;
    });

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    onGameOverRef.current(clampedFinal, elapsedSeconds);
  }, []);

  // 2-Minute Game Session Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndGame(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, handleEndGame]);

  /**
   * Start 3 -> 2 -> 1 -> GO Sequence and begin tile flow smoothly
   */
  const handleStartGame = (songIdx: number = selectedSongIndex) => {
    setSelectedSongIndex(songIdx);
    const currentSong = SONGS_CATALOG[songIdx % SONGS_CATALOG.length];

    // Reset Metrics
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    hitCountRef.current = 0;
    perfectCountRef.current = 0;
    greatCountRef.current = 0;
    missCountRef.current = 0;

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setNotesHitCount(0);
    setPerfectCount(0);
    setGreatCount(0);
    setMissCount(0);
    setCurrentStage(1);
    setTimeLeft(TOTAL_GAME_SECONDS);

    // Reset Simulation Collections
    tilesRef.current = [];
    nextNoteIndexRef.current = 0;
    particlesRef.current = [];
    pressedLanesRef.current = { 0: false, 1: false, 2: false, 3: false };
    laneFlashesRef.current = { 0: null, 1: null, 2: null, 3: null };

    isTerminatedRef.current = false;
    isPlayingRef.current = false;

    PianoSynth.init();

    // Prepare initial tiles staggered descending downward
    const canvasHeight = canvasDimensionsRef.current.height;
    const tileHeight = Math.max(125, Math.min(160, canvasHeight * 0.23));
    const spacing = tileHeight * 1.32;
    const hitLineY = hitLineYRef.current;

    // First tile starts above the hit line so it approaches gently after GO
    const firstTileY = hitLineY - spacing * 1.7;
    for (let i = 0; i < 5; i++) {
      spawnNextTile(currentSong, firstTileY - i * spacing);
    }

    setGameState('ready');
    setCountdown(3);

    // 3 -> 2 -> 1 -> GO -> Active Play
    const t1 = setTimeout(() => setCountdown(2), 500);
    const t2 = setTimeout(() => setCountdown(1), 1000);
    const t3 = setTimeout(() => setCountdown('GO'), 1500);
    const t4 = setTimeout(() => {
      sessionStartTimeRef.current = Date.now();
      lastFrameTimeRef.current = performance.now();
      isPlayingRef.current = true;
      setGameState('playing');
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  /**
   * Main 60 FPS RequestAnimationFrame Game Loop
   * Strictly decoupled from tap state updates to prevent frame re-creation drops.
   */
  useEffect(() => {
    if (gameState !== 'playing') {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const currentSong = SONGS_CATALOG[selectedSongIndex % SONGS_CATALOG.length];
    let isLoopRunning = true;
    lastFrameTimeRef.current = performance.now();

    const gameLoop = (currentTime: number) => {
      if (!isLoopRunning || !isPlayingRef.current || isTerminatedRef.current) return;

      const dt = Math.min(0.045, (currentTime - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = currentTime;

      const currentHitCount = hitCountRef.current;
      const speed = getProgressiveSpeed(currentHitCount);
      const hitLineY = hitLineYRef.current;
      const canvasHeight = canvasDimensionsRef.current.height;

      const tiles = tilesRef.current;
      let missedTileFound = false;

      // 1. Update Tile Positions
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        if (tile.isHit) {
          tile.hitAnimTime += dt * 1000;
          continue;
        }

        if (tile.isMissed) continue;

        // Move tile downward
        tile.y += speed * dt;

        // Miss check: Tile has completely scrolled past the hit zone without being hit
        // A tile is considered missed only when its top is well past the hitline and bottom is past the screen/hit zone
        if (tile.y > hitLineY + 60 || tile.y > canvasHeight - 20) {
          tile.isMissed = true;
          tile.judgement = 'MISS';
          missedTileFound = true;

          laneFlashesRef.current[tile.lane] = 'miss';
          PianoSynth.playMissThud();

          missCountRef.current += 1;
          comboRef.current = 0;
          setMissCount(missCountRef.current);
          setCombo(0);

          setTimeout(() => {
            handleEndGame(scoreRef.current);
          }, 250);
          break;
        }
      }

      // 2. Ensure Continuous Stream: Spawn next tiles if needed
      const unhitTiles = tiles.filter((t) => !t.isHit && !t.isMissed);
      if (unhitTiles.length < 6 && nextNoteIndexRef.current < currentSong.notes.length) {
        spawnNextTile(currentSong);
      }

      // 3. Update Floating Particles
      const now = Date.now();
      particlesRef.current = particlesRef.current.filter((p) => {
        const age = now - p.createdAt;
        if (age > 450) return false;
        p.y -= 35 * dt;
        p.alpha = Math.max(0, 1 - age / 450);
        return true;
      });

      // 4. Render Canvas Pass
      if (rendererRef.current) {
        rendererRef.current.render(
          tiles,
          particlesRef.current,
          pressedLanesRef.current,
          laneFlashesRef.current,
          hitLineY
        );
      }

      // Check if player completed all 100 notes in song
      if (currentHitCount >= TOTAL_SONG_NOTES && !missedTileFound) {
        setTimeout(() => {
          handleEndGame(MAX_TOTAL_SCORE);
        }, 300);
        return;
      }

      if (!missedTileFound) {
        rafIdRef.current = requestAnimationFrame(gameLoop);
      }
    };

    rafIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isLoopRunning = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [gameState, selectedSongIndex, handleEndGame]);

  /**
   * Pointer / Touch Tap Handler - Instant Single-Touch Hit Detection
   * Generous hit tolerance to ensure no false misses.
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !isPlayingRef.current || isTerminatedRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const laneWidth = canvasDimensionsRef.current.width / 4;
    const laneIndex = Math.floor(clientX / laneWidth) as 0 | 1 | 2 | 3;
    if (laneIndex < 0 || laneIndex > 3) return;

    // Visual Pressed Lane indicator
    pressedLanesRef.current[laneIndex] = true;
    setTimeout(() => {
      pressedLanesRef.current[laneIndex] = false;
    }, 100);

    const hitLineY = hitLineYRef.current;
    const tiles = tilesRef.current;

    // Find candidate unhit tiles in this lane
    // A tile is reachable if it is in the active lane and its position is reasonable
    const activeUnhitInLane = tiles.filter((t) => t.lane === laneIndex && !t.isHit && !t.isMissed);

    let targetTile: PianoTileModel | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < activeUnhitInLane.length; i++) {
      const t = activeUnhitInLane[i];
      const tileTop = t.y;
      const tileBottom = t.y + t.height;
      const tileCenter = t.y + t.height / 2;

      // Generous Hit Area:
      // 1. Direct Touch on Tile: User finger tapped within or near the tile bounds vertically
      const isDirectTouchOnTile = clientY >= tileTop - 40 && clientY <= tileBottom + 40;

      // 2. Hit-Line Reach: Tile is descending near the hit line (from well above to slightly below)
      const isNearHitLine = tileBottom >= hitLineY - 260 && tileTop <= hitLineY + 65;

      if (isDirectTouchOnTile || isNearHitLine) {
        const dist = Math.abs(tileCenter - hitLineY);
        if (dist < minDistance) {
          minDistance = dist;
          targetTile = t;
        }
      }
    }

    if (targetTile) {
      // SUCCESSFUL TILE HIT!
      targetTile.isHit = true;
      targetTile.hitAnimTime = 0;

      // Accuracy Judgement (Tightened tolerance: within 38px for PERFECT)
      const isPerfect = minDistance < 38;
      const judgement: JudgementType = isPerfect ? 'PERFECT' : 'GREAT';
      targetTile.judgement = judgement;

      // Update counters
      hitCountRef.current += 1;
      comboRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);

      if (isPerfect) {
        perfectCountRef.current += 1;
        PianoSynth.playHitChime();
      } else {
        greatCountRef.current += 1;
      }

      // Skill-based scoring capped strictly at 400
      // Perfects give 3.2 pts base, Great gives 1.8 pts base, plus progressive combo multiplier
      const perfects = perfectCountRef.current;
      const greats = greatCountRef.current;
      const currentHits = hitCountRef.current;
      const currentC = comboRef.current;
      const stage = getDifficultyStage(currentHits);

      const baseScore = perfects * 3.2 + greats * 1.8;
      const comboBonus = Math.min(45, currentC * 0.45);
      const stageBonus = stage * 3;

      const calculatedScore = Math.min(
        MAX_TOTAL_SCORE,
        Math.round(baseScore + comboBonus + stageBonus)
      );

      scoreRef.current = calculatedScore;

      // Update React state for HUD
      setScore(calculatedScore);
      setCombo(currentC);
      setMaxCombo(maxComboRef.current);
      setNotesHitCount(currentHits);
      setCurrentStage(stage);
      if (isPerfect) setPerfectCount(perfectCountRef.current);
      else setGreatCount(greatCountRef.current);

      // Play authentic acoustic piano note immediately
      PianoSynth.playPianoNote(targetTile.frequency, 1.2, isPerfect ? 1.0 : 0.85);

      // Flash lane & trigger particle
      laneFlashesRef.current[laneIndex] = 'hit';
      setTimeout(() => {
        laneFlashesRef.current[laneIndex] = null;
      }, 120);

      particlesRef.current.push({
        id: `p_${Date.now()}_${Math.random()}`,
        lane: laneIndex,
        x: laneIndex * laneWidth + laneWidth / 2,
        y: hitLineY - 10,
        text: judgement,
        type: judgement,
        points: isPerfect ? 4 : 3,
        alpha: 1.0,
        scale: 1.05,
        createdAt: Date.now(),
      });

      // Check if song finished (100 notes reached)
      if (currentHits >= TOTAL_SONG_NOTES) {
        setTimeout(() => {
          handleEndGame(MAX_TOTAL_SCORE);
        }, 300);
      }
    } else {
      // Tapped lane has NO tiles anywhere in the active hit zone
      // Only penalize if the player tapped completely empty space when other notes are waiting
      const allUnhitTiles = tiles.filter((t) => !t.isHit && !t.isMissed);
      const lowestTile = allUnhitTiles[0];

      // If there is an active tile on screen that the player missed by tapping the wrong lane:
      if (lowestTile && lowestTile.y >= hitLineY - 260) {
        laneFlashesRef.current[laneIndex] = 'miss';
        setTimeout(() => {
          laneFlashesRef.current[laneIndex] = null;
        }, 160);

        PianoSynth.playMissThud();
        missCountRef.current += 1;
        comboRef.current = 0;
        setMissCount(missCountRef.current);
        setCombo(0);

        setTimeout(() => {
          handleEndGame(scoreRef.current);
        }, 250);
      }
    }
  };

  /**
   * Keyboard controls ([D], [F], [J], [K] or [1], [2], [3], [4] or Arrows)
   */
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toUpperCase();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const laneWidth = canvasDimensionsRef.current.width / 4;
      const hitLineY = hitLineYRef.current;

      const triggerLane = (lane: 0 | 1 | 2 | 3) => {
        const fakePointerEvent = {
          preventDefault: () => {},
          clientX: rect.left + lane * laneWidth + laneWidth / 2,
          clientY: rect.top + hitLineY,
        } as React.PointerEvent<HTMLCanvasElement>;
        handlePointerDown(fakePointerEvent);
      };

      if (key === 'D' || key === '1' || key === 'ARROWLEFT') triggerLane(0);
      else if (key === 'F' || key === '2' || key === 'ARROWUP') triggerLane(1);
      else if (key === 'J' || key === '3' || key === 'ARROWDOWN') triggerLane(2);
      else if (key === 'K' || key === '4' || key === 'ARROWRIGHT') triggerLane(3);
      else if (key === 'ESCAPE' || key === ' ') {
        isPlayingRef.current = false;
        setGameState('paused');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Pause / Resume Handlers
  const handlePause = () => {
    if (gameState === 'playing') {
      isPlayingRef.current = false;
      setGameState('paused');
      PianoSynth.stopAll();
    }
  };

  const handleResume = () => {
    if (gameState === 'paused') {
      lastFrameTimeRef.current = performance.now();
      isPlayingRef.current = true;
      setGameState('playing');
    }
  };

  // Performance calculations
  const totalJudgements = perfectCount + greatCount + missCount;
  const accuracy = totalJudgements > 0
    ? Math.min(100, Math.round(((perfectCount * 4 + greatCount * 3) / (totalJudgements * 4)) * 100))
    : 100;

  const progressPercent = Math.min(100, Math.round((notesHitCount / TOTAL_SONG_NOTES) * 100));

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl min-h-[640px] font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* =========================================================================
          1. STANDARDIZED TOP GAME HUD: [EXIT] [SCORE] [TIME] [SOUND] [PAUSE]
         ========================================================================= */}
      <div 
        id="pop-piano-hud"
        className="w-full bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-200/80 flex flex-col gap-2 z-30 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2">
          {/* BUTTON 0: EXIT */}
          <button
            id="piano-exit-btn"
            onClick={onExit}
            className="h-11 px-3 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 active:scale-95 border border-slate-300 flex items-center gap-1 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.08)' }}
            title="Exit Game"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">EXIT</span>
          </button>

          {/* BUTTON 1: SCORE (Piano Theme) */}
          <div 
            id="piano-score-card"
            className="flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#1E293B] border border-blue-500/30 text-white flex items-center gap-2 shadow-xs transition-transform"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.15)' }}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#1688C9] to-[#00C853] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="text-[8px] sm:text-[9px] font-black text-[#60A5FA] uppercase tracking-wider">
                SCORE
              </span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg font-black font-mono tracking-tight tabular-nums truncate text-white">
                  {score}
                </span>
                {combo > 1 && (
                  <span className="text-[8px] font-black bg-[#8BCB3D] text-white px-1 py-0.2 rounded-full animate-pulse shrink-0">
                    {combo}x
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BUTTON 2: TIME (Countdown 02:00 -> 00:00) */}
          <div 
            id="piano-time-card"
            className={`flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl border flex items-center gap-2 shadow-xs transition-colors ${
              timeLeft <= 10
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse shadow-rose-100'
                : timeLeft <= 30
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-gradient-to-b from-[#F0F8FF] to-[#E6F0FA] border-[#1688C9]/30 text-slate-900'
            }`}
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 3px rgba(22, 136, 201, 0.12)' }}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              timeLeft <= 10
                ? 'bg-rose-500 text-white'
                : timeLeft <= 30
                ? 'bg-amber-500 text-white'
                : 'bg-gradient-to-tr from-[#1688C9] to-[#8BCB3D] text-white'
            }`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                timeLeft <= 10 ? 'text-rose-500' : timeLeft <= 30 ? 'text-amber-700' : 'text-[#1688C9]'
              }`}>
                TIME
              </span>
              <span className="text-sm sm:text-base font-black font-mono tracking-tight tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* BUTTON 3: SOUND (Mute / Unmute Toggle) */}
          <button
            id="piano-sound-toggle"
            onClick={() => setMuted(!muted)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 active:scale-95 border border-slate-200 flex items-center justify-center text-[#17202A] transition-all cursor-pointer shadow-xs shrink-0"
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.06)' }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4.5 h-4.5 text-slate-400" /> : <Volume2 className="w-4.5 h-4.5 text-[#8BCB3D]" />}
          </button>

          {/* BUTTON 4: PAUSE (Pause Game) */}
          <button
            id="piano-pause-button"
            onClick={handlePause}
            disabled={gameState !== 'playing'}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 active:scale-95 border border-slate-200 flex items-center justify-center text-[#17202A] transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.06)' }}
            title="Pause"
          >
            <Pause className="w-4.5 h-4.5 fill-slate-700/20 text-slate-700" />
          </button>
        </div>

        {/* 100-Note Progress Bar with Note & Stage Indicator */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="text-[10px] text-[#6B7280] font-bold shrink-0">
            Stage {currentStage}/5
          </div>
          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#1688C9] to-[#8BCB3D] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono font-bold shrink-0">
            {notesHitCount}/100
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FOUR-LANE PIANO TILES PLAY AREA (HTML5 Canvas)
             - 4 equal-width vertical lanes
             - Long vertical black piano tiles
             - Green hit line at bottom
             - One touch = One hit note
         ========================================================================= */}
      <div 
        ref={containerRef}
        id="piano-tiles-playfield"
        className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-[#FAFBFD] min-h-[500px] select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          id="pop-piano-canvas"
          onPointerDown={handlePointerDown}
          className="w-full h-full block cursor-pointer select-none touch-none"
        />
      </div>

      {/* =========================================================================
          3. START SCREEN OVERLAY
             - "POP PIANO"
             - Melody track selection
             - [ START GAME ]
         ========================================================================= */}
      {gameState === 'start' && (
        <div 
          id="pop-piano-start-overlay"
          className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#1688C9] text-white flex items-center justify-center mb-3 shadow-lg border-2 border-blue-200">
            <Music className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-black text-[#17202A] tracking-tight">POP PIANO</h2>
          <p className="text-xs font-medium text-[#6B7280] mt-1 max-w-xs">
            Tap the descending black tiles with precise timing. Play real piano notes and build your combo!
          </p>

          {/* Song selector */}
          <div className="my-5 w-full max-w-xs space-y-2">
            <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-left">
              Select Melody
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SONGS_CATALOG.map((song, idx) => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSongIndex(idx)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedSongIndex === idx
                      ? 'bg-[#1688C9]/10 border-[#1688C9] text-[#1688C9] font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{song.title}</div>
                    <div className="text-[10px] text-slate-500">{song.subtitle}</div>
                  </div>
                  {selectedSongIndex === idx && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1688C9]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Start Action Button */}
          <button
            id="pop-piano-start-btn"
            onClick={() => handleStartGame(selectedSongIndex)}
            className="w-full max-w-xs py-3.5 rounded-2xl bg-[#8BCB3D] hover:bg-[#7cb736] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <span>START GAME</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          4. COUNTDOWN OVERLAY (3 -> 2 -> 1 -> GO)
         ========================================================================= */}
      {gameState === 'ready' && (
        <div 
          id="pop-piano-countdown-overlay"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in pointer-events-none"
        >
          <div
            key={countdown}
            className="w-24 h-24 rounded-full bg-[#8BCB3D] text-white flex items-center justify-center text-4xl font-black font-mono shadow-2xl animate-bounce border-4 border-white"
          >
            {countdown}
          </div>
          <div className="mt-4 px-4 py-1.5 rounded-full bg-white/90 text-[#17202A] text-xs font-black uppercase tracking-wider shadow-md">
            GET READY!
          </div>
        </div>
      )}

      {/* =========================================================================
          5. PAUSE OVERLAY
         ========================================================================= */}
      {gameState === 'paused' && (
        <div 
          id="pop-piano-paused-overlay"
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1688C9] text-white mx-auto flex items-center justify-center shadow-xs">
              <Pause className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#17202A]">Game Paused</h3>
              <p className="text-xs text-[#6B7280] mt-0.5 font-mono">
                Current Score: {score} PTS
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleResume}
                className="w-full py-3 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => handleStartGame(selectedSongIndex)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17202A] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              <button
                onClick={onExit}
                className="w-full py-2 text-xs text-[#6B7280] hover:text-[#17202A] font-bold transition-colors cursor-pointer"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. CLEAN RESULT SCREEN
             Shows ONLY:
             - FINAL SCORE
             - Score
             - Accuracy
             - Best Score
             - Max Combo
             - Tournament Points (+Score PTS)
             - [ PLAY AGAIN ]
             - [ EXIT ]
         ========================================================================= */}
      {gameState === 'game_over' && (
        <div 
          id="pop-piano-game-over-screen"
          className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95"
        >
          {/* Header Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1688C9]/10 text-[#1688C9] text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>Match Complete</span>
          </div>

          {score >= bestScore && score > 0 && (
            <div className="mb-2 px-3 py-1 rounded-xl bg-[#8BCB3D]/15 text-[#8BCB3D] font-black text-xs flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          )}

          {/* Final Score (Capped strictly to 400) */}
          <div className="text-5xl font-black text-[#17202A] font-mono tracking-tight">
            {score}
          </div>
          <div className="text-[11px] text-[#6B7280] uppercase tracking-widest font-bold mb-5">
            FINAL SCORE
          </div>

          {/* Matrix Results */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-5 text-left">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Best Score</div>
              <div className="text-base font-black text-[#1688C9] font-mono mt-0.5">
                {Math.max(score, bestScore)} PTS
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Accuracy</div>
              <div className="text-base font-black text-[#8BCB3D] font-mono mt-0.5">
                {accuracy}%
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Max Combo</div>
              <div className="text-base font-black text-amber-600 font-mono mt-0.5">
                {maxCombo}x
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Tournament Points</div>
              <div className="text-base font-black text-[#8BCB3D] font-mono mt-0.5">
                +{score} PTS
              </div>
            </div>
          </div>

          {/* Action Buttons: Play Again & Exit */}
          <div className="w-full max-w-xs space-y-2">
            <button
              id="piano-play-again-btn"
              onClick={() => handleStartGame(selectedSongIndex)}
              className="w-full py-3.5 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              id="piano-exit-result-btn"
              onClick={onExit}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17202A] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
