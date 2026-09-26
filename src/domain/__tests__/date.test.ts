import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatShortDate,
  parseDate,
} from '@/domain/date';

describe('date helpers', () => {
  const now = new Date('2026-09-25T12:00:00Z');

  it('parses valid dates and turns invalid values into null', () => {
    expect(parseDate('2026-09-25T12:00:00Z')).toEqual(now);
    expect(parseDate('not a date')).toBeNull();
    expect(parseDate(42)).toBeNull();
  });

  it('formats absolute dates deterministically', () => {
    const date = new Date('2026-09-24T22:00:31Z');

    expect(formatDate(date)).toBe('Thu, Sep 24, 2026');
    expect(formatDateTime(date)).toBe('Thu, Sep 24, 2026 · 10:00 PM');
    expect(formatShortDate(date)).toBe('Thu, Sep 24');
  });

  it('uses relative formatting for recent dates and an absolute date otherwise', () => {
    expect(formatRelative(new Date('2026-09-25T11:59:30Z'), now)).toBe('Just now');
    expect(formatRelative(new Date('2026-09-25T11:55:00Z'), now)).toBe('5m ago');
    expect(formatRelative(new Date('2026-09-25T10:00:00Z'), now)).toBe('2h ago');
    expect(formatRelative(new Date('2026-09-23T12:00:00Z'), now)).toBe('2d ago');
    expect(formatRelative(new Date('2026-09-17T12:00:00Z'), now)).toBe('Sep 17');
  });
});
