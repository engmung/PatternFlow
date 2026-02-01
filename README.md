**English** | [한국어](README.ko.md)

# Patternflow

**Time To Find Meaning**

> *In an age where algorithms endlessly pour out information, we are overwhelmed by seeing and hearing the same things.*
>
> *Through the practice of finding your own perspective, I hope you discover your own unique beauty in this flow.*

[Live Demo](https://patternflow.work) · [Studio](https://patternflow.work/studio) · [About](https://patternflow.work/about)

![Patternflow Preview](public/og-image.jpg)

---

## Philosophy

> *"How you look determines what you see."*

Patternflow offers an experience of subtraction and discovery.

When the density of mathematical waves is pushed to the extreme, complex and dense patterns emerge. It is overwhelming, much like the ceaseless flow of modern information. When this continuous field is sampled with a regular grid and given height and color, a new form is revealed. What was once overwhelming transforms into legible masses and rhythms.

This work invites the audience to directly manipulate this threshold. By moving simple sliders, you explore the moment when a unique form emerges from complexity. The form you discover does not stay on the screen but can be taken home as a tangible object through 3D printing. The grid is not just a tool, but a lens that determines what is seen. A single pattern becomes a different form depending on how you look at it.

*We must learn how to interpret the same world in our own ways. What to select and how to augment it. This is how we view the world.*

---

## Features

- **Interactive Pattern Generation** — Real-time manipulation of wave functions, grid density, and visual parameters
- **URL Sharing** — Share your patterns via URL. Pattern data is compressed and encoded into the link, allowing anyone to open it instantly
- **Multiple Export Formats** — PNG for digital use, OBJ/STL for 3D printing
- **Physical Output** — Designed for fabrication as 3D printed wall art

---

## 3D Printed Examples

Patterns designed in Patternflow can be exported and 3D printed as physical wall art.

| Cube | Detail |
|:----------:|:------:|
| ![3D Print Cube](docs/3d-print-cube.jpg) | ![3D Print Detail](docs/3d-print-detail.jpg) |

---

## Artist

**Seung Hun Lee**

I am a student majoring in Visual Communication Design at Hongik University in South Korea.

I prefer writing code and connecting nodes to build structures over drawing. I feel a sense of freedom in the moment when the entire shape changes just by altering a single variable after building a system.

Patternflow started from a mistake. I was trying to create a smooth gradient using Blender3D's Wave Texture node but raised the parameters to an extreme. I was captivated by the complex and dense patterns that appeared. As I continued making it, I realized I was captivated not just by the result, but by the process itself.

Floods of information, the uncertainty of a future with AI. I found myself constantly wavering, overwhelmed by complexity. However, the process of simplifying complexity in my own way to create patterns seemed to show me how to live as myself in this complex era. I wanted to share this experience.

- Portfolio: [lshsprotfolio.netlify.app](https://lshsprotfolio.netlify.app/en)
- Instagram: [@patternflow.work](https://instagram.com/patternflow.work)

---

## Tech Stack

Patternflow started from changing the scale of Wave Texture in Blender3D's geometry nodes. We implemented this using WebGL and Three.js to generate patterns in real-time in the browser, and enabled exporting as OBJ files for 3D printing.

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

## License

This work is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

**You are free to:**
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

**Under the following terms:**
- **Attribution** — You must give appropriate credit to Seung Hun Lee, provide a link to the license, and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes

**Commercial Use:**  
For commercial licensing inquiries, contact: lsh678902@gmail.com

© 2026 Seung Hun Lee. All rights reserved.
