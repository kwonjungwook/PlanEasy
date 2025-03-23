// components/dailybadge.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// 배지 희귀도 정의
export const BADGE_RARITY = {
  COMMON: { name: "일반", color: "#8BC34A", multiplier: 1 },
  UNCOMMON: { name: "고급", color: "#29B6F6", multiplier: 1.2 },
  RARE: { name: "희귀", color: "#9C27B0", multiplier: 1.5 },
  EPIC: { name: "영웅", color: "#FF9800", multiplier: 2 },
  LEGENDARY: { name: "전설", color: "#F44336", multiplier: 3 },
};

// 확장된 배지 목록
export const BADGES = [
  // 기본 완료 배지
  {
    id: "first_complete",
    name: "첫 완료",
    description: "첫 번째 일정 완료",
    icon: "🎯",
    level: 1,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 10,
  },
  {
    id: "five_complete",
    name: "성실한 시작",
    description: "5개의 일정 완료",
    icon: "⭐",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 20,
  },
  {
    id: "ten_complete",
    name: "계획달성자",
    description: "10개의 일정 완료",
    icon: "🏆",
    level: 3,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 30,
  },
  {
    id: "twenty_complete",
    name: "지속적 성취",
    description: "20개의 일정 완료",
    icon: "🥇",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },
  {
    id: "fifty_complete",
    name: "생산성 마스터",
    description: "50개의 일정 완료",
    icon: "👑",
    level: 5,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 100,
  },
  {
    id: "hundred_complete",
    name: "세기의 달성가",
    description: "100개의 일정 완료",
    icon: "🏅",
    level: 8,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 200,
  },

  // 연속 달성 배지
  {
    id: "streak_3",
    name: "활동 챔피언",
    description: "3일 연속 일정 완료",
    icon: "🔥",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 15,
  },
  {
    id: "streak_7",
    name: "주간 챔피언",
    description: "7일 연속 일정 완료",
    icon: "📅",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 50,
  },
  {
    id: "streak_14",
    name: "2주 연속 달성",
    description: "14일 연속 일정 완료",
    icon: "📊",
    level: 5,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 100,
  },
  {
    id: "streak_30",
    name: "불꽃 한 달",
    description: "30일 연속 일정 완료",
    icon: "🔥🔥",
    level: 7,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 200,
  },
  {
    id: "streak_100",
    name: "불굴의 의지",
    description: "100일 연속 일정 완료",
    icon: "🏆🔥",
    level: 10,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 500,
  },

  // 시간대별 배지
  {
    id: "morning_person",
    name: "아침형 인간",
    description: "오전 일정 3개 완료",
    icon: "🌅",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 20,
  },
  {
    id: "morning_master",
    name: "새벽 마스터",
    description: "오전 일정 10개 완료",
    icon: "☀️",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },
  {
    id: "afternoon_achiever",
    name: "오후 성취자",
    description: "오후 일정 5개 완료",
    icon: "🌤️",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 20,
  },
  {
    id: "night_owl",
    name: "밤 올빼미",
    description: "저녁 일정 3개 완료",
    icon: "🌙",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 20,
  },
  {
    id: "night_master",
    name: "밤의 지배자",
    description: "저녁 일정 10개 완료",
    icon: "🌃",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },

  // 하루 완성 배지
  {
    id: "perfect_day",
    name: "완벽한 하루",
    description: "하루의 모든 일정 완료",
    icon: "✨",
    level: 3,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 30,
  },
  {
    id: "perfect_week",
    name: "완벽한 한 주",
    description: "일주일 동안 매일 모든 일정 완료",
    icon: "🌈",
    level: 6,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 150,
  },
  {
    id: "perfect_month",
    name: "완벽한 한 달",
    description: "한 달 동안 매일 모든 일정 완료",
    icon: "🌟",
    level: 10,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 500,
  },

  // 시간 관련 배지
  {
    id: "early_bird",
    name: "얼리버드",
    description: "5개의 오전 6시 이전 일정 완료",
    icon: "🐦",
    level: 3,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },
  {
    id: "midnight_runner",
    name: "한밤의 러너",
    description: "5개의 밤 10시 이후 일정 완료",
    icon: "🌠",
    level: 3,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },

  // 레벨 달성 배지
  {
    id: "level_1",
    name: "레벨 1 달성",
    description: "레벨 1에 도달했습니다",
    icon: "🌱",
    level: 1,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 10,
  },
  {
    id: "level_2",
    name: "레벨 2 달성",
    description: "레벨 2에 도달했습니다",
    icon: "🌿",
    level: 2,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 20,
  },
  {
    id: "level_3",
    name: "레벨 3 달성",
    description: "레벨 3에 도달했습니다",
    icon: "🍀",
    level: 3,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 30,
  },
  {
    id: "level_4",
    name: "레벨 4 달성",
    description: "레벨 4에 도달했습니다",
    icon: "🌴",
    level: 4,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 40,
  },
  {
    id: "level_5",
    name: "레벨 5 달성",
    description: "레벨 5에 도달했습니다",
    icon: "🚀",
    level: 5,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 50,
  },
  {
    id: "level_10",
    name: "레벨 10 달성",
    description: "레벨 10에 도달했습니다",
    icon: "💫",
    level: 10,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 100,
  },
  {
    id: "level_20",
    name: "레벨 20 달성",
    description: "레벨 20에 도달했습니다",
    icon: "⚡",
    level: 20,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 200,
  },
  {
    id: "level_50",
    name: "레벨 50 달성",
    description: "레벨 50에 도달했습니다",
    icon: "🌠",
    level: 50,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 500,
  },
  {
    id: "level_100",
    name: "레벨 100 달성",
    description: "레벨 100에 도달했습니다!",
    icon: "👑✨",
    level: 100,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 1000,
  },

  // 특별 배지
  {
    id: "balanced_day",
    name: "균형 잡힌 하루",
    description: "아침, 오후, 저녁 일정을 각각 하나씩 완료",
    icon: "⚖️",
    level: 3,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 30,
  },
  {
    id: "weekend_warrior",
    name: "주말 용사",
    description: "주말에 5개 이상의 일정 완료",
    icon: "🏋️",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 40,
  },
  {
    id: "holiday_planner",
    name: "휴일 계획가",
    description: "공휴일에 3개 이상의 일정 완료",
    icon: "🎊",
    level: 4,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 50,
  },
  {
    id: "comeback_king",
    name: "컴백킹",
    description: "7일 이상 앱을 사용하지 않다가 돌아와 일정 완료",
    icon: "🔄",
    level: 3,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 40,
  },
  {
    id: "speed_demon",
    name: "스피드 데몬",
    description: "5분 이내에 3개의 일정 빠르게 완료",
    icon: "⚡",
    level: 5,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 70,
  },
];

