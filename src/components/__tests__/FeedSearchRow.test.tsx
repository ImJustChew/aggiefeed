import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import { FeedHeader } from '../FeedHeader';

function SearchHeaderHarness({
  onQueryChange = jest.fn(),
}: {
  onQueryChange?: (value: string) => void;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const scrollY = useSharedValue(0);
  const collapseDistance = useSharedValue(0);

  return (
    <FeedHeader
      isSearchOpen={isSearchOpen}
      isSearching={false}
      collapseDistance={collapseDistance}
      onCloseSearch={() => {
        setQuery('');
        setIsSearchOpen(false);
      }}
      onOpenSearch={() => setIsSearchOpen(true)}
      onQueryChange={(value) => {
        setQuery(value);
        onQueryChange(value);
      }}
      onRowLayout={() => {}}
      query={query}
      scrollY={scrollY}
    />
  );
}

describe('FeedHeader search controls', () => {
  it('reveals an accessible search field when Search stories is pressed', async () => {
    await render(<SearchHeaderHarness />);

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Search stories' }));

    expect(screen.getByPlaceholderText('Search campus stories')).toHaveAccessibleName(
      'Search stories',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
  });

  it('sends typed queries and clears them from the search row', async () => {
    const onQueryChange = jest.fn();
    await render(<SearchHeaderHarness onQueryChange={onQueryChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Search stories' }));
    await user.type(screen.getByPlaceholderText('Search campus stories'), 'career & jobs');

    expect(onQueryChange).toHaveBeenLastCalledWith('career & jobs');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByPlaceholderText('Search campus stories')).toHaveDisplayValue('');
    expect(onQueryChange).toHaveBeenLastCalledWith('');
  });

  it('closes search and clears the query when Cancel is pressed', async () => {
    const onQueryChange = jest.fn();
    await render(<SearchHeaderHarness onQueryChange={onQueryChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Search stories' }));
    await user.type(screen.getByPlaceholderText('Search campus stories'), 'library');
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByPlaceholderText('Search campus stories')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Search stories' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Search stories' }));
    expect(screen.getByPlaceholderText('Search campus stories')).toHaveDisplayValue('');
  });
});
