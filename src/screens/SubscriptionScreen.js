// src/screens/SubscriptionScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

const SubscriptionScreen = ({ navigation }) => {
  const { userData, isLoggedIn } = useAuth();
  const { isSubscribed, subscriptionData, loading, subscribe, unsubscribe } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Subscription plans data
  const plans = [
    {
      id: "monthly",
      title: "월간 구독",
      price: "4,900원/월",
      features: [
        "무제한 일정 생성",
        "AI 학습 피드백",
        "고급 통계 보고서",
        "모든 앱 기능 이용",
      ],
      savings: "",
      mostPopular: false,
    },
    {
      id: "yearly",
      title: "연간 구독",
      price: "49,000원/년",
      features: [
        "무제한 일정 생성",
        "AI 학습 피드백",
        "고급 통계 보고서",
        "모든 앱 기능 이용",
        "2개월 무료 (16% 할인)",
      ],
      savings: "16% 할인",
      mostPopular: true,
    },
  ];

  // Handle subscription purchase
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      Alert.alert("로그인 필요", "구독을 시작하려면 먼저 로그인해주세요.", [
        { text: "취소", style: "cancel" },
        {
          text: "로그인하기",
          onPress: () =>
            navigation.navigate("Login", { returnToScreen: "Subscription" }),
        },
      ]);
      return;
    }

    // Here you would typically handle the actual payment process
    setProcessingPayment(true);

    // Mock payment process
    setTimeout(async () => {
      try {
        const success = await subscribe(selectedPlan, "creditCard");

        if (success) {
          Alert.alert(
            "구독 완료",
            `플랜이지 플러스 ${
              selectedPlan === "monthly" ? "월간" : "연간"
            } 구독이 시작되었습니다!`,
            [{ text: "확인", onPress: () => navigation.navigate("MyPage") }]
          );
        } else {
          Alert.alert(
            "오류",
            "구독 처리 중 문제가 발생했습니다. 다시 시도해주세요."
          );
        }
      } catch (error) {
        console.error("Subscription error:", error);
        Alert.alert(
          "오류",
          "구독 처리 중 문제가 발생했습니다. 다시 시도해주세요."
        );
      } finally {
        setProcessingPayment(false);
      }
    }, 2000); // Simulate payment processing delay
  };

  // Handle unsubscribe
  const handleUnsubscribe = () => {
    Alert.alert(
      "구독 취소",
      "정말 플랜이지 플러스 구독을 취소하시겠습니까? 현재 구독 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.",
      [
        { text: "아니오", style: "cancel" },
        {
          text: "구독 취소",
          style: "destructive",
          onPress: async () => {
            setProcessingPayment(true);
            try {
              const success = await unsubscribe();

              if (success) {
                Alert.alert(
                  "구독 취소 완료",
                  "구독이 취소되었습니다. 구독 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.",
                  [
                    {
                      text: "확인",
                      onPress: () => navigation.navigate("MyPage"),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "오류",
                  "구독 취소 중 문제가 발생했습니다. 다시 시도해주세요."
                );
              }
            } catch (error) {
              console.error("Unsubscribe error:", error);
              Alert.alert(
                "오류",
                "구독 취소 중 문제가 발생했습니다. 다시 시도해주세요."
              );
            } finally {
              setProcessingPayment(false);
            }
          },
        },
      ]
    );
  };

  // Subscription plan card component
  const PlanCard = ({ plan }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlanCard,
        plan.mostPopular && styles.popularPlanCard,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
      activeOpacity={0.8}
    >
      {plan.mostPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>인기</Text>
        </View>
      )}

      <Text style={styles.planTitle}>{plan.title}</Text>
      <Text style={styles.planPrice}>{plan.price}</Text>

      {plan.savings ? (
        <Text style={styles.savingsText}>{plan.savings}</Text>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#50cebb" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.radioContainer}>
        <View
          style={[
            styles.radioOuter,
            selectedPlan === plan.id && styles.radioOuterSelected,
          ]}
        >
          {selectedPlan === plan.id && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.radioText}>선택</Text>
      </View>
    </TouchableOpacity>
  );

  // Subscription info card for current subscribers
  const SubscriptionInfoCard = () => {
    if (!subscriptionData) return null;

    const formatDate = (dateString) => {
      try {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${
          date.getMonth() + 1
        }월 ${date.getDate()}일`;
      } catch (error) {
        console.error("Date formatting error:", error);
        return "날짜 정보 없음";
      }
    };

    const planTypeText =
      subscriptionData.planType === "monthly" ? "월간" : "연간";
    const startDate = subscriptionData.startDate
      ? formatDate(subscriptionData.startDate)
      : "정보 없음";
    const expiryDate = subscriptionData.expiryDate
      ? formatDate(subscriptionData.expiryDate)
      : "무기한";

    return (
      <View style={styles.subscriptionInfoCard}>
        <View style={styles.subscriptionHeader}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.subscriptionHeaderText}>현재 구독 정보</Text>
        </View>

        <View style={styles.subscriptionDetail}>
          <Text style={styles.subscriptionLabel}>구독 유형:</Text>
          <Text style={styles.subscriptionValue}>
            플랜이지 플러스 {planTypeText}
          </Text>
        </View>

        <View style={styles.subscriptionDetail}>
          <Text style={styles.subscriptionLabel}>시작일:</Text>
          <Text style={styles.subscriptionValue}>{startDate}</Text>
        </View>

        <View style={styles.subscriptionDetail}>
          <Text style={styles.subscriptionLabel}>다음 결제일:</Text>
          <Text style={styles.subscriptionValue}>{expiryDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleUnsubscribe}
        >
          <Text style={styles.cancelButtonText}>구독 취소</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      {loading || processingPayment ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#50cebb" />
          <Text style={styles.loadingText}>
            {processingPayment ? "결제 처리 중..." : "로딩 중..."}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>플랜이지 플러스</Text>
            <Text style={styles.subtitle}>더 많은 기능을 경험해보세요</Text>
          </View>

          {isSubscribed ? (
            // Show current subscription info for subscribed users
            <SubscriptionInfoCard />
          ) : (
            // Show subscription plans for non-subscribers
            <>
              <View style={styles.plansContainer}>
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </View>

              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>플랜이지 플러스 혜택</Text>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name="infinite" size={24} color="#50cebb" />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <Text style={styles.benefitTitle}>무제한 일정 생성</Text>
                    <Text style={styles.benefitDescription}>
                      일정 제한 없이 모든 계획을 관리하세요
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name="analytics" size={24} color="#50cebb" />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <Text style={styles.benefitTitle}>AI 학습 분석</Text>
                    <Text style={styles.benefitDescription}>
                      AI가 학습 패턴을 분석하고 맞춤형 피드백을 제공합니다
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name="sync" size={24} color="#50cebb" />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <Text style={styles.benefitTitle}>클라우드 동기화</Text>
                    <Text style={styles.benefitDescription}>
                      모든 기기에서 일정과 진행 상황을 확인하세요
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name="trophy" size={24} color="#50cebb" />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <Text style={styles.benefitTitle}>특별 배지 및 테마</Text>
                    <Text style={styles.benefitDescription}>
                      독점 배지와 테마로 앱을 커스터마이징하세요
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={handleSubscribe}
              >
                <Text style={styles.subscribeButtonText}>구독 시작하기</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                결제는 확인 시 진행되며, 구독은 자동으로 갱신됩니다. 언제든지
                설정에서 구독을 취소할 수 있습니다. 이용약관 및
                개인정보처리방침에 동의합니다.
              </Text>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#50cebb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#eaeaea",
  },
  selectedPlanCard: {
    borderColor: "#50cebb",
  },
  popularPlanCard: {
    borderColor: "#FFD700",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  popularBadgeText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 12,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#50cebb",
    marginBottom: 5,
  },
  savingsText: {
    fontSize: 14,
    color: "#e91e63",
    fontWeight: "bold",
    marginBottom: 15,
  },
  spacer: {
    height: 20,
  },
  featuresContainer: {
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  radioOuterSelected: {
    borderColor: "#50cebb",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#50cebb",
  },
  radioText: {
    fontSize: 14,
    color: "#666",
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  benefitRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: "#50cebb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  subscribeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disclaimer: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  subscriptionInfoCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#50cebb",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  subscriptionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  subscriptionDetail: {
    flexDirection: "row",
    marginBottom: 15,
  },
  subscriptionLabel: {
    width: 100,
    fontSize: 16,
    color: "#666",
  },
  subscriptionValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cancelButton: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e74c3c",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SubscriptionScreen;
