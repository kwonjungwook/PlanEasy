import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  FlatList,
  BackHandler,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { usePlanner } from "../context/PlannerContext";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { format } from "date-fns";
import { getHolidayName } from "../components/holidays";
import HeaderBar from "../components/layout/HeaderBar";

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
const INITIAL_SCHEDULE_HEIGHT = SCREEN_HEIGHT * 0.45; // 화면 높이의 45%로 설정
const MAX_SCHEDULE_HEIGHT = SCREEN_HEIGHT * 0.9; // 일정 영역의 최대 높이 (화면의 90%로 확장)

export default function CalendarScreen() {
  // 1. 기본 상태 변수
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

  const [selectedDates, setSelectedDates] = useState({});
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showSchedules, setShowSchedules] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 추가: 일정 선택 관련 상태 변수들
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  // 2. 모달 관련 상태 및 애니메이션 변수
  const [modalState, setModalState] = useState({
    visible: false, // 모달 표시 여부
    type: null, // 모달 타입 (main, day, custom)
    transitioning: false, // 전환 중 여부
    content: null, // 현재 콘텐츠 (필요시 사용)
  });

  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(20)).current;

  // 드래그 관련 애니메이션 변수
  const scheduleHeightAnim = useRef(
    new Animated.Value(INITIAL_SCHEDULE_HEIGHT)
  ).current;
  const dragColorAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // 컬러 보간 설정
  const backgroundColor = dragColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(251, 253, 255, 1)", "rgba(255, 255, 255, 1)"],
  });
  const handleColor = dragColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME_COLORS.gray, THEME_COLORS.primary],
  });

  useEffect(() => {
    // 컴포넌트 마운트 시 스크롤 참조 설정 확인
    console.log("캘린더 스크린 마운트됨, 스크롤 참조 설정");

    // 스크롤 참조가 제대로 연결되었는지 디버깅
    return () => {
      console.log("캘린더 스크린 언마운트됨");
    };
  }, []);

  // 2. 컴포넌트 내부에 useEffect 추가 (기존 useEffect 아래 추가)
  useEffect(() => {
    // 뒤로가기 버튼 핸들러 함수
    const handleBackPress = () => {
      // 다중 선택 모드일 때는 선택 취소로 처리
      if (isSelecting) {
        setIsSelecting(false);
        setSelectedDates({});
        return true; // 이벤트 소비 (홈으로 가지 않음)
      }
      // 기본 동작 (홈으로 이동)
      return false;
    };

    // 백 핸들러 등록
    BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [isSelecting]); // isSelecting 상태가 변경될 때마다 재실행

  // 화면 포커스 효과: 일정 편집 후 돌아왔을 때 상태 업데이트
  useFocusEffect(
    React.useCallback(() => {
      // 일정 편집 화면에서 돌아왔을 때 일정 컨테이너가 보이도록 설정
      setShowSchedules(true);

      // 선택 모드 초기화
      setSelectedSchedules([]);

      // 편집 후 돌아왔을 때는 축소된 상태로 보여주기
      if (!isExpanded) {
        collapseSchedule();
      }

      return () => {
        // 화면에서 나갈 때 정리 작업
      };
    }, [])
  );

  // 2. 변경사항: 다중 선택 모드에서 오늘 날짜 체크 문제 수정
  const toggleSelectionMode = () => {
    if (!isSelecting) {
      // 다중 선택 모드 활성화 - 모든 선택 초기화
      setIsSelecting(true);
      setSelectedDates({}); // 빈 객체로 초기화하여 아무 날짜도 선택되지 않도록 함
    } else {
      // 다중 선택 모드 비활성화
      setIsSelecting(false);
      setSelectedDates({});
    }
  };

  // 3. 모달 제어 함수
  const showModal = (type = "main", content = null) => {
    // 모달이 이미 표시 중이면 콘텐츠 전환
    if (modalState.visible) {
      setModalState((prev) => ({
        ...prev,
        transitioning: true,
      }));

      // 페이드 아웃
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
        // 타입 변경 후 페이드 인
        setModalState({
          visible: true,
          type,
          transitioning: false,
          content,
        });

        // 페이드 인
        startModalAnimation();
      });
    }
    // 모달이 닫혀있으면 새로 표시
    else {
      setModalState({
        visible: true,
        type,
        transitioning: false,
        content,
      });

      // 페이드 인
      startModalAnimation();
    }
  };

  const hideModal = () => {
    if (!modalState.visible) return;

    setModalState((prev) => ({
      ...prev,
      transitioning: true,
    }));

    // 페이드 아웃
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
      // 모달 상태 초기화
      setModalState({
        visible: false,
        type: null,
        transitioning: false,
        content: null,
      });
    });
  };

  // 애니메이션 시작 함수
  const startModalAnimation = () => {
    modalFadeAnim.setValue(0);
    modalTranslateY.setValue(20);

    // 페이드 인 및 슬라이드 업
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const expandSchedule = () => {
    // 드래그 중 상태를 false로 설정하여 스크롤이 작동하도록 함
    setIsDragging(false);

    Animated.parallel([
      Animated.spring(scheduleHeightAnim, {
        toValue: MAX_SCHEDULE_HEIGHT,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
        velocity: 0.6,
      }),
      Animated.timing(dragColorAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExpanded(true);

      // 스크롤을 맨 위로 올리기 위한 안전한 방법
      setTimeout(() => {
        if (scrollRef.current && schedules[currentDate]?.length > 0) {
          try {
            // FlatList의 경우 scrollToOffset 사용
            scrollRef.current.scrollToOffset({ offset: 0, animated: true });
            console.log("일정 창 확장 완료, 스크롤 초기화됨");
          } catch (error) {
            console.log("스크롤 조작 중 오류 발생:", error);
          }
        } else {
          console.log("일정 창 확장 완료");
        }
      }, 300); // 약간의 지연을 줘서 애니메이션 완료 후 스크롤 실행
    });
  };

  // 4. collapseSchedule 함수 수정 - 함수 전체 교체
  const collapseSchedule = () => {
    Animated.parallel([
      Animated.spring(scheduleHeightAnim, {
        toValue: INITIAL_SCHEDULE_HEIGHT,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
        velocity: -0.6,
      }),
      Animated.timing(dragColorAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExpanded(false);
      console.log("일정 창 축소 완료");
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // 드래그 핸들 영역에서만 PanResponder 활성화
        const y = evt.nativeEvent.locationY;
        return y < 50;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // y축 방향으로 충분한 움직임이 있을 때만 PanResponder 활성화
        return Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        scheduleHeightAnim.setOffset(scheduleHeightAnim._value);
        setIsDragging(true);

        // setNativeProps 대신 상태 변수 사용
        // scrollRef.current 직접 조작하지 않음
      },
      onPanResponderMove: (e, gestureState) => {
        const newHeight = scheduleHeightAnim._offset + gestureState.dy * -1;

        if (
          newHeight >= INITIAL_SCHEDULE_HEIGHT - 30 &&
          newHeight <= MAX_SCHEDULE_HEIGHT + 30
        ) {
          const clampedHeight = Math.max(
            INITIAL_SCHEDULE_HEIGHT,
            Math.min(MAX_SCHEDULE_HEIGHT, newHeight)
          );
          scheduleHeightAnim.setValue(gestureState.dy * -1);

          const colorProgress =
            (clampedHeight - INITIAL_SCHEDULE_HEIGHT) /
            (MAX_SCHEDULE_HEIGHT - INITIAL_SCHEDULE_HEIGHT);
          dragColorAnim.setValue(Math.max(0, Math.min(1, colorProgress)));
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        scheduleHeightAnim.flattenOffset();
        setIsDragging(false);

        const newHeight = scheduleHeightAnim._value;
        const middlePoint = (INITIAL_SCHEDULE_HEIGHT + MAX_SCHEDULE_HEIGHT) / 2;
        const VELOCITY_THRESHOLD = 0.5;

        if (gestureState.vy > VELOCITY_THRESHOLD) {
          collapseSchedule();
        } else if (gestureState.vy < -VELOCITY_THRESHOLD) {
          expandSchedule();
        } else if (newHeight > middlePoint) {
          expandSchedule();
        } else {
          collapseSchedule();
        }
      },
      onPanResponderTerminate: () => {
        // 드래그가 취소되었을 때도 setIsDragging(false) 호출
        setIsDragging(false);
      },
    })
  ).current;

  // 6. 이벤트 핸들러
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
      // 선택 모드 초기화
      setSelectedSchedules([]);
      collapseSchedule();
    }
  };

  const handleTabPress = () => {
    if (isExpanded) {
      collapseSchedule();
    } else {
      expandSchedule();
    }
  };

  // 일정 관리 핸들러 - 향상된 옵션
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

  // 추가: 일정 항목 선택 처리
  const handleScheduleSelection = (scheduleId) => {
    setSelectedSchedules((prevSelected) => {
      if (prevSelected.includes(scheduleId)) {
        return prevSelected.filter((id) => id !== scheduleId);
      } else {
        return [...prevSelected, scheduleId];
      }
    });
  };

  // 추가: 선택된 일정 삭제
  const handleDeleteSelectedSchedules = async () => {
    if (selectedSchedules.length === 0) {
      Alert.alert("알림", "삭제할 일정을 선택해주세요.");
      return;
    }

    Alert.alert(
      "일정 삭제",
      `선택한 ${selectedSchedules.length}개의 일정을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const currentScheduleList = schedules[currentDate] || [];
            const filteredSchedules = currentScheduleList.filter(
              (schedule) => !selectedSchedules.includes(schedule.id)
            );

            await updateSchedule(currentDate, filteredSchedules);
            setSelectedSchedules([]);
            setIsScheduleSelecting(false);

            Alert.alert("완료", "선택한 일정이 삭제되었습니다.");
          },
        },
      ]
    );
  };

  // 7. 유틸리티 함수들
  const getMarkedDates = () => {
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
  };

  const onCalendarLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setCalendarHeight(height);
  };

  // 8. 일정 적용 함수
  const applySchedule = async (isWeekday, dayKey, customSchedule) => {
    try {
      // 모달 닫기
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

  const renderSchedules = () => {
    if (!currentDate || !showSchedules) return null;

    // 일정 데이터 정의
    const daySchedules = schedules[currentDate]
      ? [...schedules[currentDate]].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
        })
      : [];

    return (
      <Animated.View
        style={[
          styles.scheduleContainer,
          {
            height: scheduleHeightAnim,
            backgroundColor: backgroundColor,
            bottom: 0,
            position: "absolute",
            left: 0,
            right: 0,
            zIndex: 20,
          },
        ]}
      >
        {/* 드래그 핸들 영역 - PanResponder는 이 영역에만 적용 */}
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

        <View style={styles.scheduleHeader}>
          <TouchableOpacity
            style={styles.expandTouchArea}
            onPress={handleTabPress}
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

        {/* FlatList로 변경하여 일정 목록 표시 */}
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
              scrollEnabled={true} // 항상 스크롤 활성화
              ListFooterComponent={() => <View style={{ height: 100 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.noScheduleText}>등록된 일정이 없습니다.</Text>
              <Text style={styles.noScheduleSubText}>
                새로운 일정을 추가해보세요!
              </Text>

              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => showModal("main")}
              >
                <Text style={styles.emptyAddButtonText}>일정 추가하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
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

            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}>
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

            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}>
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

  // 10. 최종 렌더링
  return (
    <View style={styles.container}>
      {/* 상단 헤더 영역 */}
     
      <View style={styles.header}>
        {/* 좌측에 헤더 제목 */}
        <Text style={styles.headerTitle}>캘린더</Text>

        {/* 우측에 컨트롤 버튼들 */}
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.modeButton, isSelecting && styles.modeButtonActive]}
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
                              console.error("Error deleting schedules:", error);
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

      <View style={styles.calendarContainer} onLayout={onCalendarLayout}>
        <Calendar
          style={styles.calendar}
          theme={THEME}
          firstDay={1}
          hideExtraDays={true}
          markedDates={getMarkedDates()}
          onDayPress={handleDayPress}
          enableSwipeMonths={true}
          monthFormat={"yyyy년 MM월"}
          dayComponent={({ date, state, marking }) => {
            if (state === "disabled") return <View />;

            const dayDate = new Date(date.timestamp);
            const dayOfWeek = dayDate.getDay();
            const holidayName = getHolidayName(date.dateString);

            const textStyle = [
              styles.dayText,
              (dayOfWeek === 0 || holidayName) && { color: "#f44336" },
              dayOfWeek === 6 && { color: "#9C27B0" },
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
                {holidayName && (
                  <Text
                    style={[
                      styles.holidayText,
                      { color: marking?.selected ? "white" : "#f44336" },
                    ]}
                    numberOfLines={1}
                  >
                    {holidayName}
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
          }}
        />
      </View>

      {/* 일정 표시 영역 */}
      {renderSchedules()}

      {/* 단일 모달 컨테이너 */}
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
            <Animated.View
              style={[
                styles.modalContent,
                styles.enhancedModalContent,
                {
                  opacity: modalFadeAnim,
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {renderModalContent()}
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME_COLORS.dark,
  },

  // 기본 컨테이너 및 레이아웃
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  calendarContainer: {
    zIndex: 1,
    overflow: "visible",
    paddingBottom: 10,
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

  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
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
  deleteButton: {
    backgroundColor: THEME_COLORS.danger,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: THEME_COLORS.primary,
  },
  applyButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  // 캘린더 스타일
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

  // 일정 컨테이너 스타일
  scheduleContainer: {
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT - 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden", // 추가: 내부 컨텐츠가 바깥으로 넘치지 않게 함
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
    zIndex: 20,
  },
  dragHandleArea: {
    height: 36,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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

  // 일정 헤더 스타일
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
  headerActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  cancelSelectionButton: {
    backgroundColor: THEME_COLORS.light,
  },
  deleteSelectionButton: {
    backgroundColor: THEME_COLORS.danger,
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  headerActionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledButtonText: {
    color: "#fff",
  },

  // 일정 목록 스타일
  scheduleList: {
    flex: 1,
    width: "100%",
  },
  scheduleListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    flex: 1, // 너비 확보
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
  scheduleItemSelecting: {
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  scheduleItemSelected: {
    borderColor: THEME_COLORS.primary,
    borderWidth: 1,
    backgroundColor: `${THEME_COLORS.primary}10`,
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
    color: "#495057",
    lineHeight: 20,
  },

  // 체크박스 스타일
  checkboxContainer: {
    marginRight: 10,
    padding: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME_COLORS.gray,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: THEME_COLORS.primary,
    borderColor: THEME_COLORS.primary,
  },
  checkboxCheck: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // 빈 일정 스타일
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
    width: "90%", // 너비 추가
    alignSelf: "center", // 자기 자신을 중앙에 배치
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME_COLORS.dark,
    marginBottom: 8,
  },
  noScheduleSubText: {
    fontSize: 14,
    color: THEME_COLORS.gray,
    marginBottom: 20,
  },
  emptyAddButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 12,
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
  emptyAddButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "stretch",
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  enhancedModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
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

  // 모달 버튼 스타일
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
    color: "#495057",
  },

  // 모달 버튼 테마 스타일
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

  // 비활성화 스타일
  disabledButton: {
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#aaaaaa",
  },

  // 빈 커스텀 스타일
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

  selectionActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    alignItems: "flex-end",
  },
  selectionActionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
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
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineActionButtons: {
    flexDirection: "row",
    marginLeft: 8,
    gap: 6,
  },
});
