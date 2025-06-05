// src/screens/AIFeedbackScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlanner } from "../context/PlannerContext";
import { ko } from "date-fns/locale";
import { updateReportScheduling } from "../services/FeedbackService";
import { differenceInDays } from "date-fns";

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  sub,
} from "date-fns";
import axios from "axios";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// 차트 컴포넌트 불러오기
import {
  DailyStudyChart,
  WeeklyStudyChart,
  MonthlySubjectChart,
} from "../components/reports/SimpleCharts";

// BasicFeedbackService에서 필요한 함수들 import
import { 
    generateDailyFeedback, 
    generateWeeklyFeedback as generateBasicWeeklyFeedback, 
    generateMonthlyFeedback as generateBasicMonthlyFeedback,
    cancelAllNotifications
  } from './BasicFeedbackService';

  
// API 설정 - Constants에서 가져오기
const DEEPSEEK_API_KEY = Constants.expoConfig?.extra?.deepseekApiKey;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// API 요청을 위한 공통 함수
const callDeepseekAPI = async (messages) => {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat', // 사용할 모델 (실제 모델명으로 교체 필요)
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    // API 응답에서 JSON 추출
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('DeepSeek API 호출 오류:', error);
    
    // API 키 문제인 경우 (401 오류)
    if (error.response && error.response.status === 401) {
      return { 
        error: true, 
        message: 'API 키가 유효하지 않습니다. 개발자에게 문의해주세요.',
        errorType: 'api_key'
      };
    }
    
    // 기타 API 요청 관련 오류
    if (error.response) {
      return { 
        error: true, 
        message: `API 요청 실패: ${error.response.status} ${error.response.statusText}`,
        errorType: 'api_request'
      };
    }
    
    // 네트워크 오류 등
    return { 
      error: true, 
      message: `오류가 발생했습니다: ${error.message}`,
      errorType: 'network'
    };
  }
};

// AI 기반 주간 피드백 생성 함수 (프리미엄 사용자용)
const generateAIWeeklyFeedback = async (date, schedules, tasks, studySessions, weeklyStats = null) => {
  try {
    // 1. 날짜 범위 계산 (해당 주의 시작과 끝)
    const currentDate = new Date(date);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // 월요일 시작
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // 일요일 끝
    
    const startDateStr = format(weekStart, 'yyyy-MM-dd');
    const endDateStr = format(weekEnd, 'yyyy-MM-dd');
    
    // 현재 날짜의 주차 정보 계산
    const year = currentDate.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const daysSinceFirstDay = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    console.log(`AI 주간 피드백 생성 중: ${startDateStr} ~ ${endDateStr}, 주차: ${weekKey}`);
    
    // 2. 기본 데이터 먼저 수집
    const basicReport = await generateBasicWeeklyFeedback(date, schedules, tasks, studySessions, weeklyStats);
    
    // 3. 데이터 요약 생성
    const weekSummary = {
      period: `${startDateStr} ~ ${endDateStr}`,
      totalHours: basicReport.totalHours,
      completionRate: basicReport.completionRate,
      topCategories: Object.entries(basicReport.subjectAnalysis || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, seconds]) => {
          return {
            category,
            hours: Math.round(seconds / 3600 * 10) / 10
          };
        }),
      dailyStudyHours: Object.entries(basicReport.dailyStudyTime || {}).map(([date, seconds]) => {
        return {
          date,
          day: format(new Date(date), 'EEEE', { locale: ko }),
          hours: Math.round(seconds / 3600 * 10) / 10
        };
      }),
      dailyCompletionRates: Object.entries(basicReport.dailyCompletionRate || {}).map(([date, rate]) => {
        return {
          date,
          day: format(new Date(date), 'EEEE', { locale: ko }),
          completionRate: rate
        };
      }),
      mostProductiveDay: basicReport.mostProductiveDay
    };
    
    // 4. DeepSeek API 호출 (API 키가 있는 경우만)
    if (DEEPSEEK_API_KEY) {
      try {
        const messages = [
          {
            role: 'system',
            content: `당신은 생산성 코치이자 시간 관리 전문가입니다. 사용자의 주간 활동 데이터를 분석하여 통찰력 있는 피드백과 개선 제안을 제공하세요.`
          },
          {
            role: 'user',
            content: `제 지난 한 주(${startDateStr}~${endDateStr}) 활동 데이터를 분석해서 통찰력 있는 피드백을 제공해주세요. 데이터는 다음과 같습니다: ${JSON.stringify(weekSummary)}`
          }
        ];
        
        // API 호출
        const apiResponse = await callDeepseekAPI(messages);
        
        // API 오류 확인
        if (!apiResponse.error) {
          // API 응답 데이터로 기본 보고서 업데이트
          return {
            ...basicReport,
            insights: apiResponse.insights || basicReport.insights,
            recommendations: apiResponse.recommendations || basicReport.recommendations,
            weeklyTheme: apiResponse.weeklyTheme || basicReport.weeklyTheme,
            focusAdvice: apiResponse.focusAdvice || basicReport.focusAdvice,
            scheduleInsights: apiResponse.scheduleInsights || basicReport.scheduleInsights,
            isAIGenerated: true
          };
        } else {
          // API 오류 시 기본 보고서 반환
          console.warn('AI API 오류:', apiResponse.message);
          return {
            ...basicReport,
            insights: `${basicReport.insights} (AI 분석 중 오류: ${apiResponse.message})`,
            isAIGenerated: false
          };
        }
      } catch (error) {
        console.error("DeepSeek API 처리 오류:", error);
        return {
          ...basicReport,
          insights: `${basicReport.insights} (AI 처리 중 오류가 발생했습니다)`,
          isAIGenerated: false
        };
      }
    }
    
    // API 키가 없는 경우 기본 보고서 반환
    console.warn('API 키가 설정되지 않았습니다. 기본 피드백으로 대체합니다.');
    return {
      ...basicReport,
      insights: `${basicReport.insights} (AI 분석을 위한 API 키가 설정되지 않았습니다)`,
      isAIGenerated: false
    };
    
  } catch (error) {
    console.error("AI 주간 피드백 생성 오류:", error);
    // 오류 발생 시 기본 피드백으로 대체
    const basicReport = await generateBasicWeeklyFeedback(date, schedules, tasks, studySessions, weeklyStats);
    return {
      ...basicReport,
      insights: "AI 분석 중 오류가 발생하여 기본 분석 결과를 제공합니다.",
      isAIGenerated: false
    };
  }
};