// 칭호 시스템
export const TITLES = [
  { id: "beginner", name: "초보 계획자", requirement: { level: 1 } },
  { id: "novice_planner", name: "초보 일정 관리자", requirement: { level: 3 } },
  { id: "junior_planner", name: "주니어 계획자", requirement: { level: 5 } },
  { id: "rising_planner", name: "떠오르는 계획자", requirement: { level: 7 } },
  { id: "steady", name: "꾸준한 계획자", requirement: { level: 10 } },
  { id: "dedicated", name: "헌신적인 계획자", requirement: { level: 15 } },
  { id: "master", name: "일정 마스터", requirement: { level: 20 } },
  { id: "elite", name: "엘리트 계획자", requirement: { level: 30 } },
  { id: "legendary", name: "전설적인 계획자", requirement: { level: 50 } },
  { id: "mythic", name: "신화급 계획자", requirement: { level: 100 } },

  {
    id: "early_riser",
    name: "일찍 일어나는 새",
    requirement: { badges: ["early_bird"] },
  },
  {
    id: "night_wanderer",
    name: "밤의 방랑자",
    requirement: { badges: ["night_master"] },
  },
  {
    id: "perfectionist",
    name: "완벽주의자",
    requirement: { badges: ["perfect_week"] },
  },
  {
    id: "flame_keeper",
    name: "불꽃 수호자",
    requirement: { badges: ["streak_30"] },
  },
  {
    id: "grand_achiever",
    name: "위대한 성취자",
    requirement: { badges: ["hundred_complete"] },
  },
  {
    id: "time_lord",
    name: "시간의 지배자",
    requirement: { level: 30, badges: ["perfect_week", "streak_30"] },
  },
  {
    id: "legend",
    name: "전설",
    requirement: { level: 50, badges: ["perfect_month", "streak_100"] },
  },
];

