import { GRAVITY, JUMP_FORCE, CANVAS_WIDTH, CANVAS_HEIGHT, gameSpeed, skins, currentSkin } from './config.js';
import { Player, setParticleFunction, setGameState, setPipeSpeed } from './player.js';
import { Pipe } from './pipe.js';
import { particles, createParticles, updateParticles, drawParticles } from './particles.js';
import { elements, selectCharacter, updateSpeed, loadSettings, saveSettings, showSettingsScreen, showStartScreen, showGameOverScreen } from './ui.js';

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let animationId;
let pipes = [];
let player;

// Initialize game
function init() {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    
    player = new Player(canvas);
    
    // Set up cross-module dependencies
    setParticleFunction(createParticles);
    setGameState(gameRunning);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load settings
    loadSettings();
    
    // Show start screen
    showStartScreen();
    
    // Start game loop
    gameLoop();
}

function setupEventListeners() {
    // Character selection
    document.querySelectorAll('.character-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectCharacter(btn.dataset.skin);
        });
    });

    // Game controls
    elements.canvas.addEventListener('click', () => player.jump());
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!gameRunning && !elements.gameOverScreen.classList.contains('hidden')) {
                startGame();
            } else {
                player.jump();
            }
        }
    });

    // UI controls
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', startGame);
    elements.settingsButton.addEventListener('click', showSettingsScreen);
    elements.saveSettingsButton.addEventListener('click', saveSettings);
    elements.backToMenuButton.addEventListener('click', showStartScreen);
    elements.speedSlider.addEventListener('input', (e) => {
        updateSpeed(e.target.value);
    });
}

function startGame() {
    if (gameRunning) return;
    
    // Reset game state
    pipes = [];
    particles = [];
    player.y = CANVAS_HEIGHT / 2;
    player.velocity = 0;
    score = 0;
    elements.scoreElement.textContent = score;
    
    // Apply current speed settings
    PIPE_SPEED = gameSpeed;
    
    // Show/hide UI elements
    elements.startScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.settingsScreen.classList.add('hidden');
    elements.settingsButton.style.display = 'none';
    
    // Start the game
    gameRunning = true;
    setGameState(gameRunning);
    setPipeSpeed(gameSpeed);
}

function gameOver() {
    if (!gameRunning) return;
    
    gameRunning = false;
    setGameState(gameRunning);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // Show game over screen
    showGameOverScreen(score, highScore);
    
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

function gameLoop(timestamp) {
    const ctx = elements.canvas.getContext('2d');
    
    // Clear canvas with a dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid lines for Upside Down effect
    ctx.strokeStyle = '#1a1a33';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
    
    // Update and draw game objects
    if (gameRunning) {
        // Spawn pipes based on distance, not time
        if (pipes.length === 0 || pipes[pipes.length - 1].shouldSpawnNext()) {
            pipes.push(new Pipe());
        }
        
        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update(player, 
                () => { // onScore
                    score++;
                    elements.scoreElement.textContent = score;
                },
                () => { // onCollision
                    gameOver();
                }
            );
            
            if (pipes[i].isOffScreen()) {
                pipes.splice(i, 1);
            }
        }
        
        // Update player
        player.update();
    }
    
    // Draw pipes
    pipes.forEach(pipe => pipe.draw(ctx));
    
    // Update and draw particles
    updateParticles();
    drawParticles(ctx);
    
    // Draw player
    player.draw(ctx);
    
    // Draw "The Upside Down" effect
    if (gameRunning) {
        ctx.fillStyle = 'rgba(0, 20, 40, 0.2)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Random lightning effect
        if (Math.random() > 0.99) {
            ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }
    
    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Initialize with some particles for effect
for (let i = 0; i < 20; i++) {
    createParticles(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT,
        1,
        `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
    );
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', init);
