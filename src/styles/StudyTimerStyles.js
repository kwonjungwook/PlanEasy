// src/styles/StudyTimerStyles.js
import { StyleSheet } from "react-native";

export const TIMER_METHODS = [
  {
    id: "pomodoro",
    name: "포모도로",
    description: "25분 집중, 5분 휴식 사이클",
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    cyclesBeforeLongBreak: 4,
    color: "#F05454",
    isFree: true, // 무료
    detailedInfo: `포모도로 기법은 1980년대 프란체스코 시릴로(Francesco Cirillo)가 개발한 시간 관리 방법론입니다.
  
  📌 기본 구조
  - 25분 집중 작업 (1 포모도로)
  - 5분 짧은 휴식
  - 4번의 포모도로 후에는 15~30분 긴 휴식
  - 이 과정을 반복
  
  📌 효과
  - 집중력 향상: 짧은 시간 동안 온전히 한 가지에 집중
  - 업무 피로도 감소: 규칙적인 휴식으로 지속 가능
  - 업무 추적 용이: 포모도로 단위로 작업량 측정 가능
  - 방해 요소 최소화: '지금은 집중 중'이라는 명확한 경계 설정
  
  📌 추천 대상
  - 집중력이 짧은 학생
  - 자주 산만해지는 경향이 있는 분
  - 집중 시간을 체계적으로 관리하고 싶은 분
  - 과로를 방지하고 싶은 분`,
  },
  {
    id: "52-17",
    name: "52-17 기법",
    description: "52분 작업, 17분 휴식",
    workDuration: 52 * 60,
    breakDuration: 17 * 60,
    color: "#7A4069",
    isFree: false, // 유료
    price: 500, // 가격 설정
    detailedInfo: `52-17 기법은 생산성 추적 앱 DeskTime의 데이터 분석에서 발견된, 가장 생산적인 사람들의 작업 패턴에 기반한 방법입니다.
  
  📌 기본 구조
  - 52분 동안 집중 작업
  - 17분 완전한 휴식 (작업에서 완전히 벗어남)
  - 이 사이클을 반복
  
  📌 효과
  - 최적의 생산성: 실제 데이터에 기반한 최적의 작업/휴식 비율
  - 충분한 휴식: 17분의 긴 휴식으로 완전한 재충전
  - 지속 가능한 집중: 포모도로보다 긴 집중 시간으로 깊은 몰입 가능
  - 균형 잡힌 접근: 작업과 휴식의 과학적 균형
  
  📌 추천 대상
  - 장시간 집중이 필요한 복잡한 작업을 하는 분
  - 충분한 휴식이 필요한 고강도 정신 노동자
  - 포모도로보다 긴 집중 시간을 선호하는 분
  - 작업과 휴식의 균형을 중요시하는 분`,
  },
  {
    id: "ultradian",
    name: "울트라디안 리듬",
    description: "90분 집중, 20분 휴식으로 생체 리듬 활용",
    workDuration: 90 * 60,
    breakDuration: 20 * 60,
    color: "#00C9A7",
    isFree: false,
    price: 600,
    detailedInfo: `울트라디안 리듬(Ultradian Rhythm)은 인간의 자연적인 생체 리듬에 맞춘 작업-휴식 사이클입니다.
  
  📌 기본 구조
  - 90분 깊은 집중 작업
  - 20분 완전한 휴식 (가능하면 자연 속에서)
  - 하루 동안 이 사이클 반복
  
  📌 효과
  - 생체 리듬 최적화: 뇌와 신체의 자연스러운 에너지 사이클 활용
  - 지속 가능한 생산성: 장시간 효율적 작업 가능
  - 피로감 감소: 자연 리듬에 맞춰 작업하므로 소진 방지
  - 창의력 향상: 휴식 시간 동안 무의식적 문제 해결 발생
  
  📌 추천 대상
  - 장시간 높은 생산성이 필요한 분
  - 자연스러운 작업 방식을 선호하는 분
  - 신체와 정신의 균형을 중요시하는 분
  - 지속 가능한 작업 루틴을 구축하고자 하는 분`,
  },
  {
    id: "elr",
    name: "탐색-학습-복습",
    description: "20분 탐색, 40분 학습, 10분 복습",
    workDuration: 70 * 60, // 전체 70분
    breakDuration: 15 * 60,
    color: "#845EC2",
    isFree: false,
    price: 700,
    phases: [
      { name: "탐색", duration: 20 * 60 },
      { name: "학습", duration: 40 * 60 },
      { name: "복습", duration: 10 * 60 },
    ],
    detailedInfo: `탐색-학습-복습(ELR) 기법은 학습 효율성을 극대화하기 위한 3단계 접근법입니다.
  
  📌 기본 구조
  - 탐색(20분): 주제를 빠르게 훑어보고 전체 구조 파악
  - 학습(40분): 핵심 내용에 집중하여 깊이 있게 학습
  - 복습(10분): 배운 내용을 정리하고 핵심을 복습
  - 휴식(15분): 충분한 휴식으로 두뇌 회복
  
  📌 효과
  - 효율적 정보 처리: 뇌가 정보를 다양한 방식으로 반복 처리
  - 개념 이해 강화: 처음 전체 구조를 파악하고 세부 내용 학습
  - 기억력 향상: 복습 단계를 통한 장기 기억 전환
  - 학습 효율 극대화: 학습 프로세스의 최적화
  
  📌 추천 대상
  - 시험 준비 중인 학생
  - 새로운 개념이나 주제를 공부하는 분
  - 효율적인 학습 방법을 찾는 분
  - 기억력 향상을 원하는 분`,
  },
  {
    id: "exam",
    name: "기출문제 풀이",
    description: "문제별 시간 설정",
    workDuration: 20, // 기본값 20초
    questionCount: 100, // 기본 문제 수
    remainingQuestions: 100, // 초기값 추가
    isExamMode: true,
    color: "#FF9671",
    isFree: false,
    price: 500,
    isCustomizable: true,
    detailedInfo: `기출문제 풀이 타이머는 시험 준비에 최적화된 특별한 타이머입니다.
  
  📌 기본 구조
  - 문제 수와 문제당 시간을 자유롭게 설정
  - 각 문제를 풀 때마다 자동으로 다음 문제로 전환
  - 남은 문제 수를 실시간으로 확인
  - 전체 진행 상황 추적 가능
  
  📌 효과
  - 시간 관리 능력 향상: 문제당 정해진 시간 내에 풀이하는 연습
  - 실전 감각 향상: 실제 시험과 유사한 환경에서 연습
  - 집중력 유지: 시간 제한으로 인한 적절한 긴장감 유지
  - 진도 파악: 남은 문제 수를 실시간으로 확인
  
  📌 추천 대상
  - 공인 시험(토익, 공무원 등)을 준비하는 수험생
  - 시간 제한이 있는 시험을 준비하는 학생
  - 문제 풀이 속도를 향상시키고 싶은 분
  - 실전 감각을 키우고 싶은 분`,
  },
  {
    id: "custom",
    name: "사용자 정의",
    description: "원하는 시간으로 설정",
    workDuration: 45 * 60,
    breakDuration: 15 * 60,
    isCustomizable: true,
    color: "#6D9886",
    isFree: false, // 유료
    price: 500, // 가격 설정
    detailedInfo: `사용자 정의 타이머는 자신만의 작업 및 휴식 리듬에 맞춰 설정할 수 있는 유연한 방식입니다.
  
  📌 기본 구조
  - 자신에게 가장 효과적인 집중 시간 설정
  - 개인에게 적합한 휴식 시간 설정
  - 필요에 따라 조정 가능
  
  📌 효과
  - 맞춤형 작업 환경: 자신의 집중력 패턴에 최적화
  - 상황 적응성: 작업의 종류나 컨디션에 따라 조절 가능
  - 실험 가능: 다양한 시간 설정을 시도하며 최적점 발견
  - 유연성: 고정된 방식의 한계를 극복
  
  📌 추천 대상
  - 기존 타이머 방식이 맞지 않는 분
  - 과목이나 작업별로 다른 집중 시간이 필요한 학생
  - 자신만의 최적 작업 패턴을 찾고 있는 분
  - 시간 관리에 대한 실험적 접근을 원하는 분`,
  },
];

