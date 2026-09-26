import { parseRichText } from '@/domain/richText';

describe('parseRichText', () => {
  it('parses anchors with extra attributes and decodes link text and href entities', () => {
    expect(
      parseRichText(
        '<a id="story" variant="primary" href="https://example.com/?a=1&amp;b=2">Read &amp; learn</a>',
      ),
    ).toEqual([{ kind: 'link', text: 'Read & learn', url: 'https://example.com/?a=1&b=2' }]);
  });

  it('keeps unsafe and non-absolute hrefs as plain text', () => {
    expect(
      parseRichText(
        '<a href="javascript:alert(1)">Run</a> <a href="mailto:test@example.com">Email</a> <a href="/story">Story</a>',
      ),
    ).toEqual([{ kind: 'text', text: 'Run Email Story' }]);
  });

  it('turns br and paragraph endings into line breaks', () => {
    expect(parseRichText('Before<br>Middle</p>After')).toEqual([
      { kind: 'text', text: 'Before\nMiddle\nAfter' },
    ]);
  });

  it('uses a URL for an empty link label', () => {
    expect(parseRichText('<a href="https://example.com/story"> </a>')).toEqual([
      { kind: 'link', text: 'https://example.com/story', url: 'https://example.com/story' },
    ]);
  });

  it('returns null for empty or blank input and preserves cleaned text-only input', () => {
    expect(parseRichText(null)).toBeNull();
    expect(parseRichText(' <p> \n </p> ')).toBeNull();
    expect(parseRichText(" You''ll learn &amp; grow ")).toEqual([
      { kind: 'text', text: "You'll learn & grow" },
    ]);
  });
});
