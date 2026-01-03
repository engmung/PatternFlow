import React from 'react';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL } from '../constants';

interface GalleryItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

const galleryItems: GalleryItem[] = [
  {
    type: 'image',
    src: '/imgs/1.png',
    alt: 'PatternFlow 3D relief artwork 1'
  },
  {
    type: 'image',
    src: '/imgs/2.png',
    alt: 'PatternFlow 3D relief artwork 2'
  },
  {
    type: 'image',
    src: '/imgs/3.png',
    alt: 'PatternFlow 3D relief artwork 3'
  }
];

const CollectionGallery: React.FC = () => {
  return (
    <section className="w-full bg-black">
      
      {/* Section 1: Intro Text */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:pt-32 md:pb-24 text-center">
        <div className="font-serif text-lg md:text-2xl lg:text-3xl leading-relaxed text-gray-300 font-light antialiased flex flex-col gap-6">
          <p>
            The simulator shows the foundation—<br className="hidden md:inline" /> pattern generation at its core.
          </p>
          <p>
            Our collection features curated selections:<br className="hidden md:inline" /> meticulously rendered, expertly printed,<br className="hidden md:inline" /> framed 3D relief artworks ready for your wall.
          </p>
        </div>
      </div>

      {/* Section 2: Gallery Grid */}
      <div className="max-w-[90%] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {galleryItems.map((item, index) => (
            <div 
              key={index} 
              className="group relative aspect-square w-full bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-zinc-800"
            >
              {item.type === 'video' ? (
                <video
                  src={item.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
              ) : (
                <img
                  src={item.src}
                  alt={item.alt || ''}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
              )}
              
              {/* Optional: Overlay/Grain effect could go here */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Call-to-Action */}
      <div className="flex flex-col items-center justify-center py-20 md:py-32 px-6">
        <h2 className="font-serif text-2xl md:text-4xl text-white mb-3 text-center">
          Explore the gallery
        </h2>
        <p className="text-gray-500 font-sans text-xs md:text-sm mb-8 text-center">
          View curated works on Instagram
        </p>
        
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-6 py-3 border border-white text-white rounded-[4px] hover:bg-white hover:text-black transition-all duration-300 group"
        >
          <Instagram size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm font-medium tracking-wide">View on Instagram</span>
        </a>

        <p className="mt-8 text-gray-500 text-xs md:text-sm">
          Sales launching soon
        </p>
      </div>

    </section>
  );
};

export default CollectionGallery;