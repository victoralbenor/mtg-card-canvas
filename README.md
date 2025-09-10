## Fast Iteration & LLM Development

This project is structured for easy and fast iteration, especially with LLMs (AI coding assistants):

- **Modular Code**: All logic is split into focused modules in `docs/scripts/modules/`.
- **Single Entry Point**: Only `app.js` is loaded in `index.html`. Import new modules there.
- **How to Add Features**:
   1. Create a new JS file in `docs/scripts/modules/` for your feature.
   2. Import and use it in `docs/scripts/app.js`.
   3. No need to change the HTML.
- **Commented Code**: Each module and function is documented for clarity.
- **LLM-Friendly**: You can ask an LLM to add, refactor, or extend features by working with individual modules or the entry point.

This makes it easy to iterate, test, and extend the app with minimal friction.
# MTG Card Canvas

MTG Card Canvas is a web application that allows users to create, drag, and manage Magic: The Gathering card images on an infinite canvas. The app features zooming, panning, and a grid-based background similar to Miro, making it ideal for sandbox-style board state visualization.

## Features

- **Infinite Canvas**: Pan and zoom across an infinite workspace.
- **Card Management**: Add Magic: The Gathering cards by name using the Scryfall API.
- **Drag-and-Drop**: Move cards freely across the canvas.
- **Grid Background**: A dynamic grid with "grid of grids" styling for better alignment.
- **Persistent State**: Automatically saves the board state to `localStorage` and restores it on page reload.
- **Context Menu**: Right-click on a card to delete it.
- **Clear Board**: A button to clear all cards from the canvas.

## Demo

You can view the live demo of the project on [GitHub Pages](https://victoralbenor.github.io/mtg-card-canvas/).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/victoralbenor/mtg-card-canvas.git
   cd mtg-card-canvas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   This will launch the app in your default browser using `live-server`.

## Deployment

To deploy the project on GitHub Pages:

1. Ensure all files are in the `docs` folder as required by GitHub Pages.
2. Push the changes to the `main` branch of your repository.
3. Enable GitHub Pages in the repository settings, selecting the `docs` folder as the source.

## Usage

1. Enter the name of a Magic: The Gathering card in the input field and press Enter to add it to the canvas.
2. Drag cards to reposition them.
3. Use the mouse wheel to zoom in and out.
4. Hold the middle mouse button and drag to pan across the canvas.
5. Right-click on a card to delete it.
6. Use the "Clear Board" button to remove all cards from the canvas.

## Technologies Used

- **HTML5 Canvas**: For rendering the infinite canvas and cards.
- **JavaScript**: For interactivity and state management.
- **CSS**: For styling the UI.
- **Scryfall API**: For fetching Magic: The Gathering card images.

## License

This project is licensed under the [ISC License](LICENSE).

## Acknowledgments

- [Scryfall API](https://scryfall.com/docs/api) for providing card data.
- Inspiration from Miro's infinite canvas design.