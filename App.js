// App.js
import "react-native-url-polyfill/auto";
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  StatusBar,
  Text,
  LogBox,
  Platform,
  Settings,
  Linking,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import NaverLoginService from "./src/services/NaverLoginService";
// 수정된 부분: NotificationService에서 필요한 함수들을 import
import { 
  setupAndroidChannels, 
  requestNotificationPermissions,
  defineBackgroundTask,
  addNotificationListeners,
  getExpoPushTokenAsync,
  handleNotificationReceived,
  handleNotificationResponse
} from "./src/services/NotificationService";
import { OVERLAY_PERMISSION } from "expo-modules-core";
import * as IntentLauncher from "expo-intent-launcher";

// 경고 무시 설정 (불필요한 경고 무시)
LogBox.ignoreLogs([
  "Setting a timer",
  "AsyncStorage has been extracted from react-native core",
  "Require cycle:",
]);

// Prevent auto hide splash screen
SplashScreen.preventAutoHideAsync();

// Firebase 앱 초기화 - 다른 서비스보다 먼저 가져오기
import app, { auth } from "./src/firebaseConfig";

// Context Providers
import { PlannerProvider } from "./src/context/PlannerContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ProgressProvider } from "./src/context/ProgressContext";
import { AuthProvider } from "./src/context/AuthContext";
import { SubscriptionProvider } from "./src/context/SubscriptionContext"; // New Subscription Provider

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import AIFeedbackScreen from "./src/screens/AIFeedbackScreen";
import StudyTimerScreen from "./src/screens/StudyTimerScreen";
import MyPage from "./src/screens/MyPage";
import FAQ from "./src/screens2/FAQ";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import PointHistoryScreen from "./src/screens/PointHistoryScreen";
import PointsScreen from "./src/screens/PointsScreen";
import LevelScreen from "./src/screens/LevelScreen";
import StreakScreen from "./src/screens/StreakScreen";
import BadgesScreen from "./src/screens/BadgesScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import ScheduleScreen from "./src/screens/ScheduleScreen";
import DailyScreen from "./src/screens/DailyScreen";
import EditScheduleScreen from "./src/screens/EditScheduleScreen";
import CalendarEditor from "./src/screens/CalendarEditor";
import WeeklyTimetableScreen from "./src/screens/WeeklyTimetableScreen";
import SubscriptionScreen from "./src/screens/SubscriptionScreen"; // New Subscription Screen
import TermsAgreementScreen from "./src/screens/TermsAgreementScreen"; // New Subscription Screen

// Notification service imports - 이미 위에서 import됨
import * as Notifications from "expo-notifications";

let isNaverInitialized = false;
let isKakaoInitialized = false;

if (__DEV__) {
  console.log("개발 모드: 실제 인증 활성화");
  // 비동기 함수를 즉시 실행
  (async () => {
    try {
      await AsyncStorage.setItem("@use_real_auth", "true");
    } catch (e) {
      console.error(e);
    }
  })();
}

// 오류 처리를 위한 ErrorBoundary 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("앱 오류:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            앱에 문제가 발생했습니다.
          </Text>
          <Text style={{ marginBottom: 20 }}>
            앱을 다시 시작해주세요. 문제가 계속되면 개발자에게 문의하세요.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={{ fontSize: 12, color: "red", marginBottom: 10 }}>
              {this.state.error.toString()}
            </Text>
          )}
          {__DEV__ && this.state.errorInfo && (
            <Text style={{ fontSize: 12, color: "red" }}>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

// Notification handler setup
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log("알림 핸들링 중...");
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: "max",
    };
  },
});

