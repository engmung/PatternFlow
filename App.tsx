import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Philosophy from './components/Philosophy';
import InteractiveStudio from './components/InteractiveStudio';
import CollectionGallery from './components/CollectionGallery';

function App() {
  return (
    <div className="min-h-screen w-full bg-black text-gray-100 selection:bg-white selection:text-black">
      <Navbar />
      
      <main>
        <Philosophy />
        <InteractiveStudio />
        <CollectionGallery />
      </main>

      <footer className="w-full py-12 border-t border-white/10 mt-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mt-8">
            <span className="font-serif text-lg text-gray-600">P</span>
          </div>
          <p className="mt-8 text-[10px] text-gray-600">
            © {new Date().getFullYear()} PATTERNFLOW. All rights reserved.
          </p>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;