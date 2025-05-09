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

    // Create suggestion box for autocomplete
    const suggestionBox = document.createElement("div");
    suggestionBox.id = "suggestion-box";
    suggestionBox.style.position = "absolute";
    suggestionBox.style.backgroundColor = "#fff";
    suggestionBox.style.border = "1px solid #ccc";
    suggestionBox.style.borderRadius = "5px";
    suggestionBox.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
    suggestionBox.style.zIndex = "1000";
    suggestionBox.style.display = "none";
    document.body.appendChild(suggestionBox);

    // Fetch autocomplete suggestions from Scryfall API
    async function fetchAutocompleteSuggestions(query) {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Failed to fetch suggestions");
            const data = await response.json();
            return data.data; // Return the list of suggestions
        } catch (error) {
            console.error("Error fetching autocomplete suggestions:", error);
            return [];
        }
    }

    // Show suggestions in the dropdown
    function showSuggestions(suggestions, inputElement) {
        suggestionBox.innerHTML = ""; // Clear previous suggestions
        if (suggestions.length === 0) {
            suggestionBox.style.display = "none";
            return;
        }

        suggestions.forEach((suggestion) => {
            const suggestionItem = document.createElement("div");
            suggestionItem.textContent = suggestion;
            suggestionItem.style.padding = "10px";
            suggestionItem.style.cursor = "pointer";
            suggestionItem.addEventListener("click", () => {
                addCardToCanvas(suggestion, canvas, cards, drawCanvas, saveBoardState); // Create the card directly
                inputElement.value = ""; // Clear the input field
                suggestionBox.style.display = "none"; // Hide the suggestion box
            });
            suggestionBox.appendChild(suggestionItem);
        });

        const rect = inputElement.getBoundingClientRect();
        suggestionBox.style.left = `${rect.left}px`;
        suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionBox.style.width = `${rect.width}px`;
        suggestionBox.style.display = "block";
    }

    // Hide suggestions when clicking outside
    document.addEventListener("click", (event) => {
        if (!suggestionBox.contains(event.target) && event.target !== input) {
            suggestionBox.style.display = "none";
        }
    });

    // Handle input field typing for autocomplete
    input.addEventListener("input", async () => {
        const query = input.value.trim();
        if (query.length > 1) { // Fetch suggestions only for queries longer than 1 character
            const suggestions = await fetchAutocompleteSuggestions(query);
            showSuggestions(suggestions, input);
        } else {
            suggestionBox.style.display = "none";
        }
    });

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