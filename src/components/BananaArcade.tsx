import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Gamepad2, 
  Flame, 
  Trophy, 
  ArrowLeft, 
  ArrowRight, 
  Grid, 
  TrendingUp, 
  Volume2, 
  VolumeX,
  X,
  Sparkles,
  Award,
  Zap,
  Target,
  Clock,
  Calculator,
  Type
} from 'lucide-react';
import { 
  playTapSound, 
  playCritSound, 
  playUpgradeSound, 
  playClaimSound, 
  playFeverSound, 
  playGoldenSound 
} from '../audio';

interface BananaArcadeProps {
  bananas: number;
  setBananas: React.Dispatch<React.SetStateAction<number>>;
  statClickPower: number;
  isMuted: boolean;
}

interface FallingFruit {
  id: number;
  x: number; // percentage left (0 to 100)
  y: number; // pixels from top
  type: 'regular' | 'golden' | 'rotten';
  speed: number;
  emoji: string;
}

interface FlappyObstacle {
  id: number;
  x: number; // horizontal offset from left (0 to 320px)
  gapTop: number; // pixels from top
  gapSize: number;
  passed: boolean;
}

interface ActivePeel {
  type: 'fresh' | 'golden' | 'toxic';
  expiresAt: number;
  id: number;
}

// Math game question structure
interface MathQuestion {
  question: string;
  correctAnswer: number;
  options: number[];
}

const ARCADE_SKINS_EMOJIS = ['🍌', '🧟', '📟', '👾', '👑', '🌌', '🎮', '💎', '🔥', '⭐'];

const WORD_POOL = [
  "BANANA", "YELLOW", "MONKEY", "FRUIT", "PEEL", 
  "JUNGLE", "CHAMP", "SMART", "SCHOOL", "LEARN", 
  "TEACHER", "PLAYGROUND", "CLASSROOM", "ORANGE", "CHERRY"
];

