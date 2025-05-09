// Wait for the DOM to load
import { drawGrid } from './grid.js';
import { addCardToCanvas, handleCardDragging, handleCardDeletion } from './cardManager.js';

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const input = document.getElementById("card-input");
    const clearBoardButton = document.getElementById("clear-board");
    const ctx = canvas.getContext("2d");

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPanning = false;
    let startX, startY;
    const cards = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Disable default browser behaviors
    canvas.addEventListener("wheel", (e) => e.preventDefault());
    canvas.addEventListener("mousedown", (e) => e.preventDefault());

    // Save the board state to localStorage
    function saveBoardState() {
        const state = cards.map((card) => ({
            imageUrl: card.img.src,
            x: card.x,
            y: card.y,
            width: card.width,
            height: card.height,
        }));
        localStorage.setItem("boardState", JSON.stringify(state));
    }

    // Load the board state from localStorage
    function loadBoardState() {
        const state = JSON.parse(localStorage.getItem("boardState"));
        if (state) {
            state.forEach((cardData) => {
                const img = new Image();
                img.src = cardData.imageUrl;
                img.onload = () => {
                    cards.push({
                        img,
                        x: cardData.x,
                        y: cardData.y,
                        width: cardData.width,
                        height: cardData.height,
                    });
                    drawCanvas();
                };
            });
        }
    }

    // Draw the canvas
    function drawCanvas() {
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

        drawGrid(ctx, scale, offsetX, offsetY, canvas); // Draw the grid background

        cards.forEach((card) => {
            ctx.drawImage(card.img, card.x, card.y, card.width, card.height);
        });
    }

    // Handle card input submission
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const cardName = input.value.trim();
            if (cardName) {
                addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState);
                input.value = ""; // Clear the input
            }
        }
    });

    // Handle "Add Card" button click
    document.getElementById("add-card").addEventListener("click", () => {
        const cardName = input.value.trim();
        if (cardName) {
            addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState);
            input.value = ""; // Clear the input
        }
    });

    // Zoom in and out with the mouse wheel
    canvas.addEventListener("wheel", (event) => {
        const zoomFactor = 1.1;
        const minScale = 0.5; // Minimum zoom level
        const maxScale = 3; // Maximum zoom level
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        if (event.deltaY < 0 && scale < maxScale) {
            scale *= zoomFactor;
        } else if (event.deltaY > 0 && scale > minScale) {
            scale /= zoomFactor;
        }

        offsetX = event.offsetX - mouseX * scale;
        offsetY = event.offsetY - mouseY * scale;

        drawCanvas();
    });

    // Update event listeners for dragging and deleting cards
    canvas.addEventListener("mousedown", (event) => handleCardDragging(event, canvas, cards, ctx, scale, offsetX, offsetY, drawCanvas, saveBoardState));
    canvas.addEventListener("contextmenu", (event) => handleCardDeletion(event, canvas, cards, saveBoardState, drawCanvas, offsetX, offsetY, scale));

    // Resize canvas on window resize
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawCanvas();
    });

    // Clear the board
    clearBoardButton.addEventListener("click", () => {
        cards.length = 0; // Clear the cards array
        saveBoardState(); // Save the empty state
        drawCanvas(); // Redraw the canvas
    });

    // Load the board state when the page loads
    loadBoardState();

    drawCanvas();
});