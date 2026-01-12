import React, { useEffect, useState } from 'react';

const Philosophy: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-[80vh] pt-20 md:pt-24 flex flex-col justify-center items-center px-6 bg-black relative overflow-hidden">
      <div className={`max-w-5xl transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="space-y-12">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
            <span className="block mb-4">
              The Art of Challenge in Complex Order
            </span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left items-start">
            <div className="space-y-6">
              <p className="text-gray-100 font-light text-xl md:text-2xl leading-relaxed">
                Searching for myself between logic and chance. 
                PatternFlow stands at the boundary of two worlds: 
                The infinite depth of mathematical order, 
                and the unpredictable beauty of intuition.
              </p>
            </div>
            <div className="space-y-8">
                 <p className="text-gray-300 font-light italic text-lg md:text-xl leading-relaxed border-l border-zinc-700 pl-6">
                    Simplifying algorithmic patterns into 3D art. 
                    We build complexity through formulas, 
                    but discover meaning through the act of selection.
                </p>
                <p className="font-mono text-sm tracking-[0.3em] uppercase">
                    <span className="bg-white text-black px-2 py-1">Built by math.</span><br />
                    <span className="bg-white text-black px-2 py-1 mt-1 inline-block">Curated by heart.</span>
                </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;