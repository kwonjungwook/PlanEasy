// src/styles/commonStyles.js 파일 생성

import { Platform } from "react-native";

// 공통 색상 정의
export const COLORS = {
  primary: "#50cebb",
  primaryDark: "#3bb2a0",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#333333",
  textLight: "#666666",
};

// 공통 여백 정의
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// 공통 그림자 정의
export const SHADOWS = {
  small: Platform.select({
    ios: {
      shadowColor: "rgba(0,0,0,0.1)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: "rgba(0,0,0,0.1)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: "rgba(0,0,0,0.1)",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
};