export const BananaArcade: React.FC<BananaArcadeProps> = ({
  bananas,
  setBananas,
  statClickPower,
  isMuted,
}) => {
  const [selectedGame, setSelectedGame] = useState<'menu' | 'catcher' | 'memory' | 'flappy' | 'whack' | 'math' | 'scramble'>('menu');

  // --- GAME 1: BANANA CATCHER STATES ---
  const [catcherActive, setCatcherActive] = useState<boolean>(false);
  const [basketPos, setBasketPos] = useState<number>(50); // percentage left (0 to 100)
  const [catcherScore, setCatcherScore] = useState<number>(0);
  const [catcherEarned, setCatcherEarned] = useState<number>(0);
  const [fallingFruits, setFallingFruits] = useState<FallingFruit[]>([]);
  const [catcherLives, setCatcherLives] = useState<number>(3);
  const [catcherHighScore, setCatcherHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_catcher_highscore') || '0');
  });

  // Refs for catcher animation loop
  const catcherRef = useRef<number | null>(null);
  const basketPosRef = useRef<number>(50);
  const fruitIdCounter = useRef<number>(0);
  const catcherIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- GAME 2: MEMORY MATCH STATES ---
  const [cards, setCards] = useState<{ id: number; emoji: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState<number>(0);
  const [memoryWin, setMemoryWin] = useState<boolean>(false);
  const [memoryEarned, setMemoryEarned] = useState<number>(0);
  const [memoryHighScore, setMemoryHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_memory_best_moves') || '999');
  });

  // --- GAME 3: FLAPPY BANANA STATES ---
  const [flappyActive, setFlappyActive] = useState<boolean>(false);
  const [flappyY, setFlappyY] = useState<number>(120); // vertical pixels
  const [flappyVelocity, setFlappyVelocity] = useState<number>(0);
  const [flappyScore, setFlappyScore] = useState<number>(0);
  const [flappyEarned, setFlappyEarned] = useState<number>(0);
  const [flappyObstacles, setFlappyObstacles] = useState<FlappyObstacle[]>([]);
  const [flappyHighScore, setFlappyHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_flappy_highscore') || '0');
  });

  // Refs for flappy loop
  const flappyRequestRef = useRef<number | null>(null);
  const flappyYRef = useRef<number>(120);
  const flappyVelocityRef = useRef<number>(0);
  const flappyObstaclesRef = useRef<FlappyObstacle[]>([]);
  const flappyFrameCounter = useRef<number>(0);
  const flappyObstacleId = useRef<number>(0);

  // --- GAME 4: WHACK-A-PEEL STATES ---
  const [whackActive, setWhackActive] = useState<boolean>(false);
  const [whackScore, setWhackScore] = useState<number>(0);
  const [whackEarned, setWhackEarned] = useState<number>(0);
  const [whackTimer, setWhackTimer] = useState<number>(30); // 30 second reflex challenge
  const [whackPeels, setWhackPeels] = useState<(ActivePeel | null)[]>(Array(9).fill(null));
  const [whackHighScore, setWhackHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_whack_highscore') || '0');
  });

  // Refs/timers for whack
  const whackTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const whackSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const whackPeelIdCounter = useRef<number>(0);

  // --- GAME 5: MATH CHAMP STATES ---
  const [mathActive, setMathActive] = useState<boolean>(false);
  const [mathScore, setMathScore] = useState<number>(0);
  const [mathEarned, setMathEarned] = useState<number>(0);
  const [mathTimer, setMathTimer] = useState<number>(30); // 30 seconds countdown
  const [currentMathQuestion, setCurrentMathQuestion] = useState<MathQuestion | null>(null);
  const [mathHighScore, setMathHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_math_highscore') || '0');
  });
  const mathTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- GAME 6: WORD SCRAMBLE STATES ---
  const [scrambleActive, setScrambleActive] = useState<boolean>(false);
  const [scrambleScore, setScrambleScore] = useState<number>(0);
  const [scrambleEarned, setScrambleEarned] = useState<number>(0);
  const [scrambleTimer, setScrambleTimer] = useState<number>(45); // 45 seconds spelling test
  const [targetWord, setTargetWord] = useState<string>("");
  const [scrambledLetters, setScrambledLetters] = useState<{ id: number; letter: string; used: boolean }[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<{ id: number; letter: string; originalIndex: number }[]>([]);
  const [scrambleHighScore, setScrambleHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('banana_scramble_highscore') || '0');
  });
  const scrambleTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- SYNCHRONIZE basketPosRef WITH basketPos ---
  useEffect(() => {
    basketPosRef.current = basketPos;
  }, [basketPos]);

  // --- KEYBOARD LISTENERS FOR CATCHER & FLAPPY ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedGame === 'catcher' && catcherActive) {
        if (e.key === 'ArrowLeft') {
          setBasketPos((prev) => Math.max(5, prev - 8));
        } else if (e.key === 'ArrowRight') {
          setBasketPos((prev) => Math.min(95, prev + 8));
        }
      }

      if (selectedGame === 'flappy' && flappyActive) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
          e.preventDefault();
          triggerFlappyJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame, catcherActive, flappyActive]);

  // --- GAME 1: CATCHER MAIN GAMELOOP ---
  const updateCatcherGame = () => {
    if (!catcherActive) return;

    setFallingFruits((prevFruits) => {
      let livesLost = 0;
      let scoreGained = 0;
      let bananasEarned = 0;

      const updated = prevFruits
        .map((fruit) => {
          return { ...fruit, y: fruit.y + fruit.speed };
        })
        .filter((fruit) => {
          // Collision check (bottom of screen is around 240px to 270px)
          if (fruit.y >= 235 && fruit.y <= 270) {
            const basketLeft = basketPosRef.current - 14;
            const basketRight = basketPosRef.current + 14;
            
            if (fruit.x >= basketLeft && fruit.x <= basketRight) {
              if (fruit.type === 'regular') {
                scoreGained += 1;
                bananasEarned += Math.max(5, Math.round(statClickPower * 1.5));
                playTapSound(1.25);
              } else if (fruit.type === 'golden') {
                scoreGained += 3;
                bananasEarned += Math.max(25, Math.round(statClickPower * 6));
                playGoldenSound();
              } else if (fruit.type === 'rotten') {
                livesLost += 1;
                playCritSound();
              }
              return false; // remove fruit
            }
          }

          // Offscreen check
          if (fruit.y > 310) {
            return false;
          }

          return true;
        });

      if (livesLost > 0) {
        setCatcherLives((prevLives) => {
          const nextLives = prevLives - livesLost;
          if (nextLives <= 0) {
            setCatcherActive(false);
          }
          return Math.max(0, nextLives);
        });
      }

      if (scoreGained > 0) {
        setCatcherScore((prev) => {
          const next = prev + scoreGained;
          if (next > catcherHighScore) {
            setCatcherHighScore(next);
            localStorage.setItem('banana_catcher_highscore', String(next));
          }
          return next;
        });
      }

      if (bananasEarned > 0) {
        setCatcherEarned((prev) => prev + bananasEarned);
        setBananas((prev) => prev + bananasEarned);
      }

      return updated;
    });

    if (catcherActive) {
      catcherRef.current = requestAnimationFrame(updateCatcherGame);
    }
  };

  useEffect(() => {
    if (catcherActive) {
      catcherRef.current = requestAnimationFrame(updateCatcherGame);
    } else {
      if (catcherRef.current) {
        cancelAnimationFrame(catcherRef.current);
      }
    }
    return () => {
      if (catcherRef.current) cancelAnimationFrame(catcherRef.current);
    };
  }, [catcherActive]);

  // Spawner loop for catcher fruits
  useEffect(() => {
    if (catcherActive) {
      catcherIntervalRef.current = setInterval(() => {
        const roll = Math.random();
        let type: 'regular' | 'golden' | 'rotten' = 'regular';
        let emoji = '🍌';
        let speed = Math.random() * 2.2 + 3.2;

        if (roll < 0.15) {
          type = 'golden';
          emoji = '👑';
          speed += 1.2;
        } else if (roll < 0.35) {
          type = 'rotten';
          emoji = '🤢';
        }

        const newFruit: FallingFruit = {
          id: fruitIdCounter.current++,
          x: Math.floor(Math.random() * 85) + 8,
          y: 0,
          type,
          speed,
          emoji,
        };

        setFallingFruits((prev) => [...prev, newFruit]);
      }, 700);
    } else {
      if (catcherIntervalRef.current) clearInterval(catcherIntervalRef.current);
    }

    return () => {
      if (catcherIntervalRef.current) clearInterval(catcherIntervalRef.current);
    };
  }, [catcherActive]);

  const startCatcherGame = () => {
    setCatcherScore(0);
    setCatcherEarned(0);
    setCatcherLives(3);
    setBasketPos(50);
    setFallingFruits([]);
    setCatcherActive(true);
    playFeverSound();
  };

  // --- GAME 2: MEMORY MATCH LOGIC ---
  const startMemoryGame = () => {
    const pool = [...ARCADE_SKINS_EMOJIS];
    const shuffledPool = pool.sort(() => Math.random() - 0.5).slice(0, 8);
    const pairs = [...shuffledPool, ...shuffledPool];
    const shuffledPairs = pairs.sort(() => Math.random() - 0.5);

    const initialCards = shuffledPairs.map((emoji, idx) => ({
      id: idx,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(initialCards);
    setSelectedIndices([]);
    setMemoryMoves(0);
    setMemoryWin(false);
    setMemoryEarned(0);
    playUpgradeSound();
  };

  const handleCardClick = (idx: number) => {
    if (cards[idx].isFlipped || cards[idx].isMatched || selectedIndices.length >= 2 || memoryWin) return;

    playTapSound(1.0 + (selectedIndices.length * 0.1));

    const updatedCards = [...cards];
    updatedCards[idx].isFlipped = true;
    setCards(updatedCards);

    const nextSelected = [...selectedIndices, idx];
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = nextSelected;

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setSelectedIndices([]);
          
          const matchBonus = Math.max(10, Math.round(statClickPower * 3.5));
          setMemoryEarned((prev) => prev + matchBonus);
          setBananas((prev) => prev + matchBonus);
          playGoldenSound();

          if (matchedCards.every((c) => c.isMatched)) {
            const jackpot = Math.max(120, Math.round(statClickPower * 30));
            setMemoryEarned((prev) => prev + jackpot);
            setBananas((prev) => prev + jackpot);
            setMemoryWin(true);
            playClaimSound();

            if (memoryMoves + 1 < memoryHighScore) {
              setMemoryHighScore(memoryMoves + 1);
              localStorage.setItem('banana_memory_best_moves', String(memoryMoves + 1));
            }
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setSelectedIndices([]);
        }, 1000);
      }
    }
  };


  // --- GAME 3: FLAPPY BANANA LOGIC ---
  useEffect(() => {
    flappyYRef.current = flappyY;
    flappyVelocityRef.current = flappyVelocity;
    flappyObstaclesRef.current = flappyObstacles;
  }, [flappyY, flappyVelocity, flappyObstacles]);

  const triggerFlappyJump = () => {
    if (!flappyActive) return;
    setFlappyVelocity(-5.2);
    playTapSound(1.3);
  };

  const startFlappyGame = () => {
    setFlappyY(120);
    setFlappyVelocity(0);
    setFlappyScore(0);
    setFlappyEarned(0);
    setFlappyObstacles([]);
    flappyFrameCounter.current = 0;
    flappyObstacleId.current = 0;
    setFlappyActive(true);
    playFeverSound();
  };

  const updateFlappyGame = () => {
    if (!flappyActive) return;

    let nextVel = flappyVelocityRef.current + 0.32;
    let nextY = flappyYRef.current + nextVel;

    if (nextY >= 262 || nextY <= -10) {
      setFlappyActive(false);
      playCritSound();
      return;
    }

    setFlappyVelocity(nextVel);
    setFlappyY(nextY);

    flappyFrameCounter.current += 1;
    let currentObstacles = [...flappyObstaclesRef.current];

    currentObstacles = currentObstacles.map((obs) => ({
      ...obs,
      x: obs.x - 2.0,
    }));

    currentObstacles = currentObstacles.filter((obs) => obs.x > -60);

    if (flappyFrameCounter.current % 110 === 0 || currentObstacles.length === 0) {
      const minGapTop = 35;
      const maxGapTop = 155;
      const gapTop = Math.floor(Math.random() * (maxGapTop - minGapTop + 1)) + minGapTop;
      const gapSize = 82;

      currentObstacles.push({
        id: flappyObstacleId.current++,
        x: 320,
        gapTop,
        gapSize,
        passed: false,
      });
    }

    const BANANA_X = 65;
    const BANANA_RADIUS = 10;
    let gainedScore = 0;
    let gainedBananas = 0;
    let collided = false;

    currentObstacles = currentObstacles.map((obs) => {
      const isOverlappingX = BANANA_X + BANANA_RADIUS >= obs.x && BANANA_X - BANANA_RADIUS <= obs.x + 38;
      
      if (isOverlappingX) {
        const isOutsideGap = nextY - BANANA_RADIUS < obs.gapTop || nextY + BANANA_RADIUS > obs.gapTop + obs.gapSize;
        if (isOutsideGap) {
          collided = true;
        }
      }

      if (!obs.passed && obs.x + 38 < BANANA_X) {
        gainedScore += 1;
        gainedBananas += Math.max(12, Math.round(statClickPower * 2.8));
        return { ...obs, passed: true };
      }

      return obs;
    });

    if (collided) {
      setFlappyActive(false);
      playCritSound();
      return;
    }

    setFlappyObstacles(currentObstacles);

    if (gainedScore > 0) {
      setFlappyScore((prev) => {
        const next = prev + gainedScore;
        if (next > flappyHighScore) {
          setFlappyHighScore(next);
          localStorage.setItem('banana_flappy_highscore', String(next));
        }
        return next;
      });
      setFlappyEarned((prev) => prev + gainedBananas);
      setBananas((prev) => prev + gainedBananas);
      playGoldenSound();
    }

    flappyRequestRef.current = requestAnimationFrame(updateFlappyGame);
  };

  useEffect(() => {
    if (flappyActive) {
      flappyRequestRef.current = requestAnimationFrame(updateFlappyGame);
    } else {
      if (flappyRequestRef.current) cancelAnimationFrame(flappyRequestRef.current);
    }
    return () => {
      if (flappyRequestRef.current) cancelAnimationFrame(flappyRequestRef.current);
    };
  }, [flappyActive]);


  // --- GAME 4: WHACK-A-PEEL LOGIC ---
  const startWhackGame = () => {
    setWhackScore(0);
    setWhackEarned(0);
    setWhackTimer(30);
    setWhackPeels(Array(9).fill(null));
    setWhackActive(true);
    playFeverSound();
  };

  useEffect(() => {
    if (whackActive) {
      whackTimerIntervalRef.current = setInterval(() => {
        setWhackTimer((prev) => {
          if (prev <= 1) {
            setWhackActive(false);
            if (whackTimerIntervalRef.current) clearInterval(whackTimerIntervalRef.current);
            if (whackSpawnIntervalRef.current) clearInterval(whackSpawnIntervalRef.current);
            playClaimSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      whackSpawnIntervalRef.current = setInterval(() => {
        setWhackPeels((prevGrid) => {
          const nextGrid = [...prevGrid];
          const now = Date.now();
          for (let i = 0; i < 9; i++) {
            if (nextGrid[i] && nextGrid[i]!.expiresAt < now) {
              nextGrid[i] = null;
            }
          }

          const emptyIndices: number[] = [];
          nextGrid.forEach((cell, idx) => {
            if (cell === null) emptyIndices.push(idx);
          });

          if (emptyIndices.length > 0 && Math.random() < 0.75) {
            const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            const roll = Math.random();
            let type: 'fresh' | 'golden' | 'toxic' = 'fresh';
            
            if (roll < 0.15) {
              type = 'golden';
            } else if (roll < 0.35) {
              type = 'toxic';
            }

            const duration = Math.random() * 800 + 900;

            nextGrid[randomIdx] = {
              type,
              expiresAt: Date.now() + duration,
              id: whackPeelIdCounter.current++,
            };
          }

          return nextGrid;
        });
      }, 500);

    } else {
      if (whackTimerIntervalRef.current) clearInterval(whackTimerIntervalRef.current);
      if (whackSpawnIntervalRef.current) clearInterval(whackSpawnIntervalRef.current);
    }

    return () => {
      if (whackTimerIntervalRef.current) clearInterval(whackTimerIntervalRef.current);
      if (whackSpawnIntervalRef.current) clearInterval(whackSpawnIntervalRef.current);
    };
  }, [whackActive]);

  const handleWhackCellClick = (idx: number) => {
    if (!whackActive) return;
    const item = whackPeels[idx];
    if (!item) return;

    setWhackPeels((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });

    let gainedPoints = 0;
    let gainedBananas = 0;

    if (item.type === 'fresh') {
      gainedPoints = 1;
      gainedBananas = Math.max(6, Math.round(statClickPower * 1.6));
      playTapSound(1.2);
    } else if (item.type === 'golden') {
      gainedPoints = 3;
      gainedBananas = Math.max(30, Math.round(statClickPower * 6.5));
      playGoldenSound();
    } else if (item.type === 'toxic') {
      gainedPoints = -2;
      playCritSound();
    }

    if (gainedPoints !== 0) {
      setWhackScore((prev) => {
        const next = Math.max(0, prev + gainedPoints);
        if (next > whackHighScore) {
          setWhackHighScore(next);
          localStorage.setItem('banana_whack_highscore', String(next));
        }
        return next;
      });
    }

    if (gainedBananas > 0) {
      setWhackEarned((prev) => prev + gainedBananas);
      setBananas((prev) => prev + gainedBananas);
    }
  };


  // --- GAME 5: MATH CHAMP LOGIC ---
  const generateMathQuestion = (): MathQuestion => {
    const operators = ['+', '-', '*'];
    const selectedOp = operators[Math.floor(Math.random() * operators.length)];
    let left = 0;
    let right = 0;
    let correctAnswer = 0;

    if (selectedOp === '+') {
      left = Math.floor(Math.random() * 15) + 1;
      right = Math.floor(Math.random() * 15) + 1;
      correctAnswer = left + right;
    } else if (selectedOp === '-') {
      left = Math.floor(Math.random() * 18) + 8;
      right = Math.floor(Math.random() * (left - 1)) + 1; // ensures positive outcome
      correctAnswer = left - right;
    } else {
      // multiplication suitable for school children
      left = Math.floor(Math.random() * 8) + 2;
      right = Math.floor(Math.random() * 9) + 1;
      correctAnswer = left * right;
    }

    const questionStr = `${left} ${selectedOp} ${right} = ?`;

    // Generate option distractions
    const offsetRange = [-3, -2, -1, 1, 2, 3, 4];
    const wrongOptions: number[] = [];
    while (wrongOptions.length < 2) {
      const offset = offsetRange[Math.floor(Math.random() * offsetRange.length)];
      const val = correctAnswer + offset;
      if (val >= 0 && val !== correctAnswer && !wrongOptions.includes(val)) {
        wrongOptions.push(val);
      }
    }

    const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

    return {
      question: questionStr,
      correctAnswer,
      options: allOptions
    };
  };

  const startMathGame = () => {
    setMathScore(0);
    setMathEarned(0);
    setMathTimer(30);
    setCurrentMathQuestion(generateMathQuestion());
    setMathActive(true);
    playFeverSound();
  };

  useEffect(() => {
    if (mathActive) {
      mathTimerIntervalRef.current = setInterval(() => {
        setMathTimer((prev) => {
          if (prev <= 1) {
            setMathActive(false);
            if (mathTimerIntervalRef.current) clearInterval(mathTimerIntervalRef.current);
            playClaimSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (mathTimerIntervalRef.current) clearInterval(mathTimerIntervalRef.current);
    }
    return () => {
      if (mathTimerIntervalRef.current) clearInterval(mathTimerIntervalRef.current);
    };
  }, [mathActive]);

  const handleMathOptionClick = (optionValue: number) => {
    if (!mathActive || !currentMathQuestion) return;

    if (optionValue === currentMathQuestion.correctAnswer) {
      // Correct!
      const bonus = Math.max(10, Math.round(statClickPower * 2.2));
      setMathScore((prev) => {
        const next = prev + 1;
        if (next > mathHighScore) {
          setMathHighScore(next);
          localStorage.setItem('banana_math_highscore', String(next));
        }
        return next;
      });
      setMathEarned((prev) => prev + bonus);
      setBananas((prev) => prev + bonus);
      playGoldenSound();
    } else {
      // Incorrect feedback
      playCritSound();
    }

    // Load next question immediately
    setCurrentMathQuestion(generateMathQuestion());
  };


  // --- GAME 6: WORD SCRAMBLE LOGIC ---
  const generateWordPuzzle = () => {
    const word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    setTargetWord(word);
    
    // Scramble letters
    const letters = word.split("").map((letter, idx) => ({
      id: idx,
      letter,
      used: false
    }));

    // shuffle
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    setScrambledLetters(scrambled);
    setGuessedLetters([]);
  };

  const startScrambleGame = () => {
    setScrambleScore(0);
    setScrambleEarned(0);
    setScrambleTimer(45);
    setScrambleActive(true);
    generateWordPuzzle();
    playFeverSound();
  };

  useEffect(() => {
    if (scrambleActive) {
      scrambleTimerIntervalRef.current = setInterval(() => {
        setScrambleTimer((prev) => {
          if (prev <= 1) {
            setScrambleActive(false);
            if (scrambleTimerIntervalRef.current) clearInterval(scrambleTimerIntervalRef.current);
            playClaimSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (scrambleTimerIntervalRef.current) clearInterval(scrambleTimerIntervalRef.current);
    }
    return () => {
      if (scrambleTimerIntervalRef.current) clearInterval(scrambleTimerIntervalRef.current);
    };
  }, [scrambleActive]);

  const handleLetterBubbleClick = (item: { id: number; letter: string; used: boolean }, index: number) => {
    if (!scrambleActive || item.used) return;

    playTapSound(1.15);

    // Mark as used
    const updatedScrambled = [...scrambledLetters];
    updatedScrambled[index].used = true;
    setScrambledLetters(updatedScrambled);

    // Add to guesses
    const newGuesses = [...guessedLetters, { id: item.id, letter: item.letter, originalIndex: index }];
    setGuessedLetters(newGuesses);

    // Check spelling completion
    const currentGuessStr = newGuesses.map(g => g.letter).join("");
    if (currentGuessStr === targetWord) {
      // Correct Word Match!
      const bonus = Math.max(25, Math.round(statClickPower * 5.5));
      setScrambleScore((prev) => {
        const next = prev + 1;
        if (next > scrambleHighScore) {
          setScrambleHighScore(next);
          localStorage.setItem('banana_scramble_highscore', String(next));
        }
        return next;
      });
      setScrambleEarned((prev) => prev + bonus);
      setBananas((prev) => prev + bonus);
      playGoldenSound();

      // Delay briefly then generate new word
      setTimeout(() => {
        if (scrambleActive) generateWordPuzzle();
      }, 600);
    } else if (currentGuessStr.length === targetWord.length) {
      // Wrong Spell! Auto-reset
      playCritSound();
      setTimeout(() => {
        // Reset letter uses
        const resetScrambled = scrambledLetters.map(s => ({ ...s, used: false }));
        setScrambledLetters(resetScrambled);
        setGuessedLetters([]);
      }, 600);
    }
  };

  const handleGuessedLetterClick = (guessItem: { id: number; letter: string; originalIndex: number }, idx: number) => {
    if (!scrambleActive) return;
    playTapSound(0.9);

    // Remove from guesses
    const updatedGuesses = guessedLetters.filter((_, i) => i !== idx);
    setGuessedLetters(updatedGuesses);

    // Set used state back to false
    const updatedScrambled = [...scrambledLetters];
    updatedScrambled[guessItem.originalIndex].used = false;
    setScrambledLetters(updatedScrambled);
  };


  return (
    <div className="bg-slate-950/65 border border-slate-900 rounded-2xl p-4 md:p-5 relative overflow-hidden text-slate-200">
      
      {/* Background glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* --- MENU / HOME ROUTE --- */}
      {selectedGame === 'menu' && (
        <div className="text-center py-4 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gamepad2 className="text-amber-400 animate-pulse" size={20} />
            <h3 className="font-display font-black text-lg text-slate-200 uppercase tracking-wide">
              Banana Arcade Arena
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed font-medium">
            Take a break from raw tapping and test your skills! Play simple interactive mini-games to generate fast multipliers and stack up thousands of extra bonus bananas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* GAME 1: BANANA CATCHER */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-amber-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">🧺</span>
                <h4 className="font-display font-black text-sm text-slate-200">Banana Catcher</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium">
                  Control the basket left and right to catch sweet falling bananas!
                </p>
                {catcherHighScore > 0 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    🏆 High Score: {catcherHighScore}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('catcher'); startCatcherGame(); }}
                className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY NOW
              </button>
            </div>

            {/* GAME 2: MEMORY PEELS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-amber-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">🃏</span>
                <h4 className="font-display font-black text-sm text-slate-200">Memory Peels</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium">
                  Flip tiles to match twin banana skin emojis and score jackpots!
                </p>
                {memoryHighScore < 999 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ⭐ Best: {memoryHighScore} moves
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('memory'); startMemoryGame(); }}
                className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY NOW
              </button>
            </div>

            {/* GAME 3: FLAPPY BANANA */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-amber-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">🐤</span>
                <h4 className="font-display font-black text-sm text-slate-200">Flappy Banana</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium">
                  Tap to fly high and slide through dangerous bamboo pipes!
                </p>
                {flappyHighScore > 0 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    🏆 Best Score: {flappyHighScore}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('flappy'); startFlappyGame(); }}
                className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY NOW
              </button>
            </div>

            {/* GAME 4: WHACK-A-PEEL */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-amber-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">🔨</span>
                <h4 className="font-display font-black text-sm text-slate-200">Whack-A-Peel</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium">
                  Tap popping bananas instantly in a 30-second reflex race!
                </p>
                {whackHighScore > 0 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    🏆 Record Score: {whackHighScore}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('whack'); startWhackGame(); }}
                className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY NOW
              </button>
            </div>

            {/* GAME 5: MATH CHAMP */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-emerald-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">🧮</span>
                <h4 className="font-display font-black text-sm text-slate-200">Math Champ</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium text-emerald-400/85">
                  Great for school! Solves additions, subtractions & multiplications quickly!
                </p>
                {mathHighScore > 0 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🏆 Best Score: {mathHighScore} correct
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('math'); startMathGame(); }}
                className="mt-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY MATH
              </button>
            </div>

            {/* GAME 6: WORD SCRAMBLE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-violet-500/30 hover:bg-slate-900/90 transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-2 filter drop-shadow-sm">📝</span>
                <h4 className="font-display font-black text-sm text-slate-200">Word Scramble</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] mx-auto font-medium text-violet-400/85">
                  Spell the banana themed vocabulary word correctly! Boost spelling!
                </p>
                {scrambleHighScore > 0 && (
                  <span className="inline-block mt-2 font-mono text-[9px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    🏆 Spelling Best: {scrambleHighScore} words
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedGame('scramble'); startScrambleGame(); }}
                className="mt-4 bg-violet-500 text-slate-950 hover:bg-violet-400 active:scale-95 font-display text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer w-full uppercase"
              >
                PLAY SPELLING
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- GAME 1: BANANA CATCHER VIEW --- */}
      {selectedGame === 'catcher' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); setCatcherActive(false); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span>SCORE: <span className="text-amber-400">{catcherScore}</span></span>
              <span>LIVES: <span className="text-rose-500">{'❤️'.repeat(catcherLives)}</span></span>
            </div>
          </div>

          {/* Interactive Screen container (height 280px) */}
          <div className="w-full h-72 bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            
            {/* Background grid/dots */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/60 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Falling items */}
            {fallingFruits.map((fruit) => (
              <div
                key={fruit.id}
                className="absolute text-2xl select-none transition-all duration-75 filter drop-shadow-md"
                style={{
                  left: `${fruit.x}%`,
                  top: `${fruit.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {fruit.emoji}
              </div>
            ))}

            {/* Basket catcher element */}
            <div
              className="absolute bottom-1 w-20 h-10 bg-gradient-to-b from-amber-700 to-amber-900 border-t-2 border-amber-400/60 rounded-b-xl flex items-center justify-center text-xl shadow-lg transition-all"
              style={{
                left: `${basketPos}%`,
                transform: 'translateX(-50%)',
              }}
            >
              🧺
            </div>

            {/* End / Overlays */}
            {!catcherActive && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                <span className="text-4xl mb-2">🏁</span>
                <h4 className="font-display font-black text-base text-slate-200">
                  {catcherLives <= 0 ? 'GAME OVER!' : 'Ready to Catch?'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs font-medium">
                  Use the left/right screen buttons (or keyboard Arrow keys on desktop) to move the basket. Catch falling bananas to earn tokens!
                </p>
                
                {catcherEarned > 0 && (
                  <div className="my-3 font-mono text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    💰 Accumulated Payout: +{catcherEarned} bananas!
                  </div>
                )}

                <button
                  onClick={startCatcherGame}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer mt-2 uppercase"
                >
                  {catcherLives <= 0 ? 'Play Again' : 'Start Game'}
                </button>
              </div>
            )}
          </div>

          {/* Interactive controls (Left/Right buttons) */}
          {catcherActive && (
            <div className="w-full grid grid-cols-2 gap-4 mt-3 select-none no-select">
              <button
                onTouchStart={() => setBasketPos((prev) => Math.max(5, prev - 12))}
                onClick={() => setBasketPos((prev) => Math.max(5, prev - 12))}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-1.5 active:bg-amber-500 active:text-slate-950 hover:bg-slate-850 cursor-pointer font-bold text-xs"
              >
                <ArrowLeft size={16} />
                Left
              </button>
              <button
                onTouchStart={() => setBasketPos((prev) => Math.min(95, prev + 12))}
                onClick={() => setBasketPos((prev) => Math.min(95, prev + 12))}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-1.5 active:bg-amber-500 active:text-slate-950 hover:bg-slate-850 cursor-pointer font-bold text-xs"
              >
                Right
                <ArrowRight size={16} />
              </button>
            </div>
          )}
          
        </div>
      )}

      {/* --- GAME 2: MEMORY MATCH VIEW --- */}
      {selectedGame === 'memory' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span>MOVES: <span className="text-amber-400">{memoryMoves}</span></span>
              <span>EARNED: <span className="text-green-400">+{memoryEarned} 🍌</span></span>
            </div>
          </div>

          {/* Memory Match Grid (4x4) */}
          <div className="grid grid-cols-4 gap-2.5 w-full max-w-sm mx-auto">
            {cards.map((card, idx) => {
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-all duration-300 transform cursor-pointer select-none no-select ${
                    isRevealed
                      ? 'bg-slate-900 border-amber-500/40 text-slate-100 rotate-0'
                      : 'bg-gradient-to-br from-amber-500/10 to-slate-900 border-slate-800 text-slate-400 active:scale-95'
                  }`}
                >
                  {isRevealed ? (
                    <span className="filter drop-shadow-sm">{card.emoji}</span>
                  ) : (
                    <span className="font-display font-black text-lg text-amber-500/40">🍌</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Victory Overlay */}
          {memoryWin && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20 rounded-2xl animate-fade-in">
              <span className="text-4xl mb-2">🏆</span>
              <h4 className="font-display font-black text-base text-amber-400 animate-bounce">
                VICTORY!
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs font-medium">
                You matched all twins in <span className="text-amber-400 font-bold">{memoryMoves} moves</span>! Earning an awesome grand bonus payout.
              </p>

              <div className="my-3.5 font-mono text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                💰 Total Earnings: +{memoryEarned} bananas!
              </div>

              <button
                onClick={startMemoryGame}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer uppercase"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Reset Game button */}
          {!memoryWin && (
            <button
              onClick={startMemoryGame}
              className="mt-4 flex items-center gap-1 text-[11px] font-bold font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset Cards Layout
            </button>
          )}

        </div>
      )}

      {/* --- GAME 3: FLAPPY BANANA VIEW --- */}
      {selectedGame === 'flappy' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); setFlappyActive(false); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span>SCORE: <span className="text-amber-400">{flappyScore}</span></span>
              <span>EARNED: <span className="text-green-400">+{flappyEarned} 🍌</span></span>
            </div>
          </div>

          {/* Scrolling Flappy Box (Height 280px) */}
          <div 
            onClick={triggerFlappyJump}
            className="w-full h-72 bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden flex flex-col justify-between cursor-pointer select-none"
          >
            {/* Ambient deep grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/5 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Render Obstacle Pipes */}
            {flappyObstacles.map((obs) => (
              <React.Fragment key={obs.id}>
                {/* Top Pipe */}
                <div 
                  className="absolute bg-gradient-to-r from-emerald-600 to-emerald-800 border-r border-b-2 border-emerald-400/50 rounded-b-md shadow-lg"
                  style={{
                    left: `${obs.x}px`,
                    top: 0,
                    width: '38px',
                    height: `${obs.gapTop}px`,
                  }}
                />
                {/* Bottom Pipe */}
                <div 
                  className="absolute bg-gradient-to-r from-emerald-600 to-emerald-800 border-r border-t-2 border-emerald-400/50 rounded-t-md shadow-lg"
                  style={{
                    left: `${obs.x}px`,
                    top: `${obs.gapTop + obs.gapSize}px`,
                    width: '38px',
                    height: `${288 - (obs.gapTop + obs.gapSize)}px`,
                  }}
                />
              </React.Fragment>
            ))}

            {/* Flappy Banana character */}
            <div
              className="absolute text-2xl select-none filter drop-shadow-md z-10 transition-transform duration-75"
              style={{
                left: '65px',
                top: `${flappyY}px`,
                transform: `translate(-50%, -50%) rotate(${Math.min(45, Math.max(-30, flappyVelocity * 7))}deg)`,
              }}
            >
              🍌
            </div>

            {/* Instruction Tap Overlay inside */}
            {!flappyActive && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                <span className="text-4xl mb-1 animate-bounce">🐤</span>
                <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Flappy Banana Mode
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium leading-relaxed">
                  Tap/click anywhere on the game screen (or press <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[9px] text-amber-400">Space</kbd>) to flap up. Pass columns to collect multiplier payouts!
                </p>

                {flappyEarned > 0 && (
                  <div className="my-2.5 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    💰 Accumulated: +{flappyEarned} bananas!
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); startFlappyGame(); }}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer mt-2 uppercase"
                >
                  Start Flying
                </button>
              </div>
            )}
          </div>

          {/* Jump trigger button for mobile/touch ease */}
          {flappyActive && (
            <button
              onClick={triggerFlappyJump}
              className="w-full mt-3 bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2 active:bg-amber-500 active:text-slate-950 font-bold text-xs uppercase select-none cursor-pointer"
            >
              <Zap size={14} className="text-amber-400" /> Tap to Jump
            </button>
          )}

        </div>
      )}

      {/* --- GAME 4: WHACK-A-PEEL VIEW --- */}
      {selectedGame === 'whack' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); setWhackActive(false); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> SECS: <span className="text-amber-400">{whackTimer}s</span></span>
              <span>SCORE: <span className="text-amber-400">{whackScore}</span></span>
              <span>EARNED: <span className="text-green-400">+{whackEarned} 🍌</span></span>
            </div>
          </div>

          {/* Whack 3x3 Grid container */}
          <div className="relative w-full max-w-sm mx-auto">
            <div className="grid grid-cols-3 gap-3 p-2 bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden">
              
              {/* Grid holes */}
              {whackPeels.map((peel, idx) => {
                return (
                  <div
                    key={idx}
                    onClick={() => handleWhackCellClick(idx)}
                    className="aspect-square bg-slate-900/60 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer select-none transition-all active:scale-95 hover:bg-slate-900"
                  >
                    {/* Dirt/mole hole crater outline */}
                    <div className="absolute bottom-2 left-3 right-3 h-3 bg-slate-950/70 border border-slate-900/40 rounded-full" />

                    {/* Pop-up item */}
                    {peel && (
                      <div className="absolute text-3xl animate-bounce select-none filter drop-shadow-md cursor-pointer z-10 transition-transform">
                        {peel.type === 'fresh' && '🍌'}
                        {peel.type === 'golden' && '👑'}
                        {peel.type === 'toxic' && '🤢'}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

            {/* End / Overlay */}
            {!whackActive && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20 rounded-2xl">
                <span className="text-4xl mb-1 animate-pulse">🔨</span>
                <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Whack-A-Peel
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium leading-relaxed">
                  Fresh bananas (<span className="text-amber-400">🍌</span>) pop out of holes randomly. Click them instantly to earn score points, but avoid hitting toxic green peels (<span className="text-rose-500">🤢</span>)!
                </p>

                {whackEarned > 0 && (
                  <div className="my-2.5 font-mono text-[10px] text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    💰 Accumulated: +{whackEarned} bananas!
                  </div>
                )}

                <button
                  onClick={startWhackGame}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer mt-2 uppercase"
                >
                  Start Whacking
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- GAME 5: MATH CHAMP VIEW --- */}
      {selectedGame === 'math' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); setMathActive(false); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock size={12} className="text-emerald-400" /> TIME: <span className="text-emerald-400 font-black">{mathTimer}s</span></span>
              <span>CORRECT: <span className="text-emerald-400">{mathScore}</span></span>
              <span>EARNED: <span className="text-green-400">+{mathEarned} 🍌</span></span>
            </div>
          </div>

          {/* Math Board (Height 280px) */}
          <div className="w-full max-w-md mx-auto relative">
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              {currentMathQuestion && (
                <div className="animate-fade-in relative z-10">
                  <div className="inline-block bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-4">
                    🏫 MENTAL MATH CLASS
                  </div>

                  {/* Math Formula Display */}
                  <h4 className="font-mono text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
                    {currentMathQuestion.question}
                  </h4>

                  {/* Options container */}
                  <div className="grid grid-cols-3 gap-3">
                    {currentMathQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMathOptionClick(option)}
                        className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/90 active:scale-95 text-xl font-mono font-black py-3 rounded-xl transition-all cursor-pointer text-emerald-400 shadow-md"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* End / Overlays */}
            {!mathActive && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20 rounded-2xl">
                <span className="text-4xl mb-1">🧮</span>
                <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Math Champ Speed Run
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium leading-relaxed">
                  Solve as many math equations as you can in <span className="text-emerald-400 font-bold">30 seconds</span>! Boost logic skills and multiply your banana yield safely!
                </p>

                {mathEarned > 0 && (
                  <div className="my-2.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    💰 correct: {mathScore} | Accumulated: +{mathEarned} bananas!
                  </div>
                )}

                <button
                  onClick={startMathGame}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer mt-2 uppercase"
                >
                  Start Math Challenge
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- GAME 6: WORD SCRAMBLE VIEW --- */}
      {selectedGame === 'scramble' && (
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header row */}
          <div className="w-full flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <button
              onClick={() => { setSelectedGame('menu'); setScrambleActive(false); playTapSound(0.9); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Quit Arcade
            </button>
            <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock size={12} className="text-violet-400" /> SPELL TIME: <span className="text-violet-400 font-black">{scrambleTimer}s</span></span>
              <span>WORDS: <span className="text-violet-400">{scrambleScore}</span></span>
              <span>EARNED: <span className="text-green-400">+{scrambleEarned} 🍌</span></span>
            </div>
          </div>

          {/* Spelling Board */}
          <div className="w-full max-w-md mx-auto relative">
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />

              {targetWord && (
                <div className="animate-fade-in relative z-10">
                  <div className="inline-block bg-violet-500/10 border border-violet-500/25 rounded-xl px-3 py-1 text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-4">
                    📝 SPELLING BEE CHALLENGE
                  </div>

                  {/* Guess Box */}
                  <div className="flex justify-center gap-1.5 mb-6 min-h-[44px]">
                    {targetWord.split("").map((_, idx) => {
                      const guessItem = guessedLetters[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => guessItem && handleGuessedLetterClick(guessItem, idx)}
                          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center font-display font-black text-base cursor-pointer transition-all ${
                            guessItem
                              ? 'bg-violet-950 border-violet-500 text-violet-300 transform scale-105 shadow-md shadow-violet-500/15'
                              : 'bg-slate-900/45 border-slate-800 text-transparent border-dashed'
                          }`}
                        >
                          {guessItem ? guessItem.letter : '_'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Hint helper */}
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
                    Unscramble this word correctly:
                  </p>

                  {/* Scrambled Interactive Bubbles */}
                  <div className="flex flex-wrap justify-center gap-2.5 max-w-xs mx-auto">
                    {scrambledLetters.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleLetterBubbleClick(item, index)}
                        disabled={item.used}
                        className={`w-11 h-11 rounded-full font-display font-black text-lg flex items-center justify-center transition-all cursor-pointer ${
                          item.used
                            ? 'bg-slate-900/30 border border-slate-900 text-slate-700 opacity-30 cursor-not-allowed transform scale-90'
                            : 'bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 border border-violet-400/35 text-white shadow active:scale-95'
                        }`}
                      >
                        {item.letter}
                      </button>
                    ))}
                  </div>

                  {/* Reset/clear current guesses word */}
                  <button
                    onClick={() => {
                      const resetScrambled = scrambledLetters.map(s => ({ ...s, used: false }));
                      setScrambledLetters(resetScrambled);
                      setGuessedLetters([]);
                      playTapSound(0.85);
                    }}
                    className="mt-6 flex items-center gap-1 mx-auto text-[10px] font-bold font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <RotateCcw size={10} /> Clear spelling guesses
                  </button>
                </div>
              )}
            </div>

            {/* End / Overlays */}
            {!scrambleActive && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20 rounded-2xl">
                <span className="text-4xl mb-1">📝</span>
                <h4 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Word Scramble Arena
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium leading-relaxed">
                  Letters of a secret banana word are mixed up! Click letter bubbles to unscramble them in <span className="text-violet-400 font-bold">45 seconds</span>. Great for expanding spelling & vocabulary!
                </p>

                {scrambleEarned > 0 && (
                  <div className="my-2.5 font-mono text-[10px] text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                    💰 Words Spelled: {scrambleScore} | Accumulated: +{scrambleEarned} bananas!
                  </div>
                )}

                <button
                  onClick={startScrambleGame}
                  className="bg-violet-500 text-slate-950 hover:bg-violet-400 active:scale-95 font-display font-black text-xs py-2 px-6 rounded-xl transition-all cursor-pointer mt-2 uppercase"
                >
                  Start Spelling Game
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
