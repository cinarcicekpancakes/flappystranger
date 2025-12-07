// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const settingsButton = document.getElementById('settings-button');
const settingsScreen = document.getElementById('settings-screen');
const saveSettingsButton = document.getElementById('save-settings');
const backToMenuButton = document.getElementById('back-to-menu');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const selectedCharacter = document.getElementById('selected-character');
const shopScreen = document.getElementById('shop-screen');
const shopButton = document.getElementById('shop-button');
const closeShopButton = document.getElementById('close-shop');
const shopSkullsLabel = document.getElementById('shop-skulls');

// Assets
const mindFlayerImage = new Image();
mindFlayerImage.src = 'images/mf.png';

const demogorgonImage = new Image();
demogorgonImage.src = 'images/demog.png';

const dustinImage = new Image();
dustinImage.src = 'images/dustin1.png';

// Sounds
let hitSound = null;
try {
    hitSound = new Audio('sounds/I hit.mp3');
} catch (_) {
    hitSound = null;
}

// Jump sound - we'll use Web Audio API for a short synth blip instead of mp3
// This ensures instant, short sounds even with rapid jumping
let audioContext = null;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (_) {
    audioContext = null;
}

// Background music
let bgMusic = null;
try {
    bgMusic = new Audio('sounds/bgm.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
} catch (_) {
    bgMusic = null;
}

// Score sound (when passing a pipe)
let scoreSound = null;
try {
    scoreSound = new Audio('sounds/score.mp3');
    scoreSound.volume = 0.4;
} catch (_) {
    scoreSound = null;
}

function playHitSound() {
    if (!hitSound) return;
    try {
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
    } catch (_) {
        // ignore audio errors
    }
}

function playJumpSound() {
    if (!audioContext) return;
    try {
        // Resume audio context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Create a short synth "blip" sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Quick upward pitch sweep for a "jump" feel
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.08);

        // Quick fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (_) {
        // ignore audio errors
    }
}

function playScoreSound() {
    if (!scoreSound) return;
    try {
        scoreSound.currentTime = 0;
        scoreSound.play().catch(() => {});
    } catch (_) {
        // ignore audio errors
    }
}

// Game constants
const GRAVITY = 0.45; // slightly softer fall for smoother motion
const JUMP_FORCE = -7; // lower jump height for finer control
const PIPE_WIDTH = 80;
// bigger vertical gap to make passing between pipes easier
const PIPE_GAP = 230;
let PIPE_SPEED = 2;

// Horizontal distance between consecutive pipes (randomized)
let nextPipeDistance = 200;

function resetNextPipeDistance() {
    // Random gap: at least 200px, up to ~400px
    nextPipeDistance = 200 + Math.random() * 200;
}

// Settings
let gameSpeed = 2;

// Skins
let currentSkin = 'demogorgon';
const skins = {
    demogorgon: { color: '#e63946', name: 'Demogorgon' },
    eleven: { color: '#4cc9f0', name: 'Eleven' },
    dustin: { color: '#f77f00', name: 'Dustin' },
    mike: { color: '#06ffa5', name: 'Mike' },
    max: { color: '#ff006e', name: 'Max' },
    hopper: { color: '#f0ead2', name: 'Hopper' },
    lucas: { color: '#70e000', name: 'Lucas' },
    will: { color: '#48bfe3', name: 'Will' },
    steve: { color: '#f5deb3', name: 'Steve' },
    nancy: { color: '#ffafcc', name: 'Nancy' },
    robin: { color: '#80ffdb', name: 'Robin' },
    erica: { color: '#ffd166', name: 'Erica' },
    jonathan: { color: '#b08968', name: 'Jonathan' },
    joyce: { color: '#ffe5b4', name: 'Joyce' },
    vecna: { color: '#b5179e', name: 'Vecna' },
    waffle: { color: '#f4a261', name: 'Waffle' },
    // color for mind flayer is mostly ignored in drawing (we render it as a black shadow),
    // but keep a dark tone for any effects that use this color
    mindflayer: { color: '#111111', name: 'Mind Flayer' }
};

// Skin shop: which skins cost skulls to unlock
const skinCosts = {
    mindflayer: 40,
    vecna: 60,
    waffle: 25,
    steve: 25,
    nancy: 25,
    robin: 25
};

