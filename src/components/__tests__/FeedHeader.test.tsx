import { useEffect } from 'react';
import { render, screen } from '@testing-library/react-native';
import { getAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { FeedHeader } from '../FeedHeader';

function HeaderHarness({ scroll }: { scroll: number }) {
  const scrollY = useSharedValue(0);
  const collapseDistance = useSharedValue(100);

  useEffect(() => {
    scrollY.set(scroll);
  }, [scroll, scrollY]);

  return <FeedHeader collapseDistance={collapseDistance} scrollY={scrollY} />;
}

describe('FeedHeader', () => {
  it('scales the wordmark as the shared scroll offset advances', async () => {
    const rendered = await render(<HeaderHarness scroll={0} />);

    expect(getAnimatedStyle(screen.getByTestId('feed-header-title'))).toMatchObject({
      transform: [{ scale: 1 }],
    });

    await rendered.rerender(<HeaderHarness scroll={100} />);

    expect(getAnimatedStyle(screen.getByTestId('feed-header-title'))).toMatchObject({
      transform: [{ scale: 0.65 }],
    });
  });
});
