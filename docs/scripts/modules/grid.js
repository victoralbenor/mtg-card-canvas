export function drawGrid(ctx, scale, offsetX, offsetY, canvas) {
    const baseGridSize = 50; // Base size of each grid square
    const majorGridSize = baseGridSize * 5; // Larger grid for "grid of grids"

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // Draw the base grid
    ctx.strokeStyle = "#e0e0e0"; // Light gray for base grid
    ctx.lineWidth = 0.5;
    drawGridLines(ctx, baseGridSize, scale, offsetX, offsetY, canvas);

    // Draw the major grid
    ctx.strokeStyle = "#c0c0c0"; // Slightly darker gray for major grid
    ctx.lineWidth = 1;
    drawGridLines(ctx, majorGridSize, scale, offsetX, offsetY, canvas);

    ctx.restore();
}

function drawGridLines(ctx, gridSize, scale, offsetX, offsetY, canvas) {
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endX = startX + Math.ceil(canvas.width / scale / gridSize) * gridSize;
    const endY = startY + Math.ceil(canvas.height / scale / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}
