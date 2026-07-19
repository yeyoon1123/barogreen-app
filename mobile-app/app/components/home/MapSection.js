// app/components/home/MapSection.js
// 지도 렌더링 + 마커/콜아웃
import React from "react";
import { View, Pressable } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import CalloutCard from "./CalloutCard";

export default function MapSection({
  region,
  mapRef,
  googleMapStyle,
  onRegionChangeComplete,
  onMapPress,
  markers,
  trackMarkerViews,
  markerColors,
  statusLabelMap,
  getDisplayPhoto,
  onMarkerPress,
  onOpenDetail,
  onOpenSheet, // ✅ 시트 열기 콜백 (반만 열기)
}) {
  if (!region) return null;

  const openSheetHalf = f => {
    onMarkerPress && onMarkerPress(f); // 선택 위치 갱신(센터 고정)
    onOpenSheet && onOpenSheet(f); // 홈에서 openSheetToHalf 실행됨
  };

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onMapPress}
      showsUserLocation
      showsMyLocationButton={false}
      rotateEnabled={false}
      customMapStyle={googleMapStyle}
    >
      {markers.map(f => (
        <Marker
          key={f.reportId}
          coordinate={{ latitude: f.lat, longitude: f.lng }}
          anchor={{ x: 0.5, y: 1 }}
          centerOffset={{ x: 0, y: -20 }}
          tracksViewChanges={trackMarkerViews}
          onPress={() => openSheetHalf(f)} // 마커 눌러도 시트 반열림
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: "#fff",
              backgroundColor: markerColors[f.status?.toUpperCase()] || "#888",
            }}
          />

          {/* ✅ 커스텀 콜아웃: Callout의 onPress로 직접 처리 */}
          <Callout
            tooltip
            onPress={() => {
              openSheetHalf(f); // 반열림 유지
              onOpenDetail && onOpenDetail(f); // ✅ 콜아웃(썸네일 포함) 탭 시 상세 열기
            }}
          >
            {/* 레이아웃 유지용 래퍼 - onPress는 Callout에만 둠 */}
            <Pressable>
              <CalloutCard
                photoUrl={getDisplayPhoto(f)}
                title={statusLabelMap[f.status?.toUpperCase()] || "상태"}
                addr={f.address}
                hint="탭하여 상세 보기"
              />
            </Pressable>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
