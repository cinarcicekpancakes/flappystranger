import { PIPE_WIDTH, PIPE_GAP, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

let PIPE_SPEED = 2;

export class Pipe {
    constructor() {
        this.x = CANVAS_WIDTH;
        this.width = PIPE_WIDTH;
        this.gapY = Math.random() * (CANVAS_HEIGHT - 200) + 100;
        this.passed = false;
        this.color = `hsl(${Math.random() * 30 + 330}, 70%, 40%)`;
    }
    
    update(player, onScore, onCollision) {
        this.x -= PIPE_SPEED;
        
        // Score point if player passes the pipe
        if (!this.passed && this.x + this.width < player.x) {
            this.passed = true;
            onScore();
            createParticles(this.x + this.width/2, this.gapY, 10, this.color);
        }
        
        // Check collision with player
        if (player.x + player.width > this.x && 
            player.x < this.x + this.width) {
            if (player.y < this.gapY - PIPE_GAP/2 || 
                player.y + player.height > this.gapY + PIPE_GAP/2) {
                onCollision();
            }
        }
    }
    
    draw(ctx) {
        // Top pipe
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.width, this.gapY - PIPE_GAP/2);
        
        // Bottom pipe
        ctx.fillRect(
            this.x, 
            this.gapY + PIPE_GAP/2, 
            this.width, 
            CANVAS_HEIGHT - (this.gapY + PIPE_GAP/2)
        );
        
        // Pipe edges
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - 5, this.gapY - PIPE_GAP/2 - 20, this.width + 10, 20);
        ctx.fillRect(this.x - 5, this.gapY + PIPE_GAP/2, this.width + 10, 20);
        
        // Pipe pattern
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        for (let y = 20; y < this.gapY - PIPE_GAP/2; y += 30) {
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
        for (let y = this.gapY + PIPE_GAP/2; y < CANVAS_HEIGHT - 20; y += 30) {
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    shouldSpawnNext() {
        // Spawn next pipe when current one is 200px from left edge
        return this.x < CANVAS_WIDTH - 200;
    }
}
