# PatternFlow

Ever-changing patterns frozen at a single moment. Algorithmic beauty carved into tangible 3D relief art.

## 🎨 About

PatternFlow is a generative art project that transforms digital patterns into physical 3D relief artworks. Using algorithmic design and computational creativity, we create unique pieces that blend the digital and physical worlds.

## 🌐 Live Demo

Visit the live site: [patternflow.work](https://patternflow.work)

## 🚀 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js** - 3D rendering
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **Tailwind CSS** - Styling (via CDN)
- **Vercel Analytics** - Visitor tracking

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/engmung/PatternFlow.git

# Navigate to the project directory
cd PatternFlow

# Install dependencies
npm install
```

### Run Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
PatternFlow/
├── components/           # React components
│   ├── Navbar.tsx       # Navigation bar
│   ├── Philosophy.tsx   # Hero section
│   ├── InteractiveStudio.tsx  # Interactive 3D pattern generator
│   ├── PatternControls.tsx    # Pattern configuration controls
│   ├── ReliefViewer.tsx       # 3D relief visualization
│   └── CollectionGallery.tsx  # Gallery showcase
├── utils/               # Utility functions
│   └── noise.ts        # Perlin noise implementation
├── types/              # TypeScript type definitions
│   └── index.ts        # Pattern types and interfaces
├── public/             # Static assets
│   ├── imgs/          # Gallery images
│   ├── og-image.jpg   # Open Graph image
│   └── favicon.svg    # Favicon
├── constants.ts        # App constants (URLs, etc.)
├── App.tsx            # Main app component
├── index.tsx          # Entry point
└── index.html         # HTML template
```

## 🎛️ Features

- **Interactive Pattern Studio**: Real-time 3D pattern generation with customizable parameters
- **Multiple Pattern Types**: Noise and Ring Wave algorithms
- **Color Theory**: Advanced color palette generation using harmonious color schemes
- **Responsive Design**: Optimized for desktop and mobile devices
- **Performance Optimized**: Memoization, debouncing, and efficient rendering
- **SEO Ready**: Complete meta tags for social sharing

## 📱 Connect

- Website: [patternflow.work](https://patternflow.work)
- Instagram: [@patternflow.work](https://www.instagram.com/patternflow.work)

## 📄 License

All rights reserved © 2026 PATTERNFLOW

---

Built with ❤️ using React, Three.js, and generative algorithms
