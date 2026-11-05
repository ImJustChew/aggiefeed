import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type EdgePadding,
  type MapMarker,
  type Region,
} from 'react-native-maps';
import Supercluster from 'supercluster';

import {
  locationDisplayName,
  locationSubtitle,
  type Location,
  type LocationCoordinates,
} from '@/domain/location';

import { categoryPinColor, CLUSTER_COLOR, SELECTED_PIN_COLOR } from './mapColors';

export interface LocationMapHandle {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: LocationCoordinates[], animated?: boolean) => void;
}

export interface LocationMapProps {
  locations: Location[];
  mapPadding: EdgePadding;
  selectedLocation: Location | null;
  onPressLocation: (id: string) => void;
  onMapReady?: () => void;
}

const LOCATION_FOCUS_DELTA = 0.004;

const CAMPUS_REGION: Region = {
  latitude: 38.5382,
  longitude: -121.7617,
  latitudeDelta: 0.027,
  longitudeDelta: 0.027,
};

const LOCATION_MAP_STYLE = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
];

export function regionForCoordinates(coordinates: LocationCoordinates | null): Region | null {
  if (coordinates === null) return null;

  return {
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    latitudeDelta: LOCATION_FOCUS_DELTA,
    longitudeDelta: LOCATION_FOCUS_DELTA,
  };
}

export function regionForLocation(location: Location): Region | null {
  return regionForCoordinates(location.coordinates);
}

function regionBounds(region: Region): [number, number, number, number] {
  // Pad the visible bounds so edge markers don't pop in during a gesture.
  const longitudePadding = region.longitudeDelta * 1.5;
  const latitudePadding = region.latitudeDelta * 1.5;
  return [
    region.longitude - longitudePadding,
    Math.max(-90, region.latitude - latitudePadding),
    region.longitude + longitudePadding,
    Math.min(90, region.latitude + latitudePadding),
  ];
}

function zoomForRegion(region: Region, width: number): number {
  return Math.max(0, Math.log2((360 * width) / (256 * region.longitudeDelta)));
}

interface ClusterMarkerProps {
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress: () => void;
  size: number;
}

function ClusterMarker({ coordinate, count, onPress, size }: ClusterMarkerProps) {
  const markerRef = useRef<MapMarker | null>(null);

  useEffect(() => {
    // tracksViewChanges=false snapshots stale bitmaps, so redraw when the count changes.
    const frame = requestAnimationFrame(() => markerRef.current?.redraw());
    return () => cancelAnimationFrame(frame);
  }, [count]);

  return (
    <Marker
      accessibilityLabel={`${count} locations, tap to zoom in`}
      coordinate={coordinate}
      onPress={onPress}
      ref={markerRef}
      tracksViewChanges={false}
      zIndex={2}
    >
      <View style={[styles.clusterDot, { borderRadius: size / 2, height: size, width: size }]}>
        <Text style={styles.clusterCount}>{count}</Text>
      </View>
    </Marker>
  );
}

function renderLocationPin(location: Location, onPress: (id: string) => void, selected = false) {
  const { coordinates } = location;
  if (coordinates === null) return null;

  const title = locationDisplayName(location);
  const subtitle = locationSubtitle(location);

  return (
    <Marker
      accessibilityLabel={`${title}, ${subtitle}`}
      coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }}
      description={subtitle}
      key={selected ? `selected-${location.id}` : location.id}
      onPress={() => onPress(location.id)}
      pinColor={selected ? SELECTED_PIN_COLOR : categoryPinColor(location.categoryId)}
      title={title}
      tracksViewChanges={false}
      zIndex={selected ? 1000 : 1}
    />
  );
}

