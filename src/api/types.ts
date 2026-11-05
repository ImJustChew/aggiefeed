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

/**
 * The locations feed is untrusted JSON. Properties are optional here so the
 * parser can validate the response at runtime instead of trusting the API.
 */
export interface ApiLocationCategory {
  id?: string;
  name?: string;
  subcategories?: { id?: string; name?: string }[];
}

export interface ApiLocation {
  id?: string;
  kind?: 'building' | 'poi' | 'parking';
  name?: string;
  categoryId?: string;
  subcategoryId?: string;
  groupName?: string;
  campus?: string;
  lat?: number | null;
  lng?: number | null;
  description?: string;
  url?: string;
  imageUrl?: string;
  buildingId?: string;
  caan?: string;
  departments?: string[];
  permits?: string[];
  aliases?: string[];
  tags?: string[];
  searchable?: boolean;
}
