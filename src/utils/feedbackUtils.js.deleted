// src/utils/feedbackUtils.js
import { format, startOfWeek, endOfWeek } from 'date-fns';

// 목표 달성 연속 스트릭 계산
export const calculateConsecutiveGoalAchievements = (schedules, tasks) => {
  // 날짜순으로 정렬
  const sortedDates = Object.keys(schedules).sort();
  let currentStreak = 0;
  let maxStreak = 0;
  
  // 날짜별 완료 상태 확인
  for (const date of sortedDates) {
    const dailySchedules = schedules[date] || [];
    const dailyTasks = tasks[date] || {};
    
    // 완료율 계산
    const totalSchedules = dailySchedules.length;
    let completedSchedules = 0;
    
    // 완료된 일정 카운트
    dailySchedules.forEach(schedule => {
      if (dailyTasks[schedule.id]) {
        completedSchedules++;
      }
    });
    
    // 완료율 계산 (0으로 나누는 것 방지)
    const completionRate = totalSchedules > 0 
      ? (completedSchedules / totalSchedules) * 100 
      : 0;
    
    // 70% 이상 완료시 성공으로 간주
    const isDaySuccessful = completionRate >= 70;
    
    if (isDaySuccessful) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
};

// 주간 목표 달성률 계산
export const calculateWeeklyGoalAchievementRate = (schedules, tasks, selectedDate) => {
  // 주의 시작과 끝 날짜 계산
  const currentDate = new Date(selectedDate);
  const dayOfWeek = currentDate.getDay();
  const firstDayOfWeek = new Date(currentDate);
  firstDayOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    weekDates.push(formatDate(day));
  }
  
  // 주간 완료율 계산
  let totalSchedules = 0;
  let completedSchedules = 0;
  
  weekDates.forEach(date => {
    const dailySchedules = schedules[date] || [];
    const dailyTasks = tasks[date] || {};
    
    totalSchedules += dailySchedules.length;
    
    // 완료된 일정 카운트
    dailySchedules.forEach(schedule => {
      if (dailyTasks[schedule.id]) {
        completedSchedules++;
      }
    });
  });
  
  // 주간 달성률 계산 (0으로 나누는 것 방지)
  const weeklyRate = totalSchedules > 0 
    ? Math.round((completedSchedules / totalSchedules) * 100) 
    : 0;
  
  return weeklyRate;
};

// 날짜 포맷 도우미 함수
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 일정 생산성 점수 계산
export const calculateProductivityScore = (schedules, tasks, studySessions) => {
  // 계획 준수율: 60%
  const adherenceScore = calculateAdherenceScore(schedules, tasks);
  
  // 일정 밀도: 20%
  const densityScore = calculateDensityScore(schedules);
  
  // 학습 집중도: 20%
  const focusScore = calculateFocusScore(studySessions);
  
  // 최종 점수 계산 (100점 만점)
  return Math.round(
    (adherenceScore * 0.6) + 
    (densityScore * 0.2) + 
    (focusScore * 0.2)
  );
};

// 계획 준수율 계산 (0-100)
const calculateAdherenceScore = (schedules, tasks) => {
  let totalSchedules = 0;
  let completedSchedules = 0;
  
  Object.keys(schedules).forEach(date => {
    const dailySchedules = schedules[date] || [];
    const dailyTasks = tasks[date] || {};
    
    totalSchedules += dailySchedules.length;
    
    dailySchedules.forEach(schedule => {
      if (dailyTasks[schedule.id]) {
        completedSchedules++;
      }
    });
  });
  
  return totalSchedules > 0 
    ? Math.round((completedSchedules / totalSchedules) * 100)
    : 0;
};

// 일정 밀도 점수 계산 (0-100)
const calculateDensityScore = (schedules) => {
  // 일정 밀도 계산 로직 구현
  // 예: 적절한 개수의 일정 배치, 시간대별 배분 등
  return 70; // 예시 값
};

// 학습 집중도 점수 계산 (0-100)
const calculateFocusScore = (studySessions) => {
  // 학습 집중도 계산 로직 구현
  // 예: 장시간 집중 학습, 짧은 휴식 간격 등
  return 80; // 예시 값
};