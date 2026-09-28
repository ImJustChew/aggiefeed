const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
};

function decodeEntity(match: string, entity: string): string {
  if (entity.startsWith('#')) {
    const isHex = entity[1]?.toLowerCase() === 'x';
    const digits = entity.slice(isHex ? 2 : 1);
    const codePoint = Number.parseInt(digits, isHex ? 16 : 10);
    const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff;

    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff && !isSurrogate
      ? String.fromCodePoint(codePoint)
      : match;
  }

  return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, decodeEntity);
}

// Upstream content carries SQL-escaped apostrophes like "You''ll".
export function normalizeSqlEscapedApostrophes(input: string): string {
  return input.replace(/(\w)''(\w)/g, "$1'$2");
}

/** Decodes feed text and normalizes the blank values that the UI cannot render. */
export function cleanText(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;

  const text = normalizeSqlEscapedApostrophes(decodeHtmlEntities(input))
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 0 ? text : null;
}

export function htmlToPlainText(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;

  const withoutMarkup = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?\s*>|<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '');

  return cleanText(withoutMarkup);
}
