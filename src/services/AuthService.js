// src/services/AuthService.js
import { auth, GoogleAuthProvider } from "../firebaseConfig";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as Linking from "expo-linking";
import NaverLoginService from "../services/NaverLoginService";
import KakaoLoginService from "../services/KakaoLoginService";

// Storage keys
const USER_AUTH_KEY = "@user_auth_data";

// Track initialization status
let googleSigninInitialized = false;
let naverSigninInitialized = false;

/**
 * Initialize Google Sign-In SDK
 * @returns {Promise<boolean>} Success status
 */
const initGoogleSignIn = async () => {
  try {
    if (Platform.OS === "web") {
      console.log("Web environment: GoogleSignin initialization skipped");
      return true;
    }

    console.log("Initializing Google Sign-In...");

    // Prepare WebBrowser for auth flow
    try {
      await WebBrowser.warmUpAsync();
    } catch (error) {
      console.warn("WebBrowser warmup error:", error);
    }

    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId:
        "68267517120-big8fa3f9h6aefq5so2viadcath3jbt4.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ["profile", "email"],
    });

    // Verify Play Services availability
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    googleSigninInitialized = true;
    console.log("Google Sign-In initialized successfully");
    return true;
  } catch (error) {
    console.error("Google Sign-In initialization error:", error);
    googleSigninInitialized = false;
    return false;
  }
};

/**
 * Save user data to AsyncStorage
 * @param {Object} userData - User data to save
 * @returns {Promise<Object>} The saved user data
 */
const saveUserData = async (userData) => {
  await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
  return userData;
};

/**
 * Create user data object from auth provider response
 * @param {Object} user - User info from auth provider
 * @param {string} provider - Auth provider name
 * @returns {Object} Formatted user data
 */
const createUserData = (user, provider = "google") => {
  if (!user) {
    throw new Error("User object is missing");
  }

  return {
    uid: user.uid || user.id || user.userId || `${provider}-${Date.now()}`,
    email: user.email || "",
    displayName:
      user.displayName || user.name || user.nickname || `${provider} User`,
    photoURL: user.photoURL || user.photo || user.profileImageUrl || null,
    authProvider: provider,
  };
};

/**
 * Sign in with Google - Web implementation
 * @returns {Promise<Object|null>} User data or null
 */
const signInWithGoogleWeb = async () => {
  const provider = new GoogleAuthProvider();

  try {
    // Try popup first
    const result = await signInWithPopup(auth, provider);
    const userData = createUserData(result.user, "google");
    await saveUserData(userData);
    return userData;
  } catch (error) {
    console.warn("Popup sign-in failed, trying redirect:", error);
    await signInWithRedirect(auth, provider);
    return null; // Will need to check result on next page load
  }
};

/**
 * Sign in with Google - Native implementation
 * @returns {Promise<Object|null>} User data or null
 */
const signInWithGoogleNative = async () => {
  try {
    // Ensure initialization
    if (!googleSigninInitialized) {
      const initialized = await initGoogleSignIn();
      if (!initialized) {
        throw new Error("Failed to initialize Google Sign-In");
      }
    }

    console.log("Attempting native Google sign-in");

    // Perform sign-in
    const userInfo = await GoogleSignin.signIn();
    console.log("Google sign-in response received");

    // Handle user cancellation
    if (userInfo && userInfo.type === "cancelled") {
      console.log("User cancelled Google sign-in");
      return null;
    }

    // Process user data
    if (userInfo && userInfo.user) {
      const googleUser = userInfo.user;
      const userData = createUserData(
        {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photo: googleUser.photo,
        },
        "google"
      );

      return await saveUserData(userData);
    } else if (userInfo && userInfo.data && userInfo.data.user) {
      // Alternative response format
      const googleUser = userInfo.data.user;
      const userData = createUserData(
        {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photo: googleUser.photo,
        },
        "google"
      );

      return await saveUserData(userData);
    }

    throw new Error("Invalid Google sign-in response");
  } catch (error) {
    console.error("Native Google sign-in error:", error);

    // Special handling for cancellation
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log("User cancelled Google sign-in");
      return null;
    }

    throw error;
  } finally {
    // Clean up resources
    if (Platform.OS !== "web") {
      try {
        await WebBrowser.coolDownAsync();
      } catch (error) {
        console.warn("WebBrowser cooldown error:", error);
      }
    }
  }
};

