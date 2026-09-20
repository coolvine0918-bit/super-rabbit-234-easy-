import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../utils/audio';
import { QuizQuestion } from '../types';

interface GameCanvasProps {
  onTriggerQuiz: (questionId: number) => void;
  onGameOver: (won: boolean) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  hp: number;
  setHp: React.Dispatch<React.SetStateAction<number>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  solvedQuestions: Set<number>;
  totalQuizzes?: number;
  isQuizActive: boolean;
  laserReady?: boolean;
  laserTimeLeft?: number;
  virtualKeys: { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean; shoot?: boolean };
}

// Map dimensions: 4 vertical levels/floors connected by ladders
const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 1600; // 4 floors of 400px height each

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'question' | 'cloud';
  questionId?: number;
  hit?: boolean;
}

interface Ladder {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  type: 'snail' | 'spiky';
}

interface Laser {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  life: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onTriggerQuiz,
  onGameOver,
  score,
  setScore,
  hp,
  setHp,
  coins,
  setCoins,
  solvedQuestions,
  totalQuizzes = 20,
  isQuizActive,
  laserReady = false,
  laserTimeLeft = 0,
  virtualKeys,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const lastLockNoticeRef = useRef<number>(0);

  // Rabbit player state
  const playerRef = useRef({
    x: 80,
    y: WORLD_HEIGHT - 120,
    w: 36,
    h: 44,
    vx: 0,
    vy: 0,
    isGrounded: false,
    isClimbing: false,
    facing: 'right' as 'left' | 'right',
    invulnerableTime: 0,
    animTick: 0,
  });

