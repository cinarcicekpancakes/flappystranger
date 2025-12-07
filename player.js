import { skins, GRAVITY, JUMP_FORCE } from './config.js';

let gameRunning = false;
let PIPE_SPEED = 2;

// Import particle function
let createParticles;
export function setParticleFunction(fn) {
    createParticles = fn;
}

// Import game state
export function setGameState(running) {
    gameRunning = running;
}

// Import pipe speed
export function setPipeSpeed(speed) {
    PIPE_SPEED = speed;
}

export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = 40;
        this.height = 30;
        this.velocity = 0;
        this.rotation = 0;
        this.color = '#e63946';
    }
    
    update() {
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
        
        if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.velocity = 0;
            if (gameRunning) gameOver();
        }
    }
    
    jump() {
        if (!gameRunning) return;
        this.velocity = JUMP_FORCE;
        createParticles(this.x + this.width/2, this.y + this.height/2, 5, this.color);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        const skin = skins[currentSkin];
        ctx.fillStyle = skin.color;
        
        // Draw different characters based on skin
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
            default:
                this.drawCharacter(ctx, skin.color);
                break;
        }
        
        ctx.restore();
    }
    
    drawDemogorgon(ctx, color) {
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
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(30, 5);
            ctx.lineTo(30, -5);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawEleven(ctx, color) {
        // Eleven with psychic powers
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Psychic aura
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2 + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Nose bleed effect
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(-5, -5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMindFlayer(ctx, color) {
        // Mind Flayer - tall, thin, ominous
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/3, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tentacles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.quadraticCurveTo(25, 10, 20, 20);
            ctx.stroke();
            ctx.restore();
        }
        
        // Dark aura
        ctx.strokeStyle = 'rgba(114, 9, 183, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2 + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawCharacter(ctx, color) {
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
}
