import React from 'react';
import { Github } from 'lucide-react';
import Navbar from './components/Navbar';
import WaveDecoration from './components/WaveDecoration';
import { INSTAGRAM_URL } from './constants';
import { useLanguage } from './context/LanguageContext';

import SEO from './components/SEO';

const AboutPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen w-full bg-black text-gray-100 selection:bg-white selection:text-black">
      <SEO 
        title={language === 'en' ? 'Philosophy & Artist' : '철학 & 작가 소개'}
        description={language === 'en' ? 'Patternflow offers an experience of subtraction and discovery. Meet the artist Seung Hun Lee and explore how noise becomes form.' : 'Patternflow는 덜어냄과 발견의 경험을 제공합니다. 작가 이승훈(Seung Hun Lee)과 함께 노이즈가 형태가 되는 순간을 탐구합니다.'}
      />
      <Navbar />

      {/* 3D Wave Decorations - Fixed Sidebars */}
      <WaveDecoration side="left" />
      <WaveDecoration side="right" />
      
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto space-y-32">
        
        {/* Section 1: Patternflow Philosophy */}
        <section className="space-y-8 fade-in-up">
          <h2 className="font-serif text-3xl md:text-5xl text-white">Patternflow</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>Patternflow offers an experience of subtraction and discovery.</p>
                <p>When the density of mathematical waves is pushed to the extreme, complex and dense patterns emerge. It is overwhelming, much like the ceaseless flow of modern information. When this continuous field is sampled with a regular grid and given height and color, a new form is revealed. What was once overwhelming transforms into legible masses and rhythms.</p>
                <p>This work invites the audience to directly manipulate this threshold. By moving simple sliders, you explore the moment when a unique form emerges from complexity. The form you discover does not stay on the screen but can be taken home as a tangible object through 3D printing. The grid is not just a tool, but a lens that determines what is seen. A single pattern becomes a different form depending on how you look at it.</p>
                <p className="border-l border-zinc-700 pl-6 italic text-gray-400">We must learn how to interpret the same world in our own ways. What to select and how to augment it. This is how we view the world.</p>
              </>
            ) : (
              <>
                <p>Patternflow는 덜어냄을 통해 개성적인 시각을 발견하는 경험을 제공합니다.</p>
                <p>수학적 파동의 밀도를 극단으로 높이면, 복잡하고 촘촘한 패턴이 나타납니다. 끊임없이 쏟아지는 현대의 정보처럼 압도적이죠. 이 연속적인 장을 규칙적인 그리드로 샘플링하고 높이와 색상을 부여하면, 새로운 형태가 드러납니다. 압도적이던 것이 읽기 쉬운 덩어리와 리듬으로 바뀌어갑니다.</p>
                <p>이 작업은 관객에게 그 경계를 직접 조작하게 합니다. 단순한 슬라이더를 움직이며, 복잡함 속에서 개성적인 형태가 드러나는 순간을 탐험합니다. 발견한 형태는 화면 속에만 머물지 않고, 3D 프린팅을 통해 손에 쥘 수 있는 오브제로 가져갈 수 있습니다. 그리드는 단순한 도구가 아니라, 무엇을 볼지 결정하는 렌즈입니다. 하나의 패턴도 어떻게 보느냐에 따라 다른 형태가 됩니다.</p>
                <p className="border-l border-zinc-700 pl-6 italic text-gray-400">우리는 같은 세상을 각자의 방식으로 해석하는 방법을 배워야 합니다. 무엇을 선별하고 어떻게 증강하는가. 이것이 우리가 세상을 바라보는 방법입니다.</p>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Artist Bio */}
        <section className="space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-serif text-3xl md:text-5xl text-white">{language === 'en' ? 'Artist' : '작가'}</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>I am Seung Hun Lee, a student majoring in Visual Communication Design at Hongik University in South Korea.</p>
                <p>I prefer writing code and connecting nodes to build structures over drawing. I feel a sense of freedom in the moment when the entire shape changes just by altering a single variable after building a system.</p>
                <p>Patternflow started from a mistake. I was trying to create a smooth gradient using Blender3D's Wave Texture node but raised the parameters to an extreme. I was captivated by the complex and dense patterns that appeared. As I continued making it, I realized I was captivated not just by the result, but by the process itself.</p>
                <p>Floods of information, the uncertainty of a future with AI. I found myself constantly wavering, overwhelmed by complexity. However, the process of simplifying complexity in my own way to create patterns seemed to show me how to live as myself in this complex era. I wanted to share this experience.</p>
              </>
            ) : (
              <>
                <p>저는 홍익대학교에서 시각디자인을 전공하고 있는 이승훈입니다.</p>
                <p>드로잉보다는 코드를 짜고 노드를 연결해 구조를 만드는 일을 더 좋아합니다. 시스템을 구축한 후 변수 하나를 바꿨을 때 전체 형상이 변화하는 순간, 거기서 자유로움을 느끼기 때문입니다.</p>
                <p>Patternflow는 실수에서 시작되었습니다. 부드러운 그라데이션을 만들려다 파라미터를 극단적으로 올렸고, 그때 나타난 복잡하고 촘촘한 패턴에 매료되었습니다. 만들다 보니 결과물뿐 아니라 작업 방식 자체에도 빠져들었습니다. 그 이유를 고민해 보았습니다.</p>
                <p>수많은 정보, AI로 인한 미래의 불확실성. 복잡함에 압도되어 자꾸만 흔들리는 제가 있었습니다. 그런데 복잡함을 나만의 방식으로 단순화하여 패턴을 만드는 이 과정이, 복잡한 시대에 나로서 살아가는 방법을 보여주는 듯했습니다. 이 경험을 나누고 싶습니다.</p>
              </>
            )}
          </div>

          <div className="pt-8">
            <a 
              href="https://lshsprotfolio.netlify.app/en" 
              target="_blank" 
              rel="noreferrer"
              className="inline-block bg-white text-black px-2 py-1 font-mono text-sm tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
            >
              More Works
            </a>
          </div>
        </section>

        {/* Section 3: Tech Stack */}
        <section className="space-y-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-serif text-3xl md:text-5xl text-white">{language === 'en' ? 'Tech Stack' : '사용 기술'}</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
             {language === 'en' ? (
                <p>Patternflow started from changing the scale of Wave Texture in Blender3D's geometry nodes. We implemented this using WebGL and Three.js to generate patterns in real-time in the browser, and enabled exporting as OBJ files for 3D printing.</p>
             ) : (
                <p>Patternflow는 Blender3D의 지오메트리 노드에서 Wave Texture의 scale을 바꾸다 시작되었습니다. 이를 WebGL과 Three.js를 활용해 브라우저에서 실시간으로 패턴을 생성하도록 구현하고, 3D 프린팅을 위한 OBJ 파일로 출력할 수 있게 하였습니다.</p>
             )}
          </div>
        </section>

      </main>

      <footer className="w-full py-12 mt-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="mb-8 flex justify-center items-center gap-8">
              <a href="https://instagram.com/patternflow.work" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-serif text-base text-white/60 hover:text-white transition-colors">
                @patternflow.work
              </a>
              <a href="https://github.com/engmung/PatternFlow" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-serif text-base text-white/60 hover:text-white transition-colors">
                <Github size={16} />
                GitHub
              </a>
            </div>
            <p className="text-sm text-white/70">
            © {new Date().getFullYear()} PATTERNFLOW. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