// Unlock state of skins
let unlockedSkins = null;
try {
    unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins') || 'null');
} catch (_) {
    unlockedSkins = null;
}
if (!unlockedSkins) {
    // Default unlocked characters
    unlockedSkins = {
        demogorgon: true,
        eleven: true,
        dustin: true,
        mike: true,
        max: true,
        hopper: true,
        lucas: true,
        will: true
    };
    localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
}

function isSkinUnlocked(name) {
    return !!unlockedSkins[name];
}

function saveUnlockedSkins() {
    localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
}

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let skulls = parseInt(localStorage.getItem('skulls') || '0');
let animationId;
let particles = [];
let pipes = [];

// Shield system (Captain America's shield)
let shieldCharges = 0;              // how many shields you have stored
let shieldUntil = 0;               // timestamp (ms) until which shield is active
const SHIELD_DURATION = 5000;      // 5 seconds of invulnerability after a hit

function hasActiveShield() {
    return shieldUntil > performance.now();
}

function activateTimedShield() {
    shieldUntil = performance.now() + SHIELD_DURATION;
}

// Player
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 100;
        this.y = canvas.height / 2;
        // logical hitbox; visuals are scaled so height ~= 100px
        this.width = 45;
        this.height = 100;
        this.velocity = 0;
        this.rotation = 0;
        this.color = '#e63946';
    }
    
    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.1));
        
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        
        if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.velocity = 0;
            if (gameRunning) {
                // If we have shield (active or stored), prevent death and trigger/extend shield
                if (hasActiveShield() || shieldCharges > 0) {
                    if (!hasActiveShield() && shieldCharges > 0) {
                        shieldCharges--;
                        activateTimedShield();
                    }
                    playHitSound();
                    // small bounce up as feedback
                    this.velocity = JUMP_FORCE * 0.6;
                } else {
                    playHitSound();
                    gameOver();
                }
            }
        }
    }
    
    jump() {
        if (!gameRunning) return;
        this.velocity = JUMP_FORCE;
        playJumpSound();
        // a few more particles for a richer jump effect
        createParticles(this.x + this.width/2, this.y + this.height/2, 8, this.color);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Shield aura when shield is active
        if (hasActiveShield()) {
            ctx.save();
            const radius = Math.max(this.width, this.height);
            const gradient = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 1.3);
            gradient.addColorStop(0, 'rgba(173, 216, 230, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 120, 255, 0.0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const skin = skins[currentSkin];
        ctx.fillStyle = skin.color;
        
        switch(currentSkin) {
            case 'demogorgon':
                this.drawDemogorgon(ctx, skin.color);
                break;
            case 'eleven':
                this.drawEleven(ctx, skin.color);
                break;
            case 'mindflayer':
                this.drawMindFlayer(ctx, skin.color);
                break;
            case 'waffle':
                this.drawWaffle(ctx, skin.color);
                break;
            default:
                this.drawCharacter(ctx, skin.color);
                break;
        }
        
        ctx.restore();
    }
    
    drawDemogorgon(ctx, color) {
        // If sprite image is loaded, draw it so height matches this.height
        if (demogorgonImage.complete && demogorgonImage.naturalWidth > 0) {
            const scale = this.height / demogorgonImage.naturalHeight;
            const drawWidth = demogorgonImage.naturalWidth * scale;
            const drawHeight = this.height;

            // Center sprite on player origin
            ctx.drawImage(
                demogorgonImage,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );
            return;
        }

        // Fallback: procedural Demogorgon if sprite not ready
        // Animated mouth opening/closing
        const mouthPulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;

        // Head (flower-like)
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2.4, this.height / 2.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark mouth circle in center (animated size)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, (this.width / 5) * mouthPulse, 0, Math.PI * 2);
        ctx.fill();

        // Petals (sharper, more pointy tips) - animated spread
        const petalSpread = Math.sin(performance.now() * 0.006) * 0.1 + 1;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.fillStyle = color;
            ctx.beginPath();
            // base of petal near the mouth
            ctx.moveTo(this.width / 4.5, -this.height / 7);
            ctx.lineTo(this.width / 4.5, this.height / 7);
            // long, narrow tip far out for a spiky look (animated)
            ctx.lineTo((this.width / 1.3) * petalSpread, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    drawEleven(ctx, color) {
        // Head
        ctx.fillStyle = '#f5d6c6';
        ctx.beginPath();
        ctx.arc(0, -3, this.width / 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Hair (short)
        ctx.fillStyle = '#3b3b3b';
        ctx.beginPath();
        ctx.arc(0, -5, this.width / 2.6, Math.PI, 0);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -4, 1.5, 0, Math.PI * 2);
        ctx.arc(4, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Nose bleed
        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 1.5);
        ctx.stroke();

        // Jacket (blue)
        ctx.fillStyle = '#4361ee';
        ctx.beginPath();
        ctx.roundRect(-this.width / 3, 0, (2 * this.width) / 3, this.height / 1.4, 4);
        ctx.fill();
    }

    drawMindFlayer(ctx, color) {
        // If sprite image is loaded, draw it so height matches this.height
        if (mindFlayerImage.complete && mindFlayerImage.naturalWidth > 0) {
            const scale = this.height / mindFlayerImage.naturalHeight;
            const drawWidth = mindFlayerImage.naturalWidth * scale;
            const drawHeight = this.height;

            // Center image on player origin (0,0 in local coords after translate)
            ctx.drawImage(
                mindFlayerImage,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );
            return;
        }

        // Fallback: vector ghosty shadow if image is not ready yet
        // Narrow ghosty shadow body
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, -3, this.width / 3.4, this.height / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Long, pointy tail (dark wisp that ends in a sharp tip)
        const tailLen = this.height * 2.8;
        ctx.beginPath();
        ctx.moveTo(-this.width / 5, 4);
        ctx.lineTo(this.width / 5, 4);
        ctx.lineTo(0, 4 + tailLen);
        ctx.closePath();
        const tailGradient = ctx.createLinearGradient(0, 4, 0, 4 + tailLen);
        tailGradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        tailGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.55)');
        tailGradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = tailGradient;
        ctx.fill();

        // Thin shadowy tendrils from the body (animated wave)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 1.3;
        const tentacleLen = this.height * 2.1;
        const waveTime = performance.now() * 0.003;
        for (let i = 0; i < 6; i++) {
            const waveOffset = Math.sin(waveTime + i * 0.8) * 0.15;
            const angle = (-Math.PI / 2) + (i - 2.5) * 0.28 + waveOffset;
            ctx.beginPath();
            ctx.moveTo(0, -1);
            const cx = Math.cos(angle) * (tentacleLen * 0.35);
            const cy = Math.sin(angle) * (tentacleLen * 0.35);
            const ex = Math.cos(angle) * tentacleLen * 0.9;
            const ey = Math.sin(angle) * tentacleLen * 0.9;
            ctx.quadraticCurveTo(cx, cy, ex, ey);
            ctx.stroke();
        }

        // Subtle shadow aura
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -3, this.width / 1.9, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawCharacter(ctx, color) {
        // Generic human-ish face used for most human characters
        ctx.fillStyle = '#f5d6c6';
        ctx.beginPath();
        ctx.arc(0, -3, this.width / 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Hair / hat per character
        if (currentSkin === 'dustin' && dustinImage.complete && dustinImage.naturalWidth > 0) {
            // If Dustin sprite is loaded, draw it so height matches this.height
            const scale = this.height / dustinImage.naturalHeight;
            const drawWidth = dustinImage.naturalWidth * scale;
            const drawHeight = this.height;
            ctx.drawImage(
                dustinImage,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );
            return;
        } else if (currentSkin === 'dustin') {
            // Cap: blue with white front and red brim
            ctx.fillStyle = '#1d3557';
            ctx.beginPath();
            ctx.arc(0, -6, this.width / 2.6, Math.PI, 0);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 3.2, Math.PI, 0);
            ctx.fill();

            ctx.fillStyle = '#e63946';
            ctx.beginPath();
            ctx.ellipse(0, -1, this.width / 2.2, this.height / 7, 0, 0, Math.PI);
            ctx.fill();
        } else if (currentSkin === 'mike') {
            // Dark messy hair
            ctx.fillStyle = '#2b2b2b';
            ctx.beginPath();
            ctx.arc(0, -6, this.width / 2.4, Math.PI, 0);
            ctx.fill();
        } else if (currentSkin === 'max') {
            // Red hair band and hair
            ctx.fillStyle = '#ff7b54';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.5, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = '#ff7b54';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.width / 3, -2);
            ctx.lineTo(-this.width / 3, 4);
            ctx.moveTo(this.width / 3, -2);
            ctx.lineTo(this.width / 3, 4);
            ctx.stroke();
        } else if (currentSkin === 'hopper') {
            // Hopper: tan hat and short hair
            ctx.fillStyle = '#c2a878';
            ctx.beginPath();
            ctx.arc(0, -6, this.width / 2.4, Math.PI, 0);
            ctx.fill();

            // hat brim
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(0, -3, this.width / 1.8, this.height / 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (currentSkin === 'lucas') {
            // Lucas: green headband
            ctx.fillStyle = '#1b4332';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.5, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = '#70e000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2.5, -4);
            ctx.lineTo(this.width / 2.5, -4);
            ctx.stroke();
        } else if (currentSkin === 'will') {
            // Will: bowl haircut
            ctx.fillStyle = '#5c3b2e';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.5, Math.PI, 0);
            ctx.fill();
        } else if (currentSkin === 'steve') {
            // Steve: big fluffy hair
            ctx.fillStyle = '#5c3b2e';
            ctx.beginPath();
            ctx.arc(0, -6, this.width / 2.1, Math.PI, 0);
            ctx.fill();
        } else if (currentSkin === 'nancy') {
            // Nancy: lighter hair with small bangs
            ctx.fillStyle = '#c28f6b';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.4, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = '#c28f6b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, -4);
            ctx.lineTo(-this.width / 5, -2);
            ctx.moveTo(this.width / 4, -4);
            ctx.lineTo(this.width / 5, -2);
            ctx.stroke();
        } else if (currentSkin === 'robin') {
            // Robin: short bob cut
            ctx.fillStyle = '#6d597a';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.5, Math.PI, 0);
            ctx.fill();
        } else if (currentSkin === 'erica') {
            // Erica: twin puffs
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-this.width / 3, -6, this.width / 6, 0, Math.PI * 2);
            ctx.arc(this.width / 3, -6, this.width / 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (currentSkin === 'jonathan') {
            // Jonathan: straight hair covering forehead
            ctx.fillStyle = '#3f2e2b';
            ctx.beginPath();
            ctx.arc(0, -5, this.width / 2.4, Math.PI, 0);
            ctx.fill();

            ctx.fillStyle = '#3f2e2b';
            ctx.fillRect(-this.width / 3, -5, (2 * this.width) / 3, 3);
        } else if (currentSkin === 'joyce') {
            // Joyce: wavy hair strands
            ctx.strokeStyle = '#8d5524';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.width / 3, -4);
            ctx.quadraticCurveTo(-this.width / 4, 0, -this.width / 3, 4);
            ctx.moveTo(this.width / 3, -4);
            ctx.quadraticCurveTo(this.width / 4, 0, this.width / 3, 4);
            ctx.stroke();
        } else if (currentSkin === 'vecna') {
            // Vecna: simple cracked head lines
            ctx.strokeStyle = '#b5179e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-3, -6);
            ctx.lineTo(0, -2);
            ctx.lineTo(2, -4);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3.5, -3, 1.4, 0, Math.PI * 2);
        ctx.arc(3.5, -3, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Simple mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 1.5, 4, 0, Math.PI);
        ctx.stroke();
    }

    drawWaffle(ctx, color) {
        // Base waffle: rounded square
        const size = this.width * 1.4;
        const half = size / 2;
        ctx.fillStyle = '#f4b074';
        ctx.beginPath();
        ctx.roundRect(-half, -half, size, size, 4);
        ctx.fill();

        // Slight shading
        const grad = ctx.createLinearGradient(-half, -half, half, half);
        grad.addColorStop(0, 'rgba(255, 230, 190, 0.7)');
        grad.addColorStop(1, 'rgba(180, 110, 50, 0.7)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.roundRect(-half, -half, size, size, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Grid pattern
        ctx.strokeStyle = 'rgba(150, 90, 40, 0.9)';
        ctx.lineWidth = 1;
        const step = size / 4;
        for (let i = -half + step; i < half; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, -half + 2);
            ctx.lineTo(i, half - 2);
            ctx.stroke();
        }
        for (let j = -half + step; j < half; j += step) {
            ctx.beginPath();
            ctx.moveTo(-half + 2, j);
            ctx.lineTo(half - 2, j);
            ctx.stroke();
        }

        // Syrup blob
        ctx.fillStyle = '#b5651d';
        ctx.beginPath();
        ctx.ellipse(2, -2, size / 6, size / 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Small butter square on top
        ctx.fillStyle = '#ffe066';
        const butter = size / 8;
        ctx.beginPath();
        ctx.roundRect(-butter / 2, -butter / 2 - 2, butter, butter, 2);
        ctx.fill();
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.width = PIPE_WIDTH;
        this.gapY = Math.random() * (canvas.height - 200) + 100;
        this.passed = false;
        this.color = `hsl(${Math.random() * 30 + 330}, 70%, 40%)`;
    }
    
    update(player) {
        this.x -= PIPE_SPEED;
        
        if (!this.passed && this.x + this.width < player.x) {
            this.passed = true;
            score++;
            skulls++;
            localStorage.setItem('skulls', skulls.toString());
            playScoreSound();
            if (score % 10 === 0) {
                shieldCharges++;
                createParticles(this.x + this.width/2, this.gapY, 12, '#4dabf7');
            }
            updateHudText();
            createParticles(this.x + this.width/2, this.gapY, 10, this.color);
        }
        
        if (player.x + player.width > this.x && 
            player.x < this.x + this.width) {
            if (player.y < this.gapY - PIPE_GAP/2 || 
                player.y + player.height > this.gapY + PIPE_GAP/2) {
                // Collision with pipe: if shield available, consume & activate shield instead of dying
                if (hasActiveShield() || shieldCharges > 0) {
                    if (!hasActiveShield() && shieldCharges > 0) {
                        shieldCharges--;
                        activateTimedShield();
                    }
                    playHitSound();
                    // knockback feedback
                    player.velocity = JUMP_FORCE * 0.8;
                    createParticles(player.x + player.width/2, player.y + player.height/2, 20, '#4dabf7');
                } else {
                    playHitSound();
                    gameOver();
                }
            }
        }
    }
    
    draw(ctx) {
        // main pipe body
        const gradientTop = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradientTop.addColorStop(0, '#3b0005');
        gradientTop.addColorStop(0.5, this.color);
        gradientTop.addColorStop(1, '#220003');
        ctx.fillStyle = gradientTop;
        ctx.fillRect(this.x, 0, this.width, this.gapY - PIPE_GAP/2);

        const gradientBottom = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradientBottom.addColorStop(0, '#3b0005');
        gradientBottom.addColorStop(0.5, this.color);
        gradientBottom.addColorStop(1, '#220003');
        ctx.fillStyle = gradientBottom;
        ctx.fillRect(
            this.x, 
            this.gapY + PIPE_GAP/2, 
            this.width, 
            canvas.height - (this.gapY + PIPE_GAP/2)
        );

        // pipe caps with highlight
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - 5, this.gapY - PIPE_GAP/2 - 20, this.width + 10, 20);
        ctx.fillRect(this.x - 5, this.gapY + PIPE_GAP/2, this.width + 10, 20);

        ctx.fillStyle = 'rgba(255, 200, 200, 0.12)';
        ctx.fillRect(this.x - 3, this.gapY - PIPE_GAP/2 - 18, this.width / 2.5, 6);
        ctx.fillRect(this.x - 3, this.gapY + PIPE_GAP/2 + 2, this.width / 2.5, 6);

        // subtle inner lines / texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.5;
        for (let y = 22; y < this.gapY - PIPE_GAP/2; y += 26) {
            ctx.beginPath();
            ctx.moveTo(this.x + 4, y);
            ctx.lineTo(this.x + this.width - 4, y);
            ctx.stroke();
        }
        for (let y = this.gapY + PIPE_GAP/2 + 22; y < canvas.height - 20; y += 26) {
            ctx.beginPath();
            ctx.moveTo(this.x + 4, y);
            ctx.lineTo(this.x + this.width - 4, y);
            ctx.stroke();
        }
    }
    
    shouldSpawnNext() {
        return this.x < canvas.width - 200;
    }
}

