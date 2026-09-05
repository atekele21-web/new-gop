/**
 * World Legends - Premium Mobile Word-Connect Puzzle Game
 * 
 * Gameplay & Architecture:
 * - TOUCH -> DRAG -> CONNECT LETTERS -> RELEASE swipe word formation.
 * - Tactile 3D Golden Wooden Letter Tiles on radial wheel.
 * - Dynamic glowing connection lines following touch gesture.
 * - Premium Carved Wooden Puzzle Board displaying undiscovered & solved words.
 * - Ascending musical tones on letter connections (do-re-mi...).
 * - Seamless automatic level progression upon puzzle completion (no "Next" button).
 * - Tournament Scoring System capped strictly at MAX 400 POINTS.
 * - Results Screen with mandatory REVIEW modal detailing solved vs missed words.
 * - Compact in-game HUD with Pause, Level, Score, Coins, and Sound.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameDefinition, UserProfile } from '../../types';
import { TargetWord, WordRecord, LevelData } from './types';
import { getLevelData, calculateWordPoints } from './puzzleBank';
import { WorldLegendsAudio } from './worldLegendsAudio';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  Shuffle, 
  Trophy, 
  Award, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Coins, 
  FileText,
  Sparkles,
  Flame,
  ArrowLeft
} from 'lucide-react';

interface WorldLegendsGameProps {
  game: GameDefinition;
  profile?: UserProfile;
  onGameOver: (score: number, durationSeconds: number) => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

const TOTAL_SESSION_SECONDS = 120; // 2-minute tournament countdown

export const WorldLegendsGame: React.FC<WorldLegendsGameProps> = ({
  game,
  profile,
  onGameOver,
  onExit,
  isAudioEnabled = true,
}) => {
  // Audio state
  const [isSoundOn, setIsSoundOn] = useState<boolean>(isAudioEnabled);

  useEffect(() => {
    WorldLegendsAudio.setMuted(!isSoundOn);
  }, [isSoundOn]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSoundOn((prev) => !prev);
  };

  // Game Flow States
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'gameover'>('playing');
  const [showReview, setShowReview] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_SESSION_SECONDS);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [bonusPointsNotification, setBonusPointsNotification] = useState<string | null>(null);

  // Level & Puzzle States
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<LevelData>(() => getLevelData(0));
  const [solvedWordMap, setSolvedWordMap] = useState<Record<string, boolean>>({});
  const [sessionWordRecords, setSessionWordRecords] = useState<WordRecord[]>([]);

  // Letter Wheel State
  const [wheelLetters, setWheelLetters] = useState<string[]>(() => [...currentLevel.letters]);
  const [isWheelShuffling, setIsWheelShuffling] = useState<boolean>(false);

  // Drag / Swipe Word Formation State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [invalidShake, setInvalidShake] = useState<boolean>(false);
  const [celebrateLevel, setCelebrateLevel] = useState<boolean>(false);

  // References
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const letterPositionsRef = useRef<{ x: number; y: number; index: number; letter: string }[]>([]);
  const gameStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Initialize level data when level index changes
  const loadLevel = useCallback((levelIdx: number) => {
    const level = getLevelData(levelIdx);
    setCurrentLevel(level);
    setWheelLetters([...level.letters]);
    setSolvedWordMap({});
    setSelectedIndices([]);
    setIsDragging(false);
    setPointerPos(null);
    setCelebrateLevel(false);
  }, []);

  // Update wheel letters when currentLevel changes
  useEffect(() => {
    setWheelLetters([...currentLevel.letters]);
  }, [currentLevel]);

  // Track session timer
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  // Conclude game when time hits 0
  const handleEndGame = useCallback(() => {
    if (gameStateRef.current === 'gameover') return;
    setGameState('gameover');
    gameStateRef.current = 'gameover';

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    WorldLegendsAudio.playGameOver();

    const elapsed = Math.min(TOTAL_SESSION_SECONDS, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    
    // Asynchronously call onGameOver
    setTimeout(() => {
      onGameOver(scoreRef.current, elapsed);
    }, 0);
  }, [onGameOver]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      handleEndGame();
    }
  }, [gameState, timeLeft, handleEndGame]);

  // Restart match
  const handleRestart = () => {
    setCurrentLevelIndex(0);
    loadLevel(0);
    setScore(0);
    setCombo(0);
    setTimeLeft(TOTAL_SESSION_SECONDS);
    setSessionWordRecords([]);
    setShowReview(false);
    setGameState('playing');
    gameStartTimeRef.current = Date.now();
    WorldLegendsAudio.playButton();
  };

  // Format MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Re-calculate letter node positions in wheel container
  const updateLetterPositions = useCallback(() => {
    if (!wheelContainerRef.current) return;
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.36; // 36% radius from center

    const total = wheelLetters.length;
    const positions: { x: number; y: number; index: number; letter: string }[] = [];

    wheelLetters.forEach((letter, i) => {
      // Start from top (-90 deg) and distribute evenly
      const angle = (i * (2 * Math.PI / total)) - (Math.PI / 2);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.push({ x, y, index: i, letter });
    });

    letterPositionsRef.current = positions;
  }, [wheelLetters]);

  useEffect(() => {
    updateLetterPositions();
    window.addEventListener('resize', updateLetterPositions);
    return () => window.removeEventListener('resize', updateLetterPositions);
  }, [updateLetterPositions]);

  // Shuffle letters on wheel
  const handleShuffleWheel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'playing' || isWheelShuffling) return;

    setIsWheelShuffling(true);
    WorldLegendsAudio.playShuffle();

    setWheelLetters((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });

    setTimeout(() => {
      setIsWheelShuffling(false);
      updateLetterPositions();
    }, 250);
  };

  // Find tile node index from pointer client coordinates
  const findTileIndexAt = (clientX: number, clientY: number): number | null => {
    if (!wheelContainerRef.current) return null;
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const threshold = 34; // Touch radius in px
    for (const pos of letterPositionsRef.current) {
      const dist = Math.hypot(pos.x - localX, pos.y - localY);
      if (dist <= threshold) {
        return pos.index;
      }
    }
    return null;
  };

  // TOUCH & DRAG EVENT HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const tileIdx = findTileIndexAt(e.clientX, e.clientY);
    if (tileIdx !== null) {
      setIsDragging(true);
      setSelectedIndices([tileIdx]);
      WorldLegendsAudio.playTileConnect(0);

      if (wheelContainerRef.current) {
        const rect = wheelContainerRef.current.getBoundingClientRect();
        setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || gameState !== 'playing') return;

    if (wheelContainerRef.current) {
      const rect = wheelContainerRef.current.getBoundingClientRect();
      setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    const tileIdx = findTileIndexAt(e.clientX, e.clientY);
    if (tileIdx !== null) {
      // If tile is already selected:
      if (selectedIndices.includes(tileIdx)) {
        // Check if moving backwards to the previous tile in sequence (undo last letter)
        const secondToLast = selectedIndices[selectedIndices.length - 2];
        if (secondToLast === tileIdx) {
          setSelectedIndices((prev) => prev.slice(0, -1));
          WorldLegendsAudio.playTileRemove();
        }
      } else {
        // Add new tile to sequence
        const newIndices = [...selectedIndices, tileIdx];
        setSelectedIndices(newIndices);
        WorldLegendsAudio.playTileConnect(newIndices.length - 1);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setPointerPos(null);

    // Validate the formed word
    const formedWord = selectedIndices.map((idx) => wheelLetters[idx]).join('');
    validateWordSelection(formedWord);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setSelectedIndices([]);
    setPointerPos(null);
  };

  // Validate swiped word
  const validateWordSelection = (formedWord: string) => {
    if (!formedWord || formedWord.length < 2) {
      setSelectedIndices([]);
      return;
    }

    // 1. Check if word is one of the target words on the puzzle board
    const matchedTarget = currentLevel.targetWords.find((w) => w.word === formedWord);

    if (matchedTarget) {
      if (solvedWordMap[formedWord]) {
        // Already discovered: subtle visual bounce
        setInvalidShake(true);
        WorldLegendsAudio.playWordInvalid();
        setTimeout(() => {
          setInvalidShake(false);
          setSelectedIndices([]);
        }, 300);
        return;
      }

      // Valid newly discovered target word!
      const newCombo = combo + 1;
      setCombo(newCombo);

      // Scoring formula: Base word points + combo multiplier (strictly capped at 400)
      const earnedPts = matchedTarget.points + (newCombo > 1 ? newCombo * 5 : 0);
      const newScore = Math.min(400, score + earnedPts);
      setScore(newScore);

      WorldLegendsAudio.playWordSuccess(newCombo);

      // Mark word as solved
      const updatedSolved = { ...solvedWordMap, [formedWord]: true };
      setSolvedWordMap(updatedSolved);

      // Record for session review
      setSessionWordRecords((prev) => [
        ...prev,
        {
          level: currentLevel.levelNumber,
          word: formedWord,
          isSolved: true,
          points: earnedPts,
        },
      ]);

      setSelectedIndices([]);

      // Check if all target words for current level are solved
      const allSolved = currentLevel.targetWords.every((w) => updatedSolved[w.word]);
      if (allSolved) {
        // Level Completed!
        setCelebrateLevel(true);
        WorldLegendsAudio.playLevelComplete();

        // Automatic progression to next level in ~0.8 seconds (NO Next button!)
        setTimeout(() => {
          const nextLevelIdx = currentLevelIndex + 1;
          setCurrentLevelIndex(nextLevelIdx);
          loadLevel(nextLevelIdx);
        }, 850);
      }
      return;
    }

    // 2. Check if word is a bonus dictionary word
    if (currentLevel.bonusWords && currentLevel.bonusWords.includes(formedWord)) {
      if (!solvedWordMap[formedWord]) {
        const bonusPts = 10;
        const newScore = Math.min(400, score + bonusPts);
        setScore(newScore);
        setSolvedWordMap((prev) => ({ ...prev, [formedWord]: true }));
        setBonusPointsNotification(`+${bonusPts} BONUS!`);
        WorldLegendsAudio.playBonusWord();

        setTimeout(() => {
          setBonusPointsNotification(null);
        }, 1200);

        setSelectedIndices([]);
        return;
      }
    }

    // 3. Invalid word: subtle shake, soft error tone, immediate retry
    WorldLegendsAudio.playWordInvalid();
    setInvalidShake(true);
    setCombo(0); // Reset combo

    setTimeout(() => {
      setInvalidShake(false);
      setSelectedIndices([]);
    }, 350);
  };

  const currentSwipedText = selectedIndices.map((i) => wheelLetters[i]).join('');

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px] sm:h-[650px] bg-[#0c311c] rounded-3xl overflow-hidden flex flex-col select-none touch-none shadow-2xl border-4 border-[#B87324] font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ========================================================================= */}
      {/* 1. COMPACT TOP HUD (Light Warm Golden Wood Bar)                           */}
      {/* ========================================================================= */}
      <div 
        className="w-full px-3 py-2 flex items-center justify-between z-20 shrink-0 border-b-2 border-[#8A4F1F]"
        style={{
          background: 'linear-gradient(180deg, #E3B45F 0%, #C98A3D 60%, #B87324 100%)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px #F0C875',
        }}
      >
        {/* Left: Exit/Back, Pause Button & Level Badge */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExit}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-b from-[#F0C875] via-[#E3B45F] to-[#C98A3D] text-[#2A170B] flex items-center gap-1 font-bold text-xs shadow-md border-2 border-[#F0C875] active:scale-90 transition-transform cursor-pointer"
            title="Exit Game"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>EXIT</span>
          </button>

          <button
            onClick={() => setGameState('paused')}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-gradient-to-b from-[#F0C875] via-[#E3B45F] to-[#C98A3D] text-[#2A170B] flex items-center justify-center font-black shadow-md border-2 border-[#F0C875] active:scale-90 transition-transform cursor-pointer"
            style={{ boxShadow: '0 2px 5px rgba(138, 79, 31, 0.4), inset 0 1px 1px #FFFFFF' }}
            title="Pause Game"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>

          <div 
            className="px-2.5 py-1 rounded-xl flex items-center gap-1 border border-[#B87324]"
            style={{
              background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
              boxShadow: 'inset 0 1px 2px #FFFFFF, 0 1px 3px rgba(138, 79, 31, 0.3)',
            }}
          >
            <Compass className="w-3 h-3 text-[#2A170B]" />
            <span className="text-xs font-black text-[#2A170B] font-mono tracking-wide">
              LVL {currentLevel.levelNumber}
            </span>
          </div>
        </div>

        {/* Center: Score Display */}
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="text-[8px] font-black text-[#2A170B]/80 uppercase tracking-widest mb-0.5">
            SCORE
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#2A170B] font-mono tracking-tight tabular-nums drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              {score}
            </span>
            {combo >= 2 && (
              <span className="text-[8px] font-black bg-[#2A170B] text-[#F0C875] px-1 py-0.2 rounded-full animate-pulse flex items-center gap-0.5 ml-0.5 shadow-sm">
                <Flame className="w-2 h-2 fill-[#F0C875] text-[#F0C875]" />
                {combo}x
              </span>
            )}
          </div>
        </div>

        {/* Right: Time, Coins, Sound, Exit */}
        <div className="flex items-center gap-1.5">
          {/* Time Badge */}
          <div 
            className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
              timeLeft <= 15
                ? 'bg-rose-600 border-rose-800 text-white animate-pulse'
                : 'bg-[#F0C875] border-[#B87324] text-[#2A170B]'
            }`}
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <Clock className="w-2.5 h-2.5" />
            <span className="text-xs font-bold font-mono tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          {/* User Coins from Platform */}
          <div 
            className="px-2 py-0.5 rounded-lg bg-[#F0C875] border border-[#B87324] text-[#2A170B] flex items-center gap-1"
            style={{ boxShadow: 'inset 0 1px 1px #FFFFFF, 0 1px 2px rgba(0,0,0,0.2)' }}
            title="Coins"
          >
            <Coins className="w-3 h-3 text-[#B87324] fill-[#B87324]" />
            <span className="text-xs font-black font-mono">{profile?.coins ?? 0}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#F0C875] to-[#E3B45F] hover:brightness-105 text-[#2A170B] flex items-center justify-center border border-[#B87324] active:scale-95 transition-all cursor-pointer shadow-sm"
            title={isSoundOn ? 'Mute Sound' : 'Unmute Sound'}
          >
            {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-50" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GREEN PLAYING FIELD (Rich Felt Surface with Wooden Puzzle Board)       */}
      {/* ========================================================================= */}
      <div 
        className="relative flex-1 w-full flex flex-col justify-between p-2 sm:p-3 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 35%, #168A3A 0%, #0F6F31 60%, #083818 100%)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)',
        }}
      >
        {/* Decorative Green Felt Pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Bonus Points Floating Toast */}
        {bonusPointsNotification && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-[#F0C875] text-[#2A170B] font-black text-xs uppercase tracking-wider shadow-lg animate-bounce border-2 border-[#B87324] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#B87324]" />
            <span>{bonusPointsNotification}</span>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* A. PREMIUM LIGHT WARM WOODEN PUZZLE BOARD                               */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className={`relative w-full max-w-sm mx-auto rounded-2xl p-3 border-3 border-[#B87324] flex flex-col items-center justify-center transition-all duration-300 z-10 ${
            celebrateLevel ? 'scale-105 ring-4 ring-[#F0C875]' : ''
          }`}
          style={{
            background: 'linear-gradient(180deg, #E3B45F 0%, #C98A3D 45%, #B87324 100%)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.45), inset 0 2px 3px #F0C875, inset 0 -3px 5px #8A4F1F',
          }}
        >
          {/* Inner Light Warm Wooden Surface (Visibly Bright Center) */}
          <div 
            className="w-full rounded-xl p-2.5 flex flex-col items-center justify-center gap-2 border-2 border-[#B87324] min-h-[110px]"
            style={{
              background: 'radial-gradient(circle at 50% 40%, #F0C875 0%, #E3B45F 65%, #C98A3D 100%)',
              boxShadow: 'inset 0 3px 6px rgba(138, 79, 31, 0.45), 0 1px 2px rgba(255,255,255,0.4)',
            }}
          >
            {/* Target Words Rows */}
            <div className="flex flex-col items-center justify-center gap-2 w-full">
              {currentLevel.targetWords.map((target, wordIdx) => {
                const isSolved = Boolean(solvedWordMap[target.word]);
                const wordLength = target.word.length;

                return (
                  <div key={wordIdx} className="flex items-center justify-center gap-1.5">
                    {Array.from({ length: wordLength }).map((_, charIdx) => {
                      const letterChar = isSolved ? target.word[charIdx] : null;

                      return (
                        <div
                          key={charIdx}
                          className="relative w-8 h-9 sm:w-9 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                        >
                          {/* Empty Recessed Warm Carved Slot */}
                          <div 
                            className="absolute inset-0 rounded-xl border border-[#8A4F1F]"
                            style={{
                              background: isSolved
                                ? '#168A3A'
                                : 'linear-gradient(180deg, #B87324 0%, #8A4F1F 100%)',
                              boxShadow: 'inset 0 3px 5px rgba(42, 23, 11, 0.65), 0 1px 1px rgba(255,255,255,0.3)',
                            }}
                          />

                          {/* Discovered Tactile Light Golden Wooden Tile */}
                          {isSolved && letterChar && (
                            <div
                              className="absolute inset-0 rounded-xl flex flex-col items-center justify-center animate-in zoom-in-75 duration-200"
                              style={{
                                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
                                boxShadow: '0 4px 8px rgba(138, 79, 31, 0.5), inset 0 2px 2px #F0C875, inset 0 -3px 0 #8A4F1F',
                                border: '2px solid #B87324',
                              }}
                            >
                              <span 
                                className="font-black text-lg sm:text-xl leading-none text-[#2A170B] font-serif select-none"
                                style={{ textShadow: '0 1px 1px rgba(240,200,117,0.8)' }}
                              >
                                {letterChar}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* B. CURRENT SWIPED WORD FLOATING PREVIEW PLAQUE                           */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative w-full flex items-center justify-center h-8 z-10">
          {currentSwipedText ? (
            <div 
              className={`px-4 py-1 rounded-full border-2 border-[#B87324] flex items-center gap-1 font-black text-base tracking-widest uppercase shadow-lg transition-transform ${
                invalidShake ? 'animate-bounce bg-rose-600 border-rose-800 text-white' : 'text-[#2A170B]'
              }`}
              style={{
                background: invalidShake ? undefined : 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(240,200,117,0.6)',
              }}
            >
              {currentSwipedText.split('').map((char, i) => (
                <span key={i} className="text-[#2A170B] drop-shadow-sm font-serif">
                  {char}
                </span>
              ))}
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* C. LETTER WHEEL AREA (Tactile Golden Wooden Tiles + Drag Connection)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative w-full flex items-center justify-center my-auto z-10 shrink-0">
          <div 
            ref={wheelContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center cursor-pointer select-none"
            style={{
              background: 'radial-gradient(circle, rgba(22, 138, 58, 0.45) 0%, rgba(15, 111, 49, 0.75) 60%, rgba(8, 56, 24, 0.95) 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.4)',
              border: '3px solid rgba(227, 180, 95, 0.45)',
            }}
          >
            {/* SVG Connecting Lines between touched tiles */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {selectedIndices.length > 1 && (
                <path
                  d={selectedIndices.reduce((acc, idx, i) => {
                    const pos = letterPositionsRef.current[idx];
                    if (!pos) return acc;
                    return i === 0 ? `M ${pos.x} ${pos.y}` : `${acc} L ${pos.x} ${pos.y}`;
                  }, '')}
                  fill="none"
                  stroke="#F0C875"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(240,200,117,0.9))' }}
                />
              )}

              {/* Line extending to active pointer position */}
              {isDragging && pointerPos && selectedIndices.length > 0 && (
                (() => {
                  const lastIdx = selectedIndices[selectedIndices.length - 1];
                  const lastPos = letterPositionsRef.current[lastIdx];
                  if (!lastPos) return null;
                  return (
                    <line
                      x1={lastPos.x}
                      y1={lastPos.y}
                      x2={pointerPos.x}
                      y2={pointerPos.y}
                      stroke="#F0C875"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="2 2"
                      style={{ filter: 'drop-shadow(0 0 5px rgba(240,200,117,0.7))' }}
                    />
                  );
                })()
              )}
            </svg>

            {/* Center Shuffle Button (Golden Wood) */}
            <button
              onClick={handleShuffleWheel}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={isWheelShuffling || gameState !== 'playing'}
              className="absolute z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full text-[#2A170B] flex items-center justify-center font-black shadow-lg border-2 border-[#F0C875] active:scale-90 transition-transform cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 2px 2px #FFFFFF, inset 0 -3px 0 #8A4F1F',
              }}
              title="Shuffle Letters"
            >
              <Shuffle className={`w-5 h-5 ${isWheelShuffling ? 'animate-spin' : ''}`} />
            </button>

            {/* Tactile Light Golden Wooden Letter Tiles on Radial Wheel */}
            {letterPositionsRef.current.map((pos) => {
              const isSelected = selectedIndices.includes(pos.index);

              return (
                <div
                  key={pos.index}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 w-12 h-14 sm:w-13 sm:h-15 rounded-2xl flex flex-col items-center justify-center transition-all duration-100 ${
                    isSelected
                      ? 'scale-95 ring-4 ring-[#F0C875] shadow-[0_0_16px_rgba(240,200,117,0.95)]'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <div
                    className="w-full h-full rounded-2xl flex flex-col items-center justify-center"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(180deg, #FFF0B8 0%, #F0C875 50%, #E3B45F 100%)'
                        : 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
                      boxShadow: isSelected
                        ? '0 6px 14px rgba(0,0,0,0.4), inset 0 2px 2px #FFFFFF, inset 0 -3px 0 #B87324'
                        : '0 8px 16px rgba(0,0,0,0.4), inset 0 2px 2px #F0C875, inset 0 -4px 0 #8A4F1F',
                      border: isSelected ? '2px solid #F0C875' : '2px solid #B87324',
                    }}
                  >
                    <span 
                      className="font-black text-xl sm:text-2xl leading-none text-[#2A170B] font-serif select-none"
                      style={{ textShadow: '0 1px 1px rgba(255,255,255,0.7)' }}
                    >
                      {pos.letter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PAUSE OVERLAY MODAL                                                    */}
      {/* ========================================================================= */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-40 bg-[#083818]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div 
            className="rounded-3xl p-6 w-full max-w-xs shadow-2xl border-3 border-[#B87324] flex flex-col items-center text-[#2A170B]"
            style={{ 
              background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7), inset 0 2px 3px #FFFFFF' 
            }}
          >
            <div 
              className="w-14 h-14 rounded-2xl text-[#2A170B] flex items-center justify-center mb-3 shadow-lg border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
                boxShadow: '0 3px 6px rgba(0,0,0,0.2), inset 0 1px 2px #FFFFFF',
              }}
            >
              <Pause className="w-7 h-7 fill-current" />
            </div>

            <h3 className="text-xl font-black text-[#2A170B] mb-1">PAUSED</h3>

            <div 
              className="w-full rounded-2xl p-4 my-4 flex flex-col gap-2 border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #E3B45F 0%, #C98A3D 100%)',
                boxShadow: 'inset 0 2px 4px rgba(138,79,31,0.4)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2A170B]/80 uppercase">SCORE</span>
                <span className="text-xl font-black text-[#2A170B] font-mono">{score} / 400</span>
              </div>
              <div className="h-px bg-[#B87324]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2A170B]/80 uppercase">TIME LEFT</span>
                <span className="text-base font-bold text-[#2A170B] font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#8de629] to-[#50960d] hover:brightness-110 active:scale-95 text-[#143002] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-[#b5ff54]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#F0C875] to-[#E3B45F] hover:brightness-105 active:scale-95 text-[#2A170B] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-2 border-[#B87324] shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                onClick={onExit}
                className="w-full py-2 text-xs text-[#2A170B] hover:text-black font-semibold transition-colors cursor-pointer"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FINAL RESULTS SCREEN (Score, Time, Words + Mandatory REVIEW Button)     */}
      {/* ========================================================================= */}
      {gameState === 'gameover' && !showReview && (
        <div className="absolute inset-0 z-40 bg-gradient-to-b from-[#0c311c] via-[#0F6F31] to-[#083818] flex flex-col items-center justify-center p-5 text-center animate-in zoom-in-95 overflow-y-auto">
          
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2A170B] text-xs font-black uppercase tracking-wider mb-2 border-2 border-[#B87324] shadow-md"
            style={{
              background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
            }}
          >
            <Award className="w-4 h-4 text-[#B87324]" />
            <span>SESSION COMPLETE</span>
          </div>

          {/* Final Score */}
          <div className="text-5xl font-black text-[#F0C875] font-mono tracking-tight mb-0.5 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            {score}
          </div>
          <div className="text-[10px] text-[#E3B45F] uppercase tracking-widest font-semibold mb-4">
            FINAL SCORE
          </div>

          {/* Performance Matrix */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-4 text-left">
            <div 
              className="rounded-xl p-2.5 border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              <div className="text-[9px] text-[#8A4F1F] uppercase font-bold">LEVEL REACHED</div>
              <div className="text-[#2A170B] font-black font-mono text-base">
                LEVEL {currentLevel.levelNumber}
              </div>
            </div>

            <div 
              className="rounded-xl p-2.5 border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              <div className="text-[9px] text-[#8A4F1F] uppercase font-bold">WORDS SOLVED</div>
              <div className="text-[#168A3A] font-black font-mono text-base">
                {sessionWordRecords.length}
              </div>
            </div>

            <div 
              className="col-span-2 rounded-xl p-2.5 border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              <div className="text-[9px] text-[#8A4F1F] uppercase font-bold">TIME SPENT</div>
              <div className="text-[#2A170B] font-black font-mono text-sm">
                {formatTime(TOTAL_SESSION_SECONDS - timeLeft)}
              </div>
            </div>
          </div>

          {/* Action Buttons: REVIEW (Mandatory) & PLAY AGAIN & EXIT */}
          <div className="w-full max-w-xs space-y-2">
            <button
              onClick={() => setShowReview(true)}
              className="w-full py-3 rounded-xl hover:brightness-110 active:scale-95 text-[#2A170B] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border-2 border-[#B87324]"
              style={{
                background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px #FFFFFF',
              }}
            >
              <FileText className="w-4 h-4" />
              <span>REVIEW</span>
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-xl bg-gradient-to-b from-[#8de629] to-[#50960d] hover:brightness-110 active:scale-95 text-[#143002] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-[#b5ff54]"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2.5 rounded-xl text-[#F0C875] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-[#B87324]/60 bg-[#083818]/60"
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MANDATORY REVIEW MODAL (Details Solved vs Missed Words)                */}
      {/* ========================================================================= */}
      {showReview && (
        <div className="absolute inset-0 z-50 bg-[#083818]/95 backdrop-blur-md flex flex-col p-4 text-center animate-in fade-in overflow-hidden">
          
          {/* Top Review Header */}
          <div 
            className="flex items-center justify-between p-2.5 rounded-xl border-2 border-[#B87324] mb-3 shrink-0"
            style={{
              background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
            }}
          >
            <button
              onClick={() => setShowReview(false)}
              className="p-1.5 rounded-lg bg-[#C98A3D] text-[#2A170B] hover:brightness-110 transition-colors cursor-pointer border border-[#B87324]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-black text-[#2A170B] tracking-wider uppercase">
              SESSION REVIEW
            </span>

            <div className="w-7" />
          </div>

          {/* Solved Words List */}
          <div className="flex-1 overflow-y-auto py-1 space-y-2 pr-1">
            {sessionWordRecords.length > 0 ? (
              sessionWordRecords.map((rec, i) => (
                <div
                  key={i}
                  className="w-full rounded-xl p-2.5 border-2 border-[#B87324] flex items-center justify-between text-left"
                  style={{
                    background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 100%)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#168A3A] shrink-0" />
                    <div>
                      <span className="text-sm font-black text-[#2A170B] font-mono tracking-wider">
                        {rec.word}
                      </span>
                      <span className="text-[9px] text-[#8A4F1F] block font-semibold">
                        Level {rec.level}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-[#2A170B] font-mono">
                    +{rec.points} PTS
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#E3B45F]">
                No words completed during this session.
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <button
            onClick={() => setShowReview(false)}
            className="w-full py-3 rounded-xl text-[#2A170B] font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer border-2 border-[#B87324] shrink-0 mt-3"
            style={{
              background: 'linear-gradient(180deg, #F0C875 0%, #E3B45F 50%, #C98A3D 100%)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px #FFFFFF',
            }}
          >
            BACK TO RESULTS
          </button>
        </div>
      )}

    </div>
  );
};
