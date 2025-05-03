// src/services/NaverLoginService.js
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  kConsumerSecret: "iExHx5dLJs",
  kServiceAppName: "PlanEasy",
  kServiceAppUrlScheme: "naverY3OUgvCptmtmaPTb9GLc", // 패키지 이름과 일치하게 변경
  kConsumerCallbackUrl: "naverY3OUgvCptmtmaPTb9GLc://oauth",
  // 권한 범위 추가
  scopes: ["name", "nickname", "email", "profile_image", "gender", "age"],
  // 항상 동의 화면 표시 옵션 추가
  authType: "force",
};

// 토큰 관리를 위한 스토리지 키
const NAVER_TOKEN_KEY = "@naver_token";

// 네이버 서비스 객체
const NaverLoginService = {
  // SDK 초기화
  // initialize 메서드 수정
  initialize: async (config) => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      // 설정이 문자열인 경우 객체로 변환 (이전 API 호환성)
      let initConfig = config;
      if (typeof config === "string") {
        console.log(
          "[NaverLoginService] 문자열로 전달된 클라이언트 ID를 객체로 변환합니다"
        );
        // 첫번째 인자를 clientId로 간주
        initConfig = {
          kConsumerKey: config,
          kConsumerSecret: "iExHx5dLJs", // 기본값
          kServiceAppName: "PlanEasy", // 기본값
          kServiceAppUrlScheme: "naverY3OUgvCptmtmaPTb9GLc", // 기본값
          kConsumerCallbackUrl: "naverY3OUgvCptmtmaPTb9GLc://oauth", // 기본값
          scopes: NAVER_CONFIG.scopes, // scopes 전달
          authType: "force", // 항상 동의 화면 표시
        };
      }

      // 설정이 없는 경우 기본값 사용
      if (!initConfig) {
        initConfig = NAVER_CONFIG;
      }

      console.log("[NaverLoginService] SDK 초기화 시작");
      console.log("[NaverLoginService] 초기화 파라미터:", initConfig);

      // 네이티브 모듈 초기화 호출
      const result = await NaverLoginModule.initialize(initConfig);
      console.log("[NaverLoginService] SDK 초기화 결과:", result);

      // 권한 범위 설정 별도 호출 (NaverLoginModule.java의 setScopes 사용)
      if (NaverLoginModule.setScopes && Array.isArray(NAVER_CONFIG.scopes)) {
        try {
          await NaverLoginModule.setScopes(NAVER_CONFIG.scopes);
          console.log(
            "[NaverLoginService] 권한 범위 설정 완료:",
            NAVER_CONFIG.scopes
          );
        } catch (scopeError) {
          console.warn(
            "[NaverLoginService] 권한 범위 설정 실패:",
            scopeError.message
          );
        }
      }

      // 인증 타입 설정 (force: 항상 동의 화면 표시)
      if (NaverLoginModule.setAuthType) {
        try {
          await NaverLoginModule.setAuthType("force");
          console.log("[NaverLoginService] 인증 타입 설정 완료: force");
        } catch (authTypeError) {
          console.warn(
            "[NaverLoginService] 인증 타입 설정 실패:",
            authTypeError.message
          );
        }
      }

      return result;
    } catch (error) {
      console.error("[NaverLoginService] 초기화 오류:", error);
      throw error;
    }
  },

  // login 메서드 수정
  login: async () => {
    try {
      // 먼저 SDK 초기화 - 권한 범위 포함
      await NaverLoginService.initialize();

      // 이미 로그인되어 있는 상태라면 먼저 로그아웃 강제 실행
      try {
        console.log("[NaverLoginService] 이전 세션 정리를 위한 로그아웃 시도");
        await NaverLoginModule.logout();
      } catch (logoutErr) {
        console.log(
          "[NaverLoginService] 기존 세션 없음 또는 로그아웃 실패:",
          logoutErr.message
        );
      }

      // NaverLoginModule에 login 메서드가 있는지 확인
      if (!NaverLoginModule.login) {
        throw new Error("login 메서드를 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 로그인 시작 - 권한 동의 화면 표시 요청");

      // login 메서드 호출
      const result = await NaverLoginModule.login();
      console.log("[NaverLoginService] 로그인 결과:", result);

      // 토큰 정보 로컬 저장 추가
      if (result && result.accessToken) {
        await AsyncStorage.setItem(NAVER_TOKEN_KEY, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("[NaverLoginService] 로그인 처리 오류:", error);
      throw error;
    }
  },

  // 사용자 프로필 정보 가져오기
  getProfile: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 프로필 정보 요청 시작");

      const profileData = await NaverLoginModule.getProfile();
      console.log("[NaverLoginService] 프로필 정보 결과:", profileData);

      return profileData;
    } catch (error) {
      console.error("[NaverLoginService] 프로필 정보 요청 오류:", error);
      throw error;
    }
  },

  // 간소화된 로그인 함수 (AuthService.js에서 호출)
  loginSimple: async () => {
    console.log("간소화된 네이버 로그인 메서드 사용");
    return await NaverLoginService.login();
  },

  // 로그아웃 (동작 확인 및 로컬 스토리지 정리)
  logout: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 로그아웃 시작");

      // 로컬 스토리지에서 토큰 제거
      await AsyncStorage.removeItem(NAVER_TOKEN_KEY);

      // 에러가 발생해도 성공으로 처리
      try {
        // 네이티브 로그아웃 시도
        if (NaverLoginModule.logout) {
          const result = await NaverLoginModule.logout();
          console.log("[NaverLoginService] 네이티브 로그아웃 결과:", result);
        }
      } catch (logoutError) {
        // 로그는 남기지만 실패해도 계속 진행
        console.warn(
          "[NaverLoginService] 네이티브 로그아웃 실패 (무시됨):",
          logoutError.message
        );
      }

      console.log("[NaverLoginService] 로그아웃 완료 (로컬 데이터 정리)");
      return true;
    } catch (error) {
      console.error("[NaverLoginService] 로그아웃 오류:", error);
      // 치명적인 오류가 아니면 true 반환 (로컬 정리는 성공했으므로)
      return true;
    }
  },

  // 토큰 삭제 (계정 연결 해제)
  deleteToken: async () => {
    try {
      if (!NaverLoginModule) {
        throw new Error("네이버 로그인 모듈을 찾을 수 없습니다");
      }

      console.log("[NaverLoginService] 토큰 삭제 시작");

      // 먼저 SDK를 재초기화하여 상태 정리
      try {
        await NaverLoginService.initialize();
      } catch (initError) {
        console.warn(
          "[NaverLoginService] 토큰 삭제 전 초기화 실패 (무시됨):",
          initError.message
        );
      }

      // 로컬 스토리지에서 토큰 정보 제거
      await AsyncStorage.removeItem(NAVER_TOKEN_KEY);

      // 추가로 관련 데이터 제거
      const keys = ["@naver_login_data", "@naver_profile", "@naver_user_info"];

      await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

      // 네이티브 토큰 삭제 시도 (실패해도 계속 진행)
      try {
        if (NaverLoginModule.deleteToken) {
          const result = await NaverLoginModule.deleteToken();
          console.log("[NaverLoginService] 네이티브 토큰 삭제 결과:", result);
        }
      } catch (tokenError) {
        console.warn(
          "[NaverLoginService] 네이티브 토큰 삭제 실패 (무시됨):",
          tokenError.message
        );
      }

      console.log("[NaverLoginService] 토큰 삭제 완료 (로컬 데이터 정리)");
      return true;
    } catch (error) {
      console.error("[NaverLoginService] 토큰 삭제 오류:", error);
      // 치명적인 오류가 아니면 true 반환 (로컬 정리는 성공했으므로)
      return true;
    }
  },

  // 계정 연결 해제 (전체 과정)
  unlinkAccount: async () => {
    try {
      console.log("[NaverLoginService] 계정 연결 해제 시작");

      // 1단계: 초기화
      try {
        await NaverLoginService.initialize();
      } catch (initError) {
        console.warn(
          "[NaverLoginService] 연결 해제 전 초기화 실패 (무시됨):",
          initError.message
        );
      }

      // 2단계: 로그아웃
      await NaverLoginService.logout();

      // 3단계: 토큰 삭제
      await NaverLoginService.deleteToken();

      // 4단계: 모든 관련 데이터 삭제
      const keys = [
        "@naver_token",
        "@naver_login_data",
        "@naver_profile",
        "@naver_user_info",
        "@user_auth_data", // 기존 인증 데이터
      ];

      await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

      console.log("[NaverLoginService] 계정 연결 해제 완료");
      return true;
    } catch (error) {
      console.error("[NaverLoginService] 계정 연결 해제 오류:", error);
      // 치명적인 오류가 아니면 true 반환 (최대한 데이터 정리 시도)
      return true;
    }
  },
};

export default NaverLoginService;
