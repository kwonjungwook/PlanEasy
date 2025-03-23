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
import {
  login as kakaoLogin,
  getProfile as kakaoGetProfile,
  logout as kakaoLogout,
  unlink as kakaoUnlink,
} from "@react-native-seoul/kakao-login";
import NaverLoginService from "../services/NaverLoginService";

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

    if (result && result.accessToken) {
      console.log("네이버 로그인 성공:", result);

      // 사용자 데이터 형태 생성
      const userData = {
        uid: `naver-${Date.now()}`, // 임시 ID
        email: "", // 프로필 정보 별도 호출 필요
        displayName: "네이버 사용자", // 프로필 정보 별도 호출 필요
        photoURL: null,
        authProvider: "naver",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
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
 * Sign in with Kakao - Native implementation
 * @returns {Promise<Object|null>} User data or null
 */
const signInWithKakaoNative = async () => {
  try {
    console.log("Attempting Kakao sign-in");

    // Verify login function
    if (typeof kakaoLogin !== "function") {
      throw new Error("Kakao login function not found");
    }

    // Perform sign-in with timeout protection
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Kakao login timed out (15 seconds)"));
      }, 15000);

      kakaoLogin()
        .then((token) => {
          clearTimeout(timeoutId);
          console.log("Kakao login successful, token obtained");

          // Get profile information
          if (typeof kakaoGetProfile === "function") {
            kakaoGetProfile()
              .then((profile) => {
                console.log("Kakao profile retrieved successfully");

                const userData = createUserData(
                  {
                    id: profile.id || Date.now(),
                    email: profile.email || "",
                    nickname: profile.nickname || "Kakao User",
                    profileImageUrl: profile.profileImageUrl || null,
                  },
                  "kakao"
                );

                // Add token to user data
                userData.accessToken = token.accessToken;

                saveUserData(userData)
                  .then(() => resolve(userData))
                  .catch((err) => reject(err));
              })
              .catch((profileErr) => {
                console.error("Failed to retrieve Kakao profile:", profileErr);

                // Create limited user data without profile
                const limitedUserData = createUserData(
                  {
                    id: Date.now(),
                    nickname: "Kakao User",
                  },
                  "kakao"
                );

                // Add token to user data
                limitedUserData.accessToken = token.accessToken;

                saveUserData(limitedUserData)
                  .then(() => resolve(limitedUserData))
                  .catch((err) => reject(err));
              });
          } else {
            console.warn("kakaoGetProfile function not found");

            // Create basic user data
            const basicUserData = createUserData(
              {
                id: Date.now(),
                nickname: "Kakao User",
              },
              "kakao"
            );

            // Add token to user data
            basicUserData.accessToken = token.accessToken;

            saveUserData(basicUserData)
              .then(() => resolve(basicUserData))
              .catch((err) => reject(err));
          }
        })
        .catch((loginErr) => {
          clearTimeout(timeoutId);
          console.error("Kakao login error:", loginErr);
          reject(loginErr);
        });
    });
  } catch (error) {
    console.error("Kakao sign-in preparation error:", error);
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

    // Check for deleteToken method
    if (typeof NaverLoginService.deleteToken === "function") {
      await NaverLoginService.deleteToken();
      console.log("Naver account unlinked successfully");
      return true;
    } else {
      console.error("NaverLoginService.deleteToken method not found");
      return false;
    }
  } catch (error) {
    console.error("Failed to unlink Naver account:", error);
    return false;
  }
};

/**
 * Unlink Kakao account
 * @returns {Promise<boolean>} Success status
 */
const unlinkKakaoAccount = async () => {
  try {
    console.log("Attempting to unlink Kakao account");

    if (typeof kakaoUnlink !== "function") {
      throw new Error("Kakao unlink function not found");
    }

    await kakaoUnlink();
    console.log("Kakao account unlinked successfully");
    return true;
  } catch (error) {
    console.error("Failed to unlink Kakao account:", error);
    return false;
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
   * Sign in with Kakao
   * @returns {Promise<Object|null>} User data or null
   */
  const signInWithKakao = async () => {
    try {
      console.log("Starting Kakao sign-in process");
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
          if (typeof kakaoLogout === "function") {
            await kakaoLogout();
            console.log("Signed out from Kakao");
          }
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

      const currentUser = auth.currentUser;

      // Delete Firebase account if available
      if (currentUser) {
        await currentUser.delete();
        console.log("Firebase account deleted");
      } else {
        console.log("No Firebase account to delete");
      }

      // Clear local storage
      await AsyncStorage.removeItem(USER_AUTH_KEY);

      // Sign out from all providers
      await signOut();

      console.log("Account deletion complete");
      return true;
    } catch (error) {
      console.error("Account deletion error:", error);
      throw error;
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