// Particle system
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            color: color || `hsl(${Math.random() * 60 + 0}, 100%, 50%)`,
            life: 100,
            decay: Math.random() * 3 + 1
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 100;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Character selection
function selectCharacter(skinName) {
    if (!isSkinUnlocked(skinName)) {
        selectedCharacter.textContent = `${skins[skinName].name} is locked - buy it in the shop with skulls.`;
        return;
    }

    currentSkin = skinName;
    selectedCharacter.textContent = `Selected: ${skins[skinName].name}`;
    
    document.querySelectorAll('.character-btn').forEach(btn => {
        if (btn.dataset.skin === skinName) {
            btn.style.border = '3px solid white';
            btn.style.transform = 'scale(1.1)';
        } else {
            btn.style.border = 'none';
            btn.style.transform = 'scale(1)';
        }
    });
    
    localStorage.setItem('selectedSkin', skinName);
}

// Shop helpers
function openShop() {
    if (shopScreen) {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        settingsScreen.classList.add('hidden');
        shopScreen.classList.remove('hidden');
        updateShopUI();
    }
}

function closeShop() {
    if (shopScreen) {
        shopScreen.classList.add('hidden');
        showStartScreen();
    }
}

function updateShopUI() {
    if (shopSkullsLabel) {
        shopSkullsLabel.textContent = skulls;
    }
    const items = document.querySelectorAll('.shop-item');
    items.forEach(btn => {
        const skin = btn.dataset.skin;
        const cost = parseInt(btn.dataset.cost || '0', 10);
        const costEl = btn.querySelector('.shop-cost');

        if (isSkinUnlocked(skin)) {
            if (currentSkin === skin) {
                // Currently equipped
                if (costEl) costEl.textContent = '✓ EQUIPPED';
                btn.style.border = '2px solid #4ade80';
            } else {
                // Owned but not equipped
                if (costEl) costEl.textContent = 'Owned';
                btn.style.border = '1px solid #374151';
            }
            btn.disabled = false; // Allow clicking to equip
        } else {
            if (costEl) costEl.textContent = `${cost} skulls`;
            btn.style.border = '1px solid #374151';
            btn.disabled = skulls < cost;
        }
    });
}

