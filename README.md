# Web 3D Medal Generator

A browser-based 3D medal generator that turns uploaded SVG artwork into raised medal face details. The tool provides live 3D preview, customizable medal geometry and material controls, and exports printable/shareable 3D model formats.

## Features

- Upload SVG artwork and convert it into front-face relief geometry.
- Customize medal shape, dimensions, thickness, edge bevel, and curve quality.
- Adjust relief depth, scale, rotation, and X/Y placement.
- Choose metallic material presets or custom color, metalness, and roughness for the base medal.
- Customize the raised SVG relief color, metalness, and roughness separately.
- Preview the generated medal in an interactive Three.js scene.
- Export models as:
  - STL for 3D printing.
  - GLB for material-preserving 3D preview and sharing.
  - USDZ for Apple Quick Look and AR workflows.
- Runs entirely in the browser with no backend.

## Tech Stack

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei
- ManifoldCAD / `manifold-3d` WASM
- Zustand
- Vitest

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the printed local URL, usually:

```text
http://127.0.0.1:5173/
```

## Scripts

```bash
npm run dev       # Start local dev server
npm run build     # Type-check and build production assets
npm run preview   # Preview the production build locally
npm test          # Run the test suite
```

## SVG Notes

The SVG importer is optimized for vector paths:

- Filled paths become relief contours.
- Basic stroked paths are converted into simple outline strips.
- Unsupported SVG features such as scripts, external images, filters, and animations are ignored with warnings.

For best results, upload clean monochrome SVGs with closed filled paths.

## Export Notes

- STL is exported in millimeters and does not preserve color or material.
- GLB and USDZ are exported in meters and preserve the current material settings.
- Geometry generation runs in a Web Worker so complex SVGs do not block the UI.

## Validation

The current implementation has tests for:

- Default configuration.
- SVG parsing and unsupported-feature warnings.
- Geometry generation for base medals, raised relief, and back markings.
- Export blob generation.
- Main control panel behavior.

Run:

```bash
npm test
npm run build
```
