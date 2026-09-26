import type { RichSegment } from './richText';

export interface ActivityEvent {
  start: Date | null;
  end: Date | null;
  location: string | null;
  isAllDay: boolean;
}

/** Normalized activity data for the UI; null means a usable value was unavailable. */
export interface Activity {
  id: string;
  title: string | null;
  source: string | null;
  objectType: string | null;
  published: Date | null;
  summary: string | null;
  summarySegments: RichSegment[] | null;
  url: string | null;
  event: ActivityEvent | null;
}

export type ActivityFilter = 'all' | 'news' | 'events';

export function isEvent(activity: Activity): boolean {
  return activity.event !== null || activity.objectType?.toLowerCase() === 'event';
}

export function filterActivities(activities: Activity[], filter: ActivityFilter): Activity[] {
  if (filter === 'all') return activities;

  return activities.filter((activity) =>
    filter === 'events' ? isEvent(activity) : !isEvent(activity),
  );
}

export function flattenActivities(pages: Activity[][]): Activity[] {
  const seen = new Set<string>();
  const flattened: Activity[] = [];

  for (const page of pages) {
    for (const activity of page) {
      if (seen.has(activity.id)) continue;
      seen.add(activity.id);
      flattened.push(activity);
    }
  }

  return flattened;
}
