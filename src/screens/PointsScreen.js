// src/screens/PointsScreen.js - 수정된 버전
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  navigate,
  useCallback,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../context/ProgressContext";
import { ToastEventSystem } from "../components/common/AutoToast";
import { getRecentColorPurchases } from "../utils/pointHistoryManager";
import React, { useState, useEffect } from "react";
import { addDDaySlotPurchase } from "../utils/pointHistoryManager";

const UNLOCKED_COLORS_STORAGE_KEY = "unlocked_schedule_colors";

const COLOR_PALETTE = [
  // 기본 색상 (처음부터 해금됨)
  "rgba(77, 171, 247, 0.60)", // 파란색 - 기본 색상

  // 일반 색상 (50포인트)
  "rgba(81, 207, 102, 0.60)", // 녹색
  "rgba(32, 147, 201, 0.60)", // 남색
  "rgba(32, 201, 151, 0.60)", // 청록색
  "rgba(100, 194, 178, 0.60)", // 민트
  "rgba(252, 196, 25, 0.60)", // 노란색
  "rgba(255, 146, 43, 0.60)", // 주황색
  "rgba(234, 82, 211, 0.60)", // 분홍색
  "rgba(204, 93, 232, 0.60)", // 보라색
  "rgba(255, 107, 107, 0.60)", // 빨간색
  "rgba(33, 150, 243, 0.60)", // 하늘색
  "rgba(139, 195, 74, 0.60)", // 연두색
  "rgba(158, 158, 158, 0.60)", // 회색
  "rgba(96, 125, 139, 0.60)", // 파란 회색

  // 프리미엄 색상 (80포인트)
  "rgba(255, 0, 106, 0.60)", // 자홍색
  "rgba(130, 80, 223, 0.60)", // 라벤더
  "rgba(245, 131, 69, 0.60)", // 밝은 주황색
  "rgba(80, 200, 120, 0.60)", // 연두색
  "rgba(134, 65, 244, 0.60)", // 진한 보라색
  "rgba(233, 30, 99, 0.60)", // 핑크
  "rgba(156, 39, 176, 0.60)", // 진보라색

  // 레어 색상 (100포인트)
  "rgba(0, 188, 212, 0.60)", // 청록색 (다른 색조)
  "rgba(205, 220, 57, 0.60)", // 라임색
  "rgba(255, 235, 59, 0.60)", // 밝은 노란색
  "rgba(255, 193, 7, 0.60)", // 황금색
  "rgba(255, 87, 34, 0.60)", // 주황색 (다른 색조)
  "rgba(121, 85, 72, 0.60)", // 갈색
  "rgba(176, 190, 197, 0.60)", // 청회색
];

// 색상 가격 그룹 (색상 인덱스 범위에 따른 가격)
const COLOR_PRICES = {
  0: 0, // 첫 번째 색상: 무료 (기본 제공)
  1: 50, // 일반 색상: 1-14번째 색상 (인덱스 1-13)
  14: 80, // 프리미엄 색상: 15-21번째 색상 (인덱스 14-20)
  21: 100, // 레어 색상: 22-28번째 색상 (인덱스 21-27)
};

// 색상의 가격 계산 함수
const getColorPrice = (colorIndex) => {
  if (colorIndex === 0) return 0; // 기본 색상
  if (colorIndex >= 1 && colorIndex <= 13) return 50; // 일반 색상
  if (colorIndex >= 14 && colorIndex <= 20) return 80; // 프리미엄 색상
  return 100; // 레어 색상
};

// 색상의 희귀도 표시 함수
const getColorRarity = (colorIndex) => {
  if (colorIndex === 0) return "기본";
  if (colorIndex >= 1 && colorIndex <= 13) return "일반";
  if (colorIndex >= 14 && colorIndex <= 20) return "프리미엄";
  return "레어";
};

const PointsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [recentColorPurchases, setRecentColorPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isColorStoreVisible, setIsColorStoreVisible] = useState(false);
  const [selectedColorForPurchase, setSelectedColorForPurchase] =
    useState(null);
  const UNLOCKED_COLORS_STORAGE_KEY = "unlocked_schedule_colors";
  const [unlockedColors, setUnlockedColors] = useState({ 0: true });

  // AsyncStorage를 사용하여 함수 구현
  const saveUnlockedColors = async (updatedColors) => {
    try {
      await AsyncStorage.setItem(
        UNLOCKED_COLORS_STORAGE_KEY,
        JSON.stringify(updatedColors)
      );
      return true;
    } catch (error) {
      console.error("색상 저장 오류:", error);
      return false;
    }
  };

  // 색상 구매 함수
  const purchaseColor = async (colorIndex) => {
    try {
      // 이미 해금된 색상인지 확인
      if (unlockedColors[colorIndex]) {
        Alert.alert("알림", "이미 해금된 색상입니다.");
        return false;
      }

      // 색상 가격 및 희귀도 계산
      const colorPrice = getColorPrice(colorIndex);
      const colorRarity = getColorRarity(colorIndex);

      // 포인트가 충분한지 확인
      if (points < colorPrice) {
        Alert.alert(
          "포인트 부족",
          `색상을 구매하기 위해서는 ${colorPrice}P가 필요합니다.`
        );
        return false;
      }

      await deductPoints(colorPrice, `${colorRarity} 색상 구매`);
      // 포인트 차감
      await addPoints(-colorPrice);

      // 해금된 색상에 추가
      const updatedColors = { ...unlockedColors, [colorIndex]: true };
      const saveResult = await saveUnlockedColors(updatedColors);

      if (saveResult) {
        setUnlockedColors(updatedColors);
      }

      // 구매 내역 추가
      try {
        await addDDaySlotPurchase(colorPrice);
      } catch (historyError) {
        console.warn("색상 구매 내역 추가 실패:", historyError);
      }

      // 구매 성공 메시지
      Alert.alert("구매 완료", `${colorRarity} 색상이 해금되었습니다!`);
      return true;
    } catch (error) {
      console.error("색상 구매 오류:", error);
      Alert.alert("오류", "색상 구매 중 문제가 발생했습니다.");
      return false;
    }
  };

  const renderColorShowcaseModal = () => {
    const unlockedCount = Object.values(unlockedColors).filter(Boolean).length;

    return (
      <Modal
        visible={isColorStoreVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsColorStoreVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorModalContainer}>
            {/* 헤더 */}
            <View style={styles.colorModalHeader}>
              <Text style={styles.colorModalTitle}>색상 갤러리</Text>
              <Text style={styles.colorModalSubtitle}>
                보유 색상: {unlockedCount}/{COLOR_PALETTE.length}
              </Text>
            </View>

            {/* 색상 목록 */}
            <FlatList
              data={COLOR_PALETTE}
              keyExtractor={(_, index) => `color-${index}`}
              contentContainerStyle={styles.colorListContainer}
              renderItem={({ item, index }) => {
                const isUnlocked = unlockedColors[index] || false;
                const colorPrice = getColorPrice(index);
                const colorRarity = getColorRarity(index);

                return (
                  <TouchableOpacity
                    style={styles.colorListItem}
                    // 잠금 해제되지 않은 색상만 클릭 가능하도록
                    onPress={!isUnlocked ? () => purchaseColor(index) : null}
                    disabled={isUnlocked || points < colorPrice}
                  >
                    {/* 기존 UI 구성 유지 */}
                    <View style={styles.colorLeftSection}>
                      <View
                        style={[styles.colorSample, { backgroundColor: item }]}
                      />
                      <Text style={styles.colorName}>{colorRarity} 색상</Text>
                    </View>

                    <View style={styles.colorRightSection}>
                      {isUnlocked ? (
                        <View style={styles.ownedBadge}>
                          <Text style={styles.ownedText}>보유 중</Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.colorPrice,
                            points < colorPrice && styles.insufficientPrice,
                          ]}
                        >
                          {colorPrice}P
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* 푸터 */}
            <View style={styles.colorModalFooter}>
              <Text style={styles.pointsDisplay}>보유 포인트: {points}P</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsColorStoreVisible(false)}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  // 컴포넌트 마운트 시 최근 구매 내역 로드
  useEffect(() => {
    const loadRecentPurchases = async () => {
      setIsLoading(true);
      try {
        const purchases = await getRecentColorPurchases(3); // 최근 3개 항목만 로드
        setRecentColorPurchases(purchases);
      } catch (error) {
        console.error("구매 내역 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentPurchases();
  }, []);

  // 최근 색상 구매 내역을 표시하는 컴포넌트 (업데이트)
  const renderRecentColorPurchases = () => {
    if (isLoading) {
      return (
        <View style={{ alignItems: "center", padding: 10 }}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    if (recentColorPurchases.length === 0) {
      return (
        <View style={styles.emptyHistoryContainer}>
          <Text style={styles.emptyHistoryText}>
            아직 구매한 색상이 없습니다
          </Text>
          <Text style={styles.emptyHistorySubText}>
            주간 시간표에서 색상을 구매해보세요
          </Text>
        </View>
      );
    }

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.historySubTitle}>최근 색상 구매</Text>
        {recentColorPurchases.map((purchase) => (
          <View key={purchase.id} style={styles.recentPurchaseItem}>
            <View
              style={[
                styles.purchaseIcon,
                {
                  backgroundColor:
                    COLOR_PALETTE[purchase.colorIndex] || "#f0f8ff",
                },
              ]}
            >
              <Ionicons name="color-palette" size={20} color="white" />
            </View>
            <View style={styles.purchaseInfo}>
              <Text style={styles.purchaseTitle}>{purchase.colorName}</Text>
              <Text style={styles.purchaseDate}>
                {new Date(purchase.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.purchaseAmount}>-{purchase.price}P</Text>
          </View>
        ))}
      </View>
    );
  };

  const {
    points,
    level,
    streak,
    completedTasks,
    ddaySlots,
    unusedDDaySlots,
    nextSlotPrice,
    purchaseDDaySlot,
    addPoints, // 추가
    deductPoints, // 추가
  } = useProgress();

  // D-Day 슬롯 구매 처리 함수
  const handlePurchaseDDaySlot = async () => {
    try {
      // 포인트가 부족한 경우
      if (points < nextSlotPrice) {
        ToastEventSystem.showToast(
          `포인트가 부족합니다 (필요: ${nextSlotPrice}P)`,
          2000
        );
        return;
      }

      setLoading(true);
      const success = await purchaseDDaySlot();

      if (success) {
        // 구매 내역 추가
        await addDDaySlotPurchase(nextSlotPrice);

        // 구매 성공 시 토스트 메시지
        ToastEventSystem.showToast(`D-Day 슬롯 구매 완료! (+1)`, 2000);
      } else {
        // 구매 실패 시 토스트 메시지
        ToastEventSystem.showToast("슬롯 구매 중 오류가 발생했습니다", 2000);
      }
    } catch (error) {
      console.error("D-Day 슬롯 구매 처리 오류:", error);
      Alert.alert("오류", "슬롯 구매 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 포인트 획득 방법 목록
  const pointSources = [
    {
      icon: "✅",
      name: "일정 완료",
      description: "일정을 완료할 때마다 포인트 획득",
      basePoints: "5-10P",
      bonus: "아침/저녁 일정 보너스 +2-3P",
    },
    {
      icon: "🔥",
      name: "연속 출석",
      description: "매일 앱에 접속하여 포인트 획득",
      basePoints: "5P",
      bonus: "3일 연속: 15P, 7일: 30P, 14일: 60P",
    },
    {
      icon: "⭐",
      name: "레벨업",
      description: "새 레벨 달성 시 포인트 보상",
      basePoints: "레벨 × 20P",
      bonus: "10, 25, 50레벨 특별 보너스",
    },
    {
      icon: "🏆",
      name: "배지 획득",
      description: "새로운 배지 획득 시 XP 및 포인트 획득",
      basePoints: "10-50P",
      bonus: "희귀 배지: 50P, 전설 배지: 100P",
    },
    {
      icon: "✨",
      name: "완벽한 하루",
      description: "하루의 모든 일정을 완료",
      basePoints: "25P",
      bonus: "연속 달성 시 추가 보너스",
    },
    {
      icon: "🎯",
      name: "일일/주간 미션",
      description: "다양한 미션을 완료하여 보너스 포인트 획득",
      basePoints: "10-70P",
      bonus: "모든 미션 완료 시 추가 보너스",
    },
    {
      icon: "🎯",
      name: "일일/주간 미션",
      description: "다양한 미션을 통해 추가 포인트 획득",
      cost: "최대 100P 보너스",
      buttonText: "미션 보기",
      action: () => navigation.navigate("Missions"),
      highlight: true,
    },
  ];
  navigate;

  // 포인트 사용처 목록
  const pointUses = [
    {
      icon: "🎯",
      name: "D-Day 슬롯 확장",
      description: `새로운 D-Day 슬롯 추가 (현재: ${ddaySlots}개)`,
      cost: `다음 슬롯: ${nextSlotPrice}P`,
      buttonText:
        unusedDDaySlots > 0 ? `구매 완료 (+${unusedDDaySlots})` : "구매하기",
      action: handlePurchaseDDaySlot,
      disabled: unusedDDaySlots > 0 || points < nextSlotPrice,
      badgeCount: unusedDDaySlots > 0 ? unusedDDaySlots : null,
    },
    {
      icon: "🎨",
      name: "시간표 색상 팩",
      description: "주간 시간표에 사용할 새로운 색상 해금",
      cost: "50-100P",
      buttonText: "구경하기",
      action: () => setIsColorStoreVisible(true), // 직접 모달 표시
      highlight: true,
    },
    {
      icon: "🎨",
      name: "테마 변경",
      description: "앱 테마 색상 변경",
      cost: "200P부터",
      buttonText: "둘러보기",
      disabled: true,
      comingSoon: true,
    },
    {
      icon: "🔔",
      name: "알림 스타일",
      description: "새로운 알림 소리 및 스타일",
      cost: "150P부터",
      buttonText: "둘러보기",
      disabled: true,
      comingSoon: true,
    },
    {
      icon: "🧩",
      name: "위젯 확장",
      description: "홈 화면 위젯 추가",
      cost: "300P",
      buttonText: "둘러보기",
      disabled: true,
      comingSoon: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>포인트 센터</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("FAQ")}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 포인트 카드 */}
        <View style={styles.pointCard}>
          <View style={styles.pointCardTop}>
            <View style={styles.pointInfo}>
              <Text style={styles.pointLabel}>보유 포인트</Text>
              <Text style={styles.pointValue}>
                {points}
                <Text style={styles.pointUnit}>P</Text>
              </Text>
            </View>
            <View style={styles.pointIllustration}>
              <Text style={styles.pointEmoji}>💰</Text>
            </View>
          </View>
          <View style={styles.pointCardBottom}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>레벨</Text>
              <Text style={styles.statValue}>Lv.{level}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>출석</Text>
              <Text style={styles.statValue}>{streak}일 연속</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>완료 일정</Text>
              <Text style={styles.statValue}>{completedTasks}개</Text>
            </View>
          </View>
        </View>

        {/* D-Day 상태 카드 */}
        <View style={styles.ddayStatusCard}>
          <View style={styles.ddayStatusHeader}>
            <Text style={styles.ddayStatusTitle}>
              <Text style={styles.ddayEmoji}>🎯</Text> D-Day 슬롯 상태
            </Text>
          </View>
          <View style={styles.ddayStatusContent}>
            <View style={styles.ddayStatusItem}>
              <Text style={styles.ddayStatusLabel}>전체 슬롯</Text>
              <Text style={styles.ddayStatusValue}>{ddaySlots}개</Text>
            </View>
            <View style={styles.ddayStatusDivider} />
            <View style={styles.ddayStatusItem}>
              <Text style={styles.ddayStatusLabel}>사용 가능한 슬롯</Text>
              <Text style={styles.ddayStatusValue}>
                {unusedDDaySlots}개
                {unusedDDaySlots > 0 && (
                  <Text style={styles.ddayStatusHint}> (홈에서 사용 가능)</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* 획득 방법 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>⚡</Text> 포인트 획득 방법
          </Text>

          {pointSources.map((source, index) => (
            <View key={index} style={styles.pointItem}>
              <View style={styles.pointItemIcon}>
                <Text style={styles.itemEmoji}>{source.icon}</Text>
              </View>
              <View style={styles.pointItemContent}>
                <Text style={styles.pointItemTitle}>{source.name}</Text>
                <Text style={styles.pointItemDesc}>{source.description}</Text>
                <View style={styles.pointItemReward}>
                  <Text style={styles.basePoints}>{source.basePoints}</Text>
                  {source.bonus && (
                    <Text style={styles.bonusPoints}>{source.bonus}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 사용처 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>🛍️</Text> 포인트 사용처
          </Text>

          {pointUses.map((item, index) => (
            <View
              key={index}
              style={[
                styles.pointShopItem,
                item.highlight && styles.shopItemHighlight,
              ]}
            >
              <View style={styles.shopItemTop}>
                <View style={styles.shopItemIconContainer}>
                  <Text style={styles.shopItemIcon}>{item.icon}</Text>
                  {item.badgeCount && (
                    <View style={styles.shopItemBadge}>
                      <Text style={styles.shopItemBadgeText}>
                        {item.badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.shopItemInfo}>
                  <Text style={styles.shopItemTitle}>{item.name}</Text>
                  <Text style={styles.shopItemDesc}>{item.description}</Text>
                  <Text style={styles.shopItemCost}>{item.cost}</Text>
                </View>
                {item.highlight && (
                  <View style={styles.newFeatureBadge}>
                    <Text style={styles.newFeatureText}>NEW</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.shopItemButton,
                  item.disabled && styles.shopItemButtonDisabled,
                  item.highlight && { backgroundColor: "#007AFF" },
                ]}
                onPress={item.action}
                disabled={item.disabled || (index === 0 && loading)}
              >
                {loading && index === 0 ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.shopItemButtonText,
                      item.disabled && styles.shopItemButtonTextDisabled,
                    ]}
                  >
                    {item.comingSoon ? "곧 출시" : item.buttonText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 히스토리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>📊</Text> 포인트 히스토리
          </Text>

          {/* 최근 색상 구매 내역 */}
          {renderRecentColorPurchases()}

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate("PointHistory")}
          >
            <Text style={styles.historyButtonText}>
              포인트 내역 보기{" "}
              <Ionicons name="chevron-forward" size={14} color="#007AFF" />
            </Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 마지막에 모달 추가 */}
      {renderColorShowcaseModal()}
    </SafeAreaView>
  );
};

const additionalStyles = {
  // 하이라이트된 항목 스타일 (신규 기능 표시)
  shopItemHighlight: {
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  newFeatureBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 1,
  },
  newFeatureText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  // 최근 구매 내역 스타일
  recentPurchaseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  purchaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  purchaseDate: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 2,
  },
  purchaseAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC3545",
  },
};

const styles = StyleSheet.create({
  ...additionalStyles,
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
  pointCard: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pointCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  pointValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  pointUnit: {
    fontSize: 24,
    fontWeight: "normal",
  },
  pointIllustration: {
    justifyContent: "center",
    alignItems: "center",
  },
  pointEmoji: {
    fontSize: 40,
  },
  pointCardBottom: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 8,
  },
  // D-Day 상태 카드 스타일
  ddayStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ddayStatusHeader: {
    marginBottom: 12,
  },
  ddayStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  ddayEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  ddayStatusContent: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
  },
  ddayStatusItem: {
    flex: 1,
    alignItems: "center",
  },
  ddayStatusLabel: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 4,
  },
  ddayStatusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  ddayStatusHint: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "normal",
  },
  ddayStatusDivider: {
    width: 1,
    backgroundColor: "#E9ECEF",
    marginHorizontal: 8,
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
  pointItem: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pointItemIcon: {
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
  itemEmoji: {
    fontSize: 20,
  },
  pointItemContent: {
    flex: 1,
  },
  pointItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  pointItemDesc: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 6,
  },
  pointItemReward: {
    flexDirection: "row",
    alignItems: "center",
  },
  basePoints: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusPoints: {
    fontSize: 13,
    color: "#FF9500",
    marginLeft: 8,
  },
  pointShopItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  shopItemTop: {
    flexDirection: "row",
    marginBottom: 12,
  },
  shopItemIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
  },
  shopItemIcon: {
    fontSize: 24,
  },
  shopItemBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF9500",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  shopItemBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  shopItemDesc: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 4,
  },
  shopItemCost: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  shopItemButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  shopItemButtonDisabled: {
    backgroundColor: "#E9ECEF",
  },
  shopItemButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  shopItemButtonTextDisabled: {
    color: "#6C757D",
  },
  historyButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F1F3F5",
    borderRadius: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  historySubTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  // 색상 구경하기 모달 스타일

  // 색상 갤러리 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  colorModalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  colorModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "#f9f9f9",
  },
  colorModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  colorModalSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  colorListContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  colorListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colorLeftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorSample: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  colorName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  colorRightSection: {
    alignItems: "flex-end",
  },
  ownedBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ownedText: {
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: 13,
  },
  colorPrice: {
    color: "#f44336",
    fontWeight: "bold",
    fontSize: 16,
  },
  insufficientPrice: {
    color: "#9e9e9e",
  },
  colorModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    backgroundColor: "#f9f9f9",
  },
  pointsDisplay: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: "#2196f3",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  // 추가할 스타일
  emptyHistoryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginVertical: 10,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyHistorySubText: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
  },
});

export default PointsScreen;
