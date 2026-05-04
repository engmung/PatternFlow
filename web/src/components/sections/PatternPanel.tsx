import { useEffect, useState } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SectionContent } from '@/lib/content';
import PretextText from '../ui/PretextText';
import Script from 'next/script';
import { useAppStore } from '@/store/useAppStore';
import Editor from '@monaco-editor/react';

const createPrompt = `I am writing a custom LED pattern in JavaScript for a 128x64 display. It uses the following API: 
- \`export function setup(params) {}\`
- \`export function update(dt, input, params) {}\` where \`input.knobDeltas\` is an array of 4 encoder deltas (Hue, Speed, Mode, Freq).
- \`export function draw(display, params, time) {}\` where \`display.setPixel(x,y,r,g,b)\` draws a pixel. 
Please write a cool, dynamic, animated pattern using this structure.`;

const getConvertPrompt = (code: string) => `Convert the following JavaScript LED pattern into ESP32 C++ for the PatternFlow project. 
The C++ namespace structure should use a \`Params\` struct, \`update(float dt, const InputFrame& input)\` mapping knob deltas to params, and \`draw()\` using \`dma_display->drawPixelRGB888(x, y, r, g, b)\`. 
Here is the JavaScript code:

${code}`;


// Type bypass for Web Component
const EspWebInstallButton = 'esp-web-install-button' as any;

interface PatternPanelProps {
  content: SectionContent;
}

export default function PatternPanel({ content }: PatternPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const activePatternId = useAppStore(state => state.activePatternId);
  const customJsCode = useAppStore(state => state.customJsCode);
  const setCustomJsCode = useAppStore(state => state.setCustomJsCode);
  
  const handleCopyCreatePrompt = () => {
    navigator.clipboard.writeText(createPrompt);
    alert('AI Prompt copied to clipboard! Paste it in ChatGPT/Claude to generate a pattern.');
  };

  const handleCopyConvertPrompt = () => {
    navigator.clipboard.writeText(getConvertPrompt(customJsCode));
    alert('C++ Conversion Prompt copied to clipboard! Paste it in ChatGPT/Claude to get your ESP32 C++ code.');
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="panel-content" id="pattern">
      <div className="panel-header">
        <h2>
          <PretextText 
            text={content.title} 
            font={isMobile ? "500 42px Inter, ui-sans-serif, system-ui, sans-serif" : "500 64px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 42 : 64} 
            letterSpacing={isMobile ? -1.5 : -2.24} 
            delayOffset={0.2}
          />
        </h2>
        <div className="sub">
          <PretextText 
            text={content.subtitle} 
            font={isMobile ? "400 16px Inter, ui-sans-serif, system-ui, sans-serif" : "400 20px Inter, ui-sans-serif, system-ui, sans-serif"} 
            lineHeight={isMobile ? 24 : 29} 
            delayOffset={0.4}
          />
        </div>
      </div>
      <div className="panel-body">
        {content.meta && content.meta.length > 0 && (
          <div className="meta-row" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            {content.meta.map((item, idx) => (
              <div key={idx} className="meta-item">
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="prose" style={{ marginTop: '2rem', marginBottom: '3rem', fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
          <ReactMarkdown>{content.content}</ReactMarkdown>
        </div>

        <Script
          type="module"
          src="https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module"
          strategy="lazyOnload"
        />

        <div className="flash-row" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            Connect your device via USB to flash the firmware directly from your browser.<br />
            Select a pattern to preview it in the 3D simulator.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => useAppStore.getState().setActivePatternId('patternFlowOriginal')}
              style={{ padding: '0.5rem 1rem', background: activePatternId === 'patternFlowOriginal' ? '#000' : '#f0f0f0', color: activePatternId === 'patternFlowOriginal' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Preview: Origin
            </button>
            <button 
              onClick={() => useAppStore.getState().setActivePatternId('patternWaveSaw')}
              style={{ padding: '0.5rem 1rem', background: activePatternId === 'patternWaveSaw' ? '#000' : '#f0f0f0', color: activePatternId === 'patternWaveSaw' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Preview: Wave
            </button>
            <button 
              onClick={() => useAppStore.getState().setActivePatternId('custom')}
              style={{ padding: '0.5rem 1rem', background: activePatternId === 'custom' ? '#000' : '#f0f0f0', color: activePatternId === 'custom' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              Live Editor
            </button>
          </div>

          {activePatternId === 'custom' && (
            <div className="live-editor-container" style={{ marginBottom: '2rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>JavaScript Pattern Editor (ESP32 Parity)</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyCreatePrompt} style={{ padding: '0.4rem 0.8rem', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    1. Copy AI Prompt for Creation
                  </button>
                  <button onClick={handleCopyConvertPrompt} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    2. Copy AI Prompt for C++
                  </button>
                </div>
              </div>
              <Editor
                height="400px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={customJsCode}
                onChange={(val) => setCustomJsCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          )}
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flash-item">
              <EspWebInstallButton manifest="/flash/manifest.json">
                <button slot="activate" className="btn-primary" style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: 500, cursor: 'pointer', border: 'none' }}>
                  Flash Patternflow v1 (All Patterns)
                </button>
                <div slot="unsupported" style={{ marginTop: '0.5rem', fontSize: '12px', color: '#666' }}>
                  Desktop Chrome/Edge only.
                </div>
              </EspWebInstallButton>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '12px', color: '#999' }}>
            * Requires HTTPS environment.
          </div>
        </div>

        {content.cta && (
          <div className="cta-row" style={{ display: 'flex', gap: '1rem', marginTop: '3rem', marginBottom: '10vh' }}>
            {content.cta.primary && (
              <a href={content.cta.primary.href} className="btn-primary" style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>
                {content.cta.primary.label}
              </a>
            )}
            {content.cta.secondary && (
              <a href={content.cta.secondary.href} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', background: '#f5f5f5', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>
                {content.cta.secondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