const checkAndRequestOverlayPermission = async () => {
  if (Platform.OS !== "android") return true;

  try {
    // 이미 권한을 요청한 적이 있는지 확인
    const hasAskedPermission = await AsyncStorage.getItem(
      "@overlay_permission_asked"
    );

    const canDrawOverlays = await Linking.canOpenURL(
      "package:android.settings.action.MANAGE_OVERLAY_PERMISSION"
    );

    // 권한이 있으면 true 반환
    if (canDrawOverlays) {
      return true;
    }

    // 권한이 없고, 아직 물어보지 않았다면 한 번만 물어봄
    if (!hasAskedPermission) {
      Alert.alert(
        "권한 필요",
        "백그라운드에서 타이머를 표시하기 위해 '다른 앱 위에 표시' 권한이 필요합니다.",
        [
          {
            text: "나중에",
            style: "cancel",
            onPress: async () => {
              // 사용자에게 물어봤다는 정보 저장
              await AsyncStorage.setItem("@overlay_permission_asked", "true");
            },
          },
          {
            text: "설정으로 이동",
            onPress: async () => {
              await AsyncStorage.setItem("@overlay_permission_asked", "true");
              Linking.openSettings();
            },
          },
        ]
      );
    }

    return canDrawOverlays;
  } catch (error) {
    console.error("오버레이 권한 확인 오류:", error);
    return false;
  }
};

// Schedule Stack Navigator
const ScheduleStack = createStackNavigator();
function ScheduleStackScreen() {
  return (
    <ScheduleStack.Navigator>
      <ScheduleStack.Screen
        name="ScheduleList"
        component={ScheduleScreen}
        options={{ headerShown: false }}
      />
      <ScheduleStack.Screen
        name="EditSchedule"
        component={EditScheduleScreen}
        options={{ headerShown: false }}
      />
    </ScheduleStack.Navigator>
  );
}

// Calendar Stack Navigator
const CalendarStack = createStackNavigator();
function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator>
      <CalendarStack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <CalendarStack.Screen
        name="CalendarEditor"
        component={CalendarEditor}
        options={{ headerShown: false }}
      />
    </CalendarStack.Navigator>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();
