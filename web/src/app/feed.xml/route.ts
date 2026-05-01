import { Feed } from "feed";
import { getAllJournalPosts } from "@/lib/journal";

const siteUrl = "https://patternflow.work";

export function GET() {
  const posts = getAllJournalPosts();
  const feed = new Feed({
    title: "Patternflow / Journal",
    description: "Writing and notes from Patternflow.",
    id: `${siteUrl}/journal`,
    link: `${siteUrl}/journal`,
    language: "en",
    feedLinks: {
      rss2: `${siteUrl}/feed.xml`,
    },
    copyright: "MIT for code, CC-BY-SA 4.0 for hardware designs.",
  });

  posts.forEach((post) => {
    const url = `${siteUrl}/journal/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.excerpt,
      date: new Date(post.date),
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
