export const CLUSTER_COLOR = '#022851';
export const SELECTED_PIN_COLOR = '#FFBF00';

const CATEGORY_PIN_COLORS: Record<string, string> = {
  'academic-administration': '#022851',
  'student-staff-resources': '#0047BA',
  support: '#00B2E3',
  accessibility: '#008EAA',
  'housing-dining': '#F18A00',
  'places-of-interest': '#00C4B3',
  'public-art': '#C6007E',
  recreation: '#3DAE2B',
  'athletics-recreation': '#C10230',
  'transportation-parking': '#76236C',
  other: '#7F7F7F',
};

export function categoryPinColor(categoryId: string): string {
  return CATEGORY_PIN_COLORS[categoryId] ?? CLUSTER_COLOR;
}
