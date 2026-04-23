import PretextText from '../ui/PretextText';

export default function PatternPanel() {
  return (
    <div className="panel-content" id="pattern">
      <div className="panel-header">
        <h2>
          <PretextText 
            text="Create your own pattern." 
            font="500 64px Inter, ui-sans-serif, system-ui, sans-serif" 
            lineHeight={64} 
            letterSpacing={-2.24} 
            delayOffset={0.2}
          />
        </h2>
        <div className="sub">
          <PretextText 
            text="Write your own shader and test it instantly." 
            font="400 20px Inter, ui-sans-serif, system-ui, sans-serif" 
            lineHeight={29} 
            delayOffset={0.4}
          />
        </div>
      </div>
      <div className="panel-body">
        <div className="placeholder" style={{ marginTop: '10vh', marginBottom: '20vh' }}>
          <div className="ph-label">Work in Progress</div>
          <div className="ph-title">Coming Soon</div>
          <div className="ph-note">We are currently preparing the content for this section. Please check back later.</div>
        </div>
      </div>
    </div>
  );
}