// Settings functions
function updateSpeed(speed) {
    gameSpeed = parseFloat(speed);
    PIPE_SPEED = gameSpeed;
    speedValue.textContent = gameSpeed;
}

function loadSettings() {
    const savedSpeed = localStorage.getItem('gameSpeed') || '2';
    updateSpeed(savedSpeed);
    speedSlider.value = savedSpeed;
    
    const savedSkin = localStorage.getItem('selectedSkin') || 'demogorgon';
    selectCharacter(savedSkin);
}

function saveSettings() {
    localStorage.setItem('gameSpeed', gameSpeed.toString());
    showStartScreen();
}

function showSettingsScreen() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsScreen.classList.remove('hidden');
    settingsButton.style.display = 'none';
}

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    settingsScreen.classList.add('hidden');
    settingsButton.style.display = 'block';
}

// Character-specific game over messages
const gameOverMessages = {
    demogorgon: "The Upside Down claims another...",
    eleven: "Friends don't lie... but gravity does.",
    dustin: "Son of a bitch!",
    mike: "This is not a drill!",
    max: "Running up that hill wasn't enough.",
    hopper: "Mornings are for coffee and contemplation.",
    lucas: "You rolled a 1...",
    will: "Will the Wise has fallen.",
    steve: "That hair couldn't save you.",
    nancy: "Should've grabbed the shotgun.",
    robin: "Dingus down!",
    erica: "You can't spell America without Erica... but you can spell GAME OVER.",
    jonathan: "Should've stayed in the darkroom.",
    joyce: "The lights went out.",
    vecna: "You got Vecna'd!",
    waffle: "Eleven is sad now.",
    mindflayer: "The Shadow Monster returns to the void."
};

