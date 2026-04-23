import RightPanel from "@/components/sections/RightPanel";
import HeroScene from "@/components/3d/HeroScene";

export default function Home() {
  return (
    <div className="app-layout">
      <div className="viewer-panel">
        <HeroScene />
      </div>
      <RightPanel />
    </div>
  );
}
