import Link from "next/link";
import type { JournalLang } from "@/lib/journal";

type LanguageSwitchProps = {
  lang: JournalLang;
  slug?: string;
};

export default function LanguageSwitch({ lang, slug }: LanguageSwitchProps) {
  const basePath = slug ? `/journal/${slug}` : "/journal";

  return (
    <nav className="journal-lang-switch" aria-label="Journal language">
      <Link
        className={lang === "ko" ? "active" : ""}
        href={`${basePath}?lang=ko`}
      >
        ko
      </Link>
      <Link
        className={lang === "en" ? "active" : ""}
        href={`${basePath}?lang=en`}
      >
        en
      </Link>
    </nav>
  );
}
