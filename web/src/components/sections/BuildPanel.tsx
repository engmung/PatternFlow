import { useEffect, useRef } from 'react';
import { useAppStore, SectionType } from '@/store/useAppStore';

import PretextText from '../ui/PretextText';

export default function BuildPanel() {
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section') as SectionType;
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = containerRef.current?.querySelectorAll('[data-section]');
    sections?.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [setActiveSection]);

  return (
    <div className="panel-content" id="build">
      <div className="panel-header">
        <h2>
          <PretextText 
            text="Build your own." 
            font="500 64px Inter, ui-sans-serif, system-ui, sans-serif" 
            lineHeight={64} 
            letterSpacing={-2.24} 
            delayOffset={0.2}
          />
        </h2>
        <div className="sub">
          <PretextText 
            text="Print the case, order the parts, flash the firmware. About 30 minutes of assembly. ~$80 in parts." 
            font="400 20px Inter, ui-sans-serif, system-ui, sans-serif" 
            lineHeight={29} 
            delayOffset={0.4}
          />
        </div>
      </div>
      <div className="panel-body" ref={containerRef}>
        <div className="placeholder" style={{ marginTop: '10vh', marginBottom: '20vh' }}>
          <div className="ph-label">Work in Progress</div>
          <div className="ph-title">Coming Soon</div>
          <div className="ph-note">We are currently preparing the content for this section. Please check back later.</div>
        </div>
      </div>
    </div>
  );
}
