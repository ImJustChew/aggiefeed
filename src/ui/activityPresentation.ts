import type { Activity } from '@/domain/activity';
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelative,
  formatShortDate,
} from '@/domain/date';

export const fallbackCopy = {
  title: 'Untitled',
  source: 'Unknown source',
  date: 'Date unavailable',
  summary: 'No summary available.',
  type: 'Unknown type',
  location: 'Location unavailable',
};

function capitalizeWords(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

export function displayTitle(activity: Activity): string {
  return activity.title ?? fallbackCopy.title;
}

export function displaySource(activity: Activity): string {
  return activity.source ?? fallbackCopy.source;
}

function displayType(objectType: string | null): string {
  if (objectType === null) return fallbackCopy.type;

  switch (objectType.toLowerCase()) {
    case 'notification':
      return 'News';
    case 'event':
      return 'Event';
    default:
      return capitalizeWords(objectType) || fallbackCopy.type;
  }
}

export function displayActivityType(activity: Activity): string {
  return isEvent(activity) ? 'Event' : displayType(activity.objectType);
}

export function displayObjectType(activity: Activity): string {
  if (activity.objectType === null) return fallbackCopy.type;

  return capitalizeWords(activity.objectType) || fallbackCopy.type;
}

export function displayPublished(published: Date | null): string {
  return published === null ? fallbackCopy.date : formatDateTime(published);
}

export function displayRelativePublished(published: Date | null, now = new Date()): string {
  return published === null ? fallbackCopy.date : formatRelative(published, now);
}

export function displayEventStart(activity: Activity): string {
  const start = activity.event?.start ?? null;
  return start === null ? fallbackCopy.date : formatShortDate(start);
}

export function displayEventWhen(activity: Activity): string {
  const event = activity.event;
  if (event === null || event.start === null) return fallbackCopy.date;
  if (event.isAllDay || event.end === null) return formatDate(event.start);

  return formatDateRange(event.start, event.end);
}

export function displayEventLocation(activity: Activity): string {
  return activity.event?.location ?? fallbackCopy.location;
}

export function formatFeedDate(date = new Date()): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
}

export function isEvent(activity: Activity): boolean {
  return activity.event !== null || activity.objectType?.toLowerCase() === 'event';
}
