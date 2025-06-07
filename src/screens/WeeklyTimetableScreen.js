// src/screens/WeeklyTimetableScreen.js

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addDays, format, getDate, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import MainLayout from "../components/layout/MainLayout";
import { usePlanner } from "../context/PlannerContext";
import { useProgress } from "../context/ProgressContext";
import { useSubscription } from "../context/SubscriptionContext";

// 상수 정의
const UNLOCKED_COLORS_STORAGE_KEY = "unlocked_schedule_colors";

const SCHEDULE_COLORS_STORAGE_KEY = "weekly_schedule_colors";
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 시간
const BASE_CELL_HEIGHT = 55; // 기본 시간당 높이
const HEADER_HEIGHT = 50; // 요일 헤더 높이
const MIN_SCALE = 0.6; // 최소 축소 비율
const MAX_SCALE = 2.0; // 최대 확대 비율

// 28개로 확장된 색상 팔레트 (기존 14개 + 새로운 14개)
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
// 유틸리티 함수들
// 해당 날짜가 해당 월의 몇 번째 주인지 계산
const getWeekOfMonth = (date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay() || 7; // 일요일이면 7로 간주
  return Math.ceil((getDate(date) + firstDayOfWeek - 1) / 7);
};

// 주차 표시 텍스트 반환
const getWeekDisplayText = (startDate) => {
  const endDate = addDays(startDate, 6); // 주의 마지막 날 (일요일)
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    // 같은 달에 있는 경우
    const weekNum = getWeekOfMonth(startDate);
    return `${year}년 ${startMonth + 1}월 ${weekNum}주차`;
  } else {
    // 다른 달에 걸쳐 있는 경우
    const lastDayOfStartMonth = new Date(year, startMonth + 1, 0);
    const daysInStartMonth = lastDayOfStartMonth.getDate();
    const remainingDaysInMonth = daysInStartMonth - startDate.getDate() + 1;

    if (remainingDaysInMonth <= 7) {
      return `${year}년 ${startMonth + 1}월 마지막주`;
    } else {
      // 그 외의 경우 시작 월의 주차 표시
      const weekNum = getWeekOfMonth(startDate);
      return `${year}년 ${startMonth + 1}월 ${weekNum}주차`;
    }
  }
};

let colorPurchaseFunction;
try {
  const pointHistoryModule = require("../utils/pointHistoryManager");
  colorPurchaseFunction = pointHistoryModule.addColorPurchase;
} catch (error) {
  console.log("포인트 히스토리 모듈을 불러올 수 없습니다:", error);
  colorPurchaseFunction = () => Promise.resolve(true);
}

