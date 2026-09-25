import { cleanText, decodeHtmlEntities, htmlToPlainText } from '@/domain/text';

describe('text helpers', () => {
  it('decodes numeric, hexadecimal, and named entities while preserving unknown ones', () => {
    expect(decodeHtmlEntities('&#8216; &#x2019; &mdash; &amp; &mystery;')).toBe(
      '‘ ’ — & &mystery;',
    );
  });

  it('strips HTML, fixes SQL-escaped apostrophes, and collapses whitespace', () => {
    expect(htmlToPlainText(' <p>You\'\'ll visit <a href="/news">our site</a>.</p> ')).toBe(
      "You'll visit our site.",
    );
  });

  it('returns null for blank text', () => {
    expect(cleanText(' \n\t ')).toBeNull();
    expect(htmlToPlainText('<p> </p>')).toBeNull();
  });
});
