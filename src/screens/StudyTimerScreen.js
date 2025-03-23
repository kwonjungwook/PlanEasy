// src/screens/StudyTimerScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlanner } from "../context/PlannerContext";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Switch } from "react-native";

// Timer methods definitions remain the same
const TIMER_METHODS = [
  {
    id: "pomodoro",
    name: "포모도로",
    description: "25분 집중, 5분 휴식 사이클",
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    cyclesBeforeLongBreak: 4,
    color: "#F05454",
    isInfinite: false,
    detailedInfo: `포모도로 기법은 1980년대 프란체스코 시릴로(Francesco Cirillo)가 개발한 시간 관리 방법론입니다.

📌 기본 구조
• 25분 집중 작업 (1 포모도로)
• 5분 짧은 휴식
• 4번의 포모도로 후에는 15~30분 긴 휴식
• 이 과정을 반복

📌 효과
• 집중력 향상: 짧은 시간 동안 온전히 한 가지에 집중
• 업무 피로도 감소: 규칙적인 휴식으로 지속 가능
• 업무 추적 용이: 포모도로 단위로 작업량 측정 가능
• 방해 요소 최소화: '지금은 집중 중'이라는 명확한 경계 설정

📌 추천 대상
• 집중력이 짧은 학생
• 자주 산만해지는 경향이 있는 분
• 작업 시간을 체계적으로 관리하고 싶은 분
• 과로를 방지하고 싶은 분`,
  },
  // ... the other timer methods remain the same
  {
    id: "52-17",
    name: "52-17 기법",
    description: "52분 작업, 17분 휴식",
    workDuration: 52 * 60,
    breakDuration: 17 * 60,
    color: "#7A4069",
    isInfinite: false,
    detailedInfo: `52-17 기법은 생산성 추적 앱 DeskTime의 데이터 분석에서 발견된, 가장 생산적인 사람들의 작업 패턴에 기반한 방법입니다.

📌 기본 구조
• 52분 동안 집중 작업
• 17분 완전한 휴식 (작업에서 완전히 벗어남)
• 이 사이클을 반복

📌 효과
• 최적의 생산성: 실제 데이터에 기반한 최적의 작업/휴식 비율
• 충분한 휴식: 17분의 긴 휴식으로 완전한 재충전
• 지속 가능한 집중: 포모도로보다 긴 작업 시간으로 깊은 몰입 가능
• 균형 잡힌 접근: 작업과 휴식의 과학적 균형

📌 추천 대상
• 장시간 집중이 필요한 복잡한 작업을 하는 분
• 충분한 휴식이 필요한 고강도 정신 노동자
• 포모도로보다 긴 작업 시간을 선호하는 분
• 작업과 휴식의 균형을 중요시하는 분`,
  },
  {
    id: "flowtime",
    name: "플로우타임",
    description: "집중이 끊길 때까지 작업 후 휴식",
    workDuration: 60 * 60,
    breakCalculation: (workTime) => Math.min(Math.floor(workTime / 5), 30 * 60),
    color: "#5D8BF4",
    isInfinite: true,
    showElapsed: true,
    detailedInfo: `플로우타임 기법은 포모도로 기법의 대안으로, 자연스러운 작업 흐름과 상태를 존중하는 방식입니다.

📌 기본 구조
• 시간 제한 없이 집중력이 자연스럽게 떨어질 때까지 작업
• 작업 시간에 비례하여 휴식 시간 설정 (일반적으로 작업 시간의 1/5)
• 휴식 후 다시 작업 시작

📌 효과
• 몰입 상태(Flow) 유지: 인위적인 타이머로 몰입이 방해받지 않음
• 개인화된 리듬: 자신의 집중력 패턴에 맞춘 작업
• 자연스러운 작업 전환: 작업이 완료되는 시점에 맞춰 휴식
• 낮은 스트레스: 시간 제약에 따른 압박감 감소

📌 추천 대상
• 몰입 상태가 쉽게 형성되는 분
• 포모도로의 시간 제약이 불편하신 분
• 작업의 종류에 따라 집중 시간이 크게 달라지는 분
• 창의적인 작업을 주로 하는 분`,
  },
  {
    id: "timeboxing",
    name: "타임박싱",
    description: "일정 시간동안 한 작업에 집중",
    workDuration: 50 * 60,
    breakDuration: 10 * 60,
    isCustomizable: true,
    color: "#43919B",
    isInfinite: false,
    detailedInfo: `타임박싱은 특정 작업에 정해진 시간을 할당하여 효율적으로 일정을 관리하는 기법입니다.

📌 기본 구조
• 작업마다 구체적인 시간 블록 할당
• 할당된 시간 내에 작업 완료를 목표
• 작업 후 짧은 휴식 시간
• 다음 작업으로 이동

📌 효과
• 시간 관리 향상: 작업별 명확한 시간 할당으로 계획성 강화
• 파킨슨의 법칙 방지: "작업은 주어진 시간을 채우는 경향이 있다"는 법칙 극복
• 우선순위 명확화: 중요한 작업에 적절한 시간 배분
• 과잉 완벽주의 방지: 시간 제약으로 적절한 완성도 추구

📌 추천 대상
• 여러 과목이나 프로젝트를 병행하는 학생
• 시간 관리가 필요한 직장인
• 할 일이 많아 우선순위 설정이 필요한 분
• 작업별 균형 잡힌 시간 배분이 필요한 분`,
  },
  {
    id: "custom",
    name: "사용자 정의",
    description: "원하는 시간으로 설정",
    workDuration: 45 * 60,
    breakDuration: 15 * 60,
    isCustomizable: true,
    color: "#6D9886",
    isInfinite: false,
    detailedInfo: `사용자 정의 타이머는 자신만의 작업 및 휴식 리듬에 맞춰 설정할 수 있는 유연한 방식입니다.

📌 기본 구조
• 자신에게 가장 효과적인 작업 시간 설정
• 개인에게 적합한 휴식 시간 설정
• 필요에 따라 조정 가능

📌 효과
• 맞춤형 작업 환경: 자신의 집중력 패턴에 최적화
• 상황 적응성: 작업의 종류나 컨디션에 따라 조절 가능
• 실험 가능: 다양한 시간 설정을 시도하며 최적점 발견
• 유연성: 고정된 방식의 한계를 극복

📌 추천 대상
• 기존 타이머 방식이 맞지 않는 분
• 과목이나 작업별로 다른 집중 시간이 필요한 학생
• 자신만의 최적 작업 패턴을 찾고 있는 분
• 시간 관리에 대한 실험적 접근을 원하는 분`,
  },
];

