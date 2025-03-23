// src/screens/AIFeedbackScreen.js
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlanner } from "../context/PlannerContext";
import { format, sub } from "date-fns";
import { ko } from "date-fns/locale";
import { updateReportScheduling } from "../services/FeedbackService";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../components/layout/MainLayout";
import ImprovedNoticeBar from "../components/layout/ImprovedNoticeBar";
import CategoryTabs from "../components/layout/CategoryTabs";
import HeaderBar from "../components/layout/HeaderBar";

// Chart components
import {
  DailyStudyChart,
  WeeklyStudyChart,
  MonthlySubjectChart,
} from "../components/reports/SimpleCharts";

// Import styles from separate file
import {
  THEME_COLORS,
  getColor,
  badgeStyles,
  styles,
} from "../styles/AIFeedbackScreenStyles";

// Reusable collapsible card component
const CollapsibleCard = ({ title, children, icon, borderColor }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          !isCollapsed && styles.sectionHeaderBorder,
          borderColor && { borderLeftColor: borderColor, borderLeftWidth: 3 },
        ]}
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#666"
            style={styles.sectionIcon}
          />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          size={20}
          color="#666"
        />
      </TouchableOpacity>
      {!isCollapsed && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const AIFeedbackScreen = () => {
  const {
    schedules = {},
    tasks = {},
    aiReports = {},
    generateAIFeedback,
    selectedDate,
    earnedBadges,
    setSelectedDate,
    studySessions = {},
    isPremiumUser = false,
    goalTargets,
    getCurrentGoals,
  } = usePlanner() || {};

  const [activeTab, setActiveTab] = useState("daily"); // 'daily', 'weekly', 'monthly'
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const autoRefreshTimer = useRef(null);
  const navigation = useNavigation();

  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState("all");
  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
  };

  // Premium upgrade handler
  const handleUpgrade = useCallback(() => {
    Alert.alert(
      "프리미엄 기능",
      "AI 심층 분석은 프리미엄 사용자만 이용할 수 있습니다. 프리미엄으로 업그레이드하면 더 자세한 분석과 인사이트를 제공받을 수 있습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "업그레이드 안내",
          onPress: () => {
            Alert.alert(
              "프리미엄 구독 안내",
              "프리미엄 구독은 앱스토어에서 가능합니다. 더 자세한 정보는 앱 설정에서 확인하세요."
            );
          },
        },
      ]
    );
  }, []);

  // Remove this function as it's now handled directly in the useEffect

  // Goal section component
  const GoalSection = useCallback(() => {
    if (!currentReport) return null;

    // Get goal info from current report
    const goalInfo = currentReport.upcomingGoalsInfo || [];

    // Return null if no goals
    if (!goalInfo || goalInfo.length === 0) {
      return null;
    }

    return (
      <CollapsibleCard title="D-Day 현황" icon="flag-outline">
        {goalInfo.map((goal, index) => {
          let badgeStyle;

          if (goal.daysLeft === 0) {
            badgeStyle = styles.dDayToday;
          } else if (goal.daysLeft <= 7) {
            badgeStyle = styles.dDayNear;
          } else {
            badgeStyle = styles.dDayFar;
          }

          return (
            <View key={index} style={styles.goalDetailCard}>
              <View style={styles.goalDetailHeader}>
                <Text style={styles.goalDetailTitle}>{goal.title}</Text>
                <View style={[styles.dDayBadgeSmall, badgeStyle]}>
                  <Text style={styles.dDayBadgeText}>{goal.dDayText}</Text>
                </View>
              </View>
              <Text style={styles.goalDetailMessage}>{goal.message}</Text>
            </View>
          );
        })}
      </CollapsibleCard>
    );
  }, [currentReport, styles]);

  // Set up report scheduling when app starts
  useEffect(() => {
    try {
      updateReportScheduling(isPremiumUser);
    } catch (error) {
      console.error("Error setting up report scheduling:", error);
    }
  }, [isPremiumUser]);

  // Split effects to prevent infinite loops

  // Effect 1: Initial data loading when tab or date changes
  useEffect(() => {
    loadReportData();
    // Set up auto-refresh timer when tab or date changes
    setupAutoRefresh();

    // Clean up timer on unmount or when dependencies change
    return () => {
      if (autoRefreshTimer.current) {
        clearTimeout(autoRefreshTimer.current);
      }
    };
  }, [loadReportData, setupAutoRefresh]); // These callbacks have their own dependency arrays

  // 자동 리프레시 타이머 설정 함수 개선
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

    console.log(
      `${activeTab} 리포트 자동 갱신 타이머 설정: ${
        refreshIntervals[activeTab] / 60000
      }분 후 갱신`
    );

    // 현재 탭에 맞는 타이머 설정
    autoRefreshTimer.current = setTimeout(() => {
      console.log(`${activeTab} 리포트 자동 갱신 실행`);
      handleGenerateFeedback(false); // 자동 갱신은 항상 기본 분석 사용
    }, refreshIntervals[activeTab]);
  };

  // Load report data
  const loadReportData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 데이터 유효성 확인
      if (!schedules || !tasks || !studySessions) {
        console.warn("필요한 데이터가 아직 로드되지 않았습니다.");
        setTimeout(loadReportData, 500); // 0.5초 후 재시도
        return;
      }

      console.log("리포트 데이터 로드 시작:", activeTab, selectedDate);
      let report = null;

      if (aiReports && Object.keys(aiReports).length > 0) {
        if (activeTab === "daily") {
          report = aiReports[selectedDate];
        } else if (activeTab === "weekly") {
          const weekKey = `week-${format(
            new Date(selectedDate),
            "yyyy-MM-dd"
          )}`;
          report = aiReports[weekKey];
        } else if (activeTab === "monthly") {
          const monthKey = `month-${format(new Date(selectedDate), "yyyy-MM")}`;
          report = aiReports[monthKey];
        }
      }

      if (!report) {
        // Generate new report if none exists, but avoid the circular dependency
        if (generateAIFeedback) {
          report = await generateAIFeedback(
            selectedDate,
            activeTab,
            false,
            isPremiumUser
          );

          if (report) {
            setCurrentReport(report);
            setLastUpdateTime(new Date());
          }
        }
      } else {
        setCurrentReport(report);
        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [aiReports, selectedDate, activeTab, generateAIFeedback, isPremiumUser]);

  // Generate feedback
  const handleGenerateFeedback = useCallback(
    async (useAI = false) => {
      setIsLoading(true);
      try {
        if (!generateAIFeedback) {
          throw new Error("generateAIFeedback function not available");
        }

        const report = await generateAIFeedback(
          selectedDate,
          activeTab,
          useAI,
          isPremiumUser
        );

        if (report) {
          setCurrentReport(report);
          setLastUpdateTime(new Date());
          // Don't call setupAutoRefresh here to break circular dependency
        }
      } catch (error) {
        console.error("Error generating report:", error);
        Alert.alert(
          "오류 발생",
          "리포트 생성 중 문제가 발생했습니다. 다시 시도해주세요."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedDate,
      activeTab,
      isPremiumUser,
      generateAIFeedback,
      // Remove setupAutoRefresh and updateAchievementBadges from dependencies
    ]
  );

  // Tab change handler
  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

  // Format date utility function
  const formatLastUpdateTime = useCallback((date) => {
    return format(date, "yyyy년 MM월 dd일 HH:mm");
  }, []);

  // Weekly report extra content
  const renderWeeklyExtraContent = useMemo(() => {
    if (activeTab !== "weekly" || !currentReport) {
      return null;
    }

    return (
      <View style={styles.weeklyExtraContainer}>
        {/* Study time chart */}
        {currentReport.dailyStudyTime && (
          <WeeklyStudyChart dailyStudyTime={currentReport.dailyStudyTime} />
        )}

        {/* Weekly theme section */}
        <CollapsibleCard
          title="이번 주 테마"
          icon="flash"
          borderColor={THEME_COLORS.premium}
        >
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
        </CollapsibleCard>

        {/* Schedule insights section */}
        <CollapsibleCard
          title="일정 인사이트"
          icon="calendar"
          borderColor={THEME_COLORS.info}
        >
          {isPremiumUser ? (
            <>
              <Text style={styles.scheduleInsightsText}>
                {currentReport.scheduleInsights ||
                  "데이터를 분석하고 있습니다..."}
              </Text>

              {/* Schedule type distribution */}
              {currentReport.scheduleTypeCount && (
                <View style={styles.scheduleTypesContainer}>
                  <Text style={styles.scheduleTypesTitle}>일정 유형 분포</Text>
                  <View style={styles.scheduleTypesChart}>
                    {Object.entries(currentReport.scheduleTypeCount)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => {
                        const total = Object.values(
                          currentReport.scheduleTypeCount
                        ).reduce((sum, val) => sum + val, 0);
                        const percentage = Math.round((count / total) * 100);
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
                                    backgroundColor: getColor(
                                      "scheduleType",
                                      type
                                    ),
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
        </CollapsibleCard>
      </View>
    );
  }, [
    activeTab,
    currentReport,
    isPremiumUser,
    handleUpgrade,
    THEME_COLORS,
    styles,
    getColor,
  ]);

  // Monthly report extra content
  const renderMonthlyExtraContent = useMemo(() => {
    if (
      activeTab !== "monthly" ||
      !currentReport ||
      !currentReport.monthlyOverview
    ) {
      return null;
    }

    return (
      <View style={styles.monthlyExtraContainer}>
        {/* Subject study time chart */}
        {currentReport.subjectAnalysis && (
          <MonthlySubjectChart
            subjectAnalysis={currentReport.subjectAnalysis}
          />
        )}

        <CollapsibleCard title="월간 개요" icon="analytics">
          <Text style={styles.overviewText}>
            {currentReport.monthlyOverview ||
              "이번 달 활동 데이터를 분석했습니다."}
          </Text>
        </CollapsibleCard>

        <CollapsibleCard title="이번 달 테마" icon="star" borderColor="#FFD700">
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
        </CollapsibleCard>

        {currentReport.productivityScore && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>생산성 점수</Text>
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
          </View>
        )}

        {/* Schedule pattern insights section */}
        {currentReport.schedulePatternInsights && (
          <CollapsibleCard
            title="일정 패턴 분석"
            icon="analytics"
            borderColor={THEME_COLORS.success}
          >
            <Text style={styles.schedulePatternText}>
              {currentReport.schedulePatternInsights}
            </Text>

            {/* Schedule distribution by day */}
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

            {/* Schedule distribution by time slot */}
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
                                    backgroundColor: getColor(
                                      "timeSlot",
                                      timeSlot
                                    ),
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

            {/* Frequently recurring tasks */}
            {currentReport.frequentTasks &&
              Array.isArray(currentReport.frequentTasks) &&
              currentReport.frequentTasks.length > 0 && (
                <View style={styles.frequentTasksContainer}>
                  <Text style={styles.frequentTasksTitle}>
                    자주 반복되는 일정
                  </Text>
                  <View style={styles.frequentTasksList}>
                    {currentReport.frequentTasks.map((task, index) => (
                      <View key={index} style={styles.frequentTaskItem}>
                        <Text style={styles.frequentTaskName}>
                          {task && task.task ? task.task : "-"}
                        </Text>
                        <View style={styles.frequentTaskCountContainer}>
                          <Text style={styles.frequentTaskCount}>
                            {task && task.count ? `${task.count}회` : "0회"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
          </CollapsibleCard>
        )}

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
  }, [activeTab, currentReport, THEME_COLORS, styles, getColor]);

  // Render report content
  const renderReport = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
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

          {/* AI analysis badge */}
          {currentReport && currentReport.isAIGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI 분석</Text>
            </View>
          )}
        </View>

        {/* Daily report sections */}
        {activeTab === "daily" && (
          <>
            {/* Chart */}
            {studySessions && studySessions[selectedDate] && (
              <DailyStudyChart studySessions={studySessions[selectedDate]} />
            )}

            {/* 1. Goal status */}
            <GoalSection />

            {/* 3. Insights */}
            <CollapsibleCard title="인사이트" icon="bulb-outline">
              <Text style={styles.insightText}>
                {currentReport.insights || "데이터 분석 중..."}
              </Text>
            </CollapsibleCard>

            {/* Key statistics */}
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
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {currentReport.mostProductiveTime || "N/A"}
                  </Text>
                  <Text style={styles.statLabel}>생산성 높은 시간</Text>
                </View>
              </View>
            </View>

            {/* Category analysis */}
            {currentReport.subjectAnalysis &&
              Object.keys(currentReport.subjectAnalysis).length > 0 && (
                <CollapsibleCard title="카테고리별 분석" icon="pie-chart">
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
                              <Text style={styles.categoryName}>
                                {category}
                              </Text>
                              <Text style={styles.categoryTime}>
                                {hours}시간
                              </Text>
                            </View>
                            <View style={styles.progressContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${percentage}%`,
                                    backgroundColor: getColor(
                                      "category",
                                      category
                                    ),
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </CollapsibleCard>
              )}

            {/* 4. Improvement suggestions */}
            <CollapsibleCard
              title="개선 제안"
              icon="trending-up"
              borderColor="#f0f8ff"
            >
              {/* General recommendations */}
              <Text style={styles.recommendationText}>
                {currentReport.recommendations ||
                  "충분한 데이터가 쌓이면 제안을 드릴게요."}
              </Text>
            </CollapsibleCard>
          </>
        )}

        {/* Weekly report additional content */}
        {renderWeeklyExtraContent}

        {/* Monthly report additional content */}
        {renderMonthlyExtraContent}

        {/* Weekly/monthly report common sections (shown only for non-daily reports) */}
        {activeTab !== "daily" && (
          <>
            <CollapsibleCard title="인사이트" icon="bulb-outline">
              <Text style={styles.insightText}>
                {currentReport.insights || "데이터 분석 중..."}
              </Text>
            </CollapsibleCard>

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
                {activeTab === "weekly" ? (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {currentReport.mostProductiveDay
                        ? format(
                            new Date(currentReport.mostProductiveDay),
                            "EEE",
                            {
                              locale: ko,
                            }
                          )
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

            {currentReport.subjectAnalysis &&
              Object.keys(currentReport.subjectAnalysis).length > 0 && (
                <CollapsibleCard title="카테고리별 분석" icon="pie-chart">
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
                              <Text style={styles.categoryName}>
                                {category}
                              </Text>
                              <Text style={styles.categoryTime}>
                                {hours}시간
                              </Text>
                            </View>
                            <View style={styles.progressContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${percentage}%`,
                                    backgroundColor: getColor(
                                      "category",
                                      category
                                    ),
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </CollapsibleCard>
              )}

            {/* Daily progress for weekly report */}
            {activeTab === "weekly" && currentReport.dailyCompletionRate && (
              <CollapsibleCard title="일별 진행 상황" icon="calendar">
                <View style={styles.weeklyChart}>
                  {Object.entries(currentReport.dailyCompletionRate)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([date, rate]) => {
                      const dayName = format(new Date(date), "EEE", {
                        locale: ko,
                      });
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
              </CollapsibleCard>
            )}

            <CollapsibleCard
              title={activeTab === "monthly" ? "장기적 개선 방향" : "개선 제안"}
              icon="trending-up"
              borderColor="#f0f8ff"
            >
              <Text style={styles.recommendationText}>
                {activeTab === "monthly"
                  ? currentReport.longTermRecommendations ||
                    "충분한 데이터가 쌓이면 제안을 드릴게요."
                  : currentReport.recommendations ||
                    "충분한 데이터가 쌓이면 제안을 드릴게요."}
              </Text>
            </CollapsibleCard>
          </>
        )}

        {/* Refresh button for daily report */}
        {activeTab === "daily" && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => handleGenerateFeedback(false)}
          >
            <Text style={styles.refreshButtonText}>리포트 새로고침</Text>
          </TouchableOpacity>
        )}

        {/* AI analysis button for weekly/monthly reports (premium) */}
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

        {/* Auto-update info */}
        <View style={styles.autoUpdateContainer}>
          <Text style={styles.autoUpdateInfo}>
            {activeTab === "daily"
              ? "일간 리포트는 5분마다 자동으로 갱신됩니다."
              : activeTab === "weekly"
              ? "주간 리포트는 하루마다 자동으로 갱신됩니다."
              : "월간 리포트는 일주일마다 자동으로 갱신됩니다."}
          </Text>
          <Text style={styles.lastUpdateInfo}>
            마지막 갱신: {formatLastUpdateTime(lastUpdateTime)}
          </Text>
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </View>
    );
  }, [
    isLoading,
    currentReport,
    activeTab,
    selectedDate,
    studySessions,

    handleGenerateFeedback,
    isPremiumUser,
    handleUpgrade,
    formatLastUpdateTime,
    lastUpdateTime,
    renderWeeklyExtraContent,
    renderMonthlyExtraContent,
    GoalSection,

    THEME_COLORS,
    styles,
    getColor,
    ko,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        navigation={navigation}
        badgeCount={earnedBadges?.length || 0}
        notificationCount={0}
      />

      {/* 수정된 탭 컨테이너 */}
      <View style={styles.tabContainerWithUpgrade}>
        <View style={styles.tabsSection}>
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

        {/* 업그레이드 버튼을 오른쪽으로 정렬 */}
        <TouchableOpacity
          style={styles.upgradeProBadge}
          onPress={handleUpgrade}
        >
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.upgradeProText}>업그레이드</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderReport}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AIFeedbackScreen;
