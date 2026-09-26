import { act, renderHook } from '@testing-library/react-native';
import type { LayoutChangeEvent } from 'react-native';

import { useCollapsingHeader } from '../useCollapsingHeader';

function layoutEvent(height: number): LayoutChangeEvent {
  return {
    nativeEvent: {
      layout: { height, width: 320, x: 0, y: 0 },
    },
  } as LayoutChangeEvent;
}

describe('useCollapsingHeader', () => {
  it('measures positive intrinsic layouts and ignores zero layouts', async () => {
    const { result } = await renderHook(() => useCollapsingHeader());

    await act(async () => {
      result.current.handleHeaderLayout(layoutEvent(0));
      result.current.handleControlsLayout(layoutEvent(0));
    });
    expect(result.current.measuredHeaderHeight).toBe(0);
    expect(result.current.measuredControlsHeight).toBe(0);

    await act(async () => {
      result.current.handleHeaderLayout(layoutEvent(140));
      result.current.handleControlsLayout(layoutEvent(48));
    });
    expect(result.current.measuredHeaderHeight).toBe(140);
    expect(result.current.measuredControlsHeight).toBe(48);

    await act(async () => {
      result.current.handleHeaderLayout(layoutEvent(180));
      result.current.handleControlsLayout(layoutEvent(0));
    });
    expect(result.current.measuredHeaderHeight).toBe(140);
    expect(result.current.measuredControlsHeight).toBe(48);
  });
});
