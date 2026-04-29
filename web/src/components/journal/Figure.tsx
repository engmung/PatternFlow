import Image from "next/image";

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  bleed?: "body" | "wide" | "full";
  video?: boolean;
  controls?: boolean;
};

export default function Figure({
  src,
  alt,
  caption,
  width = 1400,
  height = 900,
  bleed = "wide",
  video = false,
  controls = false,
}: FigureProps) {
  return (
    <figure className={`journal-figure journal-figure-${bleed}`}>
      {video ? (
        <video
          src={src}
          aria-label={alt}
          autoPlay={!controls}
          muted={!controls}
          loop={!controls}
          playsInline
          controls={controls}
        />
      ) : (
        <Image src={src} alt={alt} width={width} height={height} />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
