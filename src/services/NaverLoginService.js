// src/services/NaverLoginService.js
import { NativeModules, Platform } from "react-native";
const { NaverLoginModule } = NativeModules;

console.log("모든 네이티브 모듈:", Object.keys(NativeModules));
console.log("네이버 모듈:", NaverLoginModule);

// 네이티브 모듈 상태 확인
console.log("네이티브 모듈 상태:", NaverLoginModule ? "있음" : "없음");
if (NaverLoginModule) {
  console.log("사용 가능한 메서드:", Object.keys(NaverLoginModule).join(", "));
}

const NAVER_CONFIG = {
  kConsumerKey: "Y3OUgvCptmtmaPTb9GLc",
  kConsumerSecret: "iEoHx5dLJs",
  kServiceAppName: "com.kwonjihoo.PlanEasy", // 패키지 이름과 일치하게 변경
};

// 네이버 서비스 객체
const NaverLoginService = {
  // SDK 초기화
  initialize: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] SDK 초기화 시작");

      // 초기화 메서드 호출
      const initialized = await NaverLoginModule.initializeWithParams(
        NAVER_CONFIG.kConsumerKey,
        NAVER_CONFIG.kConsumerSecret,
        NAVER_CONFIG.kServiceAppName
      );
      console.log("[NaverLoginService] SDK 초기화 결과:", initialized);

      return true;
    } catch (error) {
      console.error("[NaverLoginService] 초기화 오류:", error);
      throw error;
    }
  },

  // 기존 login 메서드 사용
  login: async () => {
    try {
      // 먼저 SDK 초기화
      await NaverLoginService.initialize();

      // NaverLoginModule에 login 메서드가 있는지 확인
      if (!NaverLoginModule.login) {
        throw new Error("login 메서드를 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 로그인 시작");

      // login 메서드 호출
      const result = await NaverLoginModule.login();
      console.log("[NaverLoginService] 로그인 결과:", result);

      return result;
    } catch (error) {
      console.error("[NaverLoginService] 로그인 처리 오류:", error);
      throw error;
    }
  },

  // 간소화된 로그인 함수 (AuthService.js에서 호출)
  loginSimple: async () => {
    console.log("간소화된 네이버 로그인 메서드 사용");
    return await NaverLoginService.login();
  },

  // 로그아웃
  logout: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      if (!NaverLoginModule.logout) {
        throw new Error("logout 메서드를 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 로그아웃 시작");
      const result = await NaverLoginModule.logout();
      console.log("[NaverLoginService] 로그아웃 결과:", result);
      return result;
    } catch (error) {
      console.error("[NaverLoginService] 로그아웃 오류:", error);
      throw error;
    }
  },

  // 토큰 삭제
  deleteToken: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      if (!NaverLoginModule.deleteToken) {
        throw new Error("deleteToken 메서드를 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 토큰 삭제 시작");
      const result = await NaverLoginModule.deleteToken();
      console.log("[NaverLoginService] 토큰 삭제 결과:", result);
      return result;
    } catch (error) {
      console.error("[NaverLoginService] 토큰 삭제 오류:", error);
      throw error;
    }
  },
};

export default NaverLoginService;