// 컨트롤 스타일
export const controlStyles = StyleSheet.create({
  // 새로운 스타일 추가
  contentContainer: {
    flex: 1,
    position: "relative", // 자식 요소의 절대 위치 지정을 위한 설정
  },

  fixedTimerContainer: {
    position: "absolute",
    top: 20, // 상단에서의 거리
    left: 0,
    right: 0,
    alignItems: "center",
    height: 350, // 타이머 영역의 고정 높이
    zIndex: 10, // 다른 요소보다 위에 표시
  },

  fixedContentLayout: {
    flex: 1,
    width: "100%",
    paddingBottom: 80, // 탭바 높이보다 약간 더 큰 패딩
    position: "relative",
    zIndex: 1,
  },

  fixedCycleLogContainer: {
    width: "90%",
    height: 120, // 고정 높이 설정
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    alignSelf: "center", // 중앙 정렬
  },

  fixedControlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  fixedLogContainer: {
    position: "absolute",
    top: 370, // 타이머 영역 아래
    left: 0,
    right: 0,
    bottom: 20,
  },

  // 타이머 내부 컨텐츠를 담는 컨테이너 추가
  timerContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },

  // 사이클 텍스트 영역을 항상 일정 높이로 유지
  cycleTextContainer: {
    height: 24,
    justifyContent: "center",
    marginTop: 5,
  },

  // 기존 스타일은 그대로 두고 일부만 수정
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  timerControlsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  timerControlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: "80%", // 너비를 줄여서 보기 좋게
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#50cebb", // 기본 색상
    marginHorizontal: 10,
  },
  emptyButton: {
    width: 44,
    height: 44,
    marginHorizontal: 10,
    opacity: 0,
  },
});

