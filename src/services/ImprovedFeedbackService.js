// src/services/ImprovedFeedbackService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";

// DeepSeek API 설정
const DEEPSEEK_API_KEY = "sk-d2615252b15242ee96fe3686c8ad045a";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 리포트 타입
export const REPORT_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

// 스토리지 키
const STORAGE_KEYS = {
  REPORTS: "@feedback_reports",
  USER_CONTEXT: "@user_context",
  CHAT_HISTORY: "@chat_history",
  ANALYSIS_RESULTS: "@analysis_results",
};

// 스마트 캐시 키
const SMART_CACHE_KEYS = {
  QUESTION_PATTERNS: "@question_patterns_cache",
  FALLBACK_RESPONSES: "@fallback_responses_cache",
  TEMPLATE_LIBRARY: "@template_library_cache",
  USER_QUESTION_HISTORY: "@user_question_history",
};

// ========== 개인화 분석 헬퍼 함수들 ==========

/**
 * 완료율 패턴 분석 (요일별, 시간별)
 */
const analyzeCompletionPatterns = (schedules, tasks) => {
  const patterns = {
    byDay: {}, // 요일별 완료율
    byHour: {}, // 시간별 완료율
    bestDays: [],
    worstDays: [],
    summary: "",
  };

  // 요일별 패턴 분석
  Object.keys(schedules).forEach((dateStr) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayName = ["일", "월", "화", "수", "목", "금", "토"][dayOfWeek];

    const daySchedules = schedules[dateStr] || [];
    const dayTasks = tasks[dateStr] || {};

    const totalTasks = daySchedules.length;
    const completedTasks = daySchedules.filter((s) => dayTasks[s.id]).length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    if (!patterns.byDay[dayName]) {
      patterns.byDay[dayName] = { total: 0, completed: 0, rates: [] };
    }

    patterns.byDay[dayName].total += totalTasks;
    patterns.byDay[dayName].completed += completedTasks;
    patterns.byDay[dayName].rates.push(completionRate);
  });

  // 최고/최저 요일 찾기
  const dayRates = Object.entries(patterns.byDay).map(([day, data]) => ({
    day,
    rate: data.completed / data.total || 0,
  }));

  patterns.bestDays = dayRates
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 2)
    .map((d) => d.day);

  patterns.worstDays = dayRates
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 2)
    .map((d) => d.day);

  patterns.summary = `${patterns.bestDays.join(", ")}에 가장 효율적`;

  return patterns;
};

/**
 * 학습 집중도 패턴 분석
 */
const analyzeFocusPatterns = (studySessions) => {
  if (!studySessions || Object.keys(studySessions).length === 0) {
    return { averageDuration: 0, peakHours: [], patterns: [] };
  }

  const durations = [];
  const hourlyFocus = {};

  Object.values(studySessions).forEach((sessions) => {
    sessions.forEach((session) => {
      if (session.duration) {
        durations.push(session.duration / 60); // 분 단위

        if (session.timestamp) {
          const hour = new Date(session.timestamp).getHours();
          hourlyFocus[hour] = (hourlyFocus[hour] || 0) + session.duration;
        }
      }
    });
  });

  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const peakHours = Object.entries(hourlyFocus)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}시`);

  return {
    averageDuration,
    peakHours,
    patterns: durations.length > 0 ? ["집중형"] : ["분석 필요"],
  };
};

/**
 * 미루는 경향 분석
 */
const analyzeProcrastination = (schedules, tasks) => {
  let totalPlanned = 0;
  let delayedTasks = 0;

  Object.keys(schedules).forEach((dateStr) => {
    const daySchedules = schedules[dateStr] || [];
    const dayTasks = tasks[dateStr] || {};

    daySchedules.forEach((schedule) => {
      totalPlanned++;
      if (!dayTasks[schedule.id]) {
        delayedTasks++;
      }
    });
  });

  const procrastinationRate =
    totalPlanned > 0 ? delayedTasks / totalPlanned : 0;

  if (procrastinationRate > 0.5) return "high";
  if (procrastinationRate > 0.3) return "medium";
  return "low";
};

/**
 * 에너지 레벨 패턴 분석
 */
const analyzeEnergyLevels = (schedules, tasks, studySessions) => {
  const hourlyActivity = {};

  // 스케줄 활동 시간 분석
  Object.values(schedules).forEach((daySchedules) => {
    daySchedules.forEach((schedule) => {
      const hour = parseInt(schedule.startTime.split(":")[0]);
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
  });

  const peakHours = Object.entries(hourlyActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}시`);

  const morningActivity =
    (hourlyActivity[7] || 0) +
    (hourlyActivity[8] || 0) +
    (hourlyActivity[9] || 0);
  const eveningActivity =
    (hourlyActivity[18] || 0) +
    (hourlyActivity[19] || 0) +
    (hourlyActivity[20] || 0);

  let type = "balanced";
  if (morningActivity > eveningActivity * 1.5) type = "morning";
  else if (eveningActivity > morningActivity * 1.5) type = "evening";

  return {
    peakHours,
    type,
    morningActivity,
    eveningActivity,
  };
};

/**
 * 개인화된 인사이트 생성
 */
const generatePersonalizedInsights = (
  completionPatterns,
  focusPatterns,
  procrastination,
  energyPatterns,
  userContext
) => {
  const insights = [];

  if (completionPatterns.bestDays && completionPatterns.bestDays.length > 0) {
    insights.push(
      `${completionPatterns.bestDays.join(", ")}에 가장 생산적이시네요`
    );
  }

  if (focusPatterns.averageDuration > 0) {
    insights.push(`평균 ${focusPatterns.averageDuration}분 집중이 가능하세요`);
  }

  if (procrastination === "low") {
    insights.push("계획 실행력이 우수하세요");
  } else if (procrastination === "high") {
    insights.push("작은 단위로 나누어 시작하는 것을 추천드려요");
  }

  if (energyPatterns.type === "morning") {
    insights.push("오전에 중요한 일을 배치하세요");
  } else if (energyPatterns.type === "evening") {
    insights.push("오후/저녁 시간을 활용하세요");
  }

  return insights;
};

/**
 * 사용자 행동 패턴 종합 분석
 */
const analyzeUserBehaviorPatterns = (plannerData, userContext) => {
  if (!plannerData) return null;

  const { schedules, tasks, studySessions } = plannerData;

  // 완료율 패턴 분석 (요일별, 시간별)
  const completionPatterns = analyzeCompletionPatterns(schedules, tasks);

  // 학습 집중도 패턴 분석
  const focusPatterns = analyzeFocusPatterns(studySessions);

  // 미루는 경향 분석
  const procrastinationTendency = analyzeProcrastination(schedules, tasks);

  // 에너지 레벨 패턴 분석
  const energyPatterns = analyzeEnergyLevels(schedules, tasks, studySessions);

  return {
    completionPatterns,
    focusPatterns,
    procrastinationTendency,
    energyPatterns,
    personalizedInsights: generatePersonalizedInsights(
      completionPatterns,
      focusPatterns,
      procrastinationTendency,
      energyPatterns,
      userContext
    ),
  };
};

// ========== 스마트 캐시 시스템 ==========

/**
 * 질문 유사도 분석 (간단한 키워드 기반)
 */
const calculateQuestionSimilarity = (question1, question2) => {
  if (!question1 || !question2) return 0;

  const extractKeywords = (text) => {
    const keywords = [
      "공부",
      "시험",
      "목표",
      "계획",
      "시간",
      "집중",
      "효율",
      "성과",
      "습관",
      "동기",
      "스트레스",
      "피로",
      "일정",
      "학습",
      "준비",
      "시작",
      "끝",
      "방법",
      "어떻게",
      "언제",
      "왜",
    ];
    return keywords.filter((keyword) => text.includes(keyword));
  };

  const keywords1 = extractKeywords(question1.toLowerCase());
  const keywords2 = extractKeywords(question2.toLowerCase());

  if (keywords1.length === 0 && keywords2.length === 0) return 0;

  const commonKeywords = keywords1.filter((k) => keywords2.includes(k));
  const totalKeywords = [...new Set([...keywords1, ...keywords2])].length;

  return totalKeywords > 0 ? commonKeywords.length / totalKeywords : 0;
};

