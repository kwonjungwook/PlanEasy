// src/screens/DailyScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { differenceInDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  AppState,
  FlatList,
  Modal,
  Platform,
  StatusBar as RNStatusBar, // 추가 확인
  SafeAreaView,
  ScrollView, // 추가 확인
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import CustomDatePicker from "../components/CustomDatePicker";
import { generateDailyChallenge } from "../components/dailybadge";
import HeaderBar from "../components/layout/HeaderBar";
import RewardPopup from "../components/RewardPopup";
// 나머지 import들...

import { useNotifications } from "../context/NotificationContext";
import { usePlanner } from "../context/PlannerContext";
import { useProgress } from "../context/ProgressContext";
import { useSubscription } from "../context/SubscriptionContext";
import {
  checkAndRescheduleNotifications,
  checkMissedSchedules,
  getNotificationEnabled,
  toggleNotifications,
  updateNotificationsForSchedules,
} from "../services/NotificationService";
import styles from "../styles/DailyStyle";

// Toast icons object
const TOAST_ICONS = {
  success: "✓",
  warning: "⚠️",
  error: "✗",
  info: "ℹ️",
  reward: "🎁",
  levelUp: "🏆",
  point: "⭐",
};

// Goal colors array
const GOAL_COLORS = [
  { bg: "#fff8e1", border: "#FFB74D", text: "#FF9F1C" }, // Yellow
  { bg: "#e3f2fd", border: "#64B5F6", text: "#1E88E5" }, // Blue
  { bg: "#f3e5f5", border: "#BA68C8", text: "#8E24AA" }, // Purple
  { bg: "#e8f5e9", border: "#81C784", text: "#43A047" }, // Green
  { bg: "#ffebee", border: "#E57373", text: "#E53935" }, // Red
  { bg: "#e0f7fa", border: "#4DD0E1", text: "#00ACC1" }, // Teal
];