// 가로모드 향상된 뷰 스타일
export const enhancedPureViewStyles = StyleSheet.create({
  enhancedPureViewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedPureViewContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  enhancedPureViewTimer: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  enhancedPureViewTimerText: {
    fontSize: 72,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  enhancedPureViewPhaseText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 12,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    textAlign: "center", // 추가
  },
  enhancedPureViewCycleText: {
    fontSize: 18, // 16에서 18로 증가
    color: "#cccccc",
    marginTop: 8, // 6에서 8로 증가
    textAlign: "center",
  },

  enhancedPureViewModeButton: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  enhancedPureViewInfo: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  enhancedPureViewSubject: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  enhancedPureViewTotal: {
    color: "#cccccc",
    fontSize: 11,
    textAlign: "right",
  },
  enhancedPureViewExitButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100, // 다른 요소보다 앞에 표시
  },
  enhancedPureViewExitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

// 로그 스타일 업데이트
export const updatedLogStyles = StyleSheet.create({
  cycleLogContainer: {
    width: "90%",
    maxHeight: 120,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  cycleLogHeader: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
  },
  cycleLogScrollView: {
    maxHeight: 100,
  },
  cycleLogContent: {
    padding: 10,
  },
  cycleLogItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  cycleLogTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
  },
});

// 컨테이너 스타일 업데이트
export const updatedContainerStyles = StyleSheet.create({
  timerContainer: {
    flex: 1,
    justifyContent: "center", // flex-start에서 center로 변경하여 중앙 정렬
    alignItems: "center",
    padding: 20,
    paddingTop: 80, // 상단 여백 증가
    paddingBottom: 100,
  },

  // 새로 추가할 스타일
  stableTimerContainer: {
    position: "relative",
    justifyContent: "flex-start", // 상단 정렬로 변경
    alignItems: "center",
    paddingTop: 150, // 상단 패딩 증가 (기본 상태에서 위로 올리기 위함)
    paddingBottom: 20,
    height: 550, // 높이 증가
    width: "100%",
  },

  // 버튼 레이아웃 고정을 위한 컨테이너
  fixedControlLayout: {
    height: 80, // 고정 높이
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  timerContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10, // 패딩 추가
  },

  cycleTextContainer: {
    minHeight: 35, // 높이를 더 늘림
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    paddingVertical: 5, // 패딩 추가
  },

  timerCircle: {
    width: 260, // 250에서 260으로 증가
    height: 260, // 250에서 260으로 증가
    borderRadius: 130, // 125에서 130으로 증가
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    minHeight: 260, // 250에서 260으로 증가
  },

  timerText: {
    fontSize: 45,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"], // 숫자 너비 고정
  },

  timerLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  cycleText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20, // 줄 높이 추가
  },
});

// 다크 모드 스타일
export const darkModeStyles = StyleSheet.create({
  containerDark: {
    backgroundColor: "#121212",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 1,
  },
  headerDark: {
    backgroundColor: "transparent",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 2,
  },
  textLight: {
    color: "#ffffff",
  },
  methodInfoDark: {
    backgroundColor: "rgba(30, 30, 30, 0.7)",
    zIndex: 2,
  },
  timerContainerDark: {
    zIndex: 2,
  },
  timerCircleDark: {
    borderWidth: 8,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    backgroundColor: "rgba(10, 10, 10, 0.8)",
  },
});
// 새로운 레이아웃 스타일
const newLayoutStyles = {
  // 타이머가 중앙에 위치하게 하는 컨테이너
  centerTimerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  // 하단에 고정된 컨트롤 바
  fixedControlsBar: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
};

// 포커스 모드 스타일
export const focusModeStyles = StyleSheet.create({
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    zIndex: 1,
  },
  totalStudyTimeContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 5,
  },
  totalStudyTimeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  timerContainerFocus: {
    zIndex: 2,
    justifyContent: "center", // 중앙 정렬
    alignItems: "center",
    paddingTop: 0, // 패딩 제거
    paddingBottom: 0, // 패딩 제거
    marginTop: 0, // 약간 위로 조정
  },
  timerCircleFocus: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    backgroundColor: "#000",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 80, // 버튼과의 간격 확보
  },
  cycleTextFocus: {
    color: "#ddd",
    fontSize: 16,
  },
  timerControlsBarFocus: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 25,
  },
  controlButtonFocus: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
});

