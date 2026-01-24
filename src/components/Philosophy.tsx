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
      <section className="min-h-[70vh] pt-32 md:pt-40 flex flex-col justify-center items-center px-6 bg-black relative overflow-hidden">
        <div className={`max-w-5xl w-full transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
            {/* Left Column: Title, Description, Button */}
            <div className="space-y-8 md:col-span-7">
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
                <span className="block mb-4">
                  {language === 'en' ? (
                    <div className="flex flex-col w-full font-bold tracking-tighter">
                        <span className="bg-white text-black px-4 py-1 self-start z-10">Time</span>
                        <span className="bg-white text-black px-4 py-1 self-start relative left-[45%] -translate-x-1/2 z-20">To Find</span>
                        <span className="bg-white text-black px-4 py-1 self-end z-30">Meaning</span>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full font-bold tracking-tighter">
                        <span className="bg-white text-black px-4 py-1 self-start z-10">의미를</span>
                        <span className="bg-white text-black px-4 py-1 self-start relative left-[55%] -translate-x-1/2 z-20">찾아가는</span>
                        <span className="bg-white text-black px-4 py-1 self-end z-30">시간</span>
                    </div>
                  )}
                </span>
              </h1>

              <div className={`text-gray-100 font-light leading-relaxed space-y-8 ${language === 'en' ? 'text-lg md:text-xl' : 'text-sm md:text-xl'}`}>
                {language === 'en'
                  ? <div className="text-center space-y-8">
                      <p>In an age where algorithms endlessly pour out information,<br/>we are overwhelmed by seeing and hearing the same things.</p>
                      <p>Through the practice of finding your own perspective,<br/>I hope you discover your own unique beauty in this flow.</p>
                    </div>
                  : <div className="text-center space-y-8">
                      <p>알고리즘이 쉴 새 없이 정보를 쏟아내는 지금,<br/>우리는 같은 것을 보고 들으며 압도당합니다.</p>
                      <p>이 흐름 속에서 자신만의 시선을 찾는 연습을 통해<br/>나만의 아름다움을 발견할 수 있길 바랍니다.</p>
                    </div>}
              </div>
              
              <div>
                  <a 
                    href="/about" 
                    className={`inline-block bg-white text-black px-4 py-2 font-mono tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors ${
                      language === 'en' ? 'text-sm' : 'text-xs md:text-sm'
                    }`}
                  >
                    Read Philosophy
                  </a>
              </div>
            </div>
            
            {/* Right Column: Image Only */}
            <div className="relative w-full h-full min-h-[300px] md:min-h-0 md:col-span-5">
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
      <section className="pt-32 pb-24 px-6 bg-black flex flex-col justify-center items-center relative gap-12">
        <div className={`max-w-4xl text-center transition-all duration-1000 delay-500 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           <p className="text-white/90 font-serif italic tracking-widest font-medium text-xl md:text-3xl leading-relaxed">
              {language === 'en'
                ? '"How you look determines what you see."'
                : '"어떻게 보느냐가 무엇을 보느냐를 결정한다."'}
          </p>
        </div>


      </section>
    </>
  );
};

export default Philosophy;