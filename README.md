# PatternFlow

**The Art of Challenge in Complex Order**

Built by math. Curated by heart.

---

## Philosophy

PatternFlow stands at the boundary of two worlds: the infinite depth of mathematical order, and the unpredictable beauty of intuition.

> "Being drawn to something is the truest expression of who I am."

We simplify algorithmic patterns into 3D art. We build complexity through formulas, but discover meaning through the act of selection.

| Logic | Intuition |
|-------|-----------|
| Mathematical algorithms | Unpredictable chance |
| Complexity | Simplicity |
| Infinite possibilities | One curated choice |

### The Process

```
1. [COMPLEXITY]  Build mathematical order through algorithms
        ↓
2. [SIMPLIFY]    Pixelate to reveal hidden patterns
        ↓
3. [CURATE]      Select what resonates with the heart
```

---

## Live Demo

🌐 **Website:** [patternflow.work](https://patternflow.work)

📸 **Instagram:** [@patternflow.work](https://www.instagram.com/patternflow.work)

---

## Features

### Landing Page
- Interactive GPU-accelerated 3D pattern preview
- Real-time WebGL shader-based pattern generation
- **Butterfly Effect Experience** — Observe how complexity amplifies subtle changes
- Multiple pattern types: Noise and Ring Wave algorithms
- Responsive design for desktop and mobile

### Node-Based Studio (`/studio`)
A Blender-inspired visual node editor for creating generative patterns with real-time 3D preview.

**Key Features:**
- **Visual Node Graph Editor** — Drag-and-drop interface with bezier curve connections
- **GPU-Accelerated Rendering** — Real-time heightmap generation using WebGL fragment shaders
- **Blender Compatibility** — 10×10 world grid, 40×40 default resolution
- **Color Ramp System** — Multi-layer relief visualization with customizable color stops
- **Preset System** — Built-in presets with export/import functionality
- **OBJ/PNG Export** — Export 3D models with MTL materials or textures

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

---

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Three.js + React Three Fiber** — 3D rendering with WebGL shaders
- **Tailwind CSS** — Styling
- **Vercel** — Deployment & Analytics

---

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

---

## Project Structure

```
PatternFlow/
├── components/              # Landing page components
│   ├── Philosophy.tsx       # Hero section with brand philosophy
│   ├── InteractiveStudio.tsx # GPU-powered pattern simulator
│   ├── ReliefViewer.tsx     # WebGL 3D relief preview
│   └── CollectionGallery.tsx # Curated archive + Studio CTA
│
├── studio/                  # Node-based pattern editor
│   ├── components/
│   │   ├── NodeEditor.tsx   # Visual node graph editor
│   │   └── Scene.tsx        # GPU renderer + Color ramp
│   ├── utils/
│   │   └── shaderGenerator.ts # Dynamic GLSL shader generation
│   ├── StudioPage.tsx       # Main studio page
│   └── types.ts             # TypeScript definitions
│
├── utils/
│   └── noise.ts             # Simplex noise implementation
│
└── public/imgs/             # Gallery images
```

---

## Connect

- 🌐 Website: [patternflow.work](https://patternflow.work)
- 📸 Instagram: [@patternflow.work](https://www.instagram.com/patternflow.work)

---

## License

All rights reserved © 2026 PATTERNFLOW
