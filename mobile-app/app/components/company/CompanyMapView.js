// app/components/company/CompanyMapView.js
import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Callout } from "react-native-maps";

export default function CompanyMapView({
  mapRef,
  region,
  onRegionChangeComplete,
  COLOR,
  STATUS_TEXT,
  FALLBACK_IMG,
  GREEN,
  navigating,
  routeCoords,
  flags,
  onMarkerPress,
}) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation
      showsMyLocationButton={false}
      rotateEnabled={false}
    >
      {navigating && routeCoords.length >= 2 && (
        <Polyline
          coordinates={routeCoords.filter((p) => isFinite(p.latitude) && isFinite(p.longitude))}
          strokeWidth={6}
          strokeColor={GREEN}
        />
      )}

      {flags.map((f) => (
        <Marker
          key={f.reportId}
          coordinate={{ latitude: f.lat, longitude: f.lng }}
          onPress={() => onMarkerPress(f)}
        >
          <View style={[styles.dot, { backgroundColor: COLOR[f.status] || "#888" }]} />
          <Callout tooltip>
            <View style={styles.callout}>
              <Image source={{ uri: f.photoUri || FALLBACK_IMG }} style={styles.calloutImg} />
              <View style={{ padding: 8 }}>
                <Text style={{ fontWeight: "800" }}>{STATUS_TEXT[f.status] || "상태"}</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>{(f.address || "").toString().slice(0, 28)}</Text>
                <Text style={{ fontSize: 12, color: "#6b7c70", marginTop: 2 }}>
                  특이사항: {(f.note || "없음").toString().slice(0, 18)}
                </Text>
                <Text style={{ fontSize: 11, color: "#9aa1a7", marginTop: 6 }}>탭하여 상세</Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#fff" },
  callout: { width: 220, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 6 },
  calloutImg: { width: 220, height: 110, backgroundColor: "#ddd" },
});