// Character voice settings for TTS
const characterVoiceSettings = {
    demogorgon: { pitch: 0.3, rate: 0.7, preferMale: true },
    eleven: { pitch: 1.3, rate: 0.85, preferMale: false },
    dustin: { pitch: 1.1, rate: 1.1, preferMale: true },
    mike: { pitch: 1.0, rate: 1.0, preferMale: true },
    max: { pitch: 1.2, rate: 1.0, preferMale: false },
    hopper: { pitch: 0.6, rate: 0.8, preferMale: true },
    lucas: { pitch: 1.0, rate: 1.0, preferMale: true },
    will: { pitch: 1.2, rate: 0.9, preferMale: true },
    steve: { pitch: 0.9, rate: 1.0, preferMale: true },
    nancy: { pitch: 1.1, rate: 0.95, preferMale: false },
    robin: { pitch: 1.15, rate: 1.05, preferMale: false },
    erica: { pitch: 1.4, rate: 1.1, preferMale: false },
    jonathan: { pitch: 0.85, rate: 0.9, preferMale: true },
    joyce: { pitch: 1.0, rate: 1.0, preferMale: false },
    vecna: { pitch: 0.2, rate: 0.6, preferMale: true },
    waffle: { pitch: 1.5, rate: 1.2, preferMale: false },
    mindflayer: { pitch: 0.1, rate: 0.5, preferMale: true }
};

