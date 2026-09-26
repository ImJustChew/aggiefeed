import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('updates only after the requested delay', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 350),
      { initialProps: { value: 'initial' } },
    );

    await rerender({ value: 'next' });
    expect(result.current).toBe('initial');

    await act(async () => {
      jest.advanceTimersByTime(349);
      await Promise.resolve();
    });
    expect(result.current).toBe('initial');

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(result.current).toBe('next');
  });

  it('uses the latest value when changes happen during the delay', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 350),
      { initialProps: { value: 'initial' } },
    );

    await rerender({ value: 'first' });
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    await rerender({ value: 'latest' });
    await act(async () => {
      jest.advanceTimersByTime(349);
      await Promise.resolve();
    });
    expect(result.current).toBe('initial');

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(result.current).toBe('latest');
  });
});
