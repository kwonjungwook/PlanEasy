// src/components/Guide.js
// 앱 사용법 가이드 컴포넌트

import { useNavigation } from "@react-navigation/native";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Guide() {
  const navigation = useNavigation();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>사용 가이드</Text>
        <Text style={styles.headerSubtitle}>
          앱을 효과적으로 활용하는 방법을 알아보세요
        </Text>
      </View>

      {/* 섹션 1: 루틴 설정 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>1</Text>
          <Text style={styles.sectionTitle}>루틴 만들기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📅</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>일정 유형 선택하기</Text>
              <Text style={styles.stepDescription}>
                루틴화면에서 원하는 일정 관리 방식을 선택하세요:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>평일 & 주말</Text>: 평일과
                  주말을 구분하여 일정 관리
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>요일별 커스텀</Text>:
                  월~일요일까지 각각 다른 일정 설정
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>사용자 커스텀</Text>:
                  개인화된 상세 일정 설정
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 TIP</Text>
            <Text style={styles.tipText}>
              규칙적인 생활을 하신다면 '평일 & 주말' 옵션이 편리하고, 요일마다
              다른 일정이 있으시다면 '요일별 커스텀'을 추천해요!
            </Text>
          </View>
        </View>
      </View>

      {/* 섹션 2: 달력 적용 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>2</Text>
          <Text style={styles.sectionTitle}>달력에 일정 적용하기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🗓️</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>날짜 선택 및 적용</Text>
              <Text style={styles.stepDescription}>
                달력 화면에서 일정을 적용할 날짜를 선택하세요:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>단일 선택</Text>: 특정 날짜
                  하나를 탭하여 선택
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>다중 선택</Text>: 우측측
                  상단 '다중 선택' 누른 후 여러 날짜 탭
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>적용하기</Text>: 원하는
                  루틴을 선택한 날짜에 적용
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              일정을 적용하면 시간표 탭에도 자동으로 반영됩니다. 한 번의
              설정으로 모든 화면이 동기화됩니다.
            </Text>
          </View>
        </View>
      </View>

      {/* 섹션 3: 홈 화면 알림 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>3</Text>
          <Text style={styles.sectionTitle}>오늘의 일정 확인하기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏠</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>홈 화면 알림</Text>
              <Text style={styles.stepDescription}>
                홈 화면에서 오늘의 일정을 한눈에 확인할 수 있습니다:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • 현재 날짜가 자동으로 표시됩니다
                </Text>
                <Text style={styles.bullet}>
                  • 오늘 일정의 요약 정보를 볼 수 있습니다
                </Text>
                <Text style={styles.bullet}>
                  • 중요 일정은 강조 표시로 쉽게 확인 가능합니다
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 TIP</Text>
            <Text style={styles.tipText}>
              매일 아침 홈 화면을 확인하면 하루 일정을 놓치지 않고 효율적으로
              관리할 수 있어요!
            </Text>
          </View>
        </View>
      </View>

      {/* 🔥 새로 추가: AI 맞춤 피드백 섹션 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>4</Text>
          <Text style={styles.sectionTitle}>AI 맞춤 피드백 사용하기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>AI 코치 시작하기</Text>
              <Text style={styles.stepDescription}>
                개인화된 AI 학습 코치가 당신만의 맞춤 조언을 제공합니다:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>프로필 설정</Text>: 이름,
                  나이, 직업, 학습 스타일 등 간단 설정
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>질문하기</Text>: 공부법,
                  시간 관리 등 고민 상담
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>맞춤 분석</Text>: 개인 행동
                  패턴 기반 분석 제공
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.aiFeatureContainer}>
            <Text style={styles.aiFeatureTitle}>✨ AI 기능 특징</Text>
            <View style={styles.bulletList}>
              <Text style={styles.aiBullet}>
                🧠 <Text style={styles.bulletText}>개인화 분석</Text>: 완료율
                패턴, 집중 시간, 최적 활동 시간대 분석
              </Text>
              <Text style={styles.aiBullet}>
                📊 <Text style={styles.bulletText}>행동 패턴</Text>: 요일별
                효율성, 미루는 경향 등 자동 분석
              </Text>
              <Text style={styles.aiBullet}>
                🎯 <Text style={styles.bulletText}>맞춤 조언</Text>: 개인 성향에
                맞는 구체적 실행 방안 제시
              </Text>
            </View>
          </View>

          <View style={styles.limitContainer}>
            <Text style={styles.limitTitle}>⏰ 이용 제한</Text>
            <Text style={styles.limitText}>
              AI 분석은 <Text style={styles.limitHighlight}>하루 1회</Text> 이용
              가능합니다. 자정이 지나면 다시 이용할 수 있어요!
            </Text>
          </View>
        </View>
      </View>

      {/* 🔥 새로 추가: AI 프로필 설정 가이드 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>5</Text>
          <Text style={styles.sectionTitle}>AI 프로필 설정 가이드</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>개인화를 위한 프로필 입력</Text>
              <Text style={styles.stepDescription}>
                더 정확한 AI 분석을 위해 다음 정보를 설정해주세요:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>기본 정보</Text>:
                  이름/닉네임, 나이, 성별
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>상황 정보</Text>: 직업/상황
                  (예: 대학생, 직장인, 취준생)
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>성격 정보</Text>: MBTI나
                  성격 특성 (선택사항)
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>목표 설정</Text>: 현재 가장
                  중요한 목표 (선택사항)
                </Text>
                <Text style={styles.bullet}>
                  • <Text style={styles.bulletText}>학습 스타일</Text>:
                  몰입형/분산형/균형형 중 선택
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.styleGuideContainer}>
            <Text style={styles.styleGuideTitle}>📚 학습 스타일 가이드</Text>
            <View style={styles.styleList}>
              <View style={styles.styleItem}>
                <Text style={styles.styleLabel}>🎯 몰입형</Text>
                <Text style={styles.styleDesc}>
                  한 가지에 깊게 집중하는 스타일
                </Text>
              </View>
              <View style={styles.styleItem}>
                <Text style={styles.styleLabel}>🔄 분산형</Text>
                <Text style={styles.styleDesc}>
                  여러 과목을 번갈아 가며 학습
                </Text>
              </View>
              <View style={styles.styleItem}>
                <Text style={styles.styleLabel}>⚖️ 균형형</Text>
                <Text style={styles.styleDesc}>일과 학습의 조화를 중시</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 TIP</Text>
            <Text style={styles.tipText}>
              프로필을 자세히 설정할수록 더 정확하고 개인화된 AI 조언을 받을 수
              있어요! 나중에 프로필 화면에서 언제든 수정 가능합니다.
            </Text>
          </View>
        </View>
      </View>

      {/* 🔥 새로 추가: AI 활용 팁 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>6</Text>
          <Text style={styles.sectionTitle}>AI 활용 꿀팁</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💡</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>효과적인 질문하기</Text>
              <Text style={styles.stepDescription}>
                AI에게 이렇게 질문하면 더 좋은 답변을 받을 수 있어요:
              </Text>
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>✅ 좋은 질문 예시</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.goodExample}>
                    "토익 900점을 3개월 안에 달성하려면 어떻게 공부해야 할까요?"
                  </Text>
                  <Text style={styles.goodExample}>
                    "집중력이 떨어져서 30분도 못 앉아있어요. 어떻게 개선할 수
                    있을까요?"
                  </Text>
                  <Text style={styles.goodExample}>
                    "아침에 일찍 일어나서 공부하고 싶은데 계속 실패해요. 좋은
                    방법이 있나요?"
                  </Text>
                </View>

                <Text style={styles.exampleTitle}>❌ 아쉬운 질문 예시</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.badExample}>"공부법 알려주세요"</Text>
                  <Text style={styles.badExample}>"도움이 필요해요"</Text>
                  <Text style={styles.badExample}>"뭘 해야 하죠?"</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>📈 데이터 축적의 중요성</Text>
            <Text style={styles.dataText}>
              일정과 학습 기록을 꾸준히 입력하면 AI가 당신의 패턴을 학습해서
              더욱 정확한 분석을 제공합니다:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>
                • <Text style={styles.bulletText}>1주차</Text>: 기본 개인화 분석
              </Text>
              <Text style={styles.bullet}>
                • <Text style={styles.bulletText}>2주차</Text>: 행동 패턴 파악
                시작
              </Text>
              <Text style={styles.bullet}>
                • <Text style={styles.bulletText}>1개월후</Text>: 정확한 맞춤
                분석 완성
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 추가 도움말 섹션 */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>로그인기능 찾으시나요?</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate("MyPage")}
        >
          <Text style={styles.helpButtonText}>마이페이지 이동하기</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>앱 버전 16.0.0 - AI 기능 포함</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6C757D",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4263EB",
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 28,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    marginBottom: 4,
  },
  bulletText: {
    fontWeight: "600",
    color: "#343A40",
  },

  // 🔥 AI 관련 새로운 스타일들
  aiFeatureContainer: {
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  aiFeatureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4263EB",
    marginBottom: 8,
  },
  aiBullet: {
    fontSize: 14,
    color: "#364FC7",
    lineHeight: 20,
    marginBottom: 4,
  },

  limitContainer: {
    backgroundColor: "#FFF0F6",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2185B",
    marginBottom: 4,
  },
  limitText: {
    fontSize: 14,
    color: "#AD1457",
    lineHeight: 20,
  },
  limitHighlight: {
    fontWeight: "700",
    color: "#880E4F",
  },

  styleGuideContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  styleGuideTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  styleList: {
    gap: 6,
  },
  styleItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343A40",
    minWidth: 60,
    marginRight: 8,
  },
  styleDesc: {
    fontSize: 14,
    color: "#6C757D",
    flex: 1,
  },

  exampleContainer: {
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 6,
    marginTop: 8,
  },
  goodExample: {
    fontSize: 13,
    color: "#0F5132",
    backgroundColor: "#D1E7DD",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    lineHeight: 18,
  },
  badExample: {
    fontSize: 13,
    color: "#842029",
    backgroundColor: "#F8D7DA",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    lineHeight: 18,
  },

  dataContainer: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 6,
  },
  dataText: {
    fontSize: 14,
    color: "#EF6C00",
    lineHeight: 20,
    marginBottom: 8,
  },

  // 기존 스타일들
  tipContainer: {
    backgroundColor: "#E9F3FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1971C2",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: "#1864AB",
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: "#FFF9DB",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#E67700",
    lineHeight: 20,
  },
  helpSection: {
    alignItems: "center",
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: "#4263EB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  versionText: {
    fontSize: 12,
    color: "#ADB5BD",
    marginBottom: 50,
  },
});
