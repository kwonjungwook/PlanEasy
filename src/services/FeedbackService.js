// src/services/FeedbackService.js
// 통합 피드백 서비스 - BasicFeedbackService와 AIFeedbackService를 추상화하여 제공

// 기본 서비스 관련 import
import { 
  generateDailyFeedback,
  generateWeeklyFeedback as generateBasicWeeklyFeedback,
  generateMonthlyFeedback as generateBasicMonthlyFeedback
} from './BasicFeedbackService';

// 유틸리티 함수 import
import { 
  calculateConsecutiveGoalAchievements,
  calculateWeeklyGoalAchievementRate,
  calculateProductivityScore,
  formatDate
} from '../utils/feedbackUtils';

import * as Notifications from "expo-notifications";

// 전역 변수로 리포트 콜백 저장
let reportCallback = null;

// 통합 피드백 생성 함수 
export const generateFeedback = async (date, reportType, schedules, tasks, studySessions, stats = null, useAI = false, isPremiumUser = false, goalTargets = []) => {
  try {
    // 리포트 타입에 따라 적절한 기본 함수 호출
    let report;
    
    if (reportType === "daily") {
      report = await generateDailyFeedback(date, schedules, tasks, studySessions, goalTargets);
    } else if (reportType === "weekly") {
      // 주간 리포트 생성
      report = await generateWeeklyFeedback(date, schedules, tasks, studySessions, stats, goalTargets);
    } else if (reportType === "monthly") {
      // 월간 리포트 생성
      report = await generateMonthlyFeedback(date, schedules, tasks, studySessions, stats, goalTargets);
    } else {
      throw new Error(`지원하지 않는 리포트 타입: ${reportType}`);
    }

    // AI 분석 사용 및 프리미엄 사용자인 경우에만 추가 분석
    if (useAI && isPremiumUser) {
      // AI 심층 분석 추가 로직
      report = await enhanceReportWithAI(report, reportType, date, schedules, tasks, studySessions);
      report.isAIGenerated = true;
    }
    
    return report;
  } catch (error) {
    console.error(`${reportType} 피드백 생성 오류:`, error);
    return {
      type: reportType,
      insights: `${reportType} 리포트 생성 중 오류가 발생했습니다.`,
      recommendations: "잠시 후 다시 시도해주세요.",
      timestamp: new Date().toISOString(),
      isAIGenerated: false
    };
  }
};

// AI 분석으로 리포트 강화 함수
const enhanceReportWithAI = async (baseReport, reportType, date, schedules, tasks, studySessions) => {
  // 기본 리포트에 AI 인사이트 추가
  try {
    // 여기에 AI 강화 로직 추가
    const enhancedReport = { ...baseReport };
    
    // 연속 달성 및 주간 달성률 계산
    const consecutiveStreak = calculateConsecutiveGoalAchievements(schedules, tasks);
    const weeklyRate = calculateWeeklyGoalAchievementRate(schedules, tasks, date);
    
    // 기존 인사이트에 달성 인사이트 추가
    enhancedReport.consecutiveGoalsStreak = consecutiveStreak;
    enhancedReport.weeklyGoalAchievementRate = weeklyRate;
    
    // 인사이트 강화
    let additionalInsights = '';
    if (consecutiveStreak >= 3) {
      additionalInsights += `\n\n🔥 축하합니다! ${consecutiveStreak}일 연속으로 목표를 달성했습니다. 훌륭한 성과입니다!`;
    }
    
    if (weeklyRate >= 80) {
      additionalInsights += `\n\n📈 이번 주 목표 달성률이 ${weeklyRate}%로 매우 우수합니다. 이대로 계속 유지해보세요!`;
    }
    
    enhancedReport.insights = (enhancedReport.insights || '') + additionalInsights;
    
    return enhancedReport;
  } catch (error) {
    console.error('AI 분석 강화 오류:', error);
    return baseReport; // 오류 시 기본 리포트 반환
  }
};

