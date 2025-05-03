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
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlanner } from "../context/PlannerContext";
import { format, sub, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { useNavigation } from "@react-navigation/native";
import HeaderBar from "../components/layout/HeaderBar";
import { useSubscription } from "../context/SubscriptionContext";
import { useProgress } from "../context/ProgressContext";
import { ToastEventSystem } from "../components/common/AutoToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnhancedFeedbackService from "../services/ImprovedFeedbackService";

// Chart components
import {
  DailyStudyChart,
  WeeklyStudyChart,
  MonthlySubjectChart,
} from "../components/reports/SimpleCharts";

// Import styles
import {
  THEME_COLORS,
  getColor,
  badgeStyles,
  styles,
  additionalStyles,
} from "../styles/AIFeedbackScreenStyles";

// 리포트 타입 상수
const REPORT_TYPES = EnhancedFeedbackService.REPORT_TYPES;

// 스토리지 키 상수
const STORAGE_KEYS = {
  LAST_VIEWED_WEEKLY: "@last_viewed_weekly_report",
  LAST_VIEWED_MONTHLY: "@last_viewed_monthly_report",
  NOTIFICATIONS_SETUP: "report_notifications_setup",
};

// 자동 갱신 주기 (밀리초)
const AUTO_REFRESH_INTERVALS = EnhancedFeedbackService.AUTO_REFRESH_INTERVALS;

/**
 * 접을 수 있는 카드 컴포넌트
 */
const CollapsibleCard = ({
  title,
  children,
  icon,
  borderColor,
  initiallyExpanded = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!initiallyExpanded);

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

/**
 * 목표 및 D-Day 섹션 컴포넌트
 */
const GoalSection = ({ goalTargets }) => {
  // 목표 데이터 처리
  const processedGoals = useMemo(() => {
    return EnhancedFeedbackService.processGoalsForReport(goalTargets);
  }, [goalTargets]);

  const hasGoals = processedGoals && processedGoals.length > 0;

  return (
    <CollapsibleCard
      title="D-Day 현황"
      icon="flag-outline"
      initiallyExpanded={true}
    >
      {hasGoals ? (
        processedGoals.map((goal, index) => {
          let badgeStyle;

          if (goal.daysLeft === 0) {
            badgeStyle = styles.dDayToday;
          } else if (goal.daysLeft <= 7) {
            badgeStyle = styles.dDayNear;
          } else {
            badgeStyle = styles.dDayFar;
          }

          return (
            <View key={goal.id || index} style={styles.goalDetailCard}>
              <View style={styles.goalDetailHeader}>
                <Text style={styles.goalDetailTitle}>{goal.title}</Text>
                <View style={[styles.dDayBadgeSmall, badgeStyle]}>
                  <Text style={styles.dDayBadgeText}>{goal.dDayText}</Text>
                </View>
              </View>
              <Text style={styles.goalDetailMessage}>{goal.message}</Text>
            </View>
          );
        })
      ) : (
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text style={{ color: "#666", fontStyle: "italic" }}>
            예정된 D-Day 일정이 없습니다.
          </Text>
          <Text
            style={{
              color: "#888",
              fontSize: 12,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            목표나 중요 일정을 등록하면 여기에 표시됩니다.
          </Text>
        </View>
      )}
    </CollapsibleCard>
  );
};

/**
 * 오늘의 일정 및 공부 컴포넌트
 */
const TodayScheduleAndStudy = ({ studySessions, schedules, selectedDate }) => {
  // 오늘의 일정 가져오기
  const todaySchedules = useMemo(() => {
    return schedules[selectedDate] || [];
  }, [schedules, selectedDate]);

  // 오늘의 공부 세션 가져오기
  const todayStudySessions = useMemo(() => {
    return studySessions[selectedDate] || [];
  }, [studySessions, selectedDate]);

  // 데이터 없음 체크
  const hasNoData =
    todaySchedules.length === 0 && todayStudySessions.length === 0;

  // 총 공부 시간 계산
  const totalStudyTime = useMemo(() => {
    return todayStudySessions.reduce(
      (total, session) => total + session.duration,
      0
    );
  }, [todayStudySessions]);

  // 시간 포맷 함수
  const formatLongTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 과목별 공부 시간 그룹화
  const subjectTimes = useMemo(() => {
    const result = {};
    todayStudySessions.forEach((session) => {
      const subject = session.subject || "공부시간";
      if (!result[subject]) {
        result[subject] = 0;
      }
      result[subject] += session.duration;
    });
    return result;
  }, [todayStudySessions]);

  // 시간별 일정 그룹화
  const schedulesByTime = useMemo(() => {
    const result = {};

    // 일정 그룹화
    todaySchedules.forEach((schedule) => {
      const hour = schedule.startTime?.split(":")[0] || "00";
      const timeSlot = `${hour}시`;

      if (!result[timeSlot]) {
        result[timeSlot] = { schedules: [], studySessions: [] };
      }

      result[timeSlot].schedules.push(schedule);
    });

    // 공부 세션 시간별 그룹화
    todayStudySessions.forEach((session) => {
      if (session.timestamp) {
        const date = new Date(session.timestamp);
        const hour = date.getHours();
        const timeSlot = `${hour}시`;

        if (!result[timeSlot]) {
          result[timeSlot] = { schedules: [], studySessions: [] };
        }

        result[timeSlot].studySessions.push(session);
      }
    });

    return result;
  }, [todaySchedules, todayStudySessions]);

  // 데이터 없음 상태 표시
  if (hasNoData) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: "#666", fontStyle: "italic" }}>
          오늘의 일정과 공부 기록이 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 8 }}>
      {/* 총 공부 시간 */}
      {totalStudyTime > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 8,
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#333" }}>
            오늘 총 공부시간:
          </Text>
          <Text style={{ fontWeight: "bold", color: "#50cebb" }}>
            {formatLongTime(totalStudyTime)}
          </Text>
        </View>
      )}

      {/* 과목별 공부 시간 */}
      {Object.keys(subjectTimes).length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}>
            과목별 공부시간:
          </Text>
          {Object.entries(subjectTimes).map(([subject, duration], index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#555" }}>{subject}</Text>
              <Text style={{ color: "#50cebb" }}>
                {formatLongTime(duration)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 시간대별 활동 */}
      <Text
        style={{
          fontWeight: "bold",
          marginBottom: 8,
          marginTop: 8,
          color: "#333",
        }}
      >
        시간대별 활동:
      </Text>
      {Object.entries(schedulesByTime)
        .sort(([a], [b]) => a.localeCompare(b)) // 시간순 정렬
        .map(([timeSlot, data], index) => (
          <View
            key={index}
            style={{
              marginBottom: 12,
              borderLeftWidth: 3,
              borderLeftColor: "#50cebb",
              paddingLeft: 8,
            }}
          >
            <Text
              style={{ fontWeight: "bold", color: "#333", marginBottom: 4 }}
            >
              {timeSlot}
            </Text>

            {/* 해당 시간대 일정 */}
            {data.schedules.map((schedule, idx) => (
              <View
                key={`schedule-${idx}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="#666"
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: "#555" }}>
                  {schedule.startTime} - {schedule.endTime} {schedule.task}
                </Text>
              </View>
            ))}

            {/* 해당 시간대 공부 세션 */}
            {data.studySessions.map((session, idx) => (
              <View
                key={`study-${idx}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  color="#50cebb"
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: "#555" }}>
                  {session.subject || "공부"} (
                  {formatLongTime(session.duration)})
                </Text>
              </View>
            ))}
          </View>
        ))}
    </View>
  );
};

