'use client';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <h1><em className="wordmark">Patternflow</em></h1>
        <div className="kicker">An LED synthesizer.</div>
        <p className="lede">
          Play light patterns with your fingertips.<br />
          <a className="has-tip" data-tip="Opens GitHub →" href="https://github.com/engmung/PatternFlow" target="_blank" rel="noopener" style={{borderBottom: '1px solid var(--ink)', paddingBottom: '1px'}}>An open-source</a> reinterpretation of Nam June Paik's <em>Participation TV</em> (1963).
        </p>
        <a className="hero-cta has-tip" data-tip="Reserve a slot — email signup" href="#notify">Get notified when it ships →</a>
      </div>
    </section>
  );
}