// 시즌 시스템
export const SEASONS = {
  current: {
    id: "season_spring_2023",
    name: "봄의 활력 시즌",
    startDate: "2023-03-01",
    endDate: "2023-05-31",
    theme: {
      primaryColor: "#4CAF50",
      secondaryColor: "#8BC34A",
      iconSet: "spring",
    },
    specialBadges: [
      {
        id: "spring_achiever",
        name: "봄의 성취자",
        description: "봄 시즌 동안 50개 일정 완료",
        icon: "🌱",
        rarity: BADGE_RARITY.RARE,
        xpBonus: 150,
      },
      {
        id: "spring_master",
        name: "봄의 마스터",
        description: "봄 시즌 동안 20일 연속 일정 완료",
        icon: "🌷",
        rarity: BADGE_RARITY.EPIC,
        xpBonus: 300,
      },
    ],
    seasonalChallenges: [
      {
        id: "morning_streak",
        name: "봄의 아침 습관",
        description: "5일 연속 오전 일정 완료",
        reward: { xp: 100, badges: ["spring_morning"] },
      },
      {
        id: "weekend_productivity",
        name: "주말 생산성",
        description: "4주 연속 주말에 일정 완료",
        reward: { xp: 200, badges: ["spring_weekend"] },
      },
    ],
  },
  upcoming: {
    id: "season_summer_2023",
    name: "여름의 열정 시즌",
    startDate: "2023-06-01",
    endDate: "2023-08-31",
    theme: {
      primaryColor: "#03A9F4",
      secondaryColor: "#00BCD4",
      iconSet: "summer",
    },
  },
};

// Enhanced Level Badge System
// This expands the level badges to provide more incremental rewards

// Current level badges (for reference):
// level_1, level_2, level_3, level_4, level_5, level_10, level_20, level_50, level_100

// Additional level badges to create smoother progression
const ADDITIONAL_LEVEL_BADGES = [
  {
    id: "level_7",
    name: "레벨 7 달성",
    description: "레벨 7에 도달했습니다",
    icon: "🌲",
    level: 7,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 70,
  },
  {
    id: "level_15",
    name: "레벨 15 달성",
    description: "레벨 15에 도달했습니다",
    icon: "🔆",
    level: 15,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 150,
  },
  {
    id: "level_25",
    name: "레벨 25 달성",
    description: "레벨 25에 도달했습니다",
    icon: "🌟",
    level: 25,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 250,
  },
  {
    id: "level_30",
    name: "레벨 30 달성",
    description: "레벨 30에 도달했습니다",
    icon: "💎",
    level: 30,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 300,
  },
  {
    id: "level_35",
    name: "레벨 35 달성",
    description: "레벨 35에 도달했습니다",
    icon: "🏮",
    level: 35,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 350,
  },
  {
    id: "level_40",
    name: "레벨 40 달성",
    description: "레벨 40에 도달했습니다",
    icon: "🔮",
    level: 40,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 400,
  },
  {
    id: "level_60",
    name: "레벨 60 달성",
    description: "레벨 60에 도달했습니다",
    icon: "✨",
    level: 60,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 600,
  },
  {
    id: "level_70",
    name: "레벨 70 달성",
    description: "레벨 70에 도달했습니다",
    icon: "🌠",
    level: 70,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 700,
  },
  {
    id: "level_80",
    name: "레벨 80 달성",
    description: "레벨 80에 도달했습니다",
    icon: "🔱",
    level: 80,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 800,
  },
  {
    id: "level_90",
    name: "레벨 90 달성",
    description: "레벨 90에 도달했습니다",
    icon: "⚜️",
    level: 90,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 900,
  },
];

// Special milestone badges that provide extra meaning to certain level achievements
const MILESTONE_BADGES = [
  {
    id: "milestone_level_25",
    name: "1/4 세기",
    description: "25레벨 달성으로 당신의 여정이 시작되었습니다",
    icon: "🌓",
    level: 25,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 250,
    special: true,
  },
  {
    id: "milestone_level_50",
    name: "반세기",
    description: "50레벨 달성! 당신의 전설적인 성장의 절반에 도달했습니다",
    icon: "🌗",
    level: 50,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 500,
    special: true,
  },
  {
    id: "milestone_level_75",
    name: "3/4 세기",
    description: "75레벨 달성! 거의 정상에 도달했습니다",
    icon: "🌖",
    level: 75,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 750,
    special: true,
  },
  {
    id: "milestone_level_100",
    name: "세기의 달인",
    description: "대단합니다! 100레벨에 도달하여 진정한 마스터가 되었습니다",
    icon: "🌕✨",
    level: 100,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 1500,
    special: true,
  },
];