/**
 * 자동 리포트 알림 정보 카드
 */
const AutomaticReportInfoCard = ({
  isSubscribed,
  activeTab,
  notificationsSetup,
}) => {
  if (!isSubscribed || activeTab === REPORT_TYPES.DAILY) {
    return null;
  }

  // 주간/월간에 따른 다른 내용
  const title =
    activeTab === REPORT_TYPES.WEEKLY
      ? "주간 상세 리포트 자동 생성"
      : "월간 상세 리포트 자동 생성";

  const message =
    activeTab === REPORT_TYPES.WEEKLY
      ? "매주 일요일 밤 9시에 자동으로 상세 분석 리포트가 생성됩니다. 지난 주의 활동을 종합적으로 분석한 보고서를 확인하세요."
      : "매월 마지막 날 밤 9시에 자동으로 상세 분석 리포트가 생성됩니다. 한 달간의 활동을 심층 분석한 보고서가 저장됩니다.";

  return (
    <View style={additionalStyles.notificationCard}>
      <View style={additionalStyles.notificationHeader}>
        <Ionicons name="notifications" size={20} color="#FFB74D" />
        <Text style={additionalStyles.notificationTitle}>{title}</Text>
      </View>
      <Text style={additionalStyles.notificationMessage}>{message}</Text>
      <Text style={additionalStyles.notificationHint}>
        {notificationsSetup
          ? "알림이 설정되어 있습니다. 새 리포트가 생성되면 자동으로 알려드립니다."
          : "알림 설정에 문제가 있습니다. 앱을 재시작하거나 설정을 확인해주세요."}
      </Text>
    </View>
  );
};

