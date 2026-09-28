import { cleanText, decodeHtmlEntities, normalizeSqlEscapedApostrophes } from './text';
import { parseHttpUrl } from './url';

export type RichSegment =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; url: string };

type RawSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; url: string | null; fallbackUrl: string | null }
  | { kind: 'break' };

const HTML_TAG_PATTERN = /<!--[\s\S]*?-->|<[^>]*>/gi;
const HREF_PATTERN = /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

function hrefFromTag(tag: string): { url: string | null; fallbackUrl: string | null } {
  const match = HREF_PATTERN.exec(tag);
  if (!match) return { url: null, fallbackUrl: null };

  const href = match[1] ?? match[2] ?? match[3];
  if (href === undefined) return { url: null, fallbackUrl: null };

  const decodedHref = decodeHtmlEntities(href).trim();
  return { url: parseHttpUrl(decodedHref), fallbackUrl: decodedHref || null };
}

function collectRawSegments(html: string): RawSegment[] {
  const segments: RawSegment[] = [];
  let outsideText = '';
  let activeLink: {
    text: string;
    url: string | null;
    fallbackUrl: string | null;
  } | null = null;
  let cursor = 0;

  const appendText = (text: string) => {
    if (activeLink !== null) {
      activeLink.text += text;
    } else {
      outsideText += text;
    }
  };

  const flushOutsideText = () => {
    if (outsideText.length > 0) {
      segments.push({ kind: 'text', text: outsideText });
      outsideText = '';
    }
  };

  const appendBreak = () => {
    if (activeLink !== null) {
      activeLink.text += '\n';
      return;
    }

    flushOutsideText();
    segments.push({ kind: 'break' });
  };

  for (const match of html.matchAll(HTML_TAG_PATTERN)) {
    const tag = match[0];
    const tagStart = match.index ?? cursor;
    appendText(html.slice(cursor, tagStart));
    cursor = tagStart + tag.length;

    if (/^<a\b/i.test(tag)) {
      if (activeLink === null) {
        flushOutsideText();
        activeLink = { text: '', ...hrefFromTag(tag) };
      }
    } else if (/^<\/a\s*>/i.test(tag)) {
      if (activeLink !== null) {
        segments.push({ kind: 'link', ...activeLink });
        activeLink = null;
      }
    } else if (/^<br\b[^>]*\/?\s*>/i.test(tag) || /^<\/p\s*>/i.test(tag)) {
      appendBreak();
    }
  }

  appendText(html.slice(cursor));
  if (activeLink !== null) {
    segments.push({ kind: 'link', ...activeLink });
  } else {
    flushOutsideText();
  }

  return segments;
}

function appendTextSegment(segments: RichSegment[], text: string): void {
  if (text.length === 0) return;

  const previous = segments.at(-1);
  if (previous?.kind === 'text') {
    previous.text += text;
  } else {
    segments.push({ kind: 'text', text });
  }
}

function trimSegments(segments: RichSegment[]): RichSegment[] | null {
  while (segments[0]?.kind === 'text') {
    segments[0].text = segments[0].text.replace(/^[\s]+/, '');
    if (segments[0].text.length > 0) break;
    segments.shift();
  }

  while (segments.at(-1)?.kind === 'text') {
    const last = segments.at(-1);
    if (last?.kind !== 'text') break;
    last.text = last.text.replace(/[\s]+$/, '');
    if (last.text.length > 0) break;
    segments.pop();
  }

  return segments.length > 0 ? segments : null;
}

export function parseRichText(html: string | null): RichSegment[] | null {
  if (typeof html !== 'string' || html.trim().length === 0) return null;

  const rawSegments = collectRawSegments(html);
  const segments: RichSegment[] = [];
  let hasContent = false;
  let pendingSpace = false;

  for (const rawSegment of rawSegments) {
    if (rawSegment.kind === 'break') {
      const previous = segments.at(-1);
      if (previous?.kind === 'text') {
        previous.text = previous.text.replace(/[ ]+$/, '') + '\n';
      } else {
        appendTextSegment(segments, '\n');
      }
      hasContent = true;
      pendingSpace = false;
      continue;
    }

    const decoded = normalizeSqlEscapedApostrophes(decodeHtmlEntities(rawSegment.text));
    const hasLeadingWhitespace = /^\s/.test(decoded);
    const hasTrailingWhitespace = /\s$/.test(decoded);
    const text =
      cleanText(decoded) ?? (rawSegment.kind === 'link' ? cleanText(rawSegment.fallbackUrl) : null);

    if (text === null) {
      if (hasTrailingWhitespace || hasLeadingWhitespace) pendingSpace ||= hasContent;
      continue;
    }

    const shouldPrependSpace = hasContent && (pendingSpace || hasLeadingWhitespace);

    if (rawSegment.kind === 'link' && rawSegment.url !== null) {
      if (shouldPrependSpace) {
        const previous = segments.at(-1);
        if (previous?.kind === 'text') previous.text += ' ';
        else appendTextSegment(segments, ' ');
      }
      segments.push({ kind: 'link', text, url: rawSegment.url });
    } else {
      appendTextSegment(segments, `${shouldPrependSpace ? ' ' : ''}${text}`);
    }

    hasContent = true;
    pendingSpace = hasTrailingWhitespace;
  }

  return trimSegments(segments);
}