  // Keys tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Level geometry
  const platformsRef = useRef<Platform[]>([]);
  const laddersRef = useRef<Ladder[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const lastShootTimeRef = useRef<number>(0);
  const prevLaserReadyRef = useRef<boolean>(false);

  // Play power-up sound when laser is unlocked!
  useEffect(() => {
    if (laserReady && !prevLaserReadyRef.current) {
      sounds.playSuperMode();
    }
    prevLaserReadyRef.current = laserReady;
  }, [laserReady]);

  // Initialize Level Geometry (4 floors with ladders and 20 question blocks distributed)
  useEffect(() => {
    // 4 floors:
    // Floor 1 (bottom): Y = 1500 (ground), Y = 1350, Y = 1250 (questions 1~5)
    // Floor 2: Y = 1150 (floor 2 base), Y = 1020, Y = 900 (questions 6~10)
    // Floor 3: Y = 800 (floor 3 base), Y = 680, Y = 560 (questions 11~15)
    // Floor 4: Y = 460 (floor 4 base), Y = 340, Y = 220, Y = 120 (questions 16~20 + Trophy)

    const plats: Platform[] = [
      // Floor 1 Base Ground
      { x: 0, y: WORLD_HEIGHT - 60, w: WORLD_WIDTH, h: 60, type: 'ground' },
      // Floor 1 Platforms
      { x: 220, y: 1420, w: 220, h: 28, type: 'ground' },
      { x: 550, y: 1370, w: 240, h: 28, type: 'ground' },
      { x: 880, y: 1320, w: 260, h: 28, type: 'ground' },
      // Floor 1 Quiz Blocks (Q1 - Q5)
      { x: 180, y: 1320, w: 36, h: 36, type: 'question', questionId: 1 },
      { x: 320, y: 1300, w: 36, h: 36, type: 'question', questionId: 2 },
      { x: 620, y: 1250, w: 36, h: 36, type: 'question', questionId: 3 },
      { x: 740, y: 1250, w: 36, h: 36, type: 'question', questionId: 4 },
      { x: 960, y: 1200, w: 36, h: 36, type: 'question', questionId: 5 },

      // Floor 2 Platforms (Y: 1180 to 900)
      { x: 100, y: 1180, w: 340, h: 28, type: 'ground' },
      { x: 520, y: 1140, w: 280, h: 28, type: 'ground' },
      { x: 860, y: 1100, w: 280, h: 28, type: 'ground' },
      { x: 340, y: 1030, w: 200, h: 26, type: 'brick' },
      { x: 640, y: 980, w: 220, h: 26, type: 'ground' },
      // Floor 2 Quiz Blocks (Q6 - Q10)
      { x: 200, y: 1060, w: 36, h: 36, type: 'question', questionId: 6 },
      { x: 440, y: 920, w: 36, h: 36, type: 'question', questionId: 7 },
      { x: 600, y: 1020, w: 36, h: 36, type: 'question', questionId: 8 },
      { x: 780, y: 860, w: 36, h: 36, type: 'question', questionId: 9 },
      { x: 980, y: 980, w: 36, h: 36, type: 'question', questionId: 10 },

      // Floor 3 Platforms (Y: 840 to 560)
      { x: 80, y: 840, w: 320, h: 28, type: 'ground' },
      { x: 480, y: 800, w: 260, h: 28, type: 'ground' },
      { x: 800, y: 760, w: 320, h: 28, type: 'ground' },
      { x: 300, y: 700, w: 220, h: 26, type: 'brick' },
      { x: 600, y: 650, w: 260, h: 28, type: 'ground' },
      // Floor 3 Quiz Blocks (Q11 - Q15)
      { x: 180, y: 720, w: 36, h: 36, type: 'question', questionId: 11 },
      { x: 380, y: 580, w: 36, h: 36, type: 'question', questionId: 12 },
      { x: 540, y: 680, w: 36, h: 36, type: 'question', questionId: 13 },
      { x: 720, y: 530, w: 36, h: 36, type: 'question', questionId: 14 },
      { x: 920, y: 640, w: 36, h: 36, type: 'question', questionId: 15 },

      // Floor 4 Final Platforms (Y: 500 to 140)
      { x: 120, y: 500, w: 320, h: 28, type: 'ground' },
      { x: 520, y: 460, w: 280, h: 28, type: 'ground' },
      { x: 840, y: 420, w: 300, h: 28, type: 'ground' },
      { x: 320, y: 350, w: 240, h: 26, type: 'brick' },
      { x: 640, y: 300, w: 260, h: 28, type: 'ground' },
      { x: 220, y: 220, w: 300, h: 28, type: 'ground' },
      // Floor 4 Quiz Blocks (Q16 - Q20)
      { x: 240, y: 380, w: 36, h: 36, type: 'question', questionId: 16 },
      { x: 600, y: 340, w: 36, h: 36, type: 'question', questionId: 17 },
      { x: 760, y: 180, w: 36, h: 36, type: 'question', questionId: 18 },
      { x: 440, y: 120, w: 36, h: 36, type: 'question', questionId: 19 },
      { x: 720, y: 100, w: 36, h: 36, type: 'question', questionId: 20 },

      // Final Trophy Platform at the peak
      { x: 850, y: 140, w: 220, h: 30, type: 'ground' }
    ];

    // Ladders connecting the floors vertically (reaching cleanly onto each platform level)
    const lads: Ladder[] = [
      // Floor 1 to Floor 2 (platform at Y: 1420)
      { x: 400, y: 1410, w: 36, h: 250 },
      { x: 1020, y: 1090, w: 36, h: 230 },
      // Floor 2 to Floor 3 (platform at Y: 840)
      { x: 200, y: 830, w: 36, h: 350 },
      { x: 740, y: 790, w: 36, h: 190 },
      // Floor 3 to Floor 4 (platform at Y: 420)
      { x: 960, y: 410, w: 36, h: 350 },
      { x: 380, y: 490, w: 36, h: 210 },
      // Floor 4 to Summit (platform at Y: 220 and Summit Y: 140)
      { x: 480, y: 210, w: 36, h: 140 },
      { x: 880, y: 130, w: 36, h: 170 }
    ];

    // Coins scattered throughout
    const cns: Coin[] = [
      // F1
      { x: 150, y: 1500, collected: false },
      { x: 280, y: 1380, collected: false },
      { x: 380, y: 1380, collected: false },
      { x: 600, y: 1330, collected: false },
      { x: 700, y: 1330, collected: false },
      { x: 920, y: 1280, collected: false },
      // F2
      { x: 160, y: 1140, collected: false },
      { x: 260, y: 1140, collected: false },
      { x: 580, y: 1100, collected: false },
      { x: 920, y: 1060, collected: false },
      { x: 700, y: 940, collected: false },
      // F3
      { x: 140, y: 800, collected: false },
      { x: 240, y: 800, collected: false },
      { x: 520, y: 760, collected: false },
      { x: 860, y: 720, collected: false },
      { x: 660, y: 610, collected: false },
      // F4
      { x: 180, y: 460, collected: false },
      { x: 560, y: 420, collected: false },
      { x: 900, y: 380, collected: false },
      { x: 680, y: 260, collected: false },
      { x: 300, y: 180, collected: false },
      { x: 920, y: 100, collected: false },
    ];

    // Enemies patrolling platforms
    const enms: Enemy[] = [
      { x: 300, y: 1420 - 28, w: 32, h: 28, vx: 1.2, minX: 230, maxX: 420, alive: true, type: 'snail' },
      { x: 650, y: 1370 - 28, w: 32, h: 28, vx: -1.4, minX: 560, maxX: 770, alive: true, type: 'spiky' },
      { x: 220, y: 1180 - 28, w: 32, h: 28, vx: 1.3, minX: 120, maxX: 420, alive: true, type: 'snail' },
      { x: 600, y: 1140 - 28, w: 32, h: 28, vx: -1.5, minX: 530, maxX: 780, alive: true, type: 'spiky' },
      { x: 200, y: 840 - 28, w: 32, h: 28, vx: 1.4, minX: 100, maxX: 380, alive: true, type: 'snail' },
      { x: 860, y: 760 - 28, w: 32, h: 28, vx: -1.6, minX: 810, maxX: 1100, alive: true, type: 'spiky' },
      { x: 680, y: 650 - 28, w: 32, h: 28, vx: 1.5, minX: 610, maxX: 840, alive: true, type: 'snail' },
      { x: 200, y: 500 - 28, w: 32, h: 28, vx: 1.5, minX: 140, maxX: 420, alive: true, type: 'spiky' },
      { x: 680, y: 300 - 28, w: 32, h: 28, vx: -1.6, minX: 650, maxX: 880, alive: true, type: 'snail' },
    ];

    platformsRef.current = plats;
    laddersRef.current = lads;
    coinsRef.current = cns;
    enemiesRef.current = enms;
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      // Prevent scrolling with arrows/space in game
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const player = playerRef.current;
      const keys = keysRef.current;
      const vKeys = virtualKeys;

      // Only update physics and movement if Quiz Modal is not active
      if (!isQuizActive) {
        // --- 1. LADDER CLIMBING DETECTION ---
        const isXOverLadder = (lad: Ladder) =>
          player.x + player.w * 0.8 > lad.x &&
          player.x + player.w * 0.2 < lad.x + lad.w;

        // Ladder player is currently touching or standing directly above
        const activeLadder = laddersRef.current.find(lad => {
          if (!isXOverLadder(lad)) return false;
          // Vertical range: from bottom of ladder up to the top platform deck
          return (
            player.y + player.h >= lad.y - 12 &&
            player.y <= lad.y + lad.h + 10
          );
        });

        const wantUp = keys['ArrowUp'] || keys['KeyW'] || vKeys.up;
        const wantDown = keys['ArrowDown'] || keys['KeyS'] || vKeys.down;
        const wantLeft = keys['ArrowLeft'] || keys['KeyA'] || vKeys.left;
        const wantRight = keys['ArrowRight'] || keys['KeyD'] || vKeys.right;
        const wantJump = keys['Space'] || keys['KeyK'] || vKeys.jump;

        // Enter climbing mode if on ladder and moving up or down
        if (activeLadder && (wantUp || wantDown)) {
          player.isClimbing = true;
        } else if (!activeLadder) {
          player.isClimbing = false;
        }

        // --- 2. HORIZONTAL MOVEMENT ---
        const speed = 230;
        if (wantLeft) {
          player.vx = -speed;
          player.facing = 'left';
          player.animTick += 1;
        } else if (wantRight) {
          player.vx = speed;
          player.facing = 'right';
          player.animTick += 1;
        } else {
          player.vx = 0;
        }

        // --- 3. VERTICAL MOVEMENT / GRAVITY / LADDER ---
        if (player.isClimbing) {
          player.vy = 0;
          if (wantUp) {
            player.vy = -180;
            player.animTick += 1;
            if (Math.random() < 0.12) sounds.playClimb();

            // Reached top of ladder: smoothly dismount onto upper platform!
            if (activeLadder && player.y + player.h <= activeLadder.y + 16) {
              const topPlat = platformsRef.current.find(
                p =>
                  p.type !== 'question' &&
                  player.x + player.w > p.x &&
                  player.x < p.x + p.w &&
                  Math.abs(p.y - activeLadder.y) <= 30
              );
              const targetY = topPlat ? topPlat.y : activeLadder.y;
              player.y = targetY - player.h;
              player.vy = 0;
              player.isGrounded = true;
              player.isClimbing = false;
            }
          } else if (wantDown) {
            player.vy = 180;
            player.animTick += 1;
            if (Math.random() < 0.12) sounds.playClimb();

            // Reached bottom of ladder
            if (activeLadder && player.y >= activeLadder.y + activeLadder.h - player.h) {
              player.isClimbing = false;
            }
          }

          // Jump or step off ladder
          if (wantJump) {
            player.isClimbing = false;
            player.vy = -420;
            sounds.playJump();
          } else if ((wantLeft || wantRight) && activeLadder && player.y + player.h <= activeLadder.y + 24) {
            // Stepping off to the side at the top of the ladder
            const topPlat = platformsRef.current.find(
              p =>
                p.type !== 'question' &&
                player.x + player.w > p.x &&
                player.x < p.x + p.w &&
                Math.abs(p.y - activeLadder.y) <= 30
            );
            if (topPlat) {
              player.y = topPlat.y - player.h;
              player.isGrounded = true;
              player.isClimbing = false;
            }
          }
        } else {
          // Normal gravity
          player.vy += 980 * dt;
          if (player.vy > 650) player.vy = 650;

          if (wantJump && player.isGrounded) {
            player.vy = -460;
            player.isGrounded = false;
            sounds.playJump();
          }
        }

        // --- 4. APPLY VELOCITY ---
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;

        // --- 5. PLATFORM COLLISIONS ---
        player.isGrounded = false;

        // When climbing, platforms do not block movement so rabbit can climb through ladder opening
        if (!player.isClimbing) {
          platformsRef.current.forEach(plat => {
            const isColliding =
              player.x < plat.x + plat.w &&
              player.x + player.w > plat.x &&
              player.y < plat.y + plat.h &&
              player.y + player.h > plat.y;

            if (isColliding) {
              // Land on top (ONE-WAY PLATFORM: only when falling downwards, vy >= 0)
              const prevFeetY = (player.y + player.h) - player.vy * dt;
              if (player.vy >= 0 && prevFeetY <= plat.y + 16) {
                player.y = plat.y - player.h;
                player.vy = 0;
                player.isGrounded = true;
              }
              // Only Question Blocks [?] can be hit from below!
              // Ground and brick platforms allow smooth jumping and climbing without hitting head
              else if (plat.type === 'question' && player.vy < 0) {
                const prevHeadY = player.y - player.vy * dt;
                if (prevHeadY >= plat.y + plat.h - 12) {
                  player.y = plat.y + plat.h;
                  player.vy = 50;

                  // Check if it's a question block!
                  if (plat.questionId) {
                    if (!plat.hit) {
                      plat.hit = true;
                      sounds.playCoin();
                      // Spawn particles
                      for (let i = 0; i < 8; i++) {
                        particlesRef.current.push({
                          x: plat.x + plat.w / 2,
                          y: plat.y,
                          vx: (Math.random() - 0.5) * 150,
                          vy: -Math.random() * 200 - 50,
                          color: '#FBBF24',
                          size: 4 + Math.random() * 3,
                          life: 0.6,
                          maxLife: 0.6,
                        });
                      }
                    }
                    // Trigger quiz modal!
                    onTriggerQuiz(plat.questionId);
                  }
                }
              }
            }
          });
        }

        // Floor ground boundary
        if (player.y + player.h > WORLD_HEIGHT) {
          player.y = WORLD_HEIGHT - player.h;
          player.vy = 0;
          player.isGrounded = true;
        }

        // --- 6. TOUCH QUIZ BLOCK FROM SIDE/PROXIMITY ---
        platformsRef.current.forEach(plat => {
          if (plat.type === 'question' && plat.questionId && !solvedQuestions.has(plat.questionId)) {
            const dist = Math.hypot(
              player.x + player.w / 2 - (plat.x + plat.w / 2),
              player.y + player.h / 2 - (plat.y + plat.h / 2)
            );
            if (dist < 42) {
              onTriggerQuiz(plat.questionId);
            }
          }
        });

        // --- 7. COINS COLLECTION ---
        coinsRef.current.forEach(coin => {
          if (!coin.collected) {
            const dist = Math.hypot(player.x + player.w / 2 - coin.x, player.y + player.h / 2 - coin.y);
            if (dist < 32) {
              coin.collected = true;
              sounds.playCoin();
              setCoins(c => c + 1);
              setScore(s => s + 100);

              for (let i = 0; i < 6; i++) {
                particlesRef.current.push({
                  x: coin.x,
                  y: coin.y,
                  vx: (Math.random() - 0.5) * 120,
                  vy: -Math.random() * 140 - 40,
                  color: '#F59E0B',
                  size: 3 + Math.random() * 3,
                  life: 0.5,
                  maxLife: 0.5,
                });
              }
            }
          }
        });

        // --- 7.5. LASER SHOOTING (Unlocked with 5-Streak) ---
        const wantShoot = keys['KeyX'] || keys['KeyZ'] || keys['KeyF'] || keys['ShiftLeft'] || vKeys.shoot;
        if (laserReady && wantShoot && currentTime - lastShootTimeRef.current > 220) {
          lastShootTimeRef.current = currentTime;
          const dir = player.facing === 'right' ? 1 : -1;
          const lx = dir === 1 ? player.x + player.w + 2 : player.x - 30;
          const ly = player.y + 18;
          lasersRef.current.push({
            x: lx,
            y: ly,
            w: 28,
            h: 8,
            vx: dir * 750,
            life: 1.2,
            color: '#EF4444',
          });
          sounds.playLaser();

          // Muzzle burst sparks
          for (let i = 0; i < 5; i++) {
            particlesRef.current.push({
              x: lx,
              y: ly + 4,
              vx: dir * (80 + Math.random() * 80),
              vy: (Math.random() - 0.5) * 60,
              color: '#F59E0B',
              size: 3 + Math.random() * 2,
              life: 0.2,
              maxLife: 0.2,
            });
          }
        }

        // Update Laser Positions & Enemy Collisions
        lasersRef.current.forEach(laser => {
          laser.x += laser.vx * dt;
          laser.life -= dt;

          // Check hit against living enemies
          enemiesRef.current.forEach(enemy => {
            if (!enemy.alive) return;
            const hit =
              laser.x < enemy.x + enemy.w &&
              laser.x + laser.w > enemy.x &&
              laser.y < enemy.y + enemy.h &&
              laser.y + laser.h > enemy.y;

            if (hit) {
              enemy.alive = false;
              laser.life = 0;
              sounds.playLaserHit();
              setScore(s => s + 300);

              // Dramatic defeat explosion particles
              for (let i = 0; i < 16; i++) {
                particlesRef.current.push({
                  x: enemy.x + enemy.w / 2,
                  y: enemy.y + enemy.h / 2,
                  vx: (Math.random() - 0.5) * 220,
                  vy: -Math.random() * 180 - 40,
                  color: ['#F59E0B', '#EF4444', '#FCD34D', '#10B981'][Math.floor(Math.random() * 4)],
                  size: 4 + Math.random() * 3,
                  life: 0.6,
                  maxLife: 0.6,
                });
              }
            }
          });
        });
        lasersRef.current = lasersRef.current.filter(l => l.life > 0 && l.x >= 0 && l.x <= WORLD_WIDTH);

        // --- 8. ENEMIES PATROL & STOMP / HURT ---
        enemiesRef.current.forEach(enemy => {
          if (!enemy.alive) return;

          enemy.x += enemy.vx;
          if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
            enemy.vx *= -1;
          }

          // Collision with player
          const isColliding =
            player.x < enemy.x + enemy.w &&
            player.x + player.w > enemy.x &&
            player.y < enemy.y + enemy.h &&
            player.y + player.h > enemy.y;

          if (isColliding) {
            // Stomp on enemy from above
            if (player.vy > 0 && player.y + player.h - player.vy * dt <= enemy.y + 12) {
              enemy.alive = false;
              player.vy = -320; // Bounce up
              sounds.playStomp();
              setScore(s => s + 200);

              for (let i = 0; i < 10; i++) {
                particlesRef.current.push({
                  x: enemy.x + enemy.w / 2,
                  y: enemy.y + enemy.h / 2,
                  vx: (Math.random() - 0.5) * 160,
                  vy: -Math.random() * 150 - 50,
                  color: enemy.type === 'snail' ? '#10B981' : '#F97316',
                  size: 5,
                  life: 0.5,
                  maxLife: 0.5,
                });
              }
            } else if (player.invulnerableTime <= 0) {
              // Player takes damage
              player.invulnerableTime = 1.5; // 1.5 seconds invulnerability
              sounds.playHurt();
              setHp(h => {
                const nextHp = h - 1;
                if (nextHp <= 0) {
                  onGameOver(false);
                }
                return Math.max(0, nextHp);
              });
              // Knockback
              player.vx = player.facing === 'left' ? 180 : -180;
              player.vy = -180;
            }
          }
        });

        // --- 9. TROPHY VICTORY CHECK (Summit Platform Y: 140, X: 850) ---
        // MUST solve all 20 questions to unlock the trophy!
        const trophyX = 940;
        const trophyY = 90;
        const distToTrophy = Math.hypot(
          player.x + player.w / 2 - trophyX,
          player.y + player.h / 2 - trophyY
        );

        const isTrophyUnlocked = solvedQuestions.size >= totalQuizzes;

        if (distToTrophy < 48) {
          if (isTrophyUnlocked) {
            sounds.playVictory();
            onGameOver(true);
          } else {
            // Push player back gently from the locked energy barrier
            player.vx = player.x < trophyX ? -160 : 160;
            player.vy = -80;

            if (currentTime - lastLockNoticeRef.current > 1200) {
              lastLockNoticeRef.current = currentTime;
              sounds.playHurt();
              const remaining = totalQuizzes - solvedQuestions.size;
              setLockNotice(`🔒 퀴즈 ${totalQuizzes}문제를 모두 풀어야 트로피를 얻을 수 있습니다! (남은 문제: ${remaining}개)`);
            }
          }
        }

        // Decrement invulnerable timer
        if (player.invulnerableTime > 0) {
          player.invulnerableTime -= dt;
        }
      } // end if (!isQuizActive)

      // --- 10. UPDATE PARTICLES ---
      particlesRef.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt; // gravity
        p.life -= dt;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // --- 11. CAMERA TRACKING ---
      // Center camera vertically & horizontally on rabbit
      const viewW = canvas.width;
      const viewH = canvas.height;

      let camX = player.x + player.w / 2 - viewW / 2;
      let camY = player.y + player.h / 2 - viewH / 2;

      // Clamp camera
      camX = Math.max(0, Math.min(camX, WORLD_WIDTH - viewW));
      camY = Math.max(0, Math.min(camY, WORLD_HEIGHT - viewH));

      // --- 12. RENDER SCENE ---
      ctx.clearRect(0, 0, viewW, viewH);

      // A. Sky & Clouds Background (Retro gradient)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
      skyGrad.addColorStop(0, '#70C5CE');
      skyGrad.addColorStop(1, '#BBE5ED');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(-camX, -camY);

      // B. Parallax Clouds & Distant Hills
      drawBackgroundDecor(ctx, camX, camY);

      // C. Draw Platforms & Ground
      platformsRef.current.forEach(plat => {
        drawPlatform(ctx, plat, solvedQuestions);
      });

      // D. Draw Ladders (Over platforms so rungs & handles are clearly visible)
      laddersRef.current.forEach(ladder => {
        drawLadder(ctx, ladder);
      });

      // E. Draw Coins
      const nowMs = performance.now();
      coinsRef.current.forEach(coin => {
        if (!coin.collected) {
          drawCoin(ctx, coin.x, coin.y, nowMs);
        }
      });

      // F. Draw Enemies
      enemiesRef.current.forEach(enemy => {
        if (enemy.alive) {
          drawEnemy(ctx, enemy);
        }
      });

      // G. Draw Summit Golden Trophy (Locked dome if questions remaining)
      drawTrophy(
        ctx,
        940,
        90,
        nowMs,
        solvedQuestions.size >= totalQuizzes,
        solvedQuestions.size,
        totalQuizzes
      );

      // H. Draw Particles
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      // H.5. Draw Super Lasers
      lasersRef.current.forEach(laser => {
        drawLaser(ctx, laser, nowMs);
      });

      // I. Draw Super Rabbit Character
      drawRabbit(ctx, player, nowMs, laserReady, laserTimeLeft);

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isQuizActive, laserReady, laserTimeLeft, onGameOver, onTriggerQuiz, setCoins, setHp, setScore, solvedQuestions, totalQuizzes, virtualKeys]);

