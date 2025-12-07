// ==================== MAIN GAME MODULE ====================

import { CONFIG } from './config.js';
import { loadAssets } from './assets.js';
import { initAudio, startBgMusic, stopBgMusic } from './audio.js';
import { state, loadState, saveHighScore, saveSkulls, resetGameState, resetPipeDistance } from './state.js';
import { Player } from './player.js';
import { Pipe } from './pipe.js';
import { createParticles, updateParticles, drawParticles, clearParticles } from './particles.js';
import { drawBackground } from './background.js';
import { 
    initUI, getCanvas, getContext, 
    showStartScreen, hideStartScreen, showGameOverScreen,
    updateHUD, loadSettingsUI, bindEvents 
} from './ui.js';

// Game objects
let player = null;
let pipes = [];
let canvas = null;
let ctx = null;
let animationId = null;

// Initialize game
export function init() {
    // Load saved state
    loadState();

    // Load assets
    loadAssets();
    initAudio();

    // Setup UI
    initUI();
    canvas = getCanvas();
    ctx = getContext();

    // Create player
    player = new Player(canvas);

    // Load UI settings
    loadSettingsUI();

    // Bind events
    bindEvents({
        onJump: () => player.jump(),
        onStart: startGame
    });

    // Initial particles
    for (let i = 0; i < 20; i++) {
        createParticles(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1,
            `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
        );
    }

    // Show start screen and begin loop
    showStartScreen();
    gameLoop();
}

// Start a new game
function startGame() {
    if (state.gameRunning) return;

    pipes = [];
    clearParticles();
    player.reset();
    resetGameState();
    resetPipeDistance();
    updateHUD();

    state.pipeSpeed = state.gameSpeed;
    hideStartScreen();
    state.gameRunning = true;

    startBgMusic();
}

// End the game
function gameOver() {
    if (!state.gameRunning) return;

    state.gameRunning = false;
    stopBgMusic();

    if (state.score > state.highScore) {
        state.highScore = state.score;
        saveHighScore();
    }

    showGameOverScreen();

    // Death particles
    for (let i = 0; i < 30; i++) {
        createParticles(
            player.x + player.width / 2,
            player.y + player.height / 2,
            1,
            `hsl(${Math.random() * 60}, 100%, 50%)`
        );
    }
}

// Handle scoring
function onScore() {
    state.score++;
    state.skulls++;
    saveSkulls();

    if (state.score % CONFIG.SHIELD_REWARD_INTERVAL === 0) {
        state.shieldCharges++;
        createParticles(player.x + player.width / 2, player.y, 12, '#4dabf7');
    }

    updateHUD();
}

// Main game loop
function gameLoop() {
    // Draw background
    drawBackground(ctx, canvas);

    if (state.gameRunning) {
        // Spawn pipes
        if (pipes.length === 0 || 
            (canvas.width - (pipes[pipes.length - 1].x + pipes[pipes.length - 1].width)) >= state.nextPipeDistance) {
            pipes.push(new Pipe(canvas.width, canvas.height));
            resetPipeDistance();
        }

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update(player, gameOver, onScore);
            if (pipes[i].isOffScreen()) {
                pipes.splice(i, 1);
            }
        }

        // Update player
        player.update(gameOver);
    }

    // Draw pipes
    pipes.forEach(pipe => pipe.draw(ctx));

    // Draw particles
    updateParticles();
    drawParticles(ctx);

    // Draw player
    player.draw(ctx);

    animationId = requestAnimationFrame(gameLoop);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
