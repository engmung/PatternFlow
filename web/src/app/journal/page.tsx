import type { Metadata } from "next";
import { headers } from "next/headers";
import JournalIndex from "@/components/journal/JournalIndex";
import { getAllJournalPosts, resolveJournalLang } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal / Patternflow",
  description: "Writing and notes from Patternflow.",
};

type JournalPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { lang: langParam } = await searchParams;
  const requestHeaders = await headers();
  const lang = resolveJournalLang(langParam, requestHeaders.get("accept-language"));
  const posts = getAllJournalPosts({ lang });

  return <JournalIndex posts={posts} lang={lang} />;
}
