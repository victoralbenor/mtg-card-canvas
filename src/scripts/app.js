// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const input = document.getElementById("card-input");
    const ctx = canvas.getContext("2d");

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPanning = false;
    let startX, startY;
    const cards = [];
    let draggedCard = null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Disable default browser behaviors
    canvas.addEventListener("wheel", (e) => e.preventDefault());
    canvas.addEventListener("mousedown", (e) => e.preventDefault());

    // Fetch card data from the Scryfall API
    async function fetchCardImage(cardName) {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
            if (!response.ok) throw new Error("Card not found");
            const data = await response.json();
            return data.image_uris.normal; // Return the card image URL
        } catch (error) {
            alert("Card not found. Please try again.");
            return null;
        }
    }

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

    // Add a card to the canvas
    async function addCardToCanvas(cardName) {
        const imageUrl = await fetchCardImage(cardName);
        if (!imageUrl) return;

        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            cards.push({
                img,
                x: canvas.width / 2 - 50,
                y: canvas.height / 2 - 70,
                width: 100,
                height: 140,
            });
            drawCanvas();
            saveBoardState(); // Save the state after adding a card
        };
    }

    // Draw the canvas
    function drawCanvas() {
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

        cards.forEach((card) => {
            ctx.drawImage(card.img, card.x, card.y, card.width, card.height);
        });
    }

    // Handle card input submission
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const cardName = input.value.trim();
            if (cardName) {
                addCardToCanvas(cardName);
                input.value = ""; // Clear the input
            }
        }
    });

    // Zoom in and out with the mouse wheel
    canvas.addEventListener("wheel", (event) => {
        const zoomFactor = 1.1;
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        if (event.deltaY < 0) {
            scale *= zoomFactor;
        } else {
            scale /= zoomFactor;
        }

        offsetX = event.offsetX - mouseX * scale;
        offsetY = event.offsetY - mouseY * scale;

        drawCanvas();
    });

    // Handle card dragging
    canvas.addEventListener("mousedown", (event) => {
        if (event.button === 0) { // Left mouse button
            const mouseX = (event.offsetX - offsetX) / scale;
            const mouseY = (event.offsetY - offsetY) / scale;

            // Find the topmost card under the mouse
            for (let i = cards.length - 1; i >= 0; i--) {
                const card = cards[i];
                if (
                    mouseX >= card.x &&
                    mouseX <= card.x + card.width &&
                    mouseY >= card.y &&
                    mouseY <= card.y + card.height
                ) {
                    draggedCard = card;

                    // Bring the dragged card to the front
                    cards.splice(i, 1);
                    cards.push(draggedCard);

                    draggedCard.offsetX = mouseX - draggedCard.x;
                    draggedCard.offsetY = mouseY - draggedCard.y;
                    canvas.style.cursor = "grabbing";
                    drawCanvas();
                    break;
                }
            }
        } else if (event.button === 1) { // Middle mouse button
            isPanning = true;
            startX = event.clientX;
            startY = event.clientY;
            canvas.style.cursor = "grabbing";
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        if (draggedCard) {
            draggedCard.x = mouseX - draggedCard.offsetX;
            draggedCard.y = mouseY - draggedCard.offsetY;
            drawCanvas();
            saveBoardState(); // Save the state after moving a card
        } else if (isPanning) {
            offsetX += event.clientX - startX;
            offsetY += event.clientY - startY;
            startX = event.clientX;
            startY = event.clientY;
            drawCanvas();
        }
    });

    canvas.addEventListener("mouseup", () => {
        if (draggedCard) {
            draggedCard = null;
            canvas.style.cursor = "default";
        } else if (isPanning) {
            isPanning = false;
            canvas.style.cursor = "grab";
        }
    });

    canvas.addEventListener("mouseleave", () => {
        if (draggedCard) {
            draggedCard = null;
            canvas.style.cursor = "default";
        } else if (isPanning) {
            isPanning = false;
            canvas.style.cursor = "grab";
        }
    });

    // Resize canvas on window resize
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawCanvas();
    });

    // Load the board state when the page loads
    loadBoardState();

    drawCanvas();
});