import Link from "next/link";

export default function JournalHeader() {
  return (
    <header className="journal-header">
      <Link className="journal-wordmark" href="/">
        patternflow / journal
      </Link>
      <nav aria-label="Journal navigation">
        <Link href="/">Main</Link>
        <a href="/feed.xml">RSS</a>
      </nav>
    </header>
  );
}