// Additional streak badges for more granular progression
const ADDITIONAL_STREAK_BADGES = [
  {
    id: "streak_5",
    name: "5일 연속",
    description: "5일 연속 일정 완료",
    icon: "🔥",
    level: 3,
    rarity: BADGE_RARITY.COMMON,
    xpBonus: 25,
  },
  {
    id: "streak_10",
    name: "10일 연속",
    description: "10일 연속 일정 완료",
    icon: "🔥",
    level: 4,
    rarity: BADGE_RARITY.UNCOMMON,
    xpBonus: 75,
  },
  {
    id: "streak_21",
    name: "3주 연속",
    description: "21일 연속 일정 완료",
    icon: "🔥🔥",
    level: 6,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 150,
  },
  {
    id: "streak_50",
    name: "50일 연속",
    description: "50일 연속 일정 완료",
    icon: "🔥🔥",
    level: 8,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 300,
  },
  {
    id: "streak_75",
    name: "75일 연속",
    description: "75일 연속 일정 완료",
    icon: "🔥🔥🔥",
    level: 9,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 400,
  },
];

// Additional completion badges for more granular progression
const ADDITIONAL_COMPLETION_BADGES = [
  {
    id: "thirty_complete",
    name: "지속적 열정",
    description: "30개의 일정 완료",
    icon: "🎖️",
    level: 6,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 60,
  },
  {
    id: "seventy_complete",
    name: "일정 수집가",
    description: "70개의 일정 완료",
    icon: "🏵️",
    level: 7,
    rarity: BADGE_RARITY.RARE,
    xpBonus: 140,
  },
  {
    id: "two_hundred_complete",
    name: "두 세기의 달성가",
    description: "200개의 일정 완료",
    icon: "🎗️",
    level: 9,
    rarity: BADGE_RARITY.EPIC,
    xpBonus: 300,
  },
  {
    id: "five_hundred_complete",
    name: "전설적 완성가",
    description: "500개의 일정 완료",
    icon: "🎓",
    level: 10,
    rarity: BADGE_RARITY.LEGENDARY,
    xpBonus: 500,
  },
];

// Function to update existing BADGES array with the new badges
export const enhanceBadgeSystem = () => {
  // Add all the new badges to the existing BADGES array
  return [
    ...BADGES,
    ...ADDITIONAL_LEVEL_BADGES,
    ...MILESTONE_BADGES,
    ...ADDITIONAL_STREAK_BADGES,
    ...ADDITIONAL_COMPLETION_BADGES,
  ];
};

// Example of how to implement this:
// export const ENHANCED_BADGES = enhanceBadgeSystem();
// Then use ENHANCED_BADGES instead of BADGES in your app

// Additional titles for more granular progression
const ADDITIONAL_TITLES = [
  { id: "rising_star", name: "떠오르는 별", requirement: { level: 7 } },
  { id: "skilled_planner", name: "숙련된 계획자", requirement: { level: 15 } },
  { id: "expert_scheduler", name: "일정 전문가", requirement: { level: 25 } },
  {
    id: "scheduling_virtuoso",
    name: "일정 관리의 대가",
    requirement: { level: 35 },
  },
  {
    id: "productive_genius",
    name: "생산성의 천재",
    requirement: { level: 45 },
  },
  { id: "time_wizard", name: "시간의 마법사", requirement: { level: 60 } },
  { id: "planning_guru", name: "계획의 구루", requirement: { level: 70 } },
  {
    id: "productivity_sage",
    name: "생산성의 현자",
    requirement: { level: 80 },
  },
  { id: "schedule_deity", name: "일정의 신", requirement: { level: 90 } },

  // Special combination titles
  {
    id: "ultimate_achiever",
    name: "궁극의 성취자",
    requirement: { level: 40, badges: ["streak_30", "hundred_complete"] },
  },
  {
    id: "master_of_consistency",
    name: "일관성의 마스터",
    requirement: { level: 30, badges: ["streak_21", "perfect_week"] },
  },
  {
    id: "productivity_wizard",
    name: "생산성의 마법사",
    requirement: { level: 50, badges: ["perfect_month", "fifty_complete"] },
  },
  {
    id: "balanced_master",
    name: "균형의 달인",
    requirement: {
      level: 25,
      badges: ["balanced_day", "morning_master", "night_master"],
    },
  },
];