/**
 * 유사 질문 기반 응답 생성
 */
const generateSimilarResponse = async (currentQuestion, userContext) => {
  try {
    const questionHistory = await AsyncStorage.getItem(
      SMART_CACHE_KEYS.USER_QUESTION_HISTORY
    );
    if (!questionHistory) return null;

    const history = JSON.parse(questionHistory);
    const userName = userContext?.name || "사용자";

    // 가장 유사한 이전 질문 찾기
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const entry of history) {
      const similarity = calculateQuestionSimilarity(
        currentQuestion,
        entry.question
      );
      if (similarity > bestSimilarity && similarity > 0.3) {
        // 30% 이상 유사
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      console.log(
        `✨ 유사 질문 발견! 유사도: ${Math.round(bestSimilarity * 100)}%`
      );

      // 이전 답변을 현재 상황에 맞게 조정
      return {
        analysis: `${userName}님, "${currentQuestion}"에 대해 이전 분석을 참고하면, ${bestMatch.response.analysis}`,
        insights: `유사한 고민에 대한 조언: ${bestMatch.response.insights}`,
        recommendations:
          bestMatch.response.recommendations?.map((rec) => ({
            ...rec,
            reason: `이전 패턴 기반: ${rec.reason}`,
          })) || [],
        focus_areas: bestMatch.response.focus_areas || [
          "지속적 개선",
          "패턴 유지",
        ],
        personal_advice: `${userName}님의 이전 경험을 바탕으로, 비슷한 상황에서는 ${bestMatch.response.personal_advice}`,
        metadata: {
          fromSimilarQuestion: true,
          similarity: bestSimilarity,
          originalQuestion: bestMatch.question,
          cacheType: "similar_question",
          savedTokens: 800,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("유사 질문 응답 생성 오류:", error);
    return null;
  }
};

/**
 * 기본 템플릿 라이브러리
 */
const BASIC_TEMPLATES = {
  study_method: {
    keywords: ["공부", "학습", "방법", "어떻게"],
    response: {
      analysis:
        "효과적인 학습 방법에 대한 질문이시네요. 개인의 학습 스타일에 맞는 접근이 중요합니다.",
      insights:
        "집중력 향상을 위해서는 25분 집중 + 5분 휴식의 포모도로 기법을 활용해보세요.",
      recommendations: [
        {
          time: "09:00",
          task: "가장 어려운 과목 학습",
          category: "학습",
          priority: "high",
          reason: "오전 집중력 활용",
        },
        {
          time: "14:00",
          task: "복습 및 정리",
          category: "학습",
          priority: "medium",
          reason: "오후 정리 시간",
        },
        {
          time: "20:00",
          task: "다음날 계획 수립",
          category: "계획",
          priority: "medium",
          reason: "하루 마무리",
        },
      ],
      focus_areas: ["집중력 향상", "효율적 학습법", "꾸준한 습관"],
      personal_advice:
        "본인만의 학습 리듬을 찾아 꾸준히 유지하는 것이 가장 중요합니다.",
    },
  },

  time_management: {
    keywords: ["시간", "일정", "계획", "관리"],
    response: {
      analysis:
        "시간 관리에 대한 고민이시군요. 우선순위 설정과 체계적인 계획이 핵심입니다.",
      insights:
        "중요도와 긴급도를 구분하여 아이젠하워 매트릭스를 활용해보세요.",
      recommendations: [
        {
          time: "08:00",
          task: "하루 우선순위 3가지 선정",
          category: "계획",
          priority: "high",
          reason: "하루 시작 계획",
        },
        {
          time: "12:00",
          task: "오전 진행상황 점검",
          category: "점검",
          priority: "medium",
          reason: "중간 점검",
        },
        {
          time: "18:00",
          task: "내일 준비 및 정리",
          category: "정리",
          priority: "medium",
          reason: "하루 마무리",
        },
      ],
      focus_areas: ["우선순위 설정", "시간 배분", "계획 실행"],
      personal_advice:
        "완벽한 계획보다는 실행 가능한 계획을 세우고 꾸준히 지켜나가세요.",
    },
  },

  motivation: {
    keywords: ["동기", "의욕", "포기", "힘들", "어려"],
    response: {
      analysis:
        "동기 부여에 대한 고민이시네요. 작은 성취를 통해 점진적으로 자신감을 쌓아가는 것이 중요합니다.",
      insights: "큰 목표를 작은 단위로 나누어 달성 가능한 목표를 설정해보세요.",
      recommendations: [
        {
          time: "09:00",
          task: "오늘의 작은 목표 1개 설정",
          category: "목표",
          priority: "high",
          reason: "동기 부여",
        },
        {
          time: "15:00",
          task: "진행상황 확인 및 격려",
          category: "점검",
          priority: "medium",
          reason: "중간 격려",
        },
        {
          time: "21:00",
          task: "오늘의 성취 기록하기",
          category: "기록",
          priority: "medium",
          reason: "성취감 강화",
        },
      ],
      focus_areas: ["작은 성취", "자신감 회복", "긍정적 마인드"],
      personal_advice:
        "완벽하지 않아도 괜찮습니다. 조금씩 나아가는 자신을 인정하고 격려해주세요.",
    },
  },
};

/**
 * 기본 템플릿 매칭
 */
const getTemplateResponse = (question, userContext) => {
  const userName = userContext?.name || "사용자";
  const questionLower = question.toLowerCase();

  for (const [templateKey, template] of Object.entries(BASIC_TEMPLATES)) {
    const hasKeyword = template.keywords.some((keyword) =>
      questionLower.includes(keyword)
    );

    if (hasKeyword) {
      console.log(`📝 템플릿 매칭: ${templateKey}`);

      // 템플릿을 사용자에 맞게 개인화
      const personalizedResponse = {
        ...template.response,
        analysis: template.response.analysis.replace(/사용자/g, userName),
        personal_advice: template.response.personal_advice.replace(
          /사용자/g,
          userName
        ),
        metadata: {
          fromTemplate: true,
          templateType: templateKey,
          cacheType: "template_match",
          savedTokens: 1000,
        },
      };

      return personalizedResponse;
    }
  }

  return null;
};

/**
 * 공통 조언 추출
 */
const extractCommonAdvice = (recentResults) => {
  const allFocusAreas = [];
  const allInsights = [];
  const allAdvice = [];

  recentResults.forEach((result) => {
    if (result.focus_areas) allFocusAreas.push(...result.focus_areas);
    if (result.insights) allInsights.push(result.insights);
    if (result.personal_advice) allAdvice.push(result.personal_advice);
  });

  // 가장 자주 언급된 항목들 추출
  const topFocusAreas = [...new Set(allFocusAreas)].slice(0, 3);
  const latestInsight = allInsights[0] || "꾸준한 노력이 중요합니다.";
  const latestAdvice = allAdvice[0] || "단계적으로 접근해보세요.";

  return {
    focus_areas: topFocusAreas,
    insights: latestInsight,
    personal_advice: latestAdvice,
  };
};

/**
 * API 실패 시 폴백 응답
 */
const getFallbackResponse = async (question, userContext) => {
  try {
    const userName = userContext?.name || "사용자";

    // 이전 성공한 응답들에서 일반적인 조언 생성
    const recentResults = await getRecentAnalysisResults(3);

    if (recentResults.length > 0) {
      const commonAdvice = extractCommonAdvice(recentResults);

      return {
        analysis: `${userName}님, 현재 기술적 문제로 상세 분석이 어렵지만, 이전 패턴을 바탕으로 조언을 드리겠습니다.`,
        insights: `"${question}"에 대해서는 ${commonAdvice.insights}`,
        recommendations: [
          {
            time: "09:00",
            task: "중요한 일부터 처리",
            category: "업무",
            priority: "high",
            reason: "오전 집중력 활용",
          },
          {
            time: "14:00",
            task: "진행상황 점검",
            category: "점검",
            priority: "medium",
            reason: "중간 점검",
          },
          {
            time: "20:00",
            task: "내일 계획 세우기",
            category: "계획",
            priority: "medium",
            reason: "하루 마무리",
          },
        ],
        focus_areas: commonAdvice.focus_areas || [
          "꾸준한 실행",
          "단계적 접근",
          "자기 관리",
        ],
        personal_advice: `${userName}님의 이전 패턴을 보면, ${
          commonAdvice.personal_advice || "꾸준한 노력이 가장 중요합니다."
        }`,
        metadata: {
          fromFallback: true,
          basedOnPrevious: recentResults.length,
          cacheType: "fallback_response",
          savedTokens: 700,
        },
      };
    }

    // 기본 폴백
    return {
      analysis: `${userName}님, 현재 기술적 문제가 발생했지만 일반적인 조언을 드리겠습니다.`,
      insights: `"${question}"과 관련해서는 차근차근 단계적으로 접근하는 것이 좋겠습니다.`,
      recommendations: [
        {
          time: "09:00",
          task: "문제 상황 정리하기",
          category: "분석",
          priority: "high",
          reason: "현황 파악",
        },
        {
          time: "14:00",
          task: "해결 방안 찾아보기",
          category: "해결",
          priority: "medium",
          reason: "대안 모색",
        },
        {
          time: "20:00",
          task: "실행 계획 세우기",
          category: "계획",
          priority: "medium",
          reason: "실행 준비",
        },
      ],
      focus_areas: ["문제 파악", "해결 방안 모색", "단계적 실행"],
      personal_advice: `${userName}님, 어려운 상황일수록 차분하게 한 걸음씩 나아가세요.`,
      metadata: {
        fromFallback: true,
        cacheType: "basic_fallback",
        savedTokens: 500,
      },
    };
  } catch (error) {
    console.error("폴백 응답 생성 오류:", error);
    return null;
  }
};

/**
 * 질문 히스토리 저장
 */
const saveQuestionHistory = async (question, response, userContext) => {
  try {
    const historyKey = SMART_CACHE_KEYS.USER_QUESTION_HISTORY;
    const existingHistory = await AsyncStorage.getItem(historyKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];

    const newEntry = {
      question: question.trim(),
      response: {
        analysis: response.analysis,
        insights: response.insights,
        recommendations: response.recommendations?.slice(0, 3), // 주요 추천만 저장
        focus_areas: response.focus_areas,
        personal_advice: response.personal_advice,
      },
      timestamp: new Date().toISOString(),
      userId: userContext?.name || "unknown",
    };

    // 최신 10개만 유지
    history.unshift(newEntry);
    const trimmedHistory = history.slice(0, 10);

    await AsyncStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
    console.log("질문 히스토리 저장 완료");
  } catch (error) {
    console.error("질문 히스토리 저장 오류:", error);
  }
};

// ========== 메인 데이터 처리 함수 ==========

/**
 * 실제 사용자 데이터 처리 함수 (개인화 분석 포함)
 */
const buildRealUserData = (
  date,
  reportType,
  plannerData,
  userContext = null
) => {
  if (!plannerData) {
    console.warn("plannerData가 없습니다. 빈 구조로 처리합니다.");
    return {
      targetDate: date,
      reportType: reportType,
      currentTime: new Date().toISOString(),
      schedules: { recent: [], completionRate: 0, patterns: [] },
      studySessions: {
        totalHours: 0,
        subjectDistribution: {},
        timePatterns: [],
      },
      goals: {
        active: [],
        urgent: [],
        ddayDetails: [],
        totalDailyTargetHours: 0,
      },
      performance: {
        weeklyCompletionRate: 0,
        streakDays: 0,
        productivityTrend: "stable",
      },
      preferences: { mostActiveHours: [], workStyle: "balanced" },
      personalization: null,
    };
  }

  const { schedules, tasks, studySessions, goalTargets } = plannerData;

  // 최근 7일 데이터 수집
  const recentDates = [];
  for (let i = 6; i >= 0; i--) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - i);
    recentDates.push(format(pastDate, "yyyy-MM-dd"));
  }

  // 최근 스케줄 분석
  const recentSchedules = [];
  let totalTasks = 0;
  let completedTasks = 0;

  recentDates.forEach((dateStr) => {
    const daySchedules = schedules[dateStr] || [];
    const dayTasks = tasks[dateStr] || {};

    totalTasks += Object.keys(dayTasks).length;
    completedTasks += Object.values(dayTasks).filter(Boolean).length;

    daySchedules.forEach((schedule) => {
      recentSchedules.push({
        task: schedule.task,
        startTime: schedule.startTime,
        completed: dayTasks[schedule.id] || false,
        date: dateStr,
      });
    });
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 스터디 세션 분석
  let totalStudyTime = 0;
  const subjectDistribution = {};
  const studyTimePatterns = [];

  recentDates.forEach((dateStr) => {
    const daySessions = studySessions[dateStr] || [];
    daySessions.forEach((session) => {
      totalStudyTime += session.duration || 0;
      const subject = session.subject || "기타";
      subjectDistribution[subject] =
        (subjectDistribution[subject] || 0) + (session.duration || 0);

      if (session.timestamp) {
        const time = format(new Date(session.timestamp), "HH:mm");
        if (!studyTimePatterns.includes(time)) {
          studyTimePatterns.push(time);
        }
      }
    });
  });

  const totalStudyHours = Math.round((totalStudyTime / 3600) * 10) / 10;

  // 시간별 활동 패턴 분석
  const hourlyActivity = {};
  recentSchedules.forEach((schedule) => {
    const hour = schedule.startTime.split(":")[0];
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
  });

  const mostActiveHours = Object.entries(hourlyActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  // 작업 스타일 추론
  const morningActivity =
    (hourlyActivity["07"] || 0) +
    (hourlyActivity["08"] || 0) +
    (hourlyActivity["09"] || 0);
  const eveningActivity =
    (hourlyActivity["18"] || 0) +
    (hourlyActivity["19"] || 0) +
    (hourlyActivity["20"] || 0);
  const workStyle =
    morningActivity > eveningActivity
      ? "morning_person"
      : eveningActivity > morningActivity
      ? "evening_person"
      : "balanced";

  // 활성 목표 및 긴급 목표 분석
  const today = new Date();
  const activeGoals = goalTargets.filter(
    (goal) => new Date(goal.targetDate) > today
  );
  const urgentGoals = activeGoals.filter((goal) => {
    const daysLeft = Math.ceil(
      (new Date(goal.targetDate) - today) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 7;
  });

  // D-Day 상세 정보 계산
  const ddayInfo = goalTargets.map((goal) => {
    const targetDate = new Date(goal.targetDate);
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    let urgencyLevel = "normal";
    let priority = "medium";
    const recommendedDailyHours = getRecommendedHours(goal.category);

    if (daysLeft <= 0) {
      urgencyLevel = "completed_or_overdue";
      priority = "completed";
    } else if (daysLeft <= 1) {
      urgencyLevel = "critical";
      priority = "critical";
    } else if (daysLeft <= 3) {
      urgencyLevel = "urgent";
      priority = "high";
    } else if (daysLeft <= 7) {
      urgencyLevel = "important";
      priority = "high";
    } else if (daysLeft <= 14) {
      urgencyLevel = "moderate";
      priority = "medium";
    }

    return {
      title: goal.title,
      category: goal.category,
      targetDate: goal.targetDate,
      daysLeft: daysLeft,
      dDayText:
        daysLeft === 0
          ? "D-Day"
          : daysLeft > 0
          ? `D-${daysLeft}`
          : `D+${Math.abs(daysLeft)}`,
      urgencyLevel: urgencyLevel,
      priority: priority,
      recommendedDailyHours: recommendedDailyHours,
      description: goal.description || "",
    };
  });

  // 권장 일일 학습시간 계산 함수
  function getRecommendedHours(category) {
    const recommendations = {
      시험: 4,
      자격증: 3,
      어학: 2,
      프로젝트: 3,
      취업준비: 4,
      기타: 2,
    };
    return recommendations[category] || 2;
  }

  // 🔥 개인화 분석 수행
  const behaviorAnalysis = analyzeUserBehaviorPatterns(
    plannerData,
    userContext
  );

  return {
    targetDate: date,
    reportType: reportType,
    currentTime: new Date().toISOString(),
    schedules: {
      recent: recentSchedules.slice(-10),
      completionRate: completionRate,
      patterns:
        workStyle === "morning_person"
          ? ["morning_active"]
          : workStyle === "evening_person"
          ? ["evening_active"]
          : ["balanced_activity"],
    },
    studySessions: {
      totalHours: totalStudyHours,
      subjectDistribution: subjectDistribution,
      timePatterns: studyTimePatterns.slice(0, 3),
    },
    goals: {
      active: activeGoals.map((goal) => ({
        title: goal.title,
        targetDate: goal.targetDate,
        category: goal.category,
      })),
      urgent: urgentGoals.map((goal) => ({
        title: goal.title,
        targetDate: goal.targetDate,
        category: goal.category,
      })),
      ddayDetails: ddayInfo,
      totalDailyTargetHours: ddayInfo
        .filter((goal) => goal.priority !== "completed")
        .reduce((sum, goal) => sum + goal.recommendedDailyHours, 0),
    },
    performance: {
      weeklyCompletionRate: completionRate,
      streakDays: 5,
      productivityTrend:
        completionRate >= 70
          ? "improving"
          : completionRate >= 40
          ? "stable"
          : "declining",
    },
    preferences: {
      mostActiveHours: mostActiveHours,
      workStyle: workStyle,
    },
    // 🔥 개인화 정보 추가
    personalization: behaviorAnalysis,
  };
};

/**
 * 시스템 프롬프트 생성 (개인화 정보 포함)
 */
const getSystemPrompt = (
  reportType,
  userContext = null,
  personalizationData = null
) => {
  const userName = userContext?.name || "사용자";

  // 🔥 개인화 섹션 추가
  let personalizedSection = "";
  if (personalizationData) {
    personalizedSection = `

**${userName}님의 개인 행동 패턴:**
- 완료율이 높은 요일: ${
      personalizationData.completionPatterns?.bestDays?.join(", ") || "분석 중"
    }
- 집중 가능 시간: ${personalizationData.focusPatterns?.averageDuration || 0}분
- 최적 활동 시간: ${
      personalizationData.energyPatterns?.peakHours?.join(", ") || "분석 중"
    }
- 미루는 경향: ${personalizationData.procrastinationTendency || "분석 중"}
- 개인화 인사이트: ${
      personalizationData.personalizedInsights?.join(", ") || "분석 중"
    }`;
  }

  return `당신은 전문 일정 관리 AI 어시스턴트입니다.
${userName}님의 데이터를 분석하여 실용적이고 개인화된 일정 추천을 제공해주세요.
${personalizedSection}

**최우선 원칙:**
🎯 ${userName}님이 질문한 내용이 있다면 그 질문에 대한 구체적인 답변을 반드시 포함하세요!
📝 일반적인 조언보다는 ${userName}님의 특정 상황과 질문에 맞춘 맞춤형 답변을 제공하세요!
👤 ${userName}님의 개인 정보(나이, 직업, 성격, 학습스타일 등)를 적극 활용해 개인화된 조언을 하세요!
🧠 ${userName}님의 행동 패턴을 반영한 현실적이고 실행 가능한 제안을 하세요!

**${userName}님 개인화 고려사항:**
- ${userName}님의 질문이나 고민에 구체적으로 답변하세요 (가장 중요!)
- ${userName}님의 나이, 직업, 학습스타일에 맞는 조언을 제공하세요
- 어제와 오늘의 활동 패턴 변화를 분석해주세요
- D-Day 목표의 긴급도를 반드시 고려하세요 (Critical > Urgent > Important > Normal)
- 권장 일일 학습시간과 실제 학습시간의 차이를 분석하세요
- ${userName}님의 활동 패턴(아침형/저녁형)에 맞춰 일정을 배치하세요
- 완료율이 낮다면 현실적인 목표 조정을 제안하세요
- ${userName}님의 개인 행동 패턴(완료율 높은 요일, 집중 시간, 미루는 경향)을 활용하세요

**응답 형식 (반드시 JSON으로):**
{
  "analysis": "${userName}님의 질문에 대한 답변과 어제 대비 오늘의 패턴 변화 분석 포함 (한국어, 3-4문장)",
  "recommendations": [
    {
      "time": "HH:MM",
      "task": "구체적인 할 일 (${userName}님의 질문과 연관된 내용 포함)",
      "category": "카테고리",
      "priority": "critical|high|medium|low",
      "reason": "추천 이유 (${userName}님의 개인 정보와 질문 해결 방안 포함)",
      "related_goal": "관련 D-Day 목표명 (있는 경우)"
    }
  ],
  "insights": "${userName}님의 질문에 대한 구체적인 해결 방안과 개인화된 조언 (한국어, 4-5문장)",
  "focus_areas": ["${userName}님 질문 관련 영역", "개인 특성 맞춤 영역", "개선 영역"],
  "dday_strategy": "${userName}님의 D-Day 목표 달성 전략 (한국어, 2-3문장)",
  "personal_advice": "${userName}님만을 위한 특별한 조언 (개인 정보 활용, 한국어, 2-3문장)"
}

${
  reportType === "daily"
    ? `오늘 하루 ${userName}님의 질문을 해결하면서 D-Day 목표에도 집중한 최적 일정을 제안해주세요.`
    : reportType === "weekly"
    ? `이번 주 ${userName}님의 고민을 해결하면서 D-Day 목표 달성을 위한 전체 계획을 제안해주세요.`
    : `이번 달 ${userName}님의 장기적 고민을 해결하면서 D-Day 목표 달성을 위한 전략적 일정을 제안해주세요.`
}`;
};

/**
 * 사용자 프롬프트 생성 (개인화 정보 포함)
 */
const buildUserPrompt = (
  userData,
  userInput = "",
  userContext = null,
  yesterdayData = null
) => {
  const hasData =
    userData.schedules.recent.length > 0 ||
    userData.studySessions.totalHours > 0 ||
    userData.goals.active.length > 0;

  const userName = userContext?.name || "사용자";

  let basePrompt = `**${userName}님의 현황 분석:**

📅 날짜: ${userData.targetDate}
📊 리포트 타입: ${userData.reportType}`;

  // 사용자 개인 정보 섹션 추가
  if (userContext) {
    basePrompt += `

👤 **${userName}님의 개인 정보:**
- 이름: ${userContext.name}
- 나이: ${userContext.age}세
- 성별: ${userContext.gender || "미제공"}
- 직업/상황: ${userContext.occupation}
- 성격/MBTI: ${userContext.personality || "미제공"}
- 주요 목표: ${userContext.targetGoal || "미제공"}
- 학습 스타일: ${
      userContext.preferredStyle === "intensive"
        ? "몰입형"
        : userContext.preferredStyle === "distributed"
        ? "분산형"
        : userContext.preferredStyle === "balanced"
        ? "균형형"
        : "미제공"
    }
- 총 상담 횟수: ${userContext.totalSessions || 0}회
- 가입일: ${
      userContext.createdAt
        ? format(new Date(userContext.createdAt), "yyyy년 M월 d일")
        : "미제공"
    }`;
  }

  // 🔥 개인화 행동 패턴 섹션 추가
  if (userData.personalization) {
    basePrompt += `

🧠 **${userName}님의 개인 행동 패턴:**
- 완료율이 높은 요일: ${
      userData.personalization.completionPatterns?.bestDays?.join(", ") ||
      "분석 중"
    }
- 평균 집중 시간: ${
      userData.personalization.focusPatterns?.averageDuration || 0
    }분
- 최고 효율 시간대: ${
      userData.personalization.energyPatterns?.peakHours?.join(", ") ||
      "분석 중"
    }
- 미루는 경향: ${userData.personalization.procrastinationTendency || "분석 중"}
- 활동 스타일: ${
      userData.personalization.energyPatterns?.type === "morning"
        ? "아침형"
        : userData.personalization.energyPatterns?.type === "evening"
        ? "저녁형"
        : "균형형"
    }
- 개인화 인사이트: ${
      userData.personalization.personalizedInsights?.join(", ") || "분석 중"
    }`;
  }

  // 사용자 질문이 있는 경우 먼저 강조해서 표시
  if (userInput.trim()) {
    basePrompt += `

🔥🔥🔥 **중요: ${userName}님의 핵심 질문** 🔥🔥🔥
"${userInput.trim()}"

👆 위 질문에 대해 ${userName}님의 개인 정보(나이: ${
      userContext?.age
    }세, 직업: ${userContext?.occupation}, 학습스타일: ${
      userContext?.preferredStyle
    })와 행동 패턴을 고려해서 구체적이고 실용적인 답변을 반드시 포함해주세요!
${userName}님이 가장 궁금해하는 부분이니 이 질문을 중심으로 분석해주세요.`;
  }

  // 어제 데이터와 비교 섹션 추가
  if (yesterdayData) {
    basePrompt += `

📊 **어제 대비 오늘의 변화:**
- 어제 일정 완료율: ${
      yesterdayData.performance?.weeklyCompletionRate || 0
    }% → 오늘: ${userData.performance.weeklyCompletionRate}%
- 어제 학습 시간: ${yesterdayData.studySessions?.totalHours || 0}시간 → 오늘: ${
      userData.studySessions.totalHours
    }시간
- 어제 주요 활동 시간대: ${
      yesterdayData.preferences?.mostActiveHours?.join(", ") || "정보 없음"
    }
- 오늘 주요 활동 시간대: ${
      userData.preferences.mostActiveHours.join(", ") || "정보 없음"
    }

${
  userData.performance.weeklyCompletionRate >
  (yesterdayData.performance?.weeklyCompletionRate || 0)
    ? `✅ ${userName}님, 어제보다 완료율이 개선되었어요!`
    : userData.performance.weeklyCompletionRate <
      (yesterdayData.performance?.weeklyCompletionRate || 0)
    ? `⚠️ ${userName}님, 어제보다 완료율이 낮아졌네요. 원인을 분석해드릴게요.`
    : `📊 ${userName}님, 어제와 비슷한 완료율을 유지하고 계시네요.`
}`;
  }

  if (!hasData) {
    basePrompt += `

**현재 상황:**
- 아직 충분한 활동 기록이 없습니다
- 일정, 학습 기록, 목표 설정이 필요합니다

**${userName}님을 위한 권장사항:**
- 일상적인 일정을 등록해보세요
- 학습 시간을 기록해보세요  
- 달성하고 싶은 목표를 설정해보세요

${userName}님의 ${
      userContext?.preferredStyle === "intensive"
        ? "몰입형"
        : userContext?.preferredStyle === "distributed"
        ? "분산형"
        : userContext?.preferredStyle === "balanced"
        ? "균형형"
        : ""
    } 학습 스타일에 맞는 ${userData.reportType} 일정을 추천해주세요.`;
  } else {
    basePrompt += `

**${userName}님의 최근 활동 패턴:**
- 일정 완료율: ${userData.performance.weeklyCompletionRate}%
- 연속 출석: ${userData.performance.streakDays}일
- 주요 활동 시간대: ${
      userData.preferences.mostActiveHours.join(", ") || "정보 없음"
    }
- 작업 스타일: ${
      userData.preferences.workStyle === "morning_person"
        ? "아침형 인간"
        : userData.preferences.workStyle === "evening_person"
        ? "저녁형 인간"
        : "균형형"
    }

**${userName}님의 학습 현황:**
- 총 학습 시간: ${userData.studySessions.totalHours}시간
- 주요 과목: ${
      Object.keys(userData.studySessions.subjectDistribution)
        .slice(0, 3)
        .join(", ") || "기록 없음"
    }

**${userName}님의 목표 현황:**
${
  userData.goals.active.length > 0
    ? userData.goals.active
        .map((goal) => `- ${goal.title} (${goal.category})`)
        .join("\n")
    : "- 설정된 목표 없음"
}

**${userName}님의 D-Day 상세 현황:**
${
  userData.goals.ddayDetails && userData.goals.ddayDetails.length > 0
    ? userData.goals.ddayDetails
        .slice(0, 5)
        .map(
          (goal) =>
            `- ${goal.title}: ${goal.dDayText} (${goal.urgencyLevel}, 권장 ${goal.recommendedDailyHours}h/일)`
        )
        .join("\n")
    : "- D-Day 목표 없음"
}

**${userName}님의 목표 우선순위 분석:**
- 총 권장 일일 학습시간: ${userData.goals.totalDailyTargetHours || 0}시간/일
- 현재 실제 학습시간: ${userData.studySessions.totalHours}시간/주
- ${
      userContext?.preferredStyle === "intensive"
        ? "몰입형 스타일에 맞는 집중 학습"
        : userContext?.preferredStyle === "distributed"
        ? "분산형 스타일에 맞는 다양한 과목 순환"
        : userContext?.preferredStyle === "balanced"
        ? "균형형 스타일에 맞는 조화로운 학습"
        : "개인 맞춤형"
    } 추천

**${userName}님의 긴급 목표:**
${
  userData.goals.urgent.length > 0
    ? userData.goals.urgent.map((goal) => `- ⚠️ ${goal.title}`).join("\n")
    : "- 긴급한 목표 없음"
}

**${userName}님의 최근 스케줄:**
${
  userData.schedules.recent.length > 0
    ? userData.schedules.recent
        .slice(-5)
        .map(
          (schedule) =>
            `- ${schedule.startTime} ${schedule.task} ${
              schedule.completed ? "✅" : "❌"
            }`
        )
        .join("\n")
    : "- 기록된 스케줄 없음"
}`;
  }

  basePrompt += `

이 데이터를 바탕으로 ${userName}님만을 위한 ${userData.reportType} 맞춤 일정을 추천해주세요.`;

  if (userData.goals.urgent.length > 0) {
    basePrompt += `\n특히 ${userName}님의 긴급한 목표를 우선으로 고려해주세요.`;
  }

  if (userContext?.preferredStyle) {
    const styleAdvice = {
      intensive:
        "몰입형 스타일에 맞게 한 가지에 집중할 수 있는 시간 블록을 만들어주세요.",
      distributed:
        "분산형 스타일에 맞게 여러 과목을 번갈아 학습할 수 있도록 구성해주세요.",
      balanced: "균형형 스타일에 맞게 일과 학습의 조화를 고려해주세요.",
    };
    basePrompt += `\n${userName}님의 ${
      styleAdvice[userContext.preferredStyle]
    }`;
  }

  if (userInput.trim()) {
    basePrompt += `

❗❗❗ 다시 한번 강조: ${userName}님의 질문 "${userInput.trim()}"에 대해 
analysis, insights, personal_advice 필드에서 구체적으로 답변해주세요. 
${userName}님의 개인 정보(${userContext?.age}세, ${userContext?.occupation}, ${
      userContext?.preferredStyle
    } 스타일)와 행동 패턴(${
      userData.personalization?.completionPatterns?.bestDays?.join(", ") ||
      "분석중"
    }에 효율적, ${
      userData.personalization?.focusPatterns?.averageDuration || 0
    }분 집중가능)을 활용해서
일반적인 조언이 아닌, ${userName}님만을 위한 특화된 맞춤 답변을 제공해주세요! ❗❗❗`;
  }

  return basePrompt;
};

/**
 * DeepSeek API 호출 함수 (개인화 기능 통합)
 */
export const testDeepSeekAPI = async ({
  reportType = "daily",
  plannerData = null,
  userInput = "",
  userContext = null,
  chatHistory = [],
}) => {
  try {
    console.log("🚀 개인화된 DeepSeek API 호출 시작...", {
      reportType,
      hasUserInput: !!userInput,
      hasUserContext: !!userContext,
      userName: userContext?.name || "미제공",
    });

    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

    // 🔥 개인화 분석이 포함된 오늘 데이터 구성
    const userData = buildRealUserData(
      today,
      reportType,
      plannerData,
      userContext
    );

    // 어제 데이터 구성 (비교용)
    let yesterdayData = null;
    if (plannerData) {
      try {
        // 어제 데이터만 추출해서 구성
        const yesterdayPlannerData = {
          schedules: {
            [yesterdayStr]: plannerData.schedules?.[yesterdayStr] || [],
          },
          tasks: { [yesterdayStr]: plannerData.tasks?.[yesterdayStr] || {} },
          studySessions: {
            [yesterdayStr]: plannerData.studySessions?.[yesterdayStr] || [],
          },
          goalTargets: plannerData.goalTargets || [],
        };

        yesterdayData = buildRealUserData(
          yesterdayStr,
          reportType,
          yesterdayPlannerData,
          userContext
        );
        console.log("📊 어제 데이터 구성 완료:", {
          yesterdaySchedules: yesterdayData.schedules.recent.length,
          yesterdayStudyHours: yesterdayData.studySessions.totalHours,
        });
      } catch (error) {
        console.warn("어제 데이터 구성 중 오류:", error);
        yesterdayData = null;
      }
    }

    console.log("📊 개인화된 사용자 데이터 구성 완료:", {
      schedulesCount: userData.schedules.recent.length,
      studyHours: userData.studySessions.totalHours,
      goalsCount: userData.goals.active.length,
      hasUserInput: !!userInput,
      hasUserContext: !!userContext,
      hasYesterdayData: !!yesterdayData,
      hasPersonalization: !!userData.personalization,
      personalizationInsights:
        userData.personalization?.personalizedInsights?.length || 0,
    });

    // 🔥 개인화 정보가 포함된 프롬프트 구성
    const systemPrompt = getSystemPrompt(
      reportType,
      userContext,
      userData.personalization
    );
    const userPrompt = buildUserPrompt(
      userData,
      userInput,
      userContext,
      yesterdayData
    );

    console.log("📤 개인화된 API 요청 중...", {
      userInputLength: userInput?.length || 0,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      userName: userContext?.name || "미제공",
      hasPersonalizationData: !!userData.personalization,
    });

    // API 호출
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1800, // 개인화로 더 자세한 답변
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API 호출 실패: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("✅ 개인화된 API 응답 받음:", result);

    // JSON 파싱
    const aiContent = JSON.parse(result.choices[0].message.content);

    return {
      success: true,
      data: {
        ...aiContent,
        metadata: {
          requestTime: new Date().toISOString(),
          reportType: reportType,
          tokensUsed: result.usage?.total_tokens || 0,
          dataSource: plannerData ? "real_user_data" : "empty_data",
          hasUserInput: !!userInput,
          userInputLength: userInput?.length || 0,
          userName: userContext?.name || "미제공",
          userAge: userContext?.age || "미제공",
          userOccupation: userContext?.occupation || "미제공",
          userStyle: userContext?.preferredStyle || "미제공",
          hasYesterdayComparison: !!yesterdayData,
          // 🔥 개인화 메타데이터 추가
          personalizationLevel: "enhanced",
          hasPersonalization: !!userData.personalization,
          behaviorPatternsAnalyzed: !!userData.personalization,
          completionPatternsFound:
            !!userData.personalization?.completionPatterns?.bestDays?.length,
          focusPatternFound:
            (userData.personalization?.focusPatterns?.averageDuration || 0) > 0,
          energyPatternDetected:
            !!userData.personalization?.energyPatterns?.type,
        },
      },
    };
  } catch (error) {
    console.error("❌ 개인화된 DeepSeek API 오류:", error);
    const userName = userContext?.name || "사용자";
    return {
      success: false,
      error: error.message,
      fallback: {
        analysis: userInput
          ? `${userName}님, "${userInput}" 관련해서 도움을 드리고 싶지만, 현재 기술적 문제가 발생했습니다.`
          : `${userName}님, 실제 데이터를 기반으로 분석 중입니다. 더 많은 데이터가 쌓이면 정확한 분석을 제공하겠습니다.`,
        recommendations: [
          {
            time: "09:00",
            task: userInput
              ? `${userName}님이 질문하신 내용에 대해 검토해보기`
              : "중요한 업무 처리",
            category: "업무",
            priority: "high",
            reason: userInput
              ? `${userName}님이 관심있어 하는 주제`
              : "아침 집중력 활용",
          },
        ],
        insights: userInput
          ? `${userName}님, 구체적인 질문을 해주셔서 감사합니다. 더 정확한 답변을 위해 시스템을 개선하겠습니다.`
          : `${userName}님, 개인화된 분석을 위해 더 많은 활동 기록이 필요합니다. 꾸준히 일정과 학습을 기록해주세요.`,
        focus_areas: ["활동 기록 늘리기", "꾸준한 습관 형성", "목표 설정"],
        personal_advice: `${userName}님의 ${
          userContext?.preferredStyle || "개인"
        } 스타일에 맞는 학습 방법을 찾아보세요.`,
      },
    };
  }
};

/**
 * 스마트 캐시 메인 함수 (기존 API 호출 대체)
 */
export const getSmartAIResponse = async ({
  question,
  userContext,
  plannerData,
  forceAPI = false,
}) => {
  try {
    console.log("🧠 스마트 AI 응답 시작:", {
      question: question.slice(0, 50),
      forceAPI,
    });

    if (!forceAPI) {
      // 1단계: 유사 질문 기반 응답 확인
      const similarResponse = await generateSimilarResponse(
        question,
        userContext
      );
      if (similarResponse) {
        console.log("✅ 유사 질문 기반 응답 반환");
        return {
          success: true,
          data: similarResponse,
          cached: true,
          cacheType: "similar_question",
        };
      }

      // 2단계: 기본 템플릿 확인
      const templateResponse = getTemplateResponse(question, userContext);
      if (templateResponse) {
        console.log("✅ 템플릿 기반 응답 반환");
        return {
          success: true,
          data: templateResponse,
          cached: true,
          cacheType: "template_match",
        };
      }
    }

    // 3단계: 실제 API 호출
    console.log("🚀 실제 API 호출 시작");
    const apiResult = await testDeepSeekAPI({
      reportType: "daily",
      plannerData: plannerData,
      userInput: question,
      userContext: userContext,
      chatHistory: [],
    });

    if (apiResult.success) {
      // 성공한 응답을 히스토리에 저장
      await saveQuestionHistory(question, apiResult.data, userContext);

      return {
        success: true,
        data: {
          ...apiResult.data,
          metadata: {
            ...apiResult.data.metadata,
            cached: false,
            cacheType: "fresh_api_call",
          },
        },
        cached: false,
        cacheType: "api_success",
      };
    } else {
      throw new Error(apiResult.error || "API 호출 실패");
    }
  } catch (error) {
    console.error("API 호출 실패, 폴백 응답 생성:", error);

    // 4단계: API 실패 시 폴백 응답
    const fallbackResponse = await getFallbackResponse(question, userContext);

    if (fallbackResponse) {
      return {
        success: true,
        data: fallbackResponse,
        cached: true,
        cacheType: "fallback_response",
        originalError: error.message,
      };
    }

    // 최후의 수단
    return {
      success: false,
      error: error.message,
      fallback: {
        analysis: "죄송합니다. 현재 기술적 문제가 발생했습니다.",
        insights:
          "잠시 후 다시 시도해주시거나, 기본적인 학습 계획을 세워보세요.",
        recommendations: [],
        focus_areas: ["기본 계획 수립"],
        personal_advice: "어려운 상황일수록 기본에 충실하세요.",
      },
    };
  }
};

/**
 * AIFeedbackScreen.js에서 사용할 개선된 handleAnalysisRequest 함수
 */
export const handleAnalysisRequestWithCache = async (
  analysisInput,
  userContext,
  plannerData,
  setIsAnalyzing,
  setError,
  setAnalysisResult,
  setHasAnalyzedToday,
  setAnalysisInput,
  setRecentResults,
  setSelectedResultIndex,
  returnToResultMode,
  handleError
) => {
  if (!analysisInput.trim() || setIsAnalyzing) return;

  setIsAnalyzing(true);
  setError(null);

  try {
    console.log("🧠 스마트 AI 분석 시작:", analysisInput.slice(0, 50));

    // 스마트 캐시 시스템 사용
    const result = await getSmartAIResponse({
      question: analysisInput.trim(),
      userContext: userContext,
      plannerData: {
        schedules: plannerData.schedules || {},
        tasks: plannerData.tasks || {},
        studySessions: plannerData.studySessions || {},
        goalTargets: plannerData.goalTargets || [],
        weeklyStats: plannerData.weeklyStats || {},
        monthlyStats: plannerData.monthlyStats || {},
      },
      forceAPI: false, // 캐시 우선 사용
    });

    if (result.success) {
      const newAnalysisResult = {
        ...result.data,
        userInput: analysisInput.trim(),
        date: format(new Date(), "yyyy-MM-dd"),
        timestamp: new Date().toISOString(),
        // 🔥 캐시 정보 추가
        fromCache: result.cached,
        cacheType: result.cacheType,
        savedTokens: result.data.metadata?.savedTokens || 0,
      };

      setAnalysisResult(newAnalysisResult);

      // 실제 API 호출만 저장 (캐시는 저장하지 않음)
      if (!result.cached) {
        const today = format(new Date(), "yyyy-MM-dd");
        await saveAnalysisResult(today, newAnalysisResult);
        setHasAnalyzedToday(true); // 실제 API 호출시만 제한 활성화

        console.log("✅ 실제 API 분석 완료 - 하루 제한 활성화");
      } else {
        console.log(
          `✅ 캐시 응답 완료 - 타입: ${result.cacheType}, 절약: ${
            result.data.metadata?.savedTokens || 0
          } 토큰`
        );
      }

      setAnalysisInput("");

      // 결과 목록 업데이트
      const updatedRecentResults = await getRecentAnalysisResults(7);
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );

      const processedResults = updatedRecentResults.map((result) => {
        const resultDate = result.date;
        const isToday = resultDate === today;
        const isYesterday = resultDate === yesterday;
        const resultDateTime = new Date(resultDate).getTime();
        const todayTime = new Date(today).getTime();
        const daysAgo = Math.floor(
          (todayTime - resultDateTime) / (24 * 60 * 60 * 1000)
        );

        return {
          ...result,
          isToday,
          isYesterday,
          daysAgo,
        };
      });

      setRecentResults(processedResults);
      setSelectedResultIndex(0);
      returnToResultMode();
    } else {
      throw new Error(result.error || "스마트 AI 분석에 실패했습니다.");
    }
  } catch (error) {
    handleError(error, "AI 분석");

    // 최종 폴백
    setAnalysisResult({
      analysis: "분석 중 오류가 발생했습니다.",
      insights: "잠시 후 다시 시도해주세요.",
      userInput: analysisInput.trim(),
      date: format(new Date(), "yyyy-MM-dd"),
      timestamp: new Date().toISOString(),
      isError: true,
      fromCache: false,
      cacheType: "error_fallback",
    });
    returnToResultMode();
  } finally {
    setIsAnalyzing(false);
  }
};

// ========== 분석 결과 관련 함수들 ==========

/**
 * 분석 결과를 날짜별로 저장
 */
export const saveAnalysisResult = async (date, analysisResult) => {
  try {
    const key = `${STORAGE_KEYS.ANALYSIS_RESULTS}_${date}`;
    const dataToSave = {
      ...analysisResult,
      date: date,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
    console.log(`✅ ${date} 분석 결과 저장 완료`);
    return true;
  } catch (error) {
    console.error("분석 결과 저장 오류:", error);
    return false;
  }
};

/**
 * 특정 날짜의 분석 결과 조회
 */
export const getAnalysisResult = async (date) => {
  try {
    const key = `${STORAGE_KEYS.ANALYSIS_RESULTS}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("분석 결과 조회 오류:", error);
    return null;
  }
};

/**
 * 오늘 이미 분석했는지 확인
 */
export const hasAnalysisToday = async () => {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = await getAnalysisResult(today);
    return !!result;
  } catch (error) {
    console.error("오늘 분석 확인 오류:", error);
    return false;
  }
};

/**
 * 최근 분석 결과들 조회 (최대 7일)
 */
export const getRecentAnalysisResults = async (days = 7) => {
  try {
    const results = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");

      const result = await getAnalysisResult(dateStr);
      if (result) {
        results.push({
          ...result,
          date: dateStr,
          isToday: i === 0,
          isYesterday: i === 1,
          daysAgo: i,
        });
      }
    }
    return results;
  } catch (error) {
    console.error("최근 분석 결과 조회 오류:", error);
    return [];
  }
};

/**
 * 어제의 분석 결과 조회
 */
export const getYesterdayAnalysisResult = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    return await getAnalysisResult(yesterdayStr);
  } catch (error) {
    console.error("어제 분석 결과 조회 오류:", error);
    return null;
  }
};

/**
 * 분석 결과 삭제 (특정 날짜)
 */
export const deleteAnalysisResult = async (date) => {
  try {
    const key = `${STORAGE_KEYS.ANALYSIS_RESULTS}_${date}`;
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ ${date} 분석 결과 삭제 완료`);
    return true;
  } catch (error) {
    console.error("분석 결과 삭제 오류:", error);
    return false;
  }
};

/**
 * 캐시 통계 및 관리
 */
export const getCacheStatistics = async () => {
  try {
    const questionHistory = await AsyncStorage.getItem(
      SMART_CACHE_KEYS.USER_QUESTION_HISTORY
    );
    const history = questionHistory ? JSON.parse(questionHistory) : [];

    return {
      totalQuestions: history.length,
      availableTemplates: Object.keys(BASIC_TEMPLATES).length,
      estimatedSavings: `약 ${history.length * 800} 토큰 절약 가능`,
      cacheEfficiency:
        history.length > 0 ? `${Math.min(80, history.length * 8)}%` : "0%",
    };
  } catch (error) {
    console.error("캐시 통계 오류:", error);
    return { error: error.message };
  }
};

/**
 * 캐시 정리
 */
export const clearSmartCache = async () => {
  try {
    await AsyncStorage.multiRemove([
      SMART_CACHE_KEYS.QUESTION_PATTERNS,
      SMART_CACHE_KEYS.FALLBACK_RESPONSES,
      SMART_CACHE_KEYS.USER_QUESTION_HISTORY,
    ]);
    console.log("스마트 캐시 정리 완료");
    return true;
  } catch (error) {
    console.error("캐시 정리 오류:", error);
    return false;
  }
};

// ========== 기존 호환성 함수들 ==========

// 기존 API 호출을 위한 wrapper 함수 (호환성 유지)
export const testDeepSeekAPILegacy = async (
  reportType = "daily",
  plannerData = null
) => {
  return await testDeepSeekAPI({ reportType, plannerData });
};

export const saveReport = async (date, type, report) => {
  try {
    const key = `${STORAGE_KEYS.REPORTS}_${type}_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(report));
    return true;
  } catch (error) {
    console.error("리포트 저장 오류:", error);
    return false;
  }
};

export const getReport = async (date, type) => {
  try {
    const key = `${STORAGE_KEYS.REPORTS}_${type}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("리포트 조회 오류:", error);
    return null;
  }
};

// 사용자 컨텍스트 저장/불러오기
export const saveUserContext = async (userContext) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_CONTEXT,
      JSON.stringify(userContext)
    );
    return true;
  } catch (error) {
    console.error("사용자 컨텍스트 저장 오류:", error);
    return false;
  }
};

export const getUserContext = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_CONTEXT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("사용자 컨텍스트 조회 오류:", error);
    return null;
  }
};

