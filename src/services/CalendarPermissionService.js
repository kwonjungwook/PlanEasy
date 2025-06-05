// src/services/CalendarPermissionService.js
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CALENDAR_PERMISSION_KEY = "@calendar_permission_granted";

/**
 * 캘린더 권한 관리 서비스
 * 로그인과 별도로 캘린더 권한을 요청하고 관리
 */
export class CalendarPermissionService {
  /**
   * 캘린더 권한이 있는지 확인
   */
  static async hasCalendarPermission() {
    try {
      if (Platform.OS === "web") {
        // 웹에서는 항상 권한이 있다고 가정
        return true;
      }

      // 로컬 스토리지에서 권한 상태 확인
      const permissionGranted = await AsyncStorage.getItem(CALENDAR_PERMISSION_KEY);
      if (permissionGranted === "true") {
        return true;
      }

      // Google Sign-In 상태 확인
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return false;
      }

      // 현재 사용자의 스코프 확인
      try {
        const userInfo = await GoogleSignin.getCurrentUser();
        const hasCalendarScope = userInfo?.scopes?.includes(
          "https://www.googleapis.com/auth/calendar"
        );
        
        if (hasCalendarScope) {
          await AsyncStorage.setItem(CALENDAR_PERMISSION_KEY, "true");
          return true;
        }
      } catch (error) {
        console.log("스코프 확인 실패:", error);
      }

      return false;
    } catch (error) {
      console.error("캘린더 권한 확인 오류:", error);
      return false;
    }
  }

  /**
   * 캘린더 권한 요청
   */
  static async requestCalendarPermission() {
    try {
      if (Platform.OS === "web") {
        // 웹에서는 다른 방식으로 처리
        console.log("웹 환경에서는 캘린더 권한이 자동으로 처리됩니다.");
        return true;
      }

      console.log("캘린더 권한 요청 시작...");

      // 기존 로그인 상태 확인
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        throw new Error("먼저 구글 로그인을 해주세요.");
      }

      // 캘린더 스코프를 추가하여 재인증 요청
      await GoogleSignin.configure({
        webClientId:
          "68267517120-big8fa3f9h6aefq5so2viadcath3jbt4.apps.googleusercontent.com",
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: [
          "profile",
          "email",
          "https://www.googleapis.com/auth/calendar",
        ],
      });

      // 추가 스코프 요청
      const userInfo = await GoogleSignin.addScopes({
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      if (userInfo) {
        console.log("캘린더 권한 획득 성공");
        await AsyncStorage.setItem(CALENDAR_PERMISSION_KEY, "true");
        return true;
      }

      return false;
    } catch (error) {
      console.error("캘린더 권한 요청 오류:", error);
      
      if (error.code === "SIGN_IN_CANCELLED") {
        throw new Error("사용자가 권한 요청을 취소했습니다.");
      } else if (error.code === "IN_PROGRESS") {
        throw new Error("이미 권한 요청이 진행 중입니다.");
      } else {
        throw new Error("캘린더 권한 요청에 실패했습니다: " + error.message);
      }
    }
  }

  /**
   * 캘린더 권한 해제
   */
  static async revokeCalendarPermission() {
    try {
      await AsyncStorage.removeItem(CALENDAR_PERMISSION_KEY);
      console.log("캘린더 권한 상태 초기화");
      
      // 필요하면 여기서 Google Sign-In 재구성으로 스코프 제거
      if (Platform.OS !== "web") {
        await GoogleSignin.configure({
          webClientId:
            "68267517120-big8fa3f9h6aefq5so2viadcath3jbt4.apps.googleusercontent.com",
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ["profile", "email"], // 기본 스코프만 유지
        });
      }
      
      return true;
    } catch (error) {
      console.error("캘린더 권한 해제 오류:", error);
      return false;
    }
  }

  /**
   * 캘린더 접근 토큰 가져오기
   */
  static async getCalendarAccessToken() {
    try {
      if (Platform.OS === "web") {
        // 웹에서는 Firebase Auth 토큰 사용
        const userData = await AsyncStorage.getItem("@user_auth_data");
        const user = userData ? JSON.parse(userData) : null;
        return user?.accessToken || null;
      }

      // 네이티브에서는 GoogleSignin 토큰 사용
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error("캘린더 토큰 가져오기 오류:", error);
      return null;
    }
  }
}
