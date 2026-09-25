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
  url: string | null;
  event: ActivityEvent | null;
}
