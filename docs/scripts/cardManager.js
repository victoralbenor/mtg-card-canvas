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

export async function addCardToCanvas(cardName, canvas, cards, drawCanvas, saveBoardState) {
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
            saveBoardState(); // Save the state after moving a card
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
                saveBoardState();
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
