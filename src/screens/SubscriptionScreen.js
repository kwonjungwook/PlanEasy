// src/screens/SubscriptionScreen.js
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

const SubscriptionScreen = ({ navigation }) => {
  const { userData, isLoggedIn } = useAuth();
  const { isSubscribed, subscriptionData, loading } = useSubscription();

  // 무료 제공 기능 리스트
  const freeFeatures = [
    {
      icon: "infinite",
      title: "무제한 일정 생성",
      description: "일정 제한 없이 모든 계획을 관리하세요",
    },
    {
      icon: "analytics",
      title: "AI 학습 분석",
      description: "AI가 학습 패턴을 분석하고 맞춤형 피드백을 제공합니다",
    },
    {
      icon: "sync",
      title: "클라우드 동기화",
      description: "모든 기기에서 일정과 진행 상황을 확인하세요",
    },
    {
      icon: "trophy",
      title: "특별 배지 및 테마",
      description: "독점 배지와 테마로 앱을 커스터마이징하세요",
    },
    {
      icon: "star",
      title: "프리미엄 기능",
      description: "모든 고급 기능을 무료로 이용하세요",
    },
  ];

  // 무료 제공 안내 카드
  const FreeServiceInfoCard = () => (
    <View style={styles.freeServiceCard}>
      <View style={styles.freeServiceHeader}>
        <Ionicons name="heart" size={24} color="#FF6B6B" />
        <Text style={styles.freeServiceHeaderText}>
          🎉 모든 기능 무료 제공! 🎉
        </Text>
      </View>

      <Text style={styles.freeServiceDescription}>
        플랜이지의 모든 프리미엄 기능을 무료로 사용하실 수 있습니다!
        {"\n"}더 이상 구독이 필요하지 않아요.
      </Text>

      <View style={styles.freeServiceDetail}>
        <Text style={styles.freeServiceLabel}>상태:</Text>
        <Text style={styles.freeServiceValue}>모든 기능 무료 이용 가능 ✨</Text>
      </View>

      <View style={styles.freeServiceDetail}>
        <Text style={styles.freeServiceLabel}>기간:</Text>
        <Text style={styles.freeServiceValue}>영구 무료</Text>
      </View>

      <View style={styles.freeServiceDetail}>
        <Text style={styles.freeServiceLabel}>혜택:</Text>
        <Text style={styles.freeServiceValue}>모든 프리미엄 기능 포함</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#50cebb" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={40} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>플랜이지 - 모든 기능 무료!</Text>
            <Text style={styles.subtitle}>
              모든 프리미엄 기능을 무료로 즐기세요
            </Text>
          </View>

          {/* 무료 제공 안내 카드 */}
          <FreeServiceInfoCard />

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>
              무료로 이용 가능한 모든 기능
            </Text>

            {freeFeatures.map((feature, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons name={feature.icon} size={24} color="#50cebb" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>{feature.title}</Text>
                  <Text style={styles.benefitDescription}>
                    {feature.description}
                  </Text>
                </View>
                <View style={styles.freeIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.freeText}>무료</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.thankYouContainer}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.thankYouTitle}>감사합니다!</Text>
            <Text style={styles.thankYouMessage}>
              플랜이지를 이용해 주시는 모든 분들께 감사드리며,{"\n"}
              앞으로도 더 나은 서비스로 보답하겠습니다.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate("MyPage")}
          >
            <Text style={styles.continueButtonText}>마이페이지로 돌아가기</Text>
          </TouchableOpacity>
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
  freeServiceCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#50cebb",
  },
  freeServiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  freeServiceHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  freeServiceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  freeServiceDetail: {
    flexDirection: "row",
    marginBottom: 15,
  },
  freeServiceLabel: {
    width: 100,
    fontSize: 16,
    color: "#666",
  },
  freeServiceValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  freeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  freeText: {
    fontSize: 14,
    color: "#50cebb",
    fontWeight: "bold",
    marginLeft: 5,
  },
  thankYouContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  thankYouTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  thankYouMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: "#50cebb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SubscriptionScreen;
