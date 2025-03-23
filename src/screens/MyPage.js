// src/screens/MyPage.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyPage = ({ navigation }) => {
  // Get auth context
  const {
    userData,
    logout,
    loading,
    isLoggedIn,
    deleteAccount,
    handleNaverLogin,
  } = useAuth();

  // Get subscription context
  const {
    isSubscribed,
    subscriptionData,
    loading: subscriptionLoading,
  } = useSubscription();

  // Settings with their current values
  const [settings, setSettings] = useState({
    naverLogin: false,
    kakaotalkLogin: false,
    googleLogin: userData?.authProvider === "google" || false,
    speakingQuiz: true,
    listeningQuiz: true,
    quizEffect: false,
    vibrationEffect: true,
    usefulExpression: true,
    vocabularyAlert: true,
    grammarAlert: true,
    plannerAlert: true,
    eventAlert: true,
    flowersAlert: true,
    contentUpdate: true,
    quizAlert: true,
    videoAlert: true,
    emailMarketing: false,
  });

  // FAQ 모달 상태
  const [showFAQModal, setShowFAQModal] = useState(false);

  // FAQ 아이템
  const faqItems = [
    {
      question: "플랜이지는 어떤 앱인가요?",
      answer:
        "플랜이지는 학습과 일상 계획을 효율적으로 관리할 수 있는 종합 플래너 앱입니다. 시간표 관리, 일정 추적, 학습 타이머, AI 학습 피드백 등의 기능을 제공합니다.",
    },
    {
      question: "무료로 사용할 수 있나요?",
      answer:
        "네, 기본 기능은 무료로 사용하실 수 있습니다. 다만 일부 고급 기능은 플랜이지 플러스 구독을 통해 이용하실 수 있습니다.",
    },
    {
      question: "플랜이지 플러스 구독은 얼마인가요?",
      answer:
        "플랜이지 플러스 구독은 월 9,900원, 연 99,000원으로 제공됩니다. 학생 할인과 정기적인 프로모션도 진행하고 있으니 앱 내 알림을 확인해 주세요.",
    },
    {
      question: "알림 설정은 어디서 변경하나요?",
      answer:
        "마이페이지 > 알림 설정에서 각종 알림을 켜고 끌 수 있습니다. 원하는 시간에 학습 알림을 받을 수 있도록 시간 설정도 가능합니다.",
    },
    {
      question: "데이터 백업 방법이 있나요?",
      answer:
        "네, 계정에 로그인하시면 데이터가 자동으로 클라우드에 백업됩니다. 기기를 변경하더라도 같은 계정으로 로그인하시면 이전 데이터를 불러올 수 있습니다.",
    },
  ];

  // Update settings when userData changes
  useEffect(() => {
    if (userData) {
      setSettings((prev) => ({
        ...prev,
        googleLogin: userData.authProvider === "google",
        naverLogin: userData.authProvider === "naver",
        kakaotalkLogin: userData.authProvider === "kakao",
      }));
    }
  }, [userData]);

  // Refresh auth and subscription states when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("MyPage focused - Current auth state:", isLoggedIn);
      console.log("Current subscription state:", isSubscribed);

      const checkLoginStatus = async () => {
        try {
          // Check stored auth data to confirm login status
          const userData = await AsyncStorage.getItem("@user_auth_data");
          console.log("Stored user data exists:", !!userData);

          // Check stored subscription data
          const subscriptionData = await AsyncStorage.getItem(
            "@user_subscription"
          );
          console.log("Stored subscription data exists:", !!subscriptionData);
        } catch (error) {
          console.error("Error checking stored data:", error);
        }
      };

      checkLoginStatus();
    }, [isLoggedIn, isSubscribed])
  );

  // FAQ item component
  const FAQItem = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.faqQuestionContainer}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#50cebb"
          />
        </View>

        {expanded && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // FAQ modal
  const FAQModal = () => {
    return (
      <Modal
        visible={showFAQModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFAQModal(false)}
      >
        <View style={styles.faqModalContainer}>
          <View style={styles.faqModalHeader}>
            <TouchableOpacity
              style={styles.faqBackButton}
              onPress={() => setShowFAQModal(false)}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.faqModalTitle}>자주 묻는 질문</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.faqModalContent}>
            <Text style={styles.faqModalSubtitle}>
              플랜이지 사용에 대한 도움이 필요하신가요?
            </Text>

            {faqItems.map((item, index) => (
              <FAQItem key={index} item={item} index={index} />
            ))}

            <View style={styles.faqContactSection}>
              <Text style={styles.faqContactTitle}>
                더 궁금한 점이 있으신가요?
              </Text>
              <TouchableOpacity
                style={styles.faqContactButton}
                onPress={() => {
                  setShowFAQModal(false);
                  Alert.alert(
                    "문의하기",
                    "support@planizy.com으로 문의해주세요."
                  );
                }}
              >
                <Text style={styles.faqContactButtonText}>문의하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Toggle function for switches
  const toggleSwitch = (key) => {
    // For login methods, we need special handling
    if (["naverLogin", "kakaotalkLogin", "googleLogin"].includes(key)) {
      Alert.alert(
        "로그인 방식 변경",
        "로그인 방식을 변경하려면 로그아웃 후 새로운 방식으로 로그인해야 합니다.",
        [{ text: "확인", style: "default" }]
      );
      return;
    }

    setSettings({ ...settings, [key]: !settings[key] });
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // 로그아웃 후 현재 화면에 남아있기
          } catch (error) {
            Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const onNaverLoginPress = async () => {
    try {
      console.log("안전한 네이버 로그인 처리 시작");

      // 네이버 로그인 대신 직접 로그인 화면으로 리디렉션
      Alert.alert(
        "네이버 로그인",
        "네이버 로그인을 위해 로그인 화면으로 이동합니다.",
        [
          {
            text: "확인",
            onPress: () => {
              // 로그인 화면으로 이동 (navigation prop 사용)
              navigation.navigate("Login", {
                returnToScreen: "MyPage",
                returnToHome: true,
              });
            },
          },
          { text: "취소", style: "cancel" },
        ]
      );

      return;

      // 아래 코드는 실행되지 않음 (안전을 위해 주석 처리)
      /*
      // handleNaverLogin 함수가 존재하는지 확인
      if (typeof handleNaverLogin !== "function") {
        console.error("네이버 로그인 함수를 찾을 수 없습니다");
        Alert.alert(
          "기능 제한",
          "네이버 로그인 기능을 사용할 수 없습니다. 다른 로그인 방법을 이용해주세요."
        );
        return;
      }
  
      // AuthContext에서 제공하는 네이버 로그인 함수 사용
      const success = await handleNaverLogin();
  
      if (success) {
        console.log("네이버 로그인 성공");
        // 로그인 성공 시 설정 업데이트
        setSettings((prev) => ({
          ...prev,
          naverLogin: true,
        }));
      } else {
        console.log("네이버 로그인 실패 또는 취소됨");
      }
      */
    } catch (error) {
      console.error("네이버 로그인 처리 중 오류:", error);
      Alert.alert(
        "로그인 오류",
        "네이버 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  const goToLogin = () => {
    // 반드시 boolean 타입으로 전달해야 함
    console.log("로그인 화면으로 이동, returnToHome=true 설정");
    navigation.navigate("Login", {
      returnToScreen: "MyPage",
      returnToHome: true, // 로그인 후 홈으로 이동 설정
    });
  };

  // Navigate to subscription screen
  const goToSubscription = () => {
    navigation.navigate("Subscription");
  };

  // Render subscription section based on subscription status
  const renderSubscriptionSection = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>플랜이지 플러스</Text>

        {isSubscribed ? (
          // For subscribed users
          <>
            <View style={styles.subscribedStatusContainer}>
              <View style={styles.subscribedBadge}>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <View style={styles.subscribedInfo}>
                <Text style={styles.subscribedTitle}>
                  플랜이지 플러스 구독 중
                </Text>
                <Text style={styles.subscribedDetail}>
                  {subscriptionData?.planType === "yearly"
                    ? "연간 구독"
                    : "월간 구독"}{" "}
                  •
                  {subscriptionData?.expiryDate
                    ? ` 다음 결제일: ${new Date(
                        subscriptionData.expiryDate
                      ).toLocaleDateString("ko-KR")}`
                    : " 무기한"}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
              <Text style={styles.linkLabel}>구독 관리</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </>
        ) : (
          // For non-subscribed users
          <>
            <TouchableOpacity
              style={styles.subscribePromoContainer}
              onPress={goToSubscription}
              activeOpacity={0.7}
            >
              <View style={styles.subscribePromoContent}>
                <Text style={styles.subscribePromoTitle}>
                  플러스 구독으로 업그레이드
                </Text>
                <Text style={styles.subscribePromoDescription}>
                  더 많은 기능과 혜택을 누려보세요
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#50cebb" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
              <Text style={styles.linkLabel}>구독 혜택 보기</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {(loading || subscriptionLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#50cebb" />
        </View>
      )}

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (navigation && navigation.goBack) {
            navigation.goBack();
          }
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Show different content based on login state */}
      {isLoggedIn ? (
        // Logged in - show user info and options
        <View style={styles.profileContainer}>
          <View style={styles.profileHeaderContainer}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Ionicons name="person" size={40} color="#FFD700" />
              </View>
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#000" />
              </View>
            </View>
            <Text style={styles.usernameText}>
              {userData?.displayName || "사용자"}
            </Text>
            {isSubscribed && (
              <View style={styles.subscriptionBadgeContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.subscriptionBadgeText}>플러스 회원</Text>
              </View>
            )}
          </View>

          {/* User info section */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {userData?.displayName || "사용자"}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.changeButton}>변경</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>플랜이지 아이디</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {userData ? "(연동 중)" : "(미설정)"}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.confirmButton}>인증</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이메일</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {userData?.email || "(미설정)"}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.confirmButton}>인증</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>비밀번호</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>••••••••••</Text>
                <TouchableOpacity>
                  <Text style={styles.changeButton}>변경</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Connected login section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>연결된 로그인</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <View
                  style={[styles.loginIconBg, { backgroundColor: "#1EC800" }]}
                >
                  <Text style={styles.loginIconText}>N</Text>
                </View>
                <Text style={styles.settingLabel}>Naver</Text>
              </View>
              {settings.naverLogin ? (
                // 이미 연결된 경우 스위치 표시
                <Switch
                  trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                  thumbColor={settings.naverLogin ? "#50cebb" : "#f4f3f4"}
                  onValueChange={() => toggleSwitch("naverLogin")}
                  value={settings.naverLogin}
                />
              ) : (
                // 연결되지 않은 경우 버튼 표시
                <TouchableOpacity
                  style={styles.connectLoginButton}
                  onPress={onNaverLoginPress}
                >
                  <Text style={styles.connectLoginButtonText}>연결하기</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <View
                  style={[styles.loginIconBg, { backgroundColor: "#FEE500" }]}
                >
                  <Ionicons name="chatbubble" size={20} color="#3A1D1D" />
                </View>
                <Text style={styles.settingLabel}>Kakaotalk</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                thumbColor={settings.kakaotalkLogin ? "#50cebb" : "#f4f3f4"}
                onValueChange={() => toggleSwitch("kakaotalkLogin")}
                value={settings.kakaotalkLogin}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <View
                  style={[
                    styles.loginIconBg,
                    {
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#ddd",
                    },
                  ]}
                >
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={styles.settingLabel}>Google</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#a8e8e0" }}
                thumbColor={settings.googleLogin ? "#50cebb" : "#f4f3f4"}
                onValueChange={() => toggleSwitch("googleLogin")}
                value={settings.googleLogin}
              />
            </View>
          </View>

          {/* Subscription section - shown only for logged in users */}
          {renderSubscriptionSection()}

          {/* Logout section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
              <Text style={styles.linkLabel}>로그아웃</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => {
                Alert.alert(
                  "회원 탈퇴",
                  "회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?",
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "탈퇴하기",
                      onPress: async () => {
                        try {
                          const success = await deleteAccount();
                          if (success) {
                            Alert.alert(
                              "탈퇴 완료",
                              "회원 탈퇴가 완료되었습니다."
                            );
                            // The UI will update automatically since isLoggedIn is now false
                          } else {
                            Alert.alert(
                              "오류",
                              "회원 탈퇴 중 문제가 발생했습니다. 다시 시도해주세요."
                            );
                          }
                        } catch (error) {
                          console.error("탈퇴 처리 오류:", error);
                          Alert.alert(
                            "오류",
                            "회원 탈퇴 중 문제가 발생했습니다. 다시 시도해주세요."
                          );
                        }
                      },
                      style: "destructive",
                    },
                  ]
                );
              }}
            >
              <Text style={styles.linkLabel}>회원 탈퇴</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Not logged in - show login prompt
        <View style={styles.notLoggedInContainer}>
          <View style={styles.notLoggedInIcon}>
            <Ionicons name="person-circle-outline" size={80} color="#50cebb" />
          </View>
          <Text style={styles.notLoggedInTitle}>로그인이 필요합니다</Text>
          <Text style={styles.notLoggedInDescription}>
            로그인하여 일정을 백업하고, 여러 기기에서 동기화하세요. 개인화된
            설정과 프리미엄 기능도 이용할 수 있습니다.
          </Text>

          <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
            <Text style={styles.loginButtonText}>로그인 / 회원가입</Text>
          </TouchableOpacity>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>로그인 시 혜택</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="cloud-upload-outline" size={24} color="#50cebb" />
              <Text style={styles.benefitText}>데이터 백업 및 복원</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="sync-outline" size={24} color="#50cebb" />
              <Text style={styles.benefitText}>여러 기기에서 일정 동기화</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="star-outline" size={24} color="#50cebb" />
              <Text style={styles.benefitText}>프리미엄 기능 이용</Text>
            </View>
          </View>

          {/* Show subscription promotion for non-logged in users too */}
          <TouchableOpacity
            style={styles.premiumPromoContainer}
            onPress={() =>
              Alert.alert(
                "로그인 필요",
                "플랜이지 플러스를 이용하려면 먼저 로그인해주세요."
              )
            }
          >
            <View style={styles.premiumPromoHeader}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.premiumPromoTitle}>플랜이지 플러스</Text>
            </View>
            <Text style={styles.premiumPromoDescription}>
              구독하여 무제한 일정 생성, AI 학습 분석, 클라우드 동기화 등 더
              많은 기능을 이용해보세요.
            </Text>
            <View style={styles.premiumPromoButton}>
              <Text style={styles.premiumPromoButtonText}>자세히 보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#50cebb" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Common section - App info */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>앱 정보</Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setShowFAQModal(true)}
        >
          <Text style={styles.linkLabel}>자주 묻는 질문</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() =>
            Alert.alert(
              "도움말 및 문의하기",
              "support@planizy.com으로 문의해주세요."
            )
          }
        >
          <Text style={styles.linkLabel}>도움말 및 문의하기</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <View style={styles.linkRow}>
          <Text style={styles.linkLabel}>앱 버전</Text>
          <Text style={styles.versionText}>1.2.4</Text>
        </View>
      </View>

      {/* FAQ modal */}
      <FAQModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  profileContainer: {
    padding: 16,
  },
  backButton: {
    margin: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeaderContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8E1",
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  usernameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  subscriptionBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  subscriptionBadgeText: {
    fontSize: 14,
    color: "#FFB74D",
    fontWeight: "bold",
    marginLeft: 5,
  },
  userInfoContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 15,
    color: "#333",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 15,
    color: "#666",
    marginRight: 10,
  },
  changeButton: {
    fontSize: 14,
    color: "#50cebb",
  },
  confirmButton: {
    fontSize: 14,
    color: "#50cebb",
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginIconText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingLabel: {
    fontSize: 15,
    color: "#333",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  linkLabel: {
    fontSize: 15,
    color: "#333",
  },
  linkButton: {
    fontSize: 14,
    color: "#50cebb",
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },

  // Subscription section styles
  subscribedStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  subscribedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFAF0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  subscribedInfo: {
    flex: 1,
  },
  subscribedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  subscribedDetail: {
    fontSize: 14,
    color: "#666",
  },
  subscribePromoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  subscribePromoContent: {
    flex: 1,
  },
  subscribePromoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 2,
  },
  subscribePromoDescription: {
    fontSize: 14,
    color: "#42A5F5",
  },

  // FAQ modal styles
  faqModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  faqModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    backgroundColor: "#fff",
  },
  faqBackButton: {
    padding: 5,
  },
  faqModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  faqModalContent: {
    flex: 1,
    padding: 16,
  },
  faqModalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 8,
    overflow: "hidden",
  },
  faqQuestionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
  faqAnswer: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  faqContactSection: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  faqContactTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  faqContactButton: {
    backgroundColor: "#50cebb",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  faqContactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Not logged in styles
  notLoggedInContainer: {
    padding: 20,
    alignItems: "center",
  },
  notLoggedInIcon: {
    marginVertical: 20,
  },
  notLoggedInTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  notLoggedInDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: "#50cebb",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  benefitText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  premiumPromoContainer: {
    width: "100%",
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  premiumPromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  premiumPromoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  premiumPromoDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  premiumPromoButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumPromoButtonText: {
    fontSize: 14,
    color: "#50cebb",
    fontWeight: "bold",
    marginRight: 5,
  },
  connectLoginButton: {
    backgroundColor: "#1EC800",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  connectLoginButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default MyPage;
