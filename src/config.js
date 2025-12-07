// ==================== GAME CONFIGURATION ====================

export const CONFIG = {
    // Physics
    GRAVITY: 0.45,
    JUMP_FORCE: -7,
    
    // Pipes
    PIPE_WIDTH: 80,
    PIPE_GAP: 230,
    MIN_PIPE_DISTANCE: 200,
    MAX_PIPE_DISTANCE: 400,
    
    // Player
    PLAYER_WIDTH: 45,
    PLAYER_HEIGHT: 100,
    PLAYER_START_X: 100,
    
    // Shield
    SHIELD_DURATION: 5000,
    SHIELD_REWARD_INTERVAL: 10,
    
    // Audio
    JUMP_SOUND_FREQ_START: 300,
    JUMP_SOUND_FREQ_END: 600,
    JUMP_SOUND_DURATION: 0.1,
    BGM_VOLUME: 0.3,
    SCORE_SOUND_VOLUME: 0.4,
    HIT_SOUND_VOLUME: 1.0,
};

// Character skins with colors and names
export const SKINS = {
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
    mindflayer: { color: '#111111', name: 'Mind Flayer' }
};

// Shop prices (0 = free/unlocked by default)
export const SKIN_COSTS = {
    demogorgon: 0, eleven: 0, dustin: 0, mike: 0, max: 0,
    hopper: 0, lucas: 0, will: 0,
    steve: 25, nancy: 25, robin: 25,
    erica: 30, jonathan: 30, joyce: 30,
    vecna: 60, waffle: 25, mindflayer: 40
};

// Game over messages per character
export const GAME_OVER_MESSAGES = {
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

// TTS voice settings per character
export const VOICE_SETTINGS = {
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