// Text-to-Speech function
function speakMessage(text) {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get character-specific voice settings
    const settings = characterVoiceSettings[currentSkin] || { pitch: 1.0, rate: 0.9, preferMale: false };

    // Try to find an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (settings.preferMale) {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David')));
    } else {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen')));
    }

    // Fallback to any English voice
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
}

function showGameOverScreen() {
    const message = gameOverMessages[currentSkin] || "Game Over!";
    finalScoreElement.innerHTML = `${score} (High: ${highScore})<br><span style="font-size: 0.6em; color: #aaa;">${message}</span>`;
    gameOverScreen.classList.remove('hidden');
    settingsScreen.classList.add('hidden');
    settingsButton.style.display = 'block';

    // Speak the game over message
    speakMessage(message);
}

// Game control functions
function updateHudText() {
    scoreElement.textContent = `Score: ${score}  Skulls: ${skulls}  Shields: ${shieldCharges}`;
}

function startGame() {
    if (gameRunning) return;
    
    pipes = [];
    particles = [];
    player.y = canvas.height / 2;
    player.velocity = 0;
    score = 0;
    shieldCharges = 0;
    shieldUntil = 0;
    resetNextPipeDistance();
    updateHudText();
    
    PIPE_SPEED = gameSpeed;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsScreen.classList.add('hidden');
    settingsButton.style.display = 'none';
    
    gameRunning = true;

    // Start background music
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(() => {});
    }
}

