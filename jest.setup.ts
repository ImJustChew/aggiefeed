import { setUpTests } from 'react-native-reanimated';

setUpTests();

jest.mock('react-native-maps', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const MockMapView = React.forwardRef(function MockMapView(
    props: Record<string, unknown>,
    ref: React.ForwardedRef<{
      animateCamera: jest.Mock;
      animateToRegion: jest.Mock;
      fitToCoordinates: jest.Mock;
    }>,
  ) {
    const { children, onMapReady, ...viewProps } = props;
    const onLayout = props.onLayout;
    const onRegionChangeComplete = props.onRegionChangeComplete;
    const reportRegion = (region: object) => {
      if (typeof onRegionChangeComplete === 'function') {
        Reflect.apply(onRegionChangeComplete, undefined, [region]);
      }
    };
    const methods = React.useMemo(() => {
      return {
        animateCamera: jest.fn(),
        animateToRegion: jest.fn((region: object) => reportRegion(region)),
        fitToCoordinates: jest.fn((coordinates: { latitude: number; longitude: number }[]) => {
          if (coordinates.length === 0) return;
          const latitudes = coordinates.map(({ latitude }) => latitude);
          const longitudes = coordinates.map(({ longitude }) => longitude);
          const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
          const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
          reportRegion({
            latitude,
            longitude,
            latitudeDelta: Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.004) * 1.5,
            longitudeDelta:
              Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.004) * 1.5,
          });
        }),
      };
    }, [onRegionChangeComplete]);
    React.useImperativeHandle(ref, () => methods, [methods]);
    React.useEffect(() => {
      if (typeof onLayout === 'function') {
        Reflect.apply(onLayout, undefined, [
          { nativeEvent: { layout: { height: 800, width: 400, x: 0, y: 0 } } },
        ]);
      }
      if (typeof onMapReady === 'function') onMapReady();
    }, [onLayout, onMapReady]);
    const mapProps = { ...viewProps, __mapMethods: methods } as unknown as React.ComponentProps<
      typeof View
    >;
    return React.createElement(View, mapProps, children as React.ReactNode);
  });

  const MockMarker = React.forwardRef(function MockMarker(
    { children, ...props }: Record<string, unknown>,
    ref: React.ForwardedRef<{ redraw: jest.Mock; showCallout: jest.Mock }>,
  ) {
    const methods = React.useMemo(() => ({ redraw: jest.fn(), showCallout: jest.fn() }), []);
    React.useImperativeHandle(ref, () => methods, [methods]);
    const markerProps = { ...props, __markerMethods: methods } as unknown as React.ComponentProps<
      typeof View
    >;
    return React.createElement(View, markerProps, children as React.ReactNode);
  });

  function MockCallout({ children, ...props }: Record<string, unknown>) {
    return React.createElement(View, props, children as React.ReactNode);
  }

  return {
    __esModule: true,
    default: MockMapView,
    Callout: MockCallout,
    MapMarker: MockMarker,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { FlatList, ScrollView, TextInput, TouchableOpacity, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  const MockBottomSheet = React.forwardRef(function MockBottomSheet(
    { children, ...props }: Record<string, unknown>,
    ref: React.ForwardedRef<{ snapToIndex: jest.Mock }>,
  ) {
    const methods = React.useMemo(() => ({ snapToIndex: jest.fn() }), []);
    React.useImperativeHandle(ref, () => methods, [methods]);
    return React.createElement(View, props, children as React.ReactNode);
  });

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetFlatList: FlatList,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
    TouchableOpacity,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const GestureHandlerRootView = React.forwardRef(function GestureHandlerRootView(
    { children, ...props }: Record<string, unknown>,
    ref: React.ForwardedRef<unknown>,
  ) {
    const rootProps = { ...props, ref } as unknown as React.ComponentProps<typeof View>;
    return React.createElement(View, rootProps, children as React.ReactNode);
  });

  return { __esModule: true, GestureHandlerRootView };
});
