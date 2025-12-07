// ==================== UI MANAGEMENT ====================

import { SKINS, SKIN_COSTS, GAME_OVER_MESSAGES } from './config.js';
import { state, saveSkin, saveSpeed, saveSkulls, saveUnlockedSkins, isSkinUnlocked } from './state.js';
import { speakMessage } from './audio.js';

// DOM Elements
let elements = {};

export function initUI() {
    elements = {
        canvas: document.getElementById('gameCanvas'),
        startScreen: document.getElementById('start-screen'),
        gameOverScreen: document.getElementById('game-over'),
        settingsScreen: document.getElementById('settings-screen'),
        shopScreen: document.getElementById('shop-screen'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        settingsButton: document.getElementById('settings-button'),
        saveSettingsButton: document.getElementById('save-settings'),
        backToMenuButton: document.getElementById('back-to-menu'),
        speedSlider: document.getElementById('speed-slider'),
        speedValue: document.getElementById('speed-value'),
        scoreElement: document.getElementById('score'),
        finalScoreElement: document.getElementById('final-score'),
        selectedCharacter: document.getElementById('selected-character'),
        shopButton: document.getElementById('shop-button'),
        closeShopButton: document.getElementById('close-shop'),
        shopSkullsLabel: document.getElementById('shop-skulls')
    };
}

export function getCanvas() {
    return elements.canvas;
}

export function getContext() {
    return elements.canvas?.getContext('2d');
}

// Screen management
export function showStartScreen() {
    elements.startScreen?.classList.remove('hidden');
    elements.gameOverScreen?.classList.add('hidden');
    elements.settingsScreen?.classList.add('hidden');
    elements.shopScreen?.classList.add('hidden');
    if (elements.settingsButton) elements.settingsButton.style.display = 'block';
}

export function hideStartScreen() {
    elements.startScreen?.classList.add('hidden');
    elements.gameOverScreen?.classList.add('hidden');
    elements.settingsScreen?.classList.add('hidden');
    if (elements.settingsButton) elements.settingsButton.style.display = 'none';
}

export function showGameOverScreen() {
    const message = GAME_OVER_MESSAGES[state.currentSkin] || "Game Over!";
    if (elements.finalScoreElement) {
        elements.finalScoreElement.innerHTML = `${state.score} (High: ${state.highScore})<br><span style="font-size: 0.6em; color: #aaa;">${message}</span>`;
    }
    elements.gameOverScreen?.classList.remove('hidden');
    elements.settingsScreen?.classList.add('hidden');
    if (elements.settingsButton) elements.settingsButton.style.display = 'block';

    // Speak the message
    speakMessage(message, state.currentSkin);
}

export function showSettingsScreen() {
    elements.settingsScreen?.classList.remove('hidden');
    elements.startScreen?.classList.add('hidden');
    elements.gameOverScreen?.classList.add('hidden');
    if (elements.settingsButton) elements.settingsButton.style.display = 'none';
}

// HUD
export function updateHUD() {
    if (elements.scoreElement) {
        elements.scoreElement.textContent = `Score: ${state.score}  Skulls: ${state.skulls}  Shields: ${state.shieldCharges}`;
    }
}

// Character selection
export function selectCharacter(skinName) {
    if (!isSkinUnlocked(skinName)) {
        if (elements.selectedCharacter) {
            elements.selectedCharacter.textContent = `${SKINS[skinName]?.name || skinName} is locked - buy it in the shop.`;
        }
        return;
    }

    state.currentSkin = skinName;
    if (elements.selectedCharacter) {
        elements.selectedCharacter.textContent = `Selected: ${SKINS[skinName]?.name || skinName}`;
    }

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

    saveSkin();
}

// Shop
export function openShop() {
    if (elements.shopScreen) {
        elements.startScreen?.classList.add('hidden');
        elements.gameOverScreen?.classList.add('hidden');
        elements.settingsScreen?.classList.add('hidden');
        elements.shopScreen.classList.remove('hidden');
        updateShopUI();
    }
}

export function closeShop() {
    if (elements.shopScreen) {
        elements.shopScreen.classList.add('hidden');
        showStartScreen();
    }
}

export function updateShopUI() {
    if (elements.shopSkullsLabel) {
        elements.shopSkullsLabel.textContent = state.skulls;
    }

    document.querySelectorAll('.shop-item').forEach(btn => {
        const skin = btn.dataset.skin;
        const cost = parseInt(btn.dataset.cost || '0', 10);
        const costEl = btn.querySelector('.shop-cost');

        if (isSkinUnlocked(skin)) {
            if (state.currentSkin === skin) {
                if (costEl) costEl.textContent = '✓ EQUIPPED';
                btn.style.border = '2px solid #4ade80';
            } else {
                if (costEl) costEl.textContent = 'Owned';
                btn.style.border = '1px solid #374151';
            }
            btn.disabled = false;
        } else {
            if (costEl) costEl.textContent = `${cost} skulls`;
            btn.style.border = '1px solid #374151';
            btn.disabled = state.skulls < cost;
        }
    });
}

export function handleShopPurchase(skinName, cost) {
    if (isSkinUnlocked(skinName)) {
        // Already owned - equip it
        selectCharacter(skinName);
        updateShopUI();
        return;
    }

    if (state.skulls < cost) return;

    state.skulls -= cost;
    saveSkulls();
    state.unlockedSkins[skinName] = true;
    saveUnlockedSkins();
    selectCharacter(skinName);
    updateHUD();
    updateShopUI();
}

// Settings
export function updateSpeed(speed) {
    state.gameSpeed = parseFloat(speed);
    state.pipeSpeed = state.gameSpeed;
    if (elements.speedValue) {
        elements.speedValue.textContent = state.gameSpeed;
    }
}

export function saveSettings() {
    saveSpeed();
    showStartScreen();
}

export function loadSettingsUI() {
    if (elements.speedSlider) {
        elements.speedSlider.value = state.gameSpeed;
    }
    if (elements.speedValue) {
        elements.speedValue.textContent = state.gameSpeed;
    }
    selectCharacter(state.currentSkin);
}

// Event binding
export function bindEvents(callbacks) {
    elements.canvas?.addEventListener('click', callbacks.onJump);
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!state.gameRunning && !elements.gameOverScreen?.classList.contains('hidden')) {
                callbacks.onStart();
            } else {
                callbacks.onJump();
            }
        }
    });

    elements.startButton?.addEventListener('click', callbacks.onStart);
    elements.restartButton?.addEventListener('click', callbacks.onStart);
    elements.settingsButton?.addEventListener('click', showSettingsScreen);
    elements.saveSettingsButton?.addEventListener('click', saveSettings);
    elements.backToMenuButton?.addEventListener('click', showStartScreen);
    
    elements.speedSlider?.addEventListener('input', (e) => updateSpeed(e.target.value));

    document.querySelectorAll('.character-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCharacter(btn.dataset.skin));
    });

    elements.shopButton?.addEventListener('click', openShop);
    elements.closeShopButton?.addEventListener('click', closeShop);

    document.querySelectorAll('.shop-item').forEach(btn => {
        btn.addEventListener('click', () => {
            handleShopPurchase(btn.dataset.skin, parseInt(btn.dataset.cost || '0', 10));
        });
    });
}