// RGBA 형식으로 색상 변환
const ensureRGBA = (color, opacity = 0.6) => {
  if (!color) return COLOR_PALETTE[0];

  if (color.startsWith("rgba")) {
    return color;
  }

  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  if (color.startsWith("rgb(")) {
    const rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${opacity})`;
    }
  }

  if (COLOR_PALETTE.includes(color)) {
    return color;
  }

  return COLOR_PALETTE[0];
};

const WeeklyTimetableScreen = ({ navigation }) => {
  // Context에서 데이터 가져오기
  const { weeklySchedules, saveWeeklyScheduleOnly, schedules, earnedBadges } =
    usePlanner();

  // 상태 변수들
  const [scheduleColors, setScheduleColors] = useState({});
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [showZoomControls, setShowZoomControls] = useState(false);

  // 추가적인 상태 변수
  const [showColorInfo, setShowColorInfo] = useState(false);
  const [isColorStoreModalVisible, setIsColorStoreModalVisible] =
    useState(false);
  // 구독 상태 추가
  const { isSubscribed } = useSubscription();
  // 색상 상점 모달
  const renderColorStoreModal = useCallback(() => {
    // 보유한 색상 수 계산
    const unlockedCount = Object.values(unlockedColors).filter(Boolean).length;
    const totalColors = COLOR_PALETTE.length;

    return (
      <Modal
        visible={isColorStoreModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsColorStoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { width: "90%", maxHeight: "80%" }]}
          >
            <Text style={styles.modalTitle}>색상 상점</Text>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                보유한 색상: {unlockedCount}/{totalColors}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(unlockedCount / totalColors) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.colorCategoryTitle}>구매 가능한 색상</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.colorStoreGrid}>
                {COLOR_PALETTE.map((color, index) => {
                  // 이미 해금되었는지 확인
                  const isUnlocked = unlockedColors[index] || false;
                  // 구매할 수 없으면 표시하지 않음
                  if (isUnlocked) return null;

                  // 색상 가격 및 희귀도
                  const colorPrice = getColorPrice(index);
                  const colorRarity = getColorRarity(index);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.colorStoreItem}
                      onPress={() => {
                        setSelectedColorForPurchase(index);
                        Alert.alert(
                          "색상 구매",
                          `${colorRarity} 색상을 ${colorPrice}P로 구매하시겠습니까?`,
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "구매",
                              onPress: async () => {
                                await purchaseColor(index);
                              },
                            },
                          ]
                        );
                      }}
                      disabled={points < colorPrice}
                    >
                      <View
                        style={[
                          styles.colorStorePreview,
                          { backgroundColor: color },
                        ]}
                      />
                      <View style={styles.colorStoreInfo}>
                        <Text style={styles.colorStoreRarity}>
                          {colorRarity}
                        </Text>
                        <Text
                          style={[
                            styles.colorStorePrice,
                            points < colorPrice && styles.insufficientPoints,
                          ]}
                        >
                          {colorPrice}P
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.colorCategoryTitle}>보유한 색상</Text>

            <ScrollView style={{ maxHeight: 150 }}>
              {/* 보유한 색상 섹션 예시 */}
              <View style={styles.colorStoreGrid}>
                {COLOR_PALETTE.map((color, index) => {
                  // 해금된 색상만 표시
                  const colorInfo = unlockedColors[index];
                  const isUnlocked =
                    colorInfo &&
                    (colorInfo.purchased || colorInfo.subscriptionBenefit);
                  if (!isUnlocked) return null;

                  // 색상 희귀도
                  const colorRarity = getColorRarity(index);

                  return (
                    <View key={index} style={styles.colorStoreItem}>
                      <View
                        style={[
                          styles.colorStorePreview,
                          { backgroundColor: color },
                        ]}
                      />
                      <View style={styles.colorStoreInfo}>
                        <Text style={styles.colorStoreRarity}>
                          {colorRarity}
                        </Text>
                        {colorInfo.purchased ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4CAF50"
                          />
                        ) : (
                          <View style={styles.subscriptionBadge}>
                            <Text style={styles.subscriptionBadgeText}>
                              구독
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.pointsInfoContainer}>
              <Text style={styles.pointsInfoText}>보유 포인트: {points}P</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { marginTop: 10, alignSelf: "center", width: 120 },
              ]}
              onPress={() => setIsColorStoreModalVisible(false)}
            >
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }, [isColorStoreModalVisible, unlockedColors, points, purchaseColor]);

  // 색상 정보 배지
  const renderColorInfoBadge = useCallback(() => {
    if (!showColorInfo) return null;

    // 해금된 색상 수 계산
    const unlockedCount = Object.values(unlockedColors).filter(Boolean).length;

    return (
      <View style={styles.colorInfoBadge}>
        <Ionicons name="color-palette" size={16} color="white" />
        <Text style={styles.colorInfoText}>
          {unlockedCount}/{COLOR_PALETTE.length} 색상 해금됨
        </Text>
      </View>
    );
  }, [showColorInfo, unlockedColors]);

  // 색상 관리 버튼
  const renderColorManagerButton = useCallback(() => {
    return (
      <TouchableOpacity
        style={styles.colorManagerButton}
        onPress={() => {
          setIsColorStoreModalVisible(true);
          setShowColorInfo(true);

          // 5초 후 색상 정보 배지 숨기기
          setTimeout(() => {
            setShowColorInfo(false);
          }, 5000);
        }}
      >
        <Ionicons name="color-palette" size={22} color="white" />
      </TouchableOpacity>
    );
  }, []);

  // 확대/축소 관련 상태
  const [scale, setScale] = useState(1);
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);

  // 화면 크기 정보
  const screenWidth = Dimensions.get("window").width;
  const dayColumnWidth = (screenWidth - 50) / 7; // 50px는 시간 컬럼의 너비

  // 확대/축소에 따른 셀 높이 계산
  const CELL_HEIGHT = useMemo(() => BASE_CELL_HEIGHT * scale, [scale]);

  // 참조 변수들
  const scrollViewRef = useRef(null);
  const zoomControlTimerRef = useRef(null);

  const [unlockedColors, setUnlockedColors] = useState({});
  const [isColorModalVisible, setIsColorModalVisible] = useState(false);
  const [selectedColorForPurchase, setSelectedColorForPurchase] =
    useState(null);
  const { points, addPoints } = useProgress(); // ProgressContext에서 포인트 관련 함수 가져오기

  // 해금된 색상 불러오기 함수
  const loadUnlockedColors = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(UNLOCKED_COLORS_STORAGE_KEY);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue);
      }
      // 기본값: 첫 번째 색상만 해금
      return { 0: true };
    } catch (error) {
      console.error("해금된 색상 로드 실패:", error);
      return { 0: true };
    }
  };

  // 해금된 색상 저장 함수 정의
  const saveUnlockedColors = async (colorsMap) => {
    try {
      const jsonValue = JSON.stringify(colorsMap);
      await AsyncStorage.setItem(UNLOCKED_COLORS_STORAGE_KEY, jsonValue);
      console.log(
        "해금된 색상 저장 완료:",
        Object.keys(colorsMap).length,
        "개"
      );
      return true;
    } catch (error) {
      console.error("해금된 색상 저장 실패:", error);
      return false;
    }
  };

  const initializeUnlockedColors = async () => {
    try {
      const savedColors = await loadUnlockedColors();
      console.log(
        "저장된 해금 색상 로드:",
        Object.keys(savedColors).length,
        "개"
      );

      if (Object.keys(savedColors).length === 0) {
        // 기본 색상 세트 해금 (처음부터 다양한 색상 제공)
        const initialUnlocked = {
          0: true, // 파란색 - 기본
          1: true, // 녹색
          2: true, // 남색
          4: true, // 민트
          6: true, // 주황색
        };
        await saveUnlockedColors(initialUnlocked);
        setUnlockedColors(initialUnlocked);
        console.log("초기 색상 해금 설정 완료 (기본 색상 세트)");
      } else {
        setUnlockedColors(savedColors);
      }
    } catch (error) {
      console.error("색상 초기화 오류:", error);
      // 오류 발생 시 기본 색상 세트 설정
      const fallbackColors = { 0: true, 1: true, 2: true, 4: true, 6: true };
      setUnlockedColors(fallbackColors);
    }
  };

  // 색상 해제 여부 확인 함수
  const isColorUnlocked = useCallback((colorIndex) => {
    // 모든 색상이 무료로 제공됨
    return true;
  }, []);

  // 색상 구매 함수
  const handleColorPurchase = useCallback(async (colorIndex) => {
    // 모든 색상이 무료로 제공되므로 구매 불필요
    Alert.alert(
      "알림",
      "🎉 모든 색상이 무료로 제공됩니다! 자유롭게 사용하세요."
    );
    return;
  }, []);

  // 색상 구매 함수 개선
  const purchaseColor = async (colorIndex) => {
    try {
      console.log("색상 구매 시도:", colorIndex);

      // 이미 구매한 색상인지 확인
      const colorInfo = unlockedColors[colorIndex];
      if (colorInfo && colorInfo.purchased) {
        Alert.alert("알림", "이미 구매한 색상입니다.");
        return false;
      }

      // 구독자가 추가 구매하지 않도록 방지 (이미 모든 색상 사용 가능)
      if (isSubscribed) {
        Alert.alert("알림", "구독 중에는 이미 모든 색상을 사용할 수 있습니다.");
        return false;
      }

      // 색상 가격 및 희귀도 계산
      const colorPrice = getColorPrice(colorIndex);
      const colorRarity = getColorRarity(colorIndex);

      console.log("색상 가격:", colorPrice, "보유 포인트:", points);

      // 포인트가 충분한지 확인
      if (points < colorPrice) {
        Alert.alert(
          "포인트 부족",
          `색상을 구매하기 위해서는 ${colorPrice}P가 필요합니다.`
        );
        return false;
      }

      // 포인트 차감
      await addPoints(-colorPrice);

      // 실제 구매한 색상 정보 업데이트
      const updatedColors = {
        ...unlockedColors,
        [colorIndex]: { purchased: true },
      };

      // 구매 정보 저장
      const saveResult = await saveUnlockedColors(updatedColors);

      if (saveResult) {
        setUnlockedColors(updatedColors);
        console.log("색상 구매 완료:", colorIndex);
      }

      // 구매 내역 추가 (있는 경우에만)
      try {
        if (typeof colorPurchaseFunction === "function") {
          await colorPurchaseFunction({
            colorIndex,
            colorName: `${colorRarity} 색상`,
            price: colorPrice,
          });
        }
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

  // 해금된 색상 중에서 무작위로 선택
  const getRandomUnlockedColor = useCallback(() => {
    // 캐시에서 해금된 색상 인덱스 가져오기
    const cache = colorCache.current;
    const unlockedIndices = Object.keys(cache);

    if (unlockedIndices.length === 0) {
      // 해금된 색상이 없으면 기본 색상 반환
      return COLOR_PALETTE[0];
    }

    // 해금된 색상 중 무작위 선택
    const randomIndex =
      unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
    return cache[randomIndex] || COLOR_PALETTE[0];
  }, []);

  // useEffect에 디버깅 코드 추가
  useEffect(() => {
    // 색상 초기화
    initializeUnlockedColors().then(() => {
      // 초기화 후 해금된 색상 정보 로그
      logUnlockedColors();
    });

    // 콘솔에 디버그 정보 출력
    console.log("WeeklyTimetableScreen 마운트 - 색상 초기화 시작");
  }, []);
  // 특정 시간으로 스크롤

  // 색상 정보 저장 함수
  const saveScheduleColors = async (colorsMap) => {
    try {
      const jsonValue = JSON.stringify(colorsMap);
      await AsyncStorage.setItem(SCHEDULE_COLORS_STORAGE_KEY, jsonValue);
      return true;
    } catch (error) {
      console.error("색상 저장 실패:", error);
      return false;
    }
  };

  // 색상 정보 불러오기 함수
  const loadScheduleColors = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SCHEDULE_COLORS_STORAGE_KEY);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue);
      }
      return {};
    } catch (error) {
      console.error("색상 로드 실패:", error);
      return {};
    }
  };

  // 주간 날짜 매핑 함수
  const getWeekDates = useCallback(() => {
    const weekDates = {};
    DAYS.forEach((day, index) => {
      const date = addDays(currentWeekStart, index);
      const dateStr = format(date, "yyyy-MM-dd");
      weekDates[day] = dateStr;
    });
    return weekDates;
  }, [currentWeekStart]);

  // 무작위 색상 선택 함수 수정 - 디버그 로그 추가
  const getRandomColor = useCallback(() => {
    return getRandomUnlockedColor();
  }, [unlockedColors]);

  // 1. getColorByDayOrTime 함수 수정 - 해금된 색상만 사용하도록 변경
  const getColorByDayOrTime = useCallback(
    (day, hour) => {
      // 해금된 색상 인덱스 배열 가져오기
      const unlockedIndices = Object.keys(unlockedColors)
        .filter((index) => unlockedColors[index])
        .map((index) => parseInt(index));

      // 해금된 색상이 없으면 기본 색상만 반환
      if (unlockedIndices.length === 0) {
        return COLOR_PALETTE[0];
      }

      // 해금된 색상 배열 생성
      const unlockedColorPalette = unlockedIndices.map(
        (index) => COLOR_PALETTE[index]
      );

      const dayIndex = DAYS.indexOf(day);
      if (dayIndex !== -1) {
        // 요일별로 색상 그룹 나누기 (해금된 색상만 사용)
        const groupSize = Math.ceil(unlockedColorPalette.length / DAYS.length);
        const startIndex = (dayIndex * groupSize) % unlockedColorPalette.length;
        const endIndex = Math.min(
          startIndex + groupSize,
          unlockedColorPalette.length
        );
        const groupColors = unlockedColorPalette.slice(startIndex, endIndex);

        // 그룹이 비어있지 않은 경우 시간에 따라 색상 선택
        if (groupColors.length > 0) {
          const timeIndex = hour % groupColors.length;
          return groupColors[timeIndex];
        }
      }

      // 기본 경우: 해금된 색상 중 랜덤으로 선택
      return getRandomUnlockedColor();
    },
    [unlockedColors]
  );

  // 2. getNextColor 함수 수정 - 해금된 색상만 고려하도록 변경
  const getNextColor = useCallback(
    (existingColors) => {
      // 해금된 색상 인덱스 배열 가져오기
      const unlockedIndices = Object.keys(unlockedColors)
        .filter((index) => unlockedColors[index])
        .map((index) => parseInt(index));

      // 해금된 색상이 없으면 기본 색상만 반환
      if (unlockedIndices.length === 0) {
        return COLOR_PALETTE[0];
      }

      // 해금된 색상 배열 생성
      const unlockedColorPalette = unlockedIndices.map(
        (index) => COLOR_PALETTE[index]
      );

      // 이미 사용 중인 색상 필터링
      const usedColors = Object.values(existingColors);
      const availableColors = unlockedColorPalette.filter(
        (color) => !usedColors.some((used) => used === color)
      );

      // 사용 가능한 색상이 있으면 그 중에서 랜덤 선택
      if (availableColors.length > 0) {
        return availableColors[
          Math.floor(Math.random() * availableColors.length)
        ];
      }
      // 모든 해금 색상이 사용 중이면 해금된 색상 중에서 랜덤 선택
      else {
        return unlockedColorPalette[
          Math.floor(Math.random() * unlockedColorPalette.length)
        ];
      }
    },
    [unlockedColors]
  );

  // 구독 상태에 따라 색상 해금 처리
  // 가장 중요한 색상 상태 처리 부분을 수정합니다
  // 구독 상태에 따라 색상 해금 처리하는 useEffect

  useEffect(() => {
    const handleSubscriptionColors = async () => {
      try {
        // 1. 먼저 사용자가 실제로 구매한 색상 불러오기
        const purchasedColors = await loadUnlockedColors();
        console.log(
          "사용자가 구매한 색상 불러옴:",
          Object.keys(purchasedColors).length,
          "개"
        );

        if (isSubscribed) {
          console.log("구독자 확인: 모든 색상 접근 권한 부여");

          // 구독자의 경우, 저장된 구매 기록은 그대로 두고
          // 메모리에만 모든 색상 접근 권한을 부여함
          const subscriberColorsMap = {};

          // 모든 색상에 대해 임시 접근 권한 설정
          COLOR_PALETTE.forEach((_, index) => {
            // 이미 구매한 색상은 그대로 유지, 나머지는 '구독 혜택'으로 표시
            subscriberColorsMap[index] = purchasedColors[index] || {
              purchased: false,
              subscriptionBenefit: true,
            };
          });

          // 색상 상태 업데이트 (메모리에만)
          setUnlockedColors(subscriberColorsMap);

          console.log("구독자 모드 활성화: 모든 색상 접근 가능");
        } else {
          console.log("비구독자 확인: 구매한 색상만 사용 가능");

          // 기본 색상이 없는 경우 초기 색상 세트 제공
          if (Object.keys(purchasedColors).length === 0) {
            const initialColors = {
              0: { purchased: true }, // 파란색 - 기본
              1: { purchased: true }, // 녹색
              2: { purchased: true }, // 남색
              4: { purchased: true }, // 민트
              6: { purchased: true }, // 주황색
            };

            await saveUnlockedColors(initialColors);
            setUnlockedColors(initialColors);
            console.log("초기 색상 세트 제공 완료");
          } else {
            // 구매한 색상만 설정
            setUnlockedColors(purchasedColors);
          }
        }
      } catch (error) {
        console.error("구독 색상 처리 오류:", error);

        // 오류 발생 시 기본 색상이라도 제공
        const fallbackColors = { 0: { purchased: true } };
        setUnlockedColors(fallbackColors);
      }
    };

    handleSubscriptionColors();
  }, [isSubscribed]); // 구독 상태가 변경될 때마다 실행

  // 초기 색상 로드
  useEffect(() => {
    const loadColors = async () => {
      const savedColors = await loadScheduleColors();
      if (Object.keys(savedColors).length > 0) {
        setScheduleColors(savedColors);
      }
    };
    loadColors();
  }, []);

  useEffect(() => {
    // 이미 색상이 설정되어 있으면 건너뛰기
    if (Object.keys(scheduleColors).length > 0) return;

    // 새로운 색상 맵 생성
    const newColorMap = {};
    const allScheduleIds = new Set();

    // 요일별 일정 ID 수집
    Object.keys(weeklySchedules).forEach((day) => {
      if (weeklySchedules[day] && Array.isArray(weeklySchedules[day])) {
        weeklySchedules[day].forEach((schedule) => {
          if (schedule && schedule.id) {
            allScheduleIds.add(schedule.id);
          }
        });
      }
    });

    // 각 일정에 색상 할당 - 해금된 색상만 사용
    allScheduleIds.forEach((scheduleId) => {
      // 요일과 시간 정보 찾기
      let day, hour;
      Object.keys(weeklySchedules).forEach((d) => {
        if (weeklySchedules[d] && Array.isArray(weeklySchedules[d])) {
          const foundSchedule = weeklySchedules[d].find(
            (s) => s.id === scheduleId
          );
          if (foundSchedule) {
            day = d;
            hour = foundSchedule.startTime
              ? parseInt(foundSchedule.startTime.split(":")[0])
              : 9;
          }
        }
      });

      // 요일과 시간 정보가 있으면 그에 따라 색상 할당
      if (day && hour !== undefined) {
        newColorMap[scheduleId] = ensureRGBA(getColorByDayOrTime(day, hour));
      } else {
        newColorMap[scheduleId] = ensureRGBA(getNextColor(newColorMap));
      }
    });

    // 색상 맵 업데이트
    if (Object.keys(newColorMap).length > 0) {
      setScheduleColors(newColorMap);
      // 변경된 색상 정보 저장
      saveScheduleColors(newColorMap).catch((err) =>
        console.error("색상 저장 실패:", err)
      );
    }
  }, [weeklySchedules, getColorByDayOrTime, getNextColor, unlockedColors]);

  // 스크롤 및 줌 컨트롤 초기화
  useEffect(() => {
    // 앱 처음 실행 시 현재 시간으로 스크롤
    if (!userHasScrolled) {
      const currentHour = new Date().getHours();
      scrollToCurrentTime(currentHour, true);
    }

    // 확대/축소 컨트롤 초기에 숨기기
    setShowZoomControls(false);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (zoomControlTimerRef.current) {
        clearTimeout(zoomControlTimerRef.current);
      }
    };
  }, []);

  const colorCache = useRef({});
  // 색상 변환 함수 최적화 - 동일한 색상에 대한 계산 결과를 캐싱
  const getColorWithCache = useCallback((color) => {
    if (!color) return COLOR_PALETTE[0];

    // 이미 캐시에 있으면 캐시된 결과 반환
    if (colorCache.current[color]) {
      return colorCache.current[color];
    }

    // 없으면 변환 후 캐시에 저장
    const transformedColor = ensureRGBA(color);
    colorCache.current[color] = transformedColor;
    return transformedColor;
  }, []);

  // 해당 요일, 시간에 일정 찾기
  const findSchedulesByDayAndHour = useCallback(
    (day, hour) => {
      // 현재 주의 해당 요일에 대한 실제 날짜 계산
      const weekDates = getWeekDates();
      const dateStr = weekDates[day];

      // 해당 날짜의 일정 가져오기
      const daySchedules = schedules[dateStr] || [];

      // 현재 시간에 해당하는 일정 필터링
      return daySchedules.filter((schedule) => {
        if (!schedule || !schedule.startTime || !schedule.endTime) {
          return false;
        }

        const startHour = parseInt(schedule.startTime.split(":")[0]);
        return startHour === hour;
      });
    },
    [schedules, getWeekDates]
  );

  const findSchedulesByDayAndHourWithColor = useCallback(
    (day, hour) => {
      const scheduleItems = findSchedulesByDayAndHour(day, hour);

      return scheduleItems.map((schedule) => {
        let color = scheduleColors[schedule.id];

        if (!color && schedule.color) {
          color = schedule.color;
        }

        if (!color) {
          color = getColorByDayOrTime(day, hour);
        }

        return {
          ...schedule,
          color: getColorWithCache(color), // ensureRGBA 대신 캐싱 함수 사용
        };
      });
    },
    [
      findSchedulesByDayAndHour,
      scheduleColors,
      getColorByDayOrTime,
      getColorWithCache,
    ]
  );

  // 그리고 다음 함수를 추가하여 해금된 색상을 확인하는 로그 함수 만들기
  const logUnlockedColors = useCallback(() => {
    // 이 함수는 초기 로드 시에만 호출되도록 합니다
    const unlockedIndices = Object.keys(unlockedColors).filter(
      (k) => unlockedColors[k]
    );
    console.log("==== 해금된 색상 정보 ====");
    console.log(`총 해금 색상 수: ${unlockedIndices.length}`);
    console.log(`해금된 색상 인덱스: ${unlockedIndices.join(", ")}`);
    console.log("========================");
  }, [unlockedColors]);

  const scrollToCurrentTime = useCallback(
    (hour, force = false) => {
      // 강제 스크롤이 아니고 사용자가 이미 스크롤했다면 무시
      if (!force && userHasScrolled) {
        return;
      }

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: hour * (BASE_CELL_HEIGHT * scale) - HEADER_HEIGHT,
          animated: true,
        });
      }
    },
    [scale, userHasScrolled]
  );

  useEffect(() => {
    // 색상 캐시 초기화 - 필요한 경우에만 수행
    if (
      Object.keys(colorCache.current).length === 0 &&
      Object.keys(unlockedColors).length > 0
    ) {
      const cachedColorsMap = {};

      // 해금된 색상을 캐시에 저장
      Object.keys(unlockedColors).forEach((index) => {
        if (unlockedColors[index]) {
          cachedColorsMap[index] = COLOR_PALETTE[index];
        }
      });

      colorCache.current = cachedColorsMap;
      console.log("색상 캐시 초기화 완료");
    }
  }, [unlockedColors]);

  // 화면 날짜 이동 (다음 주, 이전 주)
  const changeWeek = useCallback(
    (direction) => {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(newWeekStart.getDate() + direction * 7);
      setCurrentWeekStart(newWeekStart);
    },
    [currentWeekStart]
  );

  // 확대/축소 제스처 핸들러
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        // 기존 타이머 제거
        if (zoomControlTimerRef.current) {
          clearTimeout(zoomControlTimerRef.current);
        }

        // 부드러운 애니메이션을 위해 Animated.spring 사용
        lastScale.current *= event.nativeEvent.scale;
        lastScale.current = Math.min(
          Math.max(lastScale.current, MIN_SCALE),
          MAX_SCALE
        );

        pinchScale.setValue(1);

        // 애니메이션이 완료된 후에만 React 상태 업데이트 (리렌더링 최소화)
        setScale(lastScale.current);

        // 확대/축소 컨트롤 표시
        setShowZoomControls(true);

        // 5초 후 컨트롤 숨기기 (타이머 참조 저장)
        zoomControlTimerRef.current = setTimeout(() => {
          setShowZoomControls(false);
        }, 5000);
      }
    },
    [pinchScale]
  );

  // 확대/축소 버튼 핸들러
  const handleZoomIn = useCallback(() => {
    // 기존 타이머 제거
    if (zoomControlTimerRef.current) {
      clearTimeout(zoomControlTimerRef.current);
    }

    const newScale = Math.min(scale + 0.2, MAX_SCALE);
    setScale(newScale);
    lastScale.current = newScale;

    // 컨트롤 표시 유지
    setShowZoomControls(true);

    // 자동으로 5초 후 숨기기
    zoomControlTimerRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 5000);
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    // 기존 타이머 제거
    if (zoomControlTimerRef.current) {
      clearTimeout(zoomControlTimerRef.current);
    }

    const newScale = Math.max(scale - 0.2, MIN_SCALE);
    setScale(newScale);
    lastScale.current = newScale;

    // 컨트롤 표시 유지
    setShowZoomControls(true);

    // 자동으로 5초 후 숨기기
    zoomControlTimerRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 5000);
  }, [scale]);

  const handleResetZoom = useCallback(() => {
    // 기존 타이머 제거
    if (zoomControlTimerRef.current) {
      clearTimeout(zoomControlTimerRef.current);
    }

    setScale(1);
    lastScale.current = 1;

    // 현재 시간으로 스크롤
    scrollToCurrentTime(new Date().getHours());

    // 컨트롤 표시 후 5초 후 숨기기
    setShowZoomControls(true);
    zoomControlTimerRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 5000);
  }, [scrollToCurrentTime]);

  // 멀티셀렉트 모드 토글
  const toggleMultiSelectMode = useCallback(() => {
    // 이미 멀티셀렉트 모드일 때
    if (isMultiSelectMode) {
      // 일정이 선택되어 있는지 확인
      if (selectedSchedules.length > 0) {
        // 일정이 선택되어 있으면 색상 팔레트 모달 표시
        const firstSchedule = selectedSchedules[0];
        const currentColor =
          scheduleColors[firstSchedule.id] ||
          (firstSchedule.color
            ? ensureRGBA(firstSchedule.color)
            : COLOR_PALETTE[0]);

        // 선택된 색상 초기화
        setSelectedColor(currentColor);

        // 모달 표시
        setIsEditModalVisible(true);
      } else {
        // 선택된 일정이 없으면 멀티셀렉트 모드 비활성화
        setIsMultiSelectMode(false);
        // 선택 상태 초기화
        setSelectedSchedules([]);
      }
    } else {
      // 멀티셀렉트 모드가 아니라면 모드 활성화
      setIsMultiSelectMode(true);
      // 활성화할 때 선택 상태 초기화
      setSelectedSchedules([]);
    }
  }, [isMultiSelectMode, selectedSchedules, scheduleColors]);

  // 일정 선택 처리
  const handleSchedulePress = useCallback(
    (schedule, day) => {
      if (isMultiSelectMode) {
        // 멀티셀렉트 모드일 때
        const scheduleWithDay = { ...schedule, day };
        const index = selectedSchedules.findIndex((s) => s.id === schedule.id);

        if (index !== -1) {
          // 이미 선택된 일정이면 제거
          setSelectedSchedules((prev) =>
            prev.filter((s) => s.id !== schedule.id)
          );
        } else {
          // 선택되지 않은 일정이면 추가
          setSelectedSchedules((prev) => [...prev, scheduleWithDay]);
        }
      } else {
        // 일반 모드일 때는 일정 선택만 하고 색상은 변경하지 않음
        // 현재 일정의 색상 (이미 저장된 색상 또는 기본 색상)
        const currentColor =
          scheduleColors[schedule.id] || schedule.color || COLOR_PALETTE[0];

        // 현재 색상을 그대로 복사하여 모달에서만 수정할 수 있도록 함
        setSelectedColor(currentColor);
        setCurrentSchedule({ ...schedule, day });

        // 모달 표시
        setIsEditModalVisible(true);
      }
    },
    [isMultiSelectMode, selectedSchedules, scheduleColors]
  );

  // 색상 변경 저장
  const saveColorChange = useCallback(async () => {
    try {
      if (isMultiSelectMode && selectedSchedules.length > 0) {
        // 멀티셀렉트 모드에서 저장 처리
        const updatedColors = {};
        const updatedWeeklySchedules = { ...weeklySchedules };

        // RGBA 형식으로 변환된 색상
        const normalizedColor = ensureRGBA(selectedColor);

        // 각 선택된 일정의 색상 업데이트
        for (const schedule of selectedSchedules) {
          updatedColors[schedule.id] = normalizedColor;

          // 요일별 일정 배열에서 해당 일정 업데이트
          const day = schedule.day;
          if (day && updatedWeeklySchedules[day]) {
            const index = updatedWeeklySchedules[day].findIndex(
              (s) => s.id === schedule.id
            );
            if (index !== -1) {
              updatedWeeklySchedules[day][index] = {
                ...updatedWeeklySchedules[day][index],
                color: normalizedColor,
              };
            }
          }
        }

        // 색상 상태 업데이트
        const newColors = { ...scheduleColors, ...updatedColors };
        setScheduleColors(newColors);

        // 색상 정보 독립적으로 저장
        await saveScheduleColors(newColors);

        // 일정 저장 (색상 정보 포함)
        await saveWeeklyScheduleOnly(updatedWeeklySchedules);

        // 선택된 일정 초기화
        setSelectedSchedules([]);

        // 색상 저장 후 자동으로 멀티셀렉트 모드 종료
        setIsMultiSelectMode(false);
      } else if (currentSchedule) {
        // 단일 일정 색상 변경 처리
        const normalizedColor = ensureRGBA(selectedColor);

        // 현재 일정의 색상 업데이트
        const newColors = {
          ...scheduleColors,
          [currentSchedule.id]: normalizedColor,
        };
        setScheduleColors(newColors);

        // 색상 정보 독립적으로 저장
        await saveScheduleColors(newColors);

        const day = currentSchedule.day;
        if (day && weeklySchedules[day]) {
          const daySchedules = [...weeklySchedules[day]];
          const scheduleIndex = daySchedules.findIndex(
            (s) => s.id === currentSchedule.id
          );

          if (scheduleIndex !== -1) {
            // 일정에 색상 설정
            daySchedules[scheduleIndex] = {
              ...daySchedules[scheduleIndex],
              color: normalizedColor,
            };

            // 요일별 일정 배열 업데이트
            const updatedWeeklySchedules = {
              ...weeklySchedules,
              [day]: daySchedules,
            };

            // 일정 저장 (색상 정보 포함)
            await saveWeeklyScheduleOnly(updatedWeeklySchedules);
          }
        }
      }

      // 모달 닫기
      setIsEditModalVisible(false);

      // 리렌더링 유도
      setSelectedSchedule({ id: Date.now() });
    } catch (error) {
      console.error("색상 변경 중 오류 발생:", error);
      Alert.alert("오류", "색상을 저장하는 중 문제가 발생했습니다.");
    }
  }, [
    isMultiSelectMode,
    selectedSchedules,
    currentSchedule,
    selectedColor,
    scheduleColors,
    weeklySchedules,
    saveWeeklyScheduleOnly,
  ]);

  // 요일 헤더 렌더링
  const renderWeekDates = useCallback(() => {
    return DAYS.map((day, index) => {
      const date = addDays(currentWeekStart, index);
      const isToday =
        format(new Date(), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");

      return (
        <View
          key={day}
          style={[
            styles.dayHeaderCell,
            { width: dayColumnWidth },
            isToday && styles.todayHeader,
          ]}
        >
          <Text style={styles.dayLabel}>{DAY_LABELS[index]}</Text>
          <Text style={styles.dateLabel}>
            {format(date, "d", { locale: ko })}
          </Text>
        </View>
      );
    });
  }, [currentWeekStart, dayColumnWidth]);

  // 색상 선택 모달
  const renderColorPickerModal = useCallback(() => {
    const title = isMultiSelectMode
      ? `${selectedSchedules.length}개 일정 색상 변경`
      : "일정 색상 변경";

    return (
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>

            {!isMultiSelectMode && currentSchedule && (
              <>
                <Text style={styles.scheduleInfo}>{currentSchedule.task}</Text>
                <Text style={styles.scheduleTimeInfo}>
                  {currentSchedule.startTime} - {currentSchedule.endTime}
                </Text>
              </>
            )}

            {/* 색상 선택 팔레트 */}
            <View style={styles.colorPalette}>
              {COLOR_PALETTE.map((color, index) => {
                // 색상이 해금되었는지 확인
                const isUnlocked = unlockedColors[index] || false;
                // 색상 가격 가져오기
                const colorPrice = getColorPrice(index);
                // 색상 희귀도 가져오기
                const colorRarity = getColorRarity(index);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: isUnlocked
                          ? color
                          : "rgba(200,200,200,0.3)",
                      },
                      selectedColor === color && styles.selectedColorOption,
                    ]}
                    onPress={() => {
                      if (isUnlocked) {
                        setSelectedColor(color);
                      } else {
                        // 구매 확인 모달 표시
                        setSelectedColorForPurchase(index);
                        Alert.alert(
                          "색상 구매",
                          `${colorRarity} 색상을 ${colorPrice}P로 구매하시겠습니까?`,
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "구매",
                              onPress: async () => {
                                const success = await purchaseColor(index);
                                if (success) {
                                  // 구매 성공 시 선택된 색상 업데이트
                                  setSelectedColor(COLOR_PALETTE[index]);
                                }
                              },
                            },
                          ]
                        );
                      }
                    }}
                    disabled={!isUnlocked && points < colorPrice}
                  >
                    {!isUnlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={14} color="white" />
                        <Text style={styles.colorPrice}>{colorPrice}P</Text>
                      </View>
                    )}
                    {selectedColor === color && isUnlocked && (
                      <View style={styles.colorCheckmark}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 포인트 표시 */}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsText}>보유 포인트: {points}P</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveColorChange}
              >
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [
    isEditModalVisible,
    isMultiSelectMode,
    selectedSchedules,
    currentSchedule,
    selectedColor,
    unlockedColors,
    points,
    saveColorChange,
    purchaseColor,
  ]);

  // 구매 확인 모달
  const renderPurchaseModal = useCallback(() => {
    if (selectedColorForPurchase === null) return null;

    const colorIndex = selectedColorForPurchase;
    const colorPrice = getColorPrice(colorIndex);
    const colorRarity = getColorRarity(colorIndex);

    return (
      <Modal
        visible={selectedColorForPurchase !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedColorForPurchase(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseModalContent}>
            <Text style={styles.modalTitle}>색상 구매</Text>

            <View style={styles.colorPreviewContainer}>
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: COLOR_PALETTE[colorIndex] },
                ]}
              />
              <Text style={styles.colorRarity}>{colorRarity} 색상</Text>
            </View>

            <Text style={styles.purchasePrice}>가격: {colorPrice}P</Text>
            <Text style={styles.currentPoints}>보유: {points}P</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSelectedColorForPurchase(null)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  points < colorPrice && styles.disabledButton,
                ]}
                onPress={async () => {
                  const success = await purchaseColor(colorIndex);
                  if (success) {
                    setSelectedColorForPurchase(null);
                  }
                }}
                disabled={points < colorPrice}
              >
                <Text style={styles.buttonText}>구매</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [selectedColorForPurchase, points, purchaseColor]);

  // 확대/축소 컨트롤 버튼 렌더링
  const renderZoomControls = useCallback(() => {
    if (!showZoomControls) return null;

    return (
      <View style={styles.zoomControlsContainer}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomOut}
          disabled={scale <= MIN_SCALE}
        >
          <Ionicons
            name="remove"
            size={18}
            color={scale <= MIN_SCALE ? "#ccc" : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.zoomResetButton}
          onPress={handleResetZoom}
        >
          <Text style={styles.zoomResetText}>{Math.round(scale * 100)}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomIn}
          disabled={scale >= MAX_SCALE}
        >
          <Ionicons
            name="add"
            size={18}
            color={scale >= MAX_SCALE ? "#ccc" : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowZoomControls(false)}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }, [showZoomControls, scale, handleZoomIn, handleZoomOut, handleResetZoom]);

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.header}>
        <View style={styles.weekNavigator}>
          <TouchableOpacity
            onPress={() => changeWeek(-1)}
            style={styles.weekArrowButton}
          >
            <Ionicons name="chevron-back" size={22} color="#50cebb" />
          </TouchableOpacity>

          <View style={styles.weekInfoContainer}>
            <Text style={styles.weekTitle}>
              {getWeekDisplayText(currentWeekStart)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeWeek(1)}
            style={styles.weekArrowButton}
          >
            <Ionicons name="chevron-forward" size={22} color="#50cebb" />
          </TouchableOpacity>
        </View>

        {/* 색상 변경 버튼 */}
        <TouchableOpacity
          onPress={toggleMultiSelectMode}
          style={[
            styles.colorButton,
            isMultiSelectMode && styles.activeColorButton,
          ]}
        >
          <Ionicons
            name={isMultiSelectMode ? "color-palette" : "color-palette-outline"}
            size={20}
            color={isMultiSelectMode ? "#fff" : "#50cebb"}
          />
        </TouchableOpacity>
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* 헤더 */}

          {/* 멀티셀렉트 모드 안내 메시지 */}
          {isMultiSelectMode && (
            <View style={styles.multiSelectBanner}>
              <Text style={styles.multiSelectText}>
                {selectedSchedules.length > 0
                  ? `${selectedSchedules.length}개 일정 선택됨 (색상 변경하려면 팔레트 버튼을 다시 눌러주세요)`
                  : "일정을 선택하세요"}
              </Text>
            </View>
          )}

          {/* 확대/축소 컨트롤 */}
          {renderZoomControls()}
          {/* 색상 정보 배지 - 여기 추가 */}
          {renderColorInfoBadge()}

          {/* 시간표 뷰 - 헤더와 그리드 분리 */}
          <View style={styles.timetableContainer}>
            {/* 요일 헤더 - 확대/축소에서 제외 */}
            <View style={styles.dayHeaderRow}>
              <View style={styles.timeHeaderCell}>
                <Text style={styles.timeLabel}>시간</Text>
              </View>
              {renderWeekDates()}
            </View>

            {/* 시간표 그리드 - PinchGestureHandler 적용 */}
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
              minPointers={2}
              maxPointers={2}
            >
              <Animated.View style={{ flex: 1 }}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.gridContainer}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  onScroll={() => {
                    // 사용자가 스크롤했음을 기록
                    if (!userHasScrolled) {
                      setUserHasScrolled(true);
                    }
                  }}
                  scrollEventThrottle={200}
                >
                  {HOURS.map((hour) => (
                    <View
                      key={hour}
                      style={[styles.hourRow, { height: CELL_HEIGHT }]}
                    >
                      {/* 시간 레이블 */}
                      <View style={styles.timeCell}>
                        <Text style={styles.hourLabel}>{hour}:00</Text>
                      </View>

                      {/* 요일별 셀 */}
                      {DAYS.map((day) => (
                        <View
                          key={`${day}-${hour}`}
                          style={[styles.dayCell, { width: dayColumnWidth }]}
                        >
                          {/* 해당 시간, 요일에 일정이 있으면 표시 */}
                          {findSchedulesByDayAndHourWithColor(day, hour).map(
                            (schedule, index) => {
                              const startHour = parseInt(
                                schedule.startTime.split(":")[0]
                              );
                              if (startHour !== hour) return null;

                              const startMinute = parseInt(
                                schedule.startTime.split(":")[1]
                              );
                              const endHour = parseInt(
                                schedule.endTime.split(":")[0]
                              );
                              const endMinute = parseInt(
                                schedule.endTime.split(":")[1]
                              );

                              const durationHours =
                                endHour -
                                startHour +
                                (endMinute - startMinute) / 60;
                              const height =
                                durationHours * (BASE_CELL_HEIGHT * scale);

                              // 멀티셀렉트 모드에서 선택된 일정인지 확인
                              const isSelected =
                                isMultiSelectMode &&
                                selectedSchedules.some(
                                  (s) => s.id === schedule.id
                                );

                              return (
                                <TouchableOpacity
                                  key={`${schedule.id}-${index}`}
                                  style={[
                                    styles.scheduleItem,
                                    {
                                      position: "absolute",
                                      top:
                                        (startMinute / 60) *
                                        (BASE_CELL_HEIGHT * scale),
                                      height:
                                        height > 0
                                          ? height
                                          : (BASE_CELL_HEIGHT * scale) / 4,
                                      left: 1,
                                      right: 1,
                                      backgroundColor:
                                        schedule.color || getRandomColor(),
                                    },
                                    isSelected && styles.selectedScheduleItem,
                                  ]}
                                  onPress={() =>
                                    handleSchedulePress(schedule, day)
                                  }
                                >
                                  <Text
                                    style={styles.scheduleTitle}
                                    numberOfLines={1}
                                  >
                                    {schedule.task}
                                  </Text>
                                  <Text
                                    style={styles.scheduleTime}
                                    numberOfLines={1}
                                  >
                                    {schedule.startTime} - {schedule.endTime}
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            </PinchGestureHandler>
          </View>

          {/* 현재 시간으로 버튼 */}
          <TouchableOpacity
            style={styles.currentTimeButton}
            onPress={() => {
              scrollToCurrentTime(new Date().getHours(), true);
              handleResetZoom();
            }}
          >
            <Ionicons name="time-outline" size={22} color="white" />
          </TouchableOpacity>
          {/* 색상 관리 버튼 - 여기 추가 */}
          {renderColorManagerButton()}

          {/* 색상 선택 모달 */}
          {renderColorPickerModal()}
          {renderPurchaseModal()}
          {renderColorStoreModal()}
        </View>
      </GestureHandlerRootView>
    </MainLayout>
  );
};

const moreStyles = {
  progressContainer: {
    width: "100%",
    marginVertical: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#50cebb",
    borderRadius: 4,
  },
  colorCategoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  colorStoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  colorStoreItem: {
    width: "25%",
    padding: 5,
    alignItems: "center",
  },
  colorStorePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 4,
  },
  colorStoreInfo: {
    alignItems: "center",
  },
  colorStoreRarity: {
    fontSize: 12,
    color: "#333",
  },
  colorStorePrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  insufficientPoints: {
    color: "#FF3B30",
  },
  pointsInfoContainer: {
    backgroundColor: "#f5f9fa",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pointsInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
};

const additionalStyles = {
  // 잠긴 색상 오버레이
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 18,
  },
  colorPrice: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 2,
  },

  // 포인트 표시
  pointsContainer: {
    marginVertical: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
  },

  // 구매 모달
  purchaseModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    width: "80%",
    maxWidth: 300,
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
  colorPreviewContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  colorRarity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  purchasePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  currentPoints: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },

  // 색상 팔레트 그리드 스타일 수정
  colorPalette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
    width: "100%",
    paddingHorizontal: 5,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  // 색상 관리 버튼
  colorManagerButton: {
    position: "absolute",
    bottom: 20,
    right: 80,
    backgroundColor: "rgba(80, 206, 187, 0.9)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
    borderWidth: 2,
    borderColor: "white",
  },

  // 색상 정보 배지
  colorInfoBadge: {
    position: "absolute",
    top: 70,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  colorInfoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
};

const styles = StyleSheet.create({
  ...additionalStyles,
  ...moreStyles,
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    position: "relative", // 색상 버튼의 절대 위치 지정을 위해 relative 설정
    flexDirection: "row",
    justifyContent: "center", // 중앙 정렬로 변경
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    height: 56, // 높이 명시적 지정
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    width: "24%",
  },
  weekNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // flex 속성 제거
  },
  weekInfoContainer: {
    backgroundColor: "#f5f9fa",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  weekArrowButton: {
    padding: 6,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  colorButton: {
    position: "absolute", // 절대 위치로 변경
    right: 12, // 오른쪽에서 12px 떨어진 위치
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  activeColorButton: {
    backgroundColor: "#50cebb",
  },
  multiSelectBanner: {
    backgroundColor: "#f0f9ff",
    padding: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  multiSelectText: {
    color: "#50cebb",
    fontWeight: "600",
  },
  timetableContainer: {
    flex: 1,
  },
  dayHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  timeHeaderCell: {
    width: 50,
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  dayHeaderCell: {
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  todayHeader: {
    backgroundColor: "#e6f7ff",
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
  },
  gridContainer: {
    flex: 1,
  },
  hourRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  timeCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  hourLabel: {
    fontSize: 12,
    color: "#666",
  },
  dayCell: {
    borderRightWidth: 1,
    borderRightColor: "#eee",
    position: "relative",
  },
  scheduleItem: {
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 5,
    padding: 5,
    zIndex: 5,
  },
  selectedScheduleItem: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  scheduleTime: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.8,
  },
  // 현재 시간으로 버튼
  currentTimeButton: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(80, 206, 187, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    right: 20,
    bottom: 80, // 탭 네비게이션을 위한 더 높은 위치
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
    borderWidth: 2,
    borderColor: "white",
  },
  zoomControlsContainer: {
    position: "absolute",
    right: 20,
    top: 70,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 5,
    zIndex: 100,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignItems: "center",
  },
  zoomButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  zoomResetButton: {
    paddingHorizontal: 10,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomResetText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    width: "90%",
    maxWidth: 350,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  scheduleInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  scheduleTimeInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  colorPalette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 4,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: "#333",
  },
  colorCheckmark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#50cebb",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default WeeklyTimetableScreen;