// AI 기반 월간 피드백 생성 함수 (프리미엄 사용자용)
const generateAIMonthlyFeedback = async (date, schedules, tasks, studySessions, monthlyStats = null) => {
  try {
    // 1. 날짜 범위 계산 (해당 월의 시작과 끝)
    const currentDate = new Date(date);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const startDateStr = format(monthStart, 'yyyy-MM-dd');
    const endDateStr = format(monthEnd, 'yyyy-MM-dd');
    const monthKey = format(currentDate, 'yyyy-MM');
    
    console.log(`AI 월간 피드백 생성 중: ${format(monthStart, 'yyyy년 MM월')}, 키: ${monthKey}`);
    
    // 2. 기본 데이터 먼저 수집
    const basicReport = await generateBasicMonthlyFeedback(date, schedules, tasks, studySessions, monthlyStats);
    
    // 3. 데이터 요약 생성
    const monthSummary = {
      month: format(monthStart, 'yyyy년 MM월'),
      totalDays: basicReport.daysWithStudy,
      activityRatio: basicReport.activityRatio,
      totalHours: basicReport.totalHours,
      avgDailyHours: basicReport.avgDailyHours,
      completionRate: basicReport.completionRate,
      mostActiveDay: basicReport.mostActiveDay,
      mostActiveTimeSlot: basicReport.mostActiveTimeSlot,
      topSubjects: Object.entries(basicReport.subjectAnalysis || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subject, seconds]) => {
          return {
            subject,
            hours: Math.round(seconds / 3600 * 10) / 10
          };
        })
    };
    
    // 4. DeepSeek API 호출 (API 키가 있는 경우만)
    if (DEEPSEEK_API_KEY) {
      try {
        const messages = [
          {
            role: 'system',
            content: `당신은 전문 생산성 코치이자 시간 관리 전문가입니다. 사용자의 월간 활동 데이터를 분석하여 심층적인 인사이트와 장기적인 개선 방향을 제시해주세요.`
          },
          {
            role: 'user',
            content: `${format(monthStart, 'yyyy년 MM월')} 한 달 동안의 제 활동 데이터를 분석하여 인사이트와 개선점을 알려주세요. 데이터는 다음과 같습니다: ${JSON.stringify(monthSummary)}`
          }
        ];
        
        // API 호출
        const apiResponse = await callDeepseekAPI(messages);
        
        // API 오류 확인
        if (!apiResponse.error) {
          // API 응답 데이터로 기본 보고서 업데이트
          return {
            ...basicReport,
            monthlyOverview: apiResponse.monthlyOverview || basicReport.monthlyOverview,
            insights: apiResponse.insights || basicReport.insights,
            longTermRecommendations: apiResponse.longTermRecommendations || basicReport.longTermRecommendations,
            monthlyTheme: apiResponse.monthlyTheme || basicReport.monthlyTheme,
            nextMonthFocus: apiResponse.nextMonthFocus || basicReport.nextMonthFocus,
            schedulePatternInsights: apiResponse.schedulePatternInsights || basicReport.schedulePatternInsights,
            isAIGenerated: true
          };
        } else {
          // API 오류 시 기본 보고서 반환
          console.warn('AI API 오류:', apiResponse.message);
          return {
            ...basicReport,
            insights: `${basicReport.insights} (AI 분석 중 오류: ${apiResponse.message})`,
            isAIGenerated: false
          };
        }
      } catch (error) {
        console.error("DeepSeek API 처리 오류:", error);
        return {
          ...basicReport,
          insights: `${basicReport.insights} (AI 처리 중 오류가 발생했습니다)`,
          isAIGenerated: false
        };
      }
    }
    
    // API 키가 없는 경우 기본 보고서 반환
    console.warn('API 키가 설정되지 않았습니다. 기본 피드백으로 대체합니다.');
    return {
      ...basicReport,
      insights: `${basicReport.insights} (AI 분석을 위한 API 키가 설정되지 않았습니다)`,
      isAIGenerated: false
    };
    
  } catch (error) {
    console.error("AI 월간 피드백 생성 오류:", error);
    // 오류 발생 시 기본 피드백으로 대체
    const basicReport = await generateBasicMonthlyFeedback(date, schedules, tasks, studySessions, monthlyStats);
    return {
      ...basicReport,
      insights: "AI 분석 중 오류가 발생하여 기본 분석 결과를 제공합니다.",
      isAIGenerated: false
    };
  }
};

// 통합 피드백 생성 함수 - 타입과 AI 사용 여부에 따라 적절한 함수 호출
// 2. AIFeedbackService.js의 generateFeedback 함수 수정

