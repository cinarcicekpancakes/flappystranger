// ==================== PIPE CLASS ====================

import { CONFIG } from './config.js';
import { state, hasActiveShield, activateShield } from './state.js';
import { createParticles } from './particles.js';
import { playHitSound, playScoreSound } from './audio.js';

export class Pipe {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth;
        this.width = CONFIG.PIPE_WIDTH;
        this.gapY = Math.random() * (canvasHeight - 200) + 100;
        this.passed = false;
        this.color = `hsl(${Math.random() * 30 + 330}, 70%, 40%)`;
        this.canvasHeight = canvasHeight;
    }

    update(player, onDeath, onScore) {
        this.x -= state.pipeSpeed;

        // Check if passed
        if (!this.passed && this.x + this.width < player.x) {
            this.passed = true;
            onScore();
            playScoreSound();
            createParticles(this.x + this.width / 2, this.gapY, 10, this.color);
        }

        // Check collision
        if (this.checkCollision(player)) {
            if (hasActiveShield() || state.shieldCharges > 0) {
                if (!hasActiveShield() && state.shieldCharges > 0) {
                    state.shieldCharges--;
                    activateShield();
                }
                playHitSound();
                player.velocity = CONFIG.JUMP_FORCE * 0.8;
                createParticles(player.x + player.width / 2, player.y + player.height / 2, 20, '#4dabf7');
            } else {
                playHitSound();
                onDeath();
            }
        }
    }

    checkCollision(player) {
        if (player.x + player.width > this.x && player.x < this.x + this.width) {
            if (player.y < this.gapY - CONFIG.PIPE_GAP / 2 || 
                player.y + player.height > this.gapY + CONFIG.PIPE_GAP / 2) {
                return true;
            }
        }
        return false;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    draw(ctx) {
        const gap = CONFIG.PIPE_GAP;

        // Top pipe
        this.drawPipeSection(ctx, 0, this.gapY - gap / 2, true);
        
        // Bottom pipe
        this.drawPipeSection(ctx, this.gapY + gap / 2, this.canvasHeight - (this.gapY + gap / 2), false);
    }

    drawPipeSection(ctx, y, height, isTop) {
        // Main gradient
        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradient.addColorStop(0, '#3b0005');
        gradient.addColorStop(0.3, '#8b0015');
        gradient.addColorStop(0.5, '#a50018');
        gradient.addColorStop(0.7, '#8b0015');
        gradient.addColorStop(1, '#3b0005');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, y, this.width, height);

        // Highlight
        ctx.fillStyle = 'rgba(255, 150, 150, 0.15)';
        ctx.fillRect(this.x + 8, y, 6, height);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + this.width - 10, y, 10, height);

        // Cap
        const capHeight = 20;
        const capY = isTop ? y + height - capHeight : y;
        
        const capGradient = ctx.createLinearGradient(this.x - 5, 0, this.x + this.width + 5, 0);
        capGradient.addColorStop(0, '#2b0003');
        capGradient.addColorStop(0.3, '#6b0010');
        capGradient.addColorStop(0.5, '#850014');
        capGradient.addColorStop(0.7, '#6b0010');
        capGradient.addColorStop(1, '#2b0003');

        ctx.fillStyle = capGradient;
        ctx.fillRect(this.x - 5, capY, this.width + 10, capHeight);

        // Cap highlight
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        ctx.fillRect(this.x, capY + 2, this.width, 3);

        // Texture lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = y; i < y + height; i += 30) {
            ctx.beginPath();
            ctx.moveTo(this.x, i);
            ctx.lineTo(this.x + this.width, i);
            ctx.stroke();
        }
    }
}