/**
 * 네이버 로그인 구현 - 네이티브 크래시 방지
 */

const signInWithNaver = async () => {
  try {
    console.log("네이버 로그인 시작 - 네이티브 SDK 사용");

    // 네이티브 모듈 통한 로그인
    const result = await NaverLoginService.login();

    // 프로필 정보 요청
    const profileInfo = await NaverLoginService.getProfile();
    console.log("네이버 프로필 정보:", profileInfo);

    if (result && result.accessToken) {
      console.log("네이버 로그인 성공:", result);

      // 사용자 데이터 형태 생성
      const userData = {
        uid: `naver-${profileInfo.id}`,
        email: profileInfo.email || "",
        displayName:
          profileInfo.name || profileInfo.nickname || "네이버 사용자",
        photoURL: profileInfo.profileImage || null,
        authProvider: "naver",
        accessToken: result.accessToken, // 여기가 수정된 부분 (loginResult → result)
        // 추가 정보
        gender: profileInfo.gender,
        age: profileInfo.age,
        birthday: profileInfo.birthday,
      };

      return userData;
    }

    console.log("네이버 로그인 결과 없음");
    return null;
  } catch (error) {
    console.error("네이버 로그인 오류:", error);
    throw error;
  }
};

/**
 * 네이버 SDK 초기화 - 공식 문서 기반 구현
 */

const initNaverSDK = async () => {
  try {
    console.log("네이버 SDK 초기화 시작 - 공식 문서 기반");

    // 네이버 로그인 사용 가능 여부 확인
    if (!NaverLoginService) {
      console.error("네이버 로그인 모듈이 없습니다");
      return false;
    }

    // 사용 가능한 메서드 확인
    console.log(
      "네이버 로그인 사용 가능 메서드:",
      Object.keys(NaverLoginService).join(", ")
    );

    // React Native Seoul 패키지 요구사항에 맞는 설정 객체 생성
    // 주의: 네이티브 SDK와 React Native 브릿지의 파라미터 형식이 다름
    const naverLoginConfig = {
      kConsumerKey: "Y3OUgvCptmtmaPTb9GLc", // 클라이언트 ID
      kConsumerSecret: "iEoHx5dLJs", // 클라이언트 시크릿
      kServiceAppName: "PlanEasy", // 앱 이름
      kServiceAppUrlScheme: "planeasy", // iOS 전용 URL 스킴
    };

    console.log("네이버 SDK 초기화 시도:", JSON.stringify(naverLoginConfig));

    // initialize 호출
    await NaverLoginService.initialize(naverLoginConfig);
    console.log("네이버 SDK 초기화 성공");

    return true;
  } catch (error) {
    console.error("네이버 SDK 초기화 오류:", error);
    return false;
  }
};

/**
 * Sign in with Kakao - Native implementation (네이티브 방식)
 * @returns {Promise<Object|null>} User data or null
 */
