// src/screens/ScheduleScreen.js
// 중앙 일정관리 메인화면 - 개선된 디자인 및 일관성 있는 내부 화면

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastEventSystem } from "../components/common/AutoToast";
import ConsumerCustom from "../components/ConsumerCustom";
import DaySchedule from "../components/DaySchedule";
import Guide from "../components/Guide";
import WeekendSchedule from "../components/WeekendSchedule";
import { useProgress } from "../context/ProgressContext";
import { useSubscription } from "../context/SubscriptionContext";
import { COLORS } from "../styles/commonStyles"; // 공통 스타일 임포트

// 화면 높이를 가져옵니다.
const windowHeight = Dimensions.get("window").height;
const windowWidth = Dimensions.get("window").width;

// 안전한 바닥 패딩 값 - 탭바 높이 고려
const SAFE_BOTTOM_PADDING = 70;

// 모드별 해제 가격 설정
const MODE_PRICES = {
  "daily-custom": 500, // 요일별 커스텀
  "consumer-custom": 1000, // 사용자 커스텀
};

export default function ScheduleScreen() {
  const [selectedMode, setSelectedMode] = useState(null);
  const navigation = useNavigation();

  // ProgressContext에서 포인트 관련 데이터와 함수 가져오기
  const { points, deductPoints } = useProgress();

  // SubscriptionContext에서 구독 관련 데이터 가져오기
  const { isSubscribed, subscriptionDetails } = useSubscription();

  // 각 모드별 잠금 상태 관리
  const [unlockedModes, setUnlockedModes] = useState({
    "weekday-weekend": true, // 기본적으로 해제됨
    "daily-custom": false, // 기본적으로 잠김
    "consumer-custom": false, // 기본적으로 잠김
  });

  // 모드 잠금 상태 불러오기
  useEffect(() => {
    const loadUnlockedModes = async () => {
      try {
        const savedModes = await AsyncStorage.getItem(
          "@unlocked_schedule_modes"
        );
        if (savedModes) {
          // 저장된 모드 불러오기
          const parsedModes = JSON.parse(savedModes);
          setUnlockedModes({
            ...unlockedModes,
            ...parsedModes,
          });
        }
      } catch (error) {
        console.error("모드 잠금 상태 로드 오류:", error);
      }
    };

    loadUnlockedModes();
  }, []);

  // 구독 상태가 변경될 때마다 잠금 상태 업데이트
  useEffect(() => {
    if (isSubscribed) {
      // 구독 중이면 모든 모드 해제
      setUnlockedModes({
        "weekday-weekend": true,
        "daily-custom": true,
        "consumer-custom": true,
      });
    }
  }, [isSubscribed]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedMode) {
          setSelectedMode(null);
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [selectedMode])
  );

  // 포인트로 모드 해제하는 함수
  const unlockMode = async (mode) => {
    if (unlockedModes[mode]) {
      return true; // 이미 해제된 모드
    }

    // 해제 가격 확인
    const price = MODE_PRICES[mode];

    // 포인트가 충분한지 확인
    if (points < price) {
      ToastEventSystem.showToast(
        `포인트가 부족합니다. (필요: ${price}P)`,
        2000
      );
      return false;
    }

    // 구매 확인 대화상자
    return new Promise((resolve) => {
      Alert.alert(
        "모드 해제",
        `이 모드를 ${price}P를 사용하여 영구 해제하시겠습니까?`,
        [
          {
            text: "취소",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "해제하기",
            onPress: async () => {
              // 포인트 차감
              const success = await deductPoints(
                price,
                `${
                  mode === "daily-custom" ? "요일별 커스텀" : "사용자 커스텀"
                } 모드 해제`
              );

              if (success) {
                // 해제 상태 업데이트
                const newUnlockedModes = {
                  ...unlockedModes,
                  [mode]: true,
                };
                setUnlockedModes(newUnlockedModes);

                // 해제 상태 저장
                await AsyncStorage.setItem(
                  "@unlocked_schedule_modes",
                  JSON.stringify(newUnlockedModes)
                );

                ToastEventSystem.showToast(
                  "모드가 성공적으로 해제되었습니다!",
                  2000
                );
                resolve(true);
              } else {
                resolve(false);
              }
            },
          },
        ]
      );
    });
  };

  // 모드 선택 처리 함수
  const handleModeSelect = async (mode) => {
    // 기본적으로 해제된 모드면 바로 진입
    if (unlockedModes[mode] || isSubscribed) {
      setSelectedMode(mode);
      return;
    }

    // 잠긴 모드라면 해제 시도
    const unlocked = await unlockMode(mode);
    if (unlocked) {
      setSelectedMode(mode);
    }
  };

  // 구독 화면으로 이동하는 함수
  const navigateToSubscription = () => {
    navigation.navigate("Subscription");
  };

  // 포인트 화면으로 이동하는 함수
  const navigateToPoints = () => {
    navigation.navigate("Points");
  };

  // 모드 선택 화면 렌더링
  // 스크롤 없이 한 화면에 모든 콘텐츠가 표시되도록 최적화된 렌더링 함수
  const renderModeSelection = () => (
    <View style={{ flex: 1 }}>
      {/* 상단 그라데이션 헤더 */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.gradientHeader}
      >
        <View style={styles.headerPointsContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>안녕하세요!</Text>
            <Text style={styles.subHeaderText}>오늘의 일정을 관리해보세요</Text>
          </View>
          <TouchableOpacity
            style={styles.pointsBadge}
            onPress={navigateToPoints}
          >
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={styles.pointsText}>{points}P</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {isSubscribed && (
          <View style={styles.subscriptionBanner}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.subscriptionText}>
              구독 중: 모든 기능 이용 가능
            </Text>
          </View>
        )}

        <View style={styles.scheduleCardsContainer}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeSelect("weekday-weekend")}
          >
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>📅</Text>
            </View>
            <Text style={styles.modeTitle}>평일 & 주말 일정</Text>
            <Text style={styles.modeDescription}>
              평일과 주말로 나누어{"\n"}규칙적인 일정을 관리합니다
            </Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Free</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard]}
            onPress={() => handleModeSelect("daily-custom")}
          >
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>⚡</Text>
            </View>
            <Text style={styles.modeTitle}>일반 커스텀</Text>
            <Text style={styles.modeDescription}>
              개인 선호에 맞춘{"\n"}일정을 만듭니다
            </Text>
            <View style={styles.freeBadge}>
              <Ionicons name="heart" size={12} color="#FF6B6B" />
              <Text style={styles.freeText}>무료</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard]}
            onPress={() => handleModeSelect("consumer-custom")}
          >
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>⚙️</Text>
            </View>
            <Text style={styles.modeTitle}>사용자 커스텀</Text>
            <Text style={styles.modeDescription}>
              개인 설정에 맞게{"\n"}일정을 세부 조정합니다
            </Text>
            <View style={styles.freeBadge}>
              <Ionicons name="heart" size={12} color="#FF6B6B" />
              <Text style={styles.freeText}>무료</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 모든 모드가 무료로 제공됨을 안내하는 컴팩트 카드 */}
        <TouchableOpacity
          style={styles.freeAnnouncementCard}
          onPress={navigateToSubscription}
        >
          <Ionicons name="heart" size={20} color="#FF6B6B" />
          <Text style={styles.freeAnnouncementText}>
            🎉 모든 기능이 무료입니다! 자유롭게 이용하세요
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#ADB5BD" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guideCard}
          onPress={() => setSelectedMode("guide")}
        >
          <View style={styles.guideContent}>
            <View style={styles.guideIconContainer}>
              <Text style={styles.guideIcon}>📘</Text>
            </View>
            <View style={styles.guideTextContainer}>
              <Text style={styles.guideTitle}>사용 가이드</Text>
              <Text style={styles.guideDescription}>
                앱 사용 방법과 다양한 기능을 알아봅니다
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 도움말 버튼 */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setSelectedMode("guide")}
        >
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.helpButtonText}>사용 가이드</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 모드 별 컴포넌트를 렌더링하는 함수
  // 일관된 디자인을 위해 더 이상 헤더를 개별적으로 렌더링하지 않음
  // 새로 만든 컴포넌트들이 ScheduleContentLayout을 사용하여 일관된 디자인을 제공
  const renderModeContent = () => {
    if (!selectedMode) return null;

    return (
      <View style={{ flex: 1 }}>
        {selectedMode === "weekday-weekend" && <WeekendSchedule />}
        {selectedMode === "daily-custom" && <DaySchedule />}
        {selectedMode === "consumer-custom" && <ConsumerCustom />}
        {selectedMode === "guide" && (
          <Guide onClose={() => setSelectedMode(null)} />
        )}
      </View>
    );
  };

  useEffect(() => {
    // 이 화면에서만 상태바 스타일을 변경
    const unsubscribe = navigation.addListener("focus", () => {
      // 화면에 진입했을 때 상태바 스타일은 기본값 유지
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        // 상태바 색상을 기본 색상으로 유지 (앱 색상이 침범하지 않도록)
        StatusBar.setBackgroundColor("#FFFFFF");
        StatusBar.setTranslucent(false);
      }
    });

    // 화면에서 나갈 때 기본 스타일로 복원하기 위한 cleanup 함수
    return () => {
      unsubscribe();
      // 앱의 기본 상태바 스타일로 복원
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("#FFFFFF");
        StatusBar.setTranslucent(false);
      }
    };
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {!selectedMode ? renderModeSelection() : renderModeContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  // 그라데이션 헤더 - 높이 최적화
  gradientHeader: {
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30, // 곡선 반경 증가
    borderBottomRightRadius: 30, // 곡선 반경 증가
  },
  headerPointsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22, // 폰트 크기 감소
    fontWeight: "800",
    color: "#fff",
    marginBottom: 3, // 마진 감소
  },
  subHeaderText: {
    fontSize: 14, // 폰트 크기 감소
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -15,
    paddingBottom: SAFE_BOTTOM_PADDING,
  },
  scheduleCardsContainer: {
    flexDirection: "column",
    marginBottom: 12,
  },
  modeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16, // 패딩 감소
    marginBottom: 12, // 마진 감소
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
    position: "relative",
  },
  modeIconContainer: {
    width: 48, // 더 작게
    height: 48, // 더 작게
    borderRadius: 24,
    backgroundColor: "#F0FFF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0F7EF",
  },
  modeIcon: {
    fontSize: 28,
  },
  modeTitle: {
    fontSize: 18, // 폰트 크기 감소
    fontWeight: "800",
    color: "#333333",
    marginBottom: 6, // 마진 감소
  },
  modeDescription: {
    fontSize: 14, // 폰트 크기 감소
    color: "#666666",
    lineHeight: 20, // 줄 높이 감소
  },
  guideCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  guideContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideTextContainer: {
    flex: 1,
  },
  guideIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    borderWidth: 1,
    borderColor: "#D8E2FE",
  },
  guideIcon: {
    fontSize: 28,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333333",
    marginBottom: 6,
  },
  guideDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 22,
  },
  // 구독 관련 스타일 - 컴팩트 버전
  subscriptionCompactCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  subscriptionCompactText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#B78105",
    marginLeft: 10,
    marginRight: 5,
  },
  subscriptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 10, // 패딩 감소
    marginBottom: 15, // 마진 감소
    borderWidth: 1,
    borderColor: "#FFE8B2",
  },
  subscriptionText: {
    fontSize: 14, // 폰트 크기 감소
    fontWeight: "700",
    color: "#B78105",
    marginLeft: 10,
  },
  // 도움말 버튼 스타일
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 5,
  },
  helpButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 6,
  },
  // 무료 안내 카드 스타일
  freeAnnouncementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  freeAnnouncementText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
    marginRight: 8,
  },
  // 무료 배지 스타일
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  freeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
});
