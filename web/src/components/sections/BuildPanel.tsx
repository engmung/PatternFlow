interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function BuildPanel({ isOpen, onToggle }: Props) {
  return (
    <section className={`panel ${isOpen ? 'is-open' : ''}`} id="build">
      <div className="panel-head" onClick={onToggle}>
        <div className="panel-num">01 / Build</div>
        <h2><span data-label>Build your own.</span> <span className="chev">›</span></h2>
        <p className="sub">Print the case, order the parts, flash the firmware. About 30 minutes of assembly. ~$80 in parts.</p>
      </div>
      <div className="panel-body-wrap">
        <div className="panel-body">
        <h3>Three things to know.</h3>
        <div className="key-points">
          <div className="kp">
            <span className="n">01</span>
            <div>
              <h4>PCBway ships five at a time.</h4>
              <p>The minimum order is five boards. Keep one, hand the rest to friends. The project is designed to spread by gift, not by purchase.</p>
            </div>
          </div>
          <div className="kp">
            <span className="n">02</span>
            <div>
              <h4>Everything is on GitHub.</h4>
              <p>3D case files, PCB gerbers, schematic, and the ESP32 firmware. All open — fork it, change it, remix the case.</p>
            </div>
          </div>
          <div className="kp">
            <span className="n">03</span>
            <div>
              <h4>One-click web flasher (coming).</h4>
              <p>Plug the board into your browser, pick a firmware, flash it. No toolchain, no command line. Space reserved below.</p>
            </div>
          </div>
        </div>

        <h3>Guide — written &amp; video.</h3>
        <div className="placeholder">
          <div className="ph-label">Placeholder · Build guide</div>
          <div className="ph-title">Step-by-step assembly documentation</div>
          <div className="ph-note">Will link to the GitHub guide repo when published. <a href="https://github.com/engmung/PatternFlow" target="_blank" rel="noopener">github.com/engmung/PatternFlow</a></div>
        </div>
        <div className="placeholder is-media">
          <div className="ph-label">Placeholder · Video</div>
          <div className="ph-title">Assembly walkthrough — ~8 min</div>
          <div className="ph-note">Embed will go here.</div>
        </div>

        <h3>Web flasher.</h3>
        <div className="placeholder">
          <div className="ph-label">Placeholder · In-browser ESP32 uploader</div>
          <div className="ph-title">Flash the latest firmware from this page</div>
          <div className="ph-note">WebSerial-based uploader. Connect board → pick firmware → flash. Coming with v0.2.</div>
        </div>
        </div>
      </div>
    </section>
  );
}
