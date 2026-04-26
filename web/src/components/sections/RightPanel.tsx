'use client';

import { useState } from 'react';
import Hero from './Hero';
import BuildPanel from './BuildPanel';
import InsidePanel from './InsidePanel';
import PatternPanel from './PatternPanel';
import Footer from '../layout/Footer';
import { SectionContent } from '@/lib/content';

type TabType = 'hero' | 'build' | 'inside' | 'pattern';

interface RightPanelProps {
  buildContent: SectionContent;
  patternContent: SectionContent;
  insideContent: SectionContent;
}

export default function RightPanel({ buildContent, patternContent, insideContent }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hero');

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab('hero');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="right-panel-layout">
      <div className="vertical-nav">
        <button 
          className={`v-tab-btn ${activeTab === 'build' ? 'active' : ''}`}
          onClick={() => handleTabClick('build')}
        >
          {activeTab === 'build' && <span className="close-icon">✕</span>}
          <span className="tab-text">Build</span>
        </button>

        <button 
          className={`v-tab-btn ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => handleTabClick('pattern')}
        >
          {activeTab === 'pattern' && <span className="close-icon">✕</span>}
          <span className="tab-text">Pattern</span>
        </button>
        <button 
          className={`v-tab-btn ${activeTab === 'inside' ? 'active' : ''}`}
          onClick={() => handleTabClick('inside')}
        >
          {activeTab === 'inside' && <span className="close-icon">✕</span>}
          <span className="tab-text">Inside</span>
        </button>
      </div>

      <div className={`content-panel ${activeTab !== 'hero' ? 'bg-white' : ''}`}>
        <div className="deck-content">
          <div className={`panel-wrapper ${activeTab === 'hero' ? 'active' : ''}`}>
            <Hero />
            <Footer />
          </div>
          <div className={`panel-wrapper ${activeTab === 'build' ? 'active' : ''}`}>
            <BuildPanel content={buildContent} />
          </div>
          <div className={`panel-wrapper ${activeTab === 'pattern' ? 'active' : ''}`}>
            <PatternPanel content={patternContent} />
          </div>
          <div className={`panel-wrapper ${activeTab === 'inside' ? 'active' : ''}`}>
            <InsidePanel content={insideContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