// 채팅 히스토리 저장/불러오기
export const saveChatHistory = async (chatHistory) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(chatHistory)
    );
    return true;
  } catch (error) {
    console.error("채팅 히스토리 저장 오류:", error);
    return false;
  }
};

export const getChatHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("채팅 히스토리 조회 오류:", error);
    return [];
  }
};

// 호환성을 위한 더미 함수들 (기존 코드에서 사용)
export const setReportCallback = (callback) => {
  // 호환성을 위해 유지하지만 실제로는 사용하지 않음
  console.log("setReportCallback은 더 이상 사용되지 않습니다.");
  return true;
};

// PlannerContext 호환성을 위한 generateFeedback 함수
export const generateFeedback = async (
  date,
  reportType,
  schedules,
  tasks,
  studySessions,
  statsData,
  useAI = false,
  userPremiumStatus = false,
  goalTargets = []
) => {
  try {
    console.log("generateFeedback 호출됨 (호환성 wrapper):", {
      date,
      reportType,
      useAI,
      userPremiumStatus,
    });

    // plannerData 구성
    const plannerData = {
      schedules: schedules || {},
      tasks: tasks || {},
      studySessions: studySessions || {},
      goalTargets: goalTargets || [],
    };

    // 새로운 API 호출
    const result = await testDeepSeekAPI({
      reportType,
      plannerData,
      userInput: "", // 기본적으로 빈 문자열
    });

    if (result.success) {
      // 기존 리포트 형식으로 변환
      return {
        type: reportType,
        date,
        timestamp: new Date().toISOString(),
        insights: result.data.analysis || "분석 결과가 없습니다.",
        recommendations: result.data.insights || "추천사항이 없습니다.",
        isAIGenerated: useAI,
        isPremiumUser: userPremiumStatus,
        metadata: result.data.metadata,
        // AI 데이터 추가
        aiAnalysis: result.data.analysis,
        aiRecommendations: result.data.recommendations,
        aiInsights: result.data.insights,
        aiFocusAreas: result.data.focus_areas,
        ddayStrategy: result.data.dday_strategy,
      };
    } else {
      // 기본 리포트 생성 (AI 실패시)
      return {
        type: reportType,
        date,
        timestamp: new Date().toISOString(),
        insights:
          "현재 데이터를 분석하고 있습니다. 더 많은 활동을 기록해보세요.",
        recommendations: "꾸준한 활동 기록이 더 정확한 분석을 가능하게 합니다.",
        isAIGenerated: false,
        isPremiumUser: userPremiumStatus,
        error: result.error,
        fallback: result.fallback,
      };
    }
  } catch (error) {
    console.error("generateFeedback 오류:", error);
    return {
      type: reportType,
      date,
      timestamp: new Date().toISOString(),
      insights: "리포트 생성 중 오류가 발생했습니다.",
      recommendations: "나중에 다시 시도해주세요.",
      isAIGenerated: false,
      isPremiumUser: userPremiumStatus,
      error: error.message,
    };
  }
};