// 주간 피드백 생성 함수
const generateWeeklyFeedback = async (date, schedules, tasks, studySessions, stats, goalTargets = []) => {
  // 기본 주간 피드백 생성
  const baseReport = await generateBasicWeeklyFeedback(date, schedules, tasks, studySessions, stats);
  
  // 목표 달성 관련 데이터 추가
  const goalAchievementRate = calculateWeeklyGoalAchievementRate(schedules, tasks, date);
  
  return {
    ...baseReport,
    goalAchievementRate,
    goalTargetsCount: goalTargets.length
  };
};

// 월간 피드백 생성 함수
const generateMonthlyFeedback = async (date, schedules, tasks, studySessions, stats, goalTargets = []) => {
  // 기본 월간 피드백 생성
  const baseReport = await generateBasicMonthlyFeedback(date, schedules, tasks, studySessions, stats);
  
  // 생산성 점수 계산 및 추가
  const productivityScore = calculateProductivityScore ? 
    calculateProductivityScore(schedules, tasks, studySessions) : 75; // 기본값 제공
  
  return {
    ...baseReport,
    productivityScore,
    goalTargetsCount: goalTargets.length
  };
};

// 앱 시작 시 호출하는 초기화 함수
export const initFeedbackService = (options = {}) => {
  const isPremiumUser = options.isPremiumUser || false;
  
  // 알림 핸들러 등록 (콜백 저장)
  registerReportNotificationHandler((date, reportType) => {
    // 전역 리포트 콜백 사용
    if (reportCallback) {
      return reportCallback(date, reportType);
    }
    return null;
  });
  
  // 자동 리포트 스케줄링 업데이트 (프리미엄 상태 기반)
  updateReportScheduling(isPremiumUser);
  
  return true;
};

// 리포트 콜백 설정 함수
export const setReportCallback = (callback) => {
  reportCallback = callback;
};

// 알림 핸들러 등록
export const registerReportNotificationHandler = (callback) => {
  // 알림 응답 핸들러 설정
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { reportType } = notification.request.content.data || { reportType: 'daily' };
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // 콜백 호출
        await callback(today, reportType);
        console.log(`${reportType} 리포트 자동 생성 완료`);
      } catch (error) {
        console.error(`${reportType} 리포트 자동 생성 실패:`, error);
      }
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
};

// 프리미엄 상태 변경 시 자동 리포트 스케줄링 업데이트
export const updateReportScheduling = async (isPremiumUser) => {
  try {
    // 기존 자동 리포트 알림 취소
    await cancelAllScheduledReports();
    
    // 프리미엄 사용자만 자동 리포트 스케줄링
    if (isPremiumUser) {
      // 주간 리포트 설정 (매주 일요일 저녁 8시)
      await scheduleWeeklyReport();
      
      // 월간 리포트 설정 (매월 마지막 날 저녁 8시)
      await scheduleMonthlyReport();
      
      console.log('자동 리포트 스케줄링 완료 (프리미엄)');
    } else {
      console.log('무료 사용자: 자동 리포트 스케줄링 비활성화');
    }
    
    return true;
  } catch (error) {
    console.error('리포트 스케줄링 업데이트 오류:', error);
    return false;
  }
};

// 주간 리포트 알림 스케줄링
const scheduleWeeklyReport = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '주간 리포트 준비 완료',
      body: '지난 한 주 활동에 대한 분석 리포트가 준비되었습니다.',
      data: { reportType: 'weekly' },
    },
    trigger: {
      weekday: 7, // 일요일
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
};

// 월간 리포트 알림 스케줄링
const scheduleMonthlyReport = async () => {
  // 현재 월의 마지막 날 계산
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '월간 리포트 준비 완료',
      body: '이번 달 활동에 대한 분석 리포트가 준비되었습니다.',
      data: { reportType: 'monthly' },
    },
    trigger: {
      day: lastDayOfMonth,
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
};

// 모든 예약된 리포트 알림 취소
const cancelAllScheduledReports = async () => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  // 리포트 관련 알림만 찾아서 취소
  const reportNotificationIds = scheduledNotifications
    .filter(notification => {
      const data = notification.content.data;
      return data && (data.reportType === 'weekly' || data.reportType === 'monthly');
    })
    .map(notification => notification.identifier);
  
  // 찾은 알림 취소
  for (const id of reportNotificationIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
};