/**
 * 피드백 화면 메인 컴포넌트
 */
const AIFeedbackScreen = () => {
  // 컨텍스트에서 데이터 가져오기
  const {
    schedules = {},
    tasks = {},
    aiReports = {},
    generateAIFeedback,
    selectedDate,
    earnedBadges,
    setSelectedDate,
    studySessions = {},
    goalTargets = [],
  } = usePlanner() || {};

  // 구독 상태
  const { isSubscribed } = useSubscription();

  // 포인트 및 진행 정보
  const { points } = useProgress();

  // 상태 관리
  const [activeTab, setActiveTab] = useState(REPORT_TYPES.DAILY);
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedWeeklyReports, setSavedWeeklyReports] = useState({});
  const [savedMonthlyReports, setSavedMonthlyReports] = useState({});
  const [notificationsSetup, setNotificationsSetup] = useState(false);

  // 참조
  const autoRefreshTimer = useRef(null);
  const initializedRef = useRef(false);
  const navigation = useNavigation();

  // 구독 페이지로 이동
  const handleUpgrade = useCallback(() => {
    navigation.navigate("Subscription");
  }, [navigation]);

  // 저장된 리포트 로드
  const loadSavedReports = useCallback(async () => {
    try {
      const weeklyReports = await EnhancedFeedbackService.getSavedAIReports(
        REPORT_TYPES.WEEKLY
      );
      const monthlyReports = await EnhancedFeedbackService.getSavedAIReports(
        REPORT_TYPES.MONTHLY
      );

      setSavedWeeklyReports(weeklyReports);
      setSavedMonthlyReports(monthlyReports);

      // 알림 설정 상태 확인
      const notificationsStatus = await AsyncStorage.getItem(
        STORAGE_KEYS.NOTIFICATIONS_SETUP
      );
      setNotificationsSetup(notificationsStatus === "true");

      console.log(
        `${Object.keys(weeklyReports).length}개의 주간 리포트와 ${
          Object.keys(monthlyReports).length
        }개의 월간 리포트를 로드했습니다.`
      );
    } catch (error) {
      console.error("저장된 리포트 로드 오류:", error);
    }
  }, []);

  // 리포트 스케줄링 설정
  const setupReportScheduling = useCallback(async () => {
    // 이미 초기화되었으면 중복 실행 방지
    if (initializedRef.current) {
      console.log("알림 설정이 이미 초기화되었습니다");
      return;
    }

    // 알림 상태 및 구독 상태 확인
    try {
      const notificationStatus = await AsyncStorage.getItem(
        STORAGE_KEYS.NOTIFICATIONS_SETUP
      );
      const isAlreadySetup = notificationStatus === "true";

      // 설정 상태와 구독 상태가 일치하면 다시 설정할 필요 없음
      if (isAlreadySetup && isSubscribed) {
        setNotificationsSetup(true);
        initializedRef.current = true;
        return;
      }
    } catch (error) {
      console.error("알림 설정 상태 확인 오류:", error);
    }

    // 리포트 스케줄링 업데이트
    const success = await EnhancedFeedbackService.updateReportScheduling(
      isSubscribed
    );
    setNotificationsSetup(success);

    if (success && isSubscribed) {
      ToastEventSystem.showToast(
        "주간 및 월간 상세 리포트 알림이 설정되었습니다",
        3000
      );
    }

    // 초기화 완료 표시
    initializedRef.current = true;
  }, [isSubscribed]);

  // 자동 갱신 타이머 설정
  const setupAutoRefresh = useCallback(() => {
    // 기존 타이머 해제
    if (autoRefreshTimer.current) {
      clearTimeout(autoRefreshTimer.current);
    }

    console.log(
      `${activeTab} 리포트 자동 갱신 타이머 설정: ${
        AUTO_REFRESH_INTERVALS[activeTab] / 60000
      }분`
    );

    // 현재 탭에 맞는 새 타이머 설정
    autoRefreshTimer.current = setTimeout(() => {
      console.log(`${activeTab} 리포트 자동 갱신 중`);
      handleGenerateFeedback(false); // 자동 갱신은 기본 분석만
    }, AUTO_REFRESH_INTERVALS[activeTab]);
  }, [activeTab, handleGenerateFeedback]);

  // 리포트 데이터 로드
  const loadReportData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!schedules || !tasks) {
        console.warn("필요한 데이터가 아직 로드되지 않았습니다");
        setTimeout(loadReportData, 500); // 0.5초 후 재시도
        return;
      }

      console.log("리포트 데이터 로드 중:", activeTab, selectedDate);
      let report = null;

      // 먼저 메모리에서 기존 리포트 찾기
      if (aiReports && Object.keys(aiReports).length > 0) {
        if (activeTab === REPORT_TYPES.DAILY) {
          report = aiReports[selectedDate];
        } else if (activeTab === REPORT_TYPES.WEEKLY) {
          const weekKey = `week-${format(
            new Date(selectedDate),
            "yyyy-MM-dd"
          )}`;
          report = aiReports[weekKey];
        } else if (activeTab === REPORT_TYPES.MONTHLY) {
          const monthKey = `month-${format(new Date(selectedDate), "yyyy-MM")}`;
          report = aiReports[monthKey];
        }
      }

      // 메모리에 없으면 스토리지에서 리포트 로드 시도
      if (
        !report &&
        (activeTab === REPORT_TYPES.WEEKLY ||
          activeTab === REPORT_TYPES.MONTHLY)
      ) {
        let savedReports;
        let reportKey;

        if (activeTab === REPORT_TYPES.WEEKLY) {
          // 주간 키 계산
          const date = new Date(selectedDate);
          const year = date.getFullYear();
          const weekNumber = Math.ceil(
            (date.getDate() + 6 - date.getDay()) / 7
          );
          reportKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;
          savedReports = savedWeeklyReports;
        } else {
          // 월간 키 계산
          reportKey = format(new Date(selectedDate), "yyyy-MM");
          savedReports = savedMonthlyReports;
        }

        if (savedReports && savedReports[reportKey]) {
          report = savedReports[reportKey];
          console.log(`저장된 ${activeTab} 리포트 로드: ${reportKey}`);
        }
      }

      // 리포트가 여전히 없으면 새로 생성
      if (!report) {
        if (generateAIFeedback) {
          // 모든 사용자에게 기본 분석 생성
          report = await generateAIFeedback(
            selectedDate,
            activeTab,
            false, // 초기 생성에는 상세 분석 사용 안 함
            isSubscribed // 구독 상태 전달
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
      console.error("리포트 데이터 로드 오류:", error);
      ToastEventSystem.showToast("데이터 로드 중 오류가 발생했습니다", 2000);
    } finally {
      setIsLoading(false);
    }
  }, [
    aiReports,
    selectedDate,
    activeTab,
    generateAIFeedback,
    isSubscribed,
    schedules,
    tasks,
    savedWeeklyReports,
    savedMonthlyReports,
  ]);

  // 피드백 생성 핸들러
  const handleGenerateFeedback = useCallback(
    async (useAI = false) => {
      // 상세 분석에 대한 구독 확인
      if (activeTab !== REPORT_TYPES.DAILY && useAI && !isSubscribed) {
        ToastEventSystem.showToast("상세 분석은 구독자 전용 기능입니다", 2000);
        handleUpgrade();
        return;
      }

      setIsLoading(true);
      try {
        if (!generateAIFeedback) {
          throw new Error("generateAIFeedback 함수를 사용할 수 없습니다");
        }

        // 리포트 생성
        const report = await generateAIFeedback(
          selectedDate,
          activeTab,
          useAI,
          isSubscribed
        );

        if (report) {
          setCurrentReport(report);
          setLastUpdateTime(new Date());

          // 상세 분석 리포트 저장 (주간 및 월간)
          if (
            useAI &&
            (activeTab === REPORT_TYPES.WEEKLY ||
              activeTab === REPORT_TYPES.MONTHLY)
          ) {
            // EnhancedFeedbackService의 리포트 저장 함수 사용
            await EnhancedFeedbackService.saveReport(
              selectedDate,
              activeTab,
              report
            );

            // 저장된 리포트 다시 로드
            const updatedReports =
              await EnhancedFeedbackService.getSavedAIReports(activeTab);
            if (activeTab === REPORT_TYPES.WEEKLY) {
              setSavedWeeklyReports(updatedReports);
            } else {
              setSavedMonthlyReports(updatedReports);
            }

            // 확인 메시지 표시
            ToastEventSystem.showToast(
              `${
                activeTab === REPORT_TYPES.WEEKLY ? "주간" : "월간"
              } 상세 리포트가 저장되었습니다`,
              2000
            );
          }
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
    },
    [activeTab, selectedDate, isSubscribed, generateAIFeedback, handleUpgrade]
  );

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tabName) => {
      // 모든 탭으로 전환 가능
      setActiveTab(tabName);

      // 비구독자가 주간/월간 탭 선택 시 알림
      if (
        (tabName === REPORT_TYPES.WEEKLY || tabName === REPORT_TYPES.MONTHLY) &&
        !isSubscribed
      ) {
        ToastEventSystem.showToast(
          `${
            tabName === REPORT_TYPES.WEEKLY ? "주간" : "월간"
          } 리포트는 일부 기능만 제공됩니다`,
          2000
        );
      }
    },
    [isSubscribed]
  );

  // 날짜 포맷 유틸리티
  const formatLastUpdateTime = useCallback(
    (date) => format(date, "yyyy년 MM월 dd일 HH:mm"),
    []
  );

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 저장된 리포트 로드
    loadSavedReports();

    // 리포트 스케줄링 설정 (한 번만)
    if (!initializedRef.current) {
      setupReportScheduling();
    }

    // 언마운트 시 타이머 정리
    return () => {
      if (autoRefreshTimer.current) {
        clearTimeout(autoRefreshTimer.current);
      }
    };
  }, [loadSavedReports, setupReportScheduling]);

  // 탭이나 날짜 변경 시 리포트 데이터 로드
  useEffect(() => {
    loadReportData();
    setupAutoRefresh();
  }, [selectedDate, activeTab, isSubscribed, loadReportData, setupAutoRefresh]);

  // 주간 리포트 추가 콘텐츠 렌더링
  const renderWeeklyExtraContent = useMemo(() => {
    if (activeTab !== REPORT_TYPES.WEEKLY || !currentReport) {
      return null;
    }

    return (
      <View style={styles.weeklyExtraContainer}>
        {/* 공부 시간 차트 */}
        {currentReport.dailyStudyTime && (
          <WeeklyStudyChart dailyStudyTime={currentReport.dailyStudyTime} />
        )}

        {/* 주간 테마 섹션 - 프리미엄 기능 */}
        <CollapsibleCard
          title="이번 주 테마"
          icon="flash"
          borderColor={THEME_COLORS.premium}
        >
          {isSubscribed ? (
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
              <Text style={styles.previewText} numberOfLines={3}>
                상세 분석을 통해 당신의 학습 패턴을 분석하여{"\n"}이번 주의
                특징과 테마를 도출합니다.{"\n"}앞으로의 집중 영역도 추천해
                드립니다.
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

        {/* 일정 인사이트 섹션 - 프리미엄 기능 */}
        <CollapsibleCard
          title="일정 인사이트"
          icon="calendar"
          borderColor={THEME_COLORS.info}
        >
          {isSubscribed ? (
            <>
              <Text style={styles.scheduleInsightsText}>
                {currentReport.scheduleInsights ||
                  "데이터를 분석하고 있습니다..."}
              </Text>

              {/* 일정 유형 분포 */}
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
                상세 분석을 통해 당신의 일정 패턴을 분석하여 생산성을 높일 수
                있는 맞춤형 인사이트를 제공합니다. 일정 유형별 분포와 균형에
                대한 조언도 확인하세요.
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
  }, [activeTab, currentReport, isSubscribed, handleUpgrade]);

  // 월간 리포트 추가 콘텐츠 렌더링
  const renderMonthlyExtraContent = useMemo(() => {
    if (
      activeTab !== REPORT_TYPES.MONTHLY ||
      !currentReport ||
      !currentReport.monthlyOverview
    ) {
      return null;
    }

    return (
      <View style={styles.monthlyExtraContainer}>
        {/* 과목별 공부 시간 차트 */}
        {currentReport.subjectAnalysis && (
          <MonthlySubjectChart
            subjectAnalysis={currentReport.subjectAnalysis}
          />
        )}

        {/* 월간 개요 - 프리미엄 기능 */}
        <CollapsibleCard title="월간 개요" icon="analytics">
          <Text style={styles.overviewText}>
            {currentReport.monthlyOverview ||
              "이번 달 활동 데이터를 분석했습니다."}
          </Text>
        </CollapsibleCard>

        {/* 월간 테마 - 프리미엄 기능 */}
        <CollapsibleCard title="이번 달 테마" icon="star" borderColor="#FFD700">
          {isSubscribed ? (
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
              <Text style={styles.previewText} numberOfLines={3}>
                상세 분석을 통해 당신의 월간 활동 데이터를 종합하여 특별한
                테마를 도출하고, 다음 달을 위한 핵심 집중 영역을 제안합니다.
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

        {/* 생산성 점수 - 프리미엄 기능 */}
        <CollapsibleCard
          title="생산성 점수"
          icon="analytics"
          borderColor={THEME_COLORS.success}
        >
          {isSubscribed && currentReport.productivityScore ? (
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
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={3}>
                상세 분석을 통해 당신의 월간 활동을 종합 평가하여 100점 만점의
                생산성 점수를 제공합니다. 월간 목표 달성도, 일정 완료율, 학습
                시간 등을 종합적으로 분석하여 객관적인 지표를 확인할 수
                있습니다.
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

        {/* 일정 패턴 분석 - 프리미엄 기능 */}
        <CollapsibleCard
          title="일정 패턴 분석"
          icon="analytics"
          borderColor={THEME_COLORS.success}
        >
          {isSubscribed ? (
            <>
              <Text style={styles.schedulePatternText}>
                {currentReport.schedulePatternInsights ||
                  "데이터를 분석하고 있습니다..."}
              </Text>

              {/* 요일별 일정 분포 */}
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

              {/* 시간대별 일정 분포 */}
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

              {/* 자주 반복되는 일정 */}
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
            </>
          ) : (
            <View style={styles.premiumPreviewContainer}>
              <Text style={styles.previewText} numberOfLines={3}>
                상세 분석을 통해 당신의 일정 패턴을 심층 분석하여 요일별,
                시간대별 생산성 패턴과 최적의 일정 배치를 제안합니다. 생산성을
                극대화할 수 있는 맞춤형 인사이트를 확인하세요.
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

        {/* 활동 통계 */}
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
  }, [activeTab, currentReport, isSubscribed, handleUpgrade]);

  // 리포트 렌더링 함수
  const renderReport = () => {
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
            {activeTab === REPORT_TYPES.DAILY
              ? "일간 리포트"
              : activeTab === REPORT_TYPES.WEEKLY
              ? "주간 리포트"
              : "월간 리포트"}
          </Text>
          <Text style={styles.reportDate}>
            {activeTab === REPORT_TYPES.DAILY
              ? format(new Date(selectedDate), "yyyy년 MM월 dd일")
              : activeTab === REPORT_TYPES.WEEKLY
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

          {/* 비구독자용 제한 배지 */}
          {(activeTab === REPORT_TYPES.WEEKLY ||
            activeTab === REPORT_TYPES.MONTHLY) &&
            !isSubscribed && (
              <View style={additionalStyles.limitedBadge}>
                <Text style={additionalStyles.limitedBadgeText}>
                  제한된 기능
                </Text>
              </View>
            )}

          {/* 구독자용 상세 분석 배지 */}
          {currentReport && currentReport.isAIGenerated && isSubscribed && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>상세 분석</Text>
            </View>
          )}
        </View>

        {/* 일간 리포트의 경우 일정 및 공부 섹션을 상단에 배치 */}
        {activeTab === REPORT_TYPES.DAILY && (
          <>
            {/* 일일 공부 세션 차트 */}
            <DailyStudyChart studySessions={studySessions[selectedDate]} />

            {/* 오늘의 일정 및 공부 컴포넌트 */}
            <CollapsibleCard
              title="오늘의 일정 및 공부"
              icon="today-outline"
              borderColor="#50cebb"
              initiallyExpanded={true}
            >
              <TodayScheduleAndStudy
                studySessions={studySessions}
                schedules={schedules}
                selectedDate={selectedDate}
              />
            </CollapsibleCard>

            {/* D-Day 상태 섹션 */}
            <GoalSection goalTargets={goalTargets} />
          </>
        )}

        {/* 자동 리포트 정보 (구독자용) */}
        <AutomaticReportInfoCard
          isSubscribed={isSubscribed}
          activeTab={activeTab}
          notificationsSetup={notificationsSetup}
        />

        {/* 주간 리포트 추가 콘텐츠 */}
        {renderWeeklyExtraContent}

        {/* 월간 리포트 추가 콘텐츠 */}
        {renderMonthlyExtraContent}

        {/* 모든 리포트 유형 공통 섹션 */}
        <CollapsibleCard title="인사이트" icon="bulb-outline">
          <Text style={styles.insightText}>
            {currentReport.insights || "데이터 분석 중..."}
          </Text>
        </CollapsibleCard>

        {/* 주요 통계 */}
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
                {activeTab === REPORT_TYPES.DAILY
                  ? currentReport.mostProductiveTime || "N/A"
                  : activeTab === REPORT_TYPES.WEEKLY
                  ? currentReport.mostProductiveDay
                    ? format(new Date(currentReport.mostProductiveDay), "EEE", {
                        locale: ko,
                      })
                    : "N/A"
                  : currentReport.avgDailyHours || "0"}
                시간
              </Text>
              <Text style={styles.statLabel}>
                {activeTab === REPORT_TYPES.DAILY
                  ? "생산성 높은 시간"
                  : activeTab === REPORT_TYPES.WEEKLY
                  ? "최고 생산성 날짜"
                  : "일평균 활동시간"}
              </Text>
            </View>
          </View>
        </View>

        {/* 카테고리별 분석 */}
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
                          <Text style={styles.categoryName}>{category}</Text>
                          <Text style={styles.categoryTime}>{hours}시간</Text>
                        </View>
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${percentage}%`,
                                backgroundColor: getColor("category", category),
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

        {/* 주간 리포트의 일별 진행 상황 차트 */}
        {activeTab === REPORT_TYPES.WEEKLY &&
          currentReport.dailyCompletionRate && (
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

        {/* 개선 제안 */}
        <CollapsibleCard
          title={
            activeTab === REPORT_TYPES.MONTHLY
              ? "장기적 개선 방향"
              : "개선 제안"
          }
          icon="trending-up"
          borderColor="#f0f8ff"
        >
          <Text style={styles.recommendationText}>
            {activeTab === REPORT_TYPES.MONTHLY
              ? currentReport.longTermRecommendations ||
                "충분한 데이터가 쌓이면 제안을 드릴게요."
              : currentReport.recommendations ||
                "충분한 데이터가 쌓이면 제안을 드릴게요."}
          </Text>
        </CollapsibleCard>

        {/* 일간 리포트용 새로고침 버튼 */}
        {activeTab === REPORT_TYPES.DAILY && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => handleGenerateFeedback(false)}
          >
            <Text style={styles.refreshButtonText}>리포트 새로고침</Text>
          </TouchableOpacity>
        )}

        {/* 자동 업데이트 정보 */}
        <View style={styles.autoUpdateContainer}>
          <Text style={styles.autoUpdateInfo}>
            {activeTab === REPORT_TYPES.DAILY
              ? "일간 리포트는 5분마다 자동으로 갱신됩니다."
              : activeTab === REPORT_TYPES.WEEKLY
              ? "주간 리포트는 하루마다 자동으로 갱신됩니다."
              : "월간 리포트는 일주일마다 자동으로 갱신됩니다."}
          </Text>
          <Text style={styles.lastUpdateInfo}>
            마지막 갱신: {formatLastUpdateTime(lastUpdateTime)}
          </Text>
        </View>

        {/* 상세 분석 정보 (주간/월간) */}
        {(activeTab === REPORT_TYPES.WEEKLY ||
          activeTab === REPORT_TYPES.MONTHLY) && (
          <View style={styles.aiScheduleContainer}>
            {isSubscribed ? (
              // 구독자용 메시지
              <View style={styles.subscriberInfoContainer}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#50cebb"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.aiScheduleText}>
                  {activeTab === REPORT_TYPES.WEEKLY
                    ? "상세 분석 리포트는 매주 일요일 밤 9시에 자동 생성됩니다."
                    : "상세 분석 리포트는 매월 마지막 날 밤 9시에 자동 생성됩니다."}
                </Text>
              </View>
            ) : (
              // 비구독자용 메시지와 버튼
              <View style={styles.premiumFeatureContainer}>
                <Text style={styles.premiumFeatureText}>
                  {activeTab === REPORT_TYPES.WEEKLY
                    ? "주간 상세 분석으로 더 정확한 인사이트를 받아보세요."
                    : "월간 상세 분석으로 장기적인 패턴을 파악해보세요."}
                </Text>

                <TouchableOpacity
                  style={styles.upgradeButtonNew}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>
                    프리미엄으로 업그레이드
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        navigation={navigation}
        badgeCount={earnedBadges?.length || 0}
        notificationCount={0}
      />

      {/* 업그레이드 버튼이 있는 탭 컨테이너 */}
      <View style={styles.tabContainerWithUpgrade}>
        <View style={styles.tabsSection}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === REPORT_TYPES.DAILY && styles.activeTab,
            ]}
            onPress={() => handleTabChange(REPORT_TYPES.DAILY)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === REPORT_TYPES.DAILY && styles.activeTabText,
              ]}
            >
              일간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === REPORT_TYPES.WEEKLY && styles.activeTab,
              !isSubscribed && additionalStyles.lockedTab,
            ]}
            onPress={() => handleTabChange(REPORT_TYPES.WEEKLY)}
          >
            <View style={styles.tabLabelContainer}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === REPORT_TYPES.WEEKLY && styles.activeTabText,
                ]}
              >
                주간
              </Text>
              {!isSubscribed && (
                <Ionicons name="lock-closed" size={12} color="#FFB74D" />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === REPORT_TYPES.MONTHLY && styles.activeTab,
              !isSubscribed && additionalStyles.lockedTab,
            ]}
            onPress={() => handleTabChange(REPORT_TYPES.MONTHLY)}
          >
            <View style={styles.tabLabelContainer}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === REPORT_TYPES.MONTHLY && styles.activeTabText,
                ]}
              >
                월간
              </Text>
              {!isSubscribed && (
                <Ionicons name="lock-closed" size={12} color="#FFB74D" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 비구독자만 업그레이드 버튼 표시 */}
        {!isSubscribed && (
          <TouchableOpacity
            style={styles.upgradeProBadge}
            onPress={handleUpgrade}
          >
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.upgradeProText}>구독하기</Text>
          </TouchableOpacity>
        )}
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

export default AIFeedbackScreen;
