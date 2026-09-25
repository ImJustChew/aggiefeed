/**
 * The public feed is untrusted JSON, so every field the app reads is optional.
 */
export interface ApiActivity {
  id?: string;
  _id?: string;
  title?: string;
  published?: string;
  actor?: {
    displayName?: string;
  };
  object?: {
    objectType?: string;
    content?: string;
    ucdEdusModel?: {
      url?: string;
      event?: {
        startDate?: string;
        endDate?: string;
        location?: string;
        isAllDay?: boolean;
        hasStartTime?: boolean;
      };
    };
  };
}
