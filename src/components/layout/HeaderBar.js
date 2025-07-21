// components/layout/HeaderBar.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotifications } from "../../context/NotificationContext";
import { useProgress } from "../../context/ProgressContext";

const HeaderBar = ({ navigation, badgeCount = 0 }) => {
  // 알림 관련 기능
  const { unreadCount, loadNotifications } = useNotifications() || {};
  const [localNotificationCount, setLocalNotificationCount] = useState(0);

  // 진행도 관련 기능 - 기본값 제공
  const {
    points = 0,
    streak = 0,
    checkedToday = false,
    checkAttendance,
    level = 1,
    levelProgress = { percentage: 0, current: 0, required: 100 },
    currentLevelTitle = "초보 계획자",
  } = useProgress() || {}; // useProgress가 undefined인 경우도 처리

  // 애니메이션 값
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showLevelInfo, setShowLevelInfo] = useState(false); // 레벨 정보 표시 상태

  // 출석체크 애니메이션
  useEffect(() => {
    if (!checkedToday) {
      // 아직 출석체크를 하지 않았다면 깜빡이는 애니메이션 적용
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // 이미 출석체크를 했다면 애니메이션 중지
      pulseAnim.setValue(1);
    }
  }, [checkedToday, pulseAnim]);

  // 알림 관련 기능 (기존 코드)
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const notifications = await AsyncStorage.getItem("@notifications");
        if (notifications) {
          const parsedNotifications = JSON.parse(notifications);
          const count = parsedNotifications.filter((noti) => !noti.read).length;
          setLocalNotificationCount(count);
        }
      } catch (error) {
        console.error("알림 개수 로드 오류:", error);
      }
    };

    loadUnreadCount();

    // 이 부분을 수정 - 불필요한 리로드 방지
    let isMounted = true;
    const unsubscribe = navigation.addListener("focus", () => {
      // 화면이 마운트된 상태일 때만 실행
      if (isMounted) {
        // 디바운스 효과를 위해 약간의 지연 추가
        const timer = setTimeout(() => {
          if (loadNotifications) {
            loadNotifications();
          } else {
            loadUnreadCount();
          }
        }, 300);

        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation, loadNotifications]);

  // 레벨 정보 토글
  const toggleLevelInfo = () => {
    setShowLevelInfo(!showLevelInfo);
  };

  // 실제 표시할 알림 개수 결정 (컨텍스트가 우선, 없으면 로컬 상태 사용)
  const notificationCount =
    unreadCount !== undefined ? unreadCount : localNotificationCount;

  // 출석체크 화면으로 이동
  const handleAttendanceCheck = () => {
    // 항상 StreakScreen으로 이동만 함 (출석체크는 StreakScreen에서 처리)
    navigation.navigate("Streak");
  };

  // 안전하게 레벨 진행 퍼센티지 계산 (undefined 방지)
  const getLevelProgressPercentage = () => {
    if (!levelProgress || typeof levelProgress.percentage !== "number") {
      return "0%";
    }
    return `${levelProgress.percentage}%`;
  };

  return (
    <View style={styles.container}>
      {/* 레벨 정보 팝업 */}
      {showLevelInfo && (
        <Pressable
          style={styles.levelInfoOverlay}
          onPress={() => setShowLevelInfo(false)}
        >
          <View style={styles.levelInfoContainer}>
            <View style={styles.levelInfoHeader}>
              <Text style={styles.levelInfoTitle}>레벨 {level}</Text>
              <Text style={styles.titleText}>{currentLevelTitle}</Text>
            </View>

            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgressBar}>
                <View
                  style={[
                    styles.levelProgressFill,
                    { width: getLevelProgressPercentage() },
                  ]}
                />
              </View>
              <Text style={styles.levelProgressText}>
                {(levelProgress?.current || 0).toLocaleString()} /{" "}
                {(levelProgress?.required || 100).toLocaleString()} XP
              </Text>
            </View>

            <Text style={styles.levelInfoHint}>
              일정 완료, 출석 체크로 XP를 모으세요!
            </Text>
          </View>
        </Pressable>
      )}

      <View style={styles.leftSection}>
        {/* 출석체크 영역 */}
        <TouchableOpacity
          style={styles.attendanceContainer}
          onPress={handleAttendanceCheck}
          activeOpacity={checkedToday ? 0.7 : 0.5}
        >
          <Animated.View
            style={[
              styles.fireIconContainer,
              { transform: [{ scale: checkedToday ? 1 : pulseAnim }] },
            ]}
          >
            <Text style={styles.fireIcon}>🔥</Text>
          </Animated.View>
          <View>
            <Text style={styles.streakCount}>{streak}일</Text>
            <Text style={styles.streakLabel}>연속</Text>
          </View>
        </TouchableOpacity>

        {/* 레벨 표시 영역 */}
        <TouchableOpacity
          style={styles.levelContainer}
          onPress={() => navigation.navigate("Level")}
        >
          <Text style={styles.levelText}>Lv.{level}</Text>
        </TouchableOpacity>

        {/* 포인트 표시 영역 */}
        <TouchableOpacity
          style={styles.pointsContainer}
          onPress={() => {
            navigation.navigate("Points");
          }}
          key={`points-${points}`}
        >
          <Text style={styles.pointsText} key={`points-text-${points}`}>
            {points.toLocaleString()}P
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            navigation.navigate("Badges");
          }}
        >
          <Ionicons name="trophy-outline" size={24} color="#E8883E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            console.log("알림 화면으로 이동");
            if (navigation && navigation.navigate) {
              navigation.navigate("Notifications");
            } else {
              console.error(
                "Navigation object is undefined or missing navigate function"
              );
            }
          }}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {notificationCount > 99 ? "99+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            console.log("마이페이지로 이동");
            if (navigation && navigation.navigate) {
              navigation.navigate("MyPage");
            } else {
              console.error(
                "Navigation object is undefined or missing navigate function"
              );
            }
          }}
        >
          <Ionicons name="person-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  fireIconContainer: {
    marginRight: 4,
  },
  fireIcon: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B3D",
  },
  streakLabel: {
    fontSize: 10,
    color: "#FF9370",
  },
  levelContainer: {
    backgroundColor: "#EEFBF5",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#50cebb",
  },
  pointsContainer: {
    backgroundColor: "#F4F9FF",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginLeft: 20,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E15C64",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  notificationText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  // 레벨 정보 팝업 스타일
  levelInfoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  levelInfoContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelInfoHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  levelInfoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#50cebb",
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  levelProgressContainer: {
    width: "100%",
    marginBottom: 16,
  },
  levelProgressBar: {
    height: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    backgroundColor: "#50cebb",
    borderRadius: 6,
  },
  levelProgressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  levelInfoHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default HeaderBar;
