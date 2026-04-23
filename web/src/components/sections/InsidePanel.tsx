interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function InsidePanel({ isOpen, onToggle }: Props) {
  return (
    <section className={`panel ${isOpen ? 'is-open' : ''}`} id="inside">
      <div className="panel-head" onClick={onToggle}>
        <div className="panel-num">02 / Inside</div>
        <h2><span data-label>Inside the work.</span> <span className="chev">›</span></h2>
        <p className="sub">The story, the roadmap, and how to get involved.</p>
      </div>
      <div className="panel-body-wrap">
        <div className="panel-body">
        <h3>Roadmap</h3>
        <div className="track">
          <div className="track-dot is-now"><div className="v">v0.1</div><div className="when">Now · Early access</div><div className="what">Core instrument. 12 patterns. Open-source.</div></div>
          <div className="track-dot"><div className="v">v0.2</div><div className="when">Q2 2026</div><div className="what">Pattern editor. Web flasher. More cases.</div></div>
          <div className="track-dot"><div className="v">v0.3</div><div className="when">Q4 2026</div><div className="what">Audio-in daughterboard. Battery module.</div></div>
          <div className="track-dot"><div className="v">v1.0</div><div className="when">2027</div><div className="what">Wireless uploads. Curated pattern library.</div></div>
        </div>
        <p style={{ marginTop: '28px' }}>Four branches, all forkable independently. <strong>Case</strong>: form-factor variations — pendant, tile, desk-dome. <strong>PCB</strong>: alternate silicon (RP2350, nRF52), audio-in daughterboard, battery module. <strong>Patterns</strong>: the library starts at twelve and grows with contributions. <strong>Platform</strong>: a web editor with live preview and wireless uploads.</p>

        <h3>Contributing</h3>
        <p>Looking for: a firmware engineer with opinions about LED timing, someone who has routed a two-layer board, a 3D-printable-case designer, a pattern author (math-art, creative-code, shader people), and anyone who can write docs a stranger could actually follow.</p>
        <div className="placeholder">
          <div className="ph-label">Placeholder · Contributor gallery</div>
          <div className="ph-title">Cases, patterns, forks from the community</div>
          <div className="ph-note">Will pull from GitHub / replace with an image grid. <a href="https://github.com/engmung/PatternFlow" target="_blank" rel="noopener">Open the repo →</a></div>
        </div>

        <h3>Lineage</h3>
        <p>This grew from an earlier work — <em>Patternflow: Origin</em> — a meditation on finding form inside chaos. Where <em>Origin</em> fixes a pattern into matter, this instrument keeps it in motion.</p>
        <p><a className="hero-cta" href="https://origin.patternflow.work/" target="_blank" rel="noopener">Read the origin story →</a></p>

        <h3>Origins</h3>
        <p>In 1963, Nam June Paik let viewers disrupt a broadcast by touching a magnet to the screen. The image flinched. The work was the flinch.</p>
        <p><em>Patternflow</em> lets you sculpt an algorithm by turning four knobs. Same question, sixty years later — what happens when the image waits for you?</p>
        <p>The device is not a screen. It is an instrument. The pattern on the face is not playing back; it is being generated, right now, by code that is watching what your hands are doing to the four encoders. Nothing is pre-recorded.</p>

        <div className="inside-list">
          <a href="https://github.com/engmung/PatternFlow" target="_blank" rel="noopener">GitHub</a>
          <span style={{ color: 'var(--ink-faint)' }}>·</span>
          <a href="#">Discord</a>
          <span style={{ color: 'var(--ink-faint)' }}>·</span>
          <a href="https://www.instagram.com/patternflow.work/" target="_blank" rel="noopener">Instagram</a>
        </div>
        </div>
      </div>
    </section>
  );
}
