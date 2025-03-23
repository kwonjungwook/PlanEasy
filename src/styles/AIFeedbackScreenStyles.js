import { StyleSheet } from "react-native";

// 테마 색상 상수 (재사용성과 일관성을 위해)
export const THEME_COLORS = {
  primary: "#50cebb",
  success: "#34A853",
  warning: "#FBBC05",
  danger: "#EA4335",
  info: "#4285F4",
  premium: "#FFB74D",
  background: "#f8f8f8",
  card: "#fff",
  text: {
    primary: "#333",
    secondary: "#666",
    light: "#888",
  },
  border: "#f0f0f0",
};

// 색상 유틸리티 함수 통합
export const getColor = (type, category) => {
  const colorMaps = {
    category: {
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
      공부시간: THEME_COLORS.primary,
      미지정: "#9E9E9E",
    },
    scheduleType: {
      업무: "#4285F4",
      학습: "#34A853",
      회의: "#FBBC05",
      개인: "#EA4335",
      기타: "#9E9E9E",
    },
    timeSlot: {
      "오전(6-12시)": "#4285F4",
      "오후(12-18시)": "#34A853",
      "저녁(18-24시)": "#FBBC05",
      "야간(0-6시)": "#EA4335",
    },
    dDay: {
      today: "#FF5722",
      near: "#FFB74D",
      far: "#8BC34A",
    },
  };

  return (colorMaps[type] && colorMaps[type][category]) || THEME_COLORS.primary;
};

// 최적화된 스타일 - 중복 제거 및 테마 색상 사용
export const styles = StyleSheet.create({
  // 레이아웃 기본
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  header: {
    backgroundColor: THEME_COLORS.card,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
  },

  // 탭 네비게이션
  tabContainer: {
    flexDirection: "row",
    backgroundColor: THEME_COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: THEME_COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: THEME_COLORS.text.light,
    textAlign: "center",
  },
  activeTabText: {
    color: THEME_COLORS.primary,
    fontWeight: "bold",
  },
  tabLabelContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },

  // 콘텐츠 영역
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },

  // 로딩 및 빈 화면
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
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: THEME_COLORS.card,
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
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 20,
  },

  // 프리미엄 관련 UI
  premiumBadge: {
    backgroundColor: THEME_COLORS.premium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  tabContainerWithUpgrade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  tabsSection: {
    flexDirection: 'row',
  },

  headerContainer: {
    backgroundColor: THEME_COLORS.card,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
 
 
  upgradeProBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME_COLORS.premium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    height: 30,
  },
  upgradeProText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },

 
  premiumFeatureBadge: {
    backgroundColor: THEME_COLORS.premium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  premiumFeatureText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },

  // 리포트 컨테이너
  reportContainer: {
    backgroundColor: THEME_COLORS.card,
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
    borderBottomColor: THEME_COLORS.border,
    paddingBottom: 16,
    position: "relative",
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
  },
  reportDate: {
    fontSize: 14,
    color: THEME_COLORS.text.secondary,
    marginTop: 4,
  },

  // 공통 섹션 카드 (재사용 가능한 컴포넌트)
  sectionCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 8,
    padding: 0,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionHeaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },

  // 통계 카드
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME_COLORS.text.secondary,
  },

  // 통합된 버튼 스타일
  generateButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: THEME_COLORS.primary,
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
  aiButton: {
    flexDirection: "row",
    backgroundColor: THEME_COLORS.info,
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
  upgradeButton: {
    backgroundColor: THEME_COLORS.premium,
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

  // 목표 관련 스타일
  goalDetailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: THEME_COLORS.info,
  },
  goalDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalDetailTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME_COLORS.text.primary,
    flex: 1,
    paddingRight: 8,
  },
  goalDetailMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: THEME_COLORS.text.secondary,
  },
  dDayBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dDayToday: {
    backgroundColor: getColor("dDay", "today"),
  },
  dDayNear: {
    backgroundColor: getColor("dDay", "near"),
  },
  dDayFar: {
    backgroundColor: getColor("dDay", "far"),
  },
  dDayBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },

  // 인사이트 관련 스타일
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME_COLORS.text.primary,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME_COLORS.text.primary,
  },

  // 카테고리 분석 스타일
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
    color: THEME_COLORS.text.primary,
  },
  categoryTime: {
    fontSize: 14,
    color: THEME_COLORS.text.secondary,
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },

  // 주간 차트 스타일
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
    color: THEME_COLORS.text.secondary,
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
    backgroundColor: THEME_COLORS.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weeklyChartValue: {
    fontSize: 10,
    color: THEME_COLORS.text.secondary,
    marginTop: 4,
  },

  // 주간/월간 추가 섹션 스타일
  weeklyExtraContainer: {
    marginBottom: 16,
  },
  monthlyExtraContainer: {
    marginBottom: 16,
  },

  // 테마 관련 스타일
  themeText: {
    fontSize: 16,
    fontStyle: "italic",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.text.primary,
    marginBottom: 6,
  },
  focusText: {
    fontSize: 14,
    color: THEME_COLORS.text.secondary,
    lineHeight: 20,
  },

  // 프리미엄 미리보기 스타일
  premiumPreviewContainer: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: `${THEME_COLORS.premium}40`,
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 100,
  },
  previewText: {
    color: THEME_COLORS.text.secondary,
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

  // 일정 인사이트 스타일
  scheduleInsightsText: {
    fontSize: 14,
    color: THEME_COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 16,
  },
  scheduleTypesContainer: {
    marginTop: 8,
  },
  scheduleTypesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.text.primary,
  },
  scheduleTypeCount: {
    fontSize: 13,
    color: THEME_COLORS.text.secondary,
  },
  scheduleTypeBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  scheduleTypeBar: {
    height: "100%",
  },

  // 생산성 점수 카드
  scoreCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: THEME_COLORS.primary,
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
    backgroundColor: THEME_COLORS.primary,
  },

  // 활동 비율 카드
  activityRatioCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  activityRatioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.text.secondary,
  },

  // 일정 패턴 스타일
  schedulePatternText: {
    fontSize: 14,
    color: THEME_COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 16,
  },
  dayDistributionContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  dayDistributionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_COLORS.text.primary,
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
    backgroundColor: THEME_COLORS.success,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: THEME_COLORS.text.primary,
  },
  dayCount: {
    fontSize: 10,
    color: THEME_COLORS.text.secondary,
  },

  // 시간대별 분포
  timeSlotContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.text.primary,
  },
  timeSlotCount: {
    fontSize: 13,
    color: THEME_COLORS.text.secondary,
  },
  timeSlotBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeSlotBar: {
    height: "100%",
    backgroundColor: THEME_COLORS.warning,
  },

  // 자주 반복되는 일정
  frequentTasksContainer: {
    marginTop: 8,
  },
  frequentTasksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.text.primary,
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
    color: THEME_COLORS.success,
    fontWeight: "600",
  },

  // AI 배지
  aiBadge: {
    backgroundColor: THEME_COLORS.info,
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

  // 업데이트 정보
  autoUpdateContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  autoUpdateInfo: {
    fontSize: 12,
    color: THEME_COLORS.text.light,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 4,
  },
  lastUpdateInfo: {
    fontSize: 11,
    color: THEME_COLORS.text.light,
    textAlign: "center",
  },

  // 여백
  bottomSpacer: {
    height: 40,
  },

  // 오버뷰 텍스트
  overviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME_COLORS.text.primary,
  },

  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabsScrollContent: {
    paddingHorizontal: 10,
  },
});
