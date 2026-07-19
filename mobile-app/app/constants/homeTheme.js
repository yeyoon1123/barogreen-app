// app/constants/homeTheme.js
export const GREEN       = "#34D399";
export const GREEN_DARK  = "#10B981";
export const GREEN_LIGHT = "#F7FAF5";
export const GREEN_BORDER= "#E7EEF2";
export const MINT_FADE   = "#E9F9F0";
export const INK         = "#4B5563";

export const REPORT_STATUS = {  
  PENDING: "접수 완료",
  PROCESSING: "처리 진행 중",
  COMPLETED: "처리 완료",
};

export const MARKER_COLOR = {
  PENDING: "#F4D35E",
  PROCESSING: "#27AE60",
  COMPLETED: "#1B5E20",
};

export const KOREA_BOUNDS = { minLat:33.0, maxLat:38.65, minLng:124.6, maxLng:131.1 };
export const KOREA_INITIAL_REGION = {
  latitude: 36.5, longitude: 127.8, latitudeDelta: 8.5, longitudeDelta: 7.5,
};

export const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515456799515-3a1d6e8d8c94?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503594922194-9f2a9a0f0b5b?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
];

export const SEARCH_RADIUS_KM = 10;
export const DEV_MOCK = false;     // 필요시 true
export const MOCK_COUNT = 120;
export const MOCK_MIN_DIST_M = 120;
