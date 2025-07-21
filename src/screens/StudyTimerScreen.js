// src/screens/StudyTimerScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastEventSystem } from "../components/common/AutoToast";
import TimerControls from "../components/TimerControls";
import { usePlanner } from "../context/PlannerContext";
import { useTimerLogic } from "../hooks/useTimerLogic";
import styles, { TIMER_METHODS } from "../styles/StudyTimerStyles";

const StudyTimerScreen = () => {
  const navigation = useNavigation();
  const { recordStudySession, studySessions, selectedDate, setSelectedDate } =
    usePlanner();
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState(TIMER_METHODS[0]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedMethodInfo, setSelectedMethodInfo] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    workDuration: 45 * 60,
    breakDuration: 15 * 60,
    questionCount: 100, // 문제 수
    timePerQuestion: 15, // 문제당 시간(초)
  });

  const [isLandscape, setIsLandscape] = useState(false);
  const [isPureView, setIsPureView] = useState(false); // 가로모드 집중 뷰 모드
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [screenHeight, setScreenHeight] = useState(
    Dimensions.get("window").height
  );

  const [showResultModal, setShowResultModal] = useState(false);
  const [examResult, setExamResult] = useState(null);

  // 컴포넌트 내부 상태 선언 부분에 추가
  const [isDarkMode, setIsDarkMode] = useState(false);
  const darkOverlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const timerScale = useRef(new Animated.Value(1)).current;
  const controlsScale = useRef(new Animated.Value(1)).current;
  const timerBackgroundColor = useRef(new Animated.Value(0)).current;

  // 탭바 기본 스타일 정의
  const defaultTabBarStyle = {
    display: "flex",
    height: 70,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "absolute",
    bottom: 0,
  };

  // 화면 방향 설정 함수
  const setScreenOrientation = useCallback(async (orientation) => {
    try {
      if (orientation === "landscape") {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
        console.log("화면 가로모드로 설정");
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        console.log("화면 세로모드로 설정");
      }
    } catch (error) {
      console.error("화면 방향 설정 오류:", error);
    }
  }, []);

  // 애니메이션 상태 리셋 함수 추가
  const resetAnimationStates = useCallback(() => {
    // 모든 애니메이션을 즉시 정확한 상태로 리셋
    const shouldFocus =
      timerState === "working" ||
      timerState === "break" ||
      timerState === "paused";

    darkOverlayOpacity.setValue(shouldFocus ? 1 : 0);
    timerBackgroundColor.setValue(shouldFocus ? 1 : 0);
    contentOpacity.setValue(shouldFocus ? 0 : 1);
    timerScale.setValue(shouldFocus ? 1.3 : 1);
    controlsScale.setValue(shouldFocus ? 1.15 : 1);
  }, [
    timerState,
    darkOverlayOpacity,
    timerBackgroundColor,
    contentOpacity,
    timerScale,
    controlsScale,
  ]);

  const toggleLandscapeMode = useCallback(async () => {
    try {
      if (!isPureView) {
        // 가로모드로 전환하기 전에 모든 애니메이션을 즉시 완료 상태로 설정
        const shouldFocus =
          timerState === "working" ||
          timerState === "break" ||
          timerState === "paused";

        // 애니메이션 정지 및 즉시 완료 상태로 설정
        darkOverlayOpacity.stopAnimation();
        timerBackgroundColor.stopAnimation();
        contentOpacity.stopAnimation();
        timerScale.stopAnimation();
        controlsScale.stopAnimation();

        // 즉시 최종 값으로 설정
        darkOverlayOpacity.setValue(shouldFocus ? 1 : 0);
        timerBackgroundColor.setValue(shouldFocus ? 1 : 0);
        contentOpacity.setValue(shouldFocus ? 0 : 1);
        timerScale.setValue(shouldFocus ? 1.3 : 1);
        controlsScale.setValue(shouldFocus ? 1.15 : 1);

        // 가로모드로 전환
        await setScreenOrientation("landscape");
        // 화면 켜짐 유지 활성화
        activateKeepAwake();
        // 탭바 숨기기
        if (navigation && navigation.setOptions) {
          navigation.setOptions({
            tabBarStyle: { display: "none" },
          });
        }

        // 상태 변경
        setIsLandscape(true);
        setIsPureView(true);
        ToastEventSystem.showToast("가로모드로 전환되었습니다", 1500);
      } else {
        // 세로모드로 전환
        await setScreenOrientation("portrait");

        // 타이머 상태에 따라 UI 설정
        const isTimerActive =
          timerState === "working" ||
          timerState === "break" ||
          timerState === "paused";

        // 상태 변경
        setIsLandscape(false);
        setIsPureView(false);

        // 세로모드로 돌아온 후 애니메이션 상태를 즉시 올바른 값으로 설정
        const shouldFocus = isTimerActive;
        darkOverlayOpacity.setValue(shouldFocus ? 1 : 0);
        timerBackgroundColor.setValue(shouldFocus ? 1 : 0);
        contentOpacity.setValue(shouldFocus ? 0 : 1);
        timerScale.setValue(shouldFocus ? 1.3 : 1);
        controlsScale.setValue(shouldFocus ? 1.15 : 1);

        // 탭바 설정
        if (isTimerActive) {
          if (navigation && navigation.setOptions) {
            navigation.setOptions({
              tabBarStyle: { display: "none" },
            });
          }
        } else {
          if (navigation && navigation.setOptions) {
            navigation.setOptions({
              tabBarStyle: defaultTabBarStyle,
            });
          }
        }

        ToastEventSystem.showToast("세로모드로 전환되었습니다", 1500);
      }
    } catch (error) {
      console.error("화면 방향 변경 오류:", error);
      ToastEventSystem.showToast("화면 방향 변경 실패", 1500);
    }
  }, [
    isPureView,
    setScreenOrientation,
    activateKeepAwake,
    navigation,
    timerState,
    darkOverlayOpacity,
    timerBackgroundColor,
    contentOpacity,
    timerScale,
    controlsScale,
  ]);

  // 공부법 정보 모달 열기 함수 추가
  const showMethodInfo = (method) => {
    setSelectedMethodInfo(method);
    setShowInfoModal(true);
  };

  // handleMethodSelect 함수 수정
  const handleMethodSelect = (method) => {
    if (method.isExamMode) {
      const methodWithQuestions = {
        ...method,
        remainingQuestions: method.questionCount || 100,
        workDuration: method.workDuration || 15,
      };
      setSelectedMethod(methodWithQuestions);

      // 설정값도 올바르게 초기화
      setCustomSettings({
        ...customSettings,
        questionCount: method.questionCount || 100,
        timePerQuestion: method.workDuration || 15,
      });
    } else {
      setSelectedMethod(method);
      setCustomSettings({
        ...customSettings,
        workDuration: method.workDuration || 45 * 60,
        breakDuration: method.breakDuration || 15 * 60,
      });
    }
    setShowMenuModal(false);

    // 커스터마이징 가능한 메서드인 경우 설정 모달 표시
    if (method.isCustomizable) {
      setShowSettingsModal(true);
    }
  };

  // 3. 설정 저장 함수 수정
  const saveSettings = () => {
    if (selectedMethod.isExamMode) {
      const updatedMethod = {
        ...selectedMethod,
        workDuration: customSettings.timePerQuestion,
        questionCount: customSettings.questionCount,
        remainingQuestions: customSettings.questionCount,
      };
      setSelectedMethod(updatedMethod);
      setTimeRemaining(customSettings.timePerQuestion);
    } else {
      setSelectedMethod({
        ...selectedMethod,
        workDuration: customSettings.workDuration,
        breakDuration: customSettings.breakDuration,
      });
      setTimeRemaining(customSettings.workDuration);
    }
    setShowSettingsModal(false);
  };

  const {
    timerState,
    timeRemaining,
    elapsedTime,
    currentCycle,
    sessionSubject,
    timerModeBeforePause,
    cycleLogRef,
    remainingQuestions,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setTimeRemaining,
    formatTime,
    getTodayTotalStudyTime,
    activateKeepAwake,
  } = useTimerLogic(
    selectedMethod,
    selectedDate,
    recordStudySession,
    studySessions,
    setShowResultModal,
    setExamResult
  );

  // 화면 포커스/언포커스 처리 - 수정됨
  useFocusEffect(
    useCallback(() => {
      // 화면이 포커스될 때 실행되는 코드
      console.log("스크린 포커스됨");

      // 현재 타이머 상태에 따라 탭바 스타일 재설정
      const shouldFocus =
        timerState === "working" ||
        timerState === "break" ||
        timerState === "paused";

      // 타이머가 작동 중이면 포커스 모드로 복원
      if (shouldFocus) {
        if (navigation && navigation.setOptions) {
          navigation.setOptions({
            tabBarStyle: { display: "none" },
          });
        }
        setIsFocusMode(true);
        setIsDarkMode(true);
      } else {
        // 타이머가 작동 중이 아니면 기본 스타일 복원
        if (navigation && navigation.setOptions) {
          navigation.setOptions({
            tabBarStyle: defaultTabBarStyle,
          });
        }
        setIsFocusMode(false);
        setIsDarkMode(false);
      }

      return () => {
        console.log("스크린 언포커스됨");
      };
    }, [timerState, navigation, defaultTabBarStyle])
  );

  // 타이머 상태에 따른 포커스 모드 설정 (중앙 관리 함수) - 수정됨
  useEffect(() => {
    // 타이머가 실행 중이거나 일시 정지 상태일 때 포커스 모드 활성화
    const shouldFocus =
      timerState === "working" ||
      timerState === "break" ||
      timerState === "paused";

    if (shouldFocus !== isFocusMode) {
      setIsFocusMode(shouldFocus);
      setIsDarkMode(shouldFocus);

      // 탭바 설정 - 이제 여기서만 관리
      if (navigation && navigation.setOptions) {
        navigation.setOptions({
          tabBarStyle: shouldFocus ? { display: "none" } : defaultTabBarStyle,
        });
      }
    }
  }, [timerState, isFocusMode, navigation]);

  // 포커스 모드 변경에 따른 애니메이션 - 가로모드가 아닐 때만
  useEffect(() => {
    // 가로모드(Pure View) 상태가 아닐 때만 애니메이션 실행
    if (!isPureView) {
      // 모든 애니메이션에 완전히 동일한 설정 사용
      const animationConfig = {
        duration: 2000, // 일관된 지속 시간
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false, // 모든 애니메이션에 false 사용
      };

      // 모든 애니메이션을 하나의 parallel로 실행
      Animated.parallel([
        // 전체 화면 다크 오버레이
        Animated.timing(darkOverlayOpacity, {
          toValue: isFocusMode ? 1 : 0,
          ...animationConfig,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),

        // 타이머 써클 배경색 애니메이션
        Animated.timing(timerBackgroundColor, {
          toValue: isFocusMode ? 1 : 0,
          ...animationConfig,
        }),

        // contentOpacity
        Animated.timing(contentOpacity, {
          toValue: isFocusMode ? 0 : 1,
          ...animationConfig,
        }),

        // 타이머 크기
        Animated.timing(timerScale, {
          toValue: isFocusMode ? 1.3 : 1,
          ...animationConfig,
        }),

        // 컨트롤 버튼 크기
        Animated.timing(controlsScale, {
          toValue: isFocusMode ? 1.15 : 1,
          ...animationConfig,
        }),
      ]).start();
    }
  }, [
    isFocusMode,
    isPureView,
    darkOverlayOpacity,
    contentOpacity,
    timerScale,
    controlsScale,
    timerBackgroundColor,
  ]);

  // 화면 방향 감지를 위한 useEffect
  useEffect(() => {
    const handleOrientationChange = ({ window }) => {
      const { width, height } = window;
      setScreenWidth(width);
      setScreenHeight(height);
    };

    // 화면 크기 변경 이벤트 리스너 등록
    const dimensionsListener = Dimensions.addEventListener(
      "change",
      handleOrientationChange
    );

    // 초기 상태 설정
    const { width, height } = Dimensions.get("window");
    setScreenWidth(width);
    setScreenHeight(height);

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      dimensionsListener.remove();
    };
  }, []);

  // 컴포넌트 언마운트 시 세로모드로 복원
  useEffect(() => {
    return () => {
      // 세로 모드로 복원
      setScreenOrientation("portrait");
    };
  }, [setScreenOrientation]);

  // 현재 날짜 설정
  useEffect(() => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  }, [setSelectedDate]);

  // 가로모드 렌더링 부분
  if (isPureView) {
    return (
      <View style={styles.enhancedPureViewContainer}>
        <StatusBar style="light" hidden={true} />
        {/* 타이머 위치 조정 */}
        <View style={styles.enhancedPureViewContent}>
          <View
            style={[
              styles.enhancedPureViewTimer,
              { borderColor: selectedMethod.color },
            ]}
          >
            <Text
              style={[
                styles.enhancedPureViewTimerText,
                { color: selectedMethod.color },
              ]}
            >
              {formatTime(timeRemaining)}
            </Text>
            {timerState !== "idle" && (
              <Text style={styles.enhancedPureViewCycleText}>
                {selectedMethod.isExamMode
                  ? `${remainingQuestions}/${selectedMethod.questionCount} 문제`
                  : `사이클: ${currentCycle}`}
              </Text>
            )}
          </View>
        </View>

        {/* 세로모드 전환 버튼 */}
        <TouchableOpacity
          style={styles.enhancedPureViewExitButton}
          onPress={toggleLandscapeMode}
        >
          <Ionicons name="phone-portrait-outline" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* 상단 정보 영역 */}
        <View style={styles.enhancedPureViewInfo}>
          <Text style={styles.enhancedPureViewSubject}>
            {selectedMethod.isExamMode ? "기출문제 풀이" : sessionSubject}
          </Text>
          <Text style={styles.enhancedPureViewTotal}>
            총 공부시간: {getTodayTotalStudyTime()}
          </Text>
        </View>
      </View>
    );
  }

  // 메인 UI 렌더링 - 수정됨
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar
        style={isFocusMode ? "light" : "dark"}
        backgroundColor={isFocusMode ? "#000000" : "#ffffff"}
        hidden={isFocusMode}
        translucent={false}
      />

      <SafeAreaView
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "android" ? 25 : 0, // DailyScreen과 동일한 값
          },
        ]}
      >
        {/* 다크 오버레이 - zIndex 낮춤 */}
        <Animated.View
          style={[
            styles.darkOverlay,
            {
              opacity: darkOverlayOpacity,
              zIndex: 1, // 낮은 zIndex 설정
            },
          ]}
          pointerEvents="none"
        />

        {/* 헤더 */}
        <View style={[styles.header, isFocusMode && { opacity: 0 }]}>
          <Text style={styles.headerTitle}>공부 타이머</Text>
          <View style={styles.headerRightContainer}>
            <Text style={styles.headerDate}>
              {format(new Date(selectedDate), "yyyy년 MM월 dd일")}
            </Text>
            <Text style={styles.headerSubtitle}>
              오늘 총 공부시간: {getTodayTotalStudyTime()}
            </Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenuModal(true)}
            >
              <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 우측 상단에 총 공부시간 표시 (포커스 모드일 때만) */}
        {isFocusMode && (
          <Animated.View
            style={[
              styles.totalStudyTimeContainer,
              {
                zIndex: 10,
                // 상태바가 숨겨지므로 상단에 배치 가능
                top: 20,
                right: 20,
                position: "absolute",
              },
            ]}
          >
            <Text style={styles.totalStudyTimeText}>
              총 공부시간: {getTodayTotalStudyTime()}
            </Text>
          </Animated.View>
        )}

        {/* 중앙 타이머 - zIndex 높여서 다크 오버레이 위에 표시 */}
        <View style={[styles.centerTimerContainer, { zIndex: 5 }]}>
          <Animated.View
            style={[
              styles.timerCircle,
              {
                borderColor: selectedMethod.color,
                transform: [{ scale: timerScale }],
                backgroundColor: timerBackgroundColor.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["transparent", "#000"],
                }),
                zIndex: 10, // 높은 zIndex로 설정
              },
            ]}
          >
            <View style={styles.timerContentContainer}>
              <Text
                style={[
                  styles.timerText,
                  {
                    color: isFocusMode ? "#ffffff" : selectedMethod.color,
                    fontWeight: "bold",
                  },
                ]}
              >
                {formatTime(timeRemaining)}
              </Text>

              <Text
                style={[
                  styles.timerLabel,
                  { color: isFocusMode ? "#ffffff" : "#666" },
                ]}
              >
                {selectedMethod.isExamMode && remainingQuestions !== undefined
                  ? `문제 ${remainingQuestions}`
                  : timerState === "break"
                  ? "휴식 시간"
                  : "집중 시간"}
              </Text>

              <View style={styles.cycleTextContainer}>
                <Text
                  style={[
                    styles.cycleText,
                    {
                      color: isFocusMode ? "#dddddd" : "#666",
                      opacity: timerState !== "idle" ? 1 : 0,
                    },
                  ]}
                >
                  {selectedMethod.isExamMode && selectedMethod.questionCount
                    ? `${remainingQuestions || selectedMethod.questionCount}/${
                        selectedMethod.questionCount
                      } 문제` // 더 짧게 표현
                    : timerState !== "idle"
                    ? `사이클: ${currentCycle}`
                    : "사이클: 1"}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* 하단 고정 컨트롤 버튼 - zIndex 높임 */}
        <Animated.View
          style={[
            styles.fixedControlsBar,
            {
              transform: [{ scale: controlsScale }],
              zIndex: 10, // 높은 zIndex로 설정
            },
          ]}
        >
          <TimerControls
            timerState={timerState}
            selectedMethod={selectedMethod}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            stopTimer={stopTimer}
            toggleLandscapeMode={toggleLandscapeMode}
          />
        </Animated.View>

        {/* 타이머 메서드 선택 모달 */}
        <Modal visible={showMenuModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>타이머 선택</Text>

              <FlatList
                data={TIMER_METHODS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      selectedMethod.id === item.id && styles.selectedMenuItem,
                      { borderLeftColor: item.color, borderLeftWidth: 4 },
                    ]}
                    onPress={() => handleMethodSelect(item)}
                  >
                    <View style={styles.menuItemMain}>
                      <View style={styles.menuItemTextContainer}>
                        <Text style={styles.menuItemTitle}>{item.name}</Text>
                        <Text style={styles.menuItemDesc}>
                          {item.description}
                        </Text>
                      </View>

                      <View style={styles.menuItemControls}>
                        {/* 기존 커스터마이징 설정 버튼 먼저 */}
                        {item.isCustomizable && (
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              // 먼저 메서드 선택
                              if (item.isExamMode) {
                                const methodWithQuestions = {
                                  ...item,
                                  remainingQuestions: item.questionCount || 100,
                                  workDuration: item.workDuration || 20,
                                };
                                setSelectedMethod(methodWithQuestions);
                                setCustomSettings({
                                  questionCount: item.questionCount || 100,
                                  timePerQuestion: item.workDuration || 20,
                                  workDuration: customSettings.workDuration,
                                  breakDuration: customSettings.breakDuration,
                                });
                              } else {
                                setSelectedMethod(item);
                                setCustomSettings({
                                  workDuration: item.workDuration || 45 * 60,
                                  breakDuration: item.breakDuration || 15 * 60,
                                  questionCount: customSettings.questionCount,
                                  timePerQuestion:
                                    customSettings.timePerQuestion,
                                });
                              }
                              setShowMenuModal(false);
                              setShowSettingsModal(true);
                            }}
                          >
                            <Ionicons
                              name="settings-outline"
                              size={22}
                              color="#666"
                            />
                          </TouchableOpacity>
                        )}

                        {/* 정보 보기 버튼 나중에 */}
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => showMethodInfo(item)}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color="#666"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMenuModal(false)}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 공부법 정보 모달 추가 */}
        <Modal visible={showInfoModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.infoModalContent}>
              <View style={styles.infoModalHeader}>
                <Text
                  style={[
                    styles.infoModalTitle,
                    { color: selectedMethodInfo?.color },
                  ]}
                >
                  {selectedMethodInfo?.name}
                </Text>
                <TouchableOpacity
                  style={styles.infoModalCloseButton}
                  onPress={() => setShowInfoModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.infoModalScrollContent}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.infoModalText}>
                  {selectedMethodInfo?.detailedInfo || "설명이 없습니다."}
                </Text>
              </ScrollView>

              <View style={styles.infoModalFooter}>
                <TouchableOpacity
                  style={[
                    styles.infoModalSelectButton,
                    { backgroundColor: selectedMethodInfo?.color || "#50cebb" },
                  ]}
                  onPress={() => {
                    if (selectedMethodInfo) {
                      handleMethodSelect(selectedMethodInfo);
                      setShowInfoModal(false);
                    }
                  }}
                >
                  <Text style={styles.infoModalSelectButtonText}>
                    이 방법 선택하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* 기출문제 결과 모달 */}
        <Modal
          visible={showResultModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📝 기출문제 풀이 결과</Text>

              {examResult && (
                <View style={styles.resultContainer}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>완료 문제</Text>
                    <Text style={styles.resultValue}>
                      {examResult.completedQuestions}/
                      {examResult.totalQuestions}
                      문제
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>총 소요 시간</Text>
                    <Text style={styles.resultValue}>
                      {formatTime(examResult.totalTime)}
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>문제당 평균 시간</Text>
                    <Text style={styles.resultValue}>
                      {formatTime(examResult.averageTime)}
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>완료율</Text>
                    <Text style={styles.resultValue}>
                      {Math.round(
                        (examResult.completedQuestions /
                          examResult.totalQuestions) *
                          100
                      )}
                      %
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowResultModal(false)}
              >
                <Text style={styles.closeButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* 설정 모달 추가 */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>타이머 설정</Text>

              {selectedMethod.isExamMode ? (
                // 기출문제 모드 설정
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>문제 수</Text>
                    <View style={styles.settingButtonGroup}>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            questionCount: Math.max(
                              1,
                              customSettings.questionCount - 5
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            questionCount: Math.max(
                              1,
                              customSettings.questionCount - 1
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-1</Text>
                      </TouchableOpacity>
                      <Text style={styles.settingValue}>
                        {customSettings.questionCount}
                      </Text>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            questionCount: customSettings.questionCount + 1,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            questionCount: customSettings.questionCount + 5,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>문제당 시간 (초)</Text>
                    <View style={styles.settingButtonGroup}>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            timePerQuestion: Math.max(
                              1,
                              customSettings.timePerQuestion - 5
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            timePerQuestion: Math.max(
                              1,
                              customSettings.timePerQuestion - 1
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-1</Text>
                      </TouchableOpacity>
                      <Text style={styles.settingValue}>
                        {customSettings.timePerQuestion}
                      </Text>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            timePerQuestion: customSettings.timePerQuestion + 1,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            timePerQuestion: customSettings.timePerQuestion + 5,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                // 일반 타이머 설정
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>집중 시간 (분)</Text>
                    <View style={styles.settingButtonGroup}>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            workDuration: Math.max(
                              5 * 60,
                              customSettings.workDuration - 5 * 60
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-5</Text>
                      </TouchableOpacity>
                      <Text style={styles.settingValue}>
                        {Math.floor(customSettings.workDuration / 60)}
                      </Text>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            workDuration: customSettings.workDuration + 5 * 60,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>휴식 시간 (분)</Text>
                    <View style={styles.settingButtonGroup}>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            breakDuration: Math.max(
                              1 * 60,
                              customSettings.breakDuration - 1 * 60
                            ),
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>-1</Text>
                      </TouchableOpacity>
                      <Text style={styles.settingValue}>
                        {Math.floor(customSettings.breakDuration / 60)}
                      </Text>
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={() => {
                          setCustomSettings({
                            ...customSettings,
                            breakDuration:
                              customSettings.breakDuration + 1 * 60,
                          });
                        }}
                      >
                        <Text style={styles.settingButtonText}>+1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSettingsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveSettings}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default StudyTimerScreen;
