// src/screens/AIFeedbackScreen.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePlanner } from "../context/PlannerContext";
import {
  getRecentAnalysisResults,
  getUserContext,
  getYesterdayAnalysisResult,
  saveAnalysisResult,
  saveUserContext,
  testDeepSeekAPI,
} from "../services/ImprovedFeedbackService";

const AIFeedbackScreen = () => {
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [userContext, setUserContext] = useState(null);

  // 1일 1회 제한 상태
  const [hasAnalyzedToday, setHasAnalyzedToday] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // 프로필 수집 상태
  const [profileStep, setProfileStep] = useState(0);
  const [isCollectingProfile, setIsCollectingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [showAnalysisScreen, setShowAnalysisScreen] = useState(false);
  const [analysisInput, setAnalysisInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [yesterdayResult, setYesterdayResult] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const [isInputMode, setIsInputMode] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  // 🆕 오류 상태 추가
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 🆕 자정 체크용 타이머
  const midnightTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // 🆕 실시간 카운트다운
  const [timeRemaining, setTimeRemaining] = useState("");
  const countdownTimerRef = useRef(null);

  const scrollViewRef = useRef(null);
  const inputScrollViewRef = useRef(null);

  const {
    schedules,
    tasks,
    studySessions,
    goalTargets,
    weeklyStats,
    monthlyStats,
  } = usePlanner();

  // 🆕 임시 저장 키
  const TEMP_PROFILE_KEY = "@temp_profile_data";

  // 🆕 개선된 프로필 질문들 (학교/전공 제거, 성별 옵션 변경)
  const profileQuestions = [
    {
      key: "name",
      question: "이름이나 닉네임을 알려주세요!",
      type: "text",
      validation: (value) => value.trim().length > 0,
      errorMsg: "이름을 입력해주세요.",
    },
    {
      key: "age",
      question: "나이를 알려주실 수 있나요?",
      type: "text",
      validation: (value) => {
        const num = parseInt(value.trim());
        return !isNaN(num) && num > 0 && num < 150;
      },
      errorMsg: "올바른 나이를 입력해주세요. (1-149)",
    },
    {
      key: "gender",
      question: "성별을 선택해주세요!",
      type: "buttons",
      options: ["남성", "여성"],
    },
    {
      key: "occupation",
      question: "현재 어떤 일을 하고 계세요?",
      type: "text",
      validation: (value) => value.trim().length > 0,
      errorMsg: "현재 상황을 알려주세요.",
    },
    {
      key: "personality",
      question: "본인의 성격이나 MBTI가 있다면 알려주세요!",
      type: "text",
      placeholder: "예: ENFP, 외향적, 꼼꼼함 등 (선택사항)",
    },
    {
      key: "goal",
      question: "현재 가장 중요한 목표가 있나요?",
      type: "text",
      placeholder: "예: 토익 900점, 취업 준비 등 (선택사항)",
    },
    {
      key: "studyStyle",
      question: "어떤 학습 스타일을 선호하시나요?",
      type: "buttons",
      options: [
        { label: "몰입형 - 한 가지에 집중", value: "intensive" },
        { label: "분산형 - 여러 과목 번갈아", value: "distributed" },
        { label: "균형형 - 일과 학습의 조화", value: "balanced" },
      ],
    },
  ];

  // 🆕 실시간 카운트다운 업데이트
  const updateCountdown = () => {
    if (!hasAnalyzedToday) {
      setTimeRemaining("");
      return;
    }

    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("");
      checkAndUpdateDailyLimit();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(`${hours}시간 ${minutes}분 ${seconds}초`);
  };

  // 🆕 카운트다운 타이머 시작
  const startCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    updateCountdown();
    countdownTimerRef.current = setInterval(updateCountdown, 1000);
  };

  // 🆕 카운트다운 타이머 정지
  const stopCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  // 🆕 자정까지 남은 시간 계산
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // 다음 날 0시
    return midnight.getTime() - now.getTime();
  };

  // 🆕 자정 타이머 설정
  const setupMidnightTimer = () => {
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current);
    }

    const timeUntilMidnight = getTimeUntilMidnight();

    midnightTimerRef.current = setTimeout(() => {
      console.log("🕛 자정이 되어 AI 분석 제한이 초기화됩니다.");
      checkAndUpdateDailyLimit();
      // 다음 자정을 위한 타이머 재설정
      setupMidnightTimer();
    }, timeUntilMidnight);

    console.log(
      `⏰ 자정 타이머 설정됨: ${Math.round(
        timeUntilMidnight / 1000 / 60
      )}분 후 초기화`
    );
  };

  // 🆕 날짜 변경 체크 및 제한 업데이트
  const checkAndUpdateDailyLimit = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    if (currentDate !== today) {
      console.log(`📅 날짜 변경 감지: ${currentDate} → ${today}`);
      setCurrentDate(today);

      // 새로운 날짜의 분석 여부 체크
      const todayAnalysis = await hasAnalysisToday();
      setHasAnalyzedToday(todayAnalysis);

      console.log(
        `🔄 AI 분석 상태 업데이트: ${todayAnalysis ? "사용완료" : "사용가능"}`
      );
    }
  };

  // 🆕 앱 상태 변경 감지
  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current === "background" && nextAppState === "active") {
      console.log("📱 앱이 포그라운드로 돌아옴 - 날짜 체크");
      checkAndUpdateDailyLimit();
    }
    appStateRef.current = nextAppState;
  };

  // 🆕 임시 저장 함수
  const saveTempProfile = async (stepData) => {
    try {
      const tempData = {
        ...profileData,
        ...stepData,
        currentStep: profileStep,
        lastSaved: new Date().toISOString(),
      };
      await AsyncStorage.setItem(TEMP_PROFILE_KEY, JSON.stringify(tempData));
      console.log(`프로필 임시 저장 완료 - 단계: ${profileStep + 1}`);
    } catch (error) {
      console.error("임시 저장 오류:", error);
    }
  };

  // 🆕 임시 저장 데이터 로드
  const loadTempProfile = async () => {
    try {
      const tempData = await AsyncStorage.getItem(TEMP_PROFILE_KEY);
      if (tempData) {
        const parsed = JSON.parse(tempData);
        // 24시간 이내 데이터만 복원
        const lastSaved = new Date(parsed.lastSaved);
        const now = new Date();
        const diffHours = (now - lastSaved) / (1000 * 60 * 60);

        if (diffHours < 24) {
          setProfileData(parsed);
          setProfileStep(parsed.currentStep || 0);
          return true;
        } else {
          // 오래된 임시 데이터 삭제
          await AsyncStorage.removeItem(TEMP_PROFILE_KEY);
        }
      }
      return false;
    } catch (error) {
      console.error("임시 데이터 로드 오류:", error);
      return false;
    }
  };

  // 🆕 임시 저장 데이터 삭제
  const clearTempProfile = async () => {
    try {
      await AsyncStorage.removeItem(TEMP_PROFILE_KEY);
      console.log("임시 프로필 데이터 삭제 완료");
    } catch (error) {
      console.error("임시 데이터 삭제 오류:", error);
    }
  };

  // 🆕 개선된 오류 처리 함수
  const handleError = (error, context = "작업") => {
    console.error(`${context} 오류:`, error);

    let userMessage = "문제가 발생했습니다.";

    if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      userMessage = "인터넷 연결을 확인해주세요.";
    } else if (error.message?.includes("storage")) {
      userMessage = "데이터 저장 중 문제가 발생했습니다.";
    } else if (error.message?.includes("API")) {
      userMessage = "AI 서비스에 일시적인 문제가 발생했습니다.";
    }

    setError({ message: userMessage, context, canRetry: true });
  };

  // 🆕 재시도 함수
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      if (error?.context === "AI 분석") {
        await handleAnalysisRequest();
      } else if (error?.context === "프로필 저장") {
        await completeProfileSetup(profileData);
      }
    } catch (retryError) {
      handleError(retryError, error?.context);
    } finally {
      setIsRetrying(false);
    }
  };

  // 프로필 수정 함수
  const handleProfileEdit = async (field, newValue) => {
    if (!userContext) return;

    try {
      // 🆕 나이 필드 숫자 변환
      let processedValue = newValue.trim();
      if (field === "age") {
        const ageNum = parseInt(processedValue);
        if (isNaN(ageNum) || ageNum <= 0 || ageNum >= 150) {
          Alert.alert("오류", "올바른 나이를 입력해주세요. (1-149)");
          return;
        }
        processedValue = ageNum;
      }

      const updatedContext = {
        ...userContext,
        [field]: processedValue,
        lastActiveDate: new Date().toISOString(),
      };

      await saveUserContext(updatedContext);
      setUserContext(updatedContext);
      setEditingField(null);
      setEditValue("");
      console.log("프로필 수정 완료:", field, processedValue);
    } catch (error) {
      handleError(error, "프로필 수정");
    }
  };

  // 프로필 화면 렌더링 (교육 항목 제거)
  const renderProfileScreen = () => {
    if (!userContext) return null;

    const profileFields = [
      {
        key: "name",
        label: "이름/닉네임",
        icon: "person",
        value: userContext.name,
      },
      { key: "age", label: "나이", icon: "calendar", value: userContext.age },
      {
        key: "gender",
        label: "성별",
        icon: "male-female",
        value: userContext.gender || "미입력",
      },
      {
        key: "occupation",
        label: "직업/상황",
        icon: "briefcase",
        value: userContext.occupation,
      },
      {
        key: "personality",
        label: "성격/MBTI",
        icon: "happy",
        value: userContext.personality || "미입력",
      },
      {
        key: "targetGoal",
        label: "목표",
        icon: "flag",
        value: userContext.targetGoal || "미입력",
      },
      {
        key: "preferredStyle",
        label: "학습 스타일",
        icon: "library",
        value:
          userContext.preferredStyle === "intensive"
            ? "몰입형"
            : userContext.preferredStyle === "distributed"
            ? "분산형"
            : "균형형",
      },
    ];

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fafbfc" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* 헤더 */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowProfileScreen(false);
              setEditingField(null);
              setEditValue("");
            }}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#333",
              flex: 1,
            }}
          >
            내 프로필
          </Text>
          <Text style={{ fontSize: 12, color: "#999" }}>
            {userContext.totalSessions || 0}회 사용
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 프로필 카드 */}
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 24,
              borderRadius: 20,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#50cebb",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }}
                >
                  {userContext.name}님의 프로필
                </Text>
                <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  가입일:{" "}
                  {format(new Date(userContext.createdAt), "yyyy년 M월 d일")}
                </Text>
              </View>
            </View>

            {profileFields.map((field, index) => (
              <View
                key={field.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  borderBottomWidth: index === profileFields.length - 1 ? 0 : 1,
                  borderBottomColor: "#f5f5f5",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#f8f9fa",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons name={field.icon} size={20} color="#50cebb" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, color: "#666", marginBottom: 4 }}
                  >
                    {field.label}
                  </Text>
                  {editingField === field.key ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {field.key === "gender" ? (
                        // 성별은 버튼으로 선택
                        <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                          {["남성", "여성"].map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={{
                                flex: 1,
                                backgroundColor:
                                  editValue === option ? "#50cebb" : "#f8f9fa",
                                borderRadius: 8,
                                paddingVertical: 10,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor:
                                  editValue === option ? "#50cebb" : "#e0e0e0",
                              }}
                              onPress={() => setEditValue(option)}
                            >
                              <Text
                                style={{
                                  color: editValue === option ? "#fff" : "#333",
                                  fontSize: 14,
                                  fontWeight: "600",
                                }}
                              >
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : field.key === "preferredStyle" ? (
                        // 학습 스타일은 버튼으로 선택
                        <View style={{ flex: 1, gap: 4 }}>
                          {[
                            { label: "몰입형", value: "intensive" },
                            { label: "분산형", value: "distributed" },
                            { label: "균형형", value: "balanced" },
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={{
                                backgroundColor:
                                  editValue === option.value
                                    ? "#50cebb"
                                    : "#f8f9fa",
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor:
                                  editValue === option.value
                                    ? "#50cebb"
                                    : "#e0e0e0",
                              }}
                              onPress={() => setEditValue(option.value)}
                            >
                              <Text
                                style={{
                                  color:
                                    editValue === option.value
                                      ? "#fff"
                                      : "#333",
                                  fontSize: 14,
                                  fontWeight: "600",
                                  textAlign: "center",
                                }}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        // 일반 텍스트 입력
                        <TextInput
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: "#50cebb",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            fontSize: 16,
                            backgroundColor: "#fff",
                            minHeight: 40,
                          }}
                          value={editValue}
                          onChangeText={setEditValue}
                          autoFocus
                          placeholder={field.label}
                          keyboardType={
                            field.key === "age" ? "numeric" : "default"
                          }
                        />
                      )}
                      <TouchableOpacity
                        style={{
                          marginLeft: 8,
                          backgroundColor: "#50cebb",
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                        onPress={() => handleProfileEdit(field.key, editValue)}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          저장
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ marginLeft: 4, padding: 6 }}
                        onPress={() => {
                          setEditingField(null);
                          setEditValue("");
                        }}
                      >
                        <Ionicons name="close" size={16} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingField(field.key);
                        setEditValue(
                          field.value === "미입력" ? "" : field.value.toString()
                        );
                      }}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: field.value === "미입력" ? "#999" : "#333",
                          flex: 1,
                        }}
                      >
                        {field.value}
                      </Text>
                      <Ionicons name="create-outline" size={16} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* 설정 완료 정보 */}
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 20,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#50cebb" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginLeft: 8,
                }}
              >
                설정 완료
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 20,
              }}
            >
              프로필 설정이 완료되어{"\n"}
              개인화된 AI 피드백을 받으실 수 있습니다.
            </Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const toggleInputMode = () => {
    const toValue = isInputMode ? 0 : 1;
    setIsInputMode(!isInputMode);

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const returnToResultMode = () => {
    setIsInputMode(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderStartScreen = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <Ionicons
          name="sparkles"
          size={64}
          color="#50cebb"
          style={{ marginBottom: 20 }}
        />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          AI 맞춤 피드백
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#666",
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          당신만의 AI 학습 코치가{"\n"}
          개인화된 조언을 제공합니다
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#50cebb",
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={handleStartAI}
      >
        <Ionicons
          name="play"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          AI 코치 시작하기
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 12,
          color: "#999",
          textAlign: "center",
          marginTop: 20,
          lineHeight: 18,
        }}
      >
        💡 몇 가지 간단한 설정으로{"\n"}
        당신만의 AI 코치를 만들어보세요
      </Text>
    </View>
  );

  // 🆕 개선된 프로필 설정 화면 (임시 저장 포함)
  const renderProfileSetupScreen = () => {
    const currentQuestion = profileQuestions[profileStep];

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fafbfc" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 진행 상황 */}
          <View style={{ marginBottom: 30 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: "#888" }}>
                진행 상황: {profileStep + 1} / {profileQuestions.length}
              </Text>
              <Text style={{ fontSize: 14, color: "#888" }}>
                {Math.round(
                  ((profileStep + 1) / profileQuestions.length) * 100
                )}
                %
              </Text>
            </View>
            <View
              style={{
                height: 4,
                backgroundColor: "#e0e0e0",
                borderRadius: 2,
              }}
            >
              <View
                style={{
                  height: 4,
                  backgroundColor: "#50cebb",
                  borderRadius: 2,
                  width: `${
                    ((profileStep + 1) / profileQuestions.length) * 100
                  }%`,
                }}
              />
            </View>
          </View>

          {/* 질문 카드 */}
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 24,
              borderRadius: 20,
              marginBottom: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#50cebb",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="help" size={20} color="#fff" />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  flex: 1,
                }}
              >
                질문 {profileStep + 1}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                color: "#333",
                lineHeight: 24,
                marginBottom: 20,
              }}
            >
              {currentQuestion.question}
            </Text>

            {/* 입력 방식에 따른 UI */}
            {currentQuestion.type === "text" ? (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#ffffff",
                  minHeight: 48,
                }}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  currentQuestion.placeholder || "답변을 입력해주세요..."
                }
                placeholderTextColor="#999"
                keyboardType={
                  currentQuestion.key === "age" ? "numeric" : "default"
                }
              />
            ) : (
              // 버튼 선택
              <View>
                {currentQuestion.options.map((option, index) => {
                  const isObject = typeof option === "object";
                  const label = isObject ? option.label : option;
                  const value = isObject ? option.value : option;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor:
                          inputText === value ? "#50cebb" : "#f8f9fa",
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor:
                          inputText === value ? "#50cebb" : "#e0e0e0",
                      }}
                      onPress={() => setInputText(value)}
                    >
                      <Text
                        style={{
                          color: inputText === value ? "#fff" : "#333",
                          fontSize: 16,
                          fontWeight: inputText === value ? "600" : "400",
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 버튼들 */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {profileStep > 0 && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#f8f9fa",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                }}
                onPress={() => {
                  setProfileStep(profileStep - 1);
                  setInputText("");
                }}
              >
                <Text
                  style={{ color: "#666", fontSize: 16, fontWeight: "600" }}
                >
                  이전
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                flex: profileStep > 0 ? 1 : 1,
                backgroundColor: canProceedToNext() ? "#50cebb" : "#e0e0e0",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleNextStep}
              disabled={!canProceedToNext()}
            >
              <Text
                style={{
                  color: canProceedToNext() ? "#fff" : "#999",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {profileStep === profileQuestions.length - 1 ? "완료" : "다음"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // 🆕 다음 단계 진행 가능 여부 확인
  const canProceedToNext = () => {
    const currentQuestion = profileQuestions[profileStep];
    const answer = inputText.trim();

    // 필수 필드 체크
    if (currentQuestion.validation) {
      return currentQuestion.validation(answer);
    }

    // 선택사항은 빈 값도 허용
    return true;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    // 🆕 앱 상태 변경 리스너 추가
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    loadInitialData();

    // 🆕 자정 타이머 설정
    setupMidnightTimer();

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
      appStateSubscription?.remove();

      // 🆕 타이머 정리
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
      stopCountdownTimer();
    };
  }, []);

  // 🆕 hasAnalyzedToday 변경 시 카운트다운 관리
  useEffect(() => {
    if (hasAnalyzedToday) {
      startCountdownTimer();
    } else {
      stopCountdownTimer();
      setTimeRemaining("");
    }
  }, [hasAnalyzedToday]);

  const loadInitialData = async () => {
    try {
      const [savedUserContext, yesterdayAnalysis, recentAnalyses] =
        await Promise.all([
          getUserContext(),
          getYesterdayAnalysisResult(),
          getRecentAnalysisResults(7),
        ]);

      // 🆕 오늘 분석 여부 체크
      const todayAnalysis = await hasAnalysisToday();
      setHasAnalyzedToday(todayAnalysis);

      if (savedUserContext) {
        setUserContext(savedUserContext);
        setIsStarted(true);
        setShowAnalysisScreen(true);
        console.log("기존 사용자 복귀:", savedUserContext.name);
      } else {
        // 🆕 임시 저장 데이터 확인
        const hasTemp = await loadTempProfile();
        if (hasTemp) {
          console.log("임시 저장 데이터 복원됨");
        }
      }

      if (yesterdayAnalysis) {
        setYesterdayResult(yesterdayAnalysis);
      }

      if (recentAnalyses && recentAnalyses.length > 0) {
        const today = format(new Date(), "yyyy-MM-dd");
        const yesterday = format(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        );

        const processedResults = recentAnalyses.map((result) => {
          const resultDate = result.date;
          const isToday = resultDate === today;
          const isYesterday = resultDate === yesterday;

          const resultDateTime = new Date(resultDate).getTime();
          const todayTime = new Date(today).getTime();
          const daysAgo = Math.floor(
            (todayTime - resultDateTime) / (24 * 60 * 60 * 1000)
          );

          return {
            ...result,
            isToday,
            isYesterday,
            daysAgo,
          };
        });

        setRecentResults(processedResults);
        setAnalysisResult(processedResults[0]);
        setSelectedResultIndex(0);
      }

      console.log("초기 데이터 로드 완료:", {
        hasUser: !!savedUserContext,
        hasYesterday: !!yesterdayAnalysis,
        recentCount: recentAnalyses?.length || 0,
        hasAnalyzedToday: todayAnalysis,
      });
    } catch (error) {
      handleError(error, "데이터 로드");
    }
  };

  const handleStartAI = async () => {
    setIsStarted(true);

    // 🆕 임시 저장 데이터가 있는지 확인
    const hasTemp = await loadTempProfile();
    if (hasTemp) {
      // 임시 데이터가 있으면 해당 단계부터 시작
      Alert.alert(
        "이전 설정 발견",
        "이전에 설정하던 프로필 정보가 있습니다. 이어서 진행하시겠습니까?",
        [
          {
            text: "새로 시작",
            onPress: () => {
              clearTempProfile();
              setProfileData({});
              setProfileStep(0);
              setIsCollectingProfile(true);
            },
          },
          {
            text: "이어서 진행",
            onPress: () => {
              setIsCollectingProfile(true);
            },
          },
        ]
      );
    } else {
      setIsCollectingProfile(true);
      setProfileStep(0);
      setInputText("");
    }
  };

  // 🆕 개선된 다음 단계 처리 (임시 저장 포함)
  const handleNextStep = async () => {
    const currentQuestion = profileQuestions[profileStep];
    const answer = inputText.trim();

    // 🆕 강화된 유효성 검사
    if (currentQuestion.validation && !currentQuestion.validation(answer)) {
      Alert.alert(
        "입력 오류",
        currentQuestion.errorMsg || "올바른 값을 입력해주세요."
      );
      return;
    }

    // 프로필 데이터 저장
    const newProfileData = {
      ...profileData,
      [currentQuestion.key]: answer,
    };
    setProfileData(newProfileData);

    // 🆕 임시 저장
    await saveTempProfile({ [currentQuestion.key]: answer });

    const nextStep = profileStep + 1;

    if (nextStep < profileQuestions.length) {
      // 다음 질문으로
      setProfileStep(nextStep);
      setInputText("");
    } else {
      // 모든 질문 완료
      await completeProfileSetup(newProfileData);
    }
  };

  // 🆕 개선된 프로필 설정 완료 (나이 숫자 변환 포함)
  const completeProfileSetup = async (finalProfileData) => {
    try {
      let normalizedStyle = "balanced";
      if (finalProfileData.studyStyle) {
        normalizedStyle = finalProfileData.studyStyle;
      }

      // 🆕 나이를 숫자로 변환
      const age = parseInt(finalProfileData.age);
      if (isNaN(age) || age <= 0) {
        throw new Error("올바르지 않은 나이 정보입니다.");
      }

      const newUserContext = {
        name: finalProfileData.name,
        age: age, // 🆕 숫자형으로 저장
        gender:
          finalProfileData.gender === "선택안함" ? "" : finalProfileData.gender,
        occupation: finalProfileData.occupation,
        personality: finalProfileData.personality || "",
        targetGoal: finalProfileData.goal || "",
        preferredStyle: normalizedStyle,
        createdAt: new Date().toISOString(),
        totalSessions: 0,
        lastActiveDate: new Date().toISOString(),
      };

      await saveUserContext(newUserContext);
      setUserContext(newUserContext);

      // 🆕 임시 저장 데이터 삭제
      await clearTempProfile();

      // 1초 후 분석 화면으로 전환
      setTimeout(() => {
        setIsCollectingProfile(false);
        setShowAnalysisScreen(true);
        setInputText("");
        setProfileStep(0);
        setProfileData({});
      }, 1000);

      console.log("프로필 설정 완료:", newUserContext.name);
    } catch (error) {
      handleError(error, "프로필 저장");
    }
  };

  // 🆕 개선된 AI 분석 요청 (오류 처리 강화)
  const handleAnalysisRequest = async () => {
    if (!analysisInput.trim() || isAnalyzing || hasAnalyzedToday) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const plannerData = {
        schedules: schedules || {},
        tasks: tasks || {},
        studySessions: studySessions || {},
        goalTargets: goalTargets || [],
        weeklyStats: weeklyStats || {},
        monthlyStats: monthlyStats || {},
      };

      const result = await testDeepSeekAPI({
        reportType: "daily",
        plannerData: plannerData,
        userInput: analysisInput.trim(),
        userContext: userContext,
        chatHistory: [],
      });

      if (result.success) {
        const newAnalysisResult = {
          ...result.data,
          userInput: analysisInput.trim(),
          date: format(new Date(), "yyyy-MM-dd"),
          timestamp: new Date().toISOString(),
        };

        setAnalysisResult(newAnalysisResult);

        const today = format(new Date(), "yyyy-MM-dd");
        await saveAnalysisResult(today, newAnalysisResult);

        // 🆕 분석 완료 후 상태 업데이트
        setHasAnalyzedToday(true);
        setAnalysisInput("");

        const updatedRecentResults = await getRecentAnalysisResults(7);
        const yesterday = format(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        );

        const processedResults = updatedRecentResults.map((result) => {
          const resultDate = result.date;
          const isToday = resultDate === today;
          const isYesterday = resultDate === yesterday;

          const resultDateTime = new Date(resultDate).getTime();
          const todayTime = new Date(today).getTime();
          const daysAgo = Math.floor(
            (todayTime - resultDateTime) / (24 * 60 * 60 * 1000)
          );

          return {
            ...result,
            isToday,
            isYesterday,
            daysAgo,
          };
        });

        setRecentResults(processedResults);
        setSelectedResultIndex(0);
        returnToResultMode();

        console.log(
          "✅ 분석 완료 및 저장됨:",
          today,
          "- 다음 자정까지 비활성화"
        );
      } else {
        throw new Error(result.error || "AI 분석에 실패했습니다.");
      }
    } catch (error) {
      handleError(error, "AI 분석");
      setAnalysisResult({
        analysis: "분석 중 오류가 발생했습니다.",
        insights: "잠시 후 다시 시도해주세요.",
        userInput: analysisInput.trim(),
        date: format(new Date(), "yyyy-MM-dd"),
        timestamp: new Date().toISOString(),
        isError: true,
      });
      returnToResultMode();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 날짜별 분석 결과 선택 함수
  const selectAnalysisResult = (index) => {
    if (recentResults[index]) {
      setSelectedResultIndex(index);
      setAnalysisResult(recentResults[index]);
    }
  };

  // 날짜 포맷팅 함수
  const formatAnalysisDate = (dateStr, isToday, isYesterday, daysAgo) => {
    if (isToday) return "오늘";
    if (isYesterday) return "어제";
    if (daysAgo === 2) return "그제";
    if (daysAgo <= 7) return `${daysAgo}일 전`;
    return format(new Date(dateStr), "M/d");
  };

  // 🆕 오류 표시 컴포넌트
  const renderError = () => {
    if (!error) return null;

    return (
      <View
        style={{
          backgroundColor: "#fff3cd",
          padding: 16,
          margin: 20,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: "#ffc107",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name="warning" size={20} color="#856404" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#856404",
              marginLeft: 8,
            }}
          >
            문제가 발생했습니다
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            color: "#856404",
            lineHeight: 20,
            marginBottom: 16,
          }}
        >
          {error.message}
        </Text>
        {error.canRetry && (
          <TouchableOpacity
            style={{
              backgroundColor: "#ffc107",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {isRetrying ? "재시도 중..." : "다시 시도"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 분석 결과 화면 렌더링
  const renderAnalysisResultView = () => (
    <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
      {/* 오류 표시 */}
      {error && renderError()}

      {/* 날짜별 탭 */}
      {recentResults.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            backgroundColor: "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
            maxHeight: 60,
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          {recentResults.map((result, index) => {
            const displayText = formatAnalysisDate(
              result.date,
              result.isToday,
              result.isYesterday,
              result.daysAgo
            );

            return (
              <TouchableOpacity
                key={`${result.date}-${index}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor:
                    selectedResultIndex === index ? "#50cebb" : "#f8f9fa",
                  marginRight: 8,
                  borderWidth: selectedResultIndex === index ? 0 : 1,
                  borderColor: "#e0e0e0",
                  minWidth: 60,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => selectAnalysisResult(index)}
              >
                <Text
                  style={{
                    color: selectedResultIndex === index ? "#ffffff" : "#666",
                    fontSize: 14,
                    fontWeight: selectedResultIndex === index ? "600" : "500",
                    textAlign: "center",
                  }}
                >
                  {displayText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 분석 결과 내용 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 24,
            borderRadius: 20,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#f0f0f0",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#50cebb",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="analytics" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a" }}
              >
                AI 분석 결과
              </Text>
              {analysisResult.date && (
                <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  {format(new Date(analysisResult.date), "yyyy년 M월 d일")}
                </Text>
              )}
            </View>
          </View>

          {/* 사용자 질문 표시 */}
          {analysisResult.userInput && (
            <View
              style={{
                backgroundColor: "#f8f9fa",
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
                borderLeftWidth: 4,
                borderLeftColor: "#50cebb",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#555",
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                💬 질문
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#333",
                  lineHeight: 22,
                }}
              >
                "{analysisResult.userInput}"
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: 15,
              color: "#444",
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            {analysisResult.analysis || analysisResult.insights}
          </Text>

          {analysisResult.recommendations && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                📋 추천 일정
              </Text>
              {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: "#50cebb",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#333",
                      fontWeight: "500",
                    }}
                  >
                    {rec.task}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {rec.time}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {analysisResult.focus_areas && (
            <View
              style={{
                backgroundColor: "#fff3cd",
                padding: 12,
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: "#ffc107",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 14, color: "#856404", fontWeight: "600" }}
              >
                🎯 집중 영역: {analysisResult.focus_areas.join(", ")}
              </Text>
            </View>
          )}

          {analysisResult.personal_advice && (
            <View
              style={{
                backgroundColor: "#e3f2fd",
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: "#2196f3",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#1565c0",
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                💝 {userContext?.name || "사용자"}님만을 위한 특별한 조언
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#1976d2",
                  lineHeight: 20,
                }}
              >
                {analysisResult.personal_advice}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  // 입력 화면 렌더링
  const renderAnalysisInputView = () => (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fafbfc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        ref={inputScrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
          paddingVertical: 40,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight - 200 : 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI 분석 시작 버튼 - 중앙 배치 */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <TouchableOpacity
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor:
                analysisInput.trim() && !isAnalyzing && !hasAnalyzedToday
                  ? "#50cebb"
                  : "#e0e0e0",
              justifyContent: "center",
              alignItems: "center",
              shadowColor:
                analysisInput.trim() && !isAnalyzing && !hasAnalyzedToday
                  ? "#50cebb"
                  : "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity:
                analysisInput.trim() && !isAnalyzing && !hasAnalyzedToday
                  ? 0.3
                  : 0.1,
              shadowRadius: 16,
              elevation: 12,
              borderWidth: 3,
              borderColor: "#ffffff",
            }}
            onPress={handleAnalysisRequest}
            disabled={!analysisInput.trim() || isAnalyzing || hasAnalyzedToday}
          >
            {isAnalyzing ? (
              <>
                <Ionicons name="hourglass" size={40} color="#999" />
                <Text
                  style={{
                    color: "#999",
                    fontSize: 13,
                    fontWeight: "600",
                    marginTop: 8,
                  }}
                >
                  분석 중...
                </Text>
              </>
            ) : hasAnalyzedToday ? (
              <>
                <Ionicons name="checkmark-circle" size={40} color="#999" />
                <Text
                  style={{
                    color: "#999",
                    fontSize: 13,
                    fontWeight: "600",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  오늘 분석 완료
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics" size={42} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "700",
                    marginTop: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  AI 분석 시작
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* 상태 안내 텍스트 */}
          <Text
            style={{
              fontSize: 13,
              color: "#888",
              textAlign: "center",
              marginTop: 20,
              fontWeight: "500",
            }}
          >
            {hasAnalyzedToday
              ? "🔒 다시 이용하려면 자정까지 기다려주세요"
              : "💡 하루 1회 AI 분석 가능"}
          </Text>
        </View>

        {/* 🆕 분석 완료 상태일 때는 완료 카드 표시 */}
        {hasAnalyzedToday ? (
          <View
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              padding: 24,
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#50cebb",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="checkmark-done" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#1a1a1a",
                  }}
                >
                  오늘의 AI 분석 완료!
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 2,
                  }}
                >
                  {format(new Date(), "yyyy년 M월 d일")}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              오늘의 AI 분석이 완료되었습니다.{"\n"}
              내일 자정 이후에 다시 이용 가능해요.
            </Text>

            {/* 🆕 실시간 카운트다운 박스 */}
            <View
              style={{
                backgroundColor: "#f8f9fa",
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: "#50cebb",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                다음 이용까지
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#50cebb",
                  letterSpacing: 1,
                }}
              >
                {timeRemaining || "계산 중..."}
              </Text>
            </View>
          </View>
        ) : (
          /* 분석 가능 상태일 때는 입력창 표시 */
          <View style={{ width: "100%" }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              오늘의 고민이나 궁금한 점을 알려주세요
            </Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: analysisInput.trim() ? "#50cebb" : "#e0e0e0",
                borderRadius: 16,
                padding: 20,
                fontSize: 16,
                backgroundColor: "#ffffff",
                minHeight: 120,
                textAlignVertical: "top",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
              value={analysisInput}
              onChangeText={setAnalysisInput}
              placeholder="예: 토익 공부가 잘 안돼요. 집중력을 높이는 방법이 있을까요?"
              placeholderTextColor="#aaa"
              multiline
              editable={!isAnalyzing}
              onFocus={() => {
                setTimeout(() => {
                  if (inputScrollViewRef.current) {
                    inputScrollViewRef.current.scrollToEnd({ animated: true });
                  }
                }, 100);
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // AI 분석 화면
  const renderAnalysisScreen = () => (
    <View style={{ flex: 1, position: "relative" }}>
      {/* 메인 콘텐츠 - 애니메이션 적용 */}
      <Animated.View
        style={[
          { flex: 1 },
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -400],
                }),
              },
            ],
          },
        ]}
      >
        {analysisResult ? (
          renderAnalysisResultView()
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 32,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <Ionicons
                name="analytics-outline"
                size={64}
                color="#50cebb"
                style={{ marginBottom: 20 }}
              />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                AI 분석 준비 완료
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                우측 상단 버튼을 눌러{"\n"}
                AI 분석을 시작해보세요
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* 입력 화면 - 오버레이 */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#fafbfc",
          },
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          },
        ]}
      >
        {renderAnalysisInputView()}
      </Animated.View>

      {/* 플로팅 액션 버튼 - 우측 상단 */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 8,
          right: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          backgroundColor: isInputMode ? "#ff6b6b" : "#50cebb",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 1000,
          minWidth: 80,
        }}
        onPress={toggleInputMode}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {isInputMode ? "분석결과" : "AI분석"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 🆕 개선된 hasAnalysisToday 함수
  const hasAnalysisToday = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const recentResults = await getRecentAnalysisResults(1);
      const todayAnalysis = recentResults.some(
        (result) => result.date === today
      );

      console.log(
        `📊 오늘(${today}) 분석 여부 체크:`,
        todayAnalysis ? "분석완료" : "분석가능"
      );
      return todayAnalysis;
    } catch (error) {
      console.error("오늘 분석 확인 오류:", error);
      return false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

      <SafeAreaView
        style={{
          flex: 1,
          paddingTop: Platform.OS === "android" ? 35 : 0,
        }}
      >
        {isStarted && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Ionicons name="sparkles" size={24} color="#50cebb" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#333",
                marginLeft: 8,
                flex: 1,
              }}
            >
              {isCollectingProfile
                ? "AI 코치 설정 중..."
                : showAnalysisScreen && userContext
                ? `${userContext.name}님의 AI 분석`
                : userContext
                ? `${userContext.name}님의 AI 코치`
                : "AI 맞춤 피드백"}
            </Text>

            {userContext && !isCollectingProfile && (
              <TouchableOpacity
                style={{
                  marginRight: 8,
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: "#f8f9fa",
                }}
                onPress={() => setShowProfileScreen(true)}
              >
                <Ionicons name="settings-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}

            {userContext && showAnalysisScreen && (
              <Text style={{ fontSize: 12, color: "#999" }}>
                {hasAnalyzedToday ? "사용완료" : "AI 분석"}
              </Text>
            )}
          </View>
        )}

        {!isStarted
          ? renderStartScreen()
          : showProfileScreen
          ? renderProfileScreen()
          : isCollectingProfile
          ? renderProfileSetupScreen()
          : showAnalysisScreen
          ? renderAnalysisScreen()
          : null}
      </SafeAreaView>
    </View>
  );
};

export default AIFeedbackScreen;
