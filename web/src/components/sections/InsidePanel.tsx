import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SectionContent } from '@/lib/content';
import styles from './InsidePanel.module.css';

interface InsidePanelProps {
  content: SectionContent;
}

const Globe = dynamic(() => import('./InsideGlobe/Globe'), { ssr: false });

const INSIDE_COLORS = {
  accent: '#FFD466',
};

const redditQuotes = [
  {
    quote: "Remember some years ago Teenage Engineering did a simple LED matrix music visualizer thing with IKEA and it was super lame. Your thing is much closer to what it should have been.",
    user: 'u/frumperino',
    subreddit: 'r/arduino',
    upvotes: 49,
    url: 'https://www.reddit.com/r/arduino/comments/1so9er5/comment/ogrmgsz/',
  },
  {
    quote: 'That is the coolest most useless thing on the planet.',
    user: 'u/NeedleworkerFew5205',
    subreddit: 'r/arduino',
    upvotes: 27,
    url: 'https://www.reddit.com/r/arduino/comments/1so9er5/comment/ogrts7f/',
  },
  {
    quote: "Out of 100's of projects in a similar category, yours is the first that I must freaking have.",
    user: 'u/LegendOfVlad',
    subreddit: 'r/arduino',
    upvotes: 2,
    url: 'https://www.reddit.com/r/arduino/comments/1szettd/comment/oj2tyqe/',
  },
  {
    quote: 'This is one of those ultra-niche things I just love.',
    user: 'u/zebadrabbit',
    subreddit: 'r/arduino',
    upvotes: 21,
    url: 'https://www.reddit.com/r/arduino/comments/1szettd/comment/oj1dxgy/',
  },
  {
    quote: 'More love to this post please!!!',
    user: 'u/ShamanOnTech',
    subreddit: 'r/arduino',
    upvotes: 61,
    url: 'https://www.reddit.com/r/arduino/comments/1szettd/comment/oj18y7l/',
  },
  {
    quote: "So uh... so when are you selling this? Can't wait.",
    user: 'u/C4TT4',
    subreddit: 'r/somethingimade',
    upvotes: 8,
    url: 'https://www.reddit.com/r/somethingimade/comments/1so9jh6/comment/ogrom84/',
  },
  {
    quote: "Another up is not enough. I'm gonna try to build one.",
    user: 'u/Sandisbad',
    subreddit: 'r/arduino',
    upvotes: 5,
    url: 'https://www.reddit.com/r/arduino/comments/1szettd/comment/oj2cqaf/',
  },
  {
    quote: "Incredibly cool. I'd love to have this in my home!",
    user: 'u/SawdustedPatios',
    subreddit: 'r/somethingimade',
    upvotes: 3,
    url: 'https://www.reddit.com/r/somethingimade/comments/1so9jh6/comment/ogrjyms/',
  },
];

function RedditCommentBand() {
  const items = [...redditQuotes, ...redditQuotes];

  return (
    <div
      className={styles.commentBand}
      aria-label="Reddit comments"
    >
      <div className={styles.commentKicker}>Reddit response</div>
      <div className={styles.commentTrack}>
        {items.map((item, index) => (
          <a
            key={`${item.url}-${index}`}
            className={styles.commentCard}
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            <p>&ldquo;{item.quote}&rdquo;</p>
            <div className={styles.commentMeta}>
              <span>{item.user}</span>
              <span>{item.subreddit}</span>
              <span className={styles.upvotes}>&uarr; {item.upvotes}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function InsidePanel({ content }: InsidePanelProps) {
  return (
    <div className={`panel-content ${styles.panel}`} id="inside" aria-label={content.title}>
      <div className={`panel-header ${styles.panelHeader}`}>
        <h2>Origin &amp; Open</h2>
        <p className="sub">
          Everything about Patternflow
        </p>
      </div>

      <div className={`panel-body ${styles.body}`}>
        <div className={styles.intro} style={{ '--inside-accent': INSIDE_COLORS.accent } as CSSProperties}>
          <div className={styles.stats} aria-label="Patternflow Reddit response">
            <span><strong>150K</strong> combined views</span>
            <span><strong>3.5K</strong> upvotes</span>
            <span><strong>2</strong> r/arduino posts</span>
          </div>
          <p>Two posts on r/arduino. 150K combined views. 3.5K upvotes.</p>
          <p>
            Hundreds of comments &mdash; most asking when it would be available,
            where to find the files, how to build their own.
          </p>
        </div>

        <RedditCommentBand />

        <div className={styles.story}>
          <p>
            PCBway reached out right after the first post. Their timing made the
            first PCB possible just when Patternflow needed one.
          </p>
          <p>
            The community wasn&apos;t asking for a product. They were asking for
            the files. So Patternflow was opened &mdash; schematics, firmware,
            case, build guide, all of it in the repository. Hardware designs are
            shared under CC-BY-SA 4.0; firmware and web code are MIT.
          </p>
          <p>
            The encouragement in the comments is the reason it stays open. Not
            a finished object but a starting point: build, modify, fork, share.
          </p>
          <p>
            A reinterpretation of Nam June Paik&apos;s Participation TV (1963).
            Paik brought participation into art. Patternflow tries to carry that
            gesture further, from participation into creation.
          </p>
          <p>
            More of the story &mdash; the failed prints, broken potentiometers,
            first PCB, and the 30-day build process &mdash; is documented in the
            journal.
          </p>
          <Link className={styles.journalLink} href="/journal">
            -&gt; Read the journal &middot; patternflow.work/journal
          </Link>
        </div>

        <div className={styles.globeShell}>
          <Globe />
        </div>

        <p className={styles.tagline}>
          The first one was made in Seoul, April 2026.
          <br />
          The next one could be anywhere.
        </p>

        <div className={styles.shareCallout}>
          <p>
            If you build your own, we want to see it. Share photos on our{' '}
            <a href="https://discord.gg/Vr9QtsxeTk" target="_blank" rel="noreferrer">Discord</a>
            {' '}or open a{' '}
            <a href="https://github.com/engmung/PatternFlow/issues" target="_blank" rel="noreferrer">GitHub issue</a>
            . We will add your build to the map.
          </p>
        </div>
      </div>
    </div>
  );
}
