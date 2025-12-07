import { skins, gameSpeed } from './config.js';

// UI elements
export const elements = {
    canvas: document.getElementById('gameCanvas'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over'),
    scoreElement: document.getElementById('score'),
    finalScoreElement: document.getElementById('final-score'),
    startButton: document.getElementById('start-button'),
    restartButton: document.getElementById('restart-button'),
    settingsButton: document.getElementById('settings-button'),
    settingsScreen: document.getElementById('settings-screen'),
    saveSettingsButton: document.getElementById('save-settings'),
    backToMenuButton: document.getElementById('back-to-menu'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    selectedCharacter: document.getElementById('selected-character')
};

// Character selection
export function selectCharacter(skinName) {
    currentSkin = skinName;
    elements.selectedCharacter.textContent = `Selected: ${skins[skinName].name}`;
    
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
export function updateSpeed(speed) {
    gameSpeed = parseFloat(speed);
    PIPE_SPEED = gameSpeed;
    PIPE_SPAWN_RATE = 1500 / gameSpeed;
    elements.speedValue.textContent = gameSpeed;
}

export function loadSettings() {
    const savedSpeed = localStorage.getItem('gameSpeed') || '2';
    updateSpeed(savedSpeed);
    elements.speedSlider.value = savedSpeed;
    
    // Load saved character
    const savedSkin = localStorage.getItem('selectedSkin') || 'demogorgon';
    selectCharacter(savedSkin);
}

export function saveSettings() {
    localStorage.setItem('gameSpeed', gameSpeed.toString());
    showStartScreen();
}

export function showSettingsScreen() {
    elements.startScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.settingsScreen.classList.remove('hidden');
    elements.settingsButton.style.display = 'none';
}

export function showStartScreen() {
    elements.startScreen.classList.remove('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.settingsScreen.classList.add('hidden');
    elements.settingsButton.style.display = 'block';
}

export function showGameOverScreen(score, highScore) {
    elements.finalScoreElement.textContent = `${score} (High: ${highScore})`;
    elements.gameOverScreen.classList.remove('hidden');
    elements.settingsScreen.classList.add('hidden');
    elements.settingsButton.style.display = 'block';
}
