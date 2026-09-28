import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import type { Activity, ActivityFilter } from '@/domain/activity';
import type { FeedState } from '@/hooks/useActivities';

import { FeedScreen, type FeedPagination } from '../FeedScreen';

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function TestSafeAreaProvider({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={testMetrics}>{children}</SafeAreaProvider>;
}

function makeActivity(id = 'story-1'): Activity {
  return {
    id,
    title: 'Campus story',
    source: 'Campus source',
    objectType: 'notification',
    published: null,
    summary: 'A story summary.',
    summarySegments: [{ kind: 'text', text: 'A story summary.' }],
    url: null,
    event: null,
  };
}

type FeedControlProps = {
  isSearchOpen: boolean;
  isSearching: boolean;
  query: string;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  filter: ActivityFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: ActivityFilter) => void;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onClearSearch: () => void;
  onShowAll: () => void;
};

function makeFeedControlProps(overrides: Partial<FeedControlProps> = {}): FeedControlProps {
  return {
    isSearchOpen: false,
    isSearching: false,
    query: '',
    onOpenSearch: jest.fn(),
    onCloseSearch: jest.fn(),
    filter: 'all',
    onQueryChange: jest.fn(),
    onFilterChange: jest.fn(),
    onLoadMore: () => Promise.resolve(),
    hasMore: false,
    isLoadingMore: false,
    loadMoreError: null,
    onClearSearch: jest.fn(),
    onShowAll: jest.fn(),
    ...overrides,
  };
}

function makeFeedScreenProps(overrides: Partial<FeedControlProps> = {}) {
  const props = makeFeedControlProps(overrides);
  const pagination: FeedPagination = {
    hasMore: props.hasMore,
    isLoadingMore: props.isLoadingMore,
    loadMoreError: props.loadMoreError,
    onLoadMore: props.onLoadMore,
  };

  return {
    filter: props.filter,
    onFilterChange: props.onFilterChange,
    onShowAll: props.onShowAll,
    search: {
      query: props.query,
      isOpen: props.isSearchOpen,
      isSearching: props.isSearching,
      onOpen: props.onOpenSearch,
      onClose: props.onCloseSearch,
      onQueryChange: props.onQueryChange,
      onClear: props.onClearSearch,
    },
    pagination,
  };
}

function renderFeed(
  state: FeedState,
  onRefresh = jest.fn(),
  onPressActivity = jest.fn(),
  options: Partial<FeedControlProps> = {},
) {
  const props = makeFeedScreenProps(options);

  return render(
    <FeedScreen
      state={state}
      isRefreshing={false}
      onRefresh={onRefresh}
      onPressActivity={onPressActivity}
      {...props}
    />,
    { wrapper: TestSafeAreaProvider },
  );
}