function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "홈") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "달력") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "루틴") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "시간표") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "타이머") {
            iconName = focused ? "timer" : "timer-outline";
          } else if (route.name === "AI") {
            iconName = focused ? "analytics" : "analytics-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#50cebb",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          position: "absolute",
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingBottom: 3,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tab.Screen name="홈" component={DailyScreen} />
      <Tab.Screen name="시간표" component={WeeklyTimetableScreen} />
      <Tab.Screen name="달력" component={CalendarStackScreen} />
      <Tab.Screen
        name="타이머"
        component={StudyTimerScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? "timer" : "timer-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarItemStyle: {
            paddingVertical: 5,
          },
        }}
      />
      <Tab.Screen
        name="AI"
        component={AIFeedbackScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? "analytics" : "analytics-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen name="루틴" component={ScheduleStackScreen} />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
const RootStack = createStackNavigator();

// App Navigator Component
function AppNavigator() {
  const notificationListenersRef = useRef(null);
  const navigationRef = useRef();
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // 타이머 참조 보관용 ref
  const timerRefs = useRef([]);

  // 타이머 생성 시 참조 저장 함수
  const createTimer = (callback, delay) => {
    const id = setTimeout(callback, delay);
    timerRefs.current.push(id);
    return id;
  };

  // 카카오 SDK 초기화 함수 - 컴포넌트 레벨에 선언
  const initializeKakaoSDK = async () => {
    try {
      // 이미 초기화되었으면 스킵
      if (isKakaoInitialized) {
        console.log("카카오 SDK 이미 초기화됨, 스킵");
        return true;
      }

      console.log("카카오 SDK 초기화 시작");

      if (!KakaoLogin) {
        console.error("카카오 로그인 SDK를 찾을 수 없습니다");
        return false;
      }

      // 사용 가능한 메서드 확인
      console.log("사용 가능한 카카오 SDK 메서드:", Object.keys(KakaoLogin));

      // init 메서드 존재 확인
      if (typeof KakaoLogin.init === "function") {
        await KakaoLogin.init("8914389a91c8b805636ddfac88b9f019");
        console.log("카카오 SDK 초기화 완료");
        isKakaoInitialized = true;
        return true;
      } else {
        console.log("카카오 SDK init 메서드 없음 - 자동 초기화 예상");
        isKakaoInitialized = true; // 자동 초기화 가정
        return true;
      }
    } catch (error) {
      console.error("카카오 SDK 초기화 오류:", error);
      return false;
    }
  };

  // App.js의 initializeNaverSDK 함수 수정 버전
  const initializeNaverSDK = async () => {
    try {
      // 이미 초기화되었으면 스킵
      if (isNaverInitialized) {
        console.log("네이버 SDK 이미 초기화됨, 스킵");
        return true;
      }

      console.log("네이버 SDK 초기화 시작");

      // 객체 형태로 설정값 전달
      const naverConfig = {
        kConsumerKey: "Y3OUgvCptmtmaPTb9GLc",
        kConsumerSecret: "iEoHx5dLJs",
        kServiceAppName: "PlanEasy",
        kServiceAppUrlScheme: "naverY3OUgvCptmtmaPTb9GLc",
        kConsumerCallbackUrl: "naverY3OUgvCptmtmaPTb9GLc://oauth",
      };

      // 객체로 전달
      await NaverLoginService.initialize(naverConfig);

      console.log("네이버 SDK 초기화 완료");
      isNaverInitialized = true;
      return true;
    } catch (error) {
      console.error("네이버 SDK 초기화 오류:", error);
      return false;
    }
  };

  // 소셜 로그인 SDK 초기화 함수 - 컴포넌트 레벨에 선언
  const initializeSocialSDKs = async () => {
    try {
      console.log("소셜 로그인 SDK 초기화 시작...");

      // 카카오 SDK 초기화
      await initializeKakaoSDK();

      // 네이버 SDK 초기화
      await initializeNaverSDK();

      console.log("소셜 로그인 SDK 초기화 완료");
      return true;
    } catch (error) {
      console.error("소셜 로그인 SDK 초기화 오류:", error);
      return false;
    }
  };

  // 수정된 부분: 알림 시스템 초기화 함수
  const initializeNotifications = async () => {
    try {
      console.log("알림 시스템 초기화 시작...");

      // 백그라운드 태스크 정의
      defineBackgroundTask();

      // 알림 권한 요청
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        console.log("알림 권한이 거부되었습니다.");
        return false;
      }

      // Android 채널 설정
      if (Platform.OS === "android") {
        await setupAndroidChannels();
      }

      // 푸시 토큰 가져오기
      const token = await getExpoPushTokenAsync();
      if (token) {
        console.log("Expo 푸시 알림 토큰:", token.data);
      }

      console.log("알림 시스템 초기화 완료");
      return true;
    } catch (error) {
      console.error("알림 시스템 초기화 오류:", error);
      return false;
    }
  };

  // 알림 설정 함수 - 컴포넌트 레벨에 선언
  const setupNotifications = async () => {
    try {
      console.log("알림 시스템 설정 시작...");

      // 현재 알림 상태 확인
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      console.log(`현재 예약된 알림 수: ${scheduledNotifications.length}`);

      // 알림 시스템 초기화
      await initializeNotifications();

      // 알림 리스너 등록
      notificationListenersRef.current = addNotificationListeners(
        // 알림 수신 리스너
        async (notification) => {
          console.log("알림 수신:", notification);
          await handleNotificationReceived(notification);
        },
        // 알림 응답 리스너
        async (response) => {
          console.log("알림 응답:", response);
          await handleNotificationResponse(response);

          const data = response.notification.request.content.data;

          // 알림에 화면 정보가 있으면 해당 화면으로 이동
          if (data && data.screen && navigationRef.current) {
            const timerID = createTimer(() => {
              try {
                navigationRef.current.navigate(data.screen);
              } catch (error) {
                console.error("알림 탐색 오류:", error);
              }
            }, 500);
          }
        }
      );

      console.log("알림 시스템 설정 완료");
      return true;
    } catch (error) {
      console.error("알림 설정 오류:", error);
      return false;
    }
  };

  // prepareApp 함수 내에 오버레이 권한 확인 코드 추가 (수정된 prepareApp 함수)
  const prepareApp = async () => {
    try {
      console.log("앱 초기화 작업 시작...");

      // 소셜 로그인 SDK 초기화
      await initializeSocialSDKs();

      // 환경 확인
      console.log("NODE_ENV:", process.env.NODE_ENV);
      console.log("__DEV__:", __DEV__);

      // Firebase 상태 확인
      if (!app) console.warn("Firebase 앱 초기화 상태 확인 중...");
      if (!auth) console.warn("Firebase 인증 초기화 상태 확인 중...");

      // 오버레이 권한 확인 (Android 전용)
      if (Platform.OS === "android") {
        console.log("오버레이 권한 확인 중...");
        const hasOverlayPermission = await checkAndRequestOverlayPermission();
        console.log(
          "오버레이 권한 상태:",
          hasOverlayPermission ? "허용됨" : "거부됨"
        );

        // 권한이 없어도 앱은 계속 실행 (선택적 기능이므로)
        if (!hasOverlayPermission) {
          console.log(
            "오버레이 권한이 거부되었습니다. 일부 기능이 제한될 수 있습니다."
          );
        }

        // 오버레이 서비스 시작 로직 (네이티브 모듈을 통해)
        try {
          if (hasOverlayPermission) {
            // 이 부분은 실제 네이티브 모듈이 구현된 후 활성화
            // NativeModules.TimerOverlayModule.initialize();
            console.log("타이머 오버레이 서비스 초기화됨");
          }
        } catch (error) {
          console.error("타이머 오버레이 서비스 초기화 오류:", error);
        }
      }

      // 추가 초기화 시간 - 타이머 사용
      await new Promise((resolve) => {
        const timerID = createTimer(resolve, 500);
      });

      // 알림 설정
      await setupNotifications();

      console.log("앱 초기화 완료");
      setAppIsReady(true);
    } catch (e) {
      console.warn("앱 초기화 오류:", e);
      setInitError(e.message);
      setAppIsReady(true); // 오류가 있어도 앱은 계속 진행
    } finally {
      // 스플래시 화면 표시 (1.5초)
      const splashTimerID = createTimer(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("스플래시 화면 숨기기 오류:", e);
        }
      }, 1500);
    }
  };

  useEffect(() => {
    // 앱 초기화 실행
    prepareApp();

    // 정리 함수 - 컴포넌트 언마운트 시 정리
    return () => {
      // 모든 타이머 정리
      timerRefs.current.forEach(clearTimeout);

      // 알림 리스너 정리
      if (notificationListenersRef.current) {
        notificationListenersRef.current.remove();
      }

      // 오버레이 서비스 정리
      if (Platform.OS === "android") {
        try {
          // NativeModules.TimerOverlayModule.cleanup();
          console.log("타이머 오버레이 서비스 정리됨");
        } catch (error) {
          console.error("타이머 오버레이 서비스 정리 오류:", error);
        }
      }
    };
  }, []);

  // 앱이 준비되지 않았으면 빈 화면 반환 (선택적)
  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  // 초기화 오류 표시 (개발 모드에서만)
  if (__DEV__ && initError) {
    console.warn("초기화 오류가 있지만 앱을 계속 로드합니다:", initError);
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        translucent={false}
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main app screens - accessible regardless of login state */}
        <RootStack.Screen name="Main" component={TabNavigator} />
        <RootStack.Screen name="MyPage" component={MyPage} />
        <RootStack.Screen
          name="FAQ"
          component={FAQ}
          options={{
            headerShown: true,
            title: "자주 묻는 질문",
          }}
        />
        <RootStack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <RootStack.Screen name="Points" component={PointsScreen} />
        <RootStack.Screen name="Level" component={LevelScreen} />
        <RootStack.Screen name="PointHistory" component={PointHistoryScreen} />
        <RootStack.Screen name="Streak" component={StreakScreen} />
        <RootStack.Screen name="Badges" component={BadgesScreen} />

        {/* Login screen - navigate only when needed */}
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />

        {/* Subscription screen - for managing subscription */}
        <RootStack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      {/* 전체 앱 트리를 React.StrictMode로 감싸기 */}
      <React.StrictMode>
        <AuthProvider>
          <SubscriptionProvider>
            <PlannerProvider>
              <NotificationProvider>
                <ProgressProvider>
                  <AppNavigator />
                </ProgressProvider>
              </NotificationProvider>
            </PlannerProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </React.StrictMode>
    </ErrorBoundary>
  );
}

export default App;
