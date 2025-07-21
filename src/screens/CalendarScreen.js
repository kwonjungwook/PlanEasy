// src/screens/CalendarScreen.js
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
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
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { getHolidayName } from "../components/holidays";
import { usePlanner } from "../context/PlannerContext";
const THEME_COLORS = {
  primary: "#50cebb", // 기존 코랄색
  secondary: "#4a73e2", // 세컨더리 색상
  indigo: "#5D5D5D", // 인디고
  violet: "#353535", // 바이올렛
  grape: "#353535", // 포도색
  azure: "#1c7ed6", // 하늘색 - 탭바 확장 시 사용할 색상
  teal: "#12b886", // 틸 - 탭바 확장 시 사용할 색상
  light: "#f8f9fa", // 라이트 컬러
  dark: "#343a40", // 다크 컬러
  gray: "#adb5bd", // 그레이 컬러
  success: "#20c997", // 성공 컬러
  danger: "#fa5252", // 위험 컬러
  warning: "#fd7e14", // 경고 컬러
  shadow: "#000000", // 그림자 컬러
};

// 향상된 테마
const THEME = {
  backgroundColor: "#ffffff",
  calendarBackground: "#ffffff",
  textSectionTitleColor: "#666",
  selectedDayBackgroundColor: THEME_COLORS.primary,
  selectedDayTextColor: "#ffffff",
  todayTextColor: THEME_COLORS.primary,
  dayTextColor: "#2d4150",
  textDisabledColor: "#d9e1e8",
  dotColor: THEME_COLORS.primary,
  selectedDotColor: "#ffffff",
  arrowColor: THEME_COLORS.primary,
  monthTextColor: "#2d4150",
  indicatorColor: THEME_COLORS.primary,
  textDayFontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  textMonthFontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  textDayHeaderFontFamily:
    Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  textDayFontWeight: "500",
  textMonthFontWeight: "600",
  textDayHeaderFontWeight: "600",
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CalendarScreen() {
  // ===== 1. 상태 변수 및 Hooks =====
  const navigation = useNavigation();
  const route = useRoute();
  const {
    schedules,
    earnedBadges,
    updateSchedule,
    defaultWeekdaySchedule,
    defaultWeekendSchedule,
    dailySchedules,
    saveDailySchedule,
    customSchedules,
  } = usePlanner();

  // 달력 관련 상태
  const [selectedDates, setSelectedDates] = useState({});
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showSchedules, setShowSchedules] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  // 레이아웃 관련 상태
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [layoutMode, setLayoutMode] = useState("normal"); // 'normal' 또는 'expanded'

  // 애니메이션 값
  const dragColorAnim = useRef(new Animated.Value(0)).current;
  const expandRatioAnim = useRef(new Animated.Value(0)).current;

  // 스크롤 참조
  const scrollRef = useRef(null);
  const calendarContainerRef = useRef(null);

  // 일정 선택 관련 상태
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  // 모달 관련 상태
  const [modalState, setModalState] = useState({
    visible: false,
    type: null,
    transitioning: false,
    content: null,
  });
  const daySchedules = useMemo(() => {
    const items = schedules[currentDate] ?? [];
    return [...items].sort((a, b) => {
      const aMin = a.startTime.split(":").reduce((h, m) => h * 60 + +m);
      const bMin = b.startTime.split(":").reduce((h, m) => h * 60 + +m);
      return aMin - bMin;
    });
  }, [schedules, currentDate]);

  // 📌 달력 표시에 필요한 데이터는 변할 때만 다시 계산
  const marked = useMemo(
    () => getMarkedDates(),
    [schedules, currentDate, selectedDates, isSelecting]
  );

  // 📌 셀 렌더러를 한 번 만들어 재사용
  const renderDay = useCallback(
    ({ date, state, marking }) => {
      if (state === "disabled") return <View />;

      const dayDate = new Date(date.timestamp);
      const dow = dayDate.getDay();
      const holiday = getHolidayName(date.dateString);

      const textStyle = [
        styles.dayText,
        (dow === 0 || holiday) && { color: "#f44336" },
        dow === 6 && { color: "#9C27B0" },
        marking?.selected && { color: "white" },
      ];

      return (
        <TouchableOpacity
          onPress={() => handleDayPress({ dateString: date.dateString })}
          style={[
            styles.dayContainer,
            marking?.selected && {
              backgroundColor: THEME_COLORS.primary,
              borderRadius: 16,
            },
          ]}
        >
          <Text style={textStyle}>{date.day}</Text>

          {holiday && (
            <Text
              style={[
                styles.holidayText,
                { color: marking?.selected ? "white" : "#f44336" },
              ]}
              numberOfLines={1}
            >
              {holiday}
            </Text>
          )}

          {marking?.marked && (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: marking.selected
                  ? "white"
                  : THEME_COLORS.primary,
                marginTop: 1,
              }}
            />
          )}
        </TouchableOpacity>
      );
    },
    [isSelecting, selectedDates]
  );

  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(20)).current;

  // 색상 보간 설정
  const backgroundColor = dragColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(251, 253, 255, 1)", "rgba(255, 255, 255, 1)"],
  });

  const handleColor = dragColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME_COLORS.gray, THEME_COLORS.primary],
  });

  // 확장 비율 보간 설정
  const calendarFlexValue = expandRatioAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.51, 0.05],
  });

  const scheduleFlexValue = expandRatioAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.49, 0.95],
  });

  // ===== 2. useEffect 및 이벤트 핸들러 =====

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log("캘린더 스크린 마운트됨");
    return () => {
      console.log("캘린더 스크린 언마운트됨");
    };
  }, []);

  // 뒤로가기 버튼 핸들러
  useEffect(() => {
    const handleBackPress = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectedDates({});
        return true;
      }
      return false;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [isSelecting]);

  // 화면 포커스 효과
  useFocusEffect(
    React.useCallback(() => {
      setShowSchedules(true);
      setSelectedSchedules([]);

      if (isExpanded) {
        collapseSchedule();
      }

      return () => {
        // 정리 작업
      };
    }, [])
  );

  // 날짜 선택 모드 토글
  const toggleSelectionMode = () => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedDates({});
    } else {
      setIsSelecting(false);
      setSelectedDates({});
    }
  };

  // ===== 3. 모달 제어 함수 =====

  const showModal = (type = "main", content = null) => {
    if (modalState.visible) {
      setModalState((prev) => ({
        ...prev,
        transitioning: true,
      }));

      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalState({
          visible: true,
          type,
          transitioning: false,
          content,
        });

        startModalAnimation();
      });
    } else {
      setModalState({
        visible: true,
        type,
        transitioning: false,
        content,
      });

      // 즐시 완전히 불투명하게 설정 후 애니메이션 시작
      modalFadeAnim.setValue(0);
      modalTranslateY.setValue(20);
      
      // 짧은 지연 후 애니메이션 시작
      setTimeout(() => {
        startModalAnimation();
      }, 50);
    }
  };

  const hideModal = () => {
    if (!modalState.visible) return;

    setModalState((prev) => ({
      ...prev,
      transitioning: true,
    }));

    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalState({
        visible: false,
        type: null,
        transitioning: false,
        content: null,
      });
    });
  };

  const startModalAnimation = () => {
    // 초기값 다시 확인
    modalFadeAnim.setValue(0);
    modalTranslateY.setValue(20);

    // 애니메이션 실행
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300, // 조금 더 긴 시간
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 애니메이션 완료
    });
  };

  // ===== 4. 일정 확장/축소 함수 =====

  const expandSchedule = () => {
    setIsDragging(false);
    setLayoutMode("expanded");

    Animated.parallel([
      Animated.timing(expandRatioAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(dragColorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExpanded(true);

      // 스크롤 초기화
      setTimeout(() => {
        try {
          if (scrollRef.current) {
            scrollRef.current.scrollToOffset({ offset: 0, animated: false });
          }
        } catch (error) {
          console.log("스크롤 초기화 오류:", error);
        }
      }, 100);
    });
  };

  const collapseSchedule = () => {
    setIsDragging(false);
    setLayoutMode("normal");

    Animated.parallel([
      Animated.timing(expandRatioAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(dragColorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExpanded(false);

      // 스크롤 초기화
      setTimeout(() => {
        try {
          if (scrollRef.current) {
            scrollRef.current.scrollToOffset({ offset: 0, animated: false });
          }
        } catch (error) {
          console.log("스크롤 초기화 오류:", error);
        }
      }, 100);
    });
  };

  // ===== 5. PanResponder 설정 =====

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const y = evt.nativeEvent.locationY;
        return y < 50;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (e, gestureState) => {
        // 드래그 방향에 따라 확장/축소 상태 계산
        const ratio = isExpanded
          ? Math.max(0, Math.min(1, 1 + gestureState.dy / 200))
          : Math.max(0, Math.min(1, -gestureState.dy / 200));

        expandRatioAnim.setValue(ratio);
        dragColorAnim.setValue(ratio);
      },
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);

        const VELOCITY_THRESHOLD = 0.5;

        // 위로 빠르게 스와이프 = 확장
        if (gestureState.vy < -VELOCITY_THRESHOLD) {
          expandSchedule();
        }
        // 아래로 빠르게 스와이프 = 축소
        else if (gestureState.vy > VELOCITY_THRESHOLD) {
          collapseSchedule();
        }
        // 중간 지점 이상 드래그 = 토글
        else {
          const currentValue = expandRatioAnim._value;
          if (currentValue > 0.5) {
            expandSchedule();
          } else {
            collapseSchedule();
          }
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // ===== 6. 이벤트 핸들러 =====

  const handleDayPress = (day) => {
    if (isSelecting) {
      const updatedSelection = { ...selectedDates };
      if (updatedSelection[day.dateString]) {
        delete updatedSelection[day.dateString];
      } else {
        updatedSelection[day.dateString] = {
          selected: true,
          selectedColor: THEME_COLORS.primary,
        };
      }
      setSelectedDates(updatedSelection);
    } else {
      setCurrentDate(day.dateString);
      setShowSchedules(true);
      setSelectedDates({});
      setSelectedSchedules([]);
      if (isExpanded) {
        collapseSchedule();
      }
    }
  };

  const handleManageSchedule = () => {
    Alert.alert(
      "일정 관리",
      "일정을 관리하시겠습니까?",
      [
        {
          text: "일정 수정",
          onPress: () => {
            const currentSchedules = schedules[currentDate] || [];
            const preparedSchedules = currentSchedules.map((schedule) => ({
              ...schedule,
              id:
                schedule.id ||
                `${currentDate}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
            }));

            navigation.navigate("CalendarEditor", {
              date: currentDate,
              schedules: JSON.stringify(preparedSchedules),
              returnToCalendar: true,
            });
          },
        },
        {
          text: "일정 삭제",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "일정 삭제",
              "해당 날짜의 모든 일정을 삭제하시겠습니까?",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: async () => {
                    await updateSchedule(currentDate, []);
                  },
                },
              ]
            );
          },
        },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // ===== 7. 유틸리티 함수 =====

  function getMarkedDates() {
    const markedDates = {};

    Object.entries(schedules).forEach(([date, daySchedules]) => {
      if (daySchedules && daySchedules.length > 0) {
        markedDates[date] = {
          marked: true,
          dotColor: THEME_COLORS.primary,
        };
      }
    });

    if (!isSelecting && currentDate) {
      markedDates[currentDate] = {
        ...(markedDates[currentDate] || {}),
        selected: true,
        selectedColor: THEME_COLORS.primary,
      };
    }

    if (isSelecting) {
      Object.entries(selectedDates).forEach(([date, state]) => {
        markedDates[date] = {
          ...(markedDates[date] || {}),
          ...state,
        };
      });
    }

    return markedDates;
  }

  // ===== 8. 일정 적용 함수 =====

  const applySchedule = async (isWeekday, dayKey, customSchedule) => {
    try {
      hideModal();

      const dates = Object.keys(selectedDates);
      if (dates.length === 0 && currentDate) {
        dates.push(currentDate);
      }

      if (dates.length === 0) {
        Alert.alert("알림", "적용할 날짜를 먼저 선택해주세요.");
        return;
      }

      let success = false;
      const updatedSchedules = { ...schedules };

      // 커스텀 일정 적용
      if (customSchedule) {
        if (
          !customSchedule.timeSlots ||
          customSchedule.timeSlots.length === 0
        ) {
          Alert.alert("알림", "선택한 커스텀 일정에 등록된 일정이 없습니다.");
          return;
        }

        for (const date of dates) {
          const newSchedules = customSchedule.timeSlots.map((slot) => ({
            ...slot,
            id: `${date}-custom-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            customId: customSchedule.id,
            customColor: customSchedule.color,
          }));

          updatedSchedules[date] = newSchedules;
        }
        success = true;
      }
      // 요일별 일정 적용
      else if (dayKey && dailySchedules[dayKey]) {
        for (const date of dates) {
          const newSchedules = dailySchedules[dayKey].map((schedule) => ({
            ...schedule,
            id: `${date}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          }));
          updatedSchedules[date] = newSchedules;
        }
        success = true;
      }
      // 평일/주말 기본 일정 적용
      else if (isWeekday !== undefined) {
        const defaultSchedule = isWeekday
          ? defaultWeekdaySchedule
          : defaultWeekendSchedule;

        if (!defaultSchedule || defaultSchedule.length === 0) {
          Alert.alert(
            "알림",
            `${isWeekday ? "평일" : "주말"} 기본 일정이 설정되어 있지 않습니다.`
          );
          return;
        }

        for (const date of dates) {
          const newSchedules = defaultSchedule.map((schedule) => ({
            ...schedule,
            id: `${date}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          }));
          updatedSchedules[date] = newSchedules;
        }
        success = true;
      }

      if (success) {
        await updateSchedule("all", updatedSchedules);
        setSelectedDates({});
        setIsSelecting(false);
        setCurrentDate(dates[0]);
        setShowSchedules(true);
        Alert.alert("완료", "일정이 성공적으로 적용되었습니다.");
      }
    } catch (error) {
      console.error("Error applying schedule:", error);
      Alert.alert("오류", "일정 적용 중 오류가 발생했습니다.");
    }
  };

  // ===== 9. 렌더링 함수 =====

  const renderEmptyCalendarIcon = () => {
    const date = new Date(currentDate);
    const month = date
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const day = date.getDate();

    return (
      <View style={styles.calendarIconContainer}>
        <View style={styles.calendarIconHeader}>
          <Text style={styles.calendarIconMonth}>{month}</Text>
        </View>
        <View style={styles.calendarIconBody}>
          <Text style={styles.calendarIconDay}>{day}</Text>
        </View>
      </View>
    );
  };

  const renderSchedules = () => {
    if (!currentDate || !showSchedules) return null;

    return (
      <>
        {/* 드래그 핸들 영역 */}
        <Animated.View
          style={[
            styles.dragHandleArea,
            { backgroundColor: backgroundColor },
            isDragging && styles.dragHandleAreaActive,
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.dragHandle,
              { backgroundColor: handleColor },
              isDragging && styles.dragHandleActive,
            ]}
          />
        </Animated.View>

        {/* 일정 헤더 */}
        <View style={styles.scheduleHeader}>
          <TouchableOpacity
            style={styles.expandTouchArea}
            onPress={() => {
              if (isExpanded) {
                collapseSchedule();
              } else {
                expandSchedule();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.scheduleHeaderContent}>
              <Text style={styles.scheduleTitle}>
                {format(new Date(currentDate), "yyyy년 MM월 dd일")}
              </Text>
              <Text style={styles.scheduleCount}>
                총 {daySchedules.length}개의 일정
              </Text>
            </View>
          </TouchableOpacity>

          {/* 일정 관리 버튼 - 다중 선택 모드일 땐 숨김 */}
          {!isSelecting && (
            <View style={styles.scheduleHeaderButtons}>
              {daySchedules.length > 0 ? (
                <TouchableOpacity
                  style={styles.managementButton}
                  onPress={handleManageSchedule}
                >
                  <Text style={styles.managementButtonText}>일정 관리</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => showModal("main")}
                >
                  <Text style={styles.addButtonText}>일정 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 일정 목록 */}
        <View style={{ flex: 1 }}>
          {daySchedules.length > 0 ? (
            <FlatList
              ref={scrollRef}
              data={daySchedules}
              keyExtractor={(item, index) => item.id || `schedule-${index}`}
              renderItem={({ item: schedule, index }) => {
                const indicatorColor =
                  schedule.customColor ||
                  (isExpanded ? THEME_COLORS.teal : THEME_COLORS.primary);

                return (
                  <View style={styles.scheduleItemWrapper}>
                    <View style={styles.scheduleItem}>
                      <View
                        style={[
                          styles.scheduleIndicator,
                          { backgroundColor: indicatorColor },
                        ]}
                      />

                      <View style={styles.scheduleContent}>
                        <Text style={styles.scheduleTime}>
                          {schedule.startTime} - {schedule.endTime}
                        </Text>
                        <Text style={styles.scheduleText}>{schedule.task}</Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 150,
              }}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              ListFooterComponent={() => <View style={{ height: 100 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              {renderEmptyCalendarIcon()}
              <Text style={styles.noScheduleText}>등록된 일정이 없습니다.</Text>
            </View>
          )}
        </View>
      </>
    );
  };

  // 모달 콘텐츠 렌더링 함수
  const renderModalContent = () => {
    switch (modalState.type) {
      case "main":
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.enhancedModalTitle}>일정 적용하기</Text>
              <Text style={styles.modalSubtitle}>
                선택한 날짜에 적용할 일정을 선택해주세요
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.weekdayButton]}
              onPress={() => applySchedule(true)}
              disabled={modalState.transitioning}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonEmoji}>🏢</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.enhancedModalButtonText}>
                  평일 일정 적용
                </Text>
                <Text style={styles.buttonSubText}>
                  월요일부터 금요일까지의 일정
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.weekendButton]}
              onPress={() => applySchedule(false)}
              disabled={modalState.transitioning}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonEmoji}>🌴</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.enhancedModalButtonText}>
                  주말 일정 적용
                </Text>
                <Text style={styles.buttonSubText}>토요일과 일요일 일정</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.dayButton]}
              onPress={() => showModal("day")}
              disabled={modalState.transitioning}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonEmoji}>📆</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.enhancedModalButtonText}>
                  요일별 일정 적용
                </Text>
                <Text style={styles.buttonSubText}>특정 요일 일정 선택</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.customButton]}
              onPress={() => showModal("custom")}
              disabled={modalState.transitioning}
            >
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonEmoji}>✨</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.enhancedModalButtonText}>
                  커스텀 일정 적용
                </Text>
                <Text style={styles.buttonSubText}>
                  나만의 일정 템플릿 선택
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.cancelModalButton]}
              onPress={hideModal}
              disabled={modalState.transitioning}
            >
              <Text style={styles.cancelModalButtonText}>취소</Text>
            </TouchableOpacity>
          </>
        );

      case "day":
        const days = [
          { key: "monday", label: "월요일", emoji: "🌙", color: "#4284F3" },
          { key: "tuesday", label: "화요일", emoji: "🔥", color: "#EA4335" },
          { key: "wednesday", label: "수요일", emoji: "💧", color: "#4A90E2" },
          { key: "thursday", label: "목요일", emoji: "🌳", color: "#34A853" },
          { key: "friday", label: "금요일", emoji: "🪙", color: "#FBBC04" },
          { key: "saturday", label: "토요일", emoji: "⭐", color: "#9C27B0" },
          { key: "sunday", label: "일요일", emoji: "☀️", color: "#FF7043" },
        ];

        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.enhancedModalTitle}>요일 선택</Text>
              <Text style={styles.modalSubtitle}>
                적용할 요일을 선택해주세요
              </Text>
            </View>

            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.51 }}>
              {days.map((day) => {
                const hasSchedules = dailySchedules[day.key]?.length > 0;
                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.enhancedModalButton,
                      {
                        backgroundColor: hasSchedules
                          ? `${day.color}20`
                          : "#f0f0f0",
                      },
                      !hasSchedules && styles.disabledButton,
                    ]}
                    onPress={() => {
                      if (hasSchedules) {
                        applySchedule(undefined, day.key);
                      } else {
                        Alert.alert(
                          "알림",
                          "해당 요일에 설정된 일정이 없습니다."
                        );
                      }
                    }}
                    disabled={!hasSchedules || modalState.transitioning}
                  >
                    <View style={styles.buttonIconContainer}>
                      <Text style={styles.buttonEmoji}>{day.emoji}</Text>
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text
                        style={[
                          styles.enhancedModalButtonText,
                          { color: hasSchedules ? day.color : "#a0a0a0" },
                        ]}
                      >
                        {day.label}
                      </Text>
                      <Text
                        style={[
                          styles.buttonSubText,
                          !hasSchedules && styles.disabledButtonText,
                        ]}
                      >
                        {hasSchedules
                          ? `${dailySchedules[day.key].length}개의 일정`
                          : "등록된 일정 없음"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.cancelModalButton]}
              onPress={() => showModal("main")}
              disabled={modalState.transitioning}
            >
              <Text style={styles.cancelModalButtonText}>취소</Text>
            </TouchableOpacity>
          </>
        );

      case "custom":
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.enhancedModalTitle}>커스텀 일정 선택</Text>
              <Text style={styles.modalSubtitle}>
                적용할 나만의 일정을 선택해주세요
              </Text>
            </View>

            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.51 }}>
              {customSchedules && customSchedules.length > 0 ? (
                customSchedules.map((schedule) => (
                  <TouchableOpacity
                    key={schedule.id}
                    style={[
                      styles.enhancedModalButton,
                      {
                        backgroundColor: schedule.color
                          ? schedule.color + "15"
                          : "#F5F5F5",
                      },
                    ]}
                    onPress={() => {
                      if (schedule.timeSlots?.length > 0) {
                        applySchedule(undefined, undefined, schedule);
                      } else {
                        Alert.alert(
                          "알림",
                          "선택한 커스텀 일정에 등록된 일정이 없습니다."
                        );
                      }
                    }}
                    disabled={
                      !schedule.timeSlots ||
                      schedule.timeSlots.length === 0 ||
                      modalState.transitioning
                    }
                  >
                    <View
                      style={[
                        styles.customIconContainer,
                        { backgroundColor: schedule.color || "#cccccc" },
                      ]}
                    >
                      <Text style={styles.customInitial}>
                        {schedule.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text
                        style={[
                          styles.enhancedModalButtonText,
                          { color: schedule.color || "#333333" },
                        ]}
                      >
                        {schedule.name}
                      </Text>
                      <Text style={styles.buttonSubText}>
                        {schedule.timeSlots?.length > 0
                          ? `${schedule.timeSlots.length}개의 일정`
                          : "등록된 일정 없음"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyCustomContainer}>
                  <Text style={styles.emptyCustomIcon}>🎨</Text>
                  <Text style={styles.emptyCustomText}>
                    등록된 커스텀 일정이 없습니다.
                  </Text>
                  <Text style={styles.emptyCustomSubText}>
                    커스텀 탭에서 먼저 일정을 등록해주세요.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.enhancedModalButton, styles.cancelModalButton]}
              onPress={() => showModal("main")}
              disabled={modalState.transitioning}
            >
              <Text style={styles.cancelModalButtonText}>취소</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  // ===== 10. 메인 렌더링 =====

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
        <View style={styles.container}>
          {/* 상단 헤더 영역 */}
          <View style={styles.header}>
            {/* 좌측에 헤더 제목 */}
            <Text style={styles.headerTitle}>캘린더</Text>

            {/* 우측에 컨트롤 버튼들 */}
            <View style={styles.headerControls}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  isSelecting && styles.modeButtonActive,
                ]}
                onPress={toggleSelectionMode}
              >
                <Text style={styles.modeButtonIcon}>
                  {isSelecting ? "✕" : "🔍"}
                </Text>
                <Text
                  style={[
                    styles.modeButtonText,
                    isSelecting && styles.modeButtonTextActive,
                  ]}
                >
                  {isSelecting ? "선택 취소" : "다중 선택"}
                </Text>
              </TouchableOpacity>

              {/* 선택 모드일 때 표시할 인라인 액션 버튼들 */}
              {isSelecting && Object.keys(selectedDates).length > 0 && (
                <View style={styles.inlineActionButtons}>
                  {Object.keys(selectedDates).some(
                    (date) => (schedules[date]?.length || 0) > 0
                  ) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteActionButton]}
                      onPress={() => {
                        Alert.alert(
                          "일정 삭제",
                          `선택한 날짜의 모든 일정을 삭제하시겠습니까?`,
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  const newSchedules = { ...schedules };
                                  Object.keys(selectedDates).forEach((date) => {
                                    if (schedules[date]?.length > 0) {
                                      delete newSchedules[date];
                                    }
                                  });
                                  await updateSchedule("all", newSchedules);
                                  setSelectedDates({});
                                  setIsSelecting(false);
                                  Alert.alert(
                                    "완료",
                                    "선택한 날짜의 일정이 삭제되었습니다."
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error deleting schedules:",
                                    error
                                  );
                                  Alert.alert(
                                    "오류",
                                    "일정 삭제 중 오류가 발생했습니다."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.actionButtonIcon}>🗑️</Text>
                      <Text style={styles.actionButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.applyActionButton]}
                    onPress={() => showModal("main")}
                  >
                    <Text style={styles.actionButtonIcon}>📅</Text>
                    <Text style={styles.actionButtonText}>
                      적용 ({Object.keys(selectedDates).length})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* 새로운 flex 레이아웃 사용 */}
          <View style={{ flex: 1 }}>
            {/* 달력 영역 - 애니메이션 처리된 flex 값 사용 */}
            <Animated.View
              ref={calendarContainerRef}
              style={[styles.calendarContainer, { flex: calendarFlexValue }]}
            >
              <Calendar
                style={styles.calendar}
                theme={THEME}
                firstDay={1}
                hideExtraDays={true}
                markedDates={marked}
                onDayPress={handleDayPress}
                enableSwipeMonths={true}
                monthFormat={"yyyy년 MM월"}
                onMonthChange={(month) => {
                  console.log("달력 월 변경:", month.dateString);
                }}
                dayComponent={renderDay}
              />
            </Animated.View>

            {/* 일정 영역 - 애니메이션 처리된 flex 값 사용 */}
            <Animated.View
              style={[
                styles.scheduleContainer,
                {
                  flex: scheduleFlexValue,
                  backgroundColor: backgroundColor,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                },
              ]}
            >
              {showSchedules && renderSchedules()}
            </Animated.View>
          </View>

          {/* 모달 */}
          {modalState.visible && (
            <Modal
              visible={true}
              transparent={true}
              animationType="none"
              onRequestClose={() => {
                if (!modalState.transitioning) {
                  if (modalState.type === "main") {
                    hideModal();
                  } else {
                    showModal("main");
                  }
                }
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Animated.View
                    style={[
                      styles.modalContent,
                      {
                        opacity: modalFadeAnim,
                        transform: [{ translateY: modalTranslateY }],
                      },
                    ]}
                  >
                    {renderModalContent()}
                  </Animated.View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ===== 스타일 정의 =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "#ffffff",
    // border 관련 속성 모두 제거
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME_COLORS.dark,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: THEME_COLORS.light,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  modeButtonActive: {
    backgroundColor: "#fee0e0",
  },
  modeButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  modeButtonText: {
    color: THEME_COLORS.dark,
    fontWeight: "500",
    fontSize: 13,
  },
  modeButtonTextActive: {
    color: "#e74c3c",
  },
  inlineActionButtons: {
    flexDirection: "row",
    marginLeft: 8,
    gap: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  deleteActionButton: {
    backgroundColor: "#fee0e0",
    borderColor: "#e74c3c30",
  },
  applyActionButton: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f330",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME_COLORS.dark,
  },
  calendarContainer: {
    backgroundColor: "#fcfcfc",
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  calendar: {
    borderBottomWidth: 0,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 40,
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME_COLORS.dark,
  },
  holidayText: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 1,
    fontWeight: "500",
  },
  scheduleContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dragHandleArea: {
    height: 30,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f3f5",
    borderBottomWidth: 0,
  },
  dragHandleAreaActive: {
    opacity: 0.9,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  dragHandleActive: {
    width: 52,
  },
  expandTouchArea: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  scheduleHeaderContent: {
    flex: 1,
    paddingRight: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME_COLORS.dark,
    marginBottom: 6,
  },
  scheduleCount: {
    fontSize: 14,
    color: THEME_COLORS.gray,
    fontWeight: "500",
  },
  scheduleHeaderButtons: {
    flexDirection: "row",
    gap: 10,
  },
  managementButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  managementButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: THEME_COLORS.secondary,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  scheduleItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 6,
    overflow: "hidden",
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scheduleIndicator: {
    width: 6,
    backgroundColor: THEME_COLORS.primary,
  },
  scheduleContent: {
    flex: 1,
    padding: 12,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME_COLORS.dark,
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 15,
    color: "#515057",
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
    width: "90%",
    alignSelf: "center",
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME_COLORS.dark,
    marginBottom: 8,
  },
  calendarIconContainer: {
    width: 80,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  calendarIconHeader: {
    backgroundColor: "#e53935",
    paddingVertical: 4,
    alignItems: "center",
  },
  calendarIconMonth: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  calendarIconBody: {
    backgroundColor: "white",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  calendarIconDay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF", // 컴테이너 배경색 보장
    borderRadius: 24,
    // 그림자 효과
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    alignItems: "stretch",
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  enhancedModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME_COLORS.dark,
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.gray,
    textAlign: "center",
  },
  enhancedModalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  buttonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  customIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonTextContainer: {
    flex: 1,
  },
  enhancedModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME_COLORS.dark,
    marginBottom: 4,
  },
  buttonSubText: {
    fontSize: 12,
    color: THEME_COLORS.gray,
  },
  cancelModalButton: {
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#515057",
  },
  weekdayButton: {
    backgroundColor: "#4284F320",
    borderColor: "#4284F340",
  },
  weekendButton: {
    backgroundColor: "#FF704320",
    borderColor: "#FF704340",
  },
  dayButton: {
    backgroundColor: "#34A85320",
    borderColor: "#34A85340",
  },
  customButton: {
    backgroundColor: "#9C27B020",
    borderColor: "#9C27B040",
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#aaaaaa",
  },
  emptyCustomContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCustomIcon: {
    fontSize: 42,
    marginBottom: 16,
  },
  emptyCustomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyCustomSubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
