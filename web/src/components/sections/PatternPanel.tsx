import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SectionContent } from '@/lib/content';
import PretextText from '../ui/PretextText';

interface PatternPanelProps {
  content: SectionContent;
}

export default function PatternPanel({ content }: PatternPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="panel-content" id="pattern">
      <div className="panel-header">
        <h2>
          <PretextText 
            text={content.title} 
            font={isMobile ? "500 42px Inter, ui-sans-serif, system-ui, sans-serif" : "500 64px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 42 : 64} 
            letterSpacing={isMobile ? -1.5 : -2.24} 
            delayOffset={0.2}
          />
        </h2>
        <div className="sub">
          <PretextText 
            text={content.subtitle} 
            font={isMobile ? "400 16px Inter, ui-sans-serif, system-ui, sans-serif" : "400 20px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 24 : 29} 
            delayOffset={0.4}
          />
        </div>
      </div>
      <div className="panel-body">
        {content.meta && content.meta.length > 0 && (
          <div className="meta-row" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            {content.meta.map((item, idx) => (
              <div key={idx} className="meta-item">
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="prose" style={{ marginTop: '2rem', marginBottom: '3rem', fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
          <ReactMarkdown>{content.content}</ReactMarkdown>
        </div>

        {content.cta && (
          <div className="cta-row" style={{ display: 'flex', gap: '1rem', marginTop: '3rem', marginBottom: '10vh' }}>
            {content.cta.primary && (
              <a href={content.cta.primary.href} className="btn-primary" style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>
                {content.cta.primary.label}
              </a>
            )}
            {content.cta.secondary && (
              <a href={content.cta.secondary.href} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', background: '#f5f5f5', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>
                {content.cta.secondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
