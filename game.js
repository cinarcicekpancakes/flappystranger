// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_WIDTH = 80;
const PIPE_GAP = 150;
let PIPE_SPEED = 2;
let PIPE_SPAWN_RATE = 1500; // milliseconds

// Settings
let gameSpeed = 2;

// Skins
let currentSkin = 'demogorgon';
const skins = {
    demogorgon: { color: '#e63946', name: 'Demogorgon' },
    eleven: { color: '#4cc9f0', name: 'Eleven' },
    dustin: { color: '#f77f00', name: 'Dustin' },
    mike: { color: '#06ffa5', name: 'Mike' },
    max: { color: '#ff006e', name: 'Max' }
};

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let animationId;
let lastPipeSpawn = 0;
let particles = [];

// Player
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    rotation: 0,
    color: '#e63946',
    
    update: function() {
        // Apply gravity
        this.velocity += GRAVITY;
        this.y += this.velocity;
        
        // Rotate based on velocity
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.1));
        
        // Check boundaries
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
            if (gameRunning) gameOver();
        }
    },
    
    jump: function() {
        if (!gameRunning) return;
        this.velocity = JUMP_FORCE;
        createParticles(this.x + this.width/2, this.y + this.height/2, 5, '#e63946');
    },
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        const skin = skins[currentSkin];
        ctx.fillStyle = skin.color;
        
        // Draw different characters based on skin
        if (currentSkin === 'demogorgon') {
            // Demogorgon head
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(5, 0, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Petals/teeth
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.save();
                ctx.rotate(angle);
                ctx.fillStyle = skin.color;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(30, 5);
                ctx.lineTo(30, -5);
                ctx.fill();
                ctx.restore();
            }
        } else if (currentSkin === 'eleven') {
            // Eleven with psychic powers
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Psychic aura
            ctx.strokeStyle = skin.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Nose bleed effect
            ctx.fillStyle = '#e63946';
            ctx.beginPath();
            ctx.arc(-5, -5, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Other characters - simple circle with face
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-8, -5, 3, 0, Math.PI * 2);
            ctx.arc(8, -5, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.beginPath();
            ctx.arc(0, 5, 8, 0, Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }
};

// Pipes
const pipes = [];

class Pipe {
    constructor() {
        this.x = canvas.width;
        this.width = PIPE_WIDTH;
        this.gapY = Math.random() * (canvas.height - 200) + 100;
        this.passed = false;
        this.color = `hsl(${Math.random() * 30 + 330}, 70%, 40%)`;
    }
    
    update() {
        this.x -= PIPE_SPEED;
        
        // Score point if player passes the pipe
        if (!this.passed && this.x + this.width < player.x) {
            this.passed = true;
            score++;
            scoreElement.textContent = score;
            createParticles(this.x + this.width/2, this.gapY, 10, this.color);
        }
        
        // Check collision with player
        if (player.x + player.width > this.x && 
            player.x < this.x + this.width) {
            if (player.y < this.gapY - PIPE_GAP/2 || 
                player.y + player.height > this.gapY + PIPE_GAP/2) {
                gameOver();
            }
        }
    }
    
    draw() {
        // Top pipe
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.width, this.gapY - PIPE_GAP/2);
        
        // Bottom pipe
        ctx.fillRect(
            this.x, 
            this.gapY + PIPE_GAP/2, 
            this.width, 
            canvas.height - (this.gapY + PIPE_GAP/2)
        );
        
        // Pipe edges
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - 5, this.gapY - PIPE_GAP/2 - 20, this.width + 10, 20);
        ctx.fillRect(this.x - 5, this.gapY + PIPE_GAP/2, this.width + 10, 20);
        
        // Pipe pattern
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        for (let y = 20; y < this.gapY - PIPE_GAP/2; y += 30) {
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
        for (let y = this.gapY + PIPE_GAP/2; y < canvas.height - 20; y += 30) {
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
    }
}

// Particle system for effects
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

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 100;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Game loop
function gameLoop(timestamp) {
    // Clear canvas with a dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines for Upside Down effect
    ctx.strokeStyle = '#1a1a33';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Update and draw game objects
    if (gameRunning) {
        // Spawn new pipes only when previous pipe is off screen
        if (pipes.length === 0 || (pipes[pipes.length - 1].x < canvas.width - 200)) {
            pipes.push(new Pipe());
        }
        
        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }
        
        // Update player
        player.update();
    }
    
    // Draw pipes
    pipes.forEach(pipe => pipe.draw());
    
    // Update and draw particles
    updateParticles();
    drawParticles();
    
    // Draw player
    player.draw();
    
    // Draw "The Upside Down" effect
    if (gameRunning) {
        ctx.fillStyle = 'rgba(0, 20, 40, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Random lightning effect
        if (Math.random() > 0.99) {
            ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Character selection functions
function selectCharacter(skinName) {
    currentSkin = skinName;
    document.getElementById('selected-character').textContent = `Selected: ${skins[skinName].name}`;
    
    // Update button styles
    document.querySelectorAll('.character-btn').forEach(btn => {
        if (btn.dataset.skin === skinName) {
            btn.style.border = '3px solid white';
            btn.style.transform = 'scale(1.1)';
        } else {
            btn.style.border = 'none';
            btn.style.transform = 'scale(1)';
        }
    });
    
    // Save preference
    localStorage.setItem('selectedSkin', skinName);
}

// Settings functions
function updateSpeed(speed) {
    gameSpeed = parseFloat(speed);
    PIPE_SPEED = gameSpeed;
    PIPE_SPAWN_RATE = 1500 / gameSpeed;
    document.getElementById('speed-value').textContent = gameSpeed;
}

function loadSettings() {
    const savedSpeed = localStorage.getItem('gameSpeed') || '2';
    updateSpeed(savedSpeed);
    document.getElementById('speed-slider').value = savedSpeed;
    
    // Load saved character
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
    document.getElementById('settings-screen').classList.remove('hidden');
    document.getElementById('settings-button').style.display = 'none';
}

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('settings-button').style.display = 'block';
}

// Game control functions
function startGame() {
    if (gameRunning) return;
    
    // Reset game state
    pipes.length = 0;
    particles = [];
    player.y = canvas.height / 2;
    player.velocity = 0;
    score = 0;
    scoreElement.textContent = score;
    
    // Apply current speed settings
    PIPE_SPEED = gameSpeed;
    PIPE_SPAWN_RATE = 1500 / gameSpeed;
    
    // Show/hide UI elements
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('settings-button').style.display = 'none';
    
    // Start the game
    gameRunning = true;
    lastPipeSpawn = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    if (!gameRunning) return;
    
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // Show game over screen
    document.getElementById('final-score').textContent = `${score} (High: ${highScore})`;
    gameOverScreen.classList.remove('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('settings-button').style.display = 'block';
    
    // Create explosion effect
    for (let i = 0; i < 30; i++) {
        createParticles(
            player.x + player.width/2, 
            player.y + player.height/2, 
            1, 
            `hsl(${Math.random() * 60}, 100%, 50%)`
        );
    }
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

// Character selection event listeners
document.querySelectorAll('.character-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectCharacter(btn.dataset.skin);
    });
});

// Settings event listeners
document.getElementById('settings-button').addEventListener('click', showSettingsScreen);
document.getElementById('save-settings').addEventListener('click', saveSettings);
document.getElementById('back-to-menu').addEventListener('click', showStartScreen);
document.getElementById('speed-slider').addEventListener('input', (e) => {
    updateSpeed(e.target.value);
});

// Start the game loop (paused until user starts)
loadSettings();
startScreen.classList.remove('hidden');

// Initialize with some particles for effect
for (let i = 0; i < 20; i++) {
    createParticles(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
    );
}
