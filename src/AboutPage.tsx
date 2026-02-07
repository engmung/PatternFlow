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
          
          <div className="space-y-8 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>Patternflow is the act of discovering one's own perspective amidst an excess of possibilities. This act has two phases.</p>
                
                <div className="space-y-4">
                  <h3 className="text-white font-serif text-xl md:text-2xl">Raw Patternflow</h3>
                  <p>Push the density of a wave — built from simple mathematical rules — to its extreme, and it becomes a kind of chaos. A state where anything could emerge, and therefore nothing does. It mirrors the sensation of being overwhelmed by the endless stream of information and possibilities that surround us. This is Raw Patternflow. A raw current of countless possibilities, given equally to all of us. With the advance of technology, the complexity of this chaos has grown beyond what we can bear — and it will only continue to grow.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-serif text-xl md:text-2xl">Shaped Patternflow</h3>
                  <p>Simplify the chaos. Lay down your own rules over the raw current. This process is quite accidental. You swim through an infinite flow, searching until something pulls you in. When further exploration loses its meaning, you settle where you were drawn most.</p>
                  <p>There, you assign height and color. You give it depth. It is the process of immersing yourself in a choice you arrived at by chance, making it fully your own. Through this, chance becomes necessity. Even on the same flow, entirely different perspectives are born depending on how you select and what depth you bring. This is Shaped Patternflow.</p>
                  <p>Yet a choice is not a destination. Even after a form is shaped, the flow continues. The pattern is the choice. The flow is the life that never stops moving after it. A Shaped Patternflow is solidified through 3D printing into an object you can hold — carrying it into your own life. And the solidified form begins to flow once again through Reflow.</p>
                </div>
              </>
            ) : (
              <>
                <p>패턴플로우는 가능성의 과잉 속에서 개성적인 시각을 발견하는 행위이다. 이 행위에는 두 가지 국면이 있다.</p>
                
                <div className="space-y-4">
                  <h3 className="text-white font-serif text-xl md:text-2xl">Raw Patternflow</h3>
                  <p>단순한 수학적 규칙으로 이루어진 파동의 밀도를 극도로 올리면 일종의 혼돈이 된다. 무엇이든 될 수 있지만 그래서 아무것도 아닌 상태. 끊임없이 쏟아지는 정보와 가능성 속에서 압도당하는 우리의 감각과 닮아 있다. 이것이 Raw Patternflow다. 우리 모두에게 공통적으로 주어진, 수많은 가능성으로 이루어진 날것의 흐름이다. 기술의 발전으로 혼돈의 복잡도가 감당하기 어려울 정도로 커졌고, 앞으로도 커질 것이다.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-serif text-xl md:text-2xl">Shaped Patternflow</h3>
                  <p>복잡한 혼돈을 단순화한다. 날것의 흐름 위에 자신만의 규칙을 놓는다. 이 과정은 꽤 우연적이다. 무한한 흐름 속을 헤엄치며, 이끌리는 지점을 찾을 때까지 반복한다. 더 이상의 탐색이 의미를 잃는 순간, 가장 끌렸던 곳에 정착한다.</p>
                  <p>정착한 곳에 높이와 색상을 부여하고 깊이를 더한다. 우연히 도착한 선택을 자기 것으로 만들기 위해 몰입하는 과정이다. 이를 통해 우연은 필연이 된다. 같은 흐름 위에서도 어떻게 선별하고 어떤 깊이를 부여하느냐에 따라 전혀 다른 시각이 태어난다. 이것이 Shaped Patternflow다.</p>
                  <p>그러나 선택은 종착점이 아니다. 형태를 빚은 뒤에도 흐름은 계속된다. 패턴은 선택이고, 플로우는 그 선택 이후에도 멈추지 않는 삶이다. Shaped Patternflow는 3D 프린팅을 통해 손에 쥘 수 있는 오브제로 응고되어, 각자의 삶 속으로 이어진다. 그리고 응고된 형태는 Reflow를 통해 다시 흐르기 시작한다.</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Artist Bio */}
        <section className="space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-serif text-3xl md:text-5xl text-white">{language === 'en' ? 'Artist: Seunghoon Lee' : '작가: 이승훈'}</h2>
          
          <div className="space-y-6 text-gray-300 font-light text-lg md:text-xl leading-relaxed">
            {language === 'en' ? (
              <>
                <p>I like writing code and connecting nodes to build structures. When I change a single variable in a system and watch the entire form shift, I find freedom somewhere between control and chance. I work primarily with web, 3D printing, and physical computing, and I'm drawn to creating experiences where people discover something for themselves through code and interaction.</p>
                <p>Patternflow began with a mistake. I was trying to create a smooth gradient when I pushed a parameter to its extreme, and the dense, intricate pattern that emerged captivated me. It was a moment where an unintended result reached out from beyond the code. I found myself drawn not only to the outcome but to the process itself, and I began to ask why.</p>
                <p>I think of myself as someone close to chaos. I'm easily shaken, and the more possibilities there are, the more I waver. I stepped away from a predetermined path to walk toward art, but the shape of the artist I'll become is not yet clear. What I do know is that I trust action over deliberation. Form doesn't emerge from thought alone. I move my hands first, and find the direction I'm pulled toward from within that movement.</p>
                <p>The process of making my own patterns out of complexity felt like it mirrored the way to live as myself in a complex age. I hope everyone finds their own pattern of life — not following the current that society sets, but selecting and amplifying by their own rules, shaping a form that is theirs even if it's frightening. I believe the search itself is already something beautiful.</p>
              </>
            ) : (
              <>
                <p>코드를 짜고 노드를 연결해 구조를 만드는 일을 좋아한다. 시스템을 구축한 후 변수 하나를 바꿨을 때 전체 형상이 변화하는 순간, 통제와 우연 사이 어딘가에서 자유를 느낀다. 주로 웹, 3D 프린팅, 피지컬 컴퓨팅을 매체로 다루며, 코드와 인터랙션을 통해 사람들이 스스로 무언가를 발견하는 경험을 만드는 데 관심이 있다.</p>
                <p>Patternflow는 실수에서 시작되었다. 부드러운 그라데이션을 만들려다 파라미터를 극단적으로 올렸고, 그때 나타난 복잡하고 촘촘한 패턴에 매료되었다. 의도하지 않은 결과가 코드 너머에서 건네지는 순간이었다. 만들다 보니 결과물뿐 아니라 작업 방식 자체에 빠져들었고, 그 이유를 고민하게 되었다.</p>
                <p>나는 스스로를 혼돈에 가까운 사람이라고 생각한다. 쉽게 흔들리고, 가능성이 많을수록 오히려 휘둘린다. 정해진 길 위에 있던 삶을 스스로 내려놓고 예술을 향해 걸어왔지만, 어떤 형태의 예술가가 될지는 아직 선명하지 않다. 다만 하나 확실한 것은, 나는 생각보다 실행을 믿는다는 것이다. 고민만으로는 형태가 만들어지지 않는다. 일단 손을 움직이고, 그 안에서 이끌리는 방향을 찾는다.</p>
                <p>복잡함 속에서 나만의 방식으로 패턴을 만드는 이 과정이, 복잡한 시대에 나로서 살아가는 방법을 닮아 있었다. 나는 모든 사람이 각자만의 삶의 패턴을 찾기를 바란다. 사회가 정해준 흐름이 아닌, 자기만의 규칙으로 선별하고 증강한, 두렵더라도 자신의 것인 형태를. 그 탐색의 과정 자체가 이미 충분히 아름답다고 믿는다.</p>
              </>
            )}
          </div>

          <div className="pt-8">
            <a 
              href="https://lshsprotfolio.netlify.app/en" 
              target="_blank" 
              rel="noreferrer"
              className="inline-block bg-white text-black px-2 py-1 font-mono text-sm tracking-[0.3em] uppercase underline underline-offset-[3px] hover:bg-gray-200 transition-colors"
            >
              More Works
            </a>
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
