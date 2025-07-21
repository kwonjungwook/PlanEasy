// src/context/ProgressContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { ToastEventSystem } from "../components/common/AutoToast";
import { savePointHistory } from "../utils/pointHistoryManager";

// dailybadge.js에서 가져온 상수 및 함수
import {
  BADGE_RARITY,
  enhanceBadgeSystem,
  enhanceTitleSystem,
  getRequiredXP,
  getTaskXP,
} from "../components/dailybadge";

// 상수 정의
const POINTS_STORAGE_KEY = "@user_points";
const XP_STORAGE_KEY = "@user_xp";
const LEVEL_STORAGE_KEY = "@user_level";
const STREAK_STORAGE_KEY = "@attendance_streak";
const LAST_CHECK_DATE_KEY = "@last_check_date";
const DDAY_SLOTS_KEY = "@dday_slots_purchased";
const CHECKED_TODAY_KEY = "@checked_today";
const EARNED_BADGES_KEY = "@earned_badges";
const ACTIVE_TITLE_KEY = "@active_title";
const COMPLETED_TASKS_KEY = "@completed_tasks_count";
const MORNING_TASKS_KEY = "@morning_tasks_count";
const EVENING_TASKS_KEY = "@evening_tasks_count";
const PERFECT_DAYS_KEY = "@perfect_days_count";
const ATTENDANCE_DATA_KEY = "@attendance_data";
const COMPLETED_TASK_IDS_KEY = "@completed_task_ids"; // 완료된 태스크 ID 추적
const TASK_REWARDS_KEY = "@task_rewards"; // 일정별 보상 기록

// 모든 가능한 배지 (기본 + 확장)
const ALL_BADGES = enhanceBadgeSystem();

// 모든 타이틀 (기본 + 확장)
const ALL_TITLES = enhanceTitleSystem();

// 슬롯 가격 설정
export const SLOT_PRICES = {
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
};

// 연속 출석 보상 설정
export const STREAK_REWARDS = {
  1: { points: 5, xp: 10 },
  3: { points: 15, xp: 30 },
  7: { points: 30, xp: 70 },
  14: { points: 60, xp: 150 },
  30: { points: 100, xp: 300 },
};

// 컨텍스트 생성
const ProgressContext = createContext();

