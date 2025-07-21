// src/services/KakaoLoginService.js
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { RNKakaoLogins } = NativeModules;

if (__DEV__) {
  console.log("모든 네이티브 모듈:", Object.keys(NativeModules));
  console.log("카카오 모듈:", RNKakaoLogins);

  // 네이티브 모듈 상태 확인
  console.log("카카오 네이티브 모듈 상태:", RNKakaoLogins ? "있음" : "없음");
  if (RNKakaoLogins) {
    console.log("카카오 사용 가능한 메서드:", Object.keys(RNKakaoLogins).join(", "));
  }
}

// 토큰 관리를 위한 스토리지 키
const KAKAO_TOKEN_KEY = "@kakao_token";

// 카카오 서비스 객체
const KakaoLoginService = {
  // 초기화 (필요한 경우)
  initialize: async () => {
    try {
      if (!RNKakaoLogins) {
        throw new Error("카카오 로그인 모듈을 찾을 수 없습니다");
      }
      console.log("[KakaoLoginService] 초기화 완료");
      return true;
    } catch (error) {
      console.error("[KakaoLoginService] 초기화 오류:", error);
      return false;
    }
  },

  // 로그인
  login: async () => {
    try {
      if (!RNKakaoLogins) {
        throw new Error("카카오 로그인 모듈을 찾을 수 없습니다. 네이티브 빌드가 필요할 수 있습니다.");
      }

      console.log("[KakaoLoginService] 네이티브 로그인 시작");

      // 이미 로그인되어 있는 상태라면 먼저 로그아웃
      try {
        console.log("[KakaoLoginService] 이전 세션 정리를 위한 로그아웃 시도");
        await RNKakaoLogins.logout();
      } catch (logoutErr) {
        console.log(
          "[KakaoLoginService] 기존 세션 없음 또는 로그아웃 실패:",
          logoutErr.message
        );
      }

      // 카카오톡 로그인 시도 (카카오톡 앱이 설치되어 있으면 앱으로, 없으면 웹으로)
      let result;
      try {
        console.log("[KakaoLoginService] 카카오톡 앱 로그인 시도");
        result = await RNKakaoLogins.login();
        console.log("[KakaoLoginService] 카카오톡 앱 로그인 결과:", result);
      } catch (appLoginError) {
        console.log("[KakaoLoginService] 카카오톡 앱 로그인 실패, 웹 로그인 시도");
        console.log("앱 로그인 에러:", appLoginError.message);
        
        // 앱 로그인 실패 시 웹 로그인 시도
        if (RNKakaoLogins.loginWithKakaoAccount) {
          result = await RNKakaoLogins.loginWithKakaoAccount();
          console.log("[KakaoLoginService] 웹 로그인 결과:", result);
        } else {
          throw appLoginError;
        }
      }

      // 토큰 정보 로컬 저장
      if (result && result.accessToken) {
        await AsyncStorage.setItem(KAKAO_TOKEN_KEY, JSON.stringify(result));
        console.log("[KakaoLoginService] 토큰 정보 저장 완료");
      }

      return result;
    } catch (error) {
      console.error("[KakaoLoginService] 로그인 처리 오류:", error);
      throw error;
    }
  },

  // 사용자 프로필 정보 가져오기
  getProfile: async () => {
    try {
      if (!RNKakaoLogins) {
        throw new Error("카카오 로그인 모듈을 찾을 수 없습니다");
      }

      console.log("[KakaoLoginService] 프로필 정보 요청 시작");

      const profileData = await RNKakaoLogins.getProfile();
      console.log("[KakaoLoginService] 프로필 정보 결과:", profileData);

      return profileData;
    } catch (error) {
      console.error("[KakaoLoginService] 프로필 정보 요청 오류:", error);
      throw error;
    }
  },

  // 간소화된 로그인 함수 (AuthContext에서 호출)
  loginSimple: async () => {
    console.log("[KakaoLoginService] 간소화된 카카오 로그인 메서드 사용");
    return await KakaoLoginService.login();
  },

  // 로그아웃
  logout: async () => {
    try {
      if (!RNKakaoLogins) {
        console.log("[KakaoLoginService] 네이티브 모듈 없음, 로컬 정리만 수행");
        await AsyncStorage.removeItem(KAKAO_TOKEN_KEY);
        return true;
      }

      console.log("[KakaoLoginService] 로그아웃 시작");

      // 로컬 스토리지에서 토큰 제거
      await AsyncStorage.removeItem(KAKAO_TOKEN_KEY);

      // 네이티브 로그아웃 시도
      try {
        if (RNKakaoLogins.logout) {
          const result = await RNKakaoLogins.logout();
          console.log("[KakaoLoginService] 네이티브 로그아웃 결과:", result);
        }
      } catch (logoutError) {
        console.warn(
          "[KakaoLoginService] 네이티브 로그아웃 실패 (무시됨):",
          logoutError.message
        );
      }

      console.log("[KakaoLoginService] 로그아웃 완료");
      return true;
    } catch (error) {
      console.error("[KakaoLoginService] 로그아웃 오류:", error);
      return true; // 로컬 정리는 성공했으므로 true 반환
    }
  },

  // 연결 해제 (앱과 카카오 계정 연결 끊기)
  unlink: async () => {
    try {
      if (!RNKakaoLogins) {
        console.log("[KakaoLoginService] 네이티브 모듈 없음, 로컬 정리만 수행");
        await AsyncStorage.removeItem(KAKAO_TOKEN_KEY);
        return true;
      }

      console.log("[KakaoLoginService] 연결 해제 시작");

      // 로컬 스토리지 정리
      await AsyncStorage.removeItem(KAKAO_TOKEN_KEY);
      
      // 관련 데이터 삭제
      const keys = [
        "@kakao_token",
        "@kakao_login_data", 
        "@kakao_profile",
        "@kakao_user_info"
      ];
      
      await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

      // 네이티브 연결 해제 시도
      try {
        if (RNKakaoLogins.unlink) {
          const result = await RNKakaoLogins.unlink();
          console.log("[KakaoLoginService] 네이티브 연결 해제 결과:", result);
        }
      } catch (unlinkError) {
        console.warn(
          "[KakaoLoginService] 네이티브 연결 해제 실패 (무시됨):",
          unlinkError.message
        );
      }

      console.log("[KakaoLoginService] 연결 해제 완료");
      return true;
    } catch (error) {
      console.error("[KakaoLoginService] 연결 해제 오류:", error);
      return true; // 로컬 정리는 성공했으므로 true 반환
    }
  },

  // 현재 로그인 상태 확인
  getAccessToken: async () => {
    try {
      if (!RNKakaoLogins) {
        // 네이티브 모듈이 없으면 로컬 스토리지에서만 확인
        const tokenData = await AsyncStorage.getItem(KAKAO_TOKEN_KEY);
        if (tokenData) {
          const parsedToken = JSON.parse(tokenData);
          console.log("[KakaoLoginService] 로컬 토큰 확인:", !!parsedToken.accessToken);
          return parsedToken.accessToken;
        }
        return null;
      }

      // 로컬 스토리지에서 토큰 확인
      const tokenData = await AsyncStorage.getItem(KAKAO_TOKEN_KEY);
      if (tokenData) {
        const parsedToken = JSON.parse(tokenData);
        console.log("[KakaoLoginService] 로컬 토큰 확인:", !!parsedToken.accessToken);
        return parsedToken.accessToken;
      }

      // 네이티브에서 토큰 확인
      if (RNKakaoLogins.getAccessToken) {
        const nativeToken = await RNKakaoLogins.getAccessToken();
        console.log("[KakaoLoginService] 네이티브 토큰 확인:", !!nativeToken);
        return nativeToken;
      }

      return null;
    } catch (error) {
      console.error("[KakaoLoginService] 토큰 확인 오류:", error);
      return null;
    }
  },

  // 네이티브 모듈 상태 확인
  isNativeModuleAvailable: () => {
    return !!RNKakaoLogins;
  },
};

export default KakaoLoginService;
