import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Node, Connection, ColorRampStop } from '../../studio/types';
import { generateShareUrl, copyToClipboard } from '../../utils/urlSharing';
import { useLanguage } from '../../context/LanguageContext';

interface ShareSectionProps {
  nodes: Node[];
  connections: Connection[];
  colors: ColorRampStop[];
  resolution: number;
  speed: number;
  heightScale: number;
}

export const ShareSection: React.FC<ShareSectionProps> = ({
  nodes,
  connections,
  colors,
  resolution,
  speed,
  heightScale
}) => {
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const { language } = useLanguage();

  const handleShareUrl = async () => {
    // Inject current settings into Nodes before sharing
    const updatedNodes = nodes.map(n => {
        if (n.type === 'TIME') { 
            return { ...n, data: { ...n.data, speed } };
        }
        if (n.type === 'OUTPUT') {
            return { ...n, data: { ...n.data, resolution, layerHeight: heightScale } };
        }
        return n;
    });

    const shareUrl = generateShareUrl({
      nodes: updatedNodes,
      connections,
      colorRamp: colors,
      gridResolution: resolution
    });
    
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setShareMessage('URL Copied!');
    } else {
      setShareMessage('Failed');
    }
    setTimeout(() => setShareMessage(null), 2500);
  };

  const t = {
    en: {
      quote: "Share your unique perspective.",
      shareBtn: "Copy Share URL",
      submitBtn: "Submit to Artist",
      description: "Sharing the URL allows anyone to instantly view your created pattern. Share it with friends and family, or show it to me via GitHub."
    },
    ko: {
      quote: "당신만의 시각을 공유하세요.",
      shareBtn: "공유 URL 복사",
      submitBtn: "작가에게 제출",
      description: "URL을 공유하면 만든 패턴을 바로 볼 수 있습니다. 친구나 가족에게 공유하거나, GitHub를 통해 저에게 보여주세요."
    }
  }[language];

  return (
      <section className="w-full bg-[#0a0a0a] py-32 px-6 md:px-12 border-t border-zinc-900" id="share">
        <div className="max-w-[800px] mx-auto text-center flex flex-col items-center">
          
          <blockquote className="text-xl md:text-3xl font-serif text-white italic tracking-wide mb-12 leading-relaxed">
            "{t.quote}"
          </blockquote>
          
          <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-center mb-12 flex-wrap">
              <button 
                onClick={handleShareUrl}
                className="group relative inline-flex items-center justify-center gap-3 py-4 px-8 text-sm uppercase font-bold tracking-wider bg-zinc-100 text-black hover:bg-white transition-all rounded-sm min-w-[200px]"
              >
                <Share2 size={16} />
                <span>{t.shareBtn}</span>
                
                {shareMessage && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-3 py-1.5 rounded whitespace-nowrap shadow-[0_4px_20px_rgba(255,255,255,0.2)] fade-in-up border border-zinc-200">
                    {shareMessage}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white"></div>
                  </span>
                )}
              </button>
              
              <a 
                href="https://github.com/engmung/PatternFlow/issues/new?title=[Pattern]%20My%20New%20Creation&body=Paste%20your%20URL%20here:"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-3 py-4 px-8 text-sm uppercase font-bold tracking-wider border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition-all rounded-sm min-w-[200px]"
              >
                <span>{t.submitBtn}</span>
              </a>
          </div>
          
          <p className="text-base md:text-lg text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed">
             {t.description}
          </p>
        </div>
      </section>
  );
};