// 자동 갱신 주기 (호환성)
export const AUTO_REFRESH_INTERVALS = {
  [REPORT_TYPES.DAILY]: 5 * 60 * 1000,
  [REPORT_TYPES.WEEKLY]: 24 * 60 * 60 * 1000,
  [REPORT_TYPES.MONTHLY]: 7 * 24 * 60 * 60 * 1000,
};

// 목표 처리 함수 (호환성)
export const processGoalsForReport = (goalTargets) => {
  try {
    if (
      !goalTargets ||
      !Array.isArray(goalTargets) ||
      goalTargets.length === 0
    ) {
      return {
        hasGoals: false,
        hasActiveGoals: false,
        message: "아직 설정된 목표가 없습니다.",
        analysis: null,
        goals: [],
        activeGoals: [],
        urgentGoals: [],
        todayGoals: [],
        overallStatus: "목표를 설정해보세요.",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedGoals = goalTargets.map((goal) => {
      const targetDate = new Date(goal.targetDate);
      targetDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

      return {
        ...goal,
        daysLeft,
        dDayText:
          daysLeft === 0
            ? "D-Day"
            : daysLeft > 0
            ? `D-${daysLeft}`
            : `D+${Math.abs(daysLeft)}`,
        isUrgent: daysLeft <= 7 && daysLeft > 0,
        isToday: daysLeft === 0,
      };
    });

    const activeGoals = processedGoals.filter((goal) => goal.daysLeft >= 0);
    const urgentGoals = activeGoals.filter((goal) => goal.isUrgent);
    const todayGoals = processedGoals.filter((goal) => goal.isToday);

    return {
      hasGoals: processedGoals.length > 0,
      hasActiveGoals: activeGoals.length > 0,
      goals: processedGoals,
      activeGoals,
      urgentGoals,
      todayGoals,
      overallStatus:
        urgentGoals.length > 0
          ? `⚠️ ${urgentGoals.length}개의 긴급한 목표가 있습니다.`
          : "목표를 순조롭게 진행하고 있습니다.",
    };
  } catch (error) {
    console.error("목표 처리 오류:", error);
    return {
      hasGoals: false,
      hasActiveGoals: false,
      message: "목표 처리 중 오류가 발생했습니다.",
      goals: [],
      activeGoals: [],
      urgentGoals: [],
      todayGoals: [],
      overallStatus: "목표 데이터를 확인해주세요.",
    };
  }
};

export default {
  // 메인 API 함수들
  testDeepSeekAPI,
  testDeepSeekAPILegacy,
  getSmartAIResponse,
  handleAnalysisRequestWithCache,

  // 분석 결과 관련
  saveAnalysisResult,
  getAnalysisResult,
  hasAnalysisToday,
  getRecentAnalysisResults,
  getYesterdayAnalysisResult,
  deleteAnalysisResult,

  // 스마트 캐시 관련
  getCacheStatistics,
  clearSmartCache,

  // 기존 호환성 함수들
  generateFeedback,
  saveReport,
  getReport,
  saveUserContext,
  getUserContext,
  saveChatHistory,
  getChatHistory,
  setReportCallback,
  processGoalsForReport,

  // 상수들
  AUTO_REFRESH_INTERVALS,
  REPORT_TYPES,
  STORAGE_KEYS,
  SMART_CACHE_KEYS,
};