describe('FeedScreen', () => {
  it('shows loading state', async () => {
    await renderFeed({ status: 'loading' });
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByText('Loading stories')).toBeOnTheScreen();
  });

  it('shows error state and retries', async () => {
    const onRefresh = jest.fn();
    await renderFeed({ status: 'error', message: 'Network unavailable.' }, onRefresh);

    expect(screen.getByText('Network unavailable.')).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows empty state with a refresh action', async () => {
    const onRefresh = jest.fn();
    await renderFeed(
      { status: 'empty', query: '', filter: 'all', reason: 'feed-empty' },
      onRefresh,
    );
    expect(screen.getByText('No stories yet')).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders stories and sends the selected id to its callback', async () => {
    const onPressActivity = jest.fn();
    await renderFeed(
      {
        status: 'ready',
        activities: [makeActivity()],
        fetchedAt: new Date('2026-09-25T12:00:00Z'),
      },
      jest.fn(),
      onPressActivity,
    );

    expect(screen.getByText('Campus story')).toBeOnTheScreen();
    expect(screen.getByText('Campus source · Date unavailable')).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Campus story. Campus source' }));
    expect(onPressActivity).toHaveBeenCalledWith('story-1');
  });

  it('clears a non-empty search from the search field', async () => {
    const onClearSearch = jest.fn();
    await renderFeed({ status: 'loading' }, jest.fn(), jest.fn(), {
      isSearchOpen: true,
      query: 'library',
      onClearSearch,
    });

    expect(screen.getByDisplayValue('library')).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('opens search from the wordmark row and shows the editable input', async () => {
    const onOpenSearch = jest.fn();
    const rendered = await renderFeed({ status: 'loading' }, jest.fn(), jest.fn(), {
      onOpenSearch,
    });

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Search stories' }));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);

    await rendered.rerender(
      <FeedScreen
        state={{ status: 'loading' }}
        isRefreshing={false}
        onRefresh={jest.fn()}
        onPressActivity={jest.fn()}
        {...makeFeedScreenProps({ isSearchOpen: true })}
      />,
    );

    expect(screen.getByPlaceholderText('Search campus stories')).toHaveAccessibleName(
      'Search stories',
    );
    expect(screen.getByPlaceholderText('Search campus stories')).toBeEnabled();
  });

  it('shows search progress while placeholder results are visible', async () => {
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { isSearchOpen: true, isSearching: true },
    );

    expect(screen.getByLabelText('Searching stories')).toBeOnTheScreen();
  });

  it('clears the query and restores the wordmark when search is cancelled', async () => {
    const onCloseSearch = jest.fn();
    const rendered = await renderFeed({ status: 'loading' }, jest.fn(), jest.fn(), {
      isSearchOpen: true,
      onCloseSearch,
      query: 'library',
    });

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCloseSearch).toHaveBeenCalledTimes(1);

    await rendered.rerender(
      <FeedScreen
        state={{ status: 'loading' }}
        isRefreshing={false}
        onRefresh={jest.fn()}
        onPressActivity={jest.fn()}
        {...makeFeedScreenProps({ isSearchOpen: false, query: '' })}
      />,
    );

    expect(screen.getByText('AggieFeed')).toBeOnTheScreen();
  });

  it('reports tab selection and exposes the selected accessibility state', async () => {
    const onFilterChange = jest.fn();
    await renderFeed({ status: 'loading' }, jest.fn(), jest.fn(), {
      filter: 'all',
      onFilterChange,
    });

    const eventsTab = screen.getByRole('tab', { name: 'Events' });
    expect(eventsTab.props.accessibilityState).toEqual({ selected: false });

    const user = userEvent.setup();
    await user.press(eventsTab);
    expect(onFilterChange).toHaveBeenCalledWith('events');
  });

  it('keeps the entered search query visible while feed state changes', async () => {
    const rendered = await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { isSearchOpen: true, query: 'library' },
    );
    await rendered.rerender(
      <FeedScreen
        state={{ status: 'loading' }}
        isRefreshing={false}
        onRefresh={jest.fn()}
        onPressActivity={jest.fn()}
        {...makeFeedScreenProps({ isSearchOpen: true, query: 'library' })}
      />,
    );

    expect(screen.getByPlaceholderText('Search campus stories')).toHaveDisplayValue('library');
  });

  it('calls onRefresh when the user pulls to refresh', async () => {
    const onRefresh = jest.fn();
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      onRefresh,
    );

    await fireEvent(screen.getByLabelText('Campus stories'), 'onRefresh');

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('loads another page when the list reaches its end', async () => {
    const onLoadMore = jest.fn().mockResolvedValue(undefined);
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { hasMore: true, onLoadMore },
    );

    await fireEvent(screen.getByLabelText('Campus stories'), 'onEndReached');

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not load another page when there is no next page', async () => {
    const onLoadMore = jest.fn().mockResolvedValue(undefined);
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { hasMore: false, isLoadingMore: false, onLoadMore },
    );

    await fireEvent(screen.getByLabelText('Campus stories'), 'onEndReached');

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('renders the loading-more footer state', async () => {
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { isLoadingMore: true, hasMore: true },
    );
    expect(screen.getByLabelText('Loading more stories')).toBeOnTheScreen();
  });

  it('renders a retryable next-page footer error', async () => {
    const onLoadMore = jest.fn().mockResolvedValue(undefined);
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { hasMore: true, loadMoreError: 'Network unavailable.', onLoadMore },
    );
    expect(screen.getByText("Couldn't load more stories")).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('renders the end marker after the last page', async () => {
    await renderFeed(
      { status: 'ready', activities: [makeActivity()], fetchedAt: new Date() },
      jest.fn(),
      jest.fn(),
      { hasMore: false },
    );
    expect(screen.getByText("You're all caught up")).toBeOnTheScreen();
  });

  it.each([
    [
      'a search has no results',
      { query: 'library', filter: 'all' as const, reason: 'no-results' as const },
      'No results for "library"',
    ],
    [
      'the Events filter has no results',
      { query: '', filter: 'events' as const, reason: 'no-results' as const },
      'No events loaded yet',
    ],
  ])('uses the empty-state copy when %s', async (_scenario, emptyState, title) => {
    await renderFeed({ status: 'empty', ...emptyState });
    expect(screen.getByText(title)).toBeOnTheScreen();
  });

  it('calls onClearSearch from a no-results empty state', async () => {
    const onClearSearch = jest.fn();
    await renderFeed(
      { status: 'empty', query: 'library', filter: 'all', reason: 'no-results' },
      jest.fn(),
      jest.fn(),
      { onClearSearch },
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onShowAll from an empty Events filter', async () => {
    const onShowAll = jest.fn();
    await renderFeed(
      { status: 'empty', query: '', filter: 'events', reason: 'no-results' },
      jest.fn(),
      jest.fn(),
      { onShowAll },
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Show all' }));

    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('offers load more when an empty filter still has another page', async () => {
    const onLoadMore = jest.fn().mockResolvedValue(undefined);
    await renderFeed(
      { status: 'empty', query: '', filter: 'events', reason: 'no-results' },
      jest.fn(),
      jest.fn(),
      { hasMore: true, onLoadMore },
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Show all' })).toBeOnTheScreen();
  });
});
