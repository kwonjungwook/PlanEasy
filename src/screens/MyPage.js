import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

// 캐릭터 아바타 목록 (이미지 URL 대신 로컬 리소스 ID를 사용하는 실제 앱에서는 require() 사용)
// 여기서는 예시 URL을 사용합니다
const CHARACTER_AVATARS = [
  {
    id: "char1",
    name: "무지",
    icon: "happy-outline",
    color: "#FFA000",
    bgColor: "#FFF8E1",
  },
  {
    id: "char2",
    name: "콘",
    icon: "star-outline",
    color: "#1976D2",
    bgColor: "#E3F2FD",
  },
  {
    id: "char3",
    name: "프로도",
    icon: "paw-outline",
    color: "#FF6D00",
    bgColor: "#FFF3E0",
  },
  {
    id: "char4",
    name: "네오",
    icon: "heart-outline",
    color: "#D81B60",
    bgColor: "#FCE4EC",
  },
  {
    id: "char5",
    name: "튜브",
    icon: "water-outline",
    color: "#00ACC1",
    bgColor: "#E0F7FA",
  },
  {
    id: "char6",
    name: "제이지",
    icon: "musical-notes-outline",
    color: "#5E35B1",
    bgColor: "#EDE7F6",
  },
  {
    id: "char7",
    name: "라이언",
    icon: "logo-reddit",
    color: "#F57C00",
    bgColor: "#FFF3E0",
  },
  {
    id: "char8",
    name: "어피치",
    icon: "flower-outline",
    color: "#EC407A",
    bgColor: "#FCE4EC",
  },
];
// 이모티콘 목록
const PROFILE_EMOJIS = [
  "🙂",
  "😊",
  "🥰",
  "😎",
  "🤩",
  "🤓",
  "😄",
  "😍",
  "🤗",
  "🤔",
  "😌",
  "🧐",
  "😇",
  "🥳",
  "🦄",
  "🦊",
  "🐱",
  "🐶",
];

