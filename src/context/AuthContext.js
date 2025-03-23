// src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { useGoogleAuth } from "../services/AuthService";
import NaverLoginService from "../services/NaverLoginService";

// 중요 상수 정의
const USER_AUTH_KEY = "@user_auth_data";
const SUBSCRIPTION_KEY = "@user_subscription";
const TERMS_AGREED_KEY = "@user_terms_agreed";

// AuthContext 생성
const AuthContext = createContext(null);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  // 기본 상태
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // 리스너 관리를 위한 ref
  const authListenerRef = useRef(null);
  const initCompleted = useRef(false);

  // AuthService의 훅 사용
  const {
    signInWithGoogle,
    signInWithNaver,
    signInWithKakao,
    signOut: serviceSignOut,
    getCurrentUser,
    setupAuthListener,
    deleteAccount: deleteUserAccount,
    unlinkKakaoAccount,
    unlinkNaverAccount,
  } = useGoogleAuth();

  // 초기 인증 상태 확인 (앱 시작 시 한 번만 실행)
  useEffect(() => {
    // 이미 초기화가 완료되었다면 다시 실행하지 않음
    if (initCompleted.current) return;

    const initAuth = async () => {
      try {
        setLoading(true);
        console.log("인증 상태 초기화 중...");

        // 로컬 스토리지에서 사용자 데이터 확인
        const storedUserData = await AsyncStorage.getItem(USER_AUTH_KEY);

        if (storedUserData) {
          // 저장된 사용자 데이터가 있으면 복원
          const userData = JSON.parse(storedUserData);
          console.log(
            "저장된 사용자 발견:",
            userData.displayName || "알 수 없음"
          );

          // 약관 동의 상태 확인
          const hasAgreedToTerms = await AsyncStorage.getItem(TERMS_AGREED_KEY);
          setTermsAgreed(hasAgreedToTerms === "true");

          // 사용자 상태 설정
          setUser(userData);
        } else {
          // 저장된 데이터가 없으면 리스너 설정
          console.log("저장된 사용자 데이터 없음, 리스너 설정");
          authListenerRef.current = setupAuthListener((authUser) => {
            console.log(
              "Auth 리스너 호출:",
              authUser ? "사용자 존재" : "사용자 없음"
            );

            if (authUser) {
              setUser(authUser);
              AsyncStorage.setItem(
                USER_AUTH_KEY,
                JSON.stringify(authUser)
              ).catch((err) => console.warn("사용자 데이터 저장 오류:", err));
            } else {
              setUser(null);
            }
          });
        }
      } catch (err) {
        console.error("인증 초기화 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
        initCompleted.current = true;
      }
    };

    initAuth();

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      if (authListenerRef.current) {
        console.log("AuthContext 언마운트: 리스너 정리");
        authListenerRef.current();
        authListenerRef.current = null;
      }
    };
  }, []); // 빈 의존성 배열로 최초 한 번만 실행

  // Google 로그인 처리
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("AuthContext: googleSignIn 함수 호출 직전");
      const userData = await signInWithGoogle();
      console.log(
        "AuthContext: googleSignIn 함수 호출 완료, 결과:",
        !!userData
      );

      if (userData) {
        console.log(
          "구글 로그인 성공, 사용자:",
          userData.displayName || "알 수 없음"
        );

        // 사용자 데이터 저장
        try {
          await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
          console.log("사용자 데이터가 AsyncStorage에 저장됨");
        } catch (storageError) {
          console.warn("AsyncStorage에 사용자 저장 실패:", storageError);
        }

        // 상태 업데이트
        setUser(userData);
        return true;
      }

      console.log("구글 로그인 실패 또는 취소됨");
      return false;
    } catch (err) {
      console.error("Google 로그인 오류:", err);
      setError(err.message || "Google 로그인 중 오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 네이버 로그인 처리
  const loginWithNaver = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("AuthContext: naverSignIn 함수 호출 직전");
      const userData = await signInWithNaver();
      console.log("AuthContext: naverSignIn 함수 호출 완료, 결과:", !!userData);

      if (userData) {
        console.log(
          "네이버 로그인 성공, 사용자:",
          userData.displayName || "알 수 없음"
        );

        // 사용자 데이터 저장
        try {
          await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
          console.log("네이버 사용자 데이터가 AsyncStorage에 저장됨");
        } catch (storageError) {
          console.warn("AsyncStorage에 네이버 사용자 저장 실패:", storageError);
        }

        // 상태 업데이트
        setUser(userData);
        return true;
      }

      console.log("네이버 로그인 실패 또는 취소됨");
      return false;
    } catch (err) {
      console.error("네이버 로그인 오류:", err);
      setError(err.message || "네이버 로그인 중 오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 네이버 로그인 핸들러 (MyPage 등에서 사용)
  const handleNaverLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("네이버 로그인 초기화 중...");
      await NaverLoginService.initialize();

      console.log("네이버 로그인 시작...");
      const result = await NaverLoginService.login();

      if (!result) {
        console.log("네이버 로그인 취소 또는 실패");
        setLoading(false);
        return false;
      }

      // 사용자 데이터 구성
      const userData = {
        uid: `naver-${result.profile.id}`,
        email: result.profile.email || "",
        displayName:
          result.profile.name || result.profile.nickname || "네이버 사용자",
        photoURL: result.profile.profile_image || null,
        authProvider: "naver",
        accessToken: result.accessToken,
      };

      // 사용자 데이터 저장 및 상태 업데이트
      await saveUserData(userData);
      setUserData(userData);
      setUserState(USER_STATES.SIGNED_IN);

      return true;
    } catch (error) {
      console.error("네이버 로그인 오류:", error);
      console.error("오류 타입:", typeof error);
      console.error("오류 메시지:", error?.message);

      setError("네이버 로그인 중 오류가 발생했습니다.");

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 처리
  const loginWithKakao = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("AuthContext: kakaoSignIn 함수 호출 직전");
      const userData = await signInWithKakao();
      console.log("AuthContext: kakaoSignIn 함수 호출 완료, 결과:", !!userData);

      if (userData) {
        console.log(
          "카카오 로그인 성공, 사용자:",
          userData.displayName || "알 수 없음"
        );

        // 사용자 데이터 저장
        try {
          await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
          console.log("카카오 사용자 데이터가 AsyncStorage에 저장됨");
        } catch (storageError) {
          console.warn("AsyncStorage에 카카오 사용자 저장 실패:", storageError);
        }

        // 상태 업데이트
        setUser(userData);
        return true;
      }

      console.log("카카오 로그인 실패 또는 취소됨");
      return false;
    } catch (err) {
      console.error("카카오 로그인 오류:", err);
      setError(err.message || "카카오 로그인 중 오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 처리
  const logout = async () => {
    try {
      console.log("로그아웃 시작...");
      setLoading(true);

      // 현재 인증 제공자 확인
      const userData = await AsyncStorage.getItem(USER_AUTH_KEY);
      const currentUser = userData ? JSON.parse(userData) : null;
      const authProvider = currentUser?.authProvider || "unknown";

      console.log("Current auth provider:", authProvider);

      // 인증 제공자별 로그아웃 처리
      try {
        await serviceSignOut();
        console.log("서비스 로그아웃 성공");
      } catch (signOutError) {
        console.warn("서비스 로그아웃 오류:", signOutError);
      }

      // AsyncStorage에서 사용자 데이터 및 구독 정보 삭제
      try {
        await Promise.all([
          AsyncStorage.removeItem(USER_AUTH_KEY),
          AsyncStorage.removeItem(SUBSCRIPTION_KEY),
        ]);
        console.log("로컬 저장소 데이터 삭제 완료");
      } catch (storageError) {
        console.error("AsyncStorage 삭제 오류:", storageError);
      }

      // 인증 리스너 정리
      if (authListenerRef.current) {
        authListenerRef.current();
        authListenerRef.current = null;
      }

      // 상태 업데이트
      setUser(null);
      console.log("로그아웃 완료");

      // 초기화 플래그 재설정 - 다음 로그인을 위해
      initCompleted.current = false;

      return true;
    } catch (error) {
      console.error("로그아웃 오류:", error);
      setError(error.message || "로그아웃 중 오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 계정 삭제 처리
  const deleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("계정 삭제 시작...");

      if (user) {
        // 소셜 계정 연동 해제
        if (user.authProvider === "kakao") {
          try {
            const success = await unlinkKakaoAccount();
            console.log("카카오 계정 연동 해제:", success ? "성공" : "실패");
          } catch (unlinkError) {
            console.warn("카카오 계정 연동 해제 오류:", unlinkError);
          }
        } else if (user.authProvider === "naver") {
          try {
            const success = await unlinkNaverAccount();
            console.log("네이버 계정 연동 해제:", success ? "성공" : "실패");
          } catch (unlinkError) {
            console.warn("네이버 계정 연동 해제 오류:", unlinkError);
          }
        }

        // Firebase 계정 삭제
        try {
          await deleteUserAccount();
          console.log("Firebase 계정 삭제 성공");
        } catch (deleteError) {
          console.warn("Firebase 계정 삭제 오류:", deleteError);
        }
      }

      // 사용자 관련 모든 데이터 삭제
      const keysToRemove = [
        USER_AUTH_KEY,
        SUBSCRIPTION_KEY,
        TERMS_AGREED_KEY,
        "@user_points",
        "@user_level",
        "@user_streak",
        "@user_completed_tasks",
        "@task_completion_data",
        "@user_badges",
        "@user_settings",
      ];

      await Promise.all(
        keysToRemove.map((key) => AsyncStorage.removeItem(key))
      );
      console.log("사용자 데이터 삭제 완료");

      // 인증 리스너 정리
      if (authListenerRef.current) {
        authListenerRef.current();
        authListenerRef.current = null;
      }

      // 초기화 플래그 재설정
      initCompleted.current = false;

      // 상태 업데이트
      setUser(null);
      console.log("계정 삭제 완료");

      return true;
    } catch (err) {
      console.error("계정 삭제 오류:", err);
      setError(err.message || "계정 삭제 중 오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 약관 동의 설정
  const setTermsAgreementStatus = async (agreed) => {
    try {
      await AsyncStorage.setItem(TERMS_AGREED_KEY, agreed ? "true" : "false");
      setTermsAgreed(agreed);
      return true;
    } catch (error) {
      console.error("약관 동의 상태 저장 오류:", error);
      return false;
    }
  };

  // 컨텍스트 값 정의
  const contextValue = {
    userData: user,
    user,
    loading,
    error,
    isLoggedIn: !!user,
    termsAgreed,
    loginWithGoogle,
    loginWithNaver,
    loginWithKakao,
    handleNaverLogin,
    logout,
    deleteAccount,
    setTermsAgreementStatus,
    setUser, // setUser 함수를 명시적으로 추가
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  }
  return context;
};
