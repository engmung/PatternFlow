import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

export interface MetaField {
  label: string;
  value: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface SectionContent {
  title: string;
  subtitle: string;
  meta?: MetaField[];
  status?: string;
  cta?: {
    primary?: CtaLink;
    secondary?: CtaLink;
  };
  content: string;
}

export function getSectionContent(slug: string): SectionContent {
  const fullPath = path.join(contentDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  return {
    ...matterResult.data,
    content: matterResult.content,
  } as SectionContent;
}
