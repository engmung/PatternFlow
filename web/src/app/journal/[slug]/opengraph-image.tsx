import { ImageResponse } from "next/og";
import { getAllJournalPosts } from "@/lib/journal";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OpenGraphImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { slug } = await params;
  const post = getAllJournalPosts({ includeDrafts: true }).find(
    (item) => item.slug === slug,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F4EFE6",
          color: "#141414",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#6B655A",
          }}
        >
          <span>patternflow / journal</span>
          <span>{post?.date ?? ""}</span>
        </div>
        <div
          style={{
            fontSize: 74,
            lineHeight: 1.02,
            letterSpacing: -3,
            maxWidth: 930,
          }}
        >
          {post?.title ?? "Patternflow Journal"}
        </div>
        <div
          style={{
            width: "100%",
            height: 2,
            background: "#141414",
          }}
        />
      </div>
    ),
    size,
  );
}
