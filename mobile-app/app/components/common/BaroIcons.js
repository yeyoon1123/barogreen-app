// app/components/common/BaroIcons.js
import React from "react";
import { Svg, Path, Circle, Rect } from "react-native-svg";

export function HomeIcon({ size = 24, color = "#9AA0A6", active = false }) {
  const stroke = active ? "#2DB36F" : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 10.5L12 3l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.5v-8z"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M9 21v-6h6v6" fill="none" stroke={stroke} strokeWidth={2} />
    </Svg>
  );
}

export function CommunityIcon({ size = 24, color = "#9AA0A6", active = false }) {
  const stroke = active ? "#2DB36F" : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="8" cy="8" r="3" stroke={stroke} strokeWidth={2} fill="none" />
      <Circle cx="16" cy="8" r="3" stroke={stroke} strokeWidth={2} fill="none" />
      <Path d="M3 19c.8-3 3.5-5 5-5s4.2 2 5 5" stroke={stroke} strokeWidth={2} fill="none" />
      <Path d="M12 14c1.7 0 4.2 2 5 5" stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = "#9AA0A6", active = false }) {
  const stroke = active ? "#2DB36F" : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth={2} fill="none" />
      <Path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function LawIcon({ size = 24, color = "#9AA0A6", active = false }) {
  const stroke = active ? "#2DB36F" : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="4"
        y="4"
        width="10"
        height="14"
        rx="2"
        ry="2"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
      />
      <Path d="M9 4v14M16 8h4M16 12h4M16 16h4" stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}