const MyPage = ({ navigation }) => {
  // Auth context 사용
  const { userData, logout, loading, isLoggedIn, deleteAccount } = useAuth();

  // Subscription context 사용
  const {
    isSubscribed,
    subscriptionData,
    loading: subscriptionLoading,
  } = useSubscription();

  // 캐릭터/이모티콘 선택 모달
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  // 닉네임 변경 모달
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 이미지 업로드 관련 상태
  const [profileImage, setProfileImage] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

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
      question: "정말 모든 기능이 무료인가요?",
      answer:
        "네! 플랜이지의 모든 기능이 완전 무료입니다. AI 분석, 무제한 일정 생성, 고급 통계 등 모든 프리미엄 기능을 자유롭게 이용하실 수 있습니다.",
    },
    {
      question: "무료 제공으로 바뀐 이유가 궁금합니다.",
      answer:
        "더 많은 사용자분들께 플랜이지의 모든 기능을 제공하고 싶어서 무료 전환을 결정했습니다. 앞으로도 광고 없이 깔끔한 환경에서 모든 기능을 무료로 이용하실 수 있습니다.",
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

  // Update nickname when userData changes
  useEffect(() => {
    if (userData) {
      setNickname(userData.displayName || "");

      // 프로필 정보 처리
      if (userData.photoURL) {
        if (userData.photoURL.startsWith("emoji:")) {
          // 이모티콘 설정
          setSelectedEmoji(userData.photoURL.replace("emoji:", ""));
          setProfileImage(null);
          setSelectedCharacter(null);
        } else if (userData.photoURL.startsWith("character:")) {
          // 캐릭터 설정
          const charId = userData.photoURL.replace("character:", "");
          const char = CHARACTER_AVATARS.find((c) => c.id === charId);
          if (char) {
            setSelectedCharacter(char);
            setProfileImage(null);
            setSelectedEmoji(null);
          }
        } else {
          // 일반 이미지
          setProfileImage(userData.photoURL);
          setSelectedCharacter(null);
          setSelectedEmoji(null);
        }
      }
    }
  }, [userData]);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      console.log("MyPage focused - Current auth state:", isLoggedIn);
      console.log("Current subscription state:", isSubscribed);

      const checkLoginStatus = async () => {
        try {
          // 저장된 사용자 데이터 확인
          const userData = await AsyncStorage.getItem("@user_auth_data");
          console.log("Stored user data exists:", !!userData);

          // 저장된 구독 데이터 확인
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

  // 프로필 이미지 선택 함수
  const pickImage = async () => {
    try {
      // 권한 요청
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "권한 필요",
          "사진을 선택하려면 갤러리 접근 권한이 필요합니다."
        );
        return;
      }

      // 갤러리에서 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        // 이미지 URI 저장
        const imageUri = result.assets[0].uri;

        // 프로필 상태 업데이트
        setProfileImage(imageUri);
        setSelectedEmoji(null);
        setSelectedCharacter(null);

        // 사용자 데이터 업데이트
        updateUserProfileData({ photoURL: imageUri });
      }
    } catch (error) {
      console.error("이미지 선택 오류:", error);
      Alert.alert("오류", "이미지를 선택하는 중 문제가 발생했습니다.");
    }

    setShowImageOptions(false);
  };

  // 사용자 프로필 데이터 업데이트 (함수 사용 가능 여부 확인)
  const updateUserProfileData = async (profileData) => {
    try {
      // 1. 먼저 AsyncStorage에 직접 저장
      const storedUserData = await AsyncStorage.getItem("@user_auth_data");
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const updatedUserData = { ...userData, ...profileData };
        await AsyncStorage.setItem(
          "@user_auth_data",
          JSON.stringify(updatedUserData)
        );

        console.log("AsyncStorage에 프로필 데이터 저장 성공");
      }

      // 2. 가능한 경우 AuthContext의 함수 사용
      if (typeof updateUserProfile === "function") {
        await updateUserProfile(profileData);
        console.log("AuthContext의 updateUserProfile 함수 사용 성공");
      }

      return true;
    } catch (error) {
      console.error("사용자 프로필 업데이트 오류:", error);
      return false;
    }
  };

  // 이모티콘 선택 처리
  const handleSelectEmoji = async (emoji) => {
    try {
      // 프로필 상태 업데이트
      setSelectedEmoji(emoji);
      setProfileImage(null);
      setSelectedCharacter(null);

      // 이모티콘을 프로필 정보로 저장
      const emojiProfileInfo = `emoji:${emoji}`;

      // 사용자 데이터 업데이트
      await updateUserProfileData({ photoURL: emojiProfileInfo });

      setShowEmojiModal(false);
    } catch (error) {
      console.error("이모티콘 설정 오류:", error);
      Alert.alert("오류", "이모티콘을 설정하는 중 문제가 발생했습니다.");
    }
  };

  // 캐릭터 선택 처리
  const handleSelectCharacter = async (character) => {
    try {
      // 프로필 상태 업데이트
      setSelectedCharacter(character);
      setProfileImage(null);
      setSelectedEmoji(null);

      // 캐릭터 정보를 프로필로 저장
      const characterProfileInfo = `character:${character.id}`;

      // 사용자 데이터 업데이트
      await updateUserProfileData({ photoURL: characterProfileInfo });

      setShowCharacterModal(false);
    } catch (error) {
      console.error("캐릭터 설정 오류:", error);
      Alert.alert("오류", "캐릭터를 설정하는 중 문제가 발생했습니다.");
    }
  };

  // 닉네임 변경 함수
  const handleChangeNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert("오류", "닉네임을 입력해주세요.");
      return;
    }

    try {
      setUpdatingProfile(true);

      // 닉네임 업데이트
      const success = await updateUserProfileData({ displayName: nickname });

      if (success) {
        Alert.alert("성공", "닉네임이 성공적으로 변경되었습니다.");
        setShowNicknameModal(false);
      } else {
        Alert.alert(
          "오류",
          "닉네임 변경 중 문제가 발생했습니다. 다시 시도해주세요."
        );
      }
    } catch (error) {
      console.error("닉네임 변경 오류:", error);
      Alert.alert(
        "오류",
        "닉네임 변경 중 문제가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  // 로그아웃 처리
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

  // 로그인 화면으로 이동
  const goToLogin = () => {
    console.log("로그인 화면으로 이동");
    navigation.navigate("Login", {
      returnToScreen: "Main", // 메인으로 돌아가도록 수정
      returnToHome: true,
    });
  };

  // 구독 화면으로 이동
  const goToSubscription = () => {
    navigation.navigate("Subscription");
  };

  // 프로필 렌더링 함수
  const renderProfileImage = () => {
    // 캐릭터가 선택된 경우
    if (selectedCharacter) {
      try {
        return (
          <View style={styles.profileImage}>
            <Image
              source={selectedCharacter.displayUrl}
              style={styles.characterImage}
              resizeMode="cover"
            />
          </View>
        );
      } catch (error) {
        console.error("캐릭터 이미지 로드 오류:", error);
        // 오류 시 기본 아이콘으로 대체
        return (
          <View style={styles.profileImage}>
            <Ionicons name="person" size={40} color="#FFD700" />
          </View>
        );
      }
    }

    // 이모티콘이 선택된 경우
    else if (selectedEmoji) {
      return (
        <View style={styles.profileImage}>
          <Text style={styles.profileEmoji}>{selectedEmoji}</Text>
        </View>
      );
    }

    // 일반 이미지가 있으면 이미지로 표시
    else if (profileImage) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
          resizeMode="cover"
        />
      );
    }

    // 이미지도 이모티콘도 없으면 기본 아이콘
    return (
      <View style={styles.profileImage}>
        <Ionicons name="person" size={40} color="#FFD700" />
      </View>
    );
  };

  // 구독 섹션 렌더링
  const renderSubscriptionSection = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          플랜이지 - 모든 기능 무료 제공! 🎉
        </Text>

        {/* 무료 제공 상태 표시 */}
        <View style={styles.freeStatusContainer}>
          <View style={styles.freeBadge}>
            <Ionicons name="heart" size={22} color="#FF6B6B" />
          </View>
          <View style={styles.freeInfo}>
            <Text style={styles.freeTitle}>
              모든 프리미엄 기능 무료 이용 중! ✨
            </Text>
            <Text style={styles.freeDetail}>영구 무료 • 모든 기능 포함</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
          <Text style={styles.linkLabel}>무료 제공 안내 보기</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        {/* 무료 기능 목록 */}
        <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
          <View style={styles.benefitRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4CAF50"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitLabel}>무제한 일정 생성 - 무료</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
          <View style={styles.benefitRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4CAF50"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitLabel}>AI 학습 분석 및 추천 - 무료</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={goToSubscription}>
          <View style={styles.benefitRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4CAF50"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitLabel}>모든 프리미엄 기능 - 무료</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // FAQ 아이템 컴포넌트
  const FAQItem = ({ item }) => {
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

  // FAQ 모달
  const FAQModal = () => (
    <Modal
      visible={showFAQModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowFAQModal(false)}
    >
      <SafeAreaView style={styles.faqModalContainer}>
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
            <FAQItem key={index} item={item} />
          ))}

          <View style={styles.faqContactSection}>
            <Text style={styles.faqContactTitle}>
              더 궁금한 점이 있으신가요?
            </Text>
            <TouchableOpacity
              style={styles.faqContactButton}
              onPress={() => {
                setShowFAQModal(false);
                Alert.alert("문의하기", "kazuya7x@naver.com으로 문의해주세요.");
              }}
            >
              <Text style={styles.faqContactButtonText}>문의하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // 닉네임 변경 모달
  const NicknameModal = () => (
    <Modal
      visible={showNicknameModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowNicknameModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>닉네임 변경</Text>

          <TextInput
            style={styles.modalInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="새 닉네임을 입력하세요"
            autoCapitalize="none"
            maxLength={15}
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowNicknameModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalConfirmButton,
                !nickname.trim() && styles.modalButtonDisabled,
              ]}
              onPress={handleChangeNickname}
              disabled={!nickname.trim() || updatingProfile}
            >
              {updatingProfile ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmButtonText}>변경하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // 이모티콘 선택 모달
  const EmojiPickerModal = () => (
    <Modal
      visible={showEmojiModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEmojiModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.emojiModalContainer}>
          <Text style={styles.modalTitle}>프로필 이모티콘 선택</Text>

          <FlatList
            data={PROFILE_EMOJIS}
            numColumns={4}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiItem}
                onPress={() => handleSelectEmoji(item)}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.emojiGrid}
          />

          <TouchableOpacity
            style={styles.emojiModalCloseButton}
            onPress={() => setShowEmojiModal(false)}
          >
            <Text style={styles.emojiModalCloseText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 캐릭터 선택 모달
  const CharacterPickerModal = () => (
    <Modal
      visible={showCharacterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCharacterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.characterModalContainer}>
          <Text style={styles.modalTitle}>프로필 캐릭터 선택</Text>

          <FlatList
            data={CHARACTER_AVATARS}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.characterItem}
                onPress={() => handleSelectCharacter(item)}
              >
                <View style={styles.characterImageContainer}>
                  <Image
                    source={item.displayUrl}
                    style={styles.characterPreview}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.characterName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.characterGrid}
          />

          <TouchableOpacity
            style={styles.characterModalCloseButton}
            onPress={() => setShowCharacterModal(false)}
          >
            <Text style={styles.characterModalCloseText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 이미지 옵션 모달
  const ImageOptionsModal = () => (
    <Modal
      visible={showImageOptions}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowImageOptions(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowImageOptions(false)}
      >
        <View style={styles.imageOptionsContainer}>
          <TouchableOpacity style={styles.imageOptionItem} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color="#333" />
            <Text style={styles.imageOptionText}>사진 선택하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageOptionItem}
            onPress={() => {
              setShowImageOptions(false);
              setShowCharacterModal(true);
            }}
          >
            <Ionicons name="happy-outline" size={24} color="#333" />
            <Text style={styles.imageOptionText}>캐릭터 선택하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageOptionItem}
            onPress={() => {
              setShowImageOptions(false);
              setShowEmojiModal(true);
            }}
          >
            <Ionicons name="heart-outline" size={24} color="#333" />
            <Text style={styles.imageOptionText}>이모티콘 선택하기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {(loading || subscriptionLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#50cebb" />
          </View>
        )}

        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // navigation.goBack() 대신 안전하게 처리
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Main"); // 뒤로 갈 수 없으면 메인으로
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* 로그인 상태에 따라 다른 화면 표시 */}
        {isLoggedIn ? (
          // 로그인 상태 - 사용자 정보와 옵션 표시
          <View style={styles.profileContainer}>
            <View style={styles.profileHeaderContainer}>
              {/* 프로필 이미지 */}
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={() => setShowImageOptions(true)}
              >
                {renderProfileImage()}
                <View style={styles.cameraButton}>
                  <Ionicons name="camera" size={16} color="#000" />
                </View>
              </TouchableOpacity>

              {/* 사용자 이름 */}
              <TouchableOpacity
                onPress={() => setShowNicknameModal(true)}
                style={styles.usernameContainer}
              >
                <Text style={styles.usernameText}>
                  {userData?.displayName
                    ? `${userData.displayName}님`
                    : "사용자님"}
                </Text>
                <Ionicons
                  name="create-outline"
                  size={16}
                  color="#50cebb"
                  style={styles.editIcon}
                />
              </TouchableOpacity>

              {/* 구독 상태 표시 */}
              {isSubscribed && (
                <View style={styles.subscriptionBadgeContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.subscriptionBadgeText}>플러스 회원</Text>
                </View>
              )}
            </View>

            {/* 계정 정보 섹션 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>계정 정보</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#666"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoLabel}>이메일</Text>
                </View>
                <Text style={styles.infoValue}>
                  {userData?.email || "연결된 계정 이메일"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons
                    name="log-in-outline"
                    size={18}
                    color="#666"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoLabel}>로그인 방식</Text>
                </View>
                <View style={styles.loginMethodContainer}>
                  {userData?.authProvider === "google" && (
                    <View style={styles.loginMethodBadge}>
                      <Ionicons name="logo-google" size={14} color="#EA4335" />
                      <Text style={styles.loginMethodText}>Google</Text>
                    </View>
                  )}

                  {userData?.authProvider === "naver" && (
                    <View style={styles.loginMethodBadge}>
                      <Text
                        style={[styles.loginMethodIcon, { color: "#1EC800" }]}
                      >
                        N
                      </Text>
                      <Text style={styles.loginMethodText}>Naver</Text>
                    </View>
                  )}

                  {userData?.authProvider === "kakao" && (
                    <View style={styles.loginMethodBadge}>
                      <Ionicons name="chatbubble" size={14} color="#3A1D1D" />
                      <Text style={styles.loginMethodText}>Kakao</Text>
                    </View>
                  )}

                  {!userData?.authProvider && (
                    <Text style={styles.infoValue}>이메일</Text>
                  )}
                </View>
              </View>
            </View>

            {/* 구독 섹션 */}
            {renderSubscriptionSection()}
          </View>
        ) : (
          // 비로그인 상태 - 로그인 유도 화면
          <View style={styles.notLoggedInContainer}>
            <View style={styles.notLoggedInIcon}>
              <Ionicons
                name="person-circle-outline"
                size={80}
                color="#50cebb"
              />
            </View>
            <Text style={styles.notLoggedInTitle}>로그인이 필요합니다</Text>
            <Text style={styles.notLoggedInDescription}>
              로그인하여 일정을 백업하고,{"\n"}
              여러 기기에서 동기화하세요.{"\n"}
            </Text>

            <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>로그인 / 회원가입</Text>
            </TouchableOpacity>

            {/* 플랜이지 플러스 프로모션 - 개선된 디자인 */}
            <View style={styles.premiumCardContainer}>
              <View style={styles.premiumCardHeader}>
                <View style={styles.premiumTitleContainer}>
                  <Text style={styles.premiumTitle}>플랜이지 플러스</Text>
                  <View style={styles.crownBadge}>
                    <Ionicons name="crown" size={14} color="#FFD700" />
                  </View>
                </View>
                <Text style={styles.premiumSubtitle}>
                  프리미엄 기능으로 더 스마트하게
                </Text>
              </View>

              <View style={styles.premiumFeatureList}>
                <View style={styles.premiumFeatureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name="infinite-outline"
                      size={22}
                      color="#50cebb"
                    />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>무제한 일정 생성</Text>
                    <Text style={styles.featureDescription}>
                      더 많은 일정을 효율적으로 관리하세요
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumFeatureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name="analytics-outline"
                      size={22}
                      color="#50cebb"
                    />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>AI 학습 분석</Text>
                    <Text style={styles.featureDescription}>
                      맞춤형 학습 패턴 분석과 추천을 받아보세요
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumFeatureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name="cloud-done-outline"
                      size={22}
                      color="#50cebb"
                    />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>클라우드 동기화</Text>
                    <Text style={styles.featureDescription}>
                      모든 기기에서 데이터를 안전하게 이용하세요
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => {
                  Alert.alert(
                    "로그인 필요",
                    "플랜이지 플러스를 이용하려면 먼저 로그인해주세요."
                  );
                }}
              >
                <Text style={styles.subscribeButtonText}>
                  플러스 구독 혜택 더 알아보기
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 앱 정보 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>앱 정보</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setShowFAQModal(true)}
          >
            <View style={styles.linkLabelContainer}>
              <Ionicons
                name="help-circle-outline"
                size={18}
                color="#666"
                style={styles.linkIcon}
              />
              <Text style={styles.linkLabel}>자주 묻는 질문</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() =>
              Alert.alert(
                "도움말 및 문의하기",
                "kazuya7x@naver.com으로 문의해주세요."
              )
            }
          >
            <View style={styles.linkLabelContainer}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#666"
                style={styles.linkIcon}
              />
              <Text style={styles.linkLabel}>도움말 및 문의하기</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <View style={styles.linkLabelContainer}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#666"
                style={styles.linkIcon}
              />
              <Text style={styles.linkLabel}>앱 버전</Text>
            </View>
            <Text style={styles.versionText}>1.2.4</Text>
          </View>
        </View>
        {/* 로그아웃 섹션 - 로그인된 경우에만 표시 */}
        {isLoggedIn && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
              <View style={styles.linkLabelContainer}>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#666"
                  style={styles.linkIcon}
                />
                <Text style={styles.linkLabel}>로그 아웃</Text>
              </View>
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
                            // 회원 탈퇴 성공 시 모든 로컬 데이터 삭제
                            console.log(
                              "회원 탈퇴 성공: 모든 로컬 데이터 삭제 시작"
                            );

                            try {
                              // 모든 데이터 일괄 삭제
                              await AsyncStorage.clear();
                              console.log("모든 AsyncStorage 데이터 삭제 완료");

                              // 주요 키 데이터 삭제 (확실히 하기 위한 백업 방법)
                              const keysToRemove = [
                                "@user_auth_data",
                                "@user_subscription",
                                "@user_terms_agreed",
                                "@schedule_data",
                                "@task_completion_data",
                                "@section_states",
                                "@unlocked_timer_methods",
                                "@user_study_sessions",
                                "@user_settings",
                                "@point_history",
                                "@color_purchases",
                                "@recent_subjects",
                              ];

                              await Promise.all(
                                keysToRemove.map((key) =>
                                  AsyncStorage.removeItem(key)
                                )
                              );
                              console.log("주요 데이터 키 삭제 완료");
                            } catch (clearError) {
                              console.error("데이터 삭제 중 오류:", clearError);
                            }

                            Alert.alert(
                              "탈퇴 완료",
                              "회원 탈퇴가 완료되었습니다. 모든 데이터가 삭제되었습니다."
                            );

                            // 메인 화면으로 이동
                            navigation.reset({
                              index: 0,
                              routes: [{ name: "Main" }],
                            });
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
              <View style={styles.linkLabelContainer}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#ff6b6b"
                  style={styles.linkIcon}
                />
                <Text style={[styles.linkLabel, styles.deleteText]}>
                  회원 탈퇴
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
        )}

        {/* 모달들 */}
        <FAQModal />
        <NicknameModal />
        <EmojiPickerModal />
        <CharacterPickerModal />
        <ImageOptionsModal />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  // 컨테이너 스타일 수정
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 0, // 좌우 패딩 제거 (섹션 컨테이너에 마진으로 처리)
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  // 로그인/비로그인 컨테이너 스타일 수정
  profileContainer: {
    paddingHorizontal: 0, // 좌우 패딩 제거
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
    overflow: "hidden",
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  profileEmoji: {
    fontSize: 40,
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
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editIcon: {
    marginLeft: 5,
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
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    marginHorizontal: 16, // 모든 섹션에 동일한 좌우 여백 적용
    width: "auto", // 자동 너비로 설정하여 부모 컨테이너에 맞춤
    alignSelf: "stretch", // 부모 컨테이너 너비에 맞춤
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: "#333",
  },
  infoValue: {
    fontSize: 15,
    color: "#666",
  },
  loginMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  loginMethodIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  loginMethodText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 4,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%", // 부모 컨테이너 너비에 맞춤
  },
  linkLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastItemNoBorder: {
    borderBottomWidth: 0,
  },
  linkIcon: {
    marginRight: 8,
  },
  linkLabel: {
    fontSize: 15,
    color: "#333",
  },
  deleteText: {
    color: "#ff6b6b",
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },

  // 구독 섹션 스타일
  freeStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFE082",
    width: "100%", // 부모 컨테이너 너비에 맞춤
  },
  freeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFAF0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
    shadowColor: "#FFB74D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  freeInfo: {
    flex: 1,
  },
  freeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  freeDetail: {
    fontSize: 14,
    color: "#666",
  },
  subscribePromoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    width: "100%", // 부모 컨테이너 너비에 맞춤
  },
  subscribePromoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  subscribePromoContent: {
    flex: 1,
  },
  subscribePromoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  subscribePromoDescription: {
    fontSize: 14,
    color: "#42A5F5",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitIcon: {
    marginRight: 10,
  },
  benefitLabel: {
    fontSize: 14,
    color: "#333",
  },
  viewAllBenefitsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
  },
  viewAllBenefitsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#50cebb",
    marginRight: 5,
  },

  // FAQ 모달 스타일
  faqModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  faqModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 16,
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
    borderRadius: 12,
    overflow: "hidden",
  },
  faqQuestionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
    padding: 16,
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

  // 비로그인 스타일
  notLoggedInContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
    width: "100%",
  },
  notLoggedInIcon: {
    backgroundColor: "rgba(80, 206, 187, 0.1)",
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  notLoggedInDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  // 로그인 버튼과 혜택 컨테이너 스타일 수정
  loginButton: {
    backgroundColor: "#50cebb",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#50cebb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // 플랜이지 플러스 프로모션 카드 개선
  premiumCardContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 0,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: "hidden",
  },
  premiumCardHeader: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#BBDEFB",
  },
  premiumTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976D2",
    marginRight: 8,
  },
  crownBadge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  premiumSubtitle: {
    fontSize: 15,
    color: "#42A5F5",
  },

  // 프리미엄 기능 목록
  premiumFeatureList: {
    padding: 16,
  },
  premiumFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(80, 206, 187, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: "#777",
    lineHeight: 18,
  },

  // 구독 버튼
  subscribeButton: {
    flexDirection: "row",
    backgroundColor: "#50cebb",
    borderRadius: 0,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(80, 206, 187, 0.3)",
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },

  benefitsContainer: {
    width: "100%", // 부모 컨테이너 너비에 맞춤
    backgroundColor: "white",
    borderRadius: 16,
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
    width: "100%", // 부모 컨테이너 너비에 맞춤
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
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

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f1f1f1",
    marginRight: 10,
  },
  modalConfirmButton: {
    backgroundColor: "#50cebb",
    marginLeft: 10,
  },
  modalButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  modalCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },

  // 이모티콘 선택 모달
  emojiModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  emojiGrid: {
    maxHeight: 200,
    width: "100%",
  },
  emojiItem: {
    width: "25%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  emojiText: {
    fontSize: 30,
  },
  emojiModalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
  },
  emojiModalCloseText: {
    color: "#333",
    fontSize: 16,
  },

  // 캐릭터 선택 모달
  characterModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 450,
    maxHeight: "80%",
    alignItems: "center",
  },
  characterGrid: {
    width: "100%",
  },
  characterItem: {
    width: "50%",
    padding: 10,
    alignItems: "center",
  },
  characterImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFE082",
    marginBottom: 5,
  },
  characterPreview: {
    width: "100%",
    height: "100%",
  },
  characterName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
  },
  characterModalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
  },
  characterModalCloseText: {
    color: "#333",
    fontSize: 16,
  },

  // 이미지 옵션 모달
  imageOptionsContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 5,
    width: "80%",
    maxWidth: 300,
  },
  imageOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  imageOptionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
});

export default MyPage;
