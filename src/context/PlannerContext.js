// src/context/PlannerContext.js - 최적화 버전
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { eventBus } from "../utils/eventBus";

// 순환 참조 대신 직접 import
import {
  generateFeedback,
  initFeedbackService,
  updateReportScheduling,
  setReportCallback, // 새 함수 import
} from "../services/ImprovedFeedbackService";

// PlannerContext 생성
const PlannerContext = createContext();

// 상수 정의
const STORAGE_KEYS = {
  TASKS: "tasks",
  SCHEDULES: "schedules",
  WEEKDAY_SCHEDULE: "defaultWeekdaySchedule",
  WEEKEND_SCHEDULE: "defaultWeekendSchedule",
  DAILY_SCHEDULES: "dailySchedules",
  WEEKLY_SCHEDULES: "weeklySchedules",
  NOTIFICATIONS: "notifications",
  CUSTOM_SCHEDULES: "customSchedules",
  STUDY_SESSIONS: "studySessions",
  AI_REPORTS: "aiReports",
  PREMIUM_USER: "isPremiumUser",
  WEEKLY_STATS: "weeklyStats",
  MONTHLY_STATS: "monthlyStats",
  ALLOW_SYNC: "allowDailyScheduleSync",
  GOAL_TARGETS: "goalTargets",
};

