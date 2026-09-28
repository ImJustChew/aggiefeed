import type { ApiActivity } from '@/api/types';

import type { Activity, ActivityEvent } from './activity';
import { parseDate } from './date';
import { parseRichText } from './richText';
import { cleanText, htmlToPlainText } from './text';
import { parseHttpUrl } from './url';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nonBlankString(value: unknown): string | null {
  const string = stringValue(value);
  return string !== null && string.trim().length > 0 ? string : null;
}

function cleanLocation(value: string | null): string | null {
  if (value === null) return null;

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}

function toEvent(model: Record<string, unknown> | null): ActivityEvent | null {
  const event = model !== null && isRecord(model.event) ? model.event : null;
  if (event === null) return null;

  return {
    start: parseDate(event.startDate),
    end: parseDate(event.endDate),
    location: cleanLocation(stringValue(event.location)),
    isAllDay: event.isAllDay === true || event.hasStartTime === false,
  };
}

function toActivity(raw: ApiActivity, index: number, skip: number): Activity {
  const actor = isRecord(raw.actor) ? raw.actor : null;
  const object = isRecord(raw.object) ? raw.object : null;
  const model = object !== null && isRecord(object.ucdEdusModel) ? object.ucdEdusModel : null;

  return {
    id: nonBlankString(raw.id) ?? nonBlankString(raw._id) ?? `activity-${skip + index}`,
    title: cleanText(stringValue(raw.title)),
    source: cleanText(actor === null ? null : stringValue(actor.displayName)),
    objectType: cleanText(object === null ? null : stringValue(object.objectType)),
    published: parseDate(raw.published),
    summary: htmlToPlainText(object === null ? null : stringValue(object.content)),
    summarySegments: parseRichText(object === null ? null : stringValue(object.content)),
    url: parseHttpUrl(model === null ? null : stringValue(model.url)),
    event: toEvent(model),
  };
}

export class InvalidFeedError extends Error {
  constructor() {
    super('The feed response was not in the expected format.');
    this.name = 'InvalidFeedError';
  }
}

/** Validates the top-level response and maps only object entries. */
export function parseActivities(payload: unknown, skip = 0): Activity[] {
  if (!Array.isArray(payload)) throw new InvalidFeedError();

  return payload.flatMap((item: unknown, index) => {
    if (!isRecord(item)) return [];
    return [toActivity(item as ApiActivity, index, skip)];
  });
}