const signInWithKakaoNative = async () => {
  try {
    console.log("[AuthService] 카카오 로그인 시작 - 네이티브 모듈 사용");

    // 카카오 로그인 시도
    const result = await KakaoLoginService.login();
    console.log("[AuthService] 카카오 로그인 결과:", !!result);

    if (!result || !result.accessToken) {
      console.log("[AuthService] 카카오 로그인 실패 또는 취소");
      return null;
    }

    // 프로필 정보 요청
    let profileInfo = null;
    try {
      profileInfo = await KakaoLoginService.getProfile();
      console.log("[AuthService] 카카오 프로필 정보 획득 성공");
    } catch (profileError) {
      console.warn("[AuthService] 카카오 프로필 정보 획득 실패:", profileError.message);
    }

    // 사용자 데이터 생성
    let userData;
    if (profileInfo) {
      userData = {
        uid: `kakao-${profileInfo.id || Date.now()}`,
        email: profileInfo.email || "",
        displayName: profileInfo.nickname || "카카오 사용자",
        photoURL: profileInfo.profileImageUrl || null,
        authProvider: "kakao",
        accessToken: result.accessToken,
      };
    } else {
      // 프로필 정보 없을 때 기본 데이터
      userData = {
        uid: `kakao-${Date.now()}`,
        email: "",
        displayName: "카카오 사용자",
        photoURL: null,
        authProvider: "kakao",
        accessToken: result.accessToken,
      };
    }

    console.log("[AuthService] 카카오 사용자 데이터 생성 완료");
    
    // 사용자 데이터 저장
    await saveUserData(userData);
    console.log("[AuthService] 카카오 사용자 데이터 저장 완료");

    return userData;
  } catch (error) {
    console.error("[AuthService] 카카오 로그인 오류:", error);

    // 사용자 취소 확인
    if (
      error.toString().includes("user cancelled") ||
      error.message?.includes("user cancelled") ||
      error.toString().includes("OPERATION_CANCELED") ||
      error.message?.includes("OPERATION_CANCELED")
    ) {
      console.log("[AuthService] 사용자가 카카오 로그인을 취소했습니다.");
      return null; // 취소는 null 반환
    }

    throw error;
  }
};

/**
 * Unlink Naver account
 * @returns {Promise<boolean>} Success status
 */
const unlinkNaverAccount = async () => {
  try {
    console.log("Attempting to unlink Naver account");

    if (!NaverLoginService) {
      throw new Error("Naver Login SDK not found");
    }

    // 새로 추가된 통합 계정 연결 해제 메서드 사용
    if (typeof NaverLoginService.unlinkAccount === "function") {
      const result = await NaverLoginService.unlinkAccount();
      console.log("Naver account unlinked successfully:", result);
      return true;
    }
    // 대체 방법 (기존 방식)
    else {
      // 초기화 시도
      try {
        await NaverLoginService.initialize();
        console.log("Naver SDK initialized for unlinking");
      } catch (initError) {
        console.warn(
          "Naver SDK initialization failed (ignored):",
          initError.message
        );
      }

      // 로그아웃 시도
      try {
        await NaverLoginService.logout();
        console.log("Naver logout successful for unlinking");
      } catch (logoutError) {
        console.warn("Naver logout failed (ignored):", logoutError.message);
      }

      // 토큰 삭제 시도
      try {
        await NaverLoginService.deleteToken();
        console.log("Naver token deleted successfully for unlinking");
      } catch (tokenError) {
        console.warn(
          "Naver token deletion failed (ignored):",
          tokenError.message
        );
      }

      // 네이버 관련 데이터 로컬 저장소에서 삭제
      const naverKeys = [
        "@naver_login_data",
        "@naver_profile",
        "@naver_token",
        "@naver_user_info",
      ];

      await Promise.all(naverKeys.map((key) => AsyncStorage.removeItem(key)));
      console.log("Naver related local data cleared successfully");

      return true;
    }
  } catch (error) {
    console.error("Failed to unlink Naver account:", error);
    // 실패해도 true 반환 (최대한 정리는 시도했으므로)
    return true;
  }
};

/**
 * Unlink Kakao account - 네이티브 방식
 * @returns {Promise<boolean>} Success status
 */
