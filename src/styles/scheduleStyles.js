// src/styles/scheduleStyles.js

import { StyleSheet, Platform } from "react-native";

// 공통 색상 테마
export const SCHEDULE_COLORS = {
  primary: "#50cebb",
  primaryDark: "#3bb2a0",
  weekendSchedule: {
    primary: "#4284F3",
    secondary: "#8C9AAF",
  },
  daySchedule: {
    // 요일별 색상은 기존 코드 유지
  },
  consumerCustom: {
    primary: "#50CEBB",
    secondary: "#4A90E2",
  },
};

// 공통 스타일 정의
export const commonStyles = StyleSheet.create({
  // 헤더 공통 스타일
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 45 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },

  // 컨텐츠 컨테이너 공통 스타일
  contentContainer: {
    flex: 1,
    marginTop: -20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // 카드 공통 스타일
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // 버튼 공통 스타일
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.15)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
