// src/components/reports/SingleReportView.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  formatStudyTimeNaturally,
  analyzeStudySessions,
} from "../../utils/StudyTimeFormatter";
import { ToastEventSystem } from "../common/AutoToast";
import TypingEffect from "../common/TypingEffect";

// 테마 색상 정의
const THEME_COLORS = {
  primary: "#50cebb",
  secondary: "#7678ED",
  tertiary: "#FFB74D",
  success: "#4CAF50",
  info: "#2196F3",
  warning: "#FF9800",
  danger: "#F44336",
  light: "#ECEFF1",
  dark: "#37474F",
  premium: "#E040FB",
};

// 스타일 색상 매핑 함수
const getColor = (type, key) => {
  const colorMaps = {
    category: {
      수학: "#4CAF50",
      영어: "#2196F3",
      국어: "#F44336",
      과학: "#9C27B0",
      사회: "#FF9800",
      기타: "#607D8B",
      default: "#757575",
    },
    scheduleType: {
      공부: "#4CAF50",
      휴식: "#2196F3",
      운동: "#F44336",
      약속: "#9C27B0",
      식사: "#FF9800",
      기타: "#607D8B",
      default: "#757575",
    },
    timeSlot: {
      아침: "#FF9F1C",
      오전: "#2EC4B6",
      오후: "#3D5A80",
      저녁: "#7678ED",
      밤: "#51557E",
      default: "#757575",
    },
  };

  // 해당 타입과 키에 맞는 색상 반환, 없으면 기본 색상
  return colorMaps[type]?.[key] || colorMaps[type]?.default || "#757575";
};

// 간단한 스켈레톤 로딩 구현
const SkeletonPlaceholder = ({ children }) => (
  <View style={{ opacity: 0.5 }}>{children}</View>
);

