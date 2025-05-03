// src/styles/DailyStyle.js
import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  // 컨테이너 스타일
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    height: "100%",
  },

  // 스크롤 컨테이너 스타일
  scrollContainer: {
    flex: 1,
    height: "100%",
    paddingBottom: 5,
  },
  scrollView: {
    flex: 1,
    height: "100%",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },

  // 헤더 스타일 (미니멀)
  headerCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerCompactLeft: {
    flex: 1,
  },
  headerCompactRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTextCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  weekdayTextCompact: {
    fontSize: 14,
    color: "#868E96",
    fontWeight: "500",
  },
  completionCardCompact: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    marginLeft: 8,
  },
  completionTextCompact: {
    fontSize: 16,
    fontWeight: "600",
  },
  completionNumberCompact: {
    color: "#50cebb",
    fontWeight: "700",
  },
  completionTotalCompact: {
    color: "#ADB5BD",
    fontWeight: "500",
  },
  completionLabelCompact: {
    color: "#868E96",
    fontSize: 12,
    fontWeight: "500",
  },
  alarmContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 2,
  },
  alarmIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  alarmText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#495057",
    marginRight: 4,
  },
  notificationSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginLeft: -4,
  },

  goalContainerWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    overflow: "hidden",
  },
  goalHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  goalHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  goalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  addGoalButtonCute: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  addGoalButtonTextCute: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  collapseIconButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  collapseIcon: {
    fontSize: 14,
    color: "#868E96",
  },
  goalContentContainer: {
    overflow: "hidden",
  },
  goalScroll: {
    paddingVertical: 8,
  },
  goalScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 12,
  },
  goalItem: {
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    borderLeftWidth: 3,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  goalInfo: {
    marginBottom: 4,
  },
  dDayText: {
    fontSize: 14,
    fontWeight: "700",
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2,
  },
  goalDate: {
    fontSize: 10,
    color: "#868E96",
  },
  emptyGoalsContainer: {
    padding: 12,
    alignItems: "center",
    margin: 20,
  },
  emptyGoalsText: {
    fontSize: 14,
    color: "#868E96",
    textAlign: "center",
  },

  // 일정 아이템 스타일
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    height: 70,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scheduleItemCompleted: {
    opacity: 0.8,
  },
  scheduleTimeIndicator: {
    width: 4,
  },
  timeBar: {
    width: "100%",
    height: "100%",
  },
  scheduleMainContent: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  scheduleTimeSection: {
    width: "35%",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingRight: 16,
  },
  scheduleTime: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
  },
  timeArrow: {
    fontSize: 12,
    color: "#ADB5BD",
    marginHorizontal: 15,
  },
  taskSection: {
    flex: 1,
    paddingLeft: 12,
  },
  scheduleTask: {
    fontSize: 15,
    color: "#212529",
    fontWeight: "500",
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#ADB5BD",
  },

  // 체크박스 스타일
  checkboxContainer: {
    padding: 16,
    justifyContent: "center",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#50cebb",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#50cebb",
  },
  checkmarkContainer: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 14,
    height: 14,
    backgroundColor: "white",
    borderRadius: 7,
  },

  // 메뉴 아이콘 스타일
  moreOptionsButton: {
    padding: 8, // 패딩 증가
    position: "absolute",
    right: 8,
    top: 8,
    zIndex: 2, // 상위 레이어에 표시
  },
  moreOptionsContainer: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  moreOptionsDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#555",
    marginVertical: 2,
  },

  // 컨텍스트 메뉴 스타일
  contextMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
  },
  contextMenu: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120, // 최소 너비 설정
    zIndex: 1000, // 가장 상위에 표시
  },
  contextMenuItem: {
    paddingVertical: 12, // 클릭 영역 확대
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  contextMenuItemText: {
    fontSize: 16, // 글꼴 크기 확대
    color: "#212529",
  },
  deleteMenuItemText: {
    color: "#E53935",
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 4,
  },

  // 빈 콘텐츠 스타일
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: "#868E96",
  },

  // 완료 토스트 스타일
  completionToast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(80, 206, 187, 0.9)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  completionToastIcon: {
    fontSize: 24,
    color: "#fff",
    marginRight: 12,
    fontWeight: "bold",
  },
  completionToastText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 24,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  datePickerButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#495057",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalSaveButton: {
    backgroundColor: "#50cebb",
  },
  modalCancelButton: {
    backgroundColor: "#E9ECEF",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },

  // DailyStyle.js에 다음 토스트 스타일로 교체하세요

  // 토스트 스타일
  toastContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    position: "relative",
    borderRadius: 12,
    marginBottom: 8,
    height: 40, // 높이 명시적 지정
    overflow: "hidden", // 내용이 넘치지 않도록 설정
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toastOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: 1,
  },
  toastContent: {
    position: "absolute", // 절대 위치로 변경
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 2,
  },
  toastText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  toastIcon: {
    fontSize: 16,
    color: "#fff",
    marginRight: 8,
  },

  // 토스트 타입별 배경색 - 완전 불투명하게 변경
  successToast: {
    backgroundColor: "rgb(80, 206, 187)",
  },
  warningToast: {
    backgroundColor: "rgb(255, 184, 77)",
  },
  errorToast: {
    backgroundColor: "rgb(239, 83, 80)",
  },
  infoToast: {
    backgroundColor: "rgb(66, 165, 245)",
  },
  rewardToast: {
    backgroundColor: "rgb(156, 39, 176)",
  },
  levelUpToast: {
    backgroundColor: "rgb(251, 192, 45)",
  },
  pointToast: {
    backgroundColor: "rgb(139, 195, 74)",
  },

  // 전역 토스트 컨테이너
  globalToastContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 9999,
  },

  slotInfoText: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "normal",
  },
  addGoalButtonTextSpecial: {
    color: "#FF9500", // 주황색으로 가격 강조
    fontWeight: "bold",
  },

  subscribedBadge: {
    backgroundColor: "#FFB74D", // 프리미엄 느낌의 주황색/골드 계열
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  subscribedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default styles;
