import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import type { RichSegment } from '@/domain/richText';
import { fonts, useTheme } from '@/theme';

interface RichTextProps {
  segments: RichSegment[];
  onPressLink: (url: string) => void;
  style?: StyleProp<TextStyle>;
}

export function RichText({ segments, onPressLink, style }: RichTextProps) {
  const theme = useTheme();

  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.kind === 'link' ? (
          <Text
            accessibilityRole="link"
            key={`${segment.url}-${index}`}
            onPress={() => onPressLink(segment.url)}
            style={[styles.link, { color: theme.colors.accent }]}
          >
            {segment.text}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{segment.text}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.regular, textDecorationLine: 'underline' },
});