function gameOver() {
    if (!gameRunning) return;
    
    gameRunning = false;

    // Stop background music
    if (bgMusic) {
        bgMusic.pause();
    }
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    showGameOverScreen();
    
    for (let i = 0; i < 30; i++) {
        createParticles(
            player.x + player.width/2, 
            player.y + player.height/2, 
            1, 
            `hsl(${Math.random() * 60}, 100%, 50%)`
        );
    }
}

// Game loop
function gameLoop() {
    // Grey cloudy background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#2b2b2b');
    bgGradient.addColorStop(1, '#111111');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === PARALLAX LAYER 1: Far background - Hawkins Lab silhouette (slowest) ===
    const farScrollSpeed = 0.005;
    const farOffset = (performance.now() * farScrollSpeed) % canvas.width;
    ctx.fillStyle = 'rgba(30, 30, 40, 0.6)';
    // Simple building silhouettes
    for (let i = 0; i < 4; i++) {
        const bx = (i * 200 - farOffset + canvas.width) % (canvas.width + 200) - 100;
        const bh = 80 + (i % 3) * 30;
        ctx.fillRect(bx, canvas.height - bh, 60, bh);
        ctx.fillRect(bx + 70, canvas.height - bh - 20, 40, bh + 20);
    }
    // Radio tower
    const towerX = (300 - farOffset + canvas.width) % (canvas.width + 200) - 100;
    ctx.strokeStyle = 'rgba(50, 50, 60, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX - 20, canvas.height);
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX + 20, canvas.height);
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX, canvas.height - 180);
    ctx.stroke();

    // === PARALLAX LAYER 2: Mid - Trees (medium speed) ===
    const midScrollSpeed = 0.015;
    const midOffset = (performance.now() * midScrollSpeed) % canvas.width;
    ctx.fillStyle = 'rgba(20, 25, 20, 0.5)';
    for (let i = 0; i < 10; i++) {
        const tx = (i * 80 - midOffset + canvas.width) % (canvas.width + 100) - 50;
        const th = 60 + (i % 4) * 20;
        // Simple triangle tree
        ctx.beginPath();
        ctx.moveTo(tx, canvas.height);
        ctx.lineTo(tx + 15, canvas.height - th);
        ctx.lineTo(tx + 30, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    // === PARALLAX LAYER 3: Soft cloud blobs (faster) ===
    for (let i = 0; i < 8; i++) {
        const cx = (i * 80 + performance.now() * 0.02) % (canvas.width + 160) - 80;
        const cy = (i % 2 === 0 ? 100 : 180) + (Math.sin((performance.now() * 0.0007) + i) * 25);
        const radiusX = 90;
        const radiusY = 40;
        ctx.fillStyle = 'rgba(180, 180, 190, 0.1)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (gameRunning) {
        if (
            pipes.length === 0 ||
            // distance from right edge of canvas to right edge of last pipe
            (canvas.width - (pipes[pipes.length - 1].x + pipes[pipes.length - 1].width)) >= nextPipeDistance
        ) {
            pipes.push(new Pipe());
            resetNextPipeDistance();
        }
        
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update(player);
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }
        
        player.update();
    }
    
    pipes.forEach(pipe => pipe.draw(ctx));
    
    updateParticles();
    drawParticles(ctx);
    
    player.draw(ctx);
    
    if (gameRunning) {
        // Red lightning flash overlay
        if (Math.random() > 0.985) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Simple jagged lightning bolt
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
            ctx.lineWidth = 3;
            const startX = Math.random() * canvas.width;
            let x = startX;
            let y = 0;
            ctx.beginPath();
            ctx.moveTo(x, y);
            while (y < canvas.height) {
                x += (Math.random() - 0.5) * 40;
                y += 25 + Math.random() * 20;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', () => player.jump());
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!gameRunning && !gameOverScreen.classList.contains('hidden')) {
            startGame();
        } else {
            player.jump();
        }
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.querySelectorAll('.character-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectCharacter(btn.dataset.skin);
    });
});

