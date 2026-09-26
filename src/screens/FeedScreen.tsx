import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { FeedState } from '@/hooks/useActivities';
import { spacing, useTheme } from '@/theme';

import { FeedHeader } from '@/components/FeedHeader';
import { FeedItem } from '@/components/FeedItem';
import { StatusView } from '@/components/StatusView';

interface FeedScreenProps {
  state: FeedState;
  isRefreshing: boolean;
  onRefresh: () => void;
  onPressActivity: (id: string) => void;
}

export function FeedScreen({ state, isRefreshing, onRefresh, onPressActivity }: FeedScreenProps) {
  const theme = useTheme();

  if (state.status !== 'ready') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.statusContent}>
          <FeedHeader />
          <StatusView
            kind={state.status}
            message={state.status === 'error' ? state.message : undefined}
            onRetry={state.status === 'error' || state.status === 'empty' ? onRefresh : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={state.activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FeedItem activity={item} index={index} onPress={onPressActivity} />
        )}
        ListHeaderComponent={<FeedHeader date={state.fetchedAt} />}
        ItemSeparatorComponent={FeedItemSeparator}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentInsetAdjustmentBehavior="automatic"
        accessibilityLabel="Campus stories"
      />
    </SafeAreaView>
  );
}

function FeedItemSeparator() {
  const theme = useTheme();

  return <View style={[styles.separator, { backgroundColor: theme.colors.hairline }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusContent: { flex: 1, paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  separator: { height: StyleSheet.hairlineWidth },
});
