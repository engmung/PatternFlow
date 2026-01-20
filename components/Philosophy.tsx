import React, { useEffect, useState } from 'react';

const Philosophy: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-[100vh] pt-32 md:pt-40 pb-20 flex flex-col justify-center items-center px-6 bg-black relative overflow-hidden">
      <div className={`max-w-5xl transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="space-y-16">
          {/* Main Title */}
          <div>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-6">
              I Don't Draw.
            </h1>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-400 leading-tight">
              I Code Art.
            </h2>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            {/* Left: Personal Journey */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400">The Journey</h3>
                <p className="text-gray-200 font-light text-lg leading-relaxed">
                  I studied mathematics. Enrolled in the military academy. Then discovered I wanted to create.
                </p>
                <p className="text-gray-300 font-light text-base leading-relaxed">
                  But I couldn't draw. No canvas. No brush. Only what I knew: logic, code, mathematics.
                </p>
                <p className="text-gray-300 font-light text-base leading-relaxed">
                  So I found my own language.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400 mb-4">My Tools</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-200 font-mono text-sm">03D Modeling</p>
                    <p className="text-gray-400 text-xs">Blender, procedural generation, geometric nodes</p>
                  </div>
                  <div>
                    <p className="text-gray-200 font-mono text-sm">Graphics Programming</p>
                    <p className="text-gray-400 text-xs">WebGL, GLSL shaders, Three.js, real-time rendering</p>
                  </div>
                  <div>
                    <p className="text-gray-200 font-mono text-sm">Creative Coding</p>
                    <p className="text-gray-400 text-xs">Algorithms, generative systems, interactive experiences</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: The Philosophy */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400">The Question</h3>
                <p className="text-gray-200 font-light text-lg italic leading-relaxed border-l-2 border-white pl-6">
                  What if the most beautiful art comes from the purest mathematics?
                </p>
              </div>

              <div className="space-y-4 bg-zinc-900/30 border border-zinc-800 rounded p-6">
                <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400">The Process</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-white font-mono">01.</span>
                    <div>
                      <p className="text-white font-light">Algorithm generates infinite possibilities</p>
                      <p className="text-gray-500 text-xs">Mathematics creates complexity</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-white font-mono">02.</span>
                    <div>
                      <p className="text-white font-light">I examine what emerges</p>
                      <p className="text-gray-500 text-xs">Intuition finds what resonates</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-white font-mono">03.</span>
                    <div>
                      <p className="text-white font-light">One pattern stands out</p>
                      <p className="text-gray-500 text-xs">Curation transforms possibility into meaning</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="font-mono text-sm tracking-widest uppercase text-gray-500">
                <span className="block bg-white/5 text-white px-3 py-2 rounded inline-block">Built by math.</span>
                <span className="block bg-white/5 text-white px-3 py-2 rounded inline-block mt-2">Curated by heart.</span>
              </p>
            </div>
          </div>

          {/* Bottom Statement */}
          <div className="pt-8 border-t border-zinc-800">
            <p className="text-gray-400 font-light text-base leading-relaxed max-w-2xl">
              PatternFlow is my first work as an artist. A manifesto that algorithms can be beautiful,
              that technical precision can contain emotional truth, and that your creative voice
              doesn't require a pencil—only the courage to express yourself differently.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;