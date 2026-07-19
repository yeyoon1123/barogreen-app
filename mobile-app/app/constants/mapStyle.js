// app/constants/mapStyle.js
export const googleMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#F5FAF7" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5F6A60" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F5FAF7" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E6F5E9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7C8B7F" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D7F2EC" }] },
];
