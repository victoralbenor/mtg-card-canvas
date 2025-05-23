// Save the board state to localStorage
export function saveBoardState(cards) {
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
export function loadBoardState(drawCanvas, cards) {
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