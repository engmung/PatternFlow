import { useEffect, useRef } from 'react';
import { useAppStore, SectionType } from '@/store/useAppStore';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function BuildPanel({ isOpen, onToggle }: Props) {
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveSection('hero');
      return;
    }

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
  }, [isOpen, setActiveSection]);

  return (
    <section className={`panel ${isOpen ? 'is-open' : ''}`} id="build">
      <div className="panel-head" onClick={onToggle}>
        <div className="panel-num">01 / Build</div>
        <h2><span data-label>Build your own.</span> <span className="chev">›</span></h2>
        <p className="sub">Print the case, order the parts, flash the firmware. About 30 minutes of assembly. ~$80 in parts.</p>
      </div>
      <div className="panel-body-wrap">
        <div className="panel-body" ref={containerRef}>
          
          {/* Case Section */}
          <div data-section="case" className="min-h-screen flex flex-col justify-center py-20">
            <h3>1. The Case.</h3>
            <p>Everything is on GitHub. 3D case files are ready to be printed. No supports needed.</p>
            <div className="key-points">
              <div className="kp">
                <span className="n">01</span>
                <div>
                  <h4>No supports needed.</h4>
                  <p>Designed for easy FDM printing. Print face down on a textured PEI sheet for the best finish.</p>
                </div>
              </div>
            </div>
          </div>

          {/* PCB Section */}
          <div data-section="pcb" className="min-h-screen flex flex-col justify-center py-20">
            <h3>2. The PCB.</h3>
            <p>Order the board online. We recommend PCBway. It comes mostly assembled with SMD parts already soldered.</p>
            <div className="key-points">
              <div className="kp">
                <span className="n">02</span>
                <div>
                  <h4>PCBway ships five at a time.</h4>
                  <p>The minimum order is five boards. Keep one, hand the rest to friends. The project is designed to spread by gift.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assembly Section */}
          <div data-section="assembly" className="min-h-screen flex flex-col justify-center py-20">
            <h3>3. Assembly.</h3>
            <p>About 30 minutes of assembly. Just slot the components in and tighten the screws.</p>
            <div className="placeholder is-media">
              <div className="ph-label">Placeholder · Video</div>
              <div className="ph-title">Assembly walkthrough — ~8 min</div>
              <div className="ph-note">Embed will go here.</div>
            </div>
          </div>

          {/* Firmware Section */}
          <div data-section="firmware" className="min-h-screen flex flex-col justify-center py-20">
            <h3>4. Web flasher.</h3>
            <p>Plug the board into your browser, pick a firmware, flash it. No toolchain, no command line.</p>
            <div className="placeholder">
              <div className="ph-label">Placeholder · In-browser ESP32 uploader</div>
              <div className="ph-title">Flash the latest firmware from this page</div>
              <div className="ph-note">WebSerial-based uploader. Connect board → pick firmware → flash. Coming with v0.2.</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
