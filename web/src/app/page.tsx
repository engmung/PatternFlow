import RightPanel from "@/components/sections/RightPanel";
import HeroScene from "@/components/3d/HeroScene";
import { getSectionContent } from "@/lib/content";

export default function Home() {
  const buildContent = getSectionContent('build');
  const patternContent = getSectionContent('pattern');
  const insideContent = getSectionContent('inside');

  return (
    <div className="app-layout">
      <div className="viewer-panel">
        <HeroScene />
      </div>
      <RightPanel 
        buildContent={buildContent} 
        patternContent={patternContent} 
        insideContent={insideContent} 
      />
    </div>
  );
}