// Function to update existing TITLES array with the new titles
export const enhanceTitleSystem = () => {
  return [...TITLES, ...ADDITIONAL_TITLES];
};

// Example of how to implement this:
// export const ENHANCED_TITLES = enhanceTitleSystem();

// 레벨별 요구 경험치를 비선형으로 설정 (성장 곡선)
export const getRequiredXP = (level) => {
  // 레벨이 올라갈수록 요구 경험치가 더 가파르게 증가하는 공식
  return Math.floor(100 * level + Math.pow(level, 1.8) * 10);
};

// 일정 난이도별 경험치 부여
export const getTaskXP = (task) => {
  // 기본 XP
  let baseXP = 20;

  // 시작 시간에 따른 보너스
  const hour = parseInt(task.startTime.split(":")[0]);
  if (hour < 7) baseXP += 10; // 이른 아침 보너스
  if (hour >= 22) baseXP += 5; // 늦은 밤 보너스

  // 태스크 내용 기반 난이도 추정 (옵션)
  if (task.difficulty) {
    switch (task.difficulty) {
      case "easy":
        baseXP = 15;
        break;
      case "medium":
        baseXP = 25;
        break;
      case "hard":
        baseXP = 40;
        break;
    }
  }

  // 태스크 지속 시간에 따른 보너스
  if (task.startTime && task.endTime) {
    const startMinutes = timeToMinutes(task.startTime);
    const endMinutes = timeToMinutes(task.endTime);
    const duration = endMinutes - startMinutes;

    if (duration >= 120) baseXP += 10; // 2시간 이상 태스크
    if (duration >= 240) baseXP += 10; // 4시간 이상 태스크
  }

  return baseXP;
};

// 시간 문자열을 분으로 변환하는 헬퍼 함수
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// 휴일 체크 함수 (예시, 실제로는 휴일 API나 휴일 목록을 사용할 수 있음)
export const checkIfHoliday = (date) => {
  // 예시: 공휴일 목록 (실제 구현 시 전체 공휴일 목록 필요)
  const holidays = [
    "2023-01-01", // 신정
    "2023-01-22", // 설날
    "2023-03-01", // 삼일절
    "2023-05-05", // 어린이날
    // ... 기타 공휴일
  ];

  const dateString = date.toISOString().split("T")[0];
  return holidays.includes(dateString);
};

// 일일 도전 과제 생성 함수
export const generateDailyChallenge = () => {
  const challenges = [
    {
      id: "morning_tasks",
      description: "오전에 일정 3개 완료하기",
      checkCompletion: (stats) => stats.morningTasksCompleted >= 3,
      reward: { xp: 30 },
    },
    {
      id: "evening_tasks",
      description: "저녁에 일정 2개 완료하기",
      checkCompletion: (stats) => stats.eveningTasksCompleted >= 2,
      reward: { xp: 25 },
    },
    {
      id: "complete_all",
      description: "오늘의 모든 일정 완료하기",
      checkCompletion: (stats) =>
        stats.todaySchedules.length > 0 &&
        stats.completedCount === stats.todaySchedules.length,
      reward: { xp: 50 },
    },
    // ... 더 많은 도전 과제 추가 가능
  ];

  // 랜덤 도전 과제 선택
  const randomIndex = Math.floor(Math.random() * challenges.length);
  return challenges[randomIndex];
};

// 배지 컴포넌트
export const BadgeItem = ({ badge }) => {
  // 배지 희귀도에 따른 스타일 적용
  const rarityStyles = {
    borderColor: badge.rarity?.color || "#8BC34A",
    backgroundColor: `${badge.rarity?.color}11`, // 배경색에 투명도 추가
  };

  return (
    <View style={[styles.badgeItem, rarityStyles]}>
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text style={styles.badgeName}>{badge.name}</Text>
      {badge.rarity && (
        <View
          style={[styles.rarityTag, { backgroundColor: badge.rarity.color }]}
        >
          <Text style={styles.rarityText}>{badge.rarity.name}</Text>
        </View>
      )}
    </View>
  );
};

