import Hero from "@/components/sections/Hero";
import Deck from "@/components/sections/Deck";
import Footer from "@/components/layout/Footer";
import HeroScene from "@/components/3d/HeroScene";

export default function Home() {
  return (
    <div className="app-layout">
      <div className="viewer-panel">
        <HeroScene />
      </div>
      <div className="content-panel">
        <Hero />
        <Deck />
        <Footer />
      </div>
    </div>
  );
}