// 통합 피드백 생성 함수 수정 - 목표 데이터 추가
const generateFeedback = async (date, reportType, schedules, tasks, studySessions, stats = null, useAI = false, goalTargets = []) => {
  try {
    // 리포트 타입에 따라 적절한 기본 함수 호출
    let report;
    if (reportType === "daily") {
      // 일간 리포트는 goalTargets 전달 (수정된 부분)
      report = await generateDailyFeedback(date, schedules, tasks, studySessions, goalTargets);
    } else if (reportType === "weekly") {
      // 기본 주간 리포트 생성
      report = await generateBasicWeeklyFeedback(date, schedules, tasks, studySessions, stats);
      
      // useAI가 true인 경우 AI 리포트 추가 데이터 생성 (실제 API 호출은 프리미엄 사용자만)
      if (useAI) {
        try {
          // 주간 분석에도 목표 데이터 전달 (목표 기반 인사이트를 위해)
          const aiReport = await generateAIWeeklyFeedback(date, schedules, tasks, studySessions, stats, goalTargets);
          report = {
            ...report,
            insights: aiReport.insights,
            recommendations: aiReport.recommendations,
            weeklyTheme: aiReport.weeklyTheme,
            focusAdvice: aiReport.focusAdvice,
            scheduleInsights: aiReport.scheduleInsights,
            isAIGenerated: aiReport.isAIGenerated
          };
        } catch (e) {
          console.error("AI 주간 리포트 생성 오류:", e);
          // 오류 발생 시 기본 리포트 유지
        }
      }
    } else if (reportType === "monthly") {
      // 기본 월간 리포트 생성
      report = await generateBasicMonthlyFeedback(date, schedules, tasks, studySessions, stats);
      
      // useAI가 true인 경우 AI 리포트 추가 데이터 생성 (실제 API 호출은 프리미엄 사용자만)
      if (useAI) {
        try {
          // 월간 분석에도 목표 데이터 전달
          const aiReport = await generateAIMonthlyFeedback(date, schedules, tasks, studySessions, stats, goalTargets);
          report = {
            ...report,
            monthlyOverview: aiReport.monthlyOverview,
            insights: aiReport.insights,
            longTermRecommendations: aiReport.longTermRecommendations,
            monthlyTheme: aiReport.monthlyTheme,
            nextMonthFocus: aiReport.nextMonthFocus,
            schedulePatternInsights: aiReport.schedulePatternInsights,
            isAIGenerated: aiReport.isAIGenerated
          };
        } catch (e) {
          console.error("AI 월간 리포트 생성 오류:", e);
          // 오류 발생 시 기본 리포트 유지
        }
      }
    } else {
      throw new Error(`지원하지 않는 리포트 타입: ${reportType}`);
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

// 자동 리포트 생성 스케줄링 설정 (프리미엄 사용자용)
const scheduleAutomaticReports = async (isPremiumUser = false) => {
  if (!isPremiumUser) {
    console.log('무료 사용자는 자동 리포트 생성이 제공되지 않습니다.');
    return false;
  }

  try {
    // 기존 알림 취소
    await cancelAllNotifications();
    
    // 1. 주간 리포트 스케줄링 (매주 일요일 밤 10시)
    const weeklyTrigger = {
      weekday: 7, // 일요일
      hour: 22, // 밤 10시
      minute: 0,
      repeats: true
    };
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-report-generation',
      content: {
        title: '주간 리포트 생성 완료',
        body: '이번 주 활동에 대한 AI 분석 리포트가 준비되었습니다.',
        data: { reportType: 'weekly' }
      },
      trigger: weeklyTrigger
    });
    
    // 2. 월간 리포트 스케줄링 (매월 마지막 날 밤 10시)
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const monthlyTrigger = {
      hour: 22, // 밤 10시
      minute: 0,
      day: lastDayOfMonth, // 매월 마지막 날
      repeats: true
    };
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'monthly-report-generation',
      content: {
        title: '월간 리포트 생성 완료',
        body: '이번 달 활동에 대한 AI 분석 리포트가 준비되었습니다.',
        data: { reportType: 'monthly' }
      },
      trigger: monthlyTrigger
    });
    
    console.log('자동 리포트 생성 스케줄링 완료');
    return true;
  } catch (error) {
    console.error('자동 리포트 스케줄링 오류:', error);
    return false;
  }
};

