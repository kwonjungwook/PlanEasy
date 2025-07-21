// src/screens/StreakScreen.js
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useProgress } from "../context/ProgressContext";

// src/screens/StreakScreen.js 시작 부분
const StreakScreen = ({ navigation }) => {
  // 토스트는 ProgressContext에서 전역적으로 처리

  // 기본값을 제공하여 undefined 방지
  const {
    streak = 0,
    checkedToday = false,
    checkAttendance = () => {},
    STREAK_REWARDS = {},
    earnedBadges = [],
    attendanceData = {}, // 추가된 부분
  } = useProgress() || {};

  // 기본 보상 값 정의 (STREAK_REWARDS가 없을 경우 대비)
  const defaultRewards = {
    3: { points: 15, xp: 30 },
    7: { points: 30, xp: 70 },
    14: { points: 60, xp: 150 },
    30: { points: 100, xp: 300 },
  };

  // 마일스톤 데이터 - 안전하게 접근
  const streakMilestones = [
    {
      days: 3,
      reward: STREAK_REWARDS[3] || defaultRewards[3],
      badge: { id: "streak_3", name: "활동 챔피언", icon: "🔥" },
    },
    {
      days: 7,
      reward: STREAK_REWARDS[7] || defaultRewards[7],
      badge: { id: "streak_7", name: "주간 챔피언", icon: "📅" },
    },
    {
      days: 14,
      reward: STREAK_REWARDS[14] || defaultRewards[14],
      badge: { id: "streak_14", name: "2주 연속 달성", icon: "📊" },
    },
    {
      days: 30,
      reward: STREAK_REWARDS[30] || defaultRewards[30],
      badge: { id: "streak_30", name: "불꽃 한 달", icon: "🔥🔥" },
    },
    {
      days: 50,
      reward: { points: 150, xp: 350 },
      badge: { id: "streak_50", name: "50일 연속", icon: "🔥🔥" },
    },
    {
      days: 100,
      reward: { points: 500, xp: 1000 },
      badge: { id: "streak_100", name: "불굴의 의지", icon: "🏆🔥" },
    },
  ];

  // 애니메이션 값
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flameSize = useRef(new Animated.Value(1)).current;

  // 애니메이션 설정 부분 수정
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameSize, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(flameSize, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 체크되지 않은 경우에만 깜빡임 애니메이션 - 부드럽게 수정
    if (!checkedToday) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05, // 1.1에서 1.05로 줄여서 덜 과장되게
            duration: 1200, // 700에서 1200으로 늘려서 더 천천히
            easing: Easing.inOut(Easing.ease), // easing 함수 추가
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200, // 700에서 1200으로 늘려서 더 천천히
            easing: Easing.inOut(Easing.ease), // easing 함수 추가
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [checkedToday, flameSize, pulseAnim]);

  // 간단한 출석 상태 표시
  useEffect(() => {
    console.log("StreakScreen - 디버깅 정보:");
    console.log("현재 streak:", streak);
    console.log("checkedToday:", checkedToday);
  }, [streak, checkedToday]);

  // 다음 마일스톤 찾기 - 안전하게 처리
  const getNextMilestone = () => {
    if (!Array.isArray(streakMilestones) || streakMilestones.length === 0) {
      // 마일스톤이 없거나 배열이 아닌 경우 기본값 반환
      return {
        days: 3,
        reward: { points: 15, xp: 30 },
        badge: { id: "streak_3", name: "활동 챔피언", icon: "🔥" },
      };
    }

    for (const milestone of streakMilestones) {
      if (streak < milestone.days) {
        return milestone;
      }
    }
    // 모든 마일스톤을 넘었다면 100일 마일스톤 반환
    return streakMilestones[streakMilestones.length - 1];
  };

  const nextMilestone = getNextMilestone();
  const daysToNextMilestone = nextMilestone ? nextMilestone.days - streak : 0;

  // 출석 체크 처리
  const handleAttendanceCheck = async () => {
    if (!checkedToday) {
      try {
        await checkAttendance();
        // 토스트는 ProgressContext에서 자동으로 표시됨
      } catch (error) {
        console.error("출석 체크 실패:", error);
        // 에러 토스트도 ProgressContext에서 처리됨
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

      <SafeAreaView
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === "android" ? RNStatusBar.currentHeight || 35 : 0,
          },
        ]}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>연속 출석</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate("FAQ")}>
              <Ionicons name="help-circle-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* 현재 연속 출석 카드 */}
          <View style={styles.streakCard}>
            <View style={styles.streakCardContent}>
              <Animated.View
                style={[
                  styles.flameContainer,
                  { transform: [{ scale: flameSize }] },
                ]}
              >
                <Text style={styles.fireEmoji}>
                  {streak >= 30 ? "🔥🔥🔥" : streak >= 7 ? "🔥🔥" : "🔥"}
                </Text>
              </Animated.View>

              <View style={styles.streakInfo}>
                <Text style={styles.streakCountLabel}>현재 연속 출석</Text>
                <View style={styles.streakCountContainer}>
                  <Text style={styles.streakCountValue}>{streak}</Text>
                  <Text style={styles.streakCountUnit}>일</Text>
                </View>
              </View>
            </View>

            {/* 출석 체크 버튼 */}
            {!checkedToday && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={handleAttendanceCheck}
                >
                  <Text style={styles.checkButtonText}>오늘 출석 체크하기</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {checkedToday && (
              <View style={styles.alreadyCheckedContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.alreadyCheckedText}>
                  오늘은 이미 출석체크를 했습니다!
                </Text>
              </View>
            )}
          </View>

          {/* 개선된 출석 현황 카드 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>📊</Text> 출석 현황
            </Text>

            <View style={styles.statusGrid}>
              {/* 연속 출석 카드 */}
              <View style={styles.statusCard}>
                <View style={styles.statusCardHeader}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>🔥</Text>
                  </View>
                  <Text style={styles.statusCardTitle}>연속 출석</Text>
                </View>
                <View style={styles.statusCardBody}>
                  <Text style={styles.statusCardValue}>{streak}</Text>
                  <Text style={styles.statusCardUnit}>일</Text>
                </View>
                <View style={styles.statusCardFooter}>
                  <Text style={styles.statusCardSubtext}>
                    {streak > 0
                      ? "멋져요! 계속 유지해보세요"
                      : "오늘부터 시작해보세요"}
                  </Text>
                </View>
              </View>

              {/* 오늘 출석 카드 */}
              <View style={styles.statusCard}>
                <View style={styles.statusCardHeader}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      checkedToday
                        ? styles.statusIconCompleted
                        : styles.statusIconPending,
                    ]}
                  >
                    <Ionicons
                      name={checkedToday ? "checkmark-circle" : "time-outline"}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.statusCardTitle}>오늘 출석</Text>
                </View>
                <View style={styles.statusCardBody}>
                  <Text
                    style={[
                      styles.statusCardLabel,
                      checkedToday
                        ? styles.statusCompleted
                        : styles.statusPending,
                    ]}
                  >
                    {checkedToday ? "완료" : "대기중"}
                  </Text>
                </View>
                <View style={styles.statusCardFooter}>
                  <Text style={styles.statusCardSubtext}>
                    {checkedToday
                      ? "오늘도 수고하셨습니다!"
                      : "출석 체크를 해주세요"}
                  </Text>
                </View>
              </View>
            </View>

            {/* 진행률 표시 */}
            {streak > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>이번 달 진행률</Text>
                  <Text style={styles.progressPercentage}>
                    {Math.min(100, Math.round((streak / 30) * 100))}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (streak / 30) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressSubtext}>
                  30일 연속 출석까지 {Math.max(0, 30 - streak)}일 남았습니다
                </Text>
              </View>
            )}
          </View>

          {/* 다음 마일스톤 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>🎯</Text> 다음 마일스톤까지
            </Text>

            <View style={styles.milestoneContainer}>
              <View style={styles.milestoneProgress}>
                <View
                  style={[
                    styles.milestoneProgressFill,
                    {
                      width: `${Math.min(
                        100,
                        nextMilestone && nextMilestone.days
                          ? (streak / nextMilestone.days) * 100
                          : 0
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneCount}>
                  {streak}/{nextMilestone.days}일
                </Text>
                <Text style={styles.milestoneDaysLeft}>
                  {daysToNextMilestone === 0
                    ? "오늘 마일스톤 달성!"
                    : `${daysToNextMilestone}일 남음`}
                </Text>
              </View>

              <View style={styles.milestoneReward}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>💰</Text>
                  <Text style={styles.rewardValue}>
                    {nextMilestone.reward.points}P
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardValue}>
                    {nextMilestone.reward.xp}XP
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>
                    {nextMilestone.badge.icon}
                  </Text>
                  <Text style={styles.rewardValue}>배지</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 출석 배지 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>🏆</Text> 출석 배지
            </Text>

            <View style={styles.badgesContainer}>
              {streakMilestones.map((milestone) => {
                const isEarned = earnedBadges.includes(milestone.badge.id);

                return (
                  <View
                    key={milestone.badge.id}
                    style={[
                      styles.badgeItem,
                      !isEarned && styles.badgeItemLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.badgeIcon,
                        !isEarned && styles.badgeIconLocked,
                      ]}
                    >
                      <Text style={styles.badgeIconText}>
                        {isEarned ? milestone.badge.icon : "🔒"}
                      </Text>
                    </View>
                    <View style={styles.badgeInfo}>
                      <Text
                        style={[
                          styles.badgeName,
                          !isEarned && styles.badgeNameLocked,
                        ]}
                      >
                        {milestone.badge.name}
                      </Text>
                      <Text style={styles.badgeDays}>
                        {milestone.days}일 연속 출석
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 연속 출석 팁 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>💡</Text> 연속 출석 팁
            </Text>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⏰</Text>
              <Text style={styles.tipText}>
                매일 같은 시간에 앱을 열어 출석 체크하는 습관을 들이세요
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📱</Text>
              <Text style={styles.tipText}>
                알림을 설정하여 출석 체크를 놓치지 마세요
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🔄</Text>
              <Text style={styles.tipText}>
                연속 출석이 끊어지면, 바로 다시 시작하세요
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipText}>
                다음 마일스톤을 목표로 설정하고 달성해보세요
              </Text>
            </View>
          </View>

          {/* 하단 여백 */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  streakCard: {
    backgroundColor: "#FF7043",
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  flameContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakCountLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  streakCountContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  streakCountValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  streakCountUnit: {
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 8,
    marginLeft: 4,
  },
  checkButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF7043",
  },
  alreadyCheckedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  alreadyCheckedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF7043",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  statusIconCompleted: {
    backgroundColor: "#4CAF50",
  },
  statusIconPending: {
    backgroundColor: "#FF9800",
  },
  statusIcon: {
    fontSize: 16,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C757D",
  },
  statusCardBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  statusCardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212529",
  },
  statusCardUnit: {
    fontSize: 16,
    color: "#6C757D",
    marginLeft: 4,
    marginBottom: 4,
  },
  statusCardLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusCompleted: {
    color: "#4CAF50",
  },
  statusPending: {
    color: "#FF9800",
  },
  statusCardFooter: {
    marginTop: 4,
  },
  statusCardSubtext: {
    fontSize: 12,
    color: "#9E9E9E",
    lineHeight: 16,
  },
  progressSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF7043",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E9ECEF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF7043",
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
  },
  milestoneContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  milestoneProgress: {
    height: 12,
    backgroundColor: "#E9ECEF",
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  milestoneProgressFill: {
    height: "100%",
    backgroundColor: "#FF7043",
    borderRadius: 6,
  },
  milestoneInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  milestoneCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  milestoneDaysLeft: {
    fontSize: 14,
    color: "#6C757D",
  },
  milestoneReward: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
  },
  rewardItem: {
    alignItems: "center",
  },
  rewardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  badgesContainer: {
    marginBottom: 8,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  badgeItemLocked: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeIconLocked: {
    backgroundColor: "#E9ECEF",
  },
  badgeIconText: {
    fontSize: 20,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: "#6C757D",
  },
  badgeDays: {
    fontSize: 14,
    color: "#6C757D",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
  },
});

export default StreakScreen;
