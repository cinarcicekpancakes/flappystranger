// ==================== BACKGROUND RENDERER ====================

// Draw parallax background layers
export function drawBackground(ctx, canvas) {
    // Base gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#2b2b2b');
    bgGradient.addColorStop(1, '#111111');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layer 1: Far - Hawkins silhouette (slowest)
    drawBuildingSilhouettes(ctx, canvas);

    // Layer 2: Mid - Trees
    drawTrees(ctx, canvas);

    // Layer 3: Clouds (fastest)
    drawClouds(ctx, canvas);

    // Random lightning
    drawLightning(ctx, canvas);
}

function drawBuildingSilhouettes(ctx, canvas) {
    const offset = (performance.now() * 0.005) % canvas.width;
    ctx.fillStyle = 'rgba(30, 30, 40, 0.6)';

    for (let i = 0; i < 4; i++) {
        const bx = (i * 200 - offset + canvas.width) % (canvas.width + 200) - 100;
        const bh = 80 + (i % 3) * 30;
        ctx.fillRect(bx, canvas.height - bh, 60, bh);
        ctx.fillRect(bx + 70, canvas.height - bh - 20, 40, bh + 20);
    }

    // Radio tower
    const towerX = (300 - offset + canvas.width) % (canvas.width + 200) - 100;
    ctx.strokeStyle = 'rgba(50, 50, 60, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX - 20, canvas.height);
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX + 20, canvas.height);
    ctx.moveTo(towerX, canvas.height - 150);
    ctx.lineTo(towerX, canvas.height - 180);
    ctx.stroke();
}

function drawTrees(ctx, canvas) {
    const offset = (performance.now() * 0.015) % canvas.width;
    ctx.fillStyle = 'rgba(20, 25, 20, 0.5)';

    for (let i = 0; i < 10; i++) {
        const tx = (i * 80 - offset + canvas.width) % (canvas.width + 100) - 50;
        const th = 60 + (i % 4) * 20;
        ctx.beginPath();
        ctx.moveTo(tx, canvas.height);
        ctx.lineTo(tx + 15, canvas.height - th);
        ctx.lineTo(tx + 30, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
}

function drawClouds(ctx, canvas) {
    for (let i = 0; i < 8; i++) {
        const cx = (i * 80 + performance.now() * 0.02) % (canvas.width + 160) - 80;
        const cy = (i % 2 === 0 ? 100 : 180) + Math.sin((performance.now() * 0.0007) + i) * 25;
        ctx.fillStyle = 'rgba(180, 180, 190, 0.1)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 40, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawLightning(ctx, canvas) {
    if (Math.random() < 0.002) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
        ctx.lineWidth = 3;
        let x = Math.random() * canvas.width;
        let y = 0;
        ctx.beginPath();
        ctx.moveTo(x, y);
        while (y < canvas.height) {
            x += (Math.random() - 0.5) * 40;
            y += 25 + Math.random() * 20;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
