// src/context/ProgressContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastEventSystem } from "../components/common/AutoToast";
import { addDDaySlotPurchase } from "../utils/pointHistoryManager";

// dailybadge.js에서 가져온 상수 및 함수
import {
  BADGES,
  BADGE_RARITY,
  TITLES,
  SEASONS,
  getRequiredXP,
  getTaskXP,
  timeToMinutes,
  enhanceBadgeSystem,
  enhanceTitleSystem,
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
const ATTENDANCE_DATA_KEY = "@attendance_data"; // 출석 기록 저장 키

// 모든 가능한 배지 (기본 + 확장)
const ALL_BADGES = enhanceBadgeSystem();

// 모든 타이틀 (기본 + 확장)
const ALL_TITLES = enhanceTitleSystem();

// 슬롯 가격 설정
export const SLOT_PRICES = {
  2: 100, // 두 번째 슬롯 가격
  3: 250, // 세 번째 슬롯 가격
  4: 500, // 네 번째 슬롯 가격
  5: 1000, // 다섯 번째 슬롯 가격
};

// 연속 출석 보상 설정
export const STREAK_REWARDS = {
  1: { points: 5, xp: 10 }, // 기본 출석 보상
  3: { points: 15, xp: 30 }, // 3일 연속 보너스
  7: { points: 30, xp: 70 }, // 7일 연속 보너스
  14: { points: 60, xp: 150 }, // 14일 연속 보너스
  30: { points: 100, xp: 300 }, // 30일 연속 보너스
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
  const [ddaySlots, setDdaySlots] = useState(1); // 기본 1개 슬롯
  const [checkedToday, setCheckedToday] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [activeTitle, setActiveTitle] = useState("beginner"); // 기본 타이틀
  const [completedTasks, setCompletedTasks] = useState(0);
  const [morningTasks, setMorningTasks] = useState(0);
  const [eveningTasks, setEveningTasks] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentUnlocks, setRecentUnlocks] = useState([]);
  const [unusedDDaySlots, setUnusedDDaySlots] = useState(0); // 초기값 1 (최초 1개 무료 제공)
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

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
          dailyMissionsData, // 추가
          weeklyMissionsData, // 추가
          attendanceDataStr,
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
          AsyncStorage.getItem("DAILY_MISSIONS_KEY"), // 추가
          AsyncStorage.getItem("WEEKLY_MISSIONS_KEY"), // 추가
          AsyncStorage.getItem(ATTENDANCE_DATA_KEY),
        ]);
        if (attendanceDataStr) {
          setAttendanceData(JSON.parse(attendanceDataStr));
        }
        // 포인트 설정
        if (pointsData) {
          setPoints(parseInt(pointsData));
        } else {
          // 첫 사용자에게 시작 포인트 제공
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
          // 기본 1개 슬롯 설정
          await AsyncStorage.setItem(DDAY_SLOTS_KEY, "1");
        }

        // 오늘 체크인 여부
        if (checkedData) {
          const today = new Date().toDateString();
          setCheckedToday(checkedData === today);
        }

        // 획득한 배지
        if (badgesData) {
          setEarnedBadges(JSON.parse(badgesData));
        } else {
          // 기본 배지 (첫 시작)
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
          // 초기 일일 미션 설정
          await resetDailyMissions();
        }

        // 주간 미션 설정
        if (weeklyMissionsData) {
          setWeeklyMissions(JSON.parse(weeklyMissionsData));
        } else {
          // 초기 주간 미션 설정
          await resetWeeklyMissions();
        }

        // 활성 타이틀
        if (titleData) {
          setActiveTitle(titleData);
        } else {
          // 기본 타이틀 (초보 계획자)
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

        setLoading(false);
      } catch (error) {
        console.error("진행 데이터 로드 오류:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // checkAttendance 함수 개선 - 안정성 및 오류 처리 강화
  const checkAttendance = async () => {
    try {
      // 로컬 시간 기준으로 오늘 날짜 계산
      const today = formatDateStr(new Date());

      // 이미 오늘 체크했는지 확인
      if (checkedToday) {
        ToastEventSystem.showToast("이미 오늘은 출석체크를 했습니다", 2000);
        return false;
      }

      // 출석 기록 유효성 검증
      const validAttendanceData = typeof attendanceData === 'object' ? attendanceData : {};
      
      // 출석 기록 업데이트
      const newAttendanceData = { ...validAttendanceData, [today]: true };
      
      try {
        // 데이터 저장 먼저 수행 (상태 업데이트 전)
        await AsyncStorage.setItem(
          ATTENDANCE_DATA_KEY,
          JSON.stringify(newAttendanceData)
        );

        // 저장 성공 후 상태 업데이트
        setAttendanceData(newAttendanceData);
      } catch (storageError) {
        console.error("출석 데이터 저장 오류:", storageError);
        ToastEventSystem.showToast("출석 기록 저장 중 오류가 발생했습니다", 2000);
        return false;
      }

      // 연속 출석 계산 - 안전한 로직으로 처리
      let newStreak = 0;
      try {
        newStreak = calculateStreak(newAttendanceData);
        
        // 스트릭 값 저장
        await AsyncStorage.setItem(STREAK_STORAGE_KEY, newStreak.toString());
        setStreak(newStreak);
      } catch (streakError) {
        console.error("스트릭 계산 오류:", streakError);
        // 오류가 발생해도 기본값 사용하여 진행
        newStreak = streak + 1;
      }

      try {
        // 오늘 날짜 저장
        await AsyncStorage.setItem(LAST_CHECK_DATE_KEY, today);
        setLastCheckDate(today);

        // 오늘 체크 표시
        await AsyncStorage.setItem(CHECKED_TODAY_KEY, today);
        setCheckedToday(true);
      } catch (dateError) {
        console.error("날짜 데이터 저장 오류:", dateError);
        // 중요 단계이므로 오류 시 사용자에게 알림
        ToastEventSystem.showToast("출석 정보 저장 중 오류가 발생했습니다", 2000);
      }

      // 보상 계산
      let reward = STREAK_REWARDS[1] || { points: 5, xp: 10 }; // 안전한 기본값 제공

      // 특별 보상 마일스톤 체크
      if (STREAK_REWARDS[newStreak]) {
        reward = STREAK_REWARDS[newStreak];
      }

      try {
        // 포인트 및 XP 추가
        await addPoints(reward.points, `${newStreak}일 연속 출석`);
        await addXP(reward.xp, `${newStreak}일 연속 출석`);

        // 출석 체크 미션 업데이트
        await checkMissionProgress("attendance_check", {
          currentStreak: newStreak,
        });
        
        // 연속 출석 배지 확인
        await checkStreakBadges(newStreak);
      } catch (rewardError) {
        console.error("보상 처리 오류:", rewardError);
        // 보상 처리 실패해도 출석은 인정
      }

      ToastEventSystem.showToast(
        `${newStreak}일 연속 출석! ${reward.points}P, ${reward.xp}XP 획득`,
        3000
      );

      return true;
    } catch (error) {
      console.error("출석 체크 오류:", error);
      // 사용자에게 일반적인 오류 메시지 표시
      ToastEventSystem.showToast("출석 체크 중 오류가 발생했습니다. 다시 시도해주세요.", 3000);
      return false;
    }
  };

  // 연속 출석 계산 함수 개선 - 안전성 및 오류 처리 강화
  const calculateStreak = (data) => {
    if (!data || typeof data !== 'object') {
      console.warn('calculateStreak: 유효하지 않은 데이터 형식', data);
      return 0; // 유효하지 않은 데이터일 경우 0 반환
    }

    // 날짜 유틸리티 함수 - 로컬 타임존 기반 포맷팅
    const formatDateStr = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 로컬 시간 기준으로 날짜 계산 (타임존 문제 해결)
    const now = new Date();
    const today = formatDateStr(now);
    
    // 오늘 체크했으면 1부터 시작
    let currentStreak = data[today] === true ? 1 : 0;
    
    if (currentStreak === 0) {
      return 0; // 오늘 출석하지 않았으면 연속 출석 없음
    }

    // 안전한 날짜 계산을 위한 변수들
    const MAX_DAYS_TO_CHECK = 366; // 무한 루프 방지용 최대 검사 일수
    let daysChecked = 0;
    
    // 어제부터 거슬러 올라가며 연속된 출석 체크
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1); // 어제부터 시작
    
    while (daysChecked < MAX_DAYS_TO_CHECK) {
      // 체크할 날짜 문자열 형식으로 변환
      const checkDateStr = formatDateStr(checkDate);
      
      // 해당 날짜에 출석 기록이 정확히 true인지 확인
      if (data[checkDateStr] === true) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // 하루 전으로 이동
      } else {
        break; // 연속 출석이 끊김
      }
      
      daysChecked++;
    }

    return currentStreak;
  };

  // 미션 초기화 함수 (매일/매주 실행)
  const resetDailyMissions = async () => {
    // 기본 일일 미션 정의
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

    // 미션 상태 초기화 및 저장
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
    // 기본 주간 미션 정의
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
        categories: [], // 완료한 카테고리 추적
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

    // 미션 상태 초기화 및 저장
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

  // 미션 완료 체크 함수
  const checkMissionProgress = async (activityType, data = {}) => {
    // 활동 유형에 따라 관련 미션 진행도 업데이트
    let dailyUpdated = false;
    let weeklyUpdated = false;

    // 임시 미션 상태 복사
    const updatedDailyMissions = [...dailyMissions];
    const updatedWeeklyMissions = [...weeklyMissions];

    switch (activityType) {
      case "task_complete":
        // 일정 완료 관련 미션 업데이트
        const { taskTime, category } = data;
        const now = new Date();
        const hour = now.getHours();

        // 아침 일정 체크 (오전 9시 이전)
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

        // 3개 일정 완료 체크
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

        // 다양한 카테고리 체크 (주간 미션)
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
        // 연속 출석 관련 미션 업데이트
        const streakMission = updatedWeeklyMissions.find(
          (m) => m.id === "weekly_streak"
        );
        if (streakMission) {
          // 현재 streak 상태 반영
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
        // 하루 완벽 달성 미션 업데이트
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
        // 일정 추가 관련 미션 업데이트
        const { taskDate } = data;
        const currentHour = new Date().getHours();

        // 저녁에 내일 일정 추가 체크
        if (currentHour >= 20) {
          // 저녁 8시 이후
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);

          // 내일 날짜에 추가된 일정인지 확인
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

    // 상태 업데이트가 있을 경우에만 저장
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

  // 미션 보상 획득 함수
  const claimMissionReward = async (missionId) => {
    // 일일 미션 확인
    let mission = dailyMissions.find((m) => m.id === missionId);
    let isMissionDaily = true;

    // 주간 미션 확인
    if (!mission) {
      mission = weeklyMissions.find((m) => m.id === missionId);
      isMissionDaily = false;
    }

    // 미션이 없거나 이미 완료했거나 보상을 받았으면 중단
    if (!mission || !mission.completed || mission.claimed) {
      return false;
    }

    // 보상 지급
    await addPoints(mission.reward.points, `미션 보상: ${mission.title}`);
    await addXP(mission.reward.xp, `미션 보상: ${mission.title}`);

    // 미션 상태 업데이트
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

    // 모든 미션 완료 시 추가 보너스 확인
    checkAllMissionsComplete();

    return true;
  };

  // 모든 미션 완료 확인 및 보너스 지급
  const checkAllMissionsComplete = async () => {
    // 일일 미션 모두 완료 및 보상 획득 확인
    const allDailyCompleted = dailyMissions.every((m) => m.claimed);
    const allDailyClaimedKey = `DAILY_ALL_CLAIMED_${
      new Date().toISOString().split("T")[0]
    }`;

    // 이미 보너스를 받았는지 확인
    const alreadyClaimed = await AsyncStorage.getItem(allDailyClaimedKey);

    if (allDailyCompleted && !alreadyClaimed) {
      // 추가 보너스 지급
      await addPoints(25, "일일 미션 올 클리어 보너스");
      await addXP(35, "일일 미션 올 클리어 보너스");

      // 보너스 지급 기록
      await AsyncStorage.setItem(allDailyClaimedKey, "true");
    }

    // 주간 미션 모두 완료 및 보상 획득 확인
    const allWeeklyCompleted = weeklyMissions.every((m) => m.claimed);
    const currentWeek = getWeekNumber(new Date());
    const allWeeklyClaimedKey = `WEEKLY_ALL_CLAIMED_${currentWeek}`;

    const weeklyAlreadyClaimed = await AsyncStorage.getItem(
      allWeeklyClaimedKey
    );

    if (allWeeklyCompleted && !weeklyAlreadyClaimed) {
      // 추가 보너스 지급
      await addPoints(100, "주간 미션 올 클리어 보너스");
      await addXP(150, "주간 미션 올 클리어 보너스");

      // 보너스 지급 기록
      await AsyncStorage.setItem(allWeeklyClaimedKey, "true");
    }
  };

  // 주 번호 계산 헬퍼 함수
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // XP 추가 및 레벨업 확인 함수
  const addXP = async (amount, reason = "") => {
    try {
      const newXP = xp + amount;
      setXp(newXP);
      await AsyncStorage.setItem(XP_STORAGE_KEY, newXP.toString());

      // 레벨업 확인
      const requiredXP = getRequiredXP(level);
      if (newXP >= requiredXP) {
        const newLevel = level + 1;
        setLevel(newLevel);
        await AsyncStorage.setItem(LEVEL_STORAGE_KEY, newLevel.toString());

        // 레벨업 보상 포인트
        const levelupPoints = newLevel * 20;
        setPoints((prevPoints) => prevPoints + levelupPoints);
        await AsyncStorage.setItem(
          POINTS_STORAGE_KEY,
          (points + levelupPoints).toString()
        );

        // 토스트 메시지로 알림
        ToastEventSystem.showToast(
          `레벨 업! 레벨 ${newLevel} 달성! ${levelupPoints} 포인트 획득!`,
          3000
        );

        // 레벨 배지 확인
        const levelBadgeId = `level_${newLevel}`;
        if (
          ALL_BADGES.some((badge) => badge.id === levelBadgeId) &&
          !earnedBadges.includes(levelBadgeId)
        ) {
          await awardBadge(levelBadgeId);
        }

        // 마일스톤 배지 확인
        const milestoneBadgeId = `milestone_level_${newLevel}`;
        if (
          ALL_BADGES.some((badge) => badge.id === milestoneBadgeId) &&
          !earnedBadges.includes(milestoneBadgeId)
        ) {
          await awardBadge(milestoneBadgeId);
        }

        // 타이틀 확인
        checkAndUnlockTitles();
      } else {
        // XP 획득 토스트
        if (amount > 0) {
          ToastEventSystem.showToast(
            `${amount} XP 획득! ${reason && `(${reason})`}`,
            2000
          );
        }
      }

      return true;
    } catch (error) {
      console.error("XP 추가 오류:", error);
      return false;
    }
  };

  // 동적 보상 계산 함수
  const calculateDynamicReward = (baseReward, activityType) => {
    let multiplier = 1.0;
    const hour = new Date().getHours();

    // 시간대별 보너스
    if (hour >= 5 && hour <= 8) {
      // 아침 활동 보너스 (초기 활동 격려)
      multiplier += 0.3;
    } else if (hour >= 21 || hour <= 4) {
      // 야간 활동 보너스
      multiplier += 0.2;
    }

    // 요일별 보너스 (주말에는 더 많은 보상)
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      multiplier += 0.15;
    }

    // 연속 활동에 따른 보너스
    if (streak > 3) {
      // 3일 이상 연속 출석 시 추가 보너스
      multiplier += Math.min(0.5, streak * 0.05); // 최대 50%까지 보너스
    }

    // 활동 유형별 특별 보너스 (가끔 랜덤한 보너스 제공)
    if (Math.random() < 0.15) {
      // 15% 확률로 보너스 발생
      multiplier += 0.5;
      // 사용자에게 보너스 알림 (ToastEventSystem 활용)
      ToastEventSystem.showToast("행운의 보너스! +50% 추가 포인트 획득!", 2000);
    }

    return Math.round(baseReward * multiplier);
  };

  // nextSlotPrice 계산 로직 (기존 슬롯 수에 따라 가격이 증가)
  const calculateNextSlotPrice = () => {
    // 기본 가격은 100포인트
    const basePrice = 100;

    // 슬롯 수에 따라 가격 증가
    // 첫 슬롯은 100, 두번째는 150, 세번째는 200, 네번째부터는 300씩 증가
    if (ddaySlots <= 1) return basePrice; // 첫 번째 슬롯
    if (ddaySlots === 2) return 150; // 두 번째 슬롯
    if (ddaySlots === 3) return 200; // 세 번째 슬롯
    return basePrice + (ddaySlots - 1) * 100; // 이후 슬롯
  };

  // 계산된 다음 슬롯 가격
  const nextSlotPrice = calculateNextSlotPrice();
  // 포인트 추가 함수
  const addPoints = async (amount, reason = "") => {
    if (amount > 0) {
      // 획득하는 경우에만 동적 보상 적용
      amount = calculateDynamicReward(amount, reason);
    }
    try {
      const newPoints = points + amount;
      setPoints(newPoints);
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, newPoints.toString());

      // 토스트 메시지로 알림
      if (amount > 0) {
        ToastEventSystem.showToast(
          `${amount} 포인트를 획득했습니다! ${reason && `(${reason})`}`,
          2000
        );
      }

      return true;
    } catch (error) {
      console.error("포인트 추가 오류:", error);
      return false;
    }
  };

  // 포인트 차감 함수
  const deductPoints = async (amount, reason = "") => {
    try {
      if (points < amount) {
        ToastEventSystem.showToast("포인트가 부족합니다", 2000);
        return false;
      }

      const newPoints = points - amount;
      setPoints(newPoints);
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, newPoints.toString());

      // 토스트 메시지로 알림
      ToastEventSystem.showToast(
        `${amount} 포인트를 사용했습니다 ${reason && `(${reason})`}`,
        2000
      );

      return true;
    } catch (error) {
      console.error("포인트 차감 오류:", error);
      return false;
    }
  };

  // 배지 획득 함수
  const awardBadge = async (badgeId) => {
    try {
      if (earnedBadges.includes(badgeId)) {
        return false; // 이미 가지고 있는 배지
      }

      // 배지 찾기
      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      if (!badge) {
        console.error(`배지 ID: ${badgeId}를 찾을 수 없습니다`);
        return false;
      }

      // 배지 획득
      const newEarnedBadges = [...earnedBadges, badgeId];
      setEarnedBadges(newEarnedBadges);
      await AsyncStorage.setItem(
        EARNED_BADGES_KEY,
        JSON.stringify(newEarnedBadges)
      );

      // 배지 보상 XP 지급
      if (badge.xpBonus) {
        await addXP(badge.xpBonus, `${badge.name} 배지 획득`);
      }

      // 새 업적 알림에 추가
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

      // 토스트 메시지로 알림
      ToastEventSystem.showToast(`🏆 새 배지 획득: ${badge.name}!`, 3000);

      // 타이틀 확인
      checkAndUnlockTitles();

      return true;
    } catch (error) {
      console.error("배지 획득 오류:", error);
      return false;
    }
  };

  // 타이틀 확인 및 잠금 해제 함수
  const checkAndUnlockTitles = async () => {
    try {
      let newTitlesUnlocked = false;

      for (const title of ALL_TITLES) {
        // 이미 해금된 타이틀은 건너뛰기
        if (earnedBadges.includes(`title_${title.id}`)) {
          continue;
        }

        // 요구사항 확인
        let meetsRequirements = true;

        // 레벨 요구사항
        if (title.requirement.level && level < title.requirement.level) {
          meetsRequirements = false;
        }

        // 배지 요구사항
        if (title.requirement.badges) {
          for (const requiredBadge of title.requirement.badges) {
            if (!earnedBadges.includes(requiredBadge)) {
              meetsRequirements = false;
              break;
            }
          }
        }

        // 타이틀 해금
        if (meetsRequirements) {
          const titleBadgeId = `title_${title.id}`;

          // 배지 목록에 타이틀 배지 추가
          const newEarnedBadges = [...earnedBadges, titleBadgeId];
          setEarnedBadges(newEarnedBadges);
          await AsyncStorage.setItem(
            EARNED_BADGES_KEY,
            JSON.stringify(newEarnedBadges)
          );

          // 타이틀 획득 알림
          ToastEventSystem.showToast(`🏅 새 타이틀 해금: ${title.name}!`, 3000);

          // 새 업적 알림에 추가
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

  // 활성 타이틀 설정 함수
  const setUserTitle = async (titleId) => {
    try {
      // 해당 타이틀 소유 여부 확인
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

  // 연속 출석 배지 확인
  const checkStreakBadges = async (currentStreak) => {
    // 연속 출석 배지 목록
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

    // 현재 연속 출석일에 맞는 배지 확인
    for (const badgeInfo of streakBadges) {
      if (currentStreak === badgeInfo.days) {
        await awardBadge(badgeInfo.id);
        break;
      }
    }
  };

  // D-Day 슬롯 구매 함수
  const purchaseDDaySlot = async () => {
    try {
      console.log(
        `D-Day 슬롯 구매 시도: ${points}P 보유, ${nextSlotPrice}P 필요`
      );

      // 포인트가 충분한지 확인
      if (points < nextSlotPrice) {
        console.log("포인트 부족으로 구매 실패");
        return false;
      }

      // 포인트 차감
      const newPoints = points - nextSlotPrice;
      setPoints(newPoints);

      // 사용 가능한 D-Day 슬롯 증가 (총 슬롯 수는 그대로, 사용 가능한 슬롯만 증가)
      setUnusedDDaySlots((prev) => prev + 1);

      // 변경된 데이터 저장
      await Promise.all([
        AsyncStorage.setItem("@user_points", newPoints.toString()),
        AsyncStorage.setItem(
          "@unused_dday_slots",
          (unusedDDaySlots + 1).toString()
        ),
      ]);

      // 포인트 내역에 구매 기록 추가 (새로 추가된 코드)
      await addDDaySlotPurchase(nextSlotPrice);

      // 알림 생성 (새로운 슬롯 해금)
      createUnlock({
        type: "feature",
        name: "D-Day 슬롯 구매 완료!",
        description: "D-Day 화면에서 추가 목표를 설정할 수 있습니다.",
        icon: "🎯",
      });

      console.log(
        `D-Day 슬롯 구매 성공! 사용 가능한 슬롯: ${unusedDDaySlots + 1}`
      );
      return true;
    } catch (error) {
      console.error("D-Day 슬롯 구매 오류:", error);
      return false;
    }
  };

  const handleGoalAdded = async () => {
    try {
      // D-Day가 새로 추가되었을 때 사용 가능한 슬롯 감소
      if (unusedDDaySlots > 0) {
        const newUnusedSlots = unusedDDaySlots - 1;
        setUnusedDDaySlots(newUnusedSlots);

        // 변경된 값 저장
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

  // 일정 완료 보상 함수 (확장)
  const rewardTaskCompletion = async (task) => {
    try {
      // 기본 포인트 보상
      let pointReward = 5;

      // 기본 XP 보상
      let xpReward = getTaskXP(task);

      // 시간에 따른 보너스
      const hour = parseInt(task.startTime.split(":")[0]);
      if (hour < 7) pointReward += 3; // 이른 아침 보너스
      if (hour >= 22) pointReward += 2; // 늦은 밤 보너스

      // 포인트 추가
      await addPoints(pointReward, "일정 완료");

      // XP 추가
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
        todayCompleted: completedTasks + 1,
      });

      // 시간대별 일정 카운트 업데이트
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

      // 배지 확인
      await checkTaskCompletionBadges(newCompletedTasks);
      await checkTimeBasedBadges();

      return true;
    } catch (error) {
      console.error("일정 완료 보상 오류:", error);
      return false;
    }
  };

  // 완료한 일정 수에 따른 배지 확인
  const checkTaskCompletionBadges = async (taskCount) => {
    // 완료 수 배지 목록
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

    // 현재 완료 수에 맞는 배지 확인
    for (const badgeInfo of completionBadges) {
      if (taskCount === badgeInfo.count) {
        await awardBadge(badgeInfo.id);
        break;
      }
    }
  };

  // 시간대별 배지 확인
  const checkTimeBasedBadges = async () => {
    // 아침형 인간 (3개의 아침 일정)
    if (morningTasks === 3) {
      await awardBadge("morning_person");
    }

    // 아침 마스터 (10개의 아침 일정)
    if (morningTasks === 10) {
      await awardBadge("morning_master");
    }

    // 오후 성취자 (5개의 오후 일정)
    // 여기서는 오후 일정 수를 직접 추적하지 않으므로 생략

    // 밤 올빼미 (3개의 밤 일정)
    if (eveningTasks === 3) {
      await awardBadge("night_owl");
    }

    // 밤의 지배자 (10개의 밤 일정)
    if (eveningTasks === 10) {
      await awardBadge("night_master");
    }
  };

  // 모든 일정 완료 처리 함수
  const handleAllTasksCompleted = async () => {
    try {
      // 완벽한 하루 배지 획득
      await awardBadge("perfect_day");

      // 완벽한 날 수 증가
      const newPerfectDays = perfectDays + 1;
      setPerfectDays(newPerfectDays);
      await AsyncStorage.setItem(PERFECT_DAYS_KEY, newPerfectDays.toString());

      // 완벽한 하루 미션 업데이트
      await checkMissionProgress("perfect_day");
      // 완벽한 주/월 배지 확인 (향후 구현)

      return true;
    } catch (error) {
      console.error("모든 일정 완료 처리 오류:", error);
      return false;
    }
  };

  // 다음 날 자정에 체크 상태 초기화 - 수정
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

        // 오늘 날짜 갱신 - 자정이 지나면 새 날짜로 업데이트
        const newToday = new Date().toISOString().split("T")[0];
        setLastCheckDate(newToday);

        resetCheckStatus(); // 다음 날을 위해 재설정
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

        // 일일 미션 초기화 추가
        await resetDailyMissions();

        resetDaily(); // 다음 날을 위해 재설정
      }, timeUntilMidnight);
    };

    resetDaily();
  }, []);

  // 주간 미션 초기화 (매주 월요일 자정)
  useEffect(() => {
    const resetWeekly = () => {
      const now = new Date();
      const daysUntilMonday = (1 + 7 - now.getDay()) % 7; // 월요일까지 남은 일수

      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const timeUntilMonday = nextMonday - now;

      setTimeout(async () => {
        // 주간 미션 초기화
        await resetWeeklyMissions();

        resetWeekly(); // 다음 주를 위해 재설정
      }, timeUntilMonday);
    };

    resetWeekly();
  }, []);

  // 유저 레벨에 맞는 타이틀 가져오기
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

  // 현재 레벨의 진행 상황 계산
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
    // Ensure all values have defaults
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
    ddaySlots,
    unusedDDaySlots,
    nextSlotPrice,
    handleGoalAdded,

    // 미션 관련 상태 및 함수 추가
    dailyMissions,
    weeklyMissions,
    resetDailyMissions,
    resetWeeklyMissions,
    checkMissionProgress,
    claimMissionReward,

    // Calculated values with safe defaults
    nextSlotPrice: SLOT_PRICES[ddaySlots + 1] || 2000,
    currentLevelTitle: getCurrentLevelTitle() || "초보 계획자",
    levelProgress: getLevelProgress() || {
      current: 0,
      required: 100,
      percentage: 0,
    },

    // Functions (keep as is)
    addPoints,
    deductPoints,
    addXP,
    checkAttendance,
    purchaseDDaySlot,
    rewardTaskCompletion,
    awardBadge,
    setUserTitle,
    handleAllTasksCompleted,

    // Constants and resources
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