settingsButton.addEventListener('click', showSettingsScreen);
saveSettingsButton.addEventListener('click', saveSettings);
backToMenuButton.addEventListener('click', showStartScreen);
speedSlider.addEventListener('input', (e) => {
    updateSpeed(e.target.value);
});

if (shopButton && shopScreen) {
    shopButton.addEventListener('click', () => {
        openShop();
    });
}

if (closeShopButton && shopScreen) {
    closeShopButton.addEventListener('click', () => {
        closeShop();
    });
}

// Shop purchase/equip buttons
document.querySelectorAll('.shop-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const skin = btn.dataset.skin;
        const cost = parseInt(btn.dataset.cost || '0', 10);

        if (isSkinUnlocked(skin)) {
            // Already owned - equip it
            selectCharacter(skin);
            updateShopUI();
            return;
        }

        // Not owned - try to purchase
        if (skulls < cost) return;
        skulls -= cost;
        localStorage.setItem('skulls', skulls.toString());
        unlockedSkins[skin] = true;
        saveUnlockedSkins();
        // Auto-equip after purchase
        selectCharacter(skin);
        updateHudText();
        updateShopUI();
    });
});

// Initialize
player = new Player(canvas);
loadSettings();
showStartScreen();

for (let i = 0; i < 20; i++) {
    createParticles(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
    );
}

gameLoop();
