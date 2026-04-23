'use client';

import { useState } from 'react';
import BuildPanel from './BuildPanel';
import InsidePanel from './InsidePanel';

export default function Deck() {
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const togglePanel = (panelId: string) => {
    setOpenPanel(prev => prev === panelId ? null : panelId);
  };

  return (
    <div className="deck-wrap">
      <div className="deck" id="deck">
        <BuildPanel isOpen={openPanel === 'build'} onToggle={() => togglePanel('build')} />
        <InsidePanel isOpen={openPanel === 'inside'} onToggle={() => togglePanel('inside')} />
      </div>
    </div>
  );
}
