//screens/LoginScreens.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ToastAndroid,
  NativeModules,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NaverLoginService from "../services/NaverLoginService";
// import KakaoLoginWebView from "../components/KakaoLoginWebView"; // 네이티브 방식으로 인해 사용 안 함

// 사용자 데이터 스토리지 키 상수
const USER_AUTH_KEY = "@user_auth_data";

// 크로스 플랫폼 토스트 함수
const showToast = (message) => {
  if (Platform.OS === "android") {
    ToastAndroid.showWithGravityAndOffset(
      message,
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
      0,
      50
    );
  } else {
    Alert.alert("", message, [{ text: "확인", style: "cancel" }], {
      cancelable: true,
    });
  }
};

const LoginScreen = ({ route, navigation }) => {
  // 파라미터 수신 부분 수정 (route.params 안전하게 접근)
  const returnToScreen = route?.params?.returnToScreen || "Main";
  const shouldReturnToHome =
    route?.params?.returnToHome === true ||
    route?.params?.returnToHome === "true";

  console.log(`Login screen opened with returnToScreen: ${returnToScreen}, shouldReturnToHome: ${shouldReturnToHome}, 
  type: ${typeof route?.params?.returnToHome}, raw value: ${
    route?.params?.returnToHome
  }`);

  const {
    loginWithGoogle,
    loginWithNaver,
    loginWithKakao,
    loading: authLoading,
    error,
    isLoggedIn,
    setUser, // useAuth에서 setUser 가져오기
  } = useAuth();

  const [loginStatus, setLoginStatus] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [navigationAttempted, setNavigationAttempted] = useState(false);
  const navigationInProgress = useRef(false);
  // 중복 리스너 문제 해결을 위한 ref 추가
  const focusListenerRef = useRef(null);
  // 로딩 타임아웃 처리를 위한 변수
  const [loadingTimeout, setLoadingTimeout] = useState(null);
  // 카카오 WebView 상태 제거 (네이티브 방식 사용)
  // const [showKakaoWebView, setShowKakaoWebView] = useState(false);

  // 로그인 성공 시 네비게이션 처리 부분을 찾아서 이렇게 수정하세요
  useEffect(() => {
    if (isLoggedIn && !navigationAttempted && !navigationInProgress.current) {
      console.log("로그인 성공 감지, 화면 이동 준비");
      setNavigationAttempted(true);
      navigationInProgress.current = true;

      showToast("로그인 성공!");

      // 약관 동의 확인 및 화면 이동 처리
      const handleNavigation = async () => {
        try {
          console.log("로그인 후 화면 이동 처리 시작");

          // 약관 동의 상태 확인
          const hasAgreedToTerms = await AsyncStorage.getItem(
            "@user_terms_agreed"
          );
          console.log(
            "약관 동의 상태:",
            hasAgreedToTerms === "true" ? "동의함" : "미동의"
          );

          if (hasAgreedToTerms !== "true") {
            console.log("약관 동의 필요, 약관 화면으로 이동");
            navigation.navigate("TermsAgreement", {
              returnTo: returnToScreen || "Main",
              shouldReturnToHome: shouldReturnToHome,
            });
          } else {
            // 약관 동의 완료 시 목적지로 이동 (이 부분을 수정)
            console.log(
              `약관 동의 완료, 대상 화면: ${returnToScreen || "Main"}`
            );

            if (shouldReturnToHome || returnToScreen === "Main") {
              console.log("메인 화면으로 리셋");
              // 애니메이션 없이 즉시 교체하는 방식으로 변경
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
                key: null, // 키 제거로 이전 스택 완전히 초기화
              });
            } else {
              console.log(`${returnToScreen} 화면으로 교체`);
              // replace 대신 navigate를 사용하고 이동 옵션 추가
              navigation.navigate(
                returnToScreen,
                {},
                {
                  animation: "none", // 애니메이션 비활성화
                }
              );
            }
          }
        } catch (error) {
          console.error("화면 이동 처리 오류:", error);
          // 오류 시 기본 화면으로 이동
          navigation.navigate("Main");
        } finally {
          // 이동 완료 후 플래그 초기화
          navigationInProgress.current = false;
        }
      };
    }
  }, [
    isLoggedIn,
    navigation,
    returnToScreen,
    shouldReturnToHome,
    navigationAttempted,
  ]);

  // 로딩 상태가 10초 이상 지속되면 타임아웃 처리
  useEffect(() => {
    if (localLoading) {
      const timeout = setTimeout(() => {
        console.log("로그인 처리 타임아웃 - 10초 경과");
        setLocalLoading(false);
        Alert.alert(
          "로그인 실패",
          "로그인 처리 시간이 초과되었습니다. 다시 시도해주세요.",
          [{ text: "확인" }]
        );
      }, 10000);

      setLoadingTimeout(timeout);

      return () => {
        clearTimeout(timeout);
        setLoadingTimeout(null);
      };
    }
  }, [localLoading]);

  // 수정된 useEffect - 포커스 리스너 개선
  useEffect(() => {
    // 로그인 화면에 포커스될 때마다 실행되는 함수
    const handleScreenFocus = () => {
      console.log(
        "로그인 화면 포커스됨, 파라미터:",
        JSON.stringify({
          returnToScreen,
          shouldReturnToHome,
        })
      );

      // 이미 로그인된 상태에서 로그인 화면이 다시 열리면 자동으로 돌아가기
      if (isLoggedIn) {
        console.log(
          "이미 로그인된 상태에서 로그인 화면 열림, 이전 화면으로 돌아가기"
        );
        navigation.goBack();
        return;
      }

      // 상태 초기화 (필요한 경우에만)
      if (navigationAttempted) {
        console.log("네비게이션 시도 상태 초기화");
        setNavigationAttempted(false);
      }

      // 진행 중 플래그 초기화
      navigationInProgress.current = false;

      // 로딩 상태 초기화
      if (localLoading) {
        setLocalLoading(false);
      }
    };

    // 기존 리스너가 있으면 정리
    if (focusListenerRef.current) {
      focusListenerRef.current();
      focusListenerRef.current = null;
    }

    // 포커스 이벤트 구독
    console.log("로그인 화면: 포커스 리스너 등록");
    focusListenerRef.current = navigation.addListener(
      "focus",
      handleScreenFocus
    );

    // 초기 마운트 시 한 번 실행
    handleScreenFocus();

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      console.log("로그인 화면: 포커스 리스너 정리");
      if (focusListenerRef.current) {
        focusListenerRef.current();
        focusListenerRef.current = null;
      }

      // 타임아웃 정리
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };
  }, [
    navigation,
    isLoggedIn,
    returnToScreen,
    shouldReturnToHome,
    navigationAttempted,
    localLoading,
    loadingTimeout,
  ]);

  // Google 로그인 처리
  const handleGoogleSignIn = async () => {
    try {
      setLoginStatus("구글 로그인 준비 중...");
      setLocalLoading(true);
      setNavigationAttempted(false); // 새 로그인 시도에 대비해 재설정

      // 약간의 지연으로 UI 피드백 제공
      await new Promise((resolve) => setTimeout(resolve, 300));

      setLoginStatus("구글 로그인 진행 중...");
      console.log("Attempting Google login...");

      const success = await loginWithGoogle();
      console.log(`Google login result: ${success ? "Success" : "Failed"}`);

      if (success === null) {
        // 사용자가 로그인 취소
        setLoginStatus("로그인이 취소되었습니다.");
        setLocalLoading(false);
        return;
      }

      if (success) {
        setLoginStatus("로그인 성공! 이동합니다...");
        // 네비게이션은 useEffect에서 처리됨
      } else {
        setLoginStatus("로그인에 실패했습니다. 다시 시도해주세요.");
        setLocalLoading(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setLoginStatus("로그인 오류가 발생했습니다.");
      Alert.alert(
        "로그인 오류",
        "구글 로그인 중 문제가 발생했습니다. 다시 시도해주세요.",
        [{ text: "확인" }]
      );
      setLocalLoading(false);
    }
  };

  // 개선된 네이버 로그인 처리
  const handleNaverSignIn = async () => {
    try {
      setLoginStatus("네이버 로그인 준비 중...");
      setLocalLoading(true);
      setNavigationAttempted(false);

      // 약간의 지연으로 UI 피드백 제공
      await new Promise((resolve) => setTimeout(resolve, 300));

      setLoginStatus("네이버 로그인 진행 중...");
      console.log("네이버 로그인 시도...");

      // 네이티브 모듈 정보 출력 (디버깅용)
      console.log(
        "네이티브 모듈 상태:",
        Object.keys(NativeModules).includes("NaverLoginModule")
          ? "존재"
          : "없음"
      );

      // 간소화된 로그인 메서드 사용
      console.log("간소화된 네이버 로그인 메서드 사용");
      const result = await NaverLoginService.loginSimple();
      console.log("간소화된 네이버 로그인 응답:", JSON.stringify(result));

      if (result && result.accessToken) {
        // 프로필 정보 요청 추가
        console.log("네이버 프로필 정보 요청 시작");

        try {
          const profileInfo = await NaverLoginService.getProfile();
          console.log("네이버 프로필 정보 응답:", JSON.stringify(profileInfo));

          // 사용자 데이터 생성 (프로필 정보 포함)
          const userData = {
            uid: `naver-${profileInfo.id || Date.now()}`, // 네이버 ID 기반 고유 식별자
            email: profileInfo.email || "",
            displayName:
              profileInfo.name || profileInfo.nickname || "네이버 사용자",
            photoURL: profileInfo.profileImage || null,
            authProvider: "naver",
            accessToken: result.accessToken,
            // 추가 정보
            gender: profileInfo.gender,
            age: profileInfo.age,
            birthday: profileInfo.birthday,
          };

          console.log("네이버 사용자 데이터 생성:", JSON.stringify(userData));

          // 사용자 데이터 저장 처리
          await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
          console.log("네이버 사용자 데이터 AsyncStorage에 저장 완료");

          // AuthContext에 사용자 데이터 설정
          if (typeof setUser === "function") {
            console.log("AuthContext에 사용자 데이터 설정 중");
            setUser(userData);
            console.log("AuthContext 사용자 데이터 설정 완료");
          } else {
            console.error("setUser 함수를 찾을 수 없음");
            throw new Error("인증 컨텍스트 오류: setUser 함수가 없습니다");
          }

          setLoginStatus("네이버 로그인 성공! 이동합니다...");
          return true;
        } catch (profileError) {
          console.error("프로필 정보 요청 실패:", profileError);

          // 프로필 요청 실패 시 기본 정보로 대체
          const userData = {
            uid: `naver-${Date.now()}`,
            email: "",
            displayName: "네이버 사용자",
            photoURL: null,
            authProvider: "naver",
            accessToken: result.accessToken,
          };

          // 사용자 데이터 저장 처리
          await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(userData));
          console.log(
            "네이버 사용자 데이터 AsyncStorage에 저장 완료 (기본 정보)"
          );

          // AuthContext에 사용자 데이터 설정
          if (typeof setUser === "function") {
            console.log("AuthContext에 사용자 데이터 설정 중");
            setUser(userData);
            console.log("AuthContext 사용자 데이터 설정 완료");
          } else {
            console.error("setUser 함수를 찾을 수 없음");
            throw new Error("인증 컨텍스트 오류: setUser 함수가 없습니다");
          }

          // 프로필 정보 없이도 로그인은 성공처리
          setLoginStatus(
            "네이버 로그인 성공! (프로필 정보 없음) 이동합니다..."
          );
          return true;
        }
      } else {
        console.error("네이버 로그인 결과 없음");
        setLoginStatus("네이버 로그인에 실패했습니다. 다시 시도해주세요.");
        setLocalLoading(false);
        return false;
      }
    } catch (error) {
      console.error("네이버 로그인 오류:", error);
      console.error("오류 타입:", typeof error);
      console.error("오류 메시지:", error.message);

      setLoginStatus("로그인 오류가 발생했습니다.");
      Alert.alert(
        "로그인 오류",
        `네이버 로그인 중 문제가 발생했습니다: ${
          error.message || "알 수 없는 오류"
        }`,
        [{ text: "확인" }]
      );
      setLocalLoading(false);
      return false;
    }
  };

  // 카카오 로그인 처리 (네이티브 방식)
  const handleKakaoSignIn = async () => {
    try {
      setLoginStatus("카카오 로그인 준비 중...");
      setLocalLoading(true);
      setNavigationAttempted(false);

      // UI 피드백 지연
      await new Promise((resolve) => setTimeout(resolve, 300));

      setLoginStatus("카카오 로그인 진행 중...");
      console.log("네이티브 방식 카카오 로그인 시작...");

      // AuthContext의 loginWithKakao 함수 호출
      const success = await loginWithKakao();
      console.log(`카카오 로그인 결과: ${success ? "성공" : "실패"}`);

      if (success === null) {
        // 사용자가 로그인 취소
        setLoginStatus("로그인이 취소되었습니다.");
        setLocalLoading(false);
        return;
      }

      if (success) {
        setLoginStatus("카카오 로그인 성공! 이동합니다...");
        // 네비게이션은 useEffect에서 처리됨
      } else {
        setLoginStatus("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
        setLocalLoading(false);
      }
    } catch (error) {
      console.error("Kakao login error:", error);
      setLoginStatus("카카오 로그인 오류가 발생했습니다.");
      
      // 네이티브 모듈 관련 에러 메시지 개선
      let errorMessage = "카카오 로그인 중 문제가 발생했습니다.";
      if (error.message && error.message.includes("모듈을 찾을 수 없습니다")) {
        errorMessage = "카카오 로그인 모듈이 설치되지 않았습니다. 앱을 재빌드해주세요.";
      }
      
      Alert.alert("로그인 오류", errorMessage, [{ text: "확인" }]);
      setLocalLoading(false);
    }
  };

  // 카카오 WebView 관련 함수들 제거 (더 이상 사용하지 않음)
  // const handleKakaoLoginSuccess는 삭제

  // 에러 표시
  useEffect(() => {
    if (error) {
      Alert.alert("로그인 오류", error);
    }
  }, [error]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 닫기 버튼 */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* 로고와 타이틀 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.appTitle}>플랜이지</Text>
          <Text style={styles.subtitle}>계획을 쉽게, 하루를 즐겁게</Text>
        </View>

        {/* 소셜 로그인 버튼 */}
        <View style={styles.socialButtonsContainer}>
          <Text style={styles.socialTitle}>소셜 계정으로 로그인</Text>

          {/* Google 로그인 버튼 */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={localLoading || authLoading}
          >
            {localLoading || authLoading ? (
              <ActivityIndicator size="small" color="#EA4335" />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color="#EA4335" />
                <Text style={styles.googleButtonText}>Google로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 네이버 로그인 버튼 */}
          <TouchableOpacity
            style={styles.naverButton}
            onPress={handleNaverSignIn}
            disabled={localLoading || authLoading}
          >
            {localLoading || authLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={styles.naverLogo}>
                  <Text style={styles.naverLogoText}>N</Text>
                </View>
                <Text style={styles.naverButtonText}>네이버로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity
            style={styles.kakaoButton}
            onPress={handleKakaoSignIn}
            disabled={localLoading || authLoading}
          >
            {localLoading || authLoading ? (
              <ActivityIndicator size="small" color="#391B1B" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={22} color="#391B1B" />
                <Text style={styles.kakaoButtonText}>카카오로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 로그인 상태 표시 */}
        {loginStatus ? (
          <Text style={styles.statusText}>{loginStatus}</Text>
        ) : null}

        {/* 약관 및 개인정보 처리방침 */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            로그인 시 <Text style={styles.termsLink}>서비스 이용약관</Text> 및{" "}
            <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의합니다
          </Text>
        </View>
      </View>

      {/* 로딩 모달 오버레이 */}
      <Modal
        visible={localLoading || authLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#50cebb" />
            <Text style={styles.loadingText}>로그인 중...</Text>
          </View>
        </View>
      </Modal>

      {/* 카카오 WebView 모달 제거 (네이티브 방식 사용) */}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#50cebb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  socialButtonsContainer: {
    width: "100%",
    marginBottom: 30,
  },
  socialTitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  // Google 버튼 스타일
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  // 네이버 버튼 스타일
  naverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1EC800",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  naverLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  naverLogoText: {
    color: "#1EC800",
    fontSize: 12,
    fontWeight: "bold",
  },
  naverButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  // 카카오 버튼 스타일
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  kakaoButtonText: {
    color: "#391B1B",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  statusText: {
    textAlign: "center",
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  termsContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  termsLink: {
    color: "#50cebb",
    textDecorationLine: "underline",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default LoginScreen;