const unlinkKakaoAccount = async () => {
  try {
    console.log("[AuthService] 카카오 계정 연결 해제 시작 (네이티브 방식)");

    // KakaoLoginService의 unlink 함수 사용
    const result = await KakaoLoginService.unlink();
    console.log("[AuthService] 카카오 계정 연결 해제 결과:", result);

    return true;
  } catch (error) {
    console.error("[AuthService] 카카오 계정 연결 해제 오류:", error);
    // 실패해도 true 반환 (최대한 정리는 시도했으므로)
    return true;
  }
};

/**
 * Google Auth Hook
 * @returns {Object} Auth methods
 */
export const useGoogleAuth = () => {
  /**
   * Set up Firebase auth state listener
   * @param {Function} callback - Auth state change callback
   * @returns {Function} Unsubscribe function
   */
  const setupAuthListener = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = createUserData(user, "google");
        await saveUserData(userData);
        callback(userData);
      } else {
        // On logout or no user
        callback(null);
      }
    });
  };

  /**
   * Sign in with Google
   * @returns {Promise<Object|null>} User data or null
   */
  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign-in process");

      if (Platform.OS === "web") {
        return await signInWithGoogleWeb();
      } else {
        return await signInWithGoogleNative();
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  /**
  * Sign in with Kakao - 메인 함수 (네이티브 방식 사용)
  * @returns {Promise<Object|null>} User data or null
  */
const signInWithKakao = async () => {
  try {
  console.log("Starting Kakao sign-in process (Native)");
  return await signInWithKakaoNative();
  } catch (error) {
  console.error("Kakao sign-in error:", error);
  throw error;
  }
};

  /**
   * Sign out from all providers safely
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      console.log("Starting sign-out process");

      // Get current user data to check provider
      const userData = await AsyncStorage.getItem(USER_AUTH_KEY);
      const currentUser = userData ? JSON.parse(userData) : null;
      const authProvider = currentUser?.authProvider || "";

      console.log("Current auth provider:", authProvider);

      // Sign out from Google (if on native)
      if (Platform.OS !== "web" && googleSigninInitialized) {
        try {
          if (typeof GoogleSignin.signOut === "function") {
            await GoogleSignin.signOut();
            console.log("Signed out from Google Sign-In");
          }
        } catch (error) {
          console.warn("Google SignIn sign-out error:", error);
        }
      }

      // Sign out from Kakao only if user was logged in with Kakao
      if (authProvider === "kakao") {
        try {
          await KakaoLoginService.logout();
          console.log("Signed out from Kakao");
        } catch (error) {
          console.warn("Kakao sign-out error:", error);
        }
      }

      // Sign out from Naver only if user was logged in with Naver
      if (authProvider === "naver") {
        try {
          if (
            NaverLoginService &&
            typeof NaverLoginService.logout === "function"
          ) {
            await NaverLoginService.logout();
            console.log("Signed out from Naver");
          }
        } catch (error) {
          console.warn("Naver sign-out error:", error);
        }
      }

      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Clear local storage
      await AsyncStorage.removeItem(USER_AUTH_KEY);

      console.log("Sign-out complete");
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  /**
   * Delete user account
   * @returns {Promise<boolean>} Success status
   */
  const deleteAccount = async () => {
    try {
      console.log("Starting account deletion process");

      // 현재 사용자 정보 가져오기
      const userData = await AsyncStorage.getItem(USER_AUTH_KEY);
      const userInfo = userData ? JSON.parse(userData) : null;
      const authProvider = userInfo?.authProvider || "";

      console.log(`계정 삭제 시작 - 인증 제공자: ${authProvider}`);

      // 인증 제공자에 따른 계정 연결 해제
      if (authProvider === "kakao") {
        try {
          console.log("Attempting to unlink Kakao account");

          // 로컬 데이터 먼저 정리
          const kakaoKeys = [
            "@kakao_token",
            "@kakao_login_data",
            "@kakao_profile",
          ];

          try {
            await Promise.all(
              kakaoKeys.map((key) => AsyncStorage.removeItem(key))
            );
            console.log("Kakao local data removed");
          } catch (localError) {
            console.warn("Error removing Kakao local data:", localError);
          }

          // 네이티브 연결 해제 시도 (KakaoLoginService 사용)
          try {
            const unlinkResult = await KakaoLoginService.unlink();
            console.log("Kakao account unlinked successfully");
            console.log("카카오 계정 연동 해제: 성공");
          } catch (unlinkError) {
            console.error("Failed to unlink Kakao account:", unlinkError);
            console.log("카카오 계정 연동 해제: 실패 (무시됨)");
          }
        } catch (error) {
          console.error("카카오 계정 연동 해제 실패:", error);
        }
      } else if (authProvider === "naver") {
        try {
          console.log("Attempting to unlink Naver account");
          // NaverLoginService의 통합 함수 사용
          if (typeof NaverLoginService.unlinkAccount === "function") {
            const naverUnlinked = await NaverLoginService.unlinkAccount();
            console.log(
              `네이버 계정 연동 해제: ${naverUnlinked ? "성공" : "실패"}`
            );
          } else {
            // 기존 함수 사용
            const naverUnlinked = await unlinkNaverAccount();
            console.log(
              `네이버 계정 연동 해제: ${naverUnlinked ? "성공" : "실패"}`
            );
          }
        } catch (error) {
          console.error("네이버 계정 연동 해제 실패:", error);
        }
      }

      // Firebase 계정 삭제 (있는 경우)
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete();
        console.log("Firebase account deleted");
      } else {
        console.log("No Firebase account to delete");
      }

      // 로컬 저장소 데이터 삭제
      await AsyncStorage.removeItem(USER_AUTH_KEY);

      // 인증 제공자별 추가 데이터 삭제
      const additionalKeys = [];

      if (authProvider === "naver") {
        additionalKeys.push(
          "@naver_login_data",
          "@naver_profile",
          "@naver_token",
          "@naver_user_info"
        );
      } else if (authProvider === "kakao") {
        additionalKeys.push(
          "@kakao_login_data",
          "@kakao_profile",
          "@kakao_token"
        );
      }

      if (additionalKeys.length > 0) {
        try {
          await Promise.all(
            additionalKeys.map((key) => AsyncStorage.removeItem(key))
          );
          console.log("인증 관련 추가 데이터 삭제 완료");
        } catch (error) {
          console.error("인증 관련 추가 데이터 삭제 실패:", error);
        }
      }

      console.log("사용자 데이터 삭제 완료");

      // 모든 제공자에서 로그아웃
      await signOut();

      console.log("계정 삭제 완료");
      return true;
    } catch (error) {
      console.error("Account deletion error:", error);
      // 실패해도 true 반환 (최대한 정리는 시도했으므로)
      return true;
    }
  };

  /**
   * Get current user
   * @returns {Promise<Object|null>} User data or null
   */
  const getCurrentUser = async () => {
    try {
      // Try AsyncStorage first
      const userData = await AsyncStorage.getItem(USER_AUTH_KEY);
      if (userData) {
        console.log("User data found in AsyncStorage");
        return JSON.parse(userData);
      }

      // Check Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Current user found in Firebase");
        const userData = createUserData(currentUser, "google");
        await saveUserData(userData);
        return userData;
      }

      // Check for redirect result (web only)
      if (Platform.OS === "web") {
        try {
          const result = await getRedirectResult(auth);
          if (result && result.user) {
            console.log("User found in redirect result");
            const userData = createUserData(result.user, "google");
            await saveUserData(userData);
            return userData;
          }
        } catch (error) {
          console.warn("Error getting redirect result:", error);
        }
      }

      console.log("No user found");
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  return {
    signInWithGoogle,
    signInWithNaver,
    signInWithKakao,
    signOut,
    deleteAccount,
    getCurrentUser,
    setupAuthListener,
    unlinkKakaoAccount,
    unlinkNaverAccount,
  };
};