// 일일 도전 과제 컴포넌트
export const DailyChallenge = ({ challenge, stats }) => {
  const isCompleted = challenge.checkCompletion(stats);

  return (
    <View
      style={[
        styles.challengeContainer,
        isCompleted && styles.challengeCompleted,
      ]}
    >
      <View style={styles.challengeContent}>
        <Text style={styles.challengeTitle}>오늘의 도전!</Text>
        <Text style={styles.challengeDescription}>{challenge.description}</Text>
        <Text style={styles.challengeReward}>
          보상: {challenge.reward.xp} XP
        </Text>
      </View>

      {isCompleted ? (
        <View style={styles.challengeCompletedIcon}>
          <Text style={styles.challengeCompletedText}>✓</Text>
        </View>
      ) : (
        <View style={styles.challengeProgressIcon}>
          <Text style={styles.challengeProgressText}>•••</Text>
        </View>
      )}
    </View>
  );
};

// 시즌 정보 컴포넌트
export const SeasonInfo = ({ season, progress }) => {
  // 시즌 종료까지 남은 일수 계산
  const today = new Date();
  const endDate = new Date(season.endDate);
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
  );

  // 진행도 계산 (예: 완료된 태스크 / 50)
  const completedTasks = progress?.completedTasks || 0;
  const targetTasks = 50; // 첫 번째 시즌 배지의 목표
  const progressPercent = Math.min(
    100,
    Math.round((completedTasks / targetTasks) * 100)
  );

  return (
    <View style={styles.seasonContainer}>
      <View
        style={[
          styles.seasonHeader,
          { backgroundColor: season.theme.primaryColor },
        ]}
      >
        <Text style={styles.seasonName}>{season.name}</Text>
        <Text style={styles.seasonTimeLeft}>종료까지 {daysLeft}일 남음</Text>
      </View>

      <View style={styles.seasonContent}>
        <Text style={styles.seasonProgressText}>
          시즌 배지 진행도: {completedTasks}/{targetTasks} 일정 완료
        </Text>

        <View style={styles.seasonProgressBar}>
          <View
            style={[
              styles.seasonProgressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: season.theme.secondaryColor,
              },
            ]}
          />
        </View>

        <Text style={styles.seasonChallengeTitle}>시즌 도전 과제</Text>
        {season.seasonalChallenges?.map((challenge) => (
          <View key={challenge.id} style={styles.seasonChallengeItem}>
            <Text style={styles.seasonChallengeName}>{challenge.name}</Text>
            <Text style={styles.seasonChallengeDesc}>
              {challenge.description}
            </Text>
            <Text style={styles.seasonChallengeReward}>
              보상: {challenge.reward.xp} XP
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  badgeItem: {
    width: 100,
    height: 130,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  rarityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 5,
  },
  rarityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  // 도전 과제 컴포넌트 스타일
  challengeContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  challengeCompleted: {
    borderLeftColor: "#4CAF50",
    opacity: 0.8,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFC107",
  },
  challengeDescription: {
    fontSize: 15,
    marginBottom: 5,
  },
  challengeReward: {
    fontSize: 14,
    color: "#4CAF50",
  },
  challengeCompletedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  challengeCompletedText: {
    color: "white",
    fontWeight: "bold",
  },
  challengeProgressIcon: {
    marginLeft: 10,
  },
  challengeProgressText: {
    fontSize: 20,
    color: "#FFC107",
  },

  // 시즌 정보 컴포넌트 스타일
  seasonContainer: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "white",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seasonHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seasonName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  seasonTimeLeft: {
    color: "white",
    fontSize: 14,
  },
  seasonContent: {
    padding: 15,
  },
  seasonProgressText: {
    fontSize: 16,
    marginBottom: 10,
  },
  seasonProgressBar: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
  },
  seasonProgressFill: {
    height: "100%",
    borderRadius: 5,
  },
  seasonChallengeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  seasonChallengeItem: {
    padding: 12,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    marginBottom: 8,
  },
  seasonChallengeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  seasonChallengeDesc: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  seasonChallengeReward: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
});

export default {
  BADGES,
  BADGE_RARITY,
  TITLES,
  SEASONS,
  getRequiredXP,
  getTaskXP,
  timeToMinutes,
  checkIfHoliday,
  generateDailyChallenge,
  BadgeItem,
  DailyChallenge,
  SeasonInfo,
};