// 타이머 디스플레이 스타일
export const timerDisplayStyles = StyleSheet.create({
  timerPhase: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  phaseProgressContainer: {
    flexDirection: "row",
    height: 6,
    width: "80%",
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  phaseProgressBar: {
    height: "100%",
  },
  circleTimer: {
    position: "relative",
  },
  circleBackground: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.2,
  },
  circleProgress: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 12,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  circleCenter: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});

// 모달 스타일
export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#50cebb",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

// 타이머 메서드 메뉴 스타일
export const menuStyles = StyleSheet.create({
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  menuItemMain: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedMenuItem: {
    backgroundColor: "#f5f5f5",
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 12,
    color: "#666",
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  lockedMenuItem: {
    opacity: 0.7,
  },
  menuItemPriceContainer: {
    marginTop: 4,
  },
  menuItemPrice: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "bold",
  },
  menuItemUnlocked: {
    fontSize: 12,
    color: "#50cebb",
    fontWeight: "bold",
  },
  menuItemFree: {
    fontSize: 12,
    color: "#43A047",
    fontWeight: "bold",
    marginTop: 4,
  },
});

// 설정 관련 스타일
export const settingsStyles = StyleSheet.create({
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  settingButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
  },
  settingButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  settingButtonText: {
    fontWeight: "bold",
    color: "#333",
  },
  settingValue: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 16,
  },
});

// 정보 모달 스타일
export const infoModalStyles = StyleSheet.create({
  infoModalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    overflow: "hidden",
  },
  infoModalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  infoModalCloseButton: {
    padding: 4,
  },
  infoModalScrollContent: {
    padding: 16,
  },
  infoModalText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
  },
  infoModalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
  },
  infoModalSelectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  infoModalSelectButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoModalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoModalPurchaseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 6,
  },
  infoModalSubscribeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    marginLeft: 6,
  },
  infoModalSubscribeButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
});

// 결과 모달 스타일
export const resultModalStyles = StyleSheet.create({
  resultContainer: {
    marginVertical: 20,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultLabel: {
    fontSize: 16,
    color: "#666",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

// 구독 관련 스타일
export const subscriptionStyles = StyleSheet.create({
  subscriptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  subscriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});

// 구매 모달 스타일
export const purchaseModalStyles = StyleSheet.create({
  purchaseModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 380,
  },
  purchaseModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  purchaseModalInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  purchaseModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  purchaseModalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  purchaseModalDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  purchaseModalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9500",
  },
  purchaseModalQuestion: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    marginVertical: 16,
  },
  purchaseModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  purchaseModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseModalCancelButton: {
    backgroundColor: "#f1f1f1",
    marginRight: 8,
  },
  purchaseModalConfirmButton: {
    backgroundColor: "#50cebb",
    marginLeft: 8,
  },
  purchaseModalCancelText: {
    color: "#666",
    fontWeight: "bold",
  },
  purchaseModalConfirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  purchaseModalOr: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  purchaseModalLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  purchaseModalOrText: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 14,
  },
  purchaseModalSubscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 12,
    borderRadius: 8,
  },
  purchaseModalSubscribeText: {
    color: "#333",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

// 기본 컴포넌트 스타일
export const componentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "column",
  },
  headerRightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  headerDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  menuButton: {
    padding: 4,
  },
  methodInfo: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    color: "#666",
  },
  timerButton: {
    backgroundColor: "#50cebb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    minWidth: 120,
    marginTop: 100,
  },
  stopButton: {
    backgroundColor: "#ff6b6b",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});

// 모든 스타일 통합 (기존 코드와의 호환성 유지)
export const styles = StyleSheet.create({
  ...controlStyles,
  ...enhancedPureViewStyles,
  ...updatedLogStyles,
  ...updatedContainerStyles,
  ...darkModeStyles,
  ...focusModeStyles,
  ...timerDisplayStyles,
  ...modalStyles,
  ...menuStyles,
  ...settingsStyles,
  ...infoModalStyles,
  ...subscriptionStyles,
  ...purchaseModalStyles,
  ...componentStyles,
  ...newLayoutStyles,
  ...resultModalStyles, // 추가
  centerTimerContainer: {
    flex: 1,
    justifyContent: "flex-start", // 중앙에서 위쪽으로 변경
    alignItems: "center",
    width: "100%",
    paddingTop: 150, // 위쪽 여백 추가하여 시계 위치 조정
    marginBottom: 50, // 아래쪽 여백도 추가
  },
});

export default styles;
