/**
 * Candy Blast - Professional Mobile Match-3 Game
 * 
 * Commercial-Quality 8x8 Mobile Match-3 Implementation:
 * - 8x8 Grid with 6 Original pieces (Red Jelly, Blue Gem, Yellow Hexagon,
 *   Orange Sphere, Purple Candy, Green Crystal)
 * - Pure SWIPE Gesture Control (One Swipe = One Move, Threshold 20-28px)
 * - 4-Match Line Clears (Horizontal/Vertical), 5-Match Color Bombs, L/T 3x3 Area Bombs
 * - Special Combinations: Line+Line (Cross Laser), Bomb+Line (Mega Triple), Bomb+Bomb (5x5 Shockwave),
 *   Color+Special (Transform & Multi-Detonate), Color+Color (Cosmic Board Wipe)
 * - Multi-Phase Special Candy Creation: Anticipation -> Energy Buildup -> Peak -> Settle
 * - Multi-Phase Special Candy Activation: Anticipation Flash -> Detonation -> Shockwave & Localized Shake -> Staggered Destruction -> Cascade Refill
 * - Dynamic Chain Reactions with progressive harmonic intervals
 * - Dedicated Web Audio Synthesizer with strict priority and zero clipping
 * - 2-Minute Session (02:00) with calibrated skill-based scoring capped at 400
 * - Standardized Top HUD [SCORE] [TIME] [SOUND] [PAUSE]
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CandyPiece, Position, SpecialType, CandyType, FloatingScore, BlastEffect, Particle, GameStats, SpecialComboAnimation } from './types';
import { 
  BOARD_ROWS, 
  BOARD_COLS, 
  createInitialBoard, 
  createCandyPiece,
  isAdjacent, 
  getSwipeTarget, 
  findMatches, 
  expandSpecialTriggers, 
  handleSpecialComboSwap,
  getSingleSpecialBlastInfo,
  applyGravity, 
  refillBoard, 
  hasPossibleMoves 
} from './matchLogic';
import { CandyGraphic } from './candyArt';
import { CandyAudio } from './candyAudio';
import { SpecialComboLayer } from './SpecialComboLayer';
import { ExplosionCanvas, ExplosionCanvasHandle } from './ExplosionCanvas';
import { GameDefinition } from '../../types';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Award, 
  Clock,
  ArrowLeft
} from 'lucide-react';

interface CandyBlastGameProps {
  game: GameDefinition;
  onGameOver: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

const TOTAL_SESSION_SECONDS = 120; // Exactly 2 Minutes (02:00)
const SCORE_CEILING = 400; // Internal score hard limit

const CANDY_HEX_COLORS: Record<CandyType, string> = {
  'red-jelly': '#EF4444',
  'blue-gem': '#3B82F6',
  'yellow-hexagon': '#EAB308',
  'orange-sphere': '#F97316',
  'purple-candy': '#A855F7',
  'green-crystal': '#22C55E',
};

export const CandyBlastGame: React.FC<CandyBlastGameProps> = ({
  game,
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  // Board & Gameplay States
  const [board, setBoard] = useState<(CandyPiece | null)[][]>(() => createInitialBoard());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const [swappingPair, setSwappingPair] = useState<{ from: Position; to: Position } | null>(null);
  const [boardShake, setBoardShake] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  
  // Timer & Metrics
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SESSION_SECONDS);
  const [rawScore, setRawScore] = useState<number>(0);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [status, setStatus] = useState<'playing' | 'paused' | 'game_over'>('playing');
  const [muted, setMuted] = useState<boolean>(!isAudioEnabled);
  
  // Statistics for Results Screen
  const [stats, setStats] = useState<GameStats>({
    matchesMade: 0,
    specialsCreated: 0,
    specialsActivated: 0,
    combosTriggered: 0,
    bestCombo: 1,
    movesMade: 0,
  });

  // FX & Visual Layers
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [blastEffects, setBlastEffects] = useState<BlastEffect[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [specialComboAnim, setSpecialComboAnim] = useState<SpecialComboAnimation | null>(null);
  const [activeSwipeFeedback, setActiveSwipeFeedback] = useState<{ from: Position; to?: Position } | null>(null);
  const explosionCanvasRef = useRef<ExplosionCanvasHandle>(null);

  // Best Score Local Storage
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('teleplay_candy_blast_best_normalized');
      return saved ? Math.min(SCORE_CEILING, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });

  const sessionStartTimeRef = useRef<number>(Date.now());
  const boardRef = useRef(board);
  boardRef.current = board;
  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;
  const statusRef = useRef(status);
  statusRef.current = status;

  // Swipe Drag Tracking State
  const dragRef = useRef<{
    startRow: number;
    startCol: number;
    startX: number;
    startY: number;
    pointerId: number;
    isDone: boolean;
  } | null>(null);

  // Sound sync & cleanup on unmount
  useEffect(() => {
    CandyAudio.setMuted(muted);
    return () => {
      CandyAudio.stopAll();
    };
  }, [muted]);

  // 2-MINUTE COUNTDOWN TIMER (02:00 -> 00:00)
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        // Low time audio tick warning in last 10 seconds
        if (prev <= 11 && prev > 1) {
          CandyAudio.playTimeWarningTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Check for 00:00 expiry
  useEffect(() => {
    if (secondsRemaining === 0 && status === 'playing') {
      if (!isProcessingRef.current) {
        handleEndGame(rawScore);
      }
    }
  }, [secondsRemaining, status, rawScore]);

  // Format MM:SS
  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Spawns floating score indicator above cleared tiles
   */
  const spawnFloatingScore = (points: number, row: number, col: number, label?: string, isCombo = false) => {
    const id = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setFloatingScores((prev) => [...prev, { id, points, x: col, y: row, label, isCombo }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== id));
    }, 850);
  };

  /**
   * Triggers visual blast effect overlay
   */
  const triggerBlastFX = (type: BlastEffect['type'], row?: number, col?: number, color?: string) => {
    const id = `blast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setBlastEffects((prev) => [...prev, { id, type, row, col, color }]);
    setTimeout(() => {
      setBlastEffects((prev) => prev.filter((b) => b.id !== id));
    }, 550);
  };

  /**
   * Triggers subtle, localized board shake
   */
  const triggerBoardShake = (level: 'light' | 'medium' | 'heavy') => {
    setBoardShake(level);
    setTimeout(() => {
      setBoardShake('none');
    }, level === 'heavy' ? 220 : level === 'medium' ? 180 : 120);
  };

  /**
   * Spawns radiant candy sparkle particles
   */
  const spawnParticlesAt = (row: number, col: number, candyType?: CandyType, extraSparks = false) => {
    const colorMap: Record<CandyType, string> = {
      'red-jelly': '#FF3366',
      'blue-gem': '#00E5FF',
      'yellow-hexagon': '#FFD54F',
      'orange-sphere': '#FF6D00',
      'purple-candy': '#E040FB',
      'green-crystal': '#00C853',
    };
    const color = candyType ? colorMap[candyType] : '#FFD54F';

    const newParts: Particle[] = [];
    const count = extraSparks ? 12 : 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = extraSparks ? 2.5 + Math.random() * 3.5 : 1.8 + Math.random() * 2.2;
      newParts.push({
        id: `p_${Date.now()}_${Math.random()}`,
        x: (col / BOARD_COLS) * 100 + 6,
        y: (row / BOARD_ROWS) * 100 + 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: extraSparks ? 5 + Math.random() * 5 : 4 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: extraSparks ? 26 : 20,
      });
    }
    setParticles((prev) => [...prev.slice(-40), ...newParts]);
  };

  // Particle physics loop
  useEffect(() => {
    if (particles.length === 0) return;
    const anim = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.4,
            y: p.y + p.vy * 0.4,
            alpha: Math.max(0, 1 - p.life / p.maxLife),
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife)
      );
    });
    return () => cancelAnimationFrame(anim);
  }, [particles]);

  /**
   * Concludes the match and submits final scores
   */
  const handleEndGame = useCallback((finalRawScore: number) => {
    setStatus('game_over');
    CandyAudio.stopAll();
    CandyAudio.playGameOver();

    // Strictly capped at 400 points
    const finalScore = Math.min(SCORE_CEILING, Math.max(0, Math.round(finalRawScore)));

    // Update best score
    setBestScore((prev) => {
      if (finalScore > prev) {
        try {
          localStorage.setItem('teleplay_candy_blast_best_normalized', finalScore.toString());
        } catch {}
        return finalScore;
      }
      return prev;
    });

    const elapsedSeconds = Math.min(
      TOTAL_SESSION_SECONDS,
      Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000))
    );
    onGameOver(finalScore, elapsedSeconds);
  }, [onGameOver]);

  /**
   * Multi-Stage Cascading Processor Pipeline
   * Handles Special Candy Creation, Activation, Collision, Shake, and Cascades
   */
  const processCascades = useCallback(
    async (
      currentBoard: (CandyPiece | null)[][],
      comboCount = 1,
      swappedPos?: Position
    ): Promise<(CandyPiece | null)[][]> => {
      // 1. Scan for matches
      const { matchedPositions, specialPiecesToCreate } = findMatches(currentBoard, swappedPos);

      if (matchedPositions.length === 0) {
        // Cascade finished. Check for deadlocks
        if (!hasPossibleMoves(currentBoard as CandyPiece[][])) {
          setIsReshuffling(true);
          CandyAudio.playSwap();
          await new Promise((r) => setTimeout(r, 600));
          const reshuffled = createInitialBoard();
          setBoard(reshuffled);
          setIsReshuffling(false);
          return reshuffled;
        }

        // Check if game timer ended while cascade was processing
        if (secondsRemaining <= 0) {
          setTimeout(() => handleEndGame(rawScore), 250);
        }
        return currentBoard;
      }

      // 2. Expand special triggers
      const { allClearedPositions, triggeredEffects } = expandSpecialTriggers(currentBoard, matchedPositions);
      const hasSpecialTriggered = triggeredEffects.length > 0;
      const hasSpecialCreated = specialPiecesToCreate.length > 0;

      if (hasSpecialTriggered) {
        // =====================================================================
        // SPECIAL CANDY ACTIVATION CHOREOGRAPHY (Anticipation -> Flash -> Radial Shockwave -> Staggered Destruction)
        // =====================================================================

        // STAGE 1: ANTICIPATION & INWARD ENERGY SUCTION (140ms)
        CandyAudio.playSpecialActivationAnticipation();
        triggeredEffects.forEach((fx) => {
          if (fx.type === 'bomb-3x3') {
            const pieceAtOrigin = currentBoard[fx.row]?.[fx.col];
            const candyColor = pieceAtOrigin ? CANDY_HEX_COLORS[pieceAtOrigin.type] : '#FFA500';
            explosionCanvasRef.current?.triggerBombAnticipation({ row: fx.row, col: fx.col }, candyColor);
          }
        });

        const chargingBoard = currentBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isOrigin = triggeredEffects.some((fx) => fx.row === piece.row && fx.col === piece.col);
            return isOrigin ? { ...piece, isCharging: true } : piece;
          })
        );
        setBoard(chargingBoard);
        await new Promise((r) => setTimeout(r, 140));

        // STAGE 2: DETONATION CORE FLASH & SHAKE (60ms)
        const isAreaOrColor = triggeredEffects.some((fx) => fx.type === 'bomb-3x3' || fx.type === 'color-rainbow');
        triggerBoardShake(isAreaOrColor ? 'medium' : 'light');

        const flashingBoard = chargingBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isOrigin = triggeredEffects.some((fx) => fx.row === piece.row && fx.col === piece.col);
            return isOrigin ? { ...piece, isCharging: false, isSpecialTriggered: true } : piece;
          })
        );
        setBoard(flashingBoard);

        // STAGE 3: VOLUMETRIC MULTI-LAYER DETONATION & CANVAS VFX
        triggeredEffects.forEach((fx, fxIndex) => {
          triggerBlastFX(fx.type, fx.row, fx.col);
          const pieceAtOrigin = currentBoard[fx.row]?.[fx.col];
          const candyColor = pieceAtOrigin ? CANDY_HEX_COLORS[pieceAtOrigin.type] : '#FFA500';
          const intensity = fxIndex === 0 ? 1.0 : fxIndex === 1 ? 0.78 : 0.6;

          if (fx.type === 'line-h') {
            explosionCanvasRef.current?.triggerLineBlast('horizontal', fx.row, candyColor || '#00E5FF');
            CandyAudio.playLineClear();
          } else if (fx.type === 'line-v') {
            explosionCanvasRef.current?.triggerLineBlast('vertical', fx.col, candyColor || '#00E5FF');
            CandyAudio.playLineClear();
          } else if (fx.type === 'bomb-3x3') {
            explosionCanvasRef.current?.triggerBombExplosion({ row: fx.row, col: fx.col }, 1.7, candyColor || '#FFA500', intensity);
            if (fxIndex === 0) {
              CandyAudio.playBombExplosion();
            } else {
              CandyAudio.playSecondaryExplosion(fxIndex);
            }
          } else if (fx.type === 'color-rainbow') {
            explosionCanvasRef.current?.triggerColorSupernova({ row: fx.row, col: fx.col }, candyColor || '#FF007F');
            CandyAudio.playColorBomb();
          }
        });
        await new Promise((r) => setTimeout(r, 60));

        // STAGE 4: OUTWARD PHYSICAL TRAVELING WAVE & STAGGERED CANDY DESTRUCTION
        const reactingBoard = flashingBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isAffected = allClearedPositions.some((p) => p.row === piece.row && p.col === piece.col);
            if (!isAffected) return piece;

            let minDist = 999;
            triggeredEffects.forEach((fx) => {
              const dist = Math.hypot(piece.row - fx.row, piece.col - fx.col);
              if (dist < minDist) minDist = dist;
            });
            const tier = minDist < 0.6 ? 0 : minDist <= 1.2 ? 1 : minDist <= 1.9 ? 2 : 3;
            const delay = tier * 35;

            explosionCanvasRef.current?.triggerStaggeredImpact(
              { row: piece.row, col: piece.col },
              CANDY_HEX_COLORS[piece.type] || '#FFD700',
              delay
            );

            return { ...piece, isReacting: true, isSpecialTriggered: false, isCharging: false };
          })
        );
        setBoard(reactingBoard);
        await new Promise((r) => setTimeout(r, 140));

        // Controlled collapse & clearing
        const clearingBoard = reactingBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isCleared = allClearedPositions.some((p) => p.row === piece.row && p.col === piece.col);
            return isCleared ? { ...piece, isClearing: true, isReacting: false } : piece;
          })
        );
        setBoard(clearingBoard);
        CandyAudio.playCandyDestructionBatch(allClearedPositions.length);
        await new Promise((r) => setTimeout(r, 130));
      } else {
        // =====================================================================
        // STANDARD 3-MATCH & SPECIAL FORMATION CHOREOGRAPHY
        // =====================================================================
        if (hasSpecialCreated) {
          CandyAudio.playSpecialCharge();
          specialPiecesToCreate.forEach((s) => {
            const hex = CANDY_HEX_COLORS[s.candyType] || '#FFD700';
            explosionCanvasRef.current?.triggerCreationGather(s.pos, hex);
          });
        }

        // Matched candies pull toward creation point
        const anticipationBoard = currentBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isMatched = allClearedPositions.some((p) => p.row === piece.row && p.col === piece.col);
            const targetSpecial = hasSpecialCreated
              ? specialPiecesToCreate.find((s) => s.pos.row === piece.row && s.pos.col === piece.col)
              : null;
            const nearestSpecial = hasSpecialCreated
              ? specialPiecesToCreate[0]
              : null;

            return isMatched
              ? { 
                  ...piece, 
                  isMatched: true, 
                  isFormingSpecial: Boolean(targetSpecial),
                  convergeTarget: hasSpecialCreated && nearestSpecial ? nearestSpecial.pos : undefined
                }
              : piece;
          })
        );
        setBoard(anticipationBoard);

        if (comboCount > 1) {
          CandyAudio.playChainReaction(comboCount);
        } else {
          CandyAudio.playMatch(comboCount);
        }
        await new Promise((r) => setTimeout(r, hasSpecialCreated ? 140 : 90));

        const clearingBoard = anticipationBoard.map((row) =>
          row.map((piece) => {
            if (!piece) return null;
            const isCleared = allClearedPositions.some((p) => p.row === piece.row && p.col === piece.col);
            return isCleared ? { ...piece, isClearing: true, isMatched: false, convergeTarget: undefined } : piece;
          })
        );
        setBoard(clearingBoard);
        await new Promise((r) => setTimeout(r, 130));
      }

      // Update Statistics
      setStats((prev) => ({
        ...prev,
        matchesMade: prev.matchesMade + 1,
        specialsCreated: prev.specialsCreated + specialPiecesToCreate.length,
        specialsActivated: prev.specialsActivated + triggeredEffects.length,
        combosTriggered: comboCount > 1 ? prev.combosTriggered + 1 : prev.combosTriggered,
        bestCombo: Math.max(prev.bestCombo, comboCount),
      }));

      // CALIBRATED SKILL-BASED SCORE ALGORITHM
      const basePts = allClearedPositions.length * 1.0;
      const specialSpawnBonus = specialPiecesToCreate.reduce((acc, s) => {
        return acc + (s.type === 'color-bomb' ? 10 : s.type === 'area-bomb' ? 6 : 5);
      }, 0);
      const specialTriggerBonus = triggeredEffects.length * 6;
      const comboMult = comboCount === 1 ? 1 : comboCount === 2 ? 1.15 : comboCount === 3 ? 1.3 : comboCount === 4 ? 1.45 : 1.6;
      const earnedPoints = Math.round((basePts + specialSpawnBonus + specialTriggerBonus) * comboMult);

      setRawScore((prev) => Math.min(SCORE_CEILING, prev + earnedPoints));
      setComboMultiplier(comboCount);

      // Spawn floating score
      const centerTile = allClearedPositions[Math.floor(allClearedPositions.length / 2)] || { row: 3, col: 3 };
      spawnFloatingScore(
        earnedPoints, 
        centerTile.row, 
        centerTile.col, 
        comboCount > 1 ? `COMBO x${comboCount}` : undefined, 
        comboCount > 1
      );

      // STAGE D: REMOVE MATCHED PIECES AND SPAWN SPECIALS (Anticipation -> Peak -> Settle)
      const postClearBoard: (CandyPiece | null)[][] = currentBoard.map((row) =>
        row.map((piece) => {
          if (!piece) return null;
          const isCleared = allClearedPositions.some((p) => p.row === piece.row && p.col === piece.col);
          return isCleared ? null : piece;
        })
      );

      // Place newly created specials with isSpawningSpecial: true
      if (specialPiecesToCreate.length > 0) {
        specialPiecesToCreate.forEach(({ type: sType, candyType, pos }) => {
          const newPiece = createCandyPiece(pos.row, pos.col, candyType, sType);
          newPiece.isSpawningSpecial = true;
          postClearBoard[pos.row][pos.col] = newPiece;

          // Special creation confirmation audio
          if (sType === 'color-bomb') CandyAudio.playColorBombFormed();
          else if (sType === 'area-bomb') CandyAudio.playBombFormed();
          else CandyAudio.playLineFormed();

          // Particle burst around newly formed special
          spawnParticlesAt(pos.row, pos.col, candyType, true);
        });

        setBoard(postClearBoard.map((rArr) => [...rArr]));
        await new Promise((r) => setTimeout(r, 160)); // Allow special creation peak animation to shine

        // Smoothly settle special back to normal state
        specialPiecesToCreate.forEach(({ pos }) => {
          const piece = postClearBoard[pos.row][pos.col];
          if (piece) piece.isSpawningSpecial = false;
        });
      }

      // STAGE E: SHORT PAUSE BEFORE GRAVITY GLIDE (60ms)
      await new Promise((r) => setTimeout(r, 60));

      // STAGE F: GRAVITY GLIDE (160ms)
      const { newBoard: gravityBoard } = applyGravity(postClearBoard);
      setBoard(gravityBoard);
      await new Promise((r) => setTimeout(r, 160));

      // STAGE G: TOP REFILL (160ms) & Refill Audio
      const { newBoard: refilledBoard } = refillBoard(gravityBoard);
      CandyAudio.playRefillCascade();
      setBoard(refilledBoard);
      await new Promise((r) => setTimeout(r, 160));

      // STAGE H: RECURSIVE CASCADE CHECK (Sequential timing separation for clear chain reactions)
      return processCascades(refilledBoard, comboCount + 1);
    },
    [secondsRemaining, rawScore, handleEndGame]
  );

  /**
   * DIRECT SPECIAL CANDY ACTIVATION (TAP ON SPECIAL CANDY)
   * Sequential Interaction Flow:
   * TAP -> RAPID CHARGE (0-80ms) -> FLASH (80-160ms) -> DETONATION & SHOCKWAVE (160-300ms) ->
   * STAGGERED DESTRUCTION (300-480ms) -> SECONDARY SPECIALS HIT (100ms gap) -> SCORE POPUP ->
   * SHORT PAUSE (60ms) -> GRAVITY GLIDE (160ms) -> TOP REFILL (160ms) -> RECURSIVE CASCADE
   */
  const activateSpecialCandyDirect = async (pos: Position) => {
    if (isProcessingRef.current || status !== 'playing' || secondsRemaining <= 0) return;

    const piece = board[pos.row]?.[pos.col];
    if (!piece || piece.special === 'none' || piece.isSpecialTriggered || piece.isClearing) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setSelectedTile(null);

    // 1. PHASE 1: RAPID CHARGE ANTICIPATION (0–80ms)
    CandyAudio.playSpecialActivationAnticipation();
    const chargeBoard = board.map((rArr) =>
      rArr.map((p) => {
        if (!p) return null;
        return p.row === pos.row && p.col === pos.col
          ? { ...p, isCharging: true, isSelected: true }
          : p;
      })
    );
    setBoard(chargeBoard);
    await new Promise((r) => setTimeout(r, 80));

    // 2. PHASE 2: BRIGHT FLASH (80–160ms)
    const flashBoard = chargeBoard.map((rArr) =>
      rArr.map((p) => {
        if (!p) return null;
        return p.row === pos.row && p.col === pos.col
          ? { ...p, isCharging: false, isSpecialTriggered: true, isSelected: true }
          : p;
      })
    );
    setBoard(flashBoard);
    await new Promise((r) => setTimeout(r, 80));

    // 3. DETERMINE AFFECTED CELLS LIST FIRST
    const blastInfo = getSingleSpecialBlastInfo(board, pos);
    if (!blastInfo) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    const { type: blastType, affectedPositions, description } = blastInfo;
    const pieceColor = CANDY_HEX_COLORS[piece.type] || '#FFA500';

    // 4. POWER ACTIVATION & RADIAL BLAST FX (Canvas-accelerated + Shake)
    triggerBlastFX(blastType, pos.row, pos.col);
    triggerBoardShake(blastType === 'bomb-3x3' || blastType === 'color-rainbow' ? 'medium' : 'light');

    if (blastType === 'bomb-3x3') {
      explosionCanvasRef.current?.triggerBombExplosion(pos, 1.6, pieceColor || '#FFA500');
      CandyAudio.playBombExplosion();
    } else if (blastType === 'color-rainbow') {
      explosionCanvasRef.current?.triggerColorSupernova(pos, pieceColor || '#FF007F');
      CandyAudio.playColorBomb();
    }

    // 5. STAGGERED AFFECTED CANDIES REACTION (20–40ms stagger per tier)
    const reactingBoard = flashBoard.map((rArr) =>
      rArr.map((p) => {
        if (!p) return null;
        const isAffected = affectedPositions.some((ap) => ap.row === p.row && ap.col === p.col);
        if (!isAffected) return p;

        const dist = Math.hypot(p.row - pos.row, p.col - pos.col);
        const tier = dist < 0.5 ? 0 : dist <= 1.2 ? 1 : dist <= 1.8 ? 2 : 3;
        const delay = tier * 30;

        explosionCanvasRef.current?.triggerStaggeredImpact(
          { row: p.row, col: p.col },
          CANDY_HEX_COLORS[p.type] || '#FFD700',
          delay
        );

        return { ...p, isReacting: true, isSpecialTriggered: false, isSelected: false, isCharging: false };
      })
    );
    setBoard(reactingBoard);
    await new Promise((r) => setTimeout(r, 120));

    // 6. CONTROLLED CANDY DESTRUCTION (140ms)
    const clearingBoard = reactingBoard.map((rArr) =>
      rArr.map((p) => {
        if (!p) return null;
        const isAffected = affectedPositions.some((ap) => ap.row === p.row && ap.col === p.col);
        return isAffected ? { ...p, isClearing: true, isReacting: false } : p;
      })
    );
    setBoard(clearingBoard);
    CandyAudio.playCandyDestructionBatch(affectedPositions.length);
    await new Promise((r) => setTimeout(r, 140));

    // 7. SECONDARY SPECIAL CANDY HIT HANDLING (Chain Reaction with variation)
    const secondarySpecials = affectedPositions
      .map((ap) => board[ap.row]?.[ap.col])
      .filter((p): p is CandyPiece => Boolean(p && p.special !== 'none' && (p.row !== pos.row || p.col !== pos.col)));

    const allClearedPositions = [...affectedPositions];
    let totalSecondaryPoints = 0;
    let chainIndex = 1;

    for (const secondaryPiece of secondarySpecials) {
      const secondaryBlast = getSingleSpecialBlastInfo(board, { row: secondaryPiece.row, col: secondaryPiece.col });
      if (secondaryBlast) {
        // Short sequential activation delay (80ms)
        await new Promise((r) => setTimeout(r, 80));

        // Secondary special activates & detonates
        CandyAudio.playSecondaryExplosion(chainIndex);
        triggerBlastFX(secondaryBlast.type, secondaryPiece.row, secondaryPiece.col);
        triggerBoardShake('light');

        const secColor = CANDY_HEX_COLORS[secondaryPiece.type] || '#FFD700';
        if (secondaryBlast.type === 'bomb-3x3') {
          explosionCanvasRef.current?.triggerBombExplosion(
            { row: secondaryPiece.row, col: secondaryPiece.col },
            1.2,
            secColor
          );
        } else {
          explosionCanvasRef.current?.triggerColorSupernova(
            { row: secondaryPiece.row, col: secondaryPiece.col },
            secColor
          );
        }

        // Secondary affected candies react & clear with staggered delay
        const secondaryReacting = board.map((rArr) =>
          rArr.map((p) => {
            if (!p) return null;
            const isSecAffected = secondaryBlast.affectedPositions.some((ap) => ap.row === p.row && ap.col === p.col);
            return isSecAffected ? { ...p, isReacting: true } : p;
          })
        );
        setBoard(secondaryReacting);
        await new Promise((r) => setTimeout(r, 100));

        const secondaryClearing = secondaryReacting.map((rArr) =>
          rArr.map((p) => {
            if (!p) return null;
            const isSecAffected = secondaryBlast.affectedPositions.some((ap) => ap.row === p.row && ap.col === p.col);
            return isSecAffected ? { ...p, isClearing: true, isReacting: false } : p;
          })
        );
        setBoard(secondaryClearing);
        CandyAudio.playCandyDestructionBatch(secondaryBlast.affectedPositions.length);
        await new Promise((r) => setTimeout(r, 110));

        secondaryBlast.affectedPositions.forEach((sp) => {
          if (!allClearedPositions.some((cp) => cp.row === sp.row && cp.col === sp.col)) {
            allClearedPositions.push(sp);
          }
        });
        totalSecondaryPoints += 12;
        chainIndex++;
      }
    }

    // 8. SCORE CALCULATION & COMPACT FLOATING SCORE
    const earnedPoints = Math.min(
      40,
      Math.round(allClearedPositions.length * 1.2 + (blastType === 'color-rainbow' ? 18 : blastType === 'bomb-3x3' ? 14 : 12) + totalSecondaryPoints)
    );

    setRawScore((prev) => Math.min(SCORE_CEILING, prev + earnedPoints));
    setStats((prev) => ({
      ...prev,
      specialsActivated: prev.specialsActivated + 1 + secondarySpecials.length,
      combosTriggered: secondarySpecials.length > 0 ? prev.combosTriggered + 1 : prev.combosTriggered,
    }));
    spawnFloatingScore(earnedPoints, pos.row, pos.col, description, secondarySpecials.length > 0);

    // 9. STAGE: SHORT PAUSE BEFORE FALL (60ms)
    await new Promise((r) => setTimeout(r, 60));

    // 10. BOARD REMOVES DESTROYED CELLS & APPLIES GRAVITY
    const emptiedBoard = board.map((rArr) =>
      rArr.map((p) => {
        if (!p) return null;
        return allClearedPositions.some((cp) => cp.row === p.row && cp.col === p.col) ? null : p;
      })
    );

    const { newBoard: gravityBoard } = applyGravity(emptiedBoard);
    setBoard(gravityBoard);
    await new Promise((r) => setTimeout(r, 160));

    // 11. TOP REFILL & REFILL AUDIO
    const { newBoard: refilledBoard } = refillBoard(gravityBoard);
    CandyAudio.playRefillCascade();
    setBoard(refilledBoard);
    await new Promise((r) => setTimeout(r, 160));

    // 12. CHECK NEW MATCHES (CASCADE PIPELINE)
    await processCascades(refilledBoard, 1);

    isProcessingRef.current = false;
    setIsProcessing(false);
  };

  /**
   * Performs Swap between two adjacent cells
   * ONE SWIPE = ONE MOVE
   */
  const executeSwap = async (pos1: Position, pos2: Position) => {
    if (isProcessingRef.current || status !== 'playing' || secondsRemaining <= 0) return;
    if (!isAdjacent(pos1, pos2)) return;

    const piece1 = board[pos1.row]?.[pos1.col];
    const piece2 = board[pos2.row]?.[pos2.col];
    if (!piece1 || !piece2) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setSelectedTile(null);

    // Track move count
    setStats((prev) => ({ ...prev, movesMade: prev.movesMade + 1 }));

    // 1. Check for SPECIAL COMBO SWAPS (Color+Color, Color+Special, Line+Line, Bomb+Line, Bomb+Bomb)
    const specialCombo = handleSpecialComboSwap(piece1, pos1, piece2, pos2, board);

    if (specialCombo.isSpecialCombo) {
      setSwappingPair({ from: pos1, to: pos2 });
      CandyAudio.playSwap();

      // Determine Animation Type
      let animType: SpecialComboAnimation['type'] = 'bomb-5x5';
      if (specialCombo.description.includes('COSMIC')) animType = 'cosmic-board-wipe';
      else if (specialCombo.description.includes('RAINBOW LASER')) animType = 'rainbow-laser-cascade';
      else if (specialCombo.description.includes('RAINBOW BOMB')) animType = 'rainbow-bomb-shockwave';
      else if (specialCombo.description.includes('RAINBOW COLOR')) animType = 'rainbow-color-blast';
      else if (specialCombo.description.includes('CROSS LASER')) animType = 'cross-laser';
      else if (specialCombo.description.includes('MEGA TRIPLE')) animType = 'mega-triple';
      else if (specialCombo.description.includes('5x5')) animType = 'bomb-5x5';

      // PHASE 1: Convergence & Energy Tether Anticipation (160ms)
      setSpecialComboAnim({
        id: `combo_${Date.now()}`,
        type: animType,
        pos1,
        pos2,
        targetPositions: specialCombo.clearedPositions,
        targetColor: piece1.special === 'color-bomb' ? piece2.type : piece1.type,
        phase: 'anticipation',
      });
      CandyAudio.playComboAnticipation();

      await new Promise((r) => setTimeout(r, 160));
      setSwappingPair(null);

      // PHASE 2: Concentrated Fusion Detonation & Board Reaction (160ms)
      setSpecialComboAnim((prev) => (prev ? { ...prev, phase: 'detonation' } : null));
      triggerBoardShake('heavy');

      // Trigger Specific Unique Audio & Canvas VFX for each combo
      if (animType === 'bomb-5x5') {
        explosionCanvasRef.current?.triggerBombExplosion(pos1, 2.5, '#FFA500');
        CandyAudio.playBombBombCombo();
      } else if (animType === 'cross-laser') {
        explosionCanvasRef.current?.triggerLineBlast('horizontal', pos1.row, '#00E5FF');
        explosionCanvasRef.current?.triggerLineBlast('vertical', pos1.col, '#00E5FF');
        CandyAudio.playLineLineCombo();
      } else if (animType === 'mega-triple') {
        explosionCanvasRef.current?.triggerBombExplosion(pos1, 1.8, '#FFA500');
        explosionCanvasRef.current?.triggerLineBlast('horizontal', pos1.row, '#00E5FF');
        CandyAudio.playLineBombCombo();
      } else if (animType === 'rainbow-laser-cascade' || animType === 'rainbow-bomb-shockwave') {
        explosionCanvasRef.current?.triggerBombExplosion(pos1, 2.0, '#FF007F');
        CandyAudio.playColorSpecialCascade();
      } else if (animType === 'cosmic-board-wipe') {
        explosionCanvasRef.current?.triggerColorSupernova(pos1, '#FF007F');
        CandyAudio.playColorColorCosmicWipe();
      } else {
        CandyAudio.playColorBomb();
      }

      // Affected candies react to the combo energy (flash + scale)
      const reactingBoard = board.map((rArr) =>
        rArr.map((p) => {
          if (!p) return null;
          return specialCombo.clearedPositions.some((cp) => cp.row === p.row && cp.col === p.col)
            ? { ...p, isReacting: true }
            : p;
        })
      );
      setBoard(reactingBoard);
      await new Promise((r) => setTimeout(r, 150));

      // PHASE 3: Controlled Destruction & Point Scoring (160ms)
      const clearedBoard = reactingBoard.map((rArr) =>
        rArr.map((p) => {
          if (!p) return null;
          return specialCombo.clearedPositions.some((cp) => cp.row === p.row && cp.col === p.col)
            ? { ...p, isClearing: true, isReacting: false }
            : p;
        })
      );
      setBoard(clearedBoard);
      CandyAudio.playCandyDestructionBatch(specialCombo.clearedPositions.length);

      // Calibrated points for special combos (+15 to +35 pts)
      const comboPts = Math.min(
        40,
        specialCombo.description.includes('COSMIC')
          ? 35
          : specialCombo.description.includes('RAINBOW')
          ? 25
          : specialCombo.description.includes('5x5')
          ? 22
          : specialCombo.description.includes('TRIPLE')
          ? 20
          : 15
      );

      setRawScore((prev) => Math.min(SCORE_CEILING, prev + comboPts));
      setStats((prev) => ({
        ...prev,
        specialsActivated: prev.specialsActivated + 2,
        combosTriggered: prev.combosTriggered + 1,
      }));
      spawnFloatingScore(comboPts, pos2.row, pos2.col, specialCombo.description, true);

      await new Promise((r) => setTimeout(r, 160));
      setSpecialComboAnim(null);

      // PHASE 4: Gravity & Cascade Refill
      const emptiedBoard = board.map((rArr) =>
        rArr.map((p) => {
          if (!p) return null;
          return specialCombo.clearedPositions.some((cp) => cp.row === p.row && cp.col === p.col) ? null : p;
        })
      );

      const { newBoard: gravityB } = applyGravity(emptiedBoard);
      setBoard(gravityB);
      await new Promise((r) => setTimeout(r, 160));

      const { newBoard: refilledB } = refillBoard(gravityB);
      CandyAudio.playRefillCascade();
      setBoard(refilledB);
      await new Promise((r) => setTimeout(r, 160));

      await processCascades(refilledB, 2);
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // 2. STANDARD SWAP
    setSwappingPair({ from: pos1, to: pos2 });
    CandyAudio.playSwap();

    const swappedBoard = board.map((rArr) => [...rArr]);
    swappedBoard[pos1.row][pos1.col] = { ...piece2, row: pos1.row, col: pos1.col };
    swappedBoard[pos2.row][pos2.col] = { ...piece1, row: pos2.row, col: pos2.col };

    setBoard(swappedBoard);
    await new Promise((r) => setTimeout(r, 160));
    setSwappingPair(null);

    // Verify if swap creates any 3+ matches
    const { matchedPositions } = findMatches(swappedBoard, pos2);

    if (matchedPositions.length === 0) {
      // INVALID SWAP: Animate swap backward (spring back)
      CandyAudio.playInvalid();
      const revertedBoard = board.map((rArr) => [...rArr]);
      setBoard(revertedBoard);
      await new Promise((r) => setTimeout(r, 160));
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // VALID SWAP: Run cascade pipeline
    await processCascades(swappedBoard, 1, pos2);
    isProcessingRef.current = false;
    setIsProcessing(false);
  };

  /**
   * SWIPE GESTURE HANDLERS (Pointer & Touch with 20-28px threshold)
   */
  const handlePointerDown = (e: React.PointerEvent, row: number, col: number) => {
    if (isProcessingRef.current || status !== 'playing' || secondsRemaining <= 0) return;
    
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    dragRef.current = {
      startRow: row,
      startCol: col,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      isDone: false,
    };

    setActiveSwipeFeedback({ from: { row, col } });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.isDone || isProcessingRef.current || status !== 'playing' || secondsRemaining <= 0) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const target = getSwipeTarget(
      { row: dragRef.current.startRow, col: dragRef.current.startCol },
      dx,
      dy,
      22 // 22px swipe threshold
    );

    if (target) {
      dragRef.current.isDone = true;
      setActiveSwipeFeedback(null);
      setSelectedTile(null);
      executeSwap(
        { row: dragRef.current.startRow, col: dragRef.current.startCol },
        target
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current && !dragRef.current.isDone && !isProcessingRef.current && status === 'playing' && secondsRemaining > 0) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const target = getSwipeTarget(
        { row: dragRef.current.startRow, col: dragRef.current.startCol },
        dx,
        dy,
        18 // 18px threshold on release
      );

      if (target) {
        dragRef.current.isDone = true;
        setSelectedTile(null);
        executeSwap(
          { row: dragRef.current.startRow, col: dragRef.current.startCol },
          target
        );
      } else {
        // TAP INTERACTION (No swipe motion detected)
        const row = dragRef.current.startRow;
        const col = dragRef.current.startCol;
        const piece = board[row]?.[col];

        if (piece && piece.special !== 'none') {
          // DIRECT TAP ON SPECIAL CANDY
          activateSpecialCandyDirect({ row, col });
        } else if (piece) {
          // TAP ON REGULAR CANDY (Tap-to-Swap / Select)
          if (selectedTile) {
            if (selectedTile.row === row && selectedTile.col === col) {
              setSelectedTile(null);
            } else if (isAdjacent(selectedTile, { row, col })) {
              const fromTile = { ...selectedTile };
              setSelectedTile(null);
              executeSwap(fromTile, { row, col });
            } else {
              setSelectedTile({ row, col });
              CandyAudio.playTap();
            }
          } else {
            setSelectedTile({ row, col });
            CandyAudio.playTap();
          }
        }
      }
    }

    dragRef.current = null;
    setActiveSwipeFeedback(null);
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
    setActiveSwipeFeedback(null);
  };

  /**
   * Restart 2-Minute Match
   */
  const handleRestart = () => {
    CandyAudio.stopAll();
    const freshBoard = createInitialBoard();
    setBoard(freshBoard);
    setRawScore(0);
    setSecondsRemaining(TOTAL_SESSION_SECONDS);
    setComboMultiplier(1);
    setIsProcessing(false);
    setStatus('playing');
    setStats({
      matchesMade: 0,
      specialsCreated: 0,
      specialsActivated: 0,
      combosTriggered: 0,
      bestCombo: 1,
      movesMade: 0,
    });
    sessionStartTimeRef.current = Date.now();
    CandyAudio.playTap();
  };

  const handlePause = () => {
    CandyAudio.stopAll();
    setStatus('paused');
  };

  const handleExitToArcade = () => {
    CandyAudio.stopAll();
    onExit();
  };

  // Time warning styling state
  const isTimeLow = secondsRemaining <= 30;
  const isTimeCritical = secondsRemaining <= 10;

  // Board shake CSS transform
  const getBoardShakeStyle = () => {
    if (boardShake === 'heavy') {
      return 'translate(2px, -2px) scale(0.995)';
    }
    if (boardShake === 'medium') {
      return 'translate(-1.5px, 1.5px)';
    }
    if (boardShake === 'light') {
      return 'translate(1px, -1px)';
    }
    return 'none';
  };

  return (
    <div 
      className="relative w-full max-w-md mx-auto flex flex-col items-center select-none rounded-3xl overflow-hidden shadow-2xl min-h-[600px] font-['Plus_Jakarta_Sans',sans-serif] border-2 border-[#0A7C45]/40"
      style={{
        background: 'radial-gradient(circle at 50% 25%, #072a44 0%, #071B2D 60%, #030d17 100%)',
      }}
    >
      {/* AMBIENT BACKGROUND CANDY BOKEH PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
        <div className="absolute top-10 left-6 w-32 h-32 rounded-full bg-[#00C853]/20 blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-4 w-40 h-40 rounded-full bg-[#FFD54F]/15 blur-3xl" />
        <div className="absolute bottom-12 left-10 w-36 h-36 rounded-full bg-[#00E5FF]/15 blur-2xl" />
        <div className="absolute top-20 right-16 w-3 h-3 rounded-full bg-[#FFD54F] blur-xs animate-ping" />
        <div className="absolute bottom-32 right-12 w-2 h-2 rounded-full bg-[#00C853] blur-xs animate-ping" />
      </div>

      {/* 1. STANDARDIZED TOP GAME HUD: [EXIT] [SCORE] [TIME] [SOUND] [PAUSE] */}
      <div 
        id="candy-blast-hud"
        className="w-full bg-[#071B2D]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-[#0A7C45]/40 flex items-center justify-between gap-2 z-20 shadow-md shrink-0"
      >
        {/* BUTTON 0: EXIT */}
        <button
          id="candy-exit-btn"
          onClick={handleExitToArcade}
          className="h-11 px-3 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:scale-95 border border-white/15 flex items-center gap-1 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
          title="Exit Game"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">EXIT</span>
        </button>

        {/* BUTTON 1: SCORE (Candy Theme) */}
        <div 
          id="candy-score-card"
          className="flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl bg-gradient-to-b from-[#0A7C45]/30 to-[#072a44]/80 border border-[#00C853]/50 text-white flex items-center gap-2 shadow-xs transition-transform"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2)' }}
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FFD54F] to-[#FF8F00] flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-xs">
            ★
          </div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-[8px] sm:text-[9px] font-black text-[#FFD54F] uppercase tracking-wider">
              SCORE
            </span>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight tabular-nums truncate">
                {Math.min(SCORE_CEILING, rawScore)}
              </span>
              {comboMultiplier > 1 && (
                <span className="text-[8px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded animate-pulse shrink-0">
                  x{comboMultiplier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BUTTON 2: TIME (Countdown 02:00 -> 00:00) */}
        <div 
          id="candy-time-card"
          className={`flex-1 min-w-0 h-11 px-2.5 sm:px-3 rounded-2xl border flex items-center gap-2 shadow-xs transition-colors ${
            isTimeCritical
              ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse shadow-rose-900/50'
              : isTimeLow
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
              : 'bg-gradient-to-b from-[#071B2D]/90 to-[#030d17] border-slate-700 text-white'
          }`}
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)' }}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isTimeCritical
              ? 'bg-rose-500 text-white animate-spin'
              : isTimeLow
              ? 'bg-amber-500 text-slate-950'
              : 'bg-gradient-to-tr from-[#00C853] to-[#00E5FF] text-slate-950 font-bold'
          }`}>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
              isTimeCritical ? 'text-rose-400' : isTimeLow ? 'text-amber-400' : 'text-slate-400'
            }`}>
              TIME
            </span>
            <span className="text-sm sm:text-base font-black font-mono tracking-tight tabular-nums">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* BUTTON 3: SOUND (Mute / Unmute Toggle) */}
        <button
          id="candy-sound-toggle"
          onClick={() => setMuted(!muted)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:scale-95 border border-white/15 flex items-center justify-center text-slate-200 transition-all cursor-pointer shadow-xs shrink-0"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX className="w-4.5 h-4.5 text-slate-400" /> : <Volume2 className="w-4.5 h-4.5 text-[#00C853]" />}
        </button>

        {/* BUTTON 4: PAUSE (Pause Game) */}
        <button
          id="candy-pause-toggle"
          onClick={handlePause}
          disabled={status !== 'playing'}
          className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:scale-95 border border-white/15 flex items-center justify-center text-slate-200 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)' }}
          title="Pause Game"
        >
          <Pause className="w-4.5 h-4.5 fill-current text-white/80" />
        </button>
      </div>

      {/* 2. MAIN 8x8 MATCH-3 BOARD STAGE */}
      <div 
        className="relative w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden touch-none z-10"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        
        {/* Floating Score Popups */}
        {floatingScores.map((fs) => (
          <div
            key={fs.id}
            className={`absolute z-40 pointer-events-none font-mono font-black animate-bounce text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
              fs.isCombo ? 'text-[#FFD54F] text-sm sm:text-base scale-110' : 'text-white text-xs sm:text-sm'
            }`}
            style={{
              left: `${(fs.x / BOARD_COLS) * 100 + 4}%`,
              top: `${(fs.y / BOARD_ROWS) * 100 + 2}%`,
            }}
          >
            +{fs.points}
            {fs.label && <div className="text-[9px] font-sans font-black text-[#00C853] uppercase tracking-wider">{fs.label}</div>}
          </div>
        ))}

        {/* Radiant Sparkle Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-30 shadow-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* 8x8 Grid Container with Localized Shake & Contact Glow */}
        <div 
          className="relative bg-[#071B2D]/85 p-2 sm:p-2.5 rounded-2xl border-2 border-[#0A7C45]/50 shadow-[0_8px_30px_rgba(0,0,0,0.6)] max-w-[400px] sm:max-w-[425px] w-full aspect-square flex flex-col justify-between select-none backdrop-blur-sm transition-transform duration-75"
          style={{ transform: getBoardShakeStyle() }}
        >
          
          {/* Unified VFX Layer for Special Blasts & Special+Special Combos */}
          <SpecialComboLayer combo={specialComboAnim} blastEffects={blastEffects} />

          {/* High-Performance Canvas-Accelerated Explosion & Particle FX Layer */}
          <ExplosionCanvas ref={explosionCanvasRef} />

          {/* Reshuffle Overlay */}
          {isReshuffling && (
            <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white animate-in fade-in">
              <Sparkles className="w-8 h-8 text-[#00C853] animate-spin mb-2" />
              <div className="font-black text-sm tracking-wider uppercase">No Moves Left!</div>
              <div className="text-[11px] text-slate-300">Reshuffling candies...</div>
            </div>
          )}

          {/* Grid Rows */}
          {board.map((rowArr, r) => (
            <div key={`row_${r}`} className="flex-1 flex items-center justify-between gap-0.5">
              {rowArr.map((piece, c) => {
                const isSwapping = swappingPair && (
                  (swappingPair.from.row === r && swappingPair.from.col === c) ||
                  (swappingPair.to.row === r && swappingPair.to.col === c)
                );
                const isDragSource = activeSwipeFeedback?.from.row === r && activeSwipeFeedback?.from.col === c;
                const isTileSelected = selectedTile?.row === r && selectedTile?.col === c;

                return (
                  <div
                    key={piece ? piece.id : `empty_${r}_${c}`}
                    onPointerDown={(e) => handlePointerDown(e, r, c)}
                    className={`flex-1 aspect-square rounded-xl flex items-center justify-center relative touch-none cursor-grab active:cursor-grabbing transition-transform ${
                      isTileSelected
                        ? 'bg-white/20 ring-2 ring-[#00E5FF] scale-105 z-20 shadow-[0_0_12px_rgba(0,229,255,0.8)]'
                        : isDragSource
                        ? 'bg-white/20 ring-2 ring-[#FFD54F] scale-105 z-20'
                        : isSwapping
                        ? 'scale-105 z-20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {piece && (
                      <CandyGraphic
                        type={piece.type}
                        special={piece.special}
                        isSelected={piece.isSelected || isTileSelected}
                        isMatched={piece.isMatched}
                        isClearing={piece.isClearing}
                        isReacting={piece.isReacting}
                        isCharging={piece.isCharging}
                        isSpawningSpecial={piece.isSpawningSpecial}
                        isFormingSpecial={piece.isFormingSpecial}
                        isSpecialTriggered={piece.isSpecialTriggered}
                        convergeOffset={piece.convergeTarget ? {
                          x: (piece.convergeTarget.col - piece.col) * 44,
                          y: (piece.convergeTarget.row - piece.row) * 44,
                        } : undefined}
                        size={46}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Swipe Tactile Prompt */}
        <div className="mt-2.5 text-center text-[11px] text-slate-400 font-semibold tracking-wide">
          Swipe in any direction to match 3 or more candies
        </div>
      </div>

      {/* 3. PAUSE OVERLAY MODAL */}
      {status === 'paused' && (
        <div className="absolute inset-0 z-50 bg-[#071B2D]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#0A7C45]/40 border border-[#00C853]/60 text-white flex items-center justify-center mb-3 shadow-xl">
            <Pause className="w-7 h-7 text-[#00C853]" />
          </div>
          <h3 className="text-xl font-black text-white mb-1">Game Paused</h3>
          <p className="text-xs text-slate-300 mb-5 font-mono">
            Score: <strong className="text-[#FFD54F]">{Math.min(SCORE_CEILING, rawScore)}</strong> • Time: <strong>{formatTime(secondsRemaining)}</strong>
          </p>

          <div className="w-full max-w-xs space-y-2.5">
            <button
              onClick={() => setStatus('playing')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0A7C45] to-[#00C853] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Game</span>
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Match</span>
            </button>

            <button
              onClick={handleExitToArcade}
              className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Exit to Arcade
            </button>
          </div>
        </div>
      )}

      {/* 4. FINAL / RESULT SCREEN (Final Score, Best Score, Play Again, Exit - NO /400 text anywhere) */}
      {status === 'game_over' && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#072a44] via-[#071B2D] to-[#030d17] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#00C853]/20 border border-[#00C853]/50 text-[#00C853] text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>Match Completed</span>
          </div>

          {rawScore >= bestScore && rawScore > 0 && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          )}

          {/* FINAL SCORE (Pure number, NEVER show /400) */}
          <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight mb-0.5 drop-shadow-lg">
            {Math.min(SCORE_CEILING, rawScore)}
          </div>
          <div className="text-[11px] text-slate-300 uppercase tracking-widest font-bold mb-5">
            FINAL SCORE
          </div>

          {/* Breakdown Matrix */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2.5 mb-5 text-left">
            <div className="bg-[#071B2D]/90 rounded-2xl p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">BEST SCORE</div>
              <div className="text-amber-400 font-black font-mono text-base">{Math.max(Math.min(SCORE_CEILING, rawScore), bestScore)}</div>
            </div>

            <div className="bg-[#071B2D]/90 rounded-2xl p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">MATCHES MADE</div>
              <div className="text-[#00C853] font-black font-mono text-base">{stats.matchesMade}</div>
            </div>

            <div className="bg-[#071B2D]/90 rounded-2xl p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">SPECIALS CREATED</div>
              <div className="text-[#00E5FF] font-black font-mono text-base">{stats.specialsCreated}</div>
            </div>

            <div className="bg-[#071B2D]/90 rounded-2xl p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">BEST COMBO</div>
              <div className="text-[#FFD54F] font-black font-mono text-base">x{stats.bestCombo}</div>
            </div>
          </div>

          {/* Action Buttons: PLAY AGAIN & EXIT */}
          <div className="w-full max-w-xs space-y-2.5">
            <button
              onClick={handleRestart}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0A7C45] to-[#00C853] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={handleExitToArcade}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-slate-700"
            >
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
