// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const input = document.getElementById("card-input");

    let draggedCard = null;

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

    // Add a card to the canvas
    async function addCardToCanvas(cardName) {
        const imageUrl = await fetchCardImage(cardName);
        if (!imageUrl) return;

        const card = document.createElement("img");
        card.src = imageUrl;
        card.classList.add("card");
        card.style.position = "absolute";
        card.style.left = "50px";
        card.style.top = "50px";

        // Prevent default drag behavior
        card.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });

        // Add drag-and-drop functionality
        card.addEventListener("mousedown", (event) => {
            draggedCard = card;
            draggedCard.offsetX = event.offsetX;
            draggedCard.offsetY = event.offsetY;
        });

        canvas.appendChild(card);
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

    // Handle dragging
    document.addEventListener("mousemove", (event) => {
        if (draggedCard) {
            draggedCard.style.left = `${event.pageX - draggedCard.offsetX}px`;
            draggedCard.style.top = `${event.pageY - draggedCard.offsetY}px`;
        }
    });

    // Stop dragging on mouseup
    document.addEventListener("mouseup", () => {
        draggedCard = null;
    });
});