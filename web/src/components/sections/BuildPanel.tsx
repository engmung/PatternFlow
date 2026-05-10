import { useEffect, useRef, useState } from 'react';
import { useAppStore, SectionType } from '@/store/useAppStore';
import { SectionContent } from '@/lib/content';
import PretextText from '../ui/PretextText';
import styles from './BuildPanel.module.css';

interface BuildPanelProps {
  content: SectionContent;
}

const STEPS = [
  {
    id: 1,
    title: 'Print the case',
    desc: 'Three plates, any FDM printer.',
  },
  {
    id: 2,
    title: 'Solder the PCB',
    desc: 'Through-hole + a few SMD parts.',
  },
  {
    id: 3,
    title: 'Assemble',
    desc: 'Encoders, matrix, screws.',
  },
  {
    id: 4,
    title: 'Flash & power on',
    desc: 'Web flasher available in the adjacent PATTERN section.',
  },
];

export default function BuildPanel({ content }: BuildPanelProps) {
  const activeSection = useAppStore((state) => state.activeSection);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const buildStep = useAppStore((state) => state.buildStep);
  const setBuildStep = useAppStore((state) => state.setBuildStep);
  const isExploded = useAppStore((state) => state.isExploded);
  const setIsExploded = useAppStore((state) => state.setIsExploded);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lockedStep, setLockedStep] = useState<number | null>(null);

  // For touch devices, onClick acts as hover
  const [activeTouchStep, setActiveTouchStep] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleStepEnter = (stepId: number) => {
    if (isMobile || lockedStep !== null) return;
    setBuildStep(stepId);
  };

  const handleStepLeave = () => {
    if (isMobile || lockedStep !== null) return;
    setBuildStep(0);
  };

  const handleStepClick = (stepId: number) => {
    if (isMobile) {
      if (activeTouchStep === stepId) {
        setActiveTouchStep(null);
        setBuildStep(0);
      } else {
        setActiveTouchStep(stepId);
        setBuildStep(stepId);
      }
    } else {
      if (lockedStep === stepId) {
        setLockedStep(null);
      } else {
        setLockedStep(stepId);
        setBuildStep(stepId);
      }
    }
  };

  return (
    <div className="panel-content" id="build">
      <div className="panel-header">
        <h2>
          <PretextText 
            text="Build your own"
            font={isMobile ? "500 42px Inter, ui-sans-serif, system-ui, sans-serif" : "500 64px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 42 : 64} 
            letterSpacing={isMobile ? -1.5 : -2.24} 
            delayOffset={0.2}
          />
        </h2>
        <div className="sub">
          <PretextText 
            text="Print, solder, assemble, flash."
            font={isMobile ? "400 16px Inter, ui-sans-serif, system-ui, sans-serif" : "400 20px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 24 : 29} 
            delayOffset={0.4}
          />
        </div>
      </div>
      
      <div className={`panel-body ${styles.buildPanel}`} ref={containerRef}>
        <div className={styles.stats}>
          Requires 3D printing &middot; basic soldering &middot; PCB & component sourcing
        </div>
        
        <div className={styles.stepList} onMouseLeave={handleStepLeave}>
          {STEPS.map((step) => {
            const isActive = isMobile ? activeTouchStep === step.id : buildStep === step.id;
            return (
              <div
                key={step.id}
                role="button"
                tabIndex={0}
                className={`${styles.stepCard} ${isActive ? styles.active : ''}`}
                onMouseEnter={() => handleStepEnter(step.id)}
                onClick={() => handleStepClick(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStepClick(step.id);
                  }
                }}
              >
                <div className={styles.stepIndex}>
                  0{step.id}
                </div>
                <div className={styles.stepContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    {step.id === 3 && isActive && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsExploded(!isExploded); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: isExploded ? 'var(--accent, #FFD466)' : 'transparent', 
                          border: isExploded ? '1px solid var(--accent, #FFD466)' : '1px solid var(--ink-muted)', 
                          borderRadius: '20px',
                          color: isExploded ? '#000' : 'var(--ink)', 
                          padding: '4px 12px', fontSize: '11px', cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontWeight: 'bold', transition: 'all 0.2s ease',
                          boxShadow: isExploded ? '0 0 10px rgba(255, 212, 102, 0.3)' : 'none'
                        }}
                      >
                        {isExploded ? '↙ ASSEMBLE' : '↗ EXPLODE'}
                      </button>
                    )}
                  </div>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '2.5rem', marginBottom: '10vh' }}>
          <p style={{ 
            fontFamily: 'var(--sans)', 
            fontSize: '14.5px', 
            color: 'var(--ink-muted)', 
            lineHeight: 1.5,
            marginBottom: '20px'
          }}>
            The build guide includes all 3D models (STL, Blender source), PCB schematics, artworks, and Gerber files.<br/>
            Need help? Ask on <a href="https://discord.gg/Vr9QtsxeTk" target="_blank" rel="noreferrer" style={{color: 'var(--ink)'}}>Discord</a>. 
            <span style={{opacity: 0.7}}> (Video guide coming soon)</span>
          </p>
          <div className={styles.actionLinks} style={{ marginTop: 0, marginBottom: 0 }}>
            <a href="https://github.com/engmung/PatternFlow/blob/main/docs/BUILD.md" target="_blank" rel="noreferrer">Open the build guide ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