export const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(function LocationMap(
  { locations, mapPadding, selectedLocation, onPressLocation, onMapReady },
  forwardedRef,
) {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState(CAMPUS_REGION);
  const [mapWidth, setMapWidth] = useState(0);
  const latestRegion = useRef(CAMPUS_REGION);
  const committedRegion = useRef(CAMPUS_REGION);
  const zoomLevel = useRef(0);
  const clusterIndex = useMemo(() => {
    const points = locations.flatMap((location) => {
      if (location.coordinates === null || location.id === selectedLocation?.id) return [];
      return [
        {
          type: 'Feature' as const,
          properties: { location },
          geometry: {
            type: 'Point' as const,
            coordinates: [location.coordinates.lng, location.coordinates.lat] as [number, number],
          },
        },
      ];
    });

    // Supercluster returns raw points only above maxZoom; 17 is the cluster cutoff.
    return new Supercluster<{ location: Location }>({ radius: 48, maxZoom: 17 }).load(points);
  }, [locations, selectedLocation?.id]);
  const features = useMemo(
    () => clusterIndex.getClusters(regionBounds(region), zoomForRegion(region, mapWidth)),
    [clusterIndex, mapWidth, region],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setMapWidth(width);
    zoomLevel.current = Math.floor(zoomForRegion(latestRegion.current, width));
  }, []);

  const handleRegionChange = useCallback(
    (nextRegion: Region) => {
      // Keep clusters responsive; iOS Google/Fabric may skip onRegionChangeComplete after gestures.
      latestRegion.current = nextRegion;
      const nextZoomLevel = Math.floor(zoomForRegion(nextRegion, mapWidth));
      const movedLatitude =
        Math.abs(nextRegion.latitude - committedRegion.current.latitude) >
        nextRegion.latitudeDelta / 3;
      const movedLongitude =
        Math.abs(nextRegion.longitude - committedRegion.current.longitude) >
        nextRegion.longitudeDelta / 3;

      if (zoomLevel.current !== nextZoomLevel || movedLatitude || movedLongitude) {
        zoomLevel.current = nextZoomLevel;
        committedRegion.current = nextRegion;
        setRegion(nextRegion);
      }
    },
    [mapWidth],
  );

  const handleRegionChangeComplete = useCallback(
    (nextRegion: Region) => {
      latestRegion.current = nextRegion;
      committedRegion.current = nextRegion;
      zoomLevel.current = Math.floor(zoomForRegion(nextRegion, mapWidth));
      setRegion(nextRegion);
    },
    [mapWidth],
  );

  const handlePressCluster = useCallback(
    (clusterId: number, latitude: number, longitude: number) => {
      const currentZoom = zoomForRegion(latestRegion.current, mapWidth);
      const zoom = Math.max(clusterIndex.getClusterExpansionZoom(clusterId), currentZoom + 1);
      // animateCamera zoom matches supercluster's 256px tile zoom basis for cluster expansion.
      mapRef.current?.animateCamera({ center: { latitude, longitude }, zoom }, { duration: 350 });
    },
    [clusterIndex, mapWidth],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      animateToRegion: (nextRegion, duration = 350) => {
        mapRef.current?.animateToRegion(nextRegion, duration);
      },
      fitToCoordinates: (coordinates, animated = true) => {
        mapRef.current?.fitToCoordinates(
          coordinates.map(({ lat, lng }) => ({ latitude: lat, longitude: lng })),
          { animated },
        );
      },
    }),
    [],
  );

  return (
    <MapView
      accessibilityLabel="UC Davis campus map"
      customMapStyle={LOCATION_MAP_STYLE}
      initialRegion={CAMPUS_REGION}
      mapPadding={mapPadding}
      onMapReady={onMapReady}
      onLayout={handleLayout}
      onRegionChange={handleRegionChange}
      onRegionChangeComplete={handleRegionChangeComplete}
      provider={PROVIDER_GOOGLE}
      ref={mapRef}
      scrollEnabled
      style={styles.map}
      testID="locations-map"
      zoomEnabled
    >
      {features.map((feature) => {
        const longitude = feature.geometry.coordinates[0];
        const latitude = feature.geometry.coordinates[1];
        if (longitude === undefined || latitude === undefined) return null;
        const coordinate = { latitude, longitude };
        if ('cluster' in feature.properties && feature.properties.cluster) {
          const { cluster_id: clusterId, point_count: count } = feature.properties;
          const size = Math.max(42, 18 + String(count).length * 9);
          return (
            <ClusterMarker
              coordinate={coordinate}
              count={count}
              key={`cluster-${clusterId}`}
              onPress={() => handlePressCluster(clusterId, latitude, longitude)}
              size={size}
            />
          );
        }

        return renderLocationPin(feature.properties.location, onPressLocation);
      })}
      {selectedLocation?.coordinates
        ? renderLocationPin(selectedLocation, onPressLocation, true)
        : null}
    </MapView>
  );
});

const styles = StyleSheet.create({
  clusterCount: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  clusterDot: {
    alignItems: 'center',
    backgroundColor: CLUSTER_COLOR,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    elevation: 4,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
  },
  map: { flex: 1 },
});
