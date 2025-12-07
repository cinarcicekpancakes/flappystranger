// ==================== PLAYER CLASS ====================

import { CONFIG, SKINS } from './config.js';
import { images, isImageReady } from './assets.js';
import { state, hasActiveShield, activateShield } from './state.js';
import { createParticles } from './particles.js';
import { playJumpSound, playHitSound } from './audio.js';

export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.x = CONFIG.PLAYER_START_X;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
    }

    get color() {
        return SKINS[state.currentSkin]?.color || '#fff';
    }

    update(onDeath) {
        if (!state.gameRunning) return;

        this.velocity += CONFIG.GRAVITY;
        this.y += this.velocity;
        this.rotation = Math.min(Math.max(this.velocity * 0.04, -0.5), 0.5);

        // Ceiling
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Floor collision
        if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.velocity = 0;
            
            if (hasActiveShield() || state.shieldCharges > 0) {
                if (!hasActiveShield() && state.shieldCharges > 0) {
                    state.shieldCharges--;
                    activateShield();
                }
                playHitSound();
                this.velocity = CONFIG.JUMP_FORCE * 0.6;
            } else {
                playHitSound();
                onDeath();
            }
        }
    }

    jump() {
        if (!state.gameRunning) return;
        this.velocity = CONFIG.JUMP_FORCE;
        playJumpSound();
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 8, this.color);
    }

    reset() {
        this.y = this.canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Shield aura
        if (hasActiveShield()) {
            ctx.strokeStyle = 'rgba(77, 171, 247, 0.7)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw character based on skin
        this.drawSkin(ctx);
        ctx.restore();
    }

    drawSkin(ctx) {
        const skin = state.currentSkin;
        const color = this.color;

        switch (skin) {
            case 'demogorgon':
                this.drawDemogorgon(ctx, color);
                break;
            case 'eleven':
                this.drawEleven(ctx, color);
                break;
            case 'mindflayer':
                this.drawMindFlayer(ctx, color);
                break;
            case 'waffle':
                this.drawWaffle(ctx, color);
                break;
            default:
                this.drawGenericCharacter(ctx, color, skin);
                break;
        }
    }

    // ==================== CHARACTER DRAWINGS ====================

    drawDemogorgon(ctx, color) {
        if (isImageReady(images.demogorgon)) {
            const scale = this.height / images.demogorgon.naturalHeight;
            const w = images.demogorgon.naturalWidth * scale;
            ctx.drawImage(images.demogorgon, -w / 2, -this.height / 2, w, this.height);
            return;
        }

        // Fallback: animated procedural
        const mouthPulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
        const petalSpread = Math.sin(performance.now() * 0.006) * 0.1 + 1;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2.4, this.height / 2.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, (this.width / 5) * mouthPulse, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate((i / 5) * Math.PI * 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(this.width / 4.5, -this.height / 7);
            ctx.lineTo(this.width / 4.5, this.height / 7);
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
        ctx.ellipse(0, -this.height / 6, this.width / 2.5, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 3.5, this.width / 2.3, this.height / 5, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.width / 7, -this.height / 6, 3, 0, Math.PI * 2);
        ctx.arc(this.width / 7, -this.height / 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Nosebleed
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-1, -this.height / 10, 2, 8);

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 3, this.height / 10, this.width / 1.5, this.height / 2.5);
    }

    drawMindFlayer(ctx, color) {
        if (isImageReady(images.mindFlayer)) {
            const scale = this.height / images.mindFlayer.naturalHeight;
            const w = images.mindFlayer.naturalWidth * scale;
            ctx.drawImage(images.mindFlayer, -w / 2, -this.height / 2, w, this.height);
            return;
        }

        // Fallback: animated shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, -3, this.width / 3.4, this.height / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        const tailLen = this.height * 2.8;
        const tailGradient = ctx.createLinearGradient(0, 4, 0, 4 + tailLen);
        tailGradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        tailGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.55)');
        tailGradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = tailGradient;
        ctx.beginPath();
        ctx.moveTo(-this.width / 5, 4);
        ctx.lineTo(this.width / 5, 4);
        ctx.lineTo(0, 4 + tailLen);
        ctx.closePath();
        ctx.fill();

        // Animated tendrils
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
    }

    drawWaffle(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2.5, -this.height / 4, this.width / 1.25, this.height / 2);

        // Grid pattern
        ctx.strokeStyle = '#c68642';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 6, -this.height / 4);
            ctx.lineTo(i * 6, this.height / 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-this.width / 2.5, i * 8);
            ctx.lineTo(this.width / 2.5, i * 8);
            ctx.stroke();
        }

        // Syrup
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 4, this.height / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Butter
        ctx.fillStyle = '#FFFACD';
        ctx.fillRect(-5, -5, 10, 10);
    }

    drawGenericCharacter(ctx, color, skin) {
        // Use Dustin image if available
        if (skin === 'dustin' && isImageReady(images.dustin)) {
            const scale = this.height / images.dustin.naturalHeight;
            const w = images.dustin.naturalWidth * scale;
            ctx.drawImage(images.dustin, -w / 2, -this.height / 2, w, this.height);
            return;
        }

        // Head
        ctx.fillStyle = '#f5d6c6';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, this.width / 2.5, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hair (varies by character)
        this.drawHair(ctx, skin);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.width / 7, -this.height / 6, 3, 0, Math.PI * 2);
        ctx.arc(this.width / 7, -this.height / 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 3, this.height / 10, this.width / 1.5, this.height / 2.5);
    }

    drawHair(ctx, skin) {
        const hairColors = {
            dustin: '#5c4033', mike: '#1a1a1a', max: '#e63946',
            hopper: '#8B7355', lucas: '#1a1a1a', will: '#5c4033',
            steve: '#4a3728', nancy: '#5c4033', robin: '#d4a574',
            erica: '#1a1a1a', jonathan: '#3d2914', joyce: '#5c4033',
            vecna: '#4a0000'
        };

        ctx.fillStyle = hairColors[skin] || '#5c4033';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 3.5, this.width / 2.3, this.height / 5, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Special hair styles
        if (skin === 'steve') {
            // Big hair
            ctx.beginPath();
            ctx.ellipse(0, -this.height / 2.8, this.width / 2, this.height / 4, 0, Math.PI, Math.PI * 2);
            ctx.fill();
        } else if (skin === 'dustin') {
            // Curly hair bumps
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(i * 6, -this.height / 2.5, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
