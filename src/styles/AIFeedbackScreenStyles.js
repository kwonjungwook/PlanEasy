// src/styles/AIFeedbackScreenStyles.js
import { StyleSheet } from "react-native";

// 테마 색상 정의
export const THEME_COLORS = {
  primary: "#50cebb",
  secondary: "#FFB74D",
  success: "#66BB6A",
  info: "#29B6F6",
  warning: "#FFA726",
  danger: "#EF5350",
  light: "#E0E0E0",
  dark: "#424242",
  premium: "#8E24AA",
};

// 스타일 색상 매핑 함수
export const getColor = (type, key) => {
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

  // 해당 타입과 키에 맞는 색상 반환, 없으면, 기본 색상
  return colorMaps[type]?.[key] || colorMaps[type]?.default || "#757575";
};

// 배지 스타일
export const badgeStyles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

// 기본 스타일 정의
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  // 탭 관련 스타일
  tabContainerWithUpgrade: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 8,
  },
  tabsSection: {
    flexDirection: "row",
    flex: 1,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: THEME_COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    color: "#666",
  },
  activeTabText: {
    color: THEME_COLORS.primary,
    fontWeight: "600",
  },
  tabLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeProBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
    marginRight: 4,
  },
  upgradeProText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  // 빈 상태 스타일
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
  // 로딩 스타일
  loadingContainer: {
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
  // 리포트 컨테이너 스타일
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
  // 섹션 카드 스타일
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
  // 인사이트 관련 스타일
  insightText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  // 통계 카드 스타일
  statsCard: {
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
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: THEME_COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  // 카테고리 분석 스타일
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
  // 버튼 스타일
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
  // 자동 업데이트 정보 스타일
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
  // 목표 관련 스타일
  goalDetailCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  goalDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalDetailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  dDayBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  dDayBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  dDayToday: {
    backgroundColor: "#FF5252",
  },
  dDayNear: {
    backgroundColor: "#FF9800",
  },
  dDayFar: {
    backgroundColor: "#4CAF50",
  },
  goalDetailMessage: {
    fontSize: 14,
    color: "#666",
  },
  // 주간/월간 리포트 스타일
  weeklyExtraContainer: {
    marginBottom: 16,
  },
  monthlyExtraContainer: {
    marginBottom: 16,
  },
  // 테마 및 포커스 영역 스타일
  themeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontStyle: "italic",
    marginBottom: 12,
  },
  focusSection: {
    marginTop: 12,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
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
  // 일정 인사이트 스타일
  scheduleInsightsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
  },
  scheduleTypesContainer: {
    marginTop: 12,
  },
  scheduleTypesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  scheduleTypesChart: {},
  scheduleTypeItem: {
    marginBottom: 10,
  },
  scheduleTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduleTypeName: {
    fontSize: 14,
    color: "#333",
  },
  scheduleTypeCount: {
    fontSize: 14,
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
    borderRadius: 4,
  },
  // 주간 차트 스타일
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
  // 월간 리포트 추가 스타일
  overviewText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  scoreCard: {
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
  scoreTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: THEME_COLORS.primary,
  },
  scoreMax: {
    fontSize: 18,
    color: "#999",
    marginLeft: 4,
  },
  scoreBarContainer: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  scoreBar: {
    height: "100%",
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 5,
  },
  // 패턴 분석 스타일
  schedulePatternText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
  },
  dayDistributionContainer: {
    marginVertical: 16,
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
    height: 150,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
  },
  dayBarContainer: {
    width: 20,
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 8,
  },
  dayBar: {
    width: "100%",
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dayCount: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  timeSlotContainer: {
    marginVertical: 16,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  timeSlotChart: {},
  timeSlotItem: {
    marginBottom: 12,
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeSlotName: {
    fontSize: 14,
    color: "#333",
  },
  timeSlotCount: {
    fontSize: 14,
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
    borderRadius: 4,
  },
  // 자주 반복되는 일정 스타일
  frequentTasksContainer: {
    marginVertical: 16,
  },
  frequentTasksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  frequentTasksList: {},
  frequentTaskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  frequentTaskName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  frequentTaskCountContainer: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequentTaskCount: {
    fontSize: 12,
    color: "#666",
  },
  // 활동 통계 스타일
  activityRatioCard: {
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
    color: THEME_COLORS.primary,
    marginBottom: 4,
  },
  activityStatLabel: {
    fontSize: 12,
    color: "#666",
  },
  // 추천 스타일
  recommendationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  // 프리미엄 미리보기 스타일 개선
  premiumPreviewContainer: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
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
  // 구독 관련 스타일
  subscriptionRequiredContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    marginBottom: 16,
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
  // AI 스케줄 스타일
  aiScheduleContainer: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  aiScheduleText: {
    fontSize: 12,
    color: "#4285F4",
    fontStyle: "italic",
  },

  // 스타일시트에 추가
  subscriberInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },

  premiumFeatureContainer: {
    backgroundColor: "#f8f4ff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9b59b6",
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
    align: "center",
  },

  premiumFeatureText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
  },

  upgradeButtonNew: {
    backgroundColor: "#9b59b6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
  },
});

// 추가 스타일 - 비구독자를 위한 UI
export const additionalStyles = StyleSheet.create({
  // 제한된 기능 배지
  limitedBadge: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  limitedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  // 잠긴 탭 스타일
  lockedTab: {
    borderBottomColor: "#FFB74D",
  },
  // 프리미엄 기능 컨테이너
  premiumFeatureContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  premiumFeatureDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  premiumFeatureList: {
    marginBottom: 16,
  },
  premiumFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  premiumFeatureText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  upgradeButtonLarge: {
    backgroundColor: "#FFB74D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonLargeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // 알림 카드 스타일
  notificationCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB74D",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationHint: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
});
