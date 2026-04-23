'use client';

import { useState } from 'react';
import BuildPanel from './BuildPanel';
import InsidePanel from './InsidePanel';
import PatternPanel from './PatternPanel';

type TabType = 'build' | 'inside' | 'pattern';

export default function Deck() {
  const [activeTab, setActiveTab] = useState<TabType>('build');

  return (
    <div className="deck-wrap">
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'build' ? 'active' : ''}`}
          onClick={() => setActiveTab('build')}
        >
          Build your own
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inside' ? 'active' : ''}`}
          onClick={() => setActiveTab('inside')}
        >
          Inside the work
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => setActiveTab('pattern')}
        >
          Create Pattern
        </button>
      </div>

      <div className="deck-content" id="deck">
        {activeTab === 'build' && <BuildPanel />}
        {activeTab === 'inside' && <InsidePanel />}
        {activeTab === 'pattern' && <PatternPanel />}
      </div>
    </div>
  );
}