  // Handle Resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 560;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (lockNotice) {
      const timer = setTimeout(() => setLockNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lockNotice]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-300 select-none">
      {/* On-screen animated toast when trying to grab locked trophy */}
      {lockNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-2 bg-rose-600/95 text-white rounded-2xl border-3 border-gray-950 shadow-2xl font-pixel text-xs sm:text-sm animate-bounce flex items-center gap-2 max-w-[92vw] text-center">
          <span className="text-base">🔒</span>
          <span>{lockNotice}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pixelated cursor-default"
      />
    </div>
  );
};

// ==========================================
// RENDER HELPERS (Pixel Art Aesthetics matching 1.jpg)
// ==========================================

function drawBackgroundDecor(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
  // Soft pixel clouds floating in sky
  const cloudPositions = [
    { x: 120, y: 1400 },
    { x: 600, y: 1350 },
    { x: 950, y: 1300 },
    { x: 300, y: 1050 },
    { x: 750, y: 950 },
    { x: 150, y: 700 },
    { x: 800, y: 620 },
    { x: 350, y: 380 },
    { x: 700, y: 220 },
    { x: 980, y: 160 },
  ];

  cloudPositions.forEach(c => {
    drawPixelCloud(ctx, c.x, c.y);
  });

  // Background Trees
  drawPixelTree(ctx, 60, WORLD_HEIGHT - 60 - 90);
  drawPixelTree(ctx, 800, WORLD_HEIGHT - 60 - 90);
  drawPixelTree(ctx, 350, 1180 - 85);
  drawPixelTree(ctx, 980, 840 - 85);
  drawPixelTree(ctx, 160, 500 - 85);
}

function drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#2B3A4A';
  ctx.lineWidth = 3;

  // Fluffy pixel cloud shapes matching 1.jpg
  ctx.beginPath();
  ctx.arc(x + 30, y + 25, 20, 0, Math.PI * 2);
  ctx.arc(x + 55, y + 15, 24, 0, Math.PI * 2);
  ctx.arc(x + 85, y + 20, 22, 0, Math.PI * 2);
  ctx.arc(x + 110, y + 26, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bottom flat filler
  ctx.fillRect(x + 20, y + 20, 95, 18);
  ctx.restore();
}

function drawPixelTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Trunk
  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(x + 22, y + 40, 16, 50);
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 22, y + 40, 16, 50);

  // Tree Foliage (Lush green cloud like in 1.jpg)
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(x + 30, y + 30, 28, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 36, 20, 0, Math.PI * 2);
  ctx.arc(x + 45, y + 36, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawLadder(ctx: CanvasRenderingContext2D, ladder: Ladder) {
  ctx.save();
  // Rails (Wood brown with pixel outline)
  ctx.fillStyle = '#D97706';
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2.5;

  // Left & right rail
  ctx.fillRect(ladder.x, ladder.y, 6, ladder.h);
  ctx.strokeRect(ladder.x, ladder.y, 6, ladder.h);

  ctx.fillRect(ladder.x + ladder.w - 6, ladder.y, 6, ladder.h);
  ctx.strokeRect(ladder.x + ladder.w - 6, ladder.y, 6, ladder.h);

  // Top handles (Rounded ladder top caps sticking onto the floor)
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(ladder.x - 1, ladder.y - 4, 8, 5);
  ctx.strokeRect(ladder.x - 1, ladder.y - 4, 8, 5);
  ctx.fillRect(ladder.x + ladder.w - 7, ladder.y - 4, 8, 5);
  ctx.strokeRect(ladder.x + ladder.w - 7, ladder.y - 4, 8, 5);

  // Rungs
  const rungStep = 22;
  for (let ry = ladder.y + 12; ry < ladder.y + ladder.h - 8; ry += rungStep) {
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(ladder.x + 4, ry, ladder.w - 8, 5);
    ctx.strokeRect(ladder.x + 4, ry, ladder.w - 8, 5);
  }
  ctx.restore();
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plat: Platform,
  solvedQuestions: Set<number>
) {
  ctx.save();

  if (plat.type === 'ground') {
    // Green Grass Top + Brown Earthy Dirt Below (Exact style in 1.jpg)
    // 1. Dirt base
    ctx.fillStyle = '#A16207';
    ctx.fillRect(plat.x, plat.y + 8, plat.w, plat.h - 8);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    ctx.strokeRect(plat.x, plat.y + 8, plat.w, plat.h - 8);

    // Dirt pebble details
    ctx.fillStyle = '#78350F';
    for (let dx = plat.x + 12; dx < plat.x + plat.w - 10; dx += 28) {
      ctx.fillRect(dx, plat.y + 14, 8, 6);
      ctx.fillRect(dx + 12, plat.y + 20, 6, 5);
    }

    // 2. Green Grass cap
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(plat.x, plat.y, plat.w, 10);
    ctx.strokeRect(plat.x, plat.y, plat.w, 10);

    // Little grass tufts hanging
    ctx.fillStyle = '#16A34A';
    for (let gx = plat.x + 8; gx < plat.x + plat.w - 6; gx += 16) {
      ctx.fillRect(gx, plat.y + 10, 5, 4);
    }
  } else if (plat.type === 'brick') {
    // Mario-style red brick block
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

    // Brick mortar pattern
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(plat.x + 2, plat.y + 2, plat.w - 4, plat.h / 2 - 3);
    ctx.fillRect(plat.x + 2, plat.y + plat.h / 2 + 1, plat.w - 4, plat.h / 2 - 3);
  } else if (plat.type === 'question') {
    // Question Block [?] or Solved Block [OK]
    const isSolved = plat.questionId && solvedQuestions.has(plat.questionId);

    if (isSolved) {
      // Dull checked block
      ctx.fillStyle = '#D1D5DB';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 3;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

      // Checkmark
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', plat.x + plat.w / 2, plat.y + plat.h / 2);
    } else {
      // Golden Glowing Question Block [?]
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 3;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

      // Inner highlight
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(plat.x + 3, plat.y + 3, plat.w - 6, 4);

      // Question Mark "?" with pulse
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 20px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', plat.x + plat.w / 2, plat.y + plat.h / 2 + 1);

      // Number badge below it
      if (plat.questionId) {
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'bold 9px "Galmuri9", sans-serif';
        ctx.fillText(`Q${plat.questionId}`, plat.x + plat.w / 2, plat.y - 7);
      }
    }
  }

  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  ctx.save();
  // Spinning oscillation
  const scaleX = Math.abs(Math.cos(timeMs * 0.005));

  ctx.translate(x, y);
  ctx.scale(Math.max(scaleX, 0.2), 1);

  // Outer gold circle
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner star/highlight
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-3, -7, 6, 14);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.type === 'snail') {
    // Cute Green Snail with brown shell
    ctx.fillStyle = '#854D0E';
    ctx.beginPath();
    ctx.arc(14, 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Snail body
    ctx.fillStyle = '#10B981';
    ctx.fillRect(4, 18, 24, 8);
    ctx.strokeRect(4, 18, 24, 8);

    // Eye tentacles
    ctx.fillRect(enemy.vx > 0 ? 24 : 6, 10, 4, 8);
  } else {
    // Spiky Hedgehog
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(16, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spikes on back
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(6, 4, 5, 6);
    ctx.fillRect(14, 2, 5, 7);
    ctx.fillRect(21, 5, 5, 6);

    // Little feet
    ctx.fillStyle = '#431407';
    ctx.fillRect(8, 22, 6, 6);
    ctx.fillRect(18, 22, 6, 6);
  }

  ctx.restore();
}

function drawTrophy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeMs: number,
  isUnlocked: boolean = true,
  solvedCount: number = 20,
  totalQuizzes: number = 20
) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(timeMs * 0.004) * 4;
  ctx.translate(0, bob);

  if (!isUnlocked) {
    // 1. Locked Protective Energy Barrier Dome
    const pulse = (Math.sin(timeMs * 0.008) + 1) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 8, 38 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.16 + pulse * 0.12})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();

    // 2. Dimmed Silvery Cup
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;

    // Cup bowl
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -10);
    ctx.lineTo(12, 12);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Handles
    ctx.beginPath();
    ctx.arc(-18, -2, 6, 0, Math.PI * 2);
    ctx.arc(18, -2, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Stem & Base
    ctx.fillRect(-4, 12, 8, 8);
    ctx.strokeRect(-4, 12, 8, 8);
    ctx.fillRect(-14, 20, 28, 6);
    ctx.strokeRect(-14, 20, 28, 6);

    // Lock icon in cup
    ctx.fillStyle = '#DC2626';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', 0, 5);

    // Locked Badge Banner
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-38, -26, 76, 16);
    ctx.strokeStyle = '#1F2937';
    ctx.strokeRect(-38, -26, 76, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Press Start 2P", sans-serif';
    ctx.fillText(`🔒${solvedCount}/${totalQuizzes}`, 0, -15);

    // Remaining text below base
    ctx.fillStyle = '#991B1B';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`남은 ${totalQuizzes - solvedCount}문제 필요!`, 0, 36);

    ctx.restore();
    return;
  }

  // --- UNLOCKED GLORIOUS TROPHY ---
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 16;

  // Golden Cup matching 1.jpg
  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2.5;

  // Cup bowl
  ctx.beginPath();
  ctx.moveTo(-16, -10);
  ctx.lineTo(16, -10);
  ctx.lineTo(12, 12);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Handles
  ctx.beginPath();
  ctx.arc(-18, -2, 6, 0, Math.PI * 2);
  ctx.arc(18, -2, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Stem & Base
  ctx.fillRect(-4, 12, 8, 8);
  ctx.strokeRect(-4, 12, 8, 8);
  ctx.fillRect(-14, 20, 28, 6);
  ctx.strokeRect(-14, 20, 28, 6);

  // Star in cup
  ctx.fillStyle = '#FEF08A';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 0, 4);

  // Golden sparkles orbiting cup
  const sparkAngle = timeMs * 0.006;
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(Math.cos(sparkAngle) * 24 - 2, Math.sin(sparkAngle) * 24 - 2, 4, 4);
  ctx.fillRect(Math.cos(sparkAngle + Math.PI) * 24 - 2, Math.sin(sparkAngle + Math.PI) * 24 - 2, 4, 4);

  // "GOAL" Banner
  ctx.fillStyle = '#10B981';
  ctx.fillRect(-30, -26, 60, 16);
  ctx.strokeRect(-30, -26, 60, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 8px "Press Start 2P", sans-serif';
  ctx.fillText('🏆GOAL!', 0, -15);

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('터치하여 클리어!', 0, 36);

  ctx.restore();
}

