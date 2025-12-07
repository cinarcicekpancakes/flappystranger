// ==================== AUDIO SYSTEM ====================

import { CONFIG, VOICE_SETTINGS } from './config.js';

// Audio context for synthesized sounds
let audioContext = null;

// Preloaded audio elements
let hitSound = null;
let bgMusic = null;
let scoreSound = null;

// Initialize audio system
export function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
        console.warn('Web Audio API not supported');
    }

    // Load audio files
    hitSound = loadAudio('sounds/I hit.mp3', CONFIG.HIT_SOUND_VOLUME);
    bgMusic = loadAudio('sounds/bgm.mp3', CONFIG.BGM_VOLUME, true);
    scoreSound = loadAudio('sounds/score.mp3', CONFIG.SCORE_SOUND_VOLUME);
}

// Helper to load audio with error handling
function loadAudio(src, volume = 1, loop = false) {
    try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.loop = loop;
        return audio;
    } catch (_) {
        return null;
    }
}

// Play a preloaded audio file
function playAudio(audio) {
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (_) {}
}

// Synthesized jump sound using Web Audio API
export function playJumpSound() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Quick upward pitch sweep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(CONFIG.JUMP_SOUND_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            CONFIG.JUMP_SOUND_FREQ_END, 
            audioContext.currentTime + CONFIG.JUMP_SOUND_DURATION * 0.8
        );

        // Quick fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + CONFIG.JUMP_SOUND_DURATION);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + CONFIG.JUMP_SOUND_DURATION);
    } catch (_) {}
}

export function playHitSound() {
    playAudio(hitSound);
}

export function playScoreSound() {
    playAudio(scoreSound);
}

export function startBgMusic() {
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(() => {});
    }
}

export function stopBgMusic() {
    if (bgMusic) {
        bgMusic.pause();
    }
}

// Text-to-Speech
export function speakMessage(text, skinName) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const settings = VOICE_SETTINGS[skinName] || { pitch: 1.0, rate: 0.9, preferMale: false };

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (settings.preferMale) {
        selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David'))
        );
    } else {
        selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen'))
        );
    }

    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
}
