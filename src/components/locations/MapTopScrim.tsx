import { StyleSheet, View } from 'react-native';

const FADE_OPACITIES = [0.54, 0.4, 0.28, 0.18, 0.1, 0.04];

interface MapTopScrimProps {
  color: string;
  topInset: number;
}

export function MapTopScrim({ color, topInset }: MapTopScrimProps) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.base, { backgroundColor: color, height: topInset + 8, opacity: 0.8 }]} />
      {FADE_OPACITIES.map((opacity, index) => (
        <View
          key={opacity}
          style={[styles.fade, { backgroundColor: color, opacity, top: topInset + 8 + index * 7 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { left: 0, position: 'absolute', right: 0, top: 0, zIndex: 1 },
  base: { left: 0, position: 'absolute', right: 0, top: 0 },
  fade: { height: 7, left: 0, position: 'absolute', right: 0 },
});