const SingleReportView = ({
  isLoading,
  currentReport,
  activeTab,
  selectedDate,
  studySessions,
  schedules,
  goalTargets,
  generateFeedback,
  isSubscribed,
  handleUpgrade,
}) => {
  // 상태 관리
  const [studyTimeText, setStudyTimeText] = useState("");
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("summary"); // summary, detail
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // 공부 시간 계산 및 데이터 처리
  useEffect(() => {
    calculateStudyTime();
  }, [selectedDate, studySessions, activeTab]);

  // 공부 시간 계산 함수 (개선됨)
  const calculateStudyTime = useCallback(() => {
    try {
      // 일별 공부 시간
      if (activeTab === "daily") {
        const todaySessions = studySessions[selectedDate] || [];

        if (todaySessions.length > 0) {
          // 세션이 여러 개인 경우 분석
          const analysisText = analyzeStudySessions(todaySessions);
          if (analysisText) {
            setStudyTimeText(analysisText);
            return;
          }

          // 총 공부 시간 계산
          const totalSeconds = todaySessions.reduce(
            (sum, session) => sum + (session.duration || 0),
            0
          );

          // 시간 포맷팅 (자연스러운 문장)
          const formattedTime = formatStudyTimeNaturally(totalSeconds);
          setStudyTimeText(formattedTime || "아직 오늘 공부 기록이 없어요");
        } else {
          setStudyTimeText("아직 오늘 공부 기록이 없어요");
        }
      } else if (activeTab === "weekly" || activeTab === "monthly") {
        // 주간/월간 공부 시간은 리포트에서 처리
        const periodText = activeTab === "weekly" ? "이번 주" : "이번 달";
        setStudyTimeText(`${periodText} 공부 기록이 업데이트 중입니다...`);
      }
    } catch (error) {
      console.error("공부 시간 계산 오류:", error);
      setStudyTimeText("공부 시간 계산 중 오류가 발생했습니다");
    }
  }, [activeTab, selectedDate, studySessions]);

  // AI 분석 요청 핸들러
  const handleAIAnalysisRequest = () => {
    // 데이터 유효성 검사
    if (activeTab === "daily") {
      const sessions = studySessions[selectedDate] || [];
      if (sessions.length === 0) {
        ToastEventSystem.showToast("분석할 공부 데이터가 없습니다", 2000);
        return;
      }
    }

    // 구독 확인 및 리포트 생성
    if (isSubscribed) {
      generateFeedback(true); // AI 분석 사용
      setShowTypingEffect(true);
    } else {
      handleUpgrade(); // 구독 페이지로 이동
    }
  };

  // 기본 분석 생성 핸들러
  const handleBasicAnalysis = () => {
    generateFeedback(false); // 기본 분석 사용
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // 날짜 포맷팅
  const formattedDate = useMemo(() => {
    try {
      if (activeTab === "daily") {
        return format(new Date(selectedDate), "yyyy년 MM월 dd일 (eee)", {
          locale: ko,
        });
      } else if (activeTab === "weekly") {
        const date = new Date(selectedDate);
        const firstDayOfWeek = new Date(date);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

        return `${format(firstDayOfWeek, "yyyy년 MM월 dd일", {
          locale: ko,
        })} ~ ${format(lastDayOfWeek, "MM월 dd일", { locale: ko })}`;
      } else if (activeTab === "monthly") {
        return format(new Date(selectedDate), "yyyy년 MM월", { locale: ko });
      }

      return format(new Date(selectedDate), "yyyy년 MM월 dd일", { locale: ko });
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return selectedDate;
    }
  }, [selectedDate, activeTab]);

  // 로딩 화면
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
        <Text style={styles.loadingText}>AI가 데이터를 분석하고 있어요...</Text>

        <SkeletonPlaceholder>
          <View style={{ marginTop: 20 }}>
            <View style={{ width: 300, height: 20, borderRadius: 4 }} />
            <View
              style={{ width: 250, height: 20, borderRadius: 4, marginTop: 8 }}
            />
            <View
              style={{ width: 320, height: 20, borderRadius: 4, marginTop: 8 }}
            />
            <View
              style={{ width: 280, height: 20, borderRadius: 4, marginTop: 8 }}
            />
          </View>
        </SkeletonPlaceholder>
      </View>
    );
  }

  // 빈 리포트 화면 (비구독자)
  if (
    !currentReport &&
    !isSubscribed &&
    (activeTab === "weekly" || activeTab === "monthly")
  ) {
    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.subscriptionRequiredContainer}>
          <Ionicons
            name="lock-closed"
            size={48}
            color={THEME_COLORS.secondary}
          />

          <Text style={styles.subscriptionRequiredTitle}>
            {activeTab === "weekly" ? "주간" : "월간"} AI 리포트
          </Text>

          <Text style={styles.subscriptionRequiredDescription}>
            {activeTab === "weekly" ? "주간" : "월간"} AI 분석 리포트를
            이용하려면 구독이 필요합니다. 구독하면 더 자세한 분석과 맞춤형 학습
            전략을 제공받을 수 있어요.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={THEME_COLORS.success}
              />
              <Text style={styles.benefitText}>
                AI가 생성한 맞춤형 학습 인사이트
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={THEME_COLORS.success}
              />
              <Text style={styles.benefitText}>
                주간/월간 공부 시간 및 패턴 분석
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={THEME_COLORS.success}
              />
              <Text style={styles.benefitText}>
                자동으로 생성되는 {activeTab === "weekly" ? "주간" : "월간"}{" "}
                보고서
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.subscribeButtonText}>구독하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // 빈 리포트 화면 (모든 사용자)
  if (!currentReport) {
    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={60} color="#ccc" />

          <Text style={styles.emptyText}>
            {activeTab === "daily"
              ? "오늘의 리포트가 아직 없습니다."
              : activeTab === "weekly"
              ? "이번 주 리포트가 아직 없습니다."
              : "이번 달 리포트가 아직 없습니다."}
          </Text>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleBasicAnalysis}
          >
            <Text style={styles.generateButtonText}>기본 리포트 생성하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // 메인 리포트 화면
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.reportContainer}>
        {/* 리포트 헤더 */}
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>
            {activeTab === "daily"
              ? "일간 리포트"
              : activeTab === "weekly"
              ? "주간 리포트"
              : "월간 리포트"}
          </Text>

          <Text style={styles.reportDate}>{formattedDate}</Text>

          {currentReport?.isAIGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>

        {/* 요약 섹션 - 학습 시간 */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
            <Ionicons
              name="time-outline"
              size={20}
              color={THEME_COLORS.primary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>총 학습 시간</Text>
          </View>

          <View style={styles.sectionContent}>
            {currentReport && currentReport.totalStudyTime ? (
              <Text style={styles.insightText}>
                {currentReport.totalStudyTime}
              </Text>
            ) : (
              <Text style={styles.insightText}>
                {studyTimeText || "아직 공부 기록이 없어요"}
              </Text>
            )}
          </View>
        </View>

        {/* 요약 섹션 - 인사이트 */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color={THEME_COLORS.primary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>학습 인사이트</Text>
          </View>

          <View style={styles.sectionContent}>
            {currentReport?.isAIGenerated && showTypingEffect ? (
              <TypingEffect
                text={
                  currentReport.insights ||
                  "오늘의 학습 데이터를 분석하여 인사이트를 제공할 수 없습니다."
                }
                style={styles.insightText}
                typingSpeed={20}
                onComplete={() => setShowTypingEffect(false)}
              />
            ) : (
              <Text style={styles.insightText}>
                {currentReport?.insights ||
                  "아직 학습 인사이트가 없습니다. 분석 버튼을 눌러 생성해보세요."}
              </Text>
            )}
          </View>
        </View>

        {/* 과목별/카테고리별 분석 섹션 */}
        {currentReport?.categoryAnalysis &&
          Object.keys(currentReport.categoryAnalysis).length > 0 && (
            <View style={styles.sectionCard}>
              <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
                <Ionicons
                  name="library-outline"
                  size={20}
                  color={THEME_COLORS.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>과목별 학습 시간</Text>
              </View>

              <View style={styles.sectionContent}>
                <View style={styles.categoryList}>
                  {Object.entries(currentReport.categoryAnalysis).map(
                    ([category, timeData]) => (
                      <View key={category} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{category}</Text>
                          <Text style={styles.categoryTime}>
                            {timeData.formattedTime}
                          </Text>
                        </View>

                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${timeData.percentage}%`,
                                backgroundColor: getColor("category", category),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )
                  )}
                </View>
              </View>
            </View>
          )}

        {/* 리포트 유형별 추가 섹션 */}
        {activeTab === "weekly" && currentReport?.weeklyData && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={THEME_COLORS.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>일별 학습 현황</Text>
            </View>

            <View style={styles.sectionContent}>
              <View style={styles.weeklyChart}>
                {Object.entries(currentReport.weeklyData).map(([day, data]) => (
                  <View key={day} style={styles.weeklyChartItem}>
                    <Text style={styles.weeklyChartDay}>{day}</Text>

                    <View style={styles.weeklyChartBarContainer}>
                      <View
                        style={[
                          styles.weeklyChartBar,
                          {
                            height: `${Math.max(5, data.percentage)}%`,
                            backgroundColor: THEME_COLORS.primary,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.weeklyChartValue}>
                      {data.shortTime}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 월간 리포트 추가 섹션 */}
        {activeTab === "monthly" && currentReport?.monthlyOverview && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={THEME_COLORS.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>월간 학습 요약</Text>
            </View>

            <View style={styles.sectionContent}>
              <Text style={styles.overviewText}>
                {currentReport.monthlyOverview}
              </Text>
            </View>
          </View>
        )}

        {/* AI 추천 섹션 */}
        {currentReport?.recommendations && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
              <Ionicons
                name="star-outline"
                size={20}
                color={THEME_COLORS.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>학습 추천</Text>
            </View>

            <View style={styles.sectionContent}>
              <Text style={styles.recommendationText}>
                {currentReport.recommendations}
              </Text>
            </View>
          </View>
        )}

        {/* 구독자 전용 섹션 - 비구독자에게는 미리보기로 표시 */}
        {!isSubscribed && activeTab !== "daily" && (
          <View style={styles.premiumPreviewContainer}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.premiumBadgeText}>프리미엄 기능</Text>
            </View>

            <Text style={styles.previewText}>
              구독하시면 AI가 생성한 심층 분석과 맞춤형 학습 전략을 확인할 수
              있습니다. 시간 패턴 분석, 효율성 점수, 집중도 평가 등 다양한
              인사이트를 제공합니다.
            </Text>

            <View style={styles.previewOverlay}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>
                  구독하고 모든 기능 이용하기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 리포트 생성 및 새로고침 버튼 */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleBasicAnalysis}
        >
          <Text style={styles.refreshButtonText}>리포트 새로고침</Text>
        </TouchableOpacity>

        {/* AI 분석 버튼 (이미 AI 분석이 아닌 경우) */}
        {!currentReport?.isAIGenerated && (
          <TouchableOpacity
            style={[
              styles.aiButton,
              !isSubscribed && activeTab !== "daily" && styles.aiButtonDisabled,
            ]}
            onPress={handleAIAnalysisRequest}
            disabled={!isSubscribed && activeTab !== "daily"}
          >
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
            <Text style={styles.aiButtonText}>AI 심층 분석 생성</Text>
          </TouchableOpacity>
        )}

        {/* 마지막 업데이트 정보 */}
        <View style={styles.autoUpdateContainer}>
          <Text style={styles.autoUpdateInfo}>
            {activeTab === "daily"
              ? "일간 리포트는 5분마다 자동으로 업데이트됩니다"
              : activeTab === "weekly"
              ? "주간 리포트는 매일 자동으로 업데이트됩니다"
              : "월간 리포트는 매주 자동으로 업데이트됩니다"}
          </Text>

          <Text style={styles.lastUpdateInfo}>
            마지막 업데이트: {format(new Date(), "yyyy.MM.dd HH:mm")}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
};

export default SingleReportView;

// 스타일 시트 직접 정의
const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  generateButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  reportContainer: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  reportDate: {
    fontSize: 16,
    color: "#666",
  },
  aiBadge: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0,
    borderBottomColor: "#eee",
  },
  sectionHeaderBorder: {
    borderBottomWidth: 1,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionContent: {
    padding: 12,
  },
  insightText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: "#333",
  },
  categoryTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: 10,
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
    width: 12,
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 4,
  },
  weeklyChartBar: {
    width: "100%",
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 6,
  },
  weeklyChartValue: {
    fontSize: 10,
    color: "#666",
  },
  overviewText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  recommendationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  premiumPreviewContainer: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9b59b6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  premiumBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  previewText: {
    fontSize: 12,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },
  previewOverlay: {
    position: "relative",
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#FFE0B2",
  },
  upgradeButton: {
    backgroundColor: THEME_COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  aiButton: {
    backgroundColor: THEME_COLORS.premium,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  aiButtonDisabled: {
    backgroundColor: "#9e9e9e",
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  autoUpdateContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  autoUpdateInfo: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  lastUpdateInfo: {
    fontSize: 11,
    color: "#aaa",
  },
  bottomSpacer: {
    height: 50,
  },
  subscriptionRequiredContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  subscriptionRequiredTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subscriptionRequiredDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsList: {
    width: "100%",
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  subscribeButton: {
    backgroundColor: THEME_COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
