export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Turn heading text into a stable URL fragment. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Pull the h2 and h3 headings out of MDX/Markdown source so we can render an
 * "on this page" list. Skips anything inside fenced code blocks.
 */
export function extractHeadings(source: string): Heading[] {
  const lines = source.split('\n');
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(##|###)\s+(.*)$/.exec(line);
    if (match) {
      const level = match[1].length as 2 | 3;
      const text = match[2].replace(/[#*`]/g, '').trim();
      if (text) headings.push({ level, text, id: slugify(text) });
    }
  }

  return headings;
}
