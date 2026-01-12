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
A Blender-inspired visual node editor for creating generative patterns with real-time 3D preview.

**Key Features:**
- **Visual Node Graph Editor** - Drag-and-drop interface with bezier curve connections
- **GPU-Accelerated Rendering** - Real-time heightmap generation using WebGL fragment shaders
- **Blender Compatibility** - 10×10 world grid, 40×40 default resolution
- **Color Ramp System** - Multi-layer relief visualization with customizable color stops
- **Preset System** - Built-in presets (Radial Waves, Organic Bands) with export/import
- **OBJ Export** - Export 3D models with MTL materials for 3D printing or rendering
- **Keyboard Shortcuts** - Delete (remove nodes), Space (pause animation), Pan/Zoom canvas

**Node Types:**

| Node | Description | Inputs | Outputs |
|------|-------------|--------|---------|
| **Time** | Animation driver with adjustable speed | - | value |
| **Value** | Scalar constant | - | value |
| **Vector** | XYZ vector constant | - | vector |
| **Position** | UV coordinate input (per-pixel) | - | vector |
| **Separate XYZ** | Split vector into X, Y, Z components | vector | x, y, z |
| **Combine XYZ** | Merge X, Y, Z into vector | x, y, z | vector |
| **Math** | 40+ operations (ADD, SIN, COS, FLOOR, etc.) | a, b | value |
| **Vector Math** | Vector operations (ADD, NORMALIZE, DOT, etc.) | a, b | vector, value |
| **Wave Texture** | Bands/Rings wave generator with detail noise | vector, phase | value |
| **Noise Texture** | Simplex noise generator | vector | value |
| **Output** | Final render output with resolution control | value | - |

**Math Operations:** ADD, SUB, MUL, DIV, SIN, COS, TAN, FLOOR, CEIL, ROUND, FRACT, MIN, MAX, POWER, SQRT, ABSOLUTE, MODULO, and more.

**Wave Texture Parameters:**
- Type: Bands or Rings
- Direction: X, Y, Z, Diagonal
- Profile: Sine or Sawtooth
- Scale, Distortion, Detail, Roughness controls

**How It Works:**
1. Create nodes and connect them to build a processing graph
2. Chain nodes: `Time → Math → Wave Texture → Output`
3. Use Position node for coordinate-based patterns
4. Adjust Color Ramp to define relief layers
5. Export as OBJ for 3D printing or further rendering

**Example Workflows:**
```
Simple Animation:
Time → Wave Texture (phase) → Output

Position-Based Pattern:
Position → Separate XYZ → Math (SIN) → Wave Texture (vector) → Output

Complex Chain:
Time → Math (MUL 2) → Wave Texture (phase)
Position → Vector Math (SCALE 0.5) → Wave Texture (vector)
Wave Texture → Output
```

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
│   ├── Navbar.tsx           # Navigation with Studio link
│   ├── Philosophy.tsx       # Brand philosophy section
│   ├── InteractiveStudio.tsx # Interactive demo with pattern controls
│   ├── PatternControls.tsx  # Pattern parameter controls
│   ├── ReliefViewer.tsx     # 3D relief preview
│   └── CollectionGallery.tsx # Instagram gallery integration
│
├── studio/                  # Node-based pattern editor
│   ├── components/
│   │   ├── NodeEditor.tsx   # Visual node graph editor
│   │   │                      - Drag-and-drop nodes
│   │   │                      - Bezier connection curves
│   │   │                      - Pan/Zoom canvas navigation
│   │   │                      - Add node menu (11 node types)
│   │   │
│   │   └── Scene.tsx        # 3D preview renderer
│   │                          - GPU heightmap generator (WebGL)
│   │                          - Color ramp visualization
│   │                          - Layered relief rendering
│   │                          - OBJ/MTL export
│   │
│   ├── StudioPage.tsx       # Main studio page
│   │                          - Preset system (export/import)
│   │                          - localStorage persistence
│   │                          - Split view (editor + preview)
│   │
│   ├── types.ts             # TypeScript type definitions
│   │                          - Node, Connection interfaces
│   │                          - NodeType enum
│   │                          - Math/VectorMath operation types
│   │
│   ├── constants.ts         # Node definitions and defaults
│   │                          - Node input/output schemas
│   │                          - Default node graph
│   │                          - Built-in presets
│   │
│   └── index.tsx            # Studio entry point
│
├── utils/
│   └── noise.ts             # Simplex noise implementation
│
├── public/
│   ├── imgs/                # Pattern gallery images
│   └── og-image.jpg         # Social media preview
│
├── App.tsx                  # Main app with routing
├── index.tsx                # React root
└── index.html               # HTML entry point
```

### Technical Architecture

**Studio System:**
- **Node Graph System**: TypeScript-based node evaluation with connection validation
- **GPU Rendering**: WebGL fragment shaders for real-time heightmap generation
- **Data Flow**: Nodes → Connections → GPU Uniforms → Fragment Shader → Pixel Output
- **Export Pipeline**: Heightmap → Layer Separation → OBJ Geometry + MTL Materials

**Key Files:**
- `studio/components/NodeEditor.tsx` (~730 lines) - Full-featured node editor
- `studio/components/Scene.tsx` (~1065 lines) - GPU renderer + Color ramp UI
- `studio/types.ts` - Complete type system for 11 node types
- `studio/constants.ts` - Node schemas and default configurations

## Connect

- Website: [patternflow.work](https://patternflow.work)
- Instagram: [@patternflow.work](https://www.instagram.com/patternflow.work)

## License

All rights reserved © 2026 PATTERNFLOW