export default function DailyScreen({ navigation }) {
  // =================== STATE MANAGEMENT ===================
  // App state and navigation
  const appState = useRef(AppState.currentState);

  // Rewards popup state
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewards, setRewards] = useState([]);

  // Context hooks
  const { loadNotifications } = useNotifications();
  const {
    ddaySlots,
    unusedDDaySlots,
    level,
    points,
    recentUnlocks,
    clearRecentUnlocks,
    addPoints,
    deductPoints, // 포인트 차감 함수 추가
    nextSlotPrice, // 이 속성을 추가
    purchaseDDaySlot, // 이 함수도 필요
    handleGoalAdded,
    rewardTaskCompletion, // 🔥 추가: ProgressContext의 일정 완료 함수
    undoTaskCompletion, // 🔥 추가: ProgressContext의 일정 취소 함수
  } = useProgress();

  const {
    schedules,
    goalTargets = [],
    addGoalTarget,
    updateGoalTarget,
    removeGoalTarget,
    earnedBadges,
  } = usePlanner();

  // Schedule state
  const [completedTasks, setCompletedTasks] = useState({});
  const today = format(new Date(), "PPP", { locale: ko });
  const todayWeekday = format(new Date(), "eeee", { locale: ko });
  const todayDate = format(new Date(), "yyyy-MM-dd");

  // Goal and D-Day related state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState(new Date());
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDDaySectionExpanded, setIsDDaySectionExpanded] = useState(false);
  const dDaySectionHeight = useRef(new Animated.Value(0)).current;

  // Context menu state
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  // Task statistics state
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState(null);
  const [morningTasksCompleted, setMorningTasksCompleted] = useState(0);
  const [eveningTasksCompleted, setEveningTasksCompleted] = useState(0);
  const [taskCompletionRecord, setTaskCompletionRecord] = useState({});

  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const { isSubscribed } = useSubscription();

  // Toast management
  const [inlineToasts, setInlineToasts] = useState([]);

  // Processing state for preventing duplicate clicks
  const [processingTasks, setProcessingTasks] = useState(new Set());

  // Challenge state
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [seasonalProgress, setSeasonalProgress] = useState({
    completedTasks: 0,
    challenges: {},
  });

  // 섹션 상태 저장 함수 (누락된 함수)
  const saveSectionStates = async () => {
    try {
      const states = {
        isDDaySectionExpanded,
      };
      await AsyncStorage.setItem("@section_states", JSON.stringify(states));
    } catch (error) {
      console.log("섹션 상태 저장 오류:", error);
    }
  };

  // =================== EFFECTS ===================

  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#FFFFFF");
  }, []);
  // Load notification state on mount
  useEffect(() => {
    const loadNotificationState = async () => {
      try {
        const enabled = await getNotificationEnabled();
        setNotificationEnabled(enabled);
      } catch (error) {
        console.log("알림 상태 로드 오류:", error);
      }
    };

    loadNotificationState();
  }, []);

  // Check for missed tasks on app start
  useEffect(() => {
    const checkMissedTasksOnStart = async () => {
      try {
        const allSchedules = { ...schedules };
        const anyMissed = await checkMissedSchedules(allSchedules);

        if (anyMissed && loadNotifications) {
          loadNotifications();
        }
      } catch (error) {
        console.error("지난 일정 확인 오류:", error);
      }
    };

    checkMissedTasksOnStart();
  }, [schedules]);

  // Check for reward unlocks
  useEffect(() => {
    if (recentUnlocks && recentUnlocks.length > 0) {
      setRewards(recentUnlocks);
      setShowRewardPopup(true);
    }
  }, [recentUnlocks]);

  // Load saved section states
  useEffect(() => {
    const loadSectionStates = async () => {
      try {
        const statesData = await AsyncStorage.getItem("@section_states");
        if (statesData) {
          const states = JSON.parse(statesData);
          const isExpanded = states.isDDaySectionExpanded || false;
          setIsDDaySectionExpanded(isExpanded);
          if (dDaySectionHeight && dDaySectionHeight.setValue) {
            dDaySectionHeight.setValue(isExpanded ? 1 : 0);
          }
        }
      } catch (error) {
        console.log("섹션 상태 불러오기 오류:", error);
      }
    };

    loadSectionStates();
  }, []);

  // Load task completion data
  useEffect(() => {
    const loadTaskCompletionData = async () => {
      try {
        const data = await AsyncStorage.getItem("@task_completion_data");
        if (data) {
          const parsed = JSON.parse(data);
          setTotalCompletedTasks(parsed.totalCompletedTasks || 0);
          setLastCompletionDate(parsed.lastCompletionDate);
          setMorningTasksCompleted(parsed.morningTasksCompleted || 0);
          setEveningTasksCompleted(parsed.eveningTasksCompleted || 0);
          setTaskCompletionRecord(parsed.taskCompletionRecord || {});
        }
      } catch (error) {
        console.log("태스크 완료 데이터 로드 오류:", error);
      }
    };

    loadTaskCompletionData();
  }, []);

  // Update notifications when schedule changes
  useEffect(() => {
    const updateNotifications = async () => {
      if (notificationEnabled && todaySchedules.length > 0) {
        if (updateNotifications.timer) {
          clearTimeout(updateNotifications.timer);
        }

        updateNotifications.timer = setTimeout(() => {
          updateNotificationsForSchedules(todaySchedules);
        }, 1000);
      }
    };

    updateNotifications();

    return () => {
      if (updateNotifications.timer) {
        clearTimeout(updateNotifications.timer);
      }
    };
  }, [todaySchedules, notificationEnabled]);

  // Monitor app state changes for notification rescheduling
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        notificationEnabled
      ) {
        console.log("앱이 포그라운드로 돌아옴: 알림 상태 확인");
        checkAndRescheduleNotifications(todaySchedules, notificationEnabled);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [notificationEnabled, todaySchedules]);

  // Initialize daily challenge
  useEffect(() => {
    setDailyChallenge(generateDailyChallenge());
    setSeasonalProgress({
      completedTasks: 0,
      challenges: {},
    });
  }, []);

  // 🚀 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (handleTaskUIEffects.saveTimer) {
        clearTimeout(handleTaskUIEffects.saveTimer);
      }
    };
  }, []);

  // =================== MEMOIZED VALUES ===================

  // Sort today's schedules by time
  const todaySchedules = useMemo(() => {
    return schedules[todayDate]
      ? [...schedules[todayDate]].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
        })
      : [];
  }, [schedules, todayDate]);

  // =================== FUNCTIONS ===================

  // Toast management functions
  const showInlineToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
    setInlineToasts((prev) => [...prev, { id, message, type, icon }]);

    // Auto-remove timer
    setTimeout(() => {
      setInlineToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  };

  const toggleDDaySection = () => {
    const newExpandedState = !isDDaySectionExpanded;
    setIsDDaySectionExpanded(newExpandedState);

    if (dDaySectionHeight) {
      Animated.timing(dDaySectionHeight, {
        toValue: newExpandedState ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    if (!newExpandedState && contextMenuVisible) {
      setContextMenuVisible(false);
    }

    setTimeout(() => saveSectionStates(), 100);
  };

  // 데이터 저장 함수도 업데이트
  const saveTaskCompletionData = async () => {
    try {
      const data = {
        totalCompletedTasks,
        lastCompletionDate,
        morningTasksCompleted,
        eveningTasksCompleted,
        taskCompletionRecord,
        completedTasks, // 체크박스 상태도 저장
      };
      await AsyncStorage.setItem("@task_completion_data", JSON.stringify(data));
      console.log("태스크 완료 데이터 저장 완료");
    } catch (error) {
      console.log("태스크 완료 데이터 저장 오류:", error);
    }
  };

  const playCompleteSound = async () => {
    try {
      Vibration.vibrate(100);
    } catch (error) {
      console.log("진동 실행 오류:", error);
    }
  };

  // 🔥 단순화된 UI 효과 처리 함수들
  const handleTaskUIEffects = async (task, isCompletion) => {
    try {
      // task.id를 사용하여 일관성 있는 키 생성
      const taskKey =
        task.id ||
        `${new Date().toISOString().split("T")[0]}_${task.task}_${
          task.startTime
        }_${task.endTime}`;

      if (isCompletion) {
        // 완료 기록 저장 (사운드는 이미 즉시 재생됨)
        setTaskCompletionRecord((prev) => ({
          ...prev,
          [taskKey]: true,
        }));

        updateSeasonalProgress(task);
      } else {
        // 완료 기록 삭제
        setTaskCompletionRecord((prev) => {
          const updated = { ...prev };
          delete updated[taskKey];
          return updated;
        });
      }

      // 🚀 배치 저장 최적화: 200ms 후에 저장하여 연속 클릭 시 중복 저장 방지
      if (handleTaskUIEffects.saveTimer) {
        clearTimeout(handleTaskUIEffects.saveTimer);
      }
      handleTaskUIEffects.saveTimer = setTimeout(() => {
        saveTaskCompletionData();
      }, 100);
    } catch (error) {
      console.error("태스크 UI 효과 처리 오류:", error);
    }
  };

  const toggleTaskCompletion = useCallback(
    async (taskId) => {
      // 🔥 동시 클릭 방지
      if (processingTasks.has(taskId)) {
        return;
      }

      const task = todaySchedules.find((s) => s.id === taskId);
      if (!task) {
        return;
      }

      // 처리 시작 표시
      setProcessingTasks((prev) => new Set([...prev, taskId]));

      try {
        // 현재 완료 상태 확인
        const isCurrentlyCompleted = completedTasks[taskId];

        // 🔥 즉시 UI 업데이트 및 토스트 표시 (Optimistic Update)
        setCompletedTasks((prev) => ({
          ...prev,
          [taskId]: !isCurrentlyCompleted,
        }));

        // 즉시 사운드 재생 (토스트는 백그라운드에서 실제 포인트로 표시)
        if (!isCurrentlyCompleted) {
          playCompleteSound(); // 즉시 사운드 재생
        }

        // 🔥 백그라운드에서 비동기 처리 (더욱 최적화)
        const backgroundProcess = async () => {
          let result;
          if (!isCurrentlyCompleted) {
            result = await rewardTaskCompletion(task, isCurrentlyCompleted);
            if (result.success) {
              handleTaskUIEffects(task, true);
              showInlineToast(`+${result.points}P 적립!`, "success");
            }
          } else {
            result = await undoTaskCompletion(task, isCurrentlyCompleted);
            if (result.success) {
              handleTaskUIEffects(task, false);
              showInlineToast(`-${result.points}P 차감`, "warning");
            }
          }

          // 실패 시에만 UI 롤백
          if (!result.success) {
            setCompletedTasks((prev) => ({
              ...prev,
              [taskId]: isCurrentlyCompleted, // 원래 상태로 되돌림
            }));
          }

          // 처리 완료 표시
          setProcessingTasks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        };

        // 백그라운드 처리 시작 (await 하지 않음)
        backgroundProcess().catch((error) => {
          console.error("백그라운드 처리 오류:", error);
          // 오류 시 UI 롤백
          setCompletedTasks((prev) => ({
            ...prev,
            [taskId]: isCurrentlyCompleted,
          }));
          // 처리 완료 표시
          setProcessingTasks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        });
      } catch (error) {
        console.error("태스크 상태 변경 오류:", error);
        // 오류 시 UI 롤백
        setCompletedTasks((prev) => ({
          ...prev,
          [taskId]: isCurrentlyCompleted,
        }));
        // 처리 완료 표시
        setProcessingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
    },
    [todaySchedules, completedTasks, processingTasks]
  );

  const updateSeasonalProgress = (task) => {
    setSeasonalProgress((prev) => {
      const newProgress = { ...prev };
      newProgress.completedTasks = (newProgress.completedTasks || 0) + 1;
      return newProgress;
    });
  };

  // Context menu functions
  const openContextMenu = (goalId, position) => {
    setActiveGoalId(goalId);
    setContextMenuPosition(position);
    setContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenuVisible(false);
    setActiveGoalId(null);
  };

  const handleContextMenuItem = (action) => {
    if (!activeGoalId) return;

    const goal = goalTargets.find((g) => g.id === activeGoalId);

    if (action === "edit" && goal) {
      handleEditGoal(goal);
    } else if (action === "delete") {
      handleDeleteGoal(activeGoalId);
    }

    closeContextMenu();
  };

  const handleLongPress = (goalId, event) => {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    const position = {
      top: pageY - locationY + 40,
      left: pageX - locationX + 20,
    };
    openContextMenu(goalId, position);
  };

  // Goal management functions
  const getGoalColor = (goalId) => {
    const numericId = goalId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = numericId % GOAL_COLORS.length;
    return GOAL_COLORS[colorIndex];
  };

  const calculateDDay = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diff = differenceInDays(target, today);

    if (diff === 0) return "D-Day";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert("알림", "목표 제목을 입력해주세요.");
      return;
    }

    const goalData = {
      title: goalTitle,
      targetDate: goalDate.toISOString(),
    };

    if (editingGoalId) {
      updateGoalTarget(editingGoalId, goalData);
    } else {
      addGoalTarget(goalData);

      // 구독자가 아니고 사용 가능한 슬롯이 있는 경우에만 슬롯 감소
      if (!isSubscribed && unusedDDaySlots > 0) {
        await handleGoalAdded();
      }
    }

    // 입력 초기화 및 모달 닫기
    setGoalTitle("");
    setGoalDate(new Date());
    setEditingGoalId(null);
    setShowGoalModal(false);
  };

  const handleEditGoal = (goal) => {
    setGoalTitle(goal.title);
    setGoalDate(new Date(goal.targetDate));
    setEditingGoalId(goal.id);
    setShowGoalModal(true);
  };

  const handleDeleteGoal = (goalId) => {
    Alert.alert("목표 삭제", "이 목표를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => removeGoalTarget(goalId),
      },
    ]);
  };

  // Notification functions
  const handleToggleNotifications = async (value) => {
    try {
      const success = await toggleNotifications(todaySchedules, !value);
      if (success) {
        setNotificationEnabled(value);

        if (value) {
          const alertCount = todaySchedules.length;
          if (alertCount > 0) {
            showInlineToast(`${alertCount}개의 일정 알림이 설정되었습니다`);
          } else {
            showInlineToast("설정된 오늘 일정이 없습니다");
          }
        } else {
          showInlineToast("모든 알림이 해제되었습니다");
        }
      }
    } catch (error) {
      console.error("알림 토글 오류:", error);
    }
  };

  // Utility functions
  const getTimeColor = (startTime) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour < 12) return "#FF9F1C"; // Morning
    if (hour < 17) return "#2EC4B6"; // Afternoon
    return "#7678ED"; // Evening
  };

  // =================== COMPONENTS ===================

  // Custom Toast component with properly applied opacity
  const CustomToast = ({ message, type = "success" }) => {
    const toastType = `${type}Toast`;

    return (
      <View style={styles.toast}>
        {/* 배경색 적용 레이어 */}
        <View
          style={[
            styles.toastOverlay,
            styles[toastType] || styles.successToast,
          ]}
        />
        {/* 컨텐츠 레이어 */}
        <View style={styles.toastContent}>
          <Text style={styles.toastIcon}>{TOAST_ICONS[type] || "✓"}</Text>
          <Text style={styles.toastText} numberOfLines={1} ellipsizeMode="tail">
            {message}
          </Text>
        </View>
      </View>
    );
  };

  // ToastManager 컴포넌트도 업데이트
  const ToastManager = () => {
    if (inlineToasts.length === 0) return null;

    return (
      <View style={styles.globalToastContainer}>
        {inlineToasts.map((toast) => (
          <CustomToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </View>
    );
  };

  // Custom checkbox component
  const CustomCheckbox = ({ checked, onPress }) => {
    const [scaleValue] = useState(new Animated.Value(1));

    const toggleCheckbox = () => {
      Vibration.vibrate(40);

      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      onPress();
    };

    return (
      <TouchableOpacity
        onPress={toggleCheckbox}
        style={styles.checkboxContainer}
      >
        <Animated.View
          style={[
            styles.checkbox,
            checked && styles.checkboxChecked,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          {checked && (
            <View style={styles.checkmarkContainer}>
              <View style={styles.checkmark} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Schedule Item component
  const ScheduleItem = React.memo(({ schedule }) => {
    const isCompleted = completedTasks[schedule.id] || false;
    const timeColor = getTimeColor(schedule.startTime);

    return (
      <TouchableOpacity
        style={[
          styles.scheduleItem,
          isCompleted && styles.scheduleItemCompleted,
        ]}
        onPress={() => toggleTaskCompletion(schedule.id)}
        activeOpacity={0.7}
      >
        <View style={styles.scheduleTimeIndicator}>
          <View style={[styles.timeBar, { backgroundColor: timeColor }]} />
        </View>
        <View style={styles.scheduleMainContent}>
          <View style={styles.scheduleTimeSection}>
            <Text style={[styles.scheduleTime, { color: timeColor }]}>
              {schedule.startTime}
            </Text>
            <Text style={styles.timeArrow}>~</Text>
            <Text style={[styles.scheduleTime, { color: timeColor }]}>
              {schedule.endTime}
            </Text>
          </View>
          <View style={styles.taskSection}>
            <Text
              style={[styles.scheduleTask, isCompleted && styles.completedText]}
            >
              {schedule.task}
            </Text>
          </View>
        </View>
        <CustomCheckbox
          checked={isCompleted}
          onPress={() => toggleTaskCompletion(schedule.id)}
        />
      </TouchableOpacity>
    );
  });

  // Three-dot menu icon component
  const MoreOptionsIcon = ({ onPress }) => (
    <TouchableOpacity
      style={styles.moreOptionsButton}
      onPress={onPress}
      hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
    >
      <View style={styles.moreOptionsContainer}>
        <View style={styles.moreOptionsDot} />
        <View style={styles.moreOptionsDot} />
        <View style={styles.moreOptionsDot} />
      </View>
    </TouchableOpacity>
  );

  // Goal Item component
  const GoalItem = React.memo(({ goal }) => {
    const dDay = calculateDDay(goal.targetDate);
    const goalColor = getGoalColor(goal.id);

    const handleMoreOptions = (event) => {
      const { pageX, pageY } = event.nativeEvent;
      openContextMenu(goal.id, { top: pageY, left: pageX - 120 });
    };

    return (
      <TouchableOpacity
        style={[
          styles.goalItem,
          {
            backgroundColor: goalColor.bg,
            borderLeftColor: goalColor.border,
          },
        ]}
        onLongPress={(event) => handleLongPress(goal.id, event)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <MoreOptionsIcon onPress={handleMoreOptions} />

        <View style={styles.goalInfo}>
          <Text style={[styles.dDayText, { color: goalColor.text }]}>
            {dDay}
          </Text>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDate}>
            {format(new Date(goal.targetDate), "yyyy년 MM월 dd일")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  // 🔥 새로운 컴포넌트: 닫힌 상태에서 보여줄 D-Day 프리뷰 (실제 내용 포함)
  const DDayPreviewItem = React.memo(({ goal }) => {
    const dDay = calculateDDay(goal.targetDate);
    const goalColor = getGoalColor(goal.id);

    return (
      <View
        style={[
          styles.ddayPreviewItem,
          {
            backgroundColor: goalColor.bg,
            borderColor: goalColor.border,
          },
        ]}
      >
        <Text style={[styles.ddayPreviewDDay, { color: goalColor.text }]}>
          {dDay}
        </Text>
        <Text
          style={[styles.ddayPreviewTitle, { color: goalColor.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {goal.title}
        </Text>
      </View>
    );
  });

  // Context Menu component
  const ContextMenu = () => {
    if (!contextMenuVisible) return null;

    return (
      <View
        style={[
          styles.contextMenu,
          {
            top: contextMenuPosition.top,
            left: contextMenuPosition.left,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.contextMenuItem}
          onPress={() => handleContextMenuItem("edit")}
        >
          <Text style={styles.contextMenuItemText}>수정</Text>
        </TouchableOpacity>
        <View style={styles.contextMenuDivider} />
        <TouchableOpacity
          style={styles.contextMenuItem}
          onPress={() => handleContextMenuItem("delete")}
        >
          <Text style={[styles.contextMenuItemText, styles.deleteMenuItemText]}>
            삭제
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* StatusBar 컴포넌트 추가 */}
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

      <SafeAreaView
        style={[
          styles.container,
          {
            // Android에서 강제 패딩 적용
            paddingTop:
              Platform.OS === "android" ? RNStatusBar.currentHeight || 30 : 0,
          },
        ]}
      >
        <HeaderBar
          navigation={navigation}
          badgeCount={earnedBadges?.length || 0}
          notificationCount={0}
        />
        <View style={styles.headerCompact}>
          <View style={styles.headerCompactLeft}>
            <Text style={styles.dateTextCompact}>{today}</Text>
            <Text style={styles.weekdayTextCompact}>{todayWeekday}</Text>
          </View>
          <View style={styles.headerCompactRight}>
            <View style={styles.alarmContainer}>
              <Text style={styles.alarmIcon}>
                {notificationEnabled ? "🔔" : "🔕"}
              </Text>
              <Text style={styles.alarmText}>
                {notificationEnabled ? "일정알림" : "알림해제"}
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#50cebb" }}
                thumbColor={notificationEnabled ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleToggleNotifications}
                value={notificationEnabled}
                style={styles.notificationSwitch}
              />
            </View>
            <View style={styles.completionCardCompact}>
              <Text style={styles.completionTextCompact}>
                <Text style={styles.completionNumberCompact}>
                  {Object.values(completedTasks).filter(Boolean).length}
                </Text>
                <Text style={styles.completionTotalCompact}>
                  /{todaySchedules.length}
                </Text>
              </Text>
              <Text style={styles.completionLabelCompact}>완료</Text>
            </View>
          </View>
        </View>

        {/* 🔥 새로운 D-Day Goal Section */}
        <View style={styles.goalContainerWrapper}>
          <View style={styles.goalHeaderContainer}>
            <View style={styles.goalHeaderLeft}>
              <TouchableOpacity
                style={styles.goalHeaderClickable}
                onPress={toggleDDaySection}
                activeOpacity={0.7}
              >
                <Text style={styles.goalHeader}>🎯 D-Day</Text>
                <View
                  style={[
                    styles.slotCountContainer,
                    isSubscribed && styles.slotCountContainerPro,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotCountText,
                      isSubscribed && styles.slotCountTextPro,
                    ]}
                  >
                    {isSubscribed
                      ? "PRO"
                      : `${goalTargets.length}/${ddaySlots}`}
                  </Text>
                </View>

                {!isSubscribed && unusedDDaySlots > 0 && (
                  <View style={styles.unusedSlotIndicator}>
                    <Text style={styles.unusedSlotText}>
                      +{unusedDDaySlots}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 🔥 닫힌 상태에서 D-Day 프리뷰 표시 (가로 스크롤 가능) */}
              {!isDDaySectionExpanded && goalTargets.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={true}
                  style={styles.ddayPreviewScrollView}
                  contentContainerStyle={styles.ddayPreviewScrollContent}
                >
                  {goalTargets.map((goal) => (
                    <DDayPreviewItem key={goal.id} goal={goal} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.goalHeaderRight}>
              {/* 🔥 +추가 버튼은 펼쳐진 상태에서만 표시 */}
              {isDDaySectionExpanded && (
                <TouchableOpacity
                  style={[styles.addGoalButtonCute]}
                  onPress={() => {
                    // 구독자인 경우 항상 추가 가능하게 변경
                    if (
                      isSubscribed ||
                      goalTargets.length < ddaySlots ||
                      unusedDDaySlots > 0
                    ) {
                      setGoalTitle("");
                      setGoalDate(new Date());
                      setEditingGoalId(null);
                      setShowGoalModal(true);
                    } else {
                      // 비구독자이고 슬롯이 부족한 경우 구매 안내
                      Alert.alert(
                        "D-Day 슬롯 부족",
                        `추가 D-Day를 설정하려면 슬롯이 필요합니다.\n\n방법 1: ${nextSlotPrice} 포인트로 구매\n방법 2: 구독으로 무제한 사용`,
                        [
                          {
                            text: "구독하기",
                            onPress: () => navigation.navigate("Subscription"),
                          },
                          {
                            text: "포인트로 구매",
                            onPress: async () => {
                              if (points >= nextSlotPrice) {
                                const success = await purchaseDDaySlot();
                                if (success) {
                                  showInlineToast(
                                    "D-Day 슬롯을 구매했습니다. 이제 새 D-Day를 추가할 수 있습니다.",
                                    "success"
                                  );
                                }
                              } else {
                                showInlineToast(
                                  `포인트가 부족합니다. (필요: ${nextSlotPrice}P)`,
                                  "warning"
                                );
                              }
                            },
                          },
                          { text: "취소", style: "cancel" },
                        ]
                      );
                    }
                  }}
                >
                  <Text style={styles.addGoalButtonTextCute}>
                    {!isSubscribed &&
                    goalTargets.length >= ddaySlots &&
                    unusedDDaySlots <= 0
                      ? "구매 필요"
                      : "+ 추가"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={toggleDDaySection}
                style={styles.collapseIconButton}
              >
                <Text style={styles.collapseIcon}>
                  {isDDaySectionExpanded ? "▼" : "▲"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[
              styles.goalContentContainer,
              {
                maxHeight:
                  dDaySectionHeight?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 160],
                  }) || 0,
                opacity: dDaySectionHeight || 0,
              },
            ]}
          >
            {goalTargets && goalTargets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.goalScroll}
                contentContainerStyle={styles.goalScrollContent}
              >
                {goalTargets.map((goal) => (
                  <GoalItem key={goal.id} goal={goal} />
                ))}

                {goalTargets.length < ddaySlots &&
                  Array.from({ length: ddaySlots - goalTargets.length }).map(
                    (_, index) => (
                      <TouchableOpacity
                        key={`empty-slot-${index}`}
                        style={styles.emptyGoalItem}
                        onPress={() => {
                          setGoalTitle("");
                          setGoalDate(new Date());
                          setEditingGoalId(null);
                          setShowGoalModal(true);
                        }}
                      >
                        <Text style={styles.emptyGoalIcon}>+</Text>
                        <Text style={styles.emptyGoalText}>D-Day 추가</Text>
                      </TouchableOpacity>
                    )
                  )}
              </ScrollView>
            ) : (
              <View style={styles.emptyGoalsContainer}>
                <Text style={styles.emptyGoalsText}>
                  중요한 날짜에 D-Day 목표를 추가해보세요.
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Reward popup */}
        <RewardPopup
          visible={showRewardPopup}
          rewards={rewards}
          title="축하합니다!"
          message="새로운 보상을 획득했습니다"
          onClose={() => {
            setShowRewardPopup(false);
            clearRecentUnlocks();
          }}
        />

        {/* Schedule List */}
        <View style={styles.scrollContainer}>
          <FlatList
            data={todaySchedules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ScheduleItem schedule={item} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>오늘은 일정이 없어요</Text>
                <Text style={styles.emptySubText}>쉬는 날을 즐기세요!</Text>
              </View>
            )}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            removeClippedSubviews
            initialNumToRender={10}
            getItemLayout={(_, i) => ({ length: 72, offset: 72 * i, index: i })} // 셀 높이 72px 가정
          />
        </View>

        {/* Toast Manager */}
        <ToastManager />

        {/* Goal Add/Edit Modal */}
        <Modal
          visible={showGoalModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGoalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {editingGoalId ? "목표 수정" : "새 목표 추가"}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="목표 제목"
                value={goalTitle}
                onChangeText={setGoalTitle}
              />

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  목표일: {format(goalDate, "yyyy년 MM월 dd일")}
                </Text>
              </TouchableOpacity>

              {/* 이 컴포넌트로 대체 */}
              <CustomDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={(selectedDate) => {
                  setGoalDate(selectedDate);
                  setShowDatePicker(false);
                }}
                initialDate={goalDate}
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setGoalTitle("");
                    setGoalDate(new Date());
                    setEditingGoalId(null);
                    setShowGoalModal(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleSaveGoal}
                >
                  <Text style={styles.modalSaveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Context Menu Overlay */}
        {contextMenuVisible && (
          <TouchableOpacity
            style={styles.contextMenuOverlay}
            onPress={closeContextMenu}
            activeOpacity={1}
          >
            <ContextMenu />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}
