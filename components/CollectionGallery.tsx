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
    alt: 'PatternFlow 3D artwork 1'
  },
  {
    type: 'image',
    src: '/imgs/2.png',
    alt: 'PatternFlow 3D artwork 2'
  },
  {
    type: 'image',
    src: '/imgs/3.png',
    alt: 'PatternFlow 3D artwork 3'
  }
];

const CollectionGallery: React.FC = () => {
  return (
    <section className="w-full bg-black">
      
      {/* Section 1: Intro Text */}
      <div className="max-w-5xl mx-auto px-6 py-4 md:py-8 text-center">
        <div className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight text-white font-light antialiased flex flex-col gap-10">
          <p className="fade-in-up">
            Experience the Butterfly Effect.
          </p>
          <p className="text-gray-400 text-lg md:text-2xl lg:text-3xl font-light leading-relaxed max-w-4xl mx-auto">
            The same minimal input creates absolute calm in simple systems,<br className="hidden md:inline" /> 
            but dramatic chaos in complex orders.<br className="hidden md:inline" /> 
            Observe how complexity amplifies every subtle change.
          </p>
          <p className="text-gray-500 text-base md:text-lg font-light italic leading-relaxed max-w-3xl mx-auto border-l border-zinc-700 pl-6 text-left">
            Try it above: raise the Scale to its maximum, then move the slider slowly.<br className="hidden md:inline" />
            Now reset to a low Scale and repeat. Notice how the same small input<br className="hidden md:inline" />
            creates vastly different results depending on the system's complexity.
          </p>
        </div>
      </div>

      {/* Section 2: Studio CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl md:text-4xl text-white mb-4">
            Create Your Own
          </h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6">
            Ready to explore the infinite depth of mathematical patterns?<br className="hidden md:inline" />
            Build your own complexity, discover your unique moment,<br className="hidden md:inline" />
            and export as OBJ for 3D printing or PNG for digital use.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-[4px] hover:bg-gray-200 transition-all duration-300"
          >
            <span className="text-sm tracking-wide">Open Studio</span>
            <span className="text-lg">→</span>
          </a>
        </div>
      </div>

      {/* Section 3: Archive Intro */}
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <h2 className="font-serif text-2xl md:text-4xl text-white mb-4">
          Curated Archive
        </h2>
        <p className="text-gray-500 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          From infinite possibilities, I select the ones that resonate with me.<br className="hidden md:inline" />
          Each piece is a curated discovery—a unique moment captured<br className="hidden md:inline" />
          from the algorithm's endless flow, refined into tangible 3D relief art.
        </p>
      </div>

      {/* Section 4: Gallery Grid */}
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
              
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Instagram CTA */}
      <div className="flex flex-col items-center justify-center py-20 md:py-32 px-6">
        <p className="text-gray-500 text-sm md:text-base font-light italic mb-8 max-w-lg text-center">
          "Being drawn to something is the truest expression of who I am."
        </p>
        <h2 className="font-serif text-2xl md:text-4xl text-white mb-3 text-center">
          Follow the Journey
        </h2>
        <p className="text-gray-500 font-sans text-xs md:text-sm mb-8 text-center max-w-md">
          See more curated works, behind-the-scenes process,<br className="hidden md:inline" />
          and the story behind each piece on Instagram.
        </p>
        
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-6 py-3 border border-white text-white rounded-[4px] hover:bg-white hover:text-black transition-all duration-300 group"
        >
          <Instagram size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm font-medium tracking-wide">@patternflow.art</span>
        </a>

        <p className="mt-12 text-zinc-600 text-xs md:text-sm font-mono uppercase tracking-wider">
          Physical editions launching soon
        </p>
      </div>

    </section>
  );
};

export default CollectionGallery;