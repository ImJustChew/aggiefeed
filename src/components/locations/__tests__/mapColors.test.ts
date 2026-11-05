import { categoryPinColor, CLUSTER_COLOR } from '../mapColors';

describe('categoryPinColor', () => {
  it('falls back to Aggie Blue for unknown categories', () => {
    expect(categoryPinColor('unknown-category')).toBe(CLUSTER_COLOR);
  });
});
