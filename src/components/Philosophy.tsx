import React, { useEffect, useState } from 'react';

import { useLanguage } from '../context/LanguageContext';

const Philosophy: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { language } = useLanguage();

  return (
    <section className="min-h-[80vh] pt-20 md:pt-24 flex flex-col justify-center items-center px-6 bg-black relative overflow-hidden">
      <div className={`max-w-5xl transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="space-y-12">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
            <span className="block mb-4">
              {language === 'en' ? (
                <>Where Noise<br />Becomes Form</>
              ) : (
                <>노이즈가<br />형태가 되는 순간</>
              )}
            </span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left items-start">
            <div className="space-y-6">
              <p className="text-gray-100 font-light text-xl md:text-2xl leading-relaxed">
                {language === 'en' ? 'Adjust the threshold. Discover the pattern.' : '임계값을 조절하고, 패턴을 발견하세요.'}
                <span className="block mt-4 text-gray-400 text-lg md:text-xl">
                  {language === 'en' 
                    ? 'Explore when and how legible form emerges from overwhelming complexity.'
                    : '압도적인 복잡함 속에서 언제, 어떻게 읽을 수 있는 형태가 드러나는지 탐험해 보세요.'}
                </span>
              </p>
            </div>
            <div className="space-y-8">
                 <p className="text-gray-300 font-light italic text-lg md:text-xl leading-relaxed border-l border-zinc-700 pl-6">
                    {language === 'en'
                      ? '"The grid is not merely a technical tool—it is a lens that determines what can be seen."'
                      : '"그리드는 단순한 기술적 도구가 아니라, 무엇이 보이는지를 결정하는 렌즈입니다."'}
                </p>
                
                <div className="pt-0">
                    <a 
                      href="/about" 
                      className="inline-block bg-white text-black px-2 py-1 font-mono text-sm tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
                    >
                      {language === 'en' ? 'Read Philosophy' : '철학 읽기'}
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;