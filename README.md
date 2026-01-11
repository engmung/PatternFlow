# PatternFlow

Ever-changing patterns frozen at a single moment. Algorithmic beauty carved into tangible 3D relief art.

## About

PatternFlow is a generative art project that transforms digital patterns into physical 3D relief artworks. Using algorithmic design and computational creativity, we create unique pieces that blend the digital and physical worlds.

## Live Demo

Visit the live site: [patternflow.work](https://patternflow.work)

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js** - 3D rendering
- **React Three Fiber** - React renderer for Three.js
- **Tailwind CSS** - Styling
- **Vercel Analytics** - Visitor tracking

## Features

### Landing Page
- Interactive 3D pattern preview
- Real-time pattern generation with customizable parameters
- Multiple pattern types: Noise and Ring Wave algorithms
- Responsive design optimized for desktop and mobile

### Node-Based Studio (`/studio`)
A Blender-inspired visual node editor for creating patterns:

- **Node Types**
  - Time - Animation driver
  - Value - Scalar constant
  - Vector - XYZ vector constant
  - Position - UV coordinate input
  - Combine XYZ / Separate XYZ - Vector manipulation
  - Math - Arithmetic operations (ADD, SUB, MUL, DIV, SIN, COS, etc.)
  - Vector Math - Vector operations (Add, Subtract, Normalize, Cross Product, etc.)
  - Wave Texture - Bands/Rings wave pattern generator
  - Noise Texture - Procedural noise generator
  - Output - Final render output

- **Features**
  - Visual node connections with bezier curves
  - Real-time 3D preview with GPU-accelerated rendering
  - Color Ramp editor for layer-based relief visualization
  - Grayscale mode for texture preview
  - OBJ export with materials
  - Keyboard shortcuts (Delete to remove nodes, Space to pause)

## Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Installation

```bash
git clone https://github.com/engmung/PatternFlow.git
cd PatternFlow
npm install
```

### Run Locally

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

The app will be available at `http://localhost:5173`

## Project Structure

```
PatternFlow/
├── components/              # Landing page components
│   ├── Navbar.tsx
│   ├── Philosophy.tsx
│   ├── InteractiveStudio.tsx
│   ├── PatternControls.tsx
│   ├── ReliefViewer.tsx
│   └── CollectionGallery.tsx
├── studio/                  # Node-based editor
│   ├── components/
│   │   ├── NodeEditor.tsx   # Visual node graph editor
│   │   └── Scene.tsx        # 3D preview with GPU rendering
│   ├── utils/
│   │   └── engine.ts        # Node graph evaluation engine
│   ├── constants.ts         # Node definitions
│   ├── types.ts             # TypeScript interfaces
│   └── index.tsx            # Studio entry point
├── utils/
│   └── noise.ts             # Perlin noise implementation
├── public/
│   ├── imgs/                # Gallery images
│   └── og-image.jpg         # Open Graph image
├── App.tsx
├── index.tsx
└── index.html
```

## Connect

- Website: [patternflow.work](https://patternflow.work)
- Instagram: [@patternflow.work](https://www.instagram.com/patternflow.work)

## License

All rights reserved © 2026 PATTERNFLOW
