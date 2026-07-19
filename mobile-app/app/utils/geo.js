// app/utils/geo.js
export const toRad = (v) => (v * Math.PI) / 180;

export function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function extractLatLngFromExif(exif = {}) {
  if (typeof exif?.GPSLatitude === "number" && typeof exif?.GPSLongitude === "number") {
    return { latitude: exif.GPSLatitude, longitude: exif.GPSLongitude };
  }
  return null;
}

export const formatAddress = (a) =>
  [a.region, a.city, a.district, a.street, a.name].filter(Boolean).join(" ");

export function offsetMeters(center, dxMeters, dyMeters) {
  const latMeters = 111320;
  const lonMeters = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const dLat = dyMeters / latMeters;
  const dLng = dxMeters / lonMeters;
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}
