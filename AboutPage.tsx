import React from 'react';
import Navbar from './components/Navbar';
import { INSTAGRAM_URL } from './constants';
import { useLanguage } from './src/context/LanguageContext';

const AboutPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen w-full bg-black text-gray-100 selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto space-y-32">
        
        {/* Section 1: Patternflow Philosophy */}
        <section className="space-y-8 fade-in-up">
          <h2 className="font-serif text-3xl md:text-5xl text-white">Patternflow</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>Patternflow gives visitors control over the conditions of visibility itself.</p>
                <p>When the density of mathematical wave functions is pushed to extremes, a complex and intricate pattern emerges—visually compelling, but fatiguing to look at for long. By sampling this continuous field through a regular grid, information is reduced, and a different kind of form appears: masses, rhythms, structures that the eye can hold.</p>
                <p>This work invites visitors to manipulate that threshold directly. Through simple sliders, they explore when and how legible form emerges from overwhelming complexity. The grid is not merely a technical tool—it is a lens that determines what can be seen.</p>
                <p>When a visitor discovers a moment that resonates, they can materialize it: export the form, print it, hold it in their hands. Infinite possibilities collapse into one chosen object.</p>
                <p className="border-l border-zinc-700 pl-6 italic text-gray-400">In an age of information excess, we are surrounded by data we cannot fully perceive. Patternflow offers a tangible experience of this condition: <em>how you look determines what you see.</em> Here, the visitor is not a passive viewer but an active discoverer—someone who finds form in complexity and takes it home.</p>
              </>
            ) : (
              <>
                <p>Patternflow는 관객에게 '가시성의 조건' 자체를 조작하게 한다.</p>
                <p>수학적 파동 함수의 밀도를 극단적으로 높이면, 복잡하고 촘촘한 패턴이 나타난다. 시각적으로 흥미롭지만, 오래 보기엔 피로하다. 이 연속적인 장(場)을 규칙적인 그리드로 샘플링하면 정보는 줄어들고, 대신 덩어리와 리듬을 가진 새로운 형태가 드러난다.</p>
                <p>이 작업은 관객에게 그 경계를 직접 조작하게 한다. 단순한 슬라이더를 움직이며, 언제 그리고 어떻게 복잡함 속에서 읽을 수 있는 형태가 나타나는지를 탐험한다. 그리드는 단순한 기술적 도구가 아니라, 무엇이 보이는지를 결정하는 렌즈다.</p>
                <p>관객이 자신에게 의미 있는 순간을 발견하면, 그것을 물질화할 수 있다: 내보내고, 출력하고, 손에 쥔다. 무한한 가능성이 하나의 선택된 오브제로 고정된다.</p>
                <p className="border-l border-zinc-700 pl-6 italic text-gray-400">정보 과잉의 시대, 우리는 온전히 지각할 수 없는 데이터에 둘러싸여 있다. Patternflow는 이 조건을 감각적으로 경험하게 한다: <em>어떻게 보느냐가 무엇을 보느냐를 결정한다.</em> 여기서 관객은 수동적 감상자가 아니라 능동적 발견자—복잡함 속에서 형태를 찾아 가져가는 사람이다.</p>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Artist Bio */}
        <section className="space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-serif text-3xl md:text-5xl text-white">{language === 'en' ? 'About the Artist' : '작가 소개'}</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>Seung Hun is a Seoul-based artist working at the intersection of code, 3D graphics, and fabrication.</p>
                <p>After studying Visual Communication Design at Hongik University, he found that traditional drawing wasn't his language. Instead, he turned to node-based systems and code—tools that let him think in logic while creating visually.</p>
                <p>His practice has explored various intersections of web technology and physical output. In 2025, he built a generative 3D QR system that allows users to create custom signage and namecards for direct 3D printing. Through this project, he discovered the potential of layered, multi-color 3D printing as an artistic medium.</p>
                <p>Patternflow began as an accident. While attempting to create smooth gradients, he pushed the parameters to an extreme—and was captivated by the dense, complex patterns that emerged. This mistake became a method.</p>
                <p>Patternflow is his first series as an artist. Not a technical exercise, but a personal statement: that beauty can be found in the threshold between noise and form, and that anyone can discover it.</p>
              </>
            ) : (
              <>
                <p>이승훈은 코드, 3D 그래픽, 디지털 제작의 교차점에서 작업하는 서울 기반 아티스트다.</p>
                <p>홍익대학교 시각디자인과에서 공부했지만, 드로잉이 자신의 언어가 아님을 깨달았다. 대신 노드 기반 시스템과 코드로 방향을 틀었다—논리로 사고하면서 시각적으로 창작할 수 있는 도구들.</p>
                <p>그의 작업은 웹 기술과 물리적 출력의 다양한 교차점을 탐험해왔다. 2025년, 사용자가 직접 커스텀 간판과 명함을 만들어 바로 3D 프린팅할 수 있는 제너레이티브 3D QR 시스템을 개발했다. 이 프로젝트를 통해 레이어링과 멀티컬러 3D 프린팅의 예술적 가능성을 발견했다.</p>
                <p>Patternflow는 실수에서 시작됐다. 부드러운 그라데이션을 만들려다 파라미터를 극단적으로 올렸고, 그때 나타난 복잡하고 촘촘한 패턴에 매료되었다. 실수가 방법론이 되었다.</p>
                <p>Patternflow는 그의 첫 번째 시리즈다. 기술적 연습이 아닌 작가로서의 첫 발화—노이즈와 형태 사이의 경계에서 아름다움을 발견할 수 있고, 누구나 그것을 경험할 수 있다는 선언.</p>
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

      </main>

      <footer className="w-full py-12 mt-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="mb-8">
              <a href="https://instagram.com/patternflow.art" target="_blank" rel="noreferrer" className="font-serif text-sm text-gray-500 hover:text-white transition-colors">
                @patternflow.art
              </a>
            </div>
            <p className="text-[10px] text-gray-600">
            © {new Date().getFullYear()} PATTERNFLOW. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
