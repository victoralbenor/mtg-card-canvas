/**
 * cardManager.js
 * Handles card fetching, adding, dragging, and deletion on the canvas.
 * Exports:
 *   - addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState, x, y): Add a card by name.
 *   - handleCardDragging(...): Handle card drag events.
 *   - handleCardDeletion(...): Handle card deletion events.
 *
 * To extend: Add new card interaction logic as new exported functions.
 */
// Fetch card data from the Scryfall API
async function fetchCardImage(cardName) {
    try {
        const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
        if (!response.ok) throw new Error("Card not found");
        const data = await response.json();
        // Handle double-sided cards
        if (data.card_faces && Array.isArray(data.card_faces) && data.card_faces.length > 0) {
            // Return both faces as an array of image URLs
            return data.card_faces.map(face => face.image_uris.normal);
        } else if (data.image_uris && data.image_uris.normal) {
            return [data.image_uris.normal]; // Return single-faced card as array
        } else {
            throw new Error("Card image not found");
        }
    } catch (error) {
        alert("Card not found. Please try again.");
        return null;
    }
}

export async function addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState, x = null, y = null) {
    const imageUrls = await fetchCardImage(cardName);
    if (!imageUrls || imageUrls.length === 0) return;

    // Offset for stacking cards if both faces are imported
    const CARD_OFFSET = 30; // px, adjust as needed for visibility
    let offset = 0;
    imageUrls.forEach((url, idx) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            cards.push({
                img,
                x: x !== null ? x + offset : canvas.width / 2 - 50 + offset,
                y: y !== null ? y + offset : canvas.height / 2 - 70 + offset,
                width: 100,
                height: 140,
            });
            drawCanvas();
            saveBoardState(cards); // Save the state after adding a card
        };
        offset += CARD_OFFSET; // Increase offset for each card face
    });
}

export function handleCardDragging(event, canvas, cards, ctx, scale, offsetX, offsetY, drawCanvas, saveBoardState) {
    let draggedCard = null;
    let isPanning = false;
    let startX, startY;

    if (event.button === 0) { // Left mouse button
        const mouseX = (event.offsetX - offsetX) / scale;
        const mouseY = (event.offsetY - offsetY) / scale;

        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            if (
                mouseX >= card.x &&
                mouseX <= card.x + card.width &&
                mouseY >= card.y &&
                mouseY <= card.y + card.height
            ) {
                draggedCard = card;
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

    canvas.addEventListener("mousemove", (moveEvent) => {
        const mouseX = (moveEvent.offsetX - offsetX) / scale;
        const mouseY = (moveEvent.offsetY - offsetY) / scale;

        if (draggedCard) {
            draggedCard.x = mouseX - draggedCard.offsetX;
            draggedCard.y = mouseY - draggedCard.offsetY;
            drawCanvas();
            saveBoardState(cards); // Save the state after moving a card
        } else if (isPanning) {
            offsetX += moveEvent.clientX - startX;
            offsetY += moveEvent.clientY - startY;
            startX = moveEvent.clientX;
            startY = moveEvent.clientY;
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
}

export function handleCardDeletion(event, canvas, cards, saveBoardState, drawCanvas, offsetX, offsetY, scale) {
    event.preventDefault();

    const mouseX = (event.offsetX - offsetX) / scale;
    const mouseY = (event.offsetY - offsetY) / scale;

    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        if (
            mouseX >= card.x &&
            mouseX <= card.x + card.width &&
            mouseY >= card.y &&
            mouseY <= card.y + card.height
        ) {
            const menu = document.createElement("div");
            menu.textContent = "Delete Card";
            menu.className = "context-menu";
            menu.style.left = `${event.pageX}px`;
            menu.style.top = `${event.pageY}px`;

            document.body.appendChild(menu);

            menu.addEventListener("click", () => {
                cards.splice(i, 1);
                saveBoardState(cards);
                drawCanvas();
                document.body.removeChild(menu);
            });

            document.addEventListener("click", () => {
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
            }, { once: true });

            break;
        }
    }
}
