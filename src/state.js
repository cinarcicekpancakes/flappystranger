// ==================== GAME STATE ====================

import { SKIN_COSTS } from './config.js';

// Runtime state
export const state = {
    gameRunning: false,
    score: 0,
    highScore: 0,
    skulls: 0,
    shieldCharges: 0,
    shieldUntil: 0,
    currentSkin: 'demogorgon',
    gameSpeed: 2,
    pipeSpeed: 2,
    nextPipeDistance: 200,
    unlockedSkins: {}
};

// Load saved state from localStorage
export function loadState() {
    state.highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
    state.skulls = parseInt(localStorage.getItem('skulls') || '0', 10);
    state.gameSpeed = parseFloat(localStorage.getItem('gameSpeed') || '2');
    state.pipeSpeed = state.gameSpeed;
    state.currentSkin = localStorage.getItem('selectedSkin') || 'demogorgon';

    // Load unlocked skins
    try {
        const saved = localStorage.getItem('unlockedSkins');
        state.unlockedSkins = saved ? JSON.parse(saved) : {};
    } catch (_) {
        state.unlockedSkins = {};
    }

    // Ensure free skins are unlocked
    Object.keys(SKIN_COSTS).forEach(skin => {
        if (SKIN_COSTS[skin] === 0) {
            state.unlockedSkins[skin] = true;
        }
    });
}

// Save functions
export function saveHighScore() {
    localStorage.setItem('highScore', state.highScore.toString());
}

export function saveSkulls() {
    localStorage.setItem('skulls', state.skulls.toString());
}

export function saveSkin() {
    localStorage.setItem('selectedSkin', state.currentSkin);
}

export function saveSpeed() {
    localStorage.setItem('gameSpeed', state.gameSpeed.toString());
}

export function saveUnlockedSkins() {
    localStorage.setItem('unlockedSkins', JSON.stringify(state.unlockedSkins));
}

// Shield helpers
export function hasActiveShield() {
    return Date.now() < state.shieldUntil;
}

export function activateShield() {
    state.shieldUntil = Date.now() + 5000;
}

export function isSkinUnlocked(skinName) {
    return state.unlockedSkins[skinName] === true;
}

// Reset for new game
export function resetGameState() {
    state.score = 0;
    state.shieldCharges = 0;
    state.shieldUntil = 0;
}

// Random pipe distance
export function resetPipeDistance() {
    state.nextPipeDistance = 200 + Math.random() * 200;
}
