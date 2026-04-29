import Link from "next/link";
import type { ReactNode } from "react";
import { formatJournalDate, type JournalLang, type JournalPost } from "@/lib/journal";
import LanguageSwitch from "./LanguageSwitch";

type ArticleLayoutProps = {
  post: JournalPost;
  lang: JournalLang;
  previous: JournalPost | null;
  next: JournalPost | null;
  children: ReactNode;
};

export default function ArticleLayout({
  post,
  lang,
  previous,
  next,
  children,
}: ArticleLayoutProps) {
  const langQuery = `?lang=${lang}`;

  return (
    <article className="journal-article">
      <LanguageSwitch lang={lang} slug={post.slug} />
      <div className="journal-back-link">
        <Link href={`/journal${langQuery}`}>All writing</Link>
      </div>

      <header className="journal-article-header">
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div className="journal-dateline">
          <span>{formatJournalDate(post.date, lang)}</span>
          <span>{post.series ?? "Patternflow"}</span>
          <span>{post.readingTime}</span>
        </div>
      </header>

      <figure className="journal-hero-cover">
        <div className="journal-cover-slot">
          {post.cover ? (
            <img src={post.cover} alt="" />
          ) : (
            <span>Cover / Patternflow</span>
          )}
        </div>
        <figcaption>Cover / Patternflow</figcaption>
      </figure>

      <div className="journal-reading">{children}</div>

      <div className="journal-end-mark">
        <span />
        <span>End</span>
        <span />
      </div>

      <footer className="journal-article-footer">
        <Link href={`/journal${langQuery}`}>All writing</Link>
        <div>
          {previous && (
            <Link href={`/journal/${previous.slug}${langQuery}`}>Previous</Link>
          )}
          {next && <Link href={`/journal/${next.slug}${langQuery}`}>Next</Link>}
        </div>
      </footer>
    </article>
  );
}
