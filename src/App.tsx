import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Github } from 'lucide-react';
import Navbar from './components/Navbar';
import Philosophy from './components/Philosophy';
import InteractiveStudio from './components/InteractiveStudio';
import SEO from './components/SEO';

function App() {
  return (
    <div className="min-h-screen w-full bg-black text-gray-100 selection:bg-white selection:text-black">
      <SEO 
        title="Design Your Own Objet" 
        description="Design unique parametric wall art with our interactive generative tool. Explore wave functions, discover patterns, and order high-quality 3D printed reliefs for your home." 
        keywords="Generative Wall Art, Parametric Wall Art, Custom 3D Printed Relief, Architectural Wall Sculpture, Interior Objet"
      />
      <Navbar />
      
      <main>
        <Philosophy />
        <InteractiveStudio />
      </main>

      <footer className="w-full py-12 mt-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mt-8 flex justify-center items-center gap-8">
            <a href="https://instagram.com/patternflow.work" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-serif text-base text-white/60 hover:text-white transition-colors">
              @patternflow.work
            </a>
            <a href="https://github.com/engmung/PatternFlow" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-serif text-base text-white/60 hover:text-white transition-colors">
              <Github size={16} />
              GitHub
            </a>
          </div>
          <p className="mt-8 text-sm text-white/70">
            © {new Date().getFullYear()} PATTERNFLOW. All rights reserved.
          </p>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;