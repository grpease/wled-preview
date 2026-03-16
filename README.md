# wled-preview

A browser-based React app for previewing [WLED](https://github.com/wled/WLED) preset configurations. Paste or edit a WLED presets JSON file on the left and instantly see a serpentine LED strip visualisation on the right.

## Prerequisites

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173
```

## Scripts

```bash
npm run dev        # Development server with hot reload
npm run build      # Production build (output: dist/)
npm run preview    # Preview production build locally
npm run test       # Run Vitest test suite
npm run lint       # ESLint check
npm run format     # Prettier format check
```

## Usage

1. Open the app in a modern desktop browser (Chrome 120+, Firefox 120+, Safari 17+).
2. Paste a WLED presets JSON file into the left-hand editor panel.
3. Select a preset from the drop-down to preview it.
4. Edit the JSON — the preview updates automatically within 500ms.
