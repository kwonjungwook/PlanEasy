// src/screens/StudyTimerScreen.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { usePlanner } from "../context/PlannerContext";
import styles, { TIMER_METHODS } from "../styles/StudyTimerStyles";
import { useTimerLogic } from "../hooks/useTimerLogic";
import * as ScreenOrientation from "expo-screen-orientation";
import { ToastEventSystem } from "../components/common/AutoToast";
import { useFocusEffect } from "@react-navigation/native";

const StudyTimerScreen = () => {
  const navigation = useNavigation();
  const { recordStudySession, studySessions, selectedDate, setSelectedDate } =
    usePlanner();
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState(TIMER_METHODS[0]);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    workDuration: 45 * 60,
    breakDuration: 15 * 60,
  });

  const [isLandscape, setIsLandscape] = useState(false);
  const [isPureView, setIsPureView] = useState(false); // 가로모드 집중 뷰 모드
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [screenHeight, setScreenHeight] = useState(
    Dimensions.get("window").height
  );

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

  const toggleLandscapeMode = useCallback(async () => {
    try {
      if (!isPureView) {
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
        // 상태바 숨기기
        StatusBar.setHidden(true);
        // 상태 변경
        setIsLandscape(true);
        setIsPureView(true);
        // console.log 대신 토스트 메시지 사용
        ToastEventSystem.showToast("가로모드로 전환되었습니다", 1500);
      } else {
        // 세로모드로 전환
        await setScreenOrientation("portrait");

        // 타이머 상태에 따라 UI 설정
        const isTimerActive =
          timerState === "working" ||
          timerState === "break" ||
          timerState === "paused";

        // 타이머가 실행 중이면 포커스 모드 유지
        if (isTimerActive) {
          if (navigation && navigation.setOptions) {
            navigation.setOptions({
              tabBarStyle: { display: "none" },
            });
          }
          StatusBar.setHidden(true);
        } else {
          // 타이머가 실행 중이 아니면 일반 모드로 복원
          if (navigation && navigation.setOptions) {
            navigation.setOptions({
              tabBarStyle: defaultTabBarStyle,
            });
          }
          StatusBar.setHidden(false);
        }

        // 상태 변경
        setIsLandscape(false);
        setIsPureView(false);
        // console.log 대신 토스트 메시지 사용
        ToastEventSystem.showToast("세로모드로 전환되었습니다", 1500);
      }
    } catch (error) {
      console.error("화면 방향 변경 오류:", error);
      // 에러 메시지도 토스트로 표시
      ToastEventSystem.showToast("화면 방향 변경 실패", 1500);
    }
  }, [
    isPureView,
    setScreenOrientation,
    activateKeepAwake,
    navigation,
    timerState,
  ]);

  // 메서드 선택 핸들러 - 커스터마이징 기능 추가
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setShowMenuModal(false);

    // 커스터마이징 가능한 메서드인 경우 설정 모달 표시
    if (method.isCustomizable) {
      setCustomSettings({
        workDuration: method.workDuration,
        breakDuration: method.breakDuration,
      });
      setShowSettingsModal(true);
    }
  };

  // 설정 저장 함수
  const saveSettings = () => {
    setSelectedMethod({
      ...selectedMethod,
      workDuration: customSettings.workDuration,
      breakDuration: customSettings.breakDuration,
    });
    setTimeRemaining(customSettings.workDuration);
    setShowSettingsModal(false);
  };

  // 타이머 로직 커스텀 훅 사용
  const {
    timerState,
    timeRemaining,
    elapsedTime,
    currentCycle,
    sessionSubject,
    timerModeBeforePause,
    cycleLogRef,

    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,

    formatTime,
    getTodayTotalStudyTime,

    // 이 함수 추가
    activateKeepAwake,
  } = useTimerLogic(
    selectedMethod,
    selectedDate,
    recordStudySession,
    studySessions
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
        StatusBar.setHidden(true);
      } else {
        // 타이머가 작동 중이 아니면 기본 스타일 복원
        if (navigation && navigation.setOptions) {
          navigation.setOptions({
            tabBarStyle: defaultTabBarStyle,
          });
        }
        setIsFocusMode(false);
        setIsDarkMode(false);
        StatusBar.setHidden(false);
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

      // 상태바 설정
      StatusBar.setHidden(shouldFocus);
    }
  }, [timerState, isFocusMode, navigation]);

  // 포커스 모드 변경에 따른 애니메이션 - 모든 애니메이션에 동일한 설정 적용
  useEffect(() => {
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
  }, [
    isFocusMode,
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

  // 타이머 컨트롤 컴포넌트
  const TimerControls = () => (
    <View style={styles.timerControlsContainer}>
      <View style={styles.timerControlsBar}>
        {/* 시작/일시정지 버튼 */}
        {timerState === "working" || timerState === "break" ? (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: selectedMethod.color },
            ]}
            onPress={pauseTimer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pause" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: selectedMethod.color },
            ]}
            onPress={startTimer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* 정지 버튼 */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: "#ff6b6b",
              opacity: timerState !== "idle" ? 1 : 0,
            },
          ]}
          onPress={stopTimer}
          disabled={timerState === "idle"}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <Ionicons name="stop" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* 전체화면 버튼 - 타이머가 동작 중일 때만 활성화 */}
        {timerState === "working" || timerState === "break" ? (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: "#666" }]}
            onPress={toggleLandscapeMode}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="scan-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: "#666", opacity: 0 },
            ]}
            disabled={true}
          >
            <Ionicons name="scan-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 가로모드 렌더링 부분 수정
  if (isPureView) {
    return (
      <View style={styles.enhancedPureViewContainer}>
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
                사이클: {currentCycle}
              </Text>
            )}
          </View>
        </View>

        {/* 세로모드 전환 버튼 - 수정됨 */}
        <TouchableOpacity
          style={styles.enhancedPureViewExitButton} // 더 눈에 띄는 새 스타일 사용
          onPress={toggleLandscapeMode}
        >
          <Ionicons name="phone-portrait-outline" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* 상단 정보 영역 */}
        <View style={styles.enhancedPureViewInfo}>
          <Text style={styles.enhancedPureViewSubject}>{sessionSubject}</Text>
          <Text style={styles.enhancedPureViewTotal}>
            총 공부시간: {getTodayTotalStudyTime()}
          </Text>
        </View>
      </View>
    );
  }

  // 메인 UI 렌더링 - 수정됨
  return (
    <SafeAreaView style={styles.container}>
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
        <Animated.View style={[styles.totalStudyTimeContainer, { zIndex: 10 }]}>
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
                  color: isFocusMode ? "#ffffff" : selectedMethod.color, // 포커스 모드에서는 흰색으로
                  fontWeight: "bold",
                },
              ]}
            >
              {formatTime(timeRemaining)}
            </Text>

            <Text
              style={[
                styles.timerLabel,
                { color: isFocusMode ? "#ffffff" : "#666" }, // 포커스 모드에서는 흰색으로
              ]}
            >
              {timerState === "break" ? "휴식 시간" : "집중 시간"}
            </Text>

            <View style={styles.cycleTextContainer}>
              <Text
                style={[
                  styles.cycleText,
                  {
                    color: isFocusMode ? "#dddddd" : "#666", // 포커스 모드에서는 밝은 회색으로
                    opacity: timerState !== "idle" ? 1 : 0,
                  },
                ]}
              >
                {timerState !== "idle"
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
        <TimerControls />
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

                    {/* 커스터마이징 설정 버튼 추가 */}
                    {item.isCustomizable && (
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setSelectedMethod(item);
                          setCustomSettings({
                            workDuration: item.workDuration,
                            breakDuration: item.breakDuration,
                          });
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

      {/* 설정 모달 추가 */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>타이머 설정</Text>

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
                      breakDuration: customSettings.breakDuration + 1 * 60,
                    });
                  }}
                >
                  <Text style={styles.settingButtonText}>+1</Text>
                </TouchableOpacity>
              </View>
            </View>

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
  );
};

export default StudyTimerScreen;