// 요일 매핑 상수
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function PlannerProvider({ children }) {
  // 기본 상태 설정
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [tasks, setTasks] = useState({});
  const [studySessions, setStudySessions] = useState({});
  const [schedules, setSchedules] = useState({});
  const [defaultWeekdaySchedule, setDefaultWeekdaySchedule] = useState([]);
  const [defaultWeekendSchedule, setDefaultWeekendSchedule] = useState([]);
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [aiReports, setAiReports] = useState({});
  const [weeklyStats, setWeeklyStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [goalTargets, setGoalTargets] = useState([]);

  useEffect(() => {
    // 앱 시작 시 데이터 로드
    loadSavedData();
  }, []);

  const addGoalTarget = async (goalData) => {
    try {
      const newGoal = {
        ...goalData,
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedGoals = [...goalTargets, newGoal];
      setGoalTargets(updatedGoals);

      await AsyncStorage.setItem(
        STORAGE_KEYS.GOAL_TARGETS,
        JSON.stringify(updatedGoals)
      );
      console.log("목표 추가 완료:", newGoal.title);

      // 이벤트 발생 - ProgressContext에서 이 이벤트를 구독함
      eventBus.emit("goalAdded", { goalId: newGoal.id });

      return true;
    } catch (error) {
      console.error("목표 추가 오류:", error);
      return false;
    }
  };

  // 목표 수정 함수
  const updateGoalTarget = async (goalId, updatedData) => {
    try {
      const updatedGoals = goalTargets.map((goal) =>
        goal.id === goalId
          ? { ...goal, ...updatedData, updatedAt: new Date().toISOString() }
          : goal
      );

      setGoalTargets(updatedGoals);

      await AsyncStorage.setItem(
        STORAGE_KEYS.GOAL_TARGETS,
        JSON.stringify(updatedGoals)
      );
      console.log("목표 업데이트 완료:", goalId);
      return true;
    } catch (error) {
      console.error("목표 업데이트 오류:", error);
      return false;
    }
  };

  // 목표 삭제 함수
  const removeGoalTarget = async (goalId) => {
    try {
      const updatedGoals = goalTargets.filter((goal) => goal.id !== goalId);

      setGoalTargets(updatedGoals);

      await AsyncStorage.setItem(
        STORAGE_KEYS.GOAL_TARGETS,
        JSON.stringify(updatedGoals)
      );
      console.log("목표 삭제 완료:", goalId);
      return true;
    } catch (error) {
      console.error("목표 삭제 오류:", error);
      return false;
    }
  };

  // 현재 목표 가져오기 함수
  const getCurrentGoals = () => {
    // 오늘 날짜 기준으로 정렬된 목표 리스트 반환
    const today = new Date();

    return [...goalTargets].sort((a, b) => {
      const dateA = new Date(a.targetDate);
      const dateB = new Date(b.targetDate);

      // 미래 날짜는 D-Day에 가까운 순으로 정렬
      if (dateA >= today && dateB >= today) {
        return dateA - dateB;
      }

      // 과거 날짜는 최근 순으로 정렬
      if (dateA < today && dateB < today) {
        return dateB - dateA;
      }

      // 미래 날짜를 과거 날짜보다 먼저 표시
      return dateA >= today ? -1 : 1;
    });
  };

  // 요일별 일정(DaySchedule용)과 주간 시간표(WeeklyTimetable용) 분리
  const [dailySchedules, setDailySchedules] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // 주간 시간표 상태
  const [weeklySchedules, setWeeklySchedules] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // 동기화 설정 - 기본값 항상 false
  const [allowDailyScheduleSync, setAllowDailyScheduleSync] = useState(false);
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    // 피드백 서비스 초기화
    initFeedbackService({ isPremiumUser });

    // 리포트 콜백 등록 - 무한 재귀 방지
    // 주의: 이 콜백은 더 이상 사용되지 않으므로, 빈 함수로 대체
    setReportCallback(() => {
      // 데이터 반환 대신 null 반환
      return null;
    });

    // 프리미엄 사용자 자동 리포트 스케줄링 설정
    if (isPremiumUser) {
      updateReportScheduling(true);
      console.log("프리미엄 사용자 자동 리포트 설정 완료");
    }
  }, [
    isPremiumUser,
    schedules,
    tasks,
    studySessions,
    weeklyStats,
    monthlyStats,
    goalTargets,
  ]);

  // 데이터 로드 함수
  const loadSavedData = async () => {
    try {
      const [
        tasksData,
        schedulesData,
        weekdayData,
        weekendData,
        dailyData,
        weeklyData,
        notificationsData,
        customSchedulesData,
        studySessionsData,
        aiReportsData,
        premiumStatusData,
        weeklyStatsData,
        monthlyStatsData,
        goalTargetsData, // 목표 데이터 변수 추가
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKDAY_SCHEDULE),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKEND_SCHEDULE),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.AI_REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_USER),
        AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_STATS),
        AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_STATS),
        AsyncStorage.getItem(STORAGE_KEYS.GOAL_TARGETS), // 여기에 추가
      ]);

      // 각 상태 설정
      if (tasksData) setTasks(JSON.parse(tasksData));
      if (schedulesData) setSchedules(JSON.parse(schedulesData));
      if (weekdayData) setDefaultWeekdaySchedule(JSON.parse(weekdayData));
      if (weekendData) setDefaultWeekendSchedule(JSON.parse(weekendData));
      if (dailyData) setDailySchedules(JSON.parse(dailyData));
      if (weeklyData) setWeeklySchedules(JSON.parse(weeklyData));
      if (notificationsData) setNotifications(JSON.parse(notificationsData));
      if (customSchedulesData)
        setCustomSchedules(JSON.parse(customSchedulesData));
      if (studySessionsData) setStudySessions(JSON.parse(studySessionsData));
      if (aiReportsData) setAiReports(JSON.parse(aiReportsData));
      if (weeklyStatsData) setWeeklyStats(JSON.parse(weeklyStatsData));
      if (monthlyStatsData) setMonthlyStats(JSON.parse(monthlyStatsData));
      if (goalTargetsData) setGoalTargets(JSON.parse(goalTargetsData)); // 목표 데이터 설정

      // 프리미엄 상태 설정
      if (premiumStatusData) {
        const isPremium = JSON.parse(premiumStatusData);
        setIsPremiumUser(isPremium);
        console.log(
          `프리미엄 상태 로드됨: ${isPremium ? "프리미엄" : "무료"} 사용자`
        );
      }

      // 항상 동기화 설정을 false로 초기화
      setAllowDailyScheduleSync(false);
      await AsyncStorage.setItem(
        STORAGE_KEYS.ALLOW_SYNC,
        JSON.stringify(false)
      );

      console.log("앱 시작 시 데이터 로드 완료");
    } catch (error) {
      console.error("Error loading saved data:", error);
      // 기본값 설정으로 앱 안정성 강화
      setTasks({});
      setSchedules({});
      setStudySessions({});
      setAiReports({});
      setWeeklyStats({});
      setMonthlyStats({});
      setGoalTargets([]);
      setIsPremiumUser(false);
    }
  };

  /**
   * 일정 관련 함수들
   */

  // 일정 ID 생성 함수
  const prepareScheduleForSave = (schedule, type = "user") => {
    const newSchedule = { ...schedule };

    // ID가 없으면 새로 생성
    if (!newSchedule.id) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);

      if (type === "weekly") {
        newSchedule.id = `weekly-${timestamp}-${random}`;
      } else if (type === "calendar") {
        newSchedule.id = `calendar-${timestamp}-${random}`;
      } else if (type === "day") {
        newSchedule.id = `day-${timestamp}-${random}`;
      } else {
        newSchedule.id = `user-${timestamp}-${random}`;
      }
    }

    return newSchedule;
  };

  // 일정 유형 식별 함수
  const getScheduleType = (schedule) => {
    if (!schedule || !schedule.id) return "unknown";

    if (schedule.id.startsWith("weekly-")) {
      return "weekly"; // 주간 동기화에서 생성된 일정
    } else if (schedule.id.includes("-calendar-")) {
      return "calendar"; // 캘린더에서 직접 생성된 일정
    } else if (schedule.id.startsWith("day-")) {
      return "day"; // 요일별 일정에서 생성된 일정
    } else {
      return "user"; // 사용자가 직접 생성한 일정
    }
  };

  // 특정 날짜의 일정 가져오기
  const getScheduleForDate = (date) => {
    return schedules[date] || [];
  };

  // 캘린더 일정만 저장 (다른 일정 영향 없음)
  const saveSchedulesOnly = async (date, newSchedules) => {
    try {
      console.log("saveSchedulesOnly 호출됨 - 캘린더 일정 저장");

      let updatedSchedules;
      if (date === "all") {
        // 모든 날짜의 일정을 시간순으로 정렬
        updatedSchedules = Object.entries(newSchedules).reduce(
          (acc, [date, schedules]) => {
            acc[date] = [...schedules].sort((a, b) => {
              const timeA = a.startTime.split(":").map(Number);
              const timeB = b.startTime.split(":").map(Number);
              return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
            });
            return acc;
          },
          {}
        );
      } else {
        // 특정 날짜의 일정만 시간순으로 정렬
        const sortedSchedules = [...newSchedules].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
        });

        updatedSchedules = {
          ...schedules,
          [date]: sortedSchedules,
        };
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULES,
        JSON.stringify(updatedSchedules)
      );
      setSchedules(updatedSchedules);
      return true;
    } catch (error) {
      console.error("Error in saveSchedulesOnly:", error);
      throw error;
    }
  };

  // 요일별 일정 저장 함수 (DaySchedule 전용)
  const saveDailyScheduleOnly = async (schedules) => {
    try {
      console.log("saveDailyScheduleOnly 호출됨 - 요일별 일정 저장");
      await AsyncStorage.setItem(
        STORAGE_KEYS.DAILY_SCHEDULES,
        JSON.stringify(schedules)
      );
      setDailySchedules(schedules);
      return true;
    } catch (error) {
      console.error("Error saving daily schedule:", error);
      throw error;
    }
  };

  // 주간 시간표 저장 함수 (WeeklyTimetableScreen 전용)
  const saveWeeklyScheduleOnly = async (schedules) => {
    try {
      console.log("saveWeeklyScheduleOnly 호출됨 - 주간 시간표 저장");
      await AsyncStorage.setItem(
        STORAGE_KEYS.WEEKLY_SCHEDULES,
        JSON.stringify(schedules)
      );
      setWeeklySchedules(schedules);
      return true;
    } catch (error) {
      console.error("Error saving weekly schedule:", error);
      throw error;
    }
  };

  // 커스텀 일정 저장 함수
  const saveCustomSchedulesOnly = async (schedules) => {
    try {
      console.log("saveCustomSchedulesOnly 호출됨 - 사용자 커스텀 일정 저장");
      await AsyncStorage.setItem(
        STORAGE_KEYS.CUSTOM_SCHEDULES,
        JSON.stringify(schedules)
      );
      setCustomSchedules(schedules);
      return true;
    } catch (error) {
      console.error("Error saving custom schedules:", error);
      throw error;
    }
  };

  // 기본 일정 저장 함수
  const saveDefaultSchedule = async (schedule, isWeekday) => {
    try {
      const key = isWeekday
        ? STORAGE_KEYS.WEEKDAY_SCHEDULE
        : STORAGE_KEYS.WEEKEND_SCHEDULE;
      await AsyncStorage.setItem(key, JSON.stringify(schedule));
      if (isWeekday) {
        setDefaultWeekdaySchedule(schedule);
      } else {
        setDefaultWeekendSchedule(schedule);
      }
      return true;
    } catch (error) {
      console.error("Error saving default schedule:", error);
      return false;
    }
  };

  // 일정 업데이트 함수
  const updateSchedule = async (date, newSchedule) => {
    try {
      console.log("updateSchedule 호출됨");
      return await saveSchedulesOnly(date, newSchedule);
    } catch (error) {
      console.error("Error in updateSchedule:", error);
      throw error;
    }
  };

  // 기본 일정 적용 함수
  const applyDefaultSchedule = async (date) => {
    try {
      const dayOfWeek = new Date(date).getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const defaultSchedule = isWeekday
        ? defaultWeekdaySchedule
        : defaultWeekendSchedule;

      if (defaultSchedule.length > 0) {
        await updateSchedule(date, defaultSchedule);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error applying default schedule:", error);
      return false;
    }
  };

  // 일정 편집 함수
  const editSchedule = async (date, scheduleId, updatedSchedule) => {
    try {
      const currentSchedules = schedules[date] || [];
      const updatedSchedules = currentSchedules.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, ...updatedSchedule }
          : schedule
      );

      return await updateSchedule(date, updatedSchedules);
    } catch (error) {
      console.error("Error editing schedule:", error);
      return false;
    }
  };

  // 일정 삭제 함수
  const deleteSchedule = async (date, scheduleId) => {
    try {
      const currentSchedules = schedules[date] || [];
      const updatedSchedules = currentSchedules.filter(
        (schedule) => schedule.id !== scheduleId
      );

      return await updateSchedule(date, updatedSchedules);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      return false;
    }
  };

  // 캘린더 → 주간 시간표 동기화 함수
  const syncCalendarToWeekly = async (dates, newSchedules) => {
    try {
      console.log("syncCalendarToWeekly 호출됨 - 캘린더→주간 시간표 동기화");

      // 1. 적용된 일정이 있는 날짜들에 대한 요일 매핑 찾기
      const updatedWeeklySchedules = { ...weeklySchedules };
      let syncCount = 0;

      dates.forEach((dateString) => {
        const dateSchedules = newSchedules[dateString] || [];
        if (!dateSchedules || dateSchedules.length === 0) return;

        // 날짜의 요일 확인
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ...
        const dayKey = DAY_KEYS[dayOfWeek];

        // 해당 요일의 기존 주간 동기화 일정 제거
        if (updatedWeeklySchedules[dayKey]) {
          updatedWeeklySchedules[dayKey] = updatedWeeklySchedules[
            dayKey
          ].filter((schedule) => getScheduleType(schedule) !== "weekly");
        } else {
          updatedWeeklySchedules[dayKey] = [];
        }

        // 새 일정 추가
        dateSchedules.forEach((schedule) => {
          console.log("처리 중인 일정:", schedule.task, "날짜:", dateString);

          const weeklySchedule = prepareScheduleForSave(
            { ...schedule, originalDate: dateString },
            "weekly"
          );

          updatedWeeklySchedules[dayKey].push(weeklySchedule);
          syncCount++;
        });

        // 시간순 정렬
        updatedWeeklySchedules[dayKey].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
        });
      });

      // 주간 시간표 저장
      if (syncCount > 0) {
        await saveWeeklyScheduleOnly(updatedWeeklySchedules);
      }

      return syncCount;
    } catch (error) {
      console.error("syncCalendarToWeekly 오류:", error);
      throw error;
    }
  };

  // 동기화 설정 함수 (항상 false로 설정)
  const toggleDailyScheduleSync = async () => {
    try {
      console.log("toggleDailyScheduleSync 호출됨: false로 설정");
      await AsyncStorage.setItem(
        STORAGE_KEYS.ALLOW_SYNC,
        JSON.stringify(false)
      );
      setAllowDailyScheduleSync(false);
      return true;
    } catch (error) {
      console.error("동기화 설정 변경 오류:", error);
      return false;
    }
  };

  // 드래그 앤 드롭 시작
  const startDrag = useCallback((schedule) => {
    setDraggedSchedule(schedule);
  }, []);

  // 드래그 앤 드롭 종료
  const endDrag = useCallback(
    (targetDate) => {
      if (draggedSchedule && targetDate) {
        updateSchedule(targetDate, [
          ...(schedules[targetDate] || []),
          draggedSchedule,
        ]);
        setDraggedSchedule(null);
      }
    },
    [draggedSchedule, schedules]
  );

  /**
   * 할 일 관련 함수들
   */

  // 할 일 저장 함수
  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      setTasks(newTasks);
      return true;
    } catch (error) {
      console.error("Error saving tasks:", error);
      return false;
    }
  };

  // 할 일 체크/해제 함수
  const toggleTask = async (date, taskId) => {
    try {
      const dateTask = tasks[date] || {};
      const newTasks = {
        ...tasks,
        [date]: {
          ...dateTask,
          [taskId]: !dateTask[taskId],
        },
      };

      setTasks(newTasks);
      await saveTasks(newTasks);
      return true;
    } catch (error) {
      console.error("Error toggling task:", error);
      return false;
    }
  };

  /**
   * 공부 세션 관련 함수들
   */

  // 공부 세션 저장 함수
  const recordStudySession = async (sessionData) => {
    try {
      console.log("공부 세션 기록 중:", sessionData);

      const { date } = sessionData;
      let currentSessions = studySessions[date] || [];

      // 이미 배열이 아닌 경우 초기화
      if (!Array.isArray(currentSessions)) {
        currentSessions = [];
      }

      // 30일 이전의 데이터는 제거
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");

      // 30일 이전 데이터 필터링
      const filteredSessions = {};
      Object.entries(studySessions).forEach(([sessionDate, sessions]) => {
        if (sessionDate >= thirtyDaysAgoStr || sessionDate === date) {
          filteredSessions[sessionDate] = sessions;
        }
      });

      // 새 세션 추가
      const updatedSessions = {
        ...filteredSessions,
        [date]: [...currentSessions, sessionData],
      };

      // 공부 세션 데이터 저장
      await AsyncStorage.setItem(
        STORAGE_KEYS.STUDY_SESSIONS,
        JSON.stringify(updatedSessions)
      );
      setStudySessions(updatedSessions);

      // 통계 데이터 업데이트
      await updateStatistics(date, sessionData);

      console.log(`${date} 날짜에 새 공부 세션이 기록되었습니다.`);
      return true;
    } catch (error) {
      console.error("공부 세션 기록 오류:", error);
      return false;
    }
  };

  // 공부 세션 삭제 함수
  const deleteStudySession = async (date, sessionId) => {
    try {
      console.log(`${date} 날짜의 세션 ${sessionId} 삭제 중...`);

      const dateSessions = studySessions[date] || [];
      const updatedDateSessions = dateSessions.filter(
        (session) => session.id !== sessionId
      );

      const updatedSessions = {
        ...studySessions,
        [date]: updatedDateSessions,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.STUDY_SESSIONS,
        JSON.stringify(updatedSessions)
      );
      setStudySessions(updatedSessions);

      console.log(`${date} 날짜의 세션 ${sessionId}가 삭제되었습니다.`);
      return true;
    } catch (error) {
      console.error("공부 세션 삭제 오류:", error);
      return false;
    }
  };

  // 화면에 표시할 세션 데이터 가져오기
  const getDisplayStudySessions = () => {
    try {
      // 오늘 날짜
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      // 어제 날짜
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = format(yesterday, "yyyy-MM-dd");

      // 오늘과 어제의 데이터만 표시
      const displaySessions = {};

      if (studySessions[todayStr]) {
        displaySessions[todayStr] = studySessions[todayStr];
      }

      if (studySessions[yesterdayStr]) {
        displaySessions[yesterdayStr] = studySessions[yesterdayStr];
      }

      return displaySessions;
    } catch (error) {
      console.error("표시용 세션 데이터 조회 오류:", error);
      return studySessions; // 오류 시 모든 세션 반환
    }
  };

  // 일별 공부 시간 계산 함수
  const getTotalStudyTimeForDate = (date) => {
    try {
      const dateSessions = studySessions[date] || [];

      // 해당 날짜의 자정 시간 계산
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 해당 날짜의 세션만 필터링
      const filteredSessions = dateSessions.filter((session) => {
        if (!session.timestamp) return true; // 타임스탬프가 없으면 포함

        const sessionTime = new Date(session.timestamp);
        return sessionTime >= startOfDay && sessionTime <= endOfDay;
      });

      // 필터링된 세션의 총 시간 계산
      return filteredSessions.reduce(
        (total, session) => total + session.duration,
        0
      );
    } catch (error) {
      console.error("일별 공부 시간 계산 오류:", error);
      return 0;
    }
  };

  // 기간별 공부 시간 계산 함수
  const getTotalStudyTimeForRange = (startDate, endDate) => {
    try {
      let totalSeconds = 0;

      // 날짜 범위 내의 모든 날짜 배열 생성
      const dateArray = [];
      let currentDay = new Date(startDate);
      const lastDay = new Date(endDate);

      while (currentDay <= lastDay) {
        dateArray.push(format(currentDay, "yyyy-MM-dd"));
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // 날짜별 데이터 수집
      dateArray.forEach((dayStr) => {
        const dateSessions = studySessions[dayStr] || [];

        // 이 날짜의 총 시간 계산
        const dayTotalTime = dateSessions.reduce(
          (total, session) => total + (session.duration || 0),
          0
        );

        totalSeconds += dayTotalTime;
      });

      return totalSeconds;
    } catch (error) {
      console.error("기간별 공부 시간 계산 오류:", error);
      return 0;
    }
  };

  // 과목별 공부 시간 분석 함수
  const getStudyTimeBySubject = (startDate, endDate) => {
    try {
      const subjectTimes = {};

      // 날짜 범위 내의 모든 날짜 배열 생성
      const dateArray = [];
      let currentDay = new Date(startDate);
      const lastDay = new Date(endDate);

      while (currentDay <= lastDay) {
        dateArray.push(format(currentDay, "yyyy-MM-dd"));
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // 날짜별 데이터 수집
      dateArray.forEach((dayStr) => {
        const dateSessions = studySessions[dayStr] || [];

        // 세션별 과목 시간 합산
        dateSessions.forEach((session) => {
          const subject = session.subject || "미지정";
          subjectTimes[subject] =
            (subjectTimes[subject] || 0) + (session.duration || 0);
        });
      });

      return subjectTimes;
    } catch (error) {
      console.error("과목별 공부 시간 분석 오류:", error);
      return {};
    }
  };

  // 공부법별 공부 시간 분석 함수
  const getStudyTimeByMethod = (startDate, endDate) => {
    try {
      const methodTimes = {};

      // 날짜 범위 내의 모든 날짜 배열 생성
      const dateArray = [];
      let currentDay = new Date(startDate);
      const lastDay = new Date(endDate);

      while (currentDay <= lastDay) {
        dateArray.push(format(currentDay, "yyyy-MM-dd"));
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // 날짜별 데이터 수집
      dateArray.forEach((dayStr) => {
        const dateSessions = studySessions[dayStr] || [];

        // 세션별 방법 시간 합산
        dateSessions.forEach((session) => {
          const method = session.method || "기타";
          methodTimes[method] =
            (methodTimes[method] || 0) + (session.duration || 0);
        });
      });

      return methodTimes;
    } catch (error) {
      console.error("공부법별 공부 시간 분석 오류:", error);
      return {};
    }
  };

  /**
   * 통계 및 리포트 관련 함수들
   */

  // 일일 데이터 기반 통계 업데이트 함수
  const updateStatistics = async (date, newSession) => {
    try {
      // 1. 날짜에서 연도, 주차, 월 정보 추출
      const sessionDate = new Date(date);
      const year = sessionDate.getFullYear();

      // 월 정보 (1월=0 이므로 +1)
      const month = sessionDate.getMonth() + 1;
      const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

      // 주차 정보 계산
      const firstDayOfYear = new Date(year, 0, 1);
      const daysSinceFirstDay = Math.floor(
        (sessionDate - firstDayOfYear) / (24 * 60 * 60 * 1000)
      );
      const weekNumber = Math.ceil(
        (daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7
      );
      const weekKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

      // 2. 세션 정보에서 필요한 데이터 추출
      const { duration, subject, method } = newSession;

      // 3. 주간 통계 업데이트
      const currentWeeklyStats = { ...weeklyStats };
      if (!currentWeeklyStats[weekKey]) {
        currentWeeklyStats[weekKey] = {
          year,
          week: weekNumber,
          totalDuration: 0,
          subjectDurations: {},
          methodDurations: {},
          dailyDurations: {},
          startDate: date,
          lastUpdated: new Date().toISOString(),
        };
      }

      // 주간 총 시간 업데이트
      currentWeeklyStats[weekKey].totalDuration += duration;

      // 과목별 시간 업데이트
      if (!currentWeeklyStats[weekKey].subjectDurations[subject]) {
        currentWeeklyStats[weekKey].subjectDurations[subject] = 0;
      }
      currentWeeklyStats[weekKey].subjectDurations[subject] += duration;

      // 방법별 시간 업데이트
      if (!currentWeeklyStats[weekKey].methodDurations[method]) {
        currentWeeklyStats[weekKey].methodDurations[method] = 0;
      }
      currentWeeklyStats[weekKey].methodDurations[method] += duration;

      // 일별 시간 업데이트
      if (!currentWeeklyStats[weekKey].dailyDurations[date]) {
        currentWeeklyStats[weekKey].dailyDurations[date] = 0;
      }
      currentWeeklyStats[weekKey].dailyDurations[date] += duration;

      // 마지막 업데이트 시간 갱신
      currentWeeklyStats[weekKey].lastUpdated = new Date().toISOString();

      // 4. 월간 통계 업데이트
      const currentMonthlyStats = { ...monthlyStats };
      if (!currentMonthlyStats[monthKey]) {
        currentMonthlyStats[monthKey] = {
          year,
          month,
          totalDuration: 0,
          subjectDurations: {},
          methodDurations: {},
          dailyDurations: {},
          weeklyDurations: {},
          lastUpdated: new Date().toISOString(),
        };
      }

      // 월간 총 시간 업데이트
      currentMonthlyStats[monthKey].totalDuration += duration;

      // 과목별 시간 업데이트
      if (!currentMonthlyStats[monthKey].subjectDurations[subject]) {
        currentMonthlyStats[monthKey].subjectDurations[subject] = 0;
      }
      currentMonthlyStats[monthKey].subjectDurations[subject] += duration;

      // 방법별 시간 업데이트
      if (!currentMonthlyStats[monthKey].methodDurations[method]) {
        currentMonthlyStats[monthKey].methodDurations[method] = 0;
      }
      currentMonthlyStats[monthKey].methodDurations[method] += duration;

      // 일별 시간 업데이트
      if (!currentMonthlyStats[monthKey].dailyDurations[date]) {
        currentMonthlyStats[monthKey].dailyDurations[date] = 0;
      }
      currentMonthlyStats[monthKey].dailyDurations[date] += duration;

      // 주별 시간 업데이트
      if (!currentMonthlyStats[monthKey].weeklyDurations[weekKey]) {
        currentMonthlyStats[monthKey].weeklyDurations[weekKey] = 0;
      }
      currentMonthlyStats[monthKey].weeklyDurations[weekKey] += duration;

      // 마지막 업데이트 시간 갱신
      currentMonthlyStats[monthKey].lastUpdated = new Date().toISOString();

      // 5. 상태 및 AsyncStorage 업데이트
      setWeeklyStats(currentWeeklyStats);
      setMonthlyStats(currentMonthlyStats);

      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.WEEKLY_STATS,
          JSON.stringify(currentWeeklyStats)
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.MONTHLY_STATS,
          JSON.stringify(currentMonthlyStats)
        ),
      ]);

      console.log(
        `통계 데이터 업데이트 완료: 주차(${weekKey}), 월(${monthKey})`
      );
      return true;
    } catch (error) {
      console.error("통계 데이터 업데이트 오류:", error);
      return false;
    }
  };

  const generateAIFeedback = async (
    date,
    reportType = "daily",
    useAI = false,
    userPremiumStatus = isPremiumUser
  ) => {
    try {
      setLoading(true);

      // 데이터 유효성 검사
      if (!date) {
        console.error("날짜가 제공되지 않았습니다.");
        return null;
      }

      // 현재 목표 데이터 가져오기
      const currentGoals = getCurrentGoals();

      // 리포트 생성 함수 직접 호출
      const report = await generateFeedback(
        date,
        reportType,
        schedules,
        tasks,
        studySessions,
        reportType === "weekly" ? weeklyStats : monthlyStats,
        useAI,
        userPremiumStatus,
        currentGoals
      );

      // 리포트 저장
      if (report) {
        let reportKey = date;

        // 주간/월간 리포트 키 설정
        if (reportType === "weekly") {
          reportKey = `week-${date}`;
        } else if (reportType === "monthly") {
          reportKey = `month-${format(new Date(date), "yyyy-MM")}`;
        }

        // 리포트 저장
        const updatedReports = {
          ...aiReports,
          [reportKey]: report,
        };

        setAiReports(updatedReports);
        await AsyncStorage.setItem(
          STORAGE_KEYS.AI_REPORTS,
          JSON.stringify(updatedReports)
        );
      }

      return report;
    } catch (error) {
      console.error(`${reportType} 리포트 생성 오류:`, error);
      Alert.alert("오류 발생", "리포트 생성 중 문제가 발생했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 취침 전 리포트 알림 설정 함수
  const scheduleReportReminder = async (
    bedtimeHour = 23,
    bedtimeMinute = 0
  ) => {
    try {
      // 기존 리포트 알림 취소
      await Notifications.cancelScheduledNotificationAsync(
        "daily-report-reminder"
      );

      // 오늘 날짜의 취침 시간 설정
      const now = new Date();
      const scheduleTime = new Date(now);
      scheduleTime.setHours(bedtimeHour - 1); // 취침 1시간 전
      scheduleTime.setMinutes(bedtimeMinute);
      scheduleTime.setSeconds(0);

      // 이미 지난 시간이면 다음 날로 설정
      if (scheduleTime < now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
      }

      // 알림 스케줄링
      await Notifications.scheduleNotificationAsync({
        identifier: "daily-report-reminder",
        content: {
          title: "오늘의 학습 리포트",
          body: "오늘 하루는 어땠나요? AI 리포트를 통해 오늘의 성과를 확인해보세요.",
          data: { screen: "AI" },
        },
        trigger: {
          hour: scheduleTime.getHours(),
          minute: scheduleTime.getMinutes(),
          repeats: true,
        },
      });

      console.log("일일 리포트 알림이 설정되었습니다:", scheduleTime);
      return true;
    } catch (error) {
      console.error("리포트 알림 설정 오류:", error);
      return false;
    }
  };

  // 프리미엄 상태 설정 함수
  const setPremiumStatus = async (isPremium) => {
    try {
      // 상태 업데이트
      setIsPremiumUser(isPremium);

      // AsyncStorage에 저장
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREMIUM_USER,
        JSON.stringify(isPremium)
      );

      // 프리미엄 상태에 따라 자동 리포트 스케줄링 업데이트
      await updateReportScheduling(isPremium);

      console.log(
        `프리미엄 상태 변경됨: ${isPremium ? "프리미엄" : "무료"} 사용자`
      );
      return true;
    } catch (error) {
      console.error("프리미엄 상태 설정 오류:", error);
      return false;
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        // 기본 상태 및 함수
        addGoalTarget,
        selectedDate,
        setSelectedDate,
        tasks,
        toggleTask,
        schedules,
        updateSchedule,
        getScheduleForDate,
        defaultWeekdaySchedule,
        defaultWeekendSchedule,
        saveDefaultSchedule,
        applyDefaultSchedule,
        startDrag,
        endDrag,
        draggedSchedule,
        editSchedule,
        deleteSchedule,
        customSchedules,
        saveCustomSchedulesOnly,
        loading,

        // 요일별 일정 관련 (DaySchedule용)
        dailySchedules,
        saveDailyScheduleOnly,

        // 주간 시간표 관련 (WeeklyTimetableScreen용)
        weeklySchedules,
        saveWeeklyScheduleOnly,
        syncCalendarToWeekly,

        // 캘린더 일정 관련
        saveSchedulesOnly,

        // 일정 유틸리티 함수
        getScheduleType,
        prepareScheduleForSave,
        notifications,
        allowDailyScheduleSync,
        toggleDailyScheduleSync,

        // 공부 세션 관련 함수
        studySessions,
        recordStudySession,
        deleteStudySession,
        getTotalStudyTimeForDate,
        getTotalStudyTimeForRange,
        getStudyTimeBySubject,
        getStudyTimeByMethod,
        getDisplayStudySessions,

        // AI 관련
        aiReports,
        generateAIFeedback,
        scheduleReportReminder,

        // 통계 데이터 관련
        weeklyStats,
        monthlyStats,
        updateStatistics,

        // 프리미엄 상태 관련
        isPremiumUser,
        setPremiumStatus,

        goalTargets,
        addGoalTarget,
        updateGoalTarget,
        removeGoalTarget,
        getCurrentGoals,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within a PlannerProvider");
  }
  return context;
}