// 게임화 시스템 제공자 컴포넌트
export const ProgressProvider = ({ children }) => {
  // 기본 상태
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [ddaySlots, setDdaySlots] = useState(1);
  const [checkedToday, setCheckedToday] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [activeTitle, setActiveTitle] = useState("beginner");
  const [completedTasks, setCompletedTasks] = useState(0);
  const [morningTasks, setMorningTasks] = useState(0);
  const [eveningTasks, setEveningTasks] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentUnlocks, setRecentUnlocks] = useState([]);
  const [unusedDDaySlots, setUnusedDDaySlots] = useState(0);
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set()); // 완료된 태스크 ID 추적
  const [taskRewards, setTaskRewards] = useState({}); // { [task.id]: { points, xp } }

  // 🔥 레벨업 처리 중복 방지 플래그
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          pointsData,
          xpData,
          levelData,
          streakData,
          lastCheckData,
          slotsData,
          checkedData,
          badgesData,
          titleData,
          completedTasksData,
          morningTasksData,
          eveningTasksData,
          perfectDaysData,
          dailyMissionsData,
          weeklyMissionsData,
          attendanceDataStr,
          completedTaskIdsData,
        ] = await Promise.all([
          AsyncStorage.getItem(POINTS_STORAGE_KEY),
          AsyncStorage.getItem(XP_STORAGE_KEY),
          AsyncStorage.getItem(LEVEL_STORAGE_KEY),
          AsyncStorage.getItem(STREAK_STORAGE_KEY),
          AsyncStorage.getItem(LAST_CHECK_DATE_KEY),
          AsyncStorage.getItem(DDAY_SLOTS_KEY),
          AsyncStorage.getItem(CHECKED_TODAY_KEY),
          AsyncStorage.getItem(EARNED_BADGES_KEY),
          AsyncStorage.getItem(ACTIVE_TITLE_KEY),
          AsyncStorage.getItem(COMPLETED_TASKS_KEY),
          AsyncStorage.getItem(MORNING_TASKS_KEY),
          AsyncStorage.getItem(EVENING_TASKS_KEY),
          AsyncStorage.getItem(PERFECT_DAYS_KEY),
          AsyncStorage.getItem("DAILY_MISSIONS_KEY"),
          AsyncStorage.getItem("WEEKLY_MISSIONS_KEY"),
          AsyncStorage.getItem(ATTENDANCE_DATA_KEY),
          AsyncStorage.getItem(COMPLETED_TASK_IDS_KEY),
        ]);

        // 출석 데이터 설정
        if (attendanceDataStr) {
          setAttendanceData(JSON.parse(attendanceDataStr));
        }

        // 완료된 태스크 ID 설정
        if (completedTaskIdsData) {
          setCompletedTaskIds(new Set(JSON.parse(completedTaskIdsData)));
        }

        // 포인트 설정
        if (pointsData) {
          setPoints(parseInt(pointsData));
        } else {
          setPoints(50);
          await AsyncStorage.setItem(POINTS_STORAGE_KEY, "50");
        }

        // XP 설정
        if (xpData) {
          setXp(parseInt(xpData));
        } else {
          setXp(0);
          await AsyncStorage.setItem(XP_STORAGE_KEY, "0");
        }

        // 레벨 설정
        if (levelData) {
          setLevel(parseInt(levelData));
        } else {
          setLevel(1);
          await AsyncStorage.setItem(LEVEL_STORAGE_KEY, "1");
        }

        // 연속 출석 설정
        if (streakData) {
          setStreak(parseInt(streakData));
        }

        // 마지막 체크인 날짜
        if (lastCheckData) {
          setLastCheckDate(lastCheckData);
        }

        // D-Day 슬롯 설정
        if (slotsData) {
          setDdaySlots(parseInt(slotsData));
        } else {
          await AsyncStorage.setItem(DDAY_SLOTS_KEY, "1");
        }

        // 오늘 체크인 여부 - YYYY-MM-DD 형식으로 비교
        if (checkedData) {
          const now = new Date();
          const today = `${now.getFullYear()}-${String(
            now.getMonth() + 1
          ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          setCheckedToday(checkedData === today);
        }

        // 획득한 배지
        if (badgesData) {
          setEarnedBadges(JSON.parse(badgesData));
        } else {
          const defaultBadges = ["level_1"];
          setEarnedBadges(defaultBadges);
          await AsyncStorage.setItem(
            EARNED_BADGES_KEY,
            JSON.stringify(defaultBadges)
          );
        }

        // 일일 미션 설정
        if (dailyMissionsData) {
          setDailyMissions(JSON.parse(dailyMissionsData));
        } else {
          await resetDailyMissions();
        }

        // 주간 미션 설정
        if (weeklyMissionsData) {
          setWeeklyMissions(JSON.parse(weeklyMissionsData));
        } else {
          await resetWeeklyMissions();
        }

        // 활성 타이틀
        if (titleData) {
          setActiveTitle(titleData);
        } else {
          await AsyncStorage.setItem(ACTIVE_TITLE_KEY, "beginner");
        }

        // 완료한 태스크 수
        if (completedTasksData) {
          setCompletedTasks(parseInt(completedTasksData));
        }

        // 오전 태스크 수
        if (morningTasksData) {
          setMorningTasks(parseInt(morningTasksData));
        }

        // 저녁 태스크 수
        if (eveningTasksData) {
          setEveningTasks(parseInt(eveningTasksData));
        }

        // 완벽한 날 수
        if (perfectDaysData) {
          setPerfectDays(parseInt(perfectDaysData));
        }
        const taskRewStr = await AsyncStorage.getItem(TASK_REWARDS_KEY);
        if (taskRewStr) setTaskRewards(JSON.parse(taskRewStr));

        setLoading(false);
      } catch (error) {
        console.error("진행 데이터 로드 오류:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 완료된 태스크 ID 저장 함수
  const saveCompletedTaskIds = async (taskIds) => {
    try {
      await AsyncStorage.setItem(
        COMPLETED_TASK_IDS_KEY,
        JSON.stringify(Array.from(taskIds))
      );
    } catch (error) {
      console.error("완료된 태스크 ID 저장 오류:", error);
    }
  };

  // 태스크 고유 ID 생성 함수
  const generateTaskId = (task) => {
    // task.id가 있으면 그것을 사용하고, 없으면 날짜_제목_시간 형태로 생성
    if (task.id) {
      return task.id;
    }
    const today = new Date().toISOString().split("T")[0];
    return `${today}_${task.task || "unknown"}_${task.startTime || "unknown"}`;
  };

  // 🔥 긴급 수정: completedTaskIds 강제 초기화 함수
  const clearCompletedTaskIds = async () => {
    setCompletedTaskIds(new Set());
    await AsyncStorage.removeItem(COMPLETED_TASK_IDS_KEY);
  };

  const checkAttendance = async () => {
    try {
      // 🔥 출석 체크 시작 로그
      if (__DEV__) {
        console.log("[출석체크] 출석체크 시작");
      }

      const today = formatDateStr(new Date());

      if (checkedToday) {
        ToastEventSystem.showToast("이미 오늘은 출석체크를 했습니다", 2000);
        return false;
      }

      const validAttendanceData =
        typeof attendanceData === "object" ? attendanceData : {};

      const newAttendanceData = { ...validAttendanceData, [today]: true };

      try {
        await AsyncStorage.setItem(
          ATTENDANCE_DATA_KEY,
          JSON.stringify(newAttendanceData)
        );
        setAttendanceData(newAttendanceData);
      } catch (storageError) {
        console.error("출석 데이터 저장 오류:", storageError);
        ToastEventSystem.showToast(
          "출석 기록 저장 중 오류가 발생했습니다",
          2000
        );
        return false;
      }

      let newStreak = 0;
      try {
        newStreak = calculateStreak(newAttendanceData);
        await AsyncStorage.setItem(STREAK_STORAGE_KEY, newStreak.toString());
        setStreak(newStreak);
      } catch (streakError) {
        console.error("스트릭 계산 오류:", streakError);
        newStreak = streak + 1;
      }

      try {
        await AsyncStorage.setItem(LAST_CHECK_DATE_KEY, today);
        setLastCheckDate(today);
        await AsyncStorage.setItem(CHECKED_TODAY_KEY, today);
        setCheckedToday(true);
      } catch (dateError) {
        console.error("날짜 데이터 저장 오류:", dateError);
        ToastEventSystem.showToast(
          "출석 정보 저장 중 오류가 발생했습니다",
          2000
        );
      }

      let reward = STREAK_REWARDS[1] || { points: 5, xp: 10 };

      if (STREAK_REWARDS[newStreak]) {
        reward = STREAK_REWARDS[newStreak];
      }

      try {
        const actualPoints = await addPoints(
          reward.points,
          `${newStreak}일 연속 출석`,
          "attendance",
          {
            streakDays: newStreak,
            isMilestone: STREAK_REWARDS[newStreak] ? true : false,
          }
        );
        await addXP(reward.xp, `${newStreak}일 연속 출석`);

        await checkMissionProgress("attendance_check", {
          currentStreak: newStreak,
        });

        await checkStreakBadges(newStreak);

        // 🔥 출석 체크 토스트 (단순화)
        const message = `🔥 ${newStreak}일 연속 출석! +${actualPoints}P, +${reward.xp}XP 적립`;
        ToastEventSystem.showToast(message, 3000);

        // 추가: 디버그용 콘솔 출력
        if (__DEV__) {
          console.log(
            `[출석체크] ${newStreak}일 연속, +${actualPoints}P, +${reward.xp}XP`
          );
        }
      } catch (rewardError) {
        console.error("보상 처리 오류:", rewardError);
        // 🔥 에러 발생 시에도 기본 출석 성공 메시지
        ToastEventSystem.showToast(
          "출석체크 완료! 보상 처리 중 문제가 발생했습니다.",
          2000
        );
      }

      return true;
    } catch (error) {
      console.error("출석 체크 오류:", error);
      ToastEventSystem.showToast(
        "출석 체크 중 오류가 발생했습니다. 다시 시도해주세요.",
        3000
      );
      return false;
    }
  };

  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateStreak = (data) => {
    if (!data || typeof data !== "object") {
      console.warn("calculateStreak: 유효하지 않은 데이터 형식", data);
      return 0;
    }

    const now = new Date();
    const today = formatDateStr(now);

    let currentStreak = data[today] === true ? 1 : 0;

    if (currentStreak === 0) {
      return 0;
    }

    const MAX_DAYS_TO_CHECK = 366;
    let daysChecked = 0;

    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);

    while (daysChecked < MAX_DAYS_TO_CHECK) {
      const checkDateStr = formatDateStr(checkDate);

      if (data[checkDateStr] === true) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      daysChecked++;
    }

    return currentStreak;
  };

  const resetDailyMissions = async () => {
    const defaultDailyMissions = [
      {
        id: "morning_task",
        title: "아침형 인간",
        description: "오전 9시 전에 일정 1개 이상 완료하기",
        reward: { points: 15, xp: 20 },
        icon: "🌅",
        completed: false,
        claimed: false,
        progress: 0,
        total: 1,
      },
      {
        id: "triple_complete",
        title: "세 마리 토끼",
        description: "오늘 일정 3개 이상 완료하기",
        reward: { points: 20, xp: 30 },
        icon: "🐰",
        completed: false,
        claimed: false,
        progress: 0,
        total: 3,
      },
      {
        id: "evening_plan",
        title: "내일 계획",
        description: "저녁 8시 이후 내일 일정 2개 이상 추가하기",
        reward: { points: 10, xp: 15 },
        icon: "📝",
        completed: false,
        claimed: false,
        progress: 0,
        total: 2,
      },
    ];

    setDailyMissions(defaultDailyMissions);
    try {
      await AsyncStorage.setItem(
        "DAILY_MISSIONS_KEY",
        JSON.stringify(defaultDailyMissions)
      );
    } catch (error) {
      console.error("일일 미션 초기화 오류:", error);
    }
  };

  const resetWeeklyMissions = async () => {
    const defaultWeeklyMissions = [
      {
        id: "weekly_streak",
        title: "주간 연속 출석",
        description: "이번 주 7일 연속 출석하기",
        reward: { points: 50, xp: 100 },
        icon: "🔥",
        completed: false,
        claimed: false,
        progress: 0,
        total: 7,
      },
      {
        id: "category_variety",
        title: "다재다능",
        description: "주간 5개 이상의 카테고리에서 일정 완료하기",
        reward: { points: 40, xp: 80 },
        icon: "🎯",
        completed: false,
        claimed: false,
        progress: 0,
        total: 5,
        categories: [],
      },
      {
        id: "perfect_days",
        title: "완벽한 주",
        description: "이번 주 3일 이상 모든 일정 완료하기",
        reward: { points: 70, xp: 120 },
        icon: "✨",
        completed: false,
        claimed: false,
        progress: 0,
        total: 3,
      },
    ];

    setWeeklyMissions(defaultWeeklyMissions);
    try {
      await AsyncStorage.setItem(
        "WEEKLY_MISSIONS_KEY",
        JSON.stringify(defaultWeeklyMissions)
      );
    } catch (error) {
      console.error("주간 미션 초기화 오류:", error);
    }
  };

  const checkMissionProgress = async (activityType, data = {}) => {
    let dailyUpdated = false;
    let weeklyUpdated = false;

    const updatedDailyMissions = [...dailyMissions];
    const updatedWeeklyMissions = [...weeklyMissions];

    switch (activityType) {
      case "task_complete":
        const { taskTime, category } = data;
        const now = new Date();
        const hour = now.getHours();

        if (hour < 9) {
          const morningMission = updatedDailyMissions.find(
            (m) => m.id === "morning_task"
          );
          if (morningMission && !morningMission.completed) {
            morningMission.progress += 1;
            if (morningMission.progress >= morningMission.total) {
              morningMission.completed = true;
            }
            dailyUpdated = true;
          }
        }

        const tripleMission = updatedDailyMissions.find(
          (m) => m.id === "triple_complete"
        );
        if (tripleMission) {
          tripleMission.progress = Math.min(
            data.todayCompleted || 0,
            tripleMission.total
          );
          if (
            tripleMission.progress >= tripleMission.total &&
            !tripleMission.completed
          ) {
            tripleMission.completed = true;
          }
          dailyUpdated = true;
        }

        if (category) {
          const varietyMission = updatedWeeklyMissions.find(
            (m) => m.id === "category_variety"
          );
          if (varietyMission) {
            if (!varietyMission.categories) {
              varietyMission.categories = [];
            }

            if (!varietyMission.categories.includes(category)) {
              varietyMission.categories.push(category);
              varietyMission.progress = varietyMission.categories.length;

              if (
                varietyMission.progress >= varietyMission.total &&
                !varietyMission.completed
              ) {
                varietyMission.completed = true;
              }
              weeklyUpdated = true;
            }
          }
        }
        break;

      case "attendance_check":
        const streakMission = updatedWeeklyMissions.find(
          (m) => m.id === "weekly_streak"
        );
        if (streakMission) {
          const currentStreak = data.currentStreak || 0;
          streakMission.progress = Math.min(currentStreak, streakMission.total);

          if (
            streakMission.progress >= streakMission.total &&
            !streakMission.completed
          ) {
            streakMission.completed = true;
          }
          weeklyUpdated = true;
        }
        break;

      case "perfect_day":
        const perfectDaysMission = updatedWeeklyMissions.find(
          (m) => m.id === "perfect_days"
        );
        if (perfectDaysMission) {
          perfectDaysMission.progress += 1;
          if (
            perfectDaysMission.progress >= perfectDaysMission.total &&
            !perfectDaysMission.completed
          ) {
            perfectDaysMission.completed = true;
          }
          weeklyUpdated = true;
        }
        break;

      case "add_task":
        const { taskDate } = data;
        const currentHour = new Date().getHours();

        if (currentHour >= 20) {
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);

          if (
            taskDate &&
            new Date(taskDate).getDate() === tomorrowDate.getDate()
          ) {
            const eveningPlanMission = updatedDailyMissions.find(
              (m) => m.id === "evening_plan"
            );
            if (eveningPlanMission) {
              eveningPlanMission.progress += 1;
              if (
                eveningPlanMission.progress >= eveningPlanMission.total &&
                !eveningPlanMission.completed
              ) {
                eveningPlanMission.completed = true;
              }
              dailyUpdated = true;
            }
          }
        }
        break;
    }

    if (dailyUpdated) {
      setDailyMissions(updatedDailyMissions);
      try {
        await AsyncStorage.setItem(
          "DAILY_MISSIONS_KEY",
          JSON.stringify(updatedDailyMissions)
        );
      } catch (error) {
        console.error("일일 미션 업데이트 오류:", error);
      }
    }

    if (weeklyUpdated) {
      setWeeklyMissions(updatedWeeklyMissions);
      try {
        await AsyncStorage.setItem(
          "WEEKLY_MISSIONS_KEY",
          JSON.stringify(updatedWeeklyMissions)
        );
      } catch (error) {
        console.error("주간 미션 업데이트 오류:", error);
      }
    }
  };

  const claimMissionReward = async (missionId) => {
    let mission = dailyMissions.find((m) => m.id === missionId);
    let isMissionDaily = true;

    if (!mission) {
      mission = weeklyMissions.find((m) => m.id === missionId);
      isMissionDaily = false;
    }

    if (!mission || !mission.completed || mission.claimed) {
      return false;
    }

    await addPoints(
      mission.reward.points,
      `미션 보상: ${mission.title}`,
      "mission",
      {
        missionId: mission.id,
        isDaily: isMissionDaily,
      }
    );
    await addXP(mission.reward.xp, `미션 보상: ${mission.title}`);

    if (isMissionDaily) {
      const updatedDailyMissions = dailyMissions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      );
      setDailyMissions(updatedDailyMissions);

      try {
        await AsyncStorage.setItem(
          "DAILY_MISSIONS_KEY",
          JSON.stringify(updatedDailyMissions)
        );
      } catch (error) {
        console.error("일일 미션 보상 처리 오류:", error);
        return false;
      }
    } else {
      const updatedWeeklyMissions = weeklyMissions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      );
      setWeeklyMissions(updatedWeeklyMissions);

      try {
        await AsyncStorage.setItem(
          "WEEKLY_MISSIONS_KEY",
          JSON.stringify(updatedWeeklyMissions)
        );
      } catch (error) {
        console.error("주간 미션 보상 처리 오류:", error);
        return false;
      }
    }

    checkAllMissionsComplete();
    return true;
  };

  const checkAllMissionsComplete = async () => {
    const allDailyCompleted = dailyMissions.every((m) => m.claimed);
    const allDailyClaimedKey = `DAILY_ALL_CLAIMED_${
      new Date().toISOString().split("T")[0]
    }`;

    const alreadyClaimed = await AsyncStorage.getItem(allDailyClaimedKey);

    if (allDailyCompleted && !alreadyClaimed) {
      await addPoints(25, "일일 미션 올 클리어 보너스", "mission_bonus");
      await addXP(35, "일일 미션 올 클리어 보너스");
      await AsyncStorage.setItem(allDailyClaimedKey, "true");
    }

    const allWeeklyCompleted = weeklyMissions.every((m) => m.claimed);
    const currentWeek = getWeekNumber(new Date());
    const allWeeklyClaimedKey = `WEEKLY_ALL_CLAIMED_${currentWeek}`;

    const weeklyAlreadyClaimed = await AsyncStorage.getItem(
      allWeeklyClaimedKey
    );

    if (allWeeklyCompleted && !weeklyAlreadyClaimed) {
      await addPoints(100, "주간 미션 올 클리어 보너스", "mission_bonus");
      await addXP(150, "주간 미션 올 클리어 보너스");
      await AsyncStorage.setItem(allWeeklyClaimedKey, "true");
    }
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // 🔥 수정된 addXP 함수 - 레벨업 무한루프 방지
  const addXP = async (amount, reason = "") => {
    try {
      if (amount === 0) return true;

      // 🔥 레벨업 처리 중이면 XP 추가 대기
      if (isLevelingUp) {
        if (__DEV__) {
          console.log(`[addXP] 레벨업 처리 중이므로 XP 추가 대기: ${amount}XP`);
        }
        return true;
      }

      const nextXP = Math.max(0, xp + amount);
      setXp(nextXP);
      await AsyncStorage.setItem(XP_STORAGE_KEY, nextXP.toString());

      // 🔥 레벨업 체크
      const requiredXP = getRequiredXP(level);
      if (nextXP >= requiredXP) {
        // 🔥 레벨업 처리 시작 플래그 설정
        setIsLevelingUp(true);

        try {
          const newLevel = level + 1;
          setLevel(newLevel);
          await AsyncStorage.setItem(LEVEL_STORAGE_KEY, newLevel.toString());

          // 🔥 레벨업 포인트 보상 (XP 추가 없이)
          const levelupPoints = newLevel * 20;
          const actualLevelupPoints = await addPoints(
            levelupPoints,
            `레벨 ${newLevel} 달성`,
            "levelup"
          );

          // 🔥 레벨업 토스트 한 번만 표시
          ToastEventSystem.showToast(
            `🎉 레벨 ${newLevel} 달성! +${actualLevelupPoints}P 획득!`,
            3000
          );

          // 🔥 레벨 배지 체크 (XP 보너스 없는 배지만)
          const levelBadgeId = `level_${newLevel}`;
          if (
            ALL_BADGES.some((badge) => badge.id === levelBadgeId) &&
            !earnedBadges.includes(levelBadgeId)
          ) {
            await awardBadgeWithoutXP(levelBadgeId);
          }

          const milestoneBadgeId = `milestone_level_${newLevel}`;
          if (
            ALL_BADGES.some((badge) => badge.id === milestoneBadgeId) &&
            !earnedBadges.includes(milestoneBadgeId)
          ) {
            await awardBadgeWithoutXP(milestoneBadgeId);
          }

          checkAndUnlockTitles();
        } finally {
          // 🔥 레벨업 처리 완료 플래그 해제
          setIsLevelingUp(false);
        }
      }

      return true;
    } catch (error) {
      console.error("XP 추가 오류:", error);
      setIsLevelingUp(false); // 🔥 에러 시에도 플래그 해제
      return false;
    }
  };

  // XP 차감 함수 추가
  const deductXP = async (amount, reason = "") => {
    try {
      if (amount === 0) return true;
      const finalAmount = Math.abs(amount);
      const nextXP = Math.max(0, xp - finalAmount);
      setXp(nextXP);
      await AsyncStorage.setItem(XP_STORAGE_KEY, nextXP.toString());

      if (__DEV__) {
        console.log(
          `[deductXP] ${finalAmount}XP 차감: ${reason} | 이전 XP: ${xp} → 새 XP: ${nextXP}`
        );
      }
      return true;
    } catch (error) {
      console.error("XP 차감 오류:", error);
      return false;
    }
  };

  const calculateDynamicReward = (baseReward, activityType) => {
    let multiplier = 1.0;
    const hour = new Date().getHours();

    if (hour >= 5 && hour <= 8) {
      multiplier += 0.3;
    } else if (hour >= 21 || hour <= 4) {
      multiplier += 0.2;
    }

    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      multiplier += 0.15;
    }

    if (streak > 3) {
      multiplier += Math.min(0.5, streak * 0.05);
    }

    if (Math.random() < 0.15) {
      multiplier += 0.5;
      ToastEventSystem.showToast("행운의 보너스! +50% 추가 포인트 획득!", 2000);
    }

    return Math.round(baseReward * multiplier);
  };

  const calculateNextSlotPrice = () => {
    const basePrice = 100;

    if (ddaySlots <= 1) return basePrice;
    if (ddaySlots === 2) return 150;
    if (ddaySlots === 3) return 200;
    return basePrice + (ddaySlots - 1) * 100;
  };

  const nextSlotPrice = calculateNextSlotPrice();

  const addPoints = async (
    amount,
    reason = "",
    category = "earn",
    meta = {}
  ) => {
    // 🔥 모든 동적 보상 제거 - 고정 포인트만 사용
    const finalAmount = amount;

    try {
      // 🔥 현재 React state 값을 직접 사용 (AsyncStorage 경합 상태 방지)
      const currentPoints = points;
      const newPoints = currentPoints + finalAmount;

      // 즉시 state 업데이트
      setPoints(newPoints);

      // AsyncStorage 저장 (백그라운드)
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, newPoints.toString());

      await savePointHistory({
        type: "earn",
        category,
        amount: finalAmount,
        description: reason,
        meta,
      });

      // 🚀 개발 모드에서만 로깅
      if (__DEV__) {
        console.log(
          `[addPoints] ${finalAmount}P 적립: ${reason} | 이전 포인트: ${currentPoints} → 새 포인트: ${newPoints}`
        );
      }
      return finalAmount;
    } catch (error) {
      console.error("포인트 추가 오류:", error);
      return 0;
    }
  };

  const deductPoints = async (
    rawAmount,
    reason = "",
    category = "spend",
    meta = {}
  ) => {
    const amount = Math.abs(rawAmount);

    try {
      // 🔥 현재 React state 값을 직접 사용 (AsyncStorage 경합 상태 방지)
      const currentPoints = points;

      if (currentPoints < amount) {
        ToastEventSystem.showToast("포인트가 부족합니다", 2000);
        return false;
      }

      const newPoints = currentPoints - amount;

      // 즉시 state 업데이트
      setPoints(newPoints);

      // AsyncStorage 저장 (백그라운드)
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, newPoints.toString());

      await savePointHistory({
        type: "spend",
        category,
        amount: -amount,
        description: reason,
        meta,
      });

      // 🚀 개발 모드에서만 로깅
      if (__DEV__) {
        console.log(
          `[deductPoints] ${amount}P 차감: ${reason} | 이전 포인트: ${currentPoints} → 새 포인트: ${newPoints}`
        );
      }
      return true;
    } catch (err) {
      console.error("포인트 차감 오류:", err);
      return false;
    }
  };

  // 🔥 새로운 함수: XP 보너스 없이 배지 획득
  const awardBadgeWithoutXP = async (badgeId) => {
    try {
      if (earnedBadges.includes(badgeId)) {
        return false;
      }

      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      if (!badge) {
        console.error(`배지 ID: ${badgeId}를 찾을 수 없습니다`);
        return false;
      }

      const newEarnedBadges = [...earnedBadges, badgeId];
      setEarnedBadges(newEarnedBadges);
      await AsyncStorage.setItem(
        EARNED_BADGES_KEY,
        JSON.stringify(newEarnedBadges)
      );

      // 🔥 XP 보너스 제거 (무한루프 방지)
      // if (badge.xpBonus) {
      //   await addXP(badge.xpBonus, `${badge.name} 배지 획득`);
      // }

      setRecentUnlocks((prev) => [
        ...prev,
        {
          type: "badge",
          id: badgeId,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          rarity: badge.rarity?.name || "일반",
        },
      ]);

      ToastEventSystem.showToast(`🏆 새 배지 획득: ${badge.name}!`, 3000);
      checkAndUnlockTitles();

      return true;
    } catch (error) {
      console.error("배지 획득 오류:", error);
      return false;
    }
  };

  // 🔥 기존 awardBadge 함수 (XP 보너스 있음, 레벨업 중이 아닐 때만)
  const awardBadge = async (badgeId) => {
    try {
      if (earnedBadges.includes(badgeId)) {
        return false;
      }

      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      if (!badge) {
        console.error(`배지 ID: ${badgeId}를 찾을 수 없습니다`);
        return false;
      }

      const newEarnedBadges = [...earnedBadges, badgeId];
      setEarnedBadges(newEarnedBadges);
      await AsyncStorage.setItem(
        EARNED_BADGES_KEY,
        JSON.stringify(newEarnedBadges)
      );

      // 🔥 레벨업 중이 아닐 때만 XP 보너스 지급
      if (badge.xpBonus && !isLevelingUp) {
        await addXP(badge.xpBonus, `${badge.name} 배지 획득`);
      }

      setRecentUnlocks((prev) => [
        ...prev,
        {
          type: "badge",
          id: badgeId,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          rarity: badge.rarity?.name || "일반",
        },
      ]);

      ToastEventSystem.showToast(`🏆 새 배지 획득: ${badge.name}!`, 3000);
      checkAndUnlockTitles();

      return true;
    } catch (error) {
      console.error("배지 획득 오류:", error);
      return false;
    }
  };

  const checkAndUnlockTitles = async () => {
    try {
      let newTitlesUnlocked = false;

      for (const title of ALL_TITLES) {
        if (earnedBadges.includes(`title_${title.id}`)) {
          continue;
        }

        let meetsRequirements = true;

        if (title.requirement.level && level < title.requirement.level) {
          meetsRequirements = false;
        }

        if (title.requirement.badges) {
          for (const requiredBadge of title.requirement.badges) {
            if (!earnedBadges.includes(requiredBadge)) {
              meetsRequirements = false;
              break;
            }
          }
        }

        if (meetsRequirements) {
          const titleBadgeId = `title_${title.id}`;

          const newEarnedBadges = [...earnedBadges, titleBadgeId];
          setEarnedBadges(newEarnedBadges);
          await AsyncStorage.setItem(
            EARNED_BADGES_KEY,
            JSON.stringify(newEarnedBadges)
          );

          ToastEventSystem.showToast(`🏅 새 타이틀 해금: ${title.name}!`, 3000);

          setRecentUnlocks((prev) => [
            ...prev,
            {
              type: "title",
              id: title.id,
              name: title.name,
              description: `타이틀: ${title.name}`,
            },
          ]);

          newTitlesUnlocked = true;
        }
      }

      return newTitlesUnlocked;
    } catch (error) {
      console.error("타이틀 확인 오류:", error);
      return false;
    }
  };

  const setUserTitle = async (titleId) => {
    try {
      if (!earnedBadges.includes(`title_${titleId}`)) {
        ToastEventSystem.showToast("해금되지 않은 타이틀입니다", 2000);
        return false;
      }

      setActiveTitle(titleId);
      await AsyncStorage.setItem(ACTIVE_TITLE_KEY, titleId);

      ToastEventSystem.showToast("타이틀이 변경되었습니다", 2000);
      return true;
    } catch (error) {
      console.error("타이틀 설정 오류:", error);
      return false;
    }
  };

  const checkStreakBadges = async (currentStreak) => {
    const streakBadges = [
      { days: 3, id: "streak_3" },
      { days: 5, id: "streak_5" },
      { days: 7, id: "streak_7" },
      { days: 10, id: "streak_10" },
      { days: 14, id: "streak_14" },
      { days: 21, id: "streak_21" },
      { days: 30, id: "streak_30" },
      { days: 50, id: "streak_50" },
      { days: 75, id: "streak_75" },
      { days: 100, id: "streak_100" },
    ];

    for (const badgeInfo of streakBadges) {
      if (currentStreak === badgeInfo.days) {
        await awardBadge(badgeInfo.id);
        break;
      }
    }
  };

  const createUnlock = (unlockData) => {
    setRecentUnlocks((prev) => [
      ...prev,
      {
        ...unlockData,
        id: Date.now(),
      },
    ]);
  };

  const purchaseDDaySlot = async () => {
    try {
      console.log(
        `D-Day 슬롯 구매 시도: ${points}P 보유, ${nextSlotPrice}P 필요`
      );

      const ok = await deductPoints(nextSlotPrice, "D-Day 슬롯 구매", "dday");
      if (!ok) return false;

      const newUnused = unusedDDaySlots + 1;
      setUnusedDDaySlots(newUnused);
      await AsyncStorage.setItem("@unused_dday_slots", newUnused.toString());

      createUnlock({
        type: "feature",
        name: "D-Day 슬롯 구매 완료!",
        description: "D-Day 화면에서 추가 목표를 설정할 수 있습니다.",
        icon: "🎯",
      });

      console.log(`D-Day 슬롯 구매 성공! 사용 가능한 슬롯: ${newUnused}`);
      return true;
    } catch (error) {
      console.error("D-Day 슬롯 구매 오류:", error);
      return false;
    }
  };

  const handleGoalAdded = async () => {
    try {
      if (unusedDDaySlots > 0) {
        const newUnusedSlots = unusedDDaySlots - 1;
        setUnusedDDaySlots(newUnusedSlots);

        await AsyncStorage.setItem(
          "@unused_dday_slots",
          newUnusedSlots.toString()
        );
        console.log(`D-Day 추가 완료, 남은 사용 가능 슬롯: ${newUnusedSlots}`);
        return true;
      } else {
        console.log("사용 가능한 D-Day 슬롯이 없습니다.");
        return false;
      }
    } catch (error) {
      console.error("D-Day 추가 후 슬롯 상태 업데이트 오류:", error);
      return false;
    }
  };

  // 🔥 수정된 일정 완료 보상 함수 - UI 상태 기반으로 변경
  const rewardTaskCompletion = async (task, isCompletedInUI = false) => {
    try {
      // 태스크 고유 ID 생성
      const taskId = generateTaskId(task);

      if (__DEV__) {
        console.log(`태스크 완료 처리: ${taskId}`);
        console.log(`UI 상태에서 완료됨: ${isCompletedInUI}`);
      }

      // 🔥 UI 상태 기반 중복 체크 - 이미 UI에서 완료된 상태면 중복
      if (isCompletedInUI) {
        if (__DEV__) {
          console.log(`이미 UI에서 완료된 태스크: ${taskId}`);
        }
        return { success: false }; // 중복 보상 방지
      }

      // 🔥 수정: 고정 포인트 보상 (5포인트)
      const pointReward = 5;
      const xpReward = getTaskXP(task);

      // 완료된 태스크 ID에 추가 (기록용)
      const newCompletedTaskIds = new Set([...completedTaskIds, taskId]);
      setCompletedTaskIds(newCompletedTaskIds);
      await saveCompletedTaskIds(newCompletedTaskIds);

      // 🔥 수정: 동적 보상 없이 고정 포인트 적용
      const actualPoints = await addPoints(pointReward, "일정 완료", "task", {
        taskId: taskId,
        taskName: task.task || "Unknown",
        startTime: task.startTime,
        endTime: task.endTime || task.startTime,
      });

      await addXP(xpReward, "일정 완료");

      // 완료한 일정 수 증가
      const newCompletedTasks = completedTasks + 1;
      setCompletedTasks(newCompletedTasks);
      await AsyncStorage.setItem(
        COMPLETED_TASKS_KEY,
        newCompletedTasks.toString()
      );

      await checkMissionProgress("task_complete", {
        taskTime: task.startTime,
        category: task.category,
        todayCompleted: newCompletedTasks,
      });

      // 시간대별 일정 카운트 업데이트
      const hour = parseInt(task.startTime.split(":")[0]);
      if (hour < 12) {
        const newMorningTasks = morningTasks + 1;
        setMorningTasks(newMorningTasks);
        await AsyncStorage.setItem(
          MORNING_TASKS_KEY,
          newMorningTasks.toString()
        );
      } else if (hour >= 18) {
        const newEveningTasks = eveningTasks + 1;
        setEveningTasks(newEveningTasks);
        await AsyncStorage.setItem(
          EVENING_TASKS_KEY,
          newEveningTasks.toString()
        );
      }

      // ① 보상 지급 끝난 뒤
      const newTaskRewards = {
        ...taskRewards,
        [taskId]: { points: actualPoints, xp: xpReward },
      };
      setTaskRewards(newTaskRewards);
      await AsyncStorage.setItem(
        TASK_REWARDS_KEY,
        JSON.stringify(newTaskRewards)
      );

      // 배지 확인
      await checkTaskCompletionBadges(newCompletedTasks);
      await checkTimeBasedBadges();

      if (__DEV__) {
        console.log(
          `[rewardTaskCompletion] 완료: ${taskId} | 적립된 포인트: ${actualPoints}P`
        );
      }
      return { success: true, points: actualPoints, xp: xpReward };
    } catch (error) {
      console.error("일정 완료 보상 오류:", error);
      return { success: false };
    }
  };

  // 🔙 일정 완료 취소 시 보상 회수
  const revertTaskCompletion = async (task) => {
    try {
      const taskId = generateTaskId(task);
      const reward = taskRewards[taskId];
      if (!reward) return false; // 기록 없으면 아무 일도 안 함

      // 포인트·XP 회수
      await deductPoints(reward.points, "일정 완료 취소", "task_cancel", {
        taskId: taskId,
      });
      await deductXP(reward.xp, "일정 완료 취소");

      // 완료 카운트 감소
      const newCompleted = Math.max(0, completedTasks - 1);
      setCompletedTasks(newCompleted);
      await AsyncStorage.setItem(COMPLETED_TASKS_KEY, newCompleted.toString());

      // 시간대별 카운트도 역-처리
      const hour = parseInt(task.startTime.split(":")[0], 10);
      if (hour < 12 && morningTasks > 0) {
        const nt = morningTasks - 1;
        setMorningTasks(nt);
        await AsyncStorage.setItem(MORNING_TASKS_KEY, nt.toString());
      } else if (hour >= 18 && eveningTasks > 0) {
        const nt = eveningTasks - 1;
        setEveningTasks(nt);
        await AsyncStorage.setItem(EVENING_TASKS_KEY, nt.toString());
      }

      // 기록 삭제
      const { [taskId]: _, ...rest } = taskRewards;
      setTaskRewards(rest);
      await AsyncStorage.setItem(TASK_REWARDS_KEY, JSON.stringify(rest));

      // 미션 진행도 재조정
      await checkMissionProgress("task_complete", {
        todayCompleted: newCompleted,
        category: task.category,
      });

      return true;
    } catch (err) {
      console.error("보상 회수 오류:", err);
      return false;
    }
  };

  // 🔥 새로 추가된 일정 완료 취소 함수 - UI 상태 기반으로 변경
  const undoTaskCompletion = async (task, isCompletedInUI = true) => {
    try {
      // 태스크 고유 ID 생성
      const taskId = generateTaskId(task);

      if (__DEV__) {
        console.log(`태스크 취소 처리: ${taskId}`);
        console.log(`UI 상태에서 완료됨: ${isCompletedInUI}`);
      }

      // 🔥 UI 상태 기반 완료 체크 - UI에서 완료되지 않은 상태면 취소 불가
      if (!isCompletedInUI) {
        if (__DEV__) {
          console.log(`UI에서 완료되지 않은 태스크: ${taskId}`);
        }
        return { success: false };
      }

      // 🔥 수정: 고정 포인트 차감 (5포인트)
      const pointToDeduct = 5;
      const xpToDeduct = getTaskXP(task);

      // 완료된 태스크 ID에서 제거 (기록용)
      const newCompletedTaskIds = new Set(completedTaskIds);
      newCompletedTaskIds.delete(taskId);
      setCompletedTaskIds(newCompletedTaskIds);
      await saveCompletedTaskIds(newCompletedTaskIds);

      // 🔥 수정: 고정 포인트 차감
      const pointsDeducted = await deductPoints(
        pointToDeduct,
        "일정 완료 취소",
        "task_undo",
        {
          taskId: taskId,
          taskName: task.task || "Unknown",
        }
      );

      if (pointsDeducted) {
        // XP 차감 (새로운 deductXP 함수 사용)
        await deductXP(xpToDeduct, "일정 완료 취소");

        // 완료한 일정 수 감소
        const newCompletedTasks = Math.max(0, completedTasks - 1);
        setCompletedTasks(newCompletedTasks);
        await AsyncStorage.setItem(
          COMPLETED_TASKS_KEY,
          newCompletedTasks.toString()
        );

        // 시간대별 일정 카운트 감소
        const hour = parseInt(task.startTime.split(":")[0]);
        if (hour < 12) {
          const newMorningTasks = Math.max(0, morningTasks - 1);
          setMorningTasks(newMorningTasks);
          await AsyncStorage.setItem(
            MORNING_TASKS_KEY,
            newMorningTasks.toString()
          );
        } else if (hour >= 18) {
          const newEveningTasks = Math.max(0, eveningTasks - 1);
          setEveningTasks(newEveningTasks);
          await AsyncStorage.setItem(
            EVENING_TASKS_KEY,
            newEveningTasks.toString()
          );
        }

        // 태스크 보상 기록에서도 제거
        const { [taskId]: _, ...remainingRewards } = taskRewards;
        setTaskRewards(remainingRewards);
        await AsyncStorage.setItem(
          TASK_REWARDS_KEY,
          JSON.stringify(remainingRewards)
        );

        if (__DEV__) {
          console.log(
            `[undoTaskCompletion] 취소: ${taskId} | 차감된 포인트: ${pointToDeduct}P`
          );
        }
        return { success: true, points: pointToDeduct, xp: xpToDeduct };
      }

      return { success: false };
    } catch (error) {
      console.error("일정 완료 취소 오류:", error);
      return { success: false };
    }
  };

  const checkTaskCompletionBadges = async (taskCount) => {
    const completionBadges = [
      { count: 1, id: "first_complete" },
      { count: 5, id: "five_complete" },
      { count: 10, id: "ten_complete" },
      { count: 20, id: "twenty_complete" },
      { count: 30, id: "thirty_complete" },
      { count: 50, id: "fifty_complete" },
      { count: 70, id: "seventy_complete" },
      { count: 100, id: "hundred_complete" },
      { count: 200, id: "two_hundred_complete" },
      { count: 500, id: "five_hundred_complete" },
    ];

    for (const badgeInfo of completionBadges) {
      if (taskCount === badgeInfo.count) {
        await awardBadge(badgeInfo.id);
        break;
      }
    }
  };

  const checkTimeBasedBadges = async () => {
    if (morningTasks === 3) {
      await awardBadge("morning_person");
    }

    if (morningTasks === 10) {
      await awardBadge("morning_master");
    }

    if (eveningTasks === 3) {
      await awardBadge("night_owl");
    }

    if (eveningTasks === 10) {
      await awardBadge("night_master");
    }
  };

  const handleAllTasksCompleted = async () => {
    try {
      await awardBadge("perfect_day");

      const newPerfectDays = perfectDays + 1;
      setPerfectDays(newPerfectDays);
      await AsyncStorage.setItem(PERFECT_DAYS_KEY, newPerfectDays.toString());

      await checkMissionProgress("perfect_day");

      return true;
    } catch (error) {
      console.error("모든 일정 완료 처리 오류:", error);
      return false;
    }
  };

  // 다음 날 자정에 체크 상태 초기화
  useEffect(() => {
    const resetCheckStatus = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow - now;

      const timeoutId = setTimeout(async () => {
        setCheckedToday(false);
        await AsyncStorage.removeItem(CHECKED_TODAY_KEY);

        // 완료된 태스크 ID 초기화 (매일 자정)
        setCompletedTaskIds(new Set());
        await AsyncStorage.removeItem(COMPLETED_TASK_IDS_KEY);

        const newToday = formatDateStr(new Date());
        setLastCheckDate(newToday);

        resetCheckStatus();
      }, timeUntilMidnight);

      return () => clearTimeout(timeoutId);
    };

    const cleanup = resetCheckStatus();
    return cleanup;
  }, []);

  // 다음 날 자정에 체크 상태 및 일일 미션 초기화
  useEffect(() => {
    const resetDaily = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow - now;

      setTimeout(async () => {
        setCheckedToday(false);
        await AsyncStorage.removeItem(CHECKED_TODAY_KEY);

        await resetDailyMissions();

        resetDaily();
      }, timeUntilMidnight);
    };

    resetDaily();
  }, []);

  // 주간 미션 초기화 (매주 월요일 자정)
  useEffect(() => {
    const resetWeekly = () => {
      const now = new Date();
      const daysUntilMonday = (1 + 7 - now.getDay()) % 7;

      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const timeUntilMonday = nextMonday - now;

      setTimeout(async () => {
        await resetWeeklyMissions();
        resetWeekly();
      }, timeUntilMonday);
    };

    resetWeekly();
  }, []);

  const getCurrentLevelTitle = () => {
    const title = ALL_TITLES.find(
      (t) =>
        t.requirement.level &&
        t.requirement.level <= level &&
        (!t.requirement.badges ||
          t.requirement.badges.every((b) => earnedBadges.includes(b)))
    );

    return title ? title.name : "초보 계획자";
  };

  const getLevelProgress = () => {
    try {
      if (typeof getRequiredXP !== "function") {
        return { current: 0, required: 100, percentage: 0 };
      }

      const currentLevelXP = getRequiredXP(level);
      const nextLevelXP = getRequiredXP(level + 1);

      if (isNaN(currentLevelXP) || isNaN(nextLevelXP)) {
        return { current: 0, required: 100, percentage: 0 };
      }

      const xpForCurrentLevel = Math.max(0, xp - currentLevelXP);
      const xpRequiredForNextLevel = Math.max(1, nextLevelXP - currentLevelXP);

      return {
        current: xpForCurrentLevel,
        required: xpRequiredForNextLevel,
        percentage: Math.min(
          100,
          Math.floor((xpForCurrentLevel / xpRequiredForNextLevel) * 100)
        ),
      };
    } catch (error) {
      console.error("Error calculating level progress:", error);
      return { current: 0, required: 100, percentage: 0 };
    }
  };

  // 컨텍스트 값
  const value = {
    points: points || 0,
    xp: xp || 0,
    level: level || 1,
    streak: streak || 0,
    ddaySlots: ddaySlots || 1,
    checkedToday: checkedToday || false,
    earnedBadges: earnedBadges || [],
    activeTitle: activeTitle || "beginner",
    completedTasks: completedTasks || 0,
    morningTasks: morningTasks || 0,
    eveningTasks: eveningTasks || 0,
    perfectDays: perfectDays || 0,
    loading: loading || false,
    recentUnlocks: recentUnlocks || [],
    unusedDDaySlots,
    nextSlotPrice,
    handleGoalAdded,
    completedTaskIds,
    clearCompletedTaskIds, // 🔥 디버깅용 함수 추가
    isLevelingUp, // 🔥 레벨업 상태 추가

    dailyMissions,
    weeklyMissions,
    resetDailyMissions,
    resetWeeklyMissions,
    checkMissionProgress,
    claimMissionReward,

    levelProgress: getLevelProgress() || {
      current: 0,
      required: 100,
      percentage: 0,
    },

    addPoints,
    deductPoints,
    addXP,
    deductXP,
    checkAttendance,
    purchaseDDaySlot,
    rewardTaskCompletion,
    revertTaskCompletion,
    undoTaskCompletion,
    awardBadge,
    awardBadgeWithoutXP, // 🔥 새로운 함수 추가
    setUserTitle,
    handleAllTasksCompleted,

    ALL_BADGES,
    ALL_TITLES,
    BADGE_RARITY,
    clearRecentUnlocks: () => setRecentUnlocks([]),
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

// 커스텀 훅
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};