// 알림 핸들러 등록 (앱 시작 시 호출 필요)
const registerReportNotificationHandler = (generateAIFeedback) => {
    // 알림 응답 핸들러 설정
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { reportType } = notification.request.content.data;
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // 해당 유형의 리포트 자동 생성
        try {
          await generateAIFeedback(today, reportType);
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

  // 프리미엄 상태 변경 처리 함수
const handlePremiumStatusChange = async (isPremiumUser) => {
    if (isPremiumUser) {
      return await scheduleAutomaticReports(true);
    } else {
      // 무료 사용자의 경우 예약된 리포트 생성 취소
      await cancelAllNotifications();
      return true;
    }
  };
  
  // 모든 함수를 명시적으로 내보내기
  export {
    generateFeedback,
    registerReportNotificationHandler,
    scheduleAutomaticReports,
    handlePremiumStatusChange as updateReportScheduling // 함수 이름 변경하여 내보내기
  };


const AIFeedbackScreen = ({ navigation }) => {
  const {
    schedules,
    tasks,
    aiReports,
    generateAIFeedback,
    selectedDate,
    setSelectedDate,
    studySessions,
    isPremiumUser = false,
    goalTargets, // 목표 데이터 추가
    getCurrentGoals, // 목표 가져오기 함수 추가
  } = usePlanner();

  const [activeTab, setActiveTab] = useState("daily"); // 'daily', 'weekly', 'monthly'
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const autoRefreshTimer = useRef(null);

  // D-Day 계산 함수 추가
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

  // 목표 섹션 렌더링 컴포넌트 추가
  const GoalSection = () => {
    const currentGoals = getCurrentGoals();

    if (!currentGoals || currentGoals.length === 0) {
      return null;
    }

    return (
      <View style={styles.goalSectionCard}>
        <Text style={styles.goalSectionTitle}>D-Day 현황</Text>

        {currentGoals.map((goal) => {
          const dDay = calculateDDay(goal.targetDate);
          const isUpcoming = new Date(goal.targetDate) >= new Date();

          return (
            <View key={goal.id} style={styles.goalItem}>
              <View style={styles.goalItemHeader}>
                <Text
                  style={[
                    styles.dDayBadge,
                    isUpcoming ? styles.upcomingDDay : styles.passedDDay,
                  ]}
                >
                  {dDay}
                </Text>
                <Text style={styles.goalItemDate}>
                  {format(new Date(goal.targetDate), "yyyy년 MM월 dd일")}
                </Text>
              </View>
              <Text style={styles.goalItemTitle}>{goal.title}</Text>

              {activeTab === "daily" && isUpcoming && (
                <View style={styles.goalProgressContainer}>
                  <Text style={styles.goalProgressText}>
                    {dDay === "D-Day"
                      ? "오늘이 바로 그날입니다!"
                      : `목표일까지 ${dDay.substring(2)}일 남았습니다.`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // 앱 시작 시 자동 리포트 스케줄링 설정
  useEffect(() => {
    const setupAutomaticReports = async () => {
      await updateReportScheduling(isPremiumUser);
    };

    setupAutomaticReports();
  }, [isPremiumUser]);

  // 현재 날짜 기준 데이터 로드
  useEffect(() => {
    loadReportData();

    // 자동 리프레시 타이머 설정
    setupAutoRefresh();

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (autoRefreshTimer.current) {
        clearTimeout(autoRefreshTimer.current);
      }
    };
  }, [selectedDate, activeTab]);

  // 자동 리프레시 타이머 설정
  const setupAutoRefresh = () => {
    // 기존 타이머 정리
    if (autoRefreshTimer.current) {
      clearTimeout(autoRefreshTimer.current);
    }

    // 각 리포트 유형에 따른 갱신 주기 설정 (ms)
    const refreshIntervals = {
      daily: 5 * 60 * 1000, // 5분
      weekly: 24 * 60 * 60 * 1000, // 1일
      monthly: 7 * 24 * 60 * 60 * 1000, // 1주
    };

    // 현재 탭에 맞는 타이머 설정
    autoRefreshTimer.current = setTimeout(() => {
      console.log(`${activeTab} 리포트 자동 갱신`);
      handleGenerateFeedback(false); // 자동 갱신은 항상 기본 분석 사용
    }, refreshIntervals[activeTab]);
  };

  // 데이터 로드 함수
  const loadReportData = async () => {
    setIsLoading(true);

    try {
      // 현재 탭에 해당하는 리포트 가져오기
      let report = null;

      if (aiReports && Object.keys(aiReports).length > 0) {
        if (activeTab === "daily") {
          report = aiReports[selectedDate];
        } else if (activeTab === "weekly") {
          // 현재 날짜가 포함된 주의 주간 리포트
          const weekKey = `week-${format(
            new Date(selectedDate),
            "yyyy-MM-dd"
          )}`;
          report = aiReports[weekKey];
        } else if (activeTab === "monthly") {
          // 현재 날짜가 포함된 월의 월간 리포트
          const monthKey = `month-${format(new Date(selectedDate), "yyyy-MM")}`;
          report = aiReports[monthKey];
        }
      }

      // 리포트가 없는 경우 자동 생성
      if (!report) {
        await handleGenerateFeedback(false);
      } else {
        setCurrentReport(report);
      }
    } catch (error) {
      console.error("리포트 데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 피드백 생성 요청
  const handleGenerateFeedback = async (useAI = false) => {
    // 유료 기능 제한 확인 (더 이상 Alert를 사용하지 않음)
    // 모든 리포트 타입에 대해 generateAIFeedback 함수 호출을 허용
    // isPremiumUser 값은 내부에서 참조하여 적절한 형태의 리포트를 생성

    setIsLoading(true);
    try {
      const report = await generateAIFeedback(
        selectedDate,
        activeTab,
        useAI && isPremiumUser, // 프리미엄 사용자만 AI 분석 적용
        isPremiumUser
      );
      if (report) {
        setCurrentReport(report);

        // 자동 갱신 타이머 재설정
        setupAutoRefresh();
      }
    } catch (error) {
      console.error("리포트 생성 오류:", error);
      Alert.alert(
        "오류 발생",
        "리포트 생성 중 문제가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 업그레이드 화면으로 이동하는 함수
  const handleUpgrade = () => {
    // 실제 네비게이션은 구현에 따라 조정 필요
    navigation.navigate("Subscription");
  };

  // 탭 변경 핸들러
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // 카테고리별 색상 지정 함수
  const getCategoryColor = (category) => {
    // 카테고리에 따라 다른 색상 반환
    const colors = {
      수학: "#4285F4",
      국어: "#EA4335",
      영어: "#FBBC05",
      과학: "#34A853",
      사회: "#8D6E63",
      프로그래밍: "#9C27B0",
      음악: "#FF5722",
      미술: "#795548",
      체육: "#607D8B",
      업무: "#3F51B5",
      회의: "#009688",
      자기계발: "#FF9800",
      취미: "#E91E63",
      독서: "#673AB7",
      운동: "#2196F3",
      휴식: "#4CAF50",
      공부시간: "#50cebb",
      미지정: "#9E9E9E",
    };

    return colors[category] || "#50cebb"; // 기본 색상
  };

  // 일정 유형별 색상 지정 함수
  const getScheduleTypeColor = (type) => {
    const colors = {
      업무: "#4285F4",
      학습: "#34A853",
      회의: "#FBBC05",
      개인: "#EA4335",
      기타: "#9E9E9E",
    };
    return colors[type] || "#9E9E9E";
  };

  // 시간대별 색상 지정 함수
  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      "오전(6-12시)": "#4285F4",
      "오후(12-18시)": "#34A853",
      "저녁(18-24시)": "#FBBC05",
      "야간(0-6시)": "#EA4335",
    };
    return colors[timeSlot] || "#9E9E9E";
  };

  // 주간 리포트 추가 섹션 렌더링
  const renderWeeklyExtraContent = () => {
    if (activeTab !== "weekly" || !currentReport) {
      return null;
    }

    return (
      <View style={styles.weeklyExtraContainer}>
        {/* 학습 시간 차트 추가 */}
        {currentReport.dailyStudyTime && (
          <WeeklyStudyChart dailyStudyTime={currentReport.dailyStudyTime} />
        )}

        {/* 주간 테마 섹션 - 프리미엄 미리보기 방식 적용 */}
        <View style={styles.themeCard}>
          <View style={styles.themeHeader}>
            <Ionicons name="flash" size={20} color="#FF9500" />
            <Text style={styles.themeTitle}>이번 주 테마</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser ? (
            <>
              <Text style={styles.themeText}>
                "{currentReport.weeklyTheme || "데이터 분석 중..."}"
              </Text>
              <View style={styles.focusSection}>
                <Text style={styles.focusTitle}>다음 주 집중 영역</Text>
                <Text style={styles.focusText}>
                  {currentReport.focusAdvice ||
                    "충분한 데이터가 쌓이면 제안해 드릴게요."}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={2}>
                AI가 당신의 학습 패턴을 분석하여 이번 주의 특징과 테마를
                도출합니다. 앞으로의 집중 영역도 추천해 드립니다.
              </Text>
              <View style={styles.previewOverlay}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 확인하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 일정 인사이트 섹션 - 프리미엄 미리보기 방식 적용 */}
        <View style={styles.scheduleInsightsCard}>
          <View style={styles.scheduleInsightsHeader}>
            <Ionicons name="calendar" size={20} color="#4285F4" />
            <Text style={styles.scheduleInsightsTitle}>일정 인사이트</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser ? (
            <>
              <Text style={styles.scheduleInsightsText}>
                {currentReport.scheduleInsights ||
                  "데이터를 분석하고 있습니다..."}
              </Text>

              {/* 일정 유형 분포 표시 */}
              {currentReport.scheduleTypeCount && (
                <View style={styles.scheduleTypesContainer}>
                  <Text style={styles.scheduleTypesTitle}>일정 유형 분포</Text>
                  <View style={styles.scheduleTypesChart}>
                    {Object.entries(currentReport.scheduleTypeCount)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => {
                        const percentage = Math.round(
                          (count /
                            Object.values(
                              currentReport.scheduleTypeCount
                            ).reduce((sum, val) => sum + val, 0)) *
                            100
                        );
                        return (
                          <View key={type} style={styles.scheduleTypeItem}>
                            <View style={styles.scheduleTypeHeader}>
                              <Text style={styles.scheduleTypeName}>
                                {type}
                              </Text>
                              <Text style={styles.scheduleTypeCount}>
                                {count}개
                              </Text>
                            </View>
                            <View style={styles.scheduleTypeBarContainer}>
                              <View
                                style={[
                                  styles.scheduleTypeBar,
                                  {
                                    width: `${percentage}%`,
                                    backgroundColor: getScheduleTypeColor(type),
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={3}>
                AI가 당신의 일정 패턴을 분석하여 생산성을 높일 수 있는 맞춤형
                인사이트를 제공합니다. 일정 유형별 분포와 균형에 대한 조언도
                확인하세요.
              </Text>
              <View style={styles.previewOverlay}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 확인하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 월간 리포트 추가 섹션 렌더링
  const renderMonthlyExtraContent = () => {
    if (activeTab !== "monthly" || !currentReport) {
      return null;
    }

    return (
      <View style={styles.monthlyExtraContainer}>
        {/* 과목별 학습 시간 차트 추가 */}
        {currentReport.subjectAnalysis && (
          <MonthlySubjectChart
            subjectAnalysis={currentReport.subjectAnalysis}
          />
        )}

        {/* 월간 개요 - 프리미엄 미리보기 방식 적용 */}
        <View style={styles.overviewCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.overviewTitle}>월간 개요</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser ? (
            <Text style={styles.overviewText}>
              {currentReport.monthlyOverview ||
                "이번 달 활동 데이터를 분석했습니다."}
            </Text>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={2}>
                AI가 이번 달 활동을 종합적으로 분석하여 패턴, 장단점, 시간
                활용에 대한 전체적인 개요를 제공합니다.
              </Text>
              <View style={styles.previewOverlay}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 확인하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 월간 테마 - 프리미엄 기능 미리보기 */}
        <View style={styles.themeCard}>
          <View style={styles.themeHeader}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.themeTitle}>이번 달 테마</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser ? (
            <>
              <Text style={styles.themeText}>
                "{currentReport.monthlyTheme || "데이터 분석 중..."}"
              </Text>
              <View style={styles.focusSection}>
                <Text style={styles.focusTitle}>다음 달 집중 포인트</Text>
                <Text style={styles.focusText}>
                  {currentReport.nextMonthFocus ||
                    "충분한 데이터가 쌓이면 제안해 드릴게요."}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={2}>
                AI가 당신의 월간 활동 데이터를 종합하여 특별한 테마를 도출하고,
                다음 달을 위한 핵심 집중 영역을 제안합니다.
              </Text>
              <View style={styles.previewOverlay}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 확인하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 생산성 점수 - 프리미엄 기능 미리보기 */}
        <View style={styles.scoreCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.scoreTitle}>생산성 점수</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser && currentReport.productivityScore ? (
            <>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>
                  {currentReport.productivityScore}
                </Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.scoreBarContainer}>
                <View
                  style={[
                    styles.scoreBar,
                    { width: `${currentReport.productivityScore}%` },
                  ]}
                />
              </View>
            </>
          ) : (
            <View style={styles.premiumScorePreview}>
              <Ionicons name="analytics" size={32} color="#FFB74D" />
              <Text style={styles.premiumScoreText}>
                AI가 당신의 월간 활동을 종합 평가하여 100점 만점의 생산성 점수를
                제공합니다
              </Text>
              <TouchableOpacity
                style={styles.upgradeButtonSmall}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonTextSmall}>
                  프리미엄으로 확인하기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 일정 패턴 인사이트 섹션 - 프리미엄 기능 미리보기 */}
        <View style={styles.schedulePatternCard}>
          <View style={styles.schedulePatternHeader}>
            <Ionicons name="analytics" size={20} color="#34A853" />
            <Text style={styles.schedulePatternTitle}>일정 패턴 분석</Text>
            {!isPremiumUser && (
              <View style={styles.premiumFeatureBadge}>
                <Text style={styles.premiumFeatureText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {isPremiumUser ? (
            <>
              <Text style={styles.schedulePatternText}>
                {currentReport.schedulePatternInsights ||
                  "데이터를 분석하고 있습니다..."}
              </Text>

              {/* 요일별 일정 분포 - 프리미엄 기능 */}
              {currentReport.schedulesByDay &&
                typeof currentReport.schedulesByDay === "object" &&
                Object.keys(currentReport.schedulesByDay).length > 0 && (
                  <View style={styles.dayDistributionContainer}>
                    <Text style={styles.dayDistributionTitle}>
                      요일별 일정 분포
                    </Text>
                    <View style={styles.dayDistributionChart}>
                      {["월", "화", "수", "목", "금", "토", "일"].map((day) => {
                        const count = currentReport.schedulesByDay[day] || 0;
                        const maxCount = Math.max(
                          ...Object.values(currentReport.schedulesByDay).map(
                            (v) => v || 0
                          )
                        );
                        const percentage =
                          maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                          <View key={day} style={styles.dayColumn}>
                            <View style={styles.dayBarContainer}>
                              <View
                                style={[
                                  styles.dayBar,
                                  { height: `${percentage}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.dayLabel}>{day}</Text>
                            <Text style={styles.dayCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

              {/* 시간대별 일정 분포 - 프리미엄 기능 */}
              {currentReport.schedulesByTimeSlot &&
                typeof currentReport.schedulesByTimeSlot === "object" &&
                Object.keys(currentReport.schedulesByTimeSlot).length > 0 && (
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.timeSlotTitle}>시간대별 일정 분포</Text>
                    <View style={styles.timeSlotChart}>
                      {Object.entries(currentReport.schedulesByTimeSlot).map(
                        ([timeSlot, count]) => {
                          const total = Object.values(
                            currentReport.schedulesByTimeSlot
                          ).reduce((sum, val) => sum + (val || 0), 0);
                          const percentage =
                            total > 0 ? Math.round((count / total) * 100) : 0;

                          return (
                            <View key={timeSlot} style={styles.timeSlotItem}>
                              <View style={styles.timeSlotHeader}>
                                <Text style={styles.timeSlotName}>
                                  {timeSlot}
                                </Text>
                                <Text style={styles.timeSlotCount}>
                                  {`${count || 0}개 (${percentage || 0}%)`}
                                </Text>
                              </View>
                              <View style={styles.timeSlotBarContainer}>
                                <View
                                  style={[
                                    styles.timeSlotBar,
                                    {
                                      width: `${percentage}%`,
                                      backgroundColor:
                                        getTimeSlotColor(timeSlot),
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>
                )}
            </>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={3}>
                AI가 당신의 일정 패턴을 심층 분석하여 요일별, 시간대별 생산성
                패턴과 최적의 일정 배치를 제안합니다. 생산성을 극대화할 수 있는
                맞춤형 인사이트를 확인하세요.
              </Text>
              <View style={styles.previewOverlay}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 확인하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.activityRatioCard}>
          <Text style={styles.activityRatioTitle}>월간 활동 통계</Text>
          <View style={styles.activityStats}>
            <View style={styles.activityStatItem}>
              <Text style={styles.activityStatValue}>
                {currentReport.daysWithStudy || 0}일
              </Text>
              <Text style={styles.activityStatLabel}>활동일</Text>
            </View>
            <View style={styles.activityStatItem}>
              <Text style={styles.activityStatValue}>
                {currentReport.activityRatio || 0}%
              </Text>
              <Text style={styles.activityStatLabel}>활동 비율</Text>
            </View>
            <View style={styles.activityStatItem}>
              <Text style={styles.activityStatValue}>
                {currentReport.avgDailyHours || 0}시간
              </Text>
              <Text style={styles.activityStatLabel}>일평균</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // 리포트 렌더링
  const renderReport = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#50cebb" />
          <Text style={styles.loadingText}>데이터를 분석하고 있습니다...</Text>
        </View>
      );
    }

    if (!currentReport) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color="#aaa" />
          <Text style={styles.emptyText}>아직 생성된 리포트가 없습니다.</Text>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => handleGenerateFeedback(false)}
          >
            <Text style={styles.generateButtonText}>리포트 생성하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.reportContainer}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>
            {activeTab === "daily"
              ? "일간 리포트"
              : activeTab === "weekly"
              ? "주간 리포트"
              : "월간 리포트"}
          </Text>
          <Text style={styles.reportDate}>
            {activeTab === "daily"
              ? format(new Date(selectedDate), "yyyy년 MM월 dd일")
              : activeTab === "weekly"
              ? `${format(
                  sub(new Date(selectedDate), {
                    days: new Date(selectedDate).getDay(),
                  }),
                  "MM/dd"
                )} ~ ${format(
                  sub(new Date(selectedDate), {
                    days: new Date(selectedDate).getDay() - 6,
                  }),
                  "MM/dd"
                )}`
              : format(new Date(selectedDate), "yyyy년 MM월")}
          </Text>

          {/* AI 생성 배지 추가 */}
          {currentReport && currentReport.isAIGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI 분석</Text>
            </View>
          )}
        </View>

        {/* 일간 리포트에 시간별 학습 차트 추가 */}
        {activeTab === "daily" && (
          <>
            <DailyStudyChart studySessions={studySessions[selectedDate]} />
            <GoalSection />
          </>
        )}

        {/* 주간 리포트 추가 컨텐츠 */}
        {renderWeeklyExtraContent()}

        {/* 월간 리포트 추가 컨텐츠 */}
        {renderMonthlyExtraContent()}

        {/* 인사이트 섹션 - AI 분석 인사이트 미리보기 */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>인사이트</Text>
            {!isPremiumUser &&
              (activeTab === "weekly" || activeTab === "monthly") && (
                <View style={styles.premiumBadgeSmall}>
                  <Text style={styles.premiumBadgeTextSmall}>AI 분석 가능</Text>
                </View>
              )}
          </View>

          <Text style={styles.insightText}>
            {currentReport.insights || "데이터 분석 중..."}
          </Text>

          {/* 프리미엄 사용자가 아니고, 주간/월간 리포트인 경우 AI 분석 버튼 표시 */}
          {!isPremiumUser &&
            (activeTab === "weekly" || activeTab === "monthly") && (
              <TouchableOpacity
                style={styles.aiAnalysisButton}
                onPress={handleUpgrade}
              >
                <Ionicons name="flash" size={16} color="#fff" />
                <Text style={styles.aiAnalysisButtonText}>
                  AI 심층 분석 활성화
                </Text>
              </TouchableOpacity>
            )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>주요 통계</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentReport.completionRate || "0"}%
              </Text>
              <Text style={styles.statLabel}>일정 완료율</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentReport.totalHours || "0"}시간
              </Text>
              <Text style={styles.statLabel}>총 활동시간</Text>
            </View>
            {activeTab === "daily" ? (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {currentReport.mostProductiveTime || "N/A"}
                </Text>
                <Text style={styles.statLabel}>생산성 높은 시간</Text>
              </View>
            ) : activeTab === "weekly" ? (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {currentReport.mostProductiveDay
                    ? format(new Date(currentReport.mostProductiveDay), "EEE", {
                        locale: ko,
                      })
                    : "N/A"}
                </Text>
                <Text style={styles.statLabel}>최고 생산성 날짜</Text>
              </View>
            ) : (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {currentReport.avgDailyHours || "0"}시간
                </Text>
                <Text style={styles.statLabel}>일평균 활동시간</Text>
              </View>
            )}
          </View>
        </View>

        {/* 카테고리별 분석 - 모든 리포트 타입에 표시 */}
        {currentReport.subjectAnalysis &&
          Object.keys(currentReport.subjectAnalysis).length > 0 && (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>카테고리별 분석</Text>
              <View style={styles.categoryList}>
                {Object.entries(currentReport.subjectAnalysis)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, seconds]) => {
                    const hours = Math.round((seconds / 3600) * 10) / 10;
                    const totalSeconds = Object.values(
                      currentReport.subjectAnalysis
                    ).reduce((sum, val) => sum + val, 0);
                    const percentage =
                      totalSeconds > 0
                        ? Math.round((seconds / totalSeconds) * 100)
                        : 0;

                    return (
                      <View key={category} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{category}</Text>
                          <Text style={styles.categoryTime}>{hours}시간</Text>
                        </View>
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${percentage}%`,
                                backgroundColor: getCategoryColor(category),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>
          )}

        {/* 주간 리포트에만 표시될 일별 진행 상황 */}
        {activeTab === "weekly" && currentReport.dailyCompletionRate && (
          <View style={styles.weeklyProgressCard}>
            <Text style={styles.weeklyProgressTitle}>일별 진행 상황</Text>
            <View style={styles.weeklyChart}>
              {Object.entries(currentReport.dailyCompletionRate)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([date, rate]) => {
                  const dayName = format(new Date(date), "EEE", { locale: ko });
                  return (
                    <View key={date} style={styles.weeklyChartItem}>
                      <Text style={styles.weeklyChartDay}>{dayName}</Text>
                      <View style={styles.weeklyChartBarContainer}>
                        <View
                          style={[
                            styles.weeklyChartBar,
                            { height: `${rate}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklyChartValue}>{rate}%</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* 개선 제안 섹션 - 프리미엄 미리보기 */}
        <View style={styles.recommendationCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.recommendationTitle}>
              {activeTab === "monthly" ? "장기적 개선 방향" : "개선 제안"}
            </Text>
            {!isPremiumUser &&
              (activeTab === "weekly" || activeTab === "monthly") && (
                <View style={styles.premiumFeatureBadge}>
                  <Text style={styles.premiumFeatureText}>AI 강화</Text>
                </View>
              )}
          </View>

          <Text style={styles.recommendationText}>
            {activeTab === "monthly"
              ? currentReport.longTermRecommendations ||
                "충분한 데이터가 쌓이면 제안을 드릴게요."
              : currentReport.recommendations ||
                "충분한 데이터가 쌓이면 제안을 드릴게요."}
          </Text>

          {/* 프리미엄이 아니면서 주간/월간 리포트인 경우 AI 강화 버튼 추가 */}
          {!isPremiumUser &&
            (activeTab === "weekly" || activeTab === "monthly") && (
              <TouchableOpacity
                style={styles.upgradeButtonOutline}
                onPress={handleUpgrade}
              >
                <Ionicons name="star" size={16} color="#FFB74D" />
                <Text style={styles.upgradeButtonTextOutline}>
                  AI 강화 인사이트 활성화
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {/* 일간 리포트에만 새로고침 버튼 표시 */}
        {activeTab === "daily" && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => handleGenerateFeedback(false)}
          >
            <Text style={styles.refreshButtonText}>리포트 새로고침</Text>
          </TouchableOpacity>
        )}

        {/* 주간/월간 리포트에는 AI 분석 버튼 표시 (프리미엄) */}
        {(activeTab === "weekly" || activeTab === "monthly") && (
          <TouchableOpacity
            style={[styles.aiButton, !isPremiumUser && styles.aiButtonDisabled]}
            onPress={() =>
              isPremiumUser ? handleGenerateFeedback(true) : handleUpgrade()
            }
          >
            <Ionicons
              name={isPremiumUser ? "flash" : "lock-closed"}
              size={18}
              color="#fff"
            />
            <Text style={styles.aiButtonText}>
              {isPremiumUser
                ? "AI 심층 분석 실행"
                : "프리미엄으로 AI 분석 활성화"}
            </Text>
          </TouchableOpacity>
        )}

        {/* 자동 갱신 정보 표시 */}
        <Text style={styles.autoUpdateInfo}>
          {activeTab === "daily"
            ? "일간 리포트는 5분마다 자동으로 갱신됩니다."
            : activeTab === "weekly"
            ? "주간 리포트는 하루마다 자동으로 갱신됩니다."
            : "월간 리포트는 일주일마다 자동으로 갱신됩니다."}
        </Text>

        {/* 하단 여백 추가 */}
        <View style={styles.bottomSpacer} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>데이터 리포트</Text>
        {isPremiumUser ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeProBadge}
            onPress={handleUpgrade}
          >
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.upgradeProText}>업그레이드</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "daily" && styles.activeTab]}
          onPress={() => handleTabChange("daily")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "daily" && styles.activeTabText,
            ]}
          >
            일간
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "weekly" && styles.activeTab]}
          onPress={() => handleTabChange("weekly")}
        >
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabText,
                activeTab === "weekly" && styles.activeTabText,
              ]}
            >
              주간
            </Text>
            {!isPremiumUser && (
              <Ionicons name="star" size={12} color="#FFB74D" />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "monthly" && styles.activeTab]}
          onPress={() => handleTabChange("monthly")}
        >
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabText,
                activeTab === "monthly" && styles.activeTabText,
              ]}
            >
              월간
            </Text>
            {!isPremiumUser && (
              <Ionicons name="star" size={12} color="#FFB74D" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderReport()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#50cebb",
  },
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: "#50cebb",
    fontWeight: "bold",
  },
  tabLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40, // 하단 여백 추가로 스크롤 문제 해결
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: "#50cebb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  premiumBadge: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  premiumBadgeSmall: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "center",
  },
  premiumBadgeTextSmall: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 8,
  },
  reportContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
    position: "relative",
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  reportDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  // 인사이트 카드 및 헤더
  insightCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  // AI 분석 버튼
  aiAnalysisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: "center",
    gap: 6,
  },
  aiAnalysisButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#50cebb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  // 공통 섹션 헤더 스타일
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recommendationCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
    marginBottom: 8,
  },
  // 카테고리별 분석 스타일
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  categoryTime: {
    fontSize: 14,
    color: "#666",
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#50cebb",
  },

  // 주간 차트 스타일
  weeklyProgressCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  weeklyProgressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: 16,
  },
  weeklyChartItem: {
    flex: 1,
    alignItems: "center",
  },
  weeklyChartDay: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  weeklyChartBarContainer: {
    width: 24,
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  weeklyChartBar: {
    width: "100%",
    backgroundColor: "#50cebb",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weeklyChartValue: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },

  // 새로고침 버튼
  refreshButton: {
    backgroundColor: "#50cebb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // AI 분석 버튼
  aiButton: {
    flexDirection: "row",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  aiButtonDisabled: {
    backgroundColor: "#9BB1DB",
  },
  aiButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // 주간 리포트 추가 컨텐츠
  weeklyExtraContainer: {
    marginBottom: 16,
  },

  // 테마 카드 (주간/월간)
  themeCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB74D",
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  themeText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
  },
  focusSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  focusText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  // 월간 리포트 추가 컨텐츠
  monthlyExtraContainer: {
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },

  // 생산성 점수 카드
  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginVertical: 16,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#50cebb",
  },
  scoreMax: {
    fontSize: 20,
    color: "#999",
    marginLeft: 4,
  },
  scoreBarContainer: {
    width: "100%",
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  scoreBar: {
    height: "100%",
    backgroundColor: "#50cebb",
  },
  // 프리미엄 점수 미리보기
  premiumScorePreview: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  premiumScoreText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  // 월간 활동 비율 카드
  activityRatioCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  activityRatioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityStatItem: {
    flex: 1,
    alignItems: "center",
  },
  activityStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#50cebb",
    marginBottom: 4,
  },
  activityStatLabel: {
    fontSize: 12,
    color: "#666",
  },

  // 일정 인사이트 카드 (주간)
  scheduleInsightsCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#4285F4",
  },
  scheduleInsightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleInsightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  scheduleInsightsText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 16,
  },
  scheduleTypesContainer: {
    marginTop: 8,
  },
  scheduleTypesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  scheduleTypesChart: {
    marginTop: 4,
  },
  scheduleTypeItem: {
    marginBottom: 12,
  },
  scheduleTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  scheduleTypeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
  },
  scheduleTypeCount: {
    fontSize: 13,
    color: "#666",
  },
  scheduleTypeBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  scheduleTypeBar: {
    height: "100%",
    backgroundColor: "#4285F4",
  },

  // 일정 패턴 카드 (월간)
  schedulePatternCard: {
    backgroundColor: "#f9fff0",
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#34A853",
  },
  schedulePatternHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  schedulePatternTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  schedulePatternText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 16,
  },

  // 요일별 분포
  dayDistributionContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  dayDistributionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  dayDistributionChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  dayBarContainer: {
    width: 20,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  dayBar: {
    width: "100%",
    backgroundColor: "#34A853",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  dayCount: {
    fontSize: 10,
    color: "#666",
  },

  // 시간대별 분포
  timeSlotContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  timeSlotChart: {
    marginTop: 4,
  },
  timeSlotItem: {
    marginBottom: 12,
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  timeSlotName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
  },
  timeSlotCount: {
    fontSize: 13,
    color: "#666",
  },
  timeSlotBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeSlotBar: {
    height: "100%",
    backgroundColor: "#FBBC05",
  },

  // 자주 반복되는 일정
  frequentTasksContainer: {
    marginTop: 8,
  },
  frequentTasksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  frequentTasksList: {
    marginTop: 4,
  },
  frequentTaskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    marginBottom: 8,
  },
  frequentTaskName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  frequentTaskCountContainer: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequentTaskCount: {
    fontSize: 12,
    color: "#34A853",
    fontWeight: "600",
  },

  aiBadge: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    position: "absolute",
    right: 0,
    top: 0,
  },
  aiBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },

  // 프리미엄 기능 배지
  premiumFeatureBadge: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  premiumFeatureText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },

  // 자동 갱신 정보
  autoUpdateInfo: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 8,
  },

  // 하단 여백을 위한 빈 공간
  bottomSpacer: {
    height: 40,
  },

  goalSectionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  goalItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  goalItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dDayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  upcomingDDay: {
    backgroundColor: "#FFE3AA",
    color: "#FF9F1C",
  },
  passedDDay: {
    backgroundColor: "#E9ECEF",
    color: "#868E96",
  },
  goalItemDate: {
    fontSize: 12,
    color: "#868E96",
  },
  goalItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  goalProgressContainer: {
    marginTop: 4,
    backgroundColor: "#F1F3F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  goalProgressText: {
    fontSize: 12,
    color: "#495057",
  },

  // 프리미엄 기능 미리보기 컨테이너
  premiumPreviewContainer: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFB74D40",
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 100,
  },
  previewText: {
    color: "#666",
    fontSize: 14,
    opacity: 0.7,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeButton: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  upgradeButtonSmall: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  upgradeButtonTextSmall: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  upgradeButtonOutline: {
    borderColor: "#FFB74D",
    borderWidth: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 6,
  },
  upgradeButtonTextOutline: {
    color: "#FFB74D",
    fontWeight: "bold",
    fontSize: 12,
  },

  // 업그레이드 프로 배지
  upgradeProBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFB74D",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradeProText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
});

export default AIFeedbackScreen;
