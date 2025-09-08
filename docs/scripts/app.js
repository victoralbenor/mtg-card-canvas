// Wait for the DOM to load
import { drawGrid } from './modules/grid.js';
import { addCardToCanvas, handleCardDragging, handleCardDeletion } from './modules/cardManager.js';
import { saveBoardState, loadBoardState } from './modules/boardState.js';

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
    let stickyNotes = [];

    // Sticky Notes Persistence
    const STICKY_NOTES_KEY = 'stickyNotes';
    function saveStickyNotes() {
        localStorage.setItem(STICKY_NOTES_KEY, JSON.stringify(stickyNotes));
    }
    function loadStickyNotesFromStorage() {
        const notes = JSON.parse(localStorage.getItem(STICKY_NOTES_KEY) || '[]');
        stickyNotes = notes;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Disable default browser behaviors
    canvas.addEventListener("wheel", (e) => e.preventDefault());
    canvas.addEventListener("mousedown", (e) => e.preventDefault());

    // Draw the canvas
    function drawCanvas() {
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

        drawGrid(ctx, scale, offsetX, offsetY, canvas); // Draw the grid background

        cards.forEach((card) => {
            ctx.drawImage(card.img, card.x, card.y, card.width, card.height);
        });

        drawStickyNotes(); // Draw sticky notes
    }

    // Create a sticky note
    function createStickyNote(x, y) {
        const note = {
            x,
            y,
            width: 100,
            height: 80,
            text: "",
            isDragging: false,
            isResizing: false,
            selected: false
        };
        stickyNotes.push(note);
        saveStickyNotes();
        drawCanvas();
    }

    // Draw sticky notes
    function drawStickyNotes() {
        stickyNotes.forEach(note => {
            ctx.fillStyle = "#ffeb3b";
            ctx.fillRect(note.x, note.y, note.width, note.height);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(note.x, note.y, note.width, note.height);

            ctx.fillStyle = "#000";
            ctx.font = "8px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            const padding = 10;
            const textX = note.x + padding;
            const textY = note.y + padding;
            const textWidth = note.width - 2 * padding;
            const textHeight = note.height - 2 * padding;
            const lines = wrapText(ctx, note.text, textX, textY, textWidth, textHeight);
            lines.forEach((line, index) => {
                ctx.fillText(line, textX, textY + index * 20);
            });
        });
    }

    // Utility function to wrap text
    function wrapText(ctx, text, x, y, maxWidth, maxHeight) {
        const words = text.split(" ");
        const lines = [];
        let line = "";
        words.forEach(word => {
            const testLine = line + word + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && line !== "") {
                lines.push(line);
                line = word + " ";
            } else {
                line = testLine;
            }
        });
        lines.push(line);
        return lines;
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

    // Add a text area for editing sticky notes
    const stickyNoteEditor = document.createElement("textarea");
    stickyNoteEditor.style.position = "absolute";
    stickyNoteEditor.style.zIndex = "1000";
    stickyNoteEditor.style.display = "none";
    stickyNoteEditor.style.resize = "none";
    stickyNoteEditor.style.border = "1px solid #ccc";
    stickyNoteEditor.style.borderRadius = "5px";
    stickyNoteEditor.style.padding = "5px";
    stickyNoteEditor.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
    stickyNoteEditor.style.backgroundColor = "#ffeb3b";
    stickyNoteEditor.style.font = "16px Arial";
    stickyNoteEditor.style.color = "#000";
    stickyNoteEditor.style.textAlign = "left";
    stickyNoteEditor.style.lineHeight = "20px";
    document.body.appendChild(stickyNoteEditor);

    // Show the text area for editing
    function showStickyNoteEditor(note) {
        stickyNoteEditor.value = note.text;
        stickyNoteEditor.style.left = `${note.x * scale + offsetX}px`;
        stickyNoteEditor.style.top = `${note.y * scale + offsetY}px`;
        stickyNoteEditor.style.width = `${note.width * scale}px`;
        stickyNoteEditor.style.height = `${note.height * scale}px`;
        stickyNoteEditor.style.display = "block";
        stickyNoteEditor.focus();

        stickyNoteEditor.oninput = () => {
            note.text = stickyNoteEditor.value;
            saveStickyNotes();
            drawCanvas();
        };

        stickyNoteEditor.onblur = () => {
            stickyNoteEditor.style.display = "none";
            saveStickyNotes();
        };
    }

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

    // Remove sticky note creation from default left click
    canvas.addEventListener("click", (event) => {
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        let clickedOnNote = false;
        stickyNotes.forEach(note => {
            if (
                mouseX >= note.x && mouseX <= note.x + note.width &&
                mouseY >= note.y && mouseY <= note.y + note.height
            ) {
                clickedOnNote = true;
                showStickyNoteEditor(note);
            }
        });

        if (!clickedOnNote) {
            stickyNoteEditor.style.display = "none";
        }
    });

    let isDraggingNote = false;
    let draggedNote = null;

    canvas.addEventListener("mousedown", (event) => {
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        stickyNotes.forEach(note => {
            const isOnEdge = mouseX >= note.x + note.width - 10 && mouseX <= note.x + note.width &&
                             mouseY >= note.y + note.height - 10 && mouseY <= note.y + note.height;

            if (isOnEdge) {
                note.isResizing = true;
            } else if (
                mouseX >= note.x && mouseX <= note.x + note.width &&
                mouseY >= note.y && mouseY <= note.y + note.height
            ) {
                note.isDragging = true;
                note.selected = true;
                note.offsetX = mouseX - note.x;
                note.offsetY = mouseY - note.y;
                isDraggingNote = true;
                draggedNote = note;
            } else {
                note.selected = false;
            }
        });
    });

    let lastRenderTime = 0;

    function smoothDrag(timestamp) {
        if (isDraggingNote && draggedNote) {
            const mouseX = (lastMouseEvent.offsetX - offsetX) / scale;
            const mouseY = (lastMouseEvent.offsetY - offsetY) / scale;

            if (draggedNote.isDragging) {
                draggedNote.x = mouseX - draggedNote.offsetX;
                draggedNote.y = mouseY - draggedNote.offsetY;
            } else if (draggedNote.isResizing) {
                draggedNote.width = mouseX - draggedNote.x;
                draggedNote.height = mouseY - draggedNote.y;
            }

            if (timestamp - lastRenderTime > 16) { // ~60 FPS
                drawCanvas();
                lastRenderTime = timestamp;
            }

            requestAnimationFrame(smoothDrag);
        }
    }

    let lastMouseEvent = null;

    canvas.addEventListener("mousemove", (event) => {
        lastMouseEvent = event;
        if (isDraggingNote) {
            requestAnimationFrame(smoothDrag);
        }
    });

    canvas.addEventListener("mouseup", () => {
        isDraggingNote = false;
        draggedNote = null;
        let changed = false;
        stickyNotes.forEach(note => {
            if (note.isDragging || note.isResizing) changed = true;
            note.isDragging = false;
            note.isResizing = false;
        });
        if (changed) saveStickyNotes();
    });

    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        stickyNotes.forEach((note, index) => {
            if (
                mouseX >= note.x && mouseX <= note.x + note.width &&
                mouseY >= note.y && mouseY <= note.y + note.height
            ) {
                stickyNotes.splice(index, 1);
                saveStickyNotes();
                drawCanvas();
            }
        });
    });

    // Create a custom context menu
    const contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    contextMenu.style.position = "absolute";
    contextMenu.style.backgroundColor = "#fff";
    contextMenu.style.border = "1px solid #ccc";
    contextMenu.style.borderRadius = "5px";
    contextMenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
    contextMenu.style.zIndex = "1000";
    contextMenu.style.display = "none";
    document.body.appendChild(contextMenu);

    // Add "Create Sticky Note" option to the context menu
    const createStickyNoteOption = document.createElement("div");
    createStickyNoteOption.textContent = "Create Sticky Note";
    createStickyNoteOption.style.padding = "10px";
    createStickyNoteOption.style.cursor = "pointer";
    createStickyNoteOption.addEventListener("click", () => {
        const mouseX = parseFloat(contextMenu.dataset.mouseX);
        const mouseY = parseFloat(contextMenu.dataset.mouseY);
        createStickyNote(mouseX, mouseY);
        contextMenu.style.display = "none";
    });
    contextMenu.appendChild(createStickyNoteOption);

    // Show the custom context menu
    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        // Check if right-click is on a card or sticky note
        const clickedOnCard = cards.some(card =>
            mouseX >= card.x && mouseX <= card.x + card.width &&
            mouseY >= card.y && mouseY <= card.y + card.height
        );

        const clickedOnNote = stickyNotes.some(note =>
            mouseX >= note.x && mouseX <= note.x + note.width &&
            mouseY >= note.y && mouseY <= note.y + note.height
        );

        if (!clickedOnCard && !clickedOnNote) {
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.display = "block";
            contextMenu.dataset.mouseX = mouseX;
            contextMenu.dataset.mouseY = mouseY;
        } else {
            contextMenu.style.display = "none";
        }
    });

    // Hide the context menu when clicking elsewhere
    document.addEventListener("click", () => {
        contextMenu.style.display = "none";
    });

    // Update event listeners for dragging and deleting cards
    canvas.addEventListener("mousedown", (event) => {
        if (event.button === 1) { // Middle mouse button
            isPanning = true;
            startX = event.clientX;
            startY = event.clientY;
            canvas.style.cursor = "grabbing";
        }
        handleCardDragging(event, canvas, cards, ctx, scale, offsetX, offsetY, drawCanvas, saveBoardState);
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isPanning) {
            offsetX += event.clientX - startX;
            offsetY += event.clientY - startY;
            startX = event.clientX;
            startY = event.clientY;
            drawCanvas();
        }
    });

    canvas.addEventListener("mouseup", (event) => {
        if (isPanning && event.button === 1) { // Middle mouse button
            isPanning = false;
            canvas.style.cursor = "default";
        }
    });

    canvas.addEventListener("mouseleave", () => {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = "default";
        }
    });

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
        stickyNotes.length = 0; // Clear the sticky notes array
        saveBoardState(cards); // Save the empty state
        saveStickyNotes(); // Save cleared notes
        drawCanvas(); // Redraw the canvas
    });

    // Load the board state and sticky notes when the page loads
    loadBoardState(drawCanvas, cards);
    loadStickyNotesFromStorage();
    drawCanvas();

    // Bulk Import functionality
    const bulkImportModal = document.getElementById("bulk-import-modal");
    const bulkImportInput = document.getElementById("bulk-import-input");
    const bulkImportConfirm = document.getElementById("bulk-import-confirm");
    const bulkImportCancel = document.getElementById("bulk-import-cancel");

    // Open Bulk Import modal
    document.getElementById("open-bulk-import").addEventListener("click", () => {
        bulkImportModal.style.display = "flex"; // Show the modal
    });

    // Close Bulk Import modal
    bulkImportCancel.addEventListener("click", () => {
        bulkImportModal.style.display = "none"; // Hide the modal
        bulkImportInput.value = ""; // Clear the input
    });

    // Confirm Bulk Import
    bulkImportConfirm.addEventListener("click", async () => {
        const cardNames = bulkImportInput.value.trim().split("\n").map(name => name.trim()).filter(name => name);
        if (cardNames.length === 0) return;

        const gridSize = Math.ceil(Math.sqrt(cardNames.length)); // Determine grid size
        const cardWidth = 100;
        const cardHeight = 140;
        const spacing = 20;

        let x = canvas.width / 2 - (gridSize * (cardWidth + spacing)) / 2;
        let y = canvas.height / 2 - (gridSize * (cardHeight + spacing)) / 2;

        for (let i = 0; i < cardNames.length; i++) {
            const cardName = cardNames[i];
            await addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState, x, y);

            x += cardWidth + spacing;
            if ((i + 1) % gridSize === 0) {
                x = canvas.width / 2 - (gridSize * (cardWidth + spacing)) / 2;
                y += cardHeight + spacing;
            }
        }

        bulkImportModal.style.display = "none"; // Hide the modal
        bulkImportInput.value = ""; // Clear the input
    });
});