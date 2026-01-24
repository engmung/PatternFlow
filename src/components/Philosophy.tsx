import React, { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Philosophy: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { language } = useLanguage();

  return (
    <>
      {/* Main Hero Section */}
      <section className="min-h-[70vh] pt-20 md:pt-24 flex flex-col justify-center items-center px-6 bg-black relative overflow-hidden">
        <div className={`max-w-5xl w-full transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Left Column: Title, Description, Button */}
            <div className="space-y-8">
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
                <span className="block mb-4">
                  {language === 'en' ? (
                    <>Where Noise<br />Becomes Form</>
                  ) : (
                    <>노이즈가<br />형태가 되는 순간</>
                  )}
                </span>
              </h1>

              <div className="text-gray-100 font-light text-lg md:text-xl leading-relaxed space-y-4">
                {language === 'en'
                  ? <>
                      <p>In the density of overlapping waves, patterns emerge—intricate, chaotic, impossible to read.</p>
                      <p>But change how you sample them, and structure reveals itself.</p>
                      <p>The same complexity, seen differently, becomes something you can hold.</p>
                    </>
                  : <>
                      <p>중첩된 파동의 밀도 속에서 패턴이 드러납니다—복잡하고, 혼란스럽고, 읽을 수 없는.</p>
                      <p>하지만 샘플링하는 방식을 바꾸면, 구조가 스스로를 드러냅니다.</p>
                      <p>같은 복잡함이라도 다르게 보면, 손에 쥘 수 있는 무언가가 됩니다.</p>
                    </>}
              </div>
              
              <div>
                  <a 
                    href="/about" 
                    className="inline-block bg-white text-black px-4 py-2 font-mono text-sm tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
                  >
                    {language === 'en' ? 'Read Philosophy' : '철학 읽기'}
                  </a>
              </div>
            </div>
            
            {/* Right Column: Image Only */}
            <div className="relative w-full h-full min-h-[300px] md:min-h-0">
                <img 
                  src="/main-hero.png?v=fixed" 
                  alt="Patternflow visualization" 
                  className="absolute inset-0 w-full h-full object-contain object-center md:object-right-top"
                />
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Removed from here */}
      </section>

      {/* Sub-Hero Section: Quote */}
      <section className="py-12 px-6 bg-black flex flex-col justify-center items-center relative gap-12">
        <div className={`max-w-4xl text-center transition-all duration-1000 delay-500 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           <p className="text-white/90 font-serif italic tracking-widest font-medium text-4xl md:text-6xl leading-relaxed">
              {language === 'en'
                ? '"How you look determines what you see."'
                : '"어떻게 보느냐가 무엇을 보느냐를 결정한다."'}
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className={`transition-opacity duration-1000 delay-[1500ms] ${isVisible ? 'opacity-50' : 'opacity-0'}`}>
          <div className="animate-bounce">
            <ChevronDown className="text-white w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
          </div>
        </div>
      </section>
    </>
  );
};

export default Philosophy;