function drawRabbit(
  ctx: CanvasRenderingContext2D,
  player: {
    x: number;
    y: number;
    w: number;
    h: number;
    facing: 'left' | 'right';
    isGrounded: boolean;
    isClimbing: boolean;
    invulnerableTime: number;
    animTick: number;
  },
  timeMs: number,
  laserReady: boolean = false,
  laserTimeLeft: number = 0
) {
  // Invulnerability blink effect
  if (player.invulnerableTime > 0 && Math.floor(timeMs / 80) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  // Super Laser Aura (Mario Star / Fire Flower power effect when 5-streak active)
  if (laserReady) {
    const pulse = (Math.sin(timeMs * 0.012) + 1) / 2; // 0 to 1
    ctx.save();
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 12 + pulse * 10;
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 2.5;

    // Glowing energy aura circle around rabbit
    ctx.beginPath();
    ctx.ellipse(player.w / 2, player.h / 2, player.w / 2 + 8 + pulse * 4, player.h / 2 + 10 + pulse * 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Floating sparkle stars around rabbit
    const angle1 = timeMs * 0.005;
    const angle2 = angle1 + Math.PI;
    const r = 26;
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(player.w / 2 + Math.cos(angle1) * r - 2, player.h / 2 + Math.sin(angle1) * r - 2, 4, 4);
    ctx.fillRect(player.w / 2 + Math.cos(angle2) * r - 2, player.h / 2 + Math.sin(angle2) * r - 2, 4, 4);

    // Floating text indicator with remaining seconds
    ctx.fillStyle = laserTimeLeft <= 3 ? '#EF4444' : '#F59E0B';
    ctx.font = 'bold 8px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(laserTimeLeft > 0 ? `⚡${laserTimeLeft}s` : '⚡LASER', player.w / 2, -10 - pulse * 3);
    ctx.restore();
  }

  // Flip horizontally if facing left
  if (player.facing === 'left') {
    ctx.translate(player.w, 0);
    ctx.scale(-1, 1);
  }

  const isWalking = !player.isGrounded ? false : player.animTick % 10 > 5;
  const legOffset = isWalking ? 3 : 0;

  // 1. Ears (Pink with darker pink inner ear - exactly as in 1.jpg!)
  ctx.fillStyle = laserReady ? '#FDE047' : '#FBCFE8'; // Golden ears when in Super Laser Mode!
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2.5;

  // Left ear
  ctx.fillRect(8, 0, 7, 18);
  ctx.strokeRect(8, 0, 7, 18);
  // Inner left ear
  ctx.fillStyle = laserReady ? '#F59E0B' : '#F472B6';
  ctx.fillRect(10, 3, 3, 12);

  // Right ear
  ctx.fillStyle = laserReady ? '#FDE047' : '#FBCFE8';
  ctx.fillRect(18, 0, 7, 18);
  ctx.strokeRect(18, 0, 7, 18);
  // Inner right ear
  ctx.fillStyle = laserReady ? '#F59E0B' : '#F472B6';
  ctx.fillRect(20, 3, 3, 12);

  // 2. Head
  ctx.fillStyle = laserReady ? '#FEF08A' : '#FBCFE8';
  ctx.fillRect(4, 14, 26, 18);
  ctx.strokeRect(4, 14, 26, 18);

  // Cute black eyes
  ctx.fillStyle = '#111827';
  ctx.fillRect(20, 20, 3, 4);
  // White eye highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(21, 20, 1, 2);

  // Pink nose & whiskers
  ctx.fillStyle = '#EC4899';
  ctx.fillRect(26, 24, 2, 2);

  // Cute cheeks blush
  ctx.fillStyle = '#F472B6';
  ctx.fillRect(17, 25, 4, 3);

  // 3. Body
  ctx.fillStyle = laserReady ? '#FEF08A' : '#FBCFE8';
  ctx.fillRect(6, 28, 22, 12);
  ctx.strokeRect(6, 28, 22, 12);

  // White belly fur
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(12, 30, 12, 8);

  // 4. Feet / Paws
  ctx.fillStyle = laserReady ? '#F59E0B' : '#F472B6';
  ctx.fillRect(6 + legOffset, 40, 8, 4);
  ctx.strokeRect(6 + legOffset, 40, 8, 4);

  ctx.fillRect(18 - legOffset, 40, 8, 4);
  ctx.strokeRect(18 - legOffset, 40, 8, 4);

  // Little fluffy tail behind
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(2, 33, 4, 5);
  ctx.strokeRect(2, 33, 4, 5);

  ctx.restore();
}

function drawLaser(ctx: CanvasRenderingContext2D, laser: Laser, timeMs: number) {
  ctx.save();
  ctx.translate(laser.x, laser.y);

  // Blazing Outer Glow
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 12;

  // Energy Beam / Fire Carrot gradient
  const grad = ctx.createLinearGradient(0, 0, laser.w, 0);
  if (laser.vx > 0) {
    grad.addColorStop(0, '#EF4444');
    grad.addColorStop(0.5, '#F59E0B');
    grad.addColorStop(1, '#FEF08A');
  } else {
    grad.addColorStop(0, '#FEF08A');
    grad.addColorStop(0.5, '#F59E0B');
    grad.addColorStop(1, '#EF4444');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, laser.w, laser.h);

  // White core beam
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(2, 2, laser.w - 4, laser.h - 4);

  // Head tip pulse
  ctx.fillStyle = '#FEF08A';
  if (laser.vx > 0) {
    ctx.fillRect(laser.w, 1, 4, laser.h - 2);
  } else {
    ctx.fillRect(-4, 1, 4, laser.h - 2);
  }

  ctx.restore();
}
