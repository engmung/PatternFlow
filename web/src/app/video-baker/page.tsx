import type { Metadata } from "next";
import VideoBakerClient from "./VideoBakerClient";

export const metadata: Metadata = {
  title: "Video Baker / Patternflow",
  description: "Bake video clips into 128×64 LED loops for Patternflow hardware.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VideoBakerPage() {
  return <VideoBakerClient />;
}