const StudyTimerScreen = () => {
  const { recordStudySession, studySessions, selectedDate, setSelectedDate } =
    usePlanner();

  // State management
  const [selectedMethod, setSelectedMethod] = useState(TIMER_METHODS[0]);
  const [timerState, setTimerState] = useState("idle"); // 'idle', 'working', 'break', 'paused'
  const [timeRemaining, setTimeRemaining] = useState(
    TIMER_METHODS[0].workDuration
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [sessionSubject, setSessionSubject] = useState("공부시간"); // Changed default from "미지정" to "공부시간"
  const [recentSubjects, setRecentSubjects] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [currentMethodInfo, setCurrentMethodInfo] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    workDuration: 45 * 60,
    breakDuration: 15 * 60,
  });
  
  // Add a new state to track whether we were in working or break mode before pausing
  const [timerModeBeforePause, setTimerModeBeforePause] = useState("working");

  // Timer refs
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalElapsedRef = useRef(0);
  const cycleLogRef = useRef([]); // New ref to track cycle logs

  // Infinite mode settings per timer method
  const [infiniteModeSettings, setInfiniteModeSettings] = useState({
    pomodoro: false,
    "52-17": false,
    flowtime: false,
    timeboxing: false,
    custom: false,
  });

  // When timer method changes, apply its infinite mode setting
  useEffect(() => {
    resetTimer();
    setIsInfiniteMode(infiniteModeSettings[selectedMethod.id]);
  }, [selectedMethod]);

  // Set to current date on init
  useEffect(() => {
    // 현재 날짜 설정
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    
    // 자정에 날짜 변경 감지 및 화면 업데이트를 위한 타이머 설정
    const checkMidnight = () => {
      const now = new Date();
      const currentDate = format(now, "yyyy-MM-dd");
      
      // 선택된 날짜와 현재 날짜가 다르면 업데이트
      if (currentDate !== selectedDate) {
        console.log(`날짜가 변경되었습니다: ${selectedDate} → ${currentDate}`);
        setSelectedDate(currentDate);
        
        // 타이머 동작 중이면 자동 저장 후 리셋
        if (timerState !== "idle") {
          stopTimer();
        }
        
        // 화면 새로고침 (타이머, 통계 등 초기화)
        resetTimer();
      }
    };
    
    // 1분마다 자정 체크 (매분 체크하여 자정이 지나면 업데이트)
    const midnightCheckInterval = setInterval(checkMidnight, 60 * 1000);
    
    // 앱이 포그라운드로 돌아올 때도 체크
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkMidnight();
      }
    };
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      clearInterval(midnightCheckInterval);
    };
  }, [selectedDate]);

  // Toggle infinite mode
  const toggleInfiniteMode = (value) => {
    setIsInfiniteMode(value);
    setInfiniteModeSettings({
      ...infiniteModeSettings,
      [selectedMethod.id]: value,
    });
  };

  // Prepare to start timer - directly start the timer now without asking for subject
  const prepareTimer = () => {
    startTimer();
  };

  // Quick restart
  const quickRestart = () => {
    resetTimer();
    startTimer();
  };

  // Start timer - FIXED to properly handle pause state
  const startTimer = () => {
    if (timerState === "idle" || timerState === "paused") {
      // Set start time for elapsed calculation
      const startTime = Date.now() - elapsedTime * 1000;
      startTimeRef.current = startTime;

      // Set current state - FIXED: properly restore the state when resuming from pause
      let newState;
      if (timerState === "paused") {
        // Resume with the same state we had before pausing
        newState = timerModeBeforePause;
      } else {
        // Starting fresh
        newState = "working";
      }

      setTimerState(newState);

      // Add a log entry for this cycle start
      if (
        newState === "working" &&
        (timerState === "idle" ||
          (timerState === "paused" &&
            timeRemaining === selectedMethod.workDuration))
      ) {
        const currentTime = new Date().toLocaleTimeString();
        cycleLogRef.current.push(`사이클 ${currentCycle} 시작: ${currentTime}`);
      }

      // Start timer
      timerRef.current = setInterval(() => {
        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        // Current phase duration
        const currentPhaseDuration =
          newState === "working"
            ? selectedMethod.workDuration
            : selectedMethod.id === "pomodoro" &&
              currentCycle % selectedMethod.cyclesBeforeLongBreak === 0
            ? selectedMethod.longBreakDuration
            : selectedMethod.breakDuration;

        // Calculate remaining time
        const remaining = Math.max(0, currentPhaseDuration - elapsed);
        setTimeRemaining(remaining);

        // Handle phase completion (unless in infinite mode)
        if (!selectedMethod.isInfinite && !isInfiniteMode && remaining <= 0) {
          clearInterval(timerRef.current);

          if (newState === "working") {
            // Work time finished -> break time
            totalElapsedRef.current += elapsed;
            handleWorkCompleted(elapsed);
          } else {
            // Break time finished -> next work time
            handleBreakCompleted();
          }
        }
      }, 1000);
    }
  };

  // Pause timer - FIXED to store current mode
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      
      // Store the current mode before pausing
      setTimerModeBeforePause(timerState);
      
      // Now set the state to paused
      setTimerState("paused");

      // Log pause event
      const currentTime = new Date().toLocaleTimeString();
      cycleLogRef.current.push(
        `사이클 ${currentCycle} 일시정지: ${currentTime}`
      );
    }
  };

  // Stop timer (and end session)
  const stopTimer = () => {
    if (timerState !== "idle") {
      clearInterval(timerRef.current);

      if (timerState === "working" || timerState === "paused") {
        // 현재 시간 추가
        totalElapsedRef.current += elapsedTime;

        // 로그에 종료 이벤트 추가
        const currentTime = new Date().toLocaleTimeString();
        cycleLogRef.current.push(`사이클 ${currentCycle} 종료: ${currentTime}`);

        // 최소 10초 이상일 때만 저장 (너무 짧은 세션은 저장하지 않음)
        if (totalElapsedRef.current >= 10) {
          // 자동 저장 후 리셋 (사용자에게 알림 없음)
          saveSessionSilently();
        } else {
          // 너무 짧은 세션은 그냥 리셋
          console.log("10초 미만의 세션은 저장하지 않습니다.");
          resetTimer();
        }
      } else {
        resetTimer();
      }
    }
  };

  // Reset timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState("idle");
    setTimeRemaining(selectedMethod.workDuration);
    setElapsedTime(0);
    setCurrentCycle(1);
    setTimerModeBeforePause("working"); // Reset the stored mode
    totalElapsedRef.current = 0;
    cycleLogRef.current = []; // Reset cycle logs
  };

  // Handle work completion
  const handleWorkCompleted = (workedTime) => {
    // Log work completion
    const currentTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(
      `사이클 ${currentCycle} 작업 완료: ${currentTime} (${formatTime(
        workedTime
      )})`
    );

    // 자동으로 다음 사이클 시작
    setCurrentCycle(currentCycle + 1);

    // Calculate break time
    let breakTime;
    if (
      selectedMethod.id === "pomodoro" &&
      currentCycle % selectedMethod.cyclesBeforeLongBreak === 0
    ) {
      breakTime = selectedMethod.longBreakDuration;
    } else if (selectedMethod.id === "flowtime") {
      breakTime = selectedMethod.breakCalculation(workedTime);
    } else {
      breakTime = selectedMethod.breakDuration;
    }

    // Log break start
    const breakStartTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(
      `사이클 ${currentCycle} 휴식 시작: ${breakStartTime}`
    );

    setTimerState("break");
    setTimeRemaining(breakTime);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, breakTime - elapsed);

      setTimeRemaining(remaining);
      setElapsedTime(elapsed);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleBreakCompleted();
      }
    }, 1000);
  };

  // Handle break completion
  const handleBreakCompleted = () => {
    // Log break completion
    const currentTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(
      `사이클 ${currentCycle} 휴식 완료: ${currentTime}`
    );

    // 자동으로 다음 작업 세션 준비
    setCurrentCycle(currentCycle + 1);
    setTimerState("idle");
    setTimeRemaining(selectedMethod.workDuration);
    setElapsedTime(0);

    // Log new cycle preparation
    const newTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(`사이클 ${currentCycle + 1} 준비됨: ${newTime}`);

    // 다음 작업 세션 바로 시작
    startTimer();
  };

  // Display timer
  const displayTimer = () => {
    if (
      selectedMethod.showElapsed ||
      (isInfiniteMode && timerState === "working")
    ) {
      // Show elapsed time
      return (
        <>
          <Text style={[styles.timerText, { color: selectedMethod.color }]}>
            {formatTime(elapsedTime)}
          </Text>
          <Text style={styles.timerLabel}>집중 시간 (경과)</Text>
        </>
      );
    } else {
      // Show remaining time
      return (
        <>
          <Text style={[styles.timerText, { color: selectedMethod.color }]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>
            {timerState === "working"
              ? "작업 시간 (남음)"
              : timerState === "break"
              ? "휴식 시간 (남음)"
              : "준비"}
          </Text>
        </>
      );
    }
  };

  // Format time (seconds -> MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format long time (seconds -> HH:MM:SS)
  const formatLongTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate total study time for today
  const getTodayTotalStudyTime = () => {
    // 오늘 날짜의 세션만 필터링
    const todaySessions = studySessions[selectedDate] || [];

    // 오늘 자정 시간 계산 (오늘 데이터 필터링용)
    const today = new Date();
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    // 오늘 자정 이후의 세션만 필터링
    const todayFilteredSessions = todaySessions.filter((session) => {
      if (!session.timestamp) return true; // 타임스탬프가 없으면 포함
      const sessionTime = new Date(session.timestamp);
      return sessionTime >= todayMidnight;
    });

    if (!Array.isArray(todayFilteredSessions)) {
      return formatLongTime(0);
    }

    // 오늘의 총 시간 계산
    const totalSeconds = todayFilteredSessions.reduce(
      (total, session) => total + session.duration,
      0
    );

    console.log(
      `오늘(${selectedDate}) 필터링된 세션: ${
        todayFilteredSessions.length
      }개, 총 시간: ${formatLongTime(totalSeconds)}`
    );
    return formatLongTime(totalSeconds);
  };

  // 세션 데이터를 자동으로 저장하는 함수 (사용자에게 알림 없음)
  const saveSessionSilently = () => {
    if (totalElapsedRef.current > 0) {
      // 세션 데이터 준비
      const sessionData = {
        id: `session-${Date.now()}`,
        date: selectedDate,
        method: selectedMethod.id,
        duration: totalElapsedRef.current,
        subject: sessionSubject, // "공부시간" 기본값 사용
        notes: cycleLogRef.current.join("\n"), // 사이클 로그를 notes에 저장
        timestamp: new Date().toISOString(),
        cycles: currentCycle,
      };

      // PlannerContext로 세션 저장 (사용자에게 알림 없음)
      recordStudySession(sessionData);

      // 저장 완료 로그
      console.log(
        `${format(
          new Date(),
          "HH:mm:ss"
        )} - 공부 세션이 자동으로 저장되었습니다. 기간: ${formatTime(
          totalElapsedRef.current
        )}`
      );
    } else {
      console.log("저장할 공부 시간이 없습니다.");
    }

    // 타이머 리셋
    resetTimer();
  };

  // Save settings
  const saveSettings = () => {
    setSelectedMethod({
      ...selectedMethod,
      workDuration: customSettings.workDuration,
      breakDuration: customSettings.breakDuration,
    });
    setTimeRemaining(customSettings.workDuration);
    setShowSettingsModal(false);
  };

  // 정보 모달 열기
  const openInfoModal = (method) => {
    setCurrentMethodInfo(method);
    setShowInfoModal(true);
  };

  // Menu handler
  const handleMenuSelect = (method) => {
    setSelectedMethod(method);
    setShowMenuModal(false);

    if (method.isCustomizable) {
      setCustomSettings({
        workDuration: method.workDuration,
        breakDuration: method.breakDuration,
      });
      setShowSettingsModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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

      <View style={styles.methodInfo}>
        <Text style={[styles.methodName, { color: selectedMethod.color }]}>
          {selectedMethod.name}
        </Text>
        <Text style={styles.methodDescription}>
          {selectedMethod.description}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        {isInfiniteMode && timerState !== "idle" && (
          <View style={styles.infiniteBadge}>
            <Text style={styles.infiniteBadgeText}>∞ 무한 모드</Text>
          </View>
        )}

        <View
          style={[styles.timerCircle, { borderColor: selectedMethod.color }]}
        >
          {displayTimer()}
          {timerState !== "idle" && (
            <Text style={styles.cycleText}>사이클: {currentCycle}</Text>
          )}
        </View>

        <View style={styles.timerControls}>
          {timerState === "idle" && (
            <TouchableOpacity style={styles.timerButton} onPress={prepareTimer}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.buttonText}>시작</Text>
            </TouchableOpacity>
          )}

          {(timerState === "working" || timerState === "break") && (
            <>
              <TouchableOpacity style={styles.timerButton} onPress={pauseTimer}>
                <Ionicons name="pause" size={24} color="#fff" />
                <Text style={styles.buttonText}>일시정지</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timerButton, styles.stopButton]}
                onPress={stopTimer}
              >
                <Ionicons name="stop" size={24} color="#fff" />
                <Text style={styles.buttonText}>종료</Text>
              </TouchableOpacity>
            </>
          )}

          {timerState === "paused" && (
            <>
              <TouchableOpacity style={styles.timerButton} onPress={startTimer}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.buttonText}>계속</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timerButton, styles.stopButton]}
                onPress={stopTimer}
              >
                <Ionicons name="stop" size={24} color="#fff" />
                <Text style={styles.buttonText}>종료</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.cycleLogContainer}>
          {cycleLogRef.current.length > 0 && (
            <View style={styles.cycleLogHeader}>
              <Text style={styles.cycleLogTitle}>사이클 기록</Text>
            </View>
          )}
          <ScrollView
            style={styles.cycleLogScrollView}
            contentContainerStyle={styles.cycleLogContent}
          >
            {cycleLogRef.current.map((log, index) => (
              <Text key={index} style={styles.cycleLogItem}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Timer Method Menu Modal */}
      <Modal visible={showMenuModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>타이머 선택</Text>

            <FlatList
              data={TIMER_METHODS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.menuItem,
                    selectedMethod.id === item.id && styles.selectedMenuItem,
                    { borderLeftColor: item.color, borderLeftWidth: 4 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuItemMain}
                    onPress={() => handleMenuSelect(item)}
                  >
                    <View style={styles.menuItemTextContainer}>
                      <Text style={styles.menuItemTitle}>{item.name}</Text>
                      <Text style={styles.menuItemDesc}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={styles.menuItemControls}>
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
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => openInfoModal(item)}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={22}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.infiniteToggleRow}>
                    <Text style={styles.infiniteToggleLabel}>무한 반복</Text>
                    <Switch
                      value={infiniteModeSettings[item.id]}
                      onValueChange={(value) => {
                        const updatedSettings = {
                          ...infiniteModeSettings,
                          [item.id]: value,
                        };
                        setInfiniteModeSettings(updatedSettings);

                        // 현재 선택된 타이머에 대한 설정이면 isInfiniteMode도 업데이트
                        if (selectedMethod.id === item.id) {
                          setIsInfiniteMode(value);
                        }
                      }}
                      trackColor={{ false: "#d0d0d0", true: item.color + "80" }}
                      thumbColor={
                        infiniteModeSettings[item.id] ? item.color : "#f4f3f4"
                      }
                    />
                  </View>
                </View>
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

      {/* 타이머 방법 상세 정보 모달 */}
      <Modal visible={showInfoModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            {currentMethodInfo && (
              <>
                <View
                  style={[
                    styles.infoModalHeader,
                    { backgroundColor: currentMethodInfo.color + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoModalTitle,
                      { color: currentMethodInfo.color },
                    ]}
                  >
                    {currentMethodInfo.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.infoModalCloseButton}
                    onPress={() => setShowInfoModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={styles.infoModalScrollContent}
                >
                  <Text style={styles.infoModalText}>
                    {currentMethodInfo.detailedInfo}
                  </Text>
                </ScrollView>

                <View style={styles.infoModalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.infoModalSelectButton,
                      { backgroundColor: currentMethodInfo.color },
                    ]}
                    onPress={() => {
                      setSelectedMethod(currentMethodInfo);
                      setShowInfoModal(false);
                      setShowMenuModal(false);
                    }}
                  >
                    <Text style={styles.infoModalSelectButtonText}>
                      이 타이머로 선택
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>타이머 설정</Text>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>작업 시간 (분)</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    // This will help with the overall screen layout
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "column",
  },
  headerRightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  menuButton: {
    padding: 4,
  },
  methodInfo: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    color: "#666",
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    // Add this to push the content up a bit
    paddingBottom: 80,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  timerLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  cycleText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
  },
  timerButton: {
    backgroundColor: "#50cebb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    minWidth: 120,
    marginTop:100
  },
  stopButton: {
    backgroundColor: "#ff6b6b",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  menuItemMain: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedMenuItem: {
    backgroundColor: "#f5f5f5",
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 12,
    color: "#666",
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  infiniteToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
    backgroundColor: "#f9f9f9",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  infiniteToggleLabel: {
    fontSize: 13,
    color: "#666",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalLabel: {
    fontSize: 16,
    color: "#333",
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  settingButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
  },
  settingButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  settingButtonText: {
    fontWeight: "bold",
    color: "#333",
  },
  settingValue: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#50cebb",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // FIXED: Moved the infinite badge position to top of timer circle
  infiniteBadge: {
    position: "absolute",
    top: 80, // Changed from 120 to 80 to position it above the timer
    backgroundColor: "#FF9500",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10, // Added zIndex to ensure it appears on top
  },
  infiniteBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  // 타이머 상세 정보 모달 스타일
  infoModalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    overflow: "hidden",
  },
  infoModalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  infoModalCloseButton: {
    padding: 4,
  },
  infoModalScrollContent: {
    padding: 16,
  },
  infoModalText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
  },
  infoModalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
  },
  infoModalSelectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  infoModalSelectButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // 사이클 기록 스타일 추가
  cycleLogContainer: {
    width: "90%",
    maxHeight: 120,
    marginTop: 20, // Changed from marginBottom to marginTop
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    position: "absolute", // Position absolutely
    bottom: -180, // Move below the timer
  },
  cycleLogHeader: {
    padding: 8,
    backgroundColor: "#e0e0e0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cycleLogTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
  },
  cycleLogScrollView: {
    maxHeight: 100,
  },
  cycleLogContent: {
    padding: 10,
  },
  cycleLogItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
});

export default StudyTimerScreen;