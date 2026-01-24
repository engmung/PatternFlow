# Patternflow

**Where Noise Becomes Form**

An interactive generative art platform that explores the threshold between mathematical noise and legible form. Discover patterns, export them, and materialize them as 3D printed relief sculptures.

[Live Demo](https://patternflow.work) · [Studio](https://patternflow.work/studio) · [About](https://patternflow.work/about)

![Patternflow Preview](public/og-image.jpg)

---

## Concept

When the density of mathematical wave functions is pushed to extremes, complex patterns emerge—visually compelling, but fatiguing to perceive. By sampling this continuous field through a regular grid, information is reduced, and a different kind of form appears: masses, rhythms, structures that the eye can hold.

**The grid is not merely a technical tool—it is a lens that determines what can be seen.**

Patternflow invites you to manipulate that threshold directly. Discover when form emerges from noise, then take it home.

---

## Features

- **Interactive Pattern Generation** — Real-time manipulation of wave functions, grid density, and visual parameters
- **Multiple Export Formats** — PNG for digital use, OBJ/STL for 3D printing
- **Curated Archive** — Browse discovered forms materialized as relief sculptures
- **Physical Output** — Designed for fabrication as 3D printed wall art

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Rendering | Three.js, WebGL, React Three Fiber |
| Shaders | Custom GLSL |
| Framework | React 19, Vite |
| Styling | Tailwind CSS (CDN), CSS Modules |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/engmung/patternflow.git

# Navigate to directory
cd patternflow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

---

## Usage

1. **Adjust Parameters** — Use sliders to control scale, grid resolution, and height
2. **Find the Threshold** — Push density to extremes, then sample with the grid
3. **Discover Form** — Watch when noise becomes legible pattern
4. **Export** — Save as PNG or OBJ for 3D printing

---

## Project Structure

patternflow/
├── public/
│   ├── favicon.svg
│   ├── llms.txt
│   ├── robots.txt
│   └── sitemap.xml
├── components/
│   ├── SEO.tsx
│   ├── Navbar.tsx
│   └── ...
├── studio/
│   ├── StudioPage.tsx
│   └── ...
├── App.tsx
├── index.html
└── README.md
```

---

## Philosophy

> *"How you look determines what you see."*

In an age of information excess, we are surrounded by data we cannot fully perceive. Patternflow offers a tangible experience of this condition. Here, the visitor is not a passive viewer but an active discoverer—someone who finds form in complexity and takes it home.

Read more: [About Patternflow](https://patternflow.work/about)

---

## Author

**Seung Hun**

Seoul-based artist working at the intersection of code, 3D graphics, and fabrication.

- Portfolio: [lshsprotfolio.netlify.app](https://lshsprotfolio.netlify.app/en)
- Instagram: [@patternflow.art](https://instagram.com/patternflow.art)
- Project: [patternflow.work](https://patternflow.work)

---

## License

This work is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

**You are free to:**
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

**Under the following terms:**
- **Attribution** — You must give appropriate credit to Seung Hun, provide a link to the license, and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes

**Commercial Use:**  
For commercial licensing inquiries, contact: lsh678902@gmail.com

© 2025 Seung Hun. All rights reserved.

---

## Acknowledgments

- [Three.js](https://threejs.org/) for WebGL rendering
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for React integration
- Inspired by the work of Carsten Nicolai, Casey Reas, and Anders Hoff

---

<p align="center">
  <i>Discovered forms, materialized.</i>
</p>