import React from 'react';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL } from '../constants';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 md:px-12 backdrop-blur-md bg-black/70 border-b border-white/5 transition-all duration-300">
      <div className="flex items-center">
        <span className="font-serif text-xl md:text-2xl tracking-widest text-white font-medium">
          PATTERNFLOW
        </span>
      </div>

      <a
        href={INSTAGRAM_URL} 
        target="_blank" 
        rel="noreferrer"
        className="text-gray-400 hover:text-white transition-colors duration-300 opacity-80 hover:opacity-100 hover:scale-105 transform"
        aria-label="Visit our Instagram"
      >
        <Instagram size={20} strokeWidth={1.5} />
      </a>
    </nav>
  );
};

export default Navbar;