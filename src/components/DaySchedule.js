import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { usePlanner } from "../context/PlannerContext";
import AddScheduleModal from "./AddScheduleModal";
import { BackHandler } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// 상수 유지
const DAYS = [
  {
    key: "monday",
    label: "월요일",
    engLabel: "MON",
    color: "#4284F3",
    lightColor: "#E8F1FE",
  },
  {
    key: "tuesday",
    label: "화요일",
    engLabel: "TUE",
    color: "#50CEBB",
    lightColor: "#E6F7F5",
  },
  {
    key: "wednesday",
    label: "수요일",
    engLabel: "WED",
    color: "#9C27B0",
    lightColor: "#F3E5F5",
  },
  {
    key: "thursday",
    label: "목요일",
    engLabel: "THU",
    color: "#FF7043",
    lightColor: "#FFF3EF",
  },
  {
    key: "friday",
    label: "금요일",
    engLabel: "FRI",
    color: "#34A853",
    lightColor: "#E8F5E9",
  },
  {
    key: "saturday",
    label: "토요일",
    engLabel: "SAT",
    color: "#4A90E2",
    lightColor: "#E3F2FD",
  },
  {
    key: "sunday",
    label: "일요일",
    engLabel: "SUN",
    color: "#EA4335",
    lightColor: "#FCE8E6",
  },
];

export default function DaySchedule() {
  // 기존 상태 관리 코드는 그대로 유지
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { dailySchedules, saveDailyScheduleOnly } = usePlanner();
  const [deletedDay, setDeletedDay] = useState(null);

  const [isCopyMode, setIsCopyMode] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [sourceDaySchedule, setSourceDaySchedule] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [isCheckMode, setIsCheckMode] = useState(false);
  const [checkedSchedules, setCheckedSchedules] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [showCheckModeInDaysList, setShowCheckModeInDaysList] = useState(false);
  const [multiSelectDays, setMultiSelectDays] = useState([]);

  // 기존 기능들 유지
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showModal) {
          setShowModal(false);
          return true;
        }
        if (isCheckMode) {
          setIsCheckMode(false);
          setCheckedSchedules([]);
          return true;
        }
        if (selectedDay) {
          setSelectedDay(null);
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [showModal, selectedDay, isCheckMode])
  );

  // saveDailySchedule 함수를 대체하는 함수 생성
  const saveDailySchedule = async (updatedSchedules) => {
    try {
      // PlannerContext에서 받은 saveDailyScheduleOnly 함수 사용
      await saveDailyScheduleOnly(updatedSchedules);
      return true;
    } catch (error) {
      console.error("Save schedule error:", error);
      Alert.alert("오류", "일정 저장 중 오류가 발생했습니다.");
      return false;
    }
  };

  const startCopyMode = () => {
    setIsCopyMode(true);
    setSelectedDays([]);
  };

  const toggleCheckMode = () => {
    if (isCheckMode) {
      setIsCheckMode(false);
      setCheckedSchedules([]);
      setSelectAllChecked(false);
    } else {
      setIsCheckMode(true);
    }
  };

  const toggleCheckModeInDaysList = () => {
    setShowCheckModeInDaysList((prev) => !prev);
    // 체크 모드 진입/해제 시 다중 선택 상태 초기화
    setMultiSelectDays([]);
  };

  const toggleSelectAll = () => {
    if (selectAllChecked) {
      setSelectAllChecked(false);
      setCheckedSchedules([]);
    } else {
      setSelectAllChecked(true);
      const allScheduleIds =
        dailySchedules[selectedDay]?.map((schedule) => schedule.id) || [];
      setCheckedSchedules(allScheduleIds);
    }
  };

  const toggleScheduleCheck = (scheduleId) => {
    setCheckedSchedules((prev) => {
      if (prev.includes(scheduleId)) {
        return prev.filter((id) => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  // 다중 요일 선택/해제 토글 함수
  const toggleDayMultiSelect = (dayKey) => {
    setMultiSelectDays((prev) => {
      if (prev.includes(dayKey)) {
        return prev.filter((key) => key !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  // 다중 선택된 요일의 일정 모두 삭제
  const deleteMultiDaysSchedules = async () => {
    if (multiSelectDays.length === 0) {
      Alert.alert("알림", "삭제할 요일을 선택해주세요.");
      return;
    }

    const totalSchedulesCount = multiSelectDays.reduce(
      (total, dayKey) => total + (dailySchedules[dayKey]?.length || 0),
      0
    );

    if (totalSchedulesCount === 0) {
      Alert.alert("알림", "선택한 요일에 삭제할 일정이 없습니다.");
      return;
    }

    Alert.alert(
      "다중 요일 일정 삭제",
      `선택한 ${multiSelectDays.length}개 요일의 모든 일정(총 ${totalSchedulesCount}개)을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedSchedules = { ...dailySchedules };
              multiSelectDays.forEach((dayKey) => {
                updatedSchedules[dayKey] = [];
              });

              await saveDailySchedule(updatedSchedules);
              setMultiSelectDays([]);
              setShowCheckModeInDaysList(false);
              Alert.alert(
                "완료",
                `${multiSelectDays.length}개 요일의 모든 일정이 삭제되었습니다.`
              );
            } catch (error) {
              console.error("Multi-delete error:", error);
              Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const deleteCheckedSchedules = async () => {
    if (checkedSchedules.length === 0) {
      Alert.alert("알림", "삭제할 일정을 선택해주세요.");
      return;
    }

    Alert.alert(
      "일정 삭제",
      `선택한 ${checkedSchedules.length}개의 일정을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedSchedules = { ...dailySchedules };
              updatedSchedules[selectedDay] = dailySchedules[
                selectedDay
              ].filter((schedule) => !checkedSchedules.includes(schedule.id));
              await saveDailySchedule(updatedSchedules);
              setCheckedSchedules([]);
              setSelectAllChecked(false);
              setIsCheckMode(false);
              Alert.alert("완료", "선택한 일정이 삭제되었습니다.");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const deleteAllSchedulesForDay = async (dayKey) => {
    if (!dailySchedules[dayKey] || dailySchedules[dayKey].length === 0) {
      Alert.alert("알림", "삭제할 일정이 없습니다.");
      return;
    }

    Alert.alert(
      "요일 일정 삭제",
      `${DAYS.find((d) => d.key === dayKey)?.label}의 모든 일정(${
        dailySchedules[dayKey].length
      }개)을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedSchedules = { ...dailySchedules };
              updatedSchedules[dayKey] = [];
              await saveDailySchedule(updatedSchedules);
              Alert.alert("완료", "선택한 요일의 모든 일정이 삭제되었습니다.");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const handleDaySelect = (day) => {
    if (isCopyMode && !isPasteMode) {
      Alert.alert("일정 복사", `${day.label}의 일정을 복사하시겠습니까?`, [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: () => {
            setSourceDaySchedule({
              key: day.key,
              schedules: dailySchedules[day.key] || [],
            });
            setIsCopyMode(false);
            setIsPasteMode(true);
          },
        },
      ]);
    } else if (isPasteMode) {
      setSelectedDays((prev) => {
        const isSelected = prev.includes(day.key);
        if (isSelected) {
          return prev.filter((key) => key !== day.key);
        } else {
          return [...prev, day.key];
        }
      });
    }
  };

  const handlePasteComplete = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("알림", "붙여넣기할 요일을 선택해주세요.");
      return;
    }

    const newSchedules = { ...dailySchedules };
    selectedDays.forEach((dayKey) => {
      // 기존 일정이 있는 경우, 복사본은 새로운 ID를 가져야 함
      const copiedSchedules = sourceDaySchedule.schedules.map((schedule) => ({
        ...schedule,
        id: `${dayKey}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }));
      newSchedules[dayKey] = copiedSchedules;
    });

    try {
      await saveDailySchedule(newSchedules);
      setIsPasteMode(false);
      setSelectedDays([]);
      setSourceDaySchedule(null);
      Alert.alert("완료", "선택한 요일에 일정이 복사되었습니다.");
    } catch (error) {
      console.error("Paste error:", error);
      Alert.alert("오류", "일정 복사 중 오류가 발생했습니다.");
    }
  };

  // 요일 카드 렌더링 함수
  // renderDayCard 함수 수정 - 삭제 버튼 위치 조정 및 레이아웃 개선
  const renderDayCard = (day) => (
    <TouchableOpacity
      key={day.key}
      style={[
        styles.dayCard,
        selectedDay === day.key && styles.selectedDayCard,
        selectedDays.includes(day.key) && styles.checkedDayCard,
        showCheckModeInDaysList &&
          multiSelectDays.includes(day.key) &&
          styles.multiSelectedDayCard,
      ]}
      onPress={() => {
        if (isCopyMode || isPasteMode) {
          handleDaySelect(day);
        } else if (showCheckModeInDaysList) {
          // 삭제 모드에서는 요일 다중 선택 가능
          toggleDayMultiSelect(day.key);
        } else {
          setSelectedDay(day.key);
        }
      }}
      onLongPress={() => {
        if (!isCopyMode && !isPasteMode && !showCheckModeInDaysList) {
          Alert.alert(
            "요일 일정 관리",
            `${day.label} 일정을 어떻게 관리하시겠습니까?`,
            [
              {
                text: "전체 삭제",
                style: "destructive",
                onPress: () => deleteAllSchedulesForDay(day.key),
              },
              { text: "취소", style: "cancel" },
            ]
          );
        }
      }}
    >
      <View style={styles.dayContent}>
        <View style={styles.dayInfo}>
          <Text
            style={[
              styles.engLabel,
              selectedDay === day.key && styles.selectedEngLabel,
              { color: day.color },
            ]}
          >
            {day.engLabel}
          </Text>
          <View style={styles.labelContainer}>
            <Text
              style={[
                styles.dayLabel,
                selectedDay === day.key && styles.selectedDayLabel,
              ]}
            >
              {day.label}
            </Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          {/* 삭제 모드에서 체크박스 표시 */}
          {showCheckModeInDaysList ? (
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  { borderColor: day.color },
                  multiSelectDays.includes(day.key) && {
                    backgroundColor: day.color,
                  },
                ]}
                onPress={() => toggleDayMultiSelect(day.key)}
              >
                {multiSelectDays.includes(day.key) && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.scheduleCountBadge,
                { backgroundColor: day.color + "20" },
              ]}
            >
              <Text style={[styles.scheduleCountText, { color: day.color }]}>
                {dailySchedules[day.key]?.length || 0}개의 일정
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // 일정 목록 화면 렌더링 함수 - 디자인 개선
  const renderScheduleList = () => {
    if (!selectedDay) return null;

    const schedules = dailySchedules[selectedDay] || [];
    const currentDay = DAYS.find((d) => d.key === selectedDay);

    return (
      <View style={styles.scheduleContainer}>
        {/* 헤더 디자인 개선 */}
        <View
          style={[
            styles.scheduleHeader,
            { borderBottomColor: currentDay.color + "30" },
          ]}
        >
          <View style={styles.scheduleTitleContainer}>
            <Text style={[styles.scheduleTitle, { color: currentDay.color }]}>
              {currentDay.label} 일정
            </Text>
            <Text style={styles.scheduleSubtitle}>
              {schedules.length > 0
                ? `${schedules.length}개의 일정이 있습니다`
                : "등록된 일정이 없습니다"}
            </Text>
          </View>

          {/* 체크 모드 토글 버튼 */}
          {schedules.length > 0 && (
            <TouchableOpacity
              style={[
                styles.checkModeButton,
                isCheckMode && {
                  backgroundColor: currentDay.color, // 여기서 직접 요일별 색상 적용
                },
              ]}
              onPress={toggleCheckMode}
            >
              <Text
                style={[
                  styles.checkModeButtonText,
                  isCheckMode && styles.checkModeButtonTextActive,
                ]}
              >
                {isCheckMode ? "선택 완료" : "일정 선택"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 체크 모드 컨트롤 */}
        {isCheckMode && schedules.length > 0 && (
          <View
            style={[
              styles.checkModeControls,
              { borderBottomColor: currentDay.color + "20" },
            ]}
          >
            <View style={styles.selectAllContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  { borderColor: currentDay.color },
                  selectAllChecked && {
                    backgroundColor: currentDay.color,
                  },
                ]}
                onPress={toggleSelectAll}
              >
                {selectAllChecked && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.selectAllText}>전체 선택</Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <Text style={styles.checkedCountText}>
                {checkedSchedules.length}개 선택됨
              </Text>

              {checkedSchedules.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteCheckedButton}
                  onPress={deleteCheckedSchedules}
                >
                  <Text style={styles.deleteCheckedButtonText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 일정 목록 */}
        {schedules.length > 0 ? (
          <ScrollView style={styles.scheduleList}>
            {schedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.scheduleItem,
                  { borderLeftColor: currentDay.color },
                  isCheckMode &&
                    checkedSchedules.includes(schedule.id) && [
                      styles.scheduleItemChecked,
                      { borderLeftColor: currentDay.color },
                    ],
                ]}
                onPress={() => {
                  if (isCheckMode) {
                    toggleScheduleCheck(schedule.id);
                  }
                }}
                onLongPress={() => {
                  if (!isCheckMode) {
                    Alert.alert(
                      "일정 관리",
                      "일정을 어떻게 관리하시겠습니까?",
                      [
                        {
                          text: "수정",
                          onPress: () => {
                            setEditingSchedule(schedule);
                            setShowModal(true);
                          },
                        },
                        {
                          text: "삭제",
                          style: "destructive",
                          onPress: () => {
                            Alert.alert(
                              "일정 삭제",
                              "이 일정을 삭제하시겠습니까?",
                              [
                                { text: "취소", style: "cancel" },
                                {
                                  text: "삭제",
                                  style: "destructive",
                                  onPress: async () => {
                                    const updatedSchedules = {
                                      ...dailySchedules,
                                      [selectedDay]: dailySchedules[
                                        selectedDay
                                      ].filter((s) => s.id !== schedule.id),
                                    };
                                    await saveDailySchedule(updatedSchedules);
                                  },
                                },
                              ]
                            );
                          },
                        },
                        { text: "취소", style: "cancel" },
                      ]
                    );
                  }
                }}
              >
                {/* 체크박스 */}
                {isCheckMode && (
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        { borderColor: currentDay.color },
                        checkedSchedules.includes(schedule.id) && {
                          backgroundColor: currentDay.color,
                        },
                      ]}
                      onPress={() => toggleScheduleCheck(schedule.id)}
                    >
                      {checkedSchedules.includes(schedule.id) && (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* 시간 정보 */}
                <View style={styles.scheduleTimeContainer}>
                  <Text
                    style={[styles.scheduleTime, { color: currentDay.color }]}
                  >
                    {schedule.startTime}
                  </Text>
                  <Text style={styles.scheduleTimeDivider}>~</Text>
                  <Text
                    style={[styles.scheduleTime, { color: currentDay.color }]}
                  >
                    {schedule.endTime}
                  </Text>
                </View>

                {/* 일정 내용 */}
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTask}>{schedule.task}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyScheduleContainer}>
            <Text style={styles.emptyScheduleText}>등록된 일정이 없습니다</Text>
            <Text style={styles.emptyScheduleSubText}>
              아래 버튼을 눌러 새 일정을 추가해보세요
            </Text>
          </View>
        )}

        {/* 새 일정 추가 버튼 */}
        {!isCheckMode && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: currentDay.color }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addButtonText}>+ 새 일정 추가</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 메인 렌더링
  // 현재 선택된 요일의 색상 가져오기
  const getCurrentColor = () => {
    if (!selectedDay) return "#50CEBB";
    const currentDay = DAYS.find((day) => day.key === selectedDay);
    return currentDay ? currentDay.color : "#50CEBB";
  };

  return (
    <View style={styles.container}>
      {/* 그라데이션 헤더 */}
      <LinearGradient
        colors={
          selectedDay
            ? [getCurrentColor(), shadeColor(getCurrentColor(), -10)]
            : ["#50CEBB", "#3bb2a0"]
        }
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>
          {selectedDay
            ? DAYS.find((day) => day.key === selectedDay)?.label + " 일정"
            : "요일별 커스텀"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {selectedDay
            ? "요일별 세부 일정을 관리합니다"
            : "월요일부터 일요일까지 개별 설정"}
        </Text>
      </LinearGradient>

      {/* 컨텐츠 컨테이너 */}
      <View style={styles.contentContainer}>
        {!selectedDay ? (
          // 요일 선택 화면
          <>
            {/* 복사/삭제 모드 컨트롤 */}
            <View style={styles.headerControlsRow}>
              {/* 복사 버튼 (왼쪽에 배치) */}
              <TouchableOpacity
                style={[
                  styles.copyButton,
                  isCopyMode && { backgroundColor: DAYS[0].lightColor },
                  isPasteMode && { backgroundColor: DAYS[1].lightColor },
                ]}
                onPress={startCopyMode}
              >
                <Text
                  style={[
                    styles.copyButtonText,
                    (isCopyMode || isPasteMode) && { color: "#333333" },
                  ]}
                >
                  {isCopyMode
                    ? "복사할 요일을 선택해 주세요"
                    : isPasteMode
                    ? "붙여넣기할 요일을 선택해 주세요"
                    : "요일 일정 복사"}
                </Text>
              </TouchableOpacity>

              {/* 체크 모드 버튼 (오른쪽에 배치) */}
              <TouchableOpacity
                style={[
                  styles.checkListButton,
                  showCheckModeInDaysList && { backgroundColor: "#FA5252" },
                ]}
                onPress={toggleCheckModeInDaysList}
              >
                <Text
                  style={[
                    styles.checkListButtonText,
                    showCheckModeInDaysList && styles.checkListButtonTextActive,
                  ]}
                >
                  {showCheckModeInDaysList ? "선택 완료" : "삭제 모드"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 요일 목록 */}
            <ScrollView
              style={styles.dayList}
              contentContainerStyle={styles.dayListContent}
            >
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayCard,
                    selectedDay === day.key && styles.selectedDayCard,
                    selectedDays.includes(day.key) && styles.checkedDayCard,
                    showCheckModeInDaysList &&
                      multiSelectDays.includes(day.key) &&
                      styles.multiSelectedDayCard,
                  ]}
                  onPress={() => {
                    if (isCopyMode || isPasteMode) {
                      handleDaySelect(day);
                    } else if (showCheckModeInDaysList) {
                      toggleDayMultiSelect(day.key);
                    } else {
                      setSelectedDay(day.key);
                    }
                  }}
                  onLongPress={() => {
                    if (
                      !isCopyMode &&
                      !isPasteMode &&
                      !showCheckModeInDaysList
                    ) {
                      Alert.alert(
                        "요일 일정 관리",
                        `${day.label} 일정을 어떻게 관리하시겠습니까?`,
                        [
                          {
                            text: "전체 삭제",
                            style: "destructive",
                            onPress: () => deleteAllSchedulesForDay(day.key),
                          },
                          { text: "취소", style: "cancel" },
                        ]
                      );
                    }
                  }}
                >
                  <View style={styles.dayContent}>
                    <View style={styles.dayInfo}>
                      <Text
                        style={[
                          styles.engLabel,
                          selectedDay === day.key && styles.selectedEngLabel,
                          { color: day.color },
                        ]}
                      >
                        {day.engLabel}
                      </Text>
                      <View style={styles.labelContainer}>
                        <Text
                          style={[
                            styles.dayLabel,
                            selectedDay === day.key && styles.selectedDayLabel,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rightContainer}>
                      {/* 삭제 모드에서 체크박스 표시 */}
                      {showCheckModeInDaysList ? (
                        <View style={styles.checkboxContainer}>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              { borderColor: day.color },
                              multiSelectDays.includes(day.key) && {
                                backgroundColor: day.color,
                              },
                            ]}
                            onPress={() => toggleDayMultiSelect(day.key)}
                          >
                            {multiSelectDays.includes(day.key) && (
                              <Text style={styles.checkboxCheck}>✓</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.scheduleCountBadge,
                            { backgroundColor: day.color + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scheduleCountText,
                              { color: day.color },
                            ]}
                          >
                            {dailySchedules[day.key]?.length || 0}개의 일정
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 복사/붙여넣기 완료 버튼 */}
            {isPasteMode && (
              <TouchableOpacity
                style={styles.pasteCompleteButton}
                onPress={handlePasteComplete}
              >
                <Text style={styles.pasteCompleteButtonText}>
                  붙여넣기 완료 ({selectedDays.length}개 선택됨)
                </Text>
              </TouchableOpacity>
            )}

            {/* 삭제 모드에서 선택 요일 삭제 버튼 */}
            {showCheckModeInDaysList && multiSelectDays.length > 0 && (
              <TouchableOpacity
                style={styles.deleteMultiButton}
                onPress={deleteMultiDaysSchedules}
              >
                <Text style={styles.deleteMultiButtonText}>
                  {multiSelectDays.length}개 요일 일정 삭제
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          // 일정 상세 화면
          <>
            {/* 일정 목록 헤더 */}
            <View
              style={[
                styles.scheduleHeader,
                { borderBottomColor: getCurrentColor() + "30" },
              ]}
            >
              <View style={styles.scheduleTitleContainer}>
                <Text
                  style={[styles.scheduleTitle, { color: getCurrentColor() }]}
                >
                  {DAYS.find((d) => d.key === selectedDay)?.label} 일정
                </Text>
                <Text style={styles.scheduleSubtitle}>
                  {dailySchedules[selectedDay]?.length > 0
                    ? `${dailySchedules[selectedDay]?.length}개의 일정이 있습니다`
                    : "등록된 일정이 없습니다"}
                </Text>
              </View>

              {/* 체크 모드 토글 버튼 */}
              {dailySchedules[selectedDay]?.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.checkModeButton,
                    isCheckMode && {
                      backgroundColor: getCurrentColor(),
                    },
                  ]}
                  onPress={toggleCheckMode}
                >
                  <Text
                    style={[
                      styles.checkModeButtonText,
                      isCheckMode && styles.checkModeButtonTextActive,
                    ]}
                  >
                    {isCheckMode ? "선택 완료" : "일정 선택"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 체크 모드 컨트롤 */}
            {isCheckMode && dailySchedules[selectedDay]?.length > 0 && (
              <View
                style={[
                  styles.checkModeControls,
                  { borderBottomColor: getCurrentColor() + "20" },
                ]}
              >
                <View style={styles.selectAllContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: getCurrentColor() },
                      selectAllChecked && {
                        backgroundColor: getCurrentColor(),
                      },
                    ]}
                    onPress={toggleSelectAll}
                  >
                    {selectAllChecked && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.selectAllText}>전체 선택</Text>
                </View>

                <View style={styles.actionButtonsContainer}>
                  <Text style={styles.checkedCountText}>
                    {checkedSchedules.length}개 선택됨
                  </Text>

                  {checkedSchedules.length > 0 && (
                    <TouchableOpacity
                      style={styles.deleteCheckedButton}
                      onPress={deleteCheckedSchedules}
                    >
                      <Text style={styles.deleteCheckedButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 일정 목록 */}
            {dailySchedules[selectedDay]?.length > 0 ? (
              <ScrollView style={styles.scheduleList}>
                {dailySchedules[selectedDay].map((schedule) => (
                  <TouchableOpacity
                    key={schedule.id}
                    style={[
                      styles.scheduleItem,
                      { borderLeftColor: getCurrentColor() },
                      isCheckMode &&
                        checkedSchedules.includes(schedule.id) && [
                          styles.scheduleItemChecked,
                          { borderLeftColor: getCurrentColor() },
                        ],
                    ]}
                    onPress={() => {
                      if (isCheckMode) {
                        toggleScheduleCheck(schedule.id);
                      }
                    }}
                    onLongPress={() => {
                      if (!isCheckMode) {
                        Alert.alert(
                          "일정 관리",
                          "일정을 어떻게 관리하시겠습니까?",
                          [
                            {
                              text: "수정",
                              onPress: () => {
                                setEditingSchedule(schedule);
                                setShowModal(true);
                              },
                            },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: () => {
                                Alert.alert(
                                  "일정 삭제",
                                  "이 일정을 삭제하시겠습니까?",
                                  [
                                    { text: "취소", style: "cancel" },
                                    {
                                      text: "삭제",
                                      style: "destructive",
                                      onPress: async () => {
                                        const updatedSchedules = {
                                          ...dailySchedules,
                                          [selectedDay]: dailySchedules[
                                            selectedDay
                                          ].filter((s) => s.id !== schedule.id),
                                        };
                                        await saveDailyScheduleOnly(
                                          updatedSchedules
                                        );
                                      },
                                    },
                                  ]
                                );
                              },
                            },
                            { text: "취소", style: "cancel" },
                          ]
                        );
                      }
                    }}
                  >
                    {/* 체크박스 */}
                    {isCheckMode && (
                      <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                          style={[
                            styles.checkbox,
                            { borderColor: getCurrentColor() },
                            checkedSchedules.includes(schedule.id) && {
                              backgroundColor: getCurrentColor(),
                            },
                          ]}
                          onPress={() => toggleScheduleCheck(schedule.id)}
                        >
                          {checkedSchedules.includes(schedule.id) && (
                            <Text style={styles.checkboxCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* 시간 정보 */}
                    <View style={styles.scheduleTimeContainer}>
                      <Text
                        style={[
                          styles.scheduleTime,
                          { color: getCurrentColor() },
                        ]}
                      >
                        {schedule.startTime}
                      </Text>
                      <Text style={styles.scheduleTimeDivider}>~</Text>
                      <Text
                        style={[
                          styles.scheduleTime,
                          { color: getCurrentColor() },
                        ]}
                      >
                        {schedule.endTime}
                      </Text>
                    </View>

                    {/* 일정 내용 */}
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleTask}>{schedule.task}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyScheduleContainer}>
                <Text style={styles.emptyScheduleText}>
                  등록된 일정이 없습니다
                </Text>
                <Text style={styles.emptyScheduleSubText}>
                  아래 버튼을 눌러 새 일정을 추가해보세요
                </Text>
              </View>
            )}

            {/* 새 일정 추가 버튼 */}
            {!isCheckMode && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: getCurrentColor() },
                ]}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.addButtonText}>+ 새 일정 추가</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* 삭제 알림 배너 */}
      {deletedDay && (
        <View style={styles.deleteBanner}>
          <Text style={styles.deleteBannerText}>
            {deletedDay} 일정이 모두 삭제되었습니다.
          </Text>
        </View>
      )}

      {/* 일정 추가/수정 모달 */}
      <AddScheduleModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSchedule(null);
        }}
        editingSchedule={editingSchedule}
        onSave={async (newSchedule) => {
          try {
            const currentSchedules = { ...dailySchedules };
            if (editingSchedule) {
              // 수정 모드
              currentSchedules[selectedDay] = currentSchedules[selectedDay].map(
                (schedule) =>
                  schedule.id === editingSchedule.id
                    ? { ...newSchedule, id: schedule.id }
                    : schedule
              );
            } else {
              // 새 일정 추가
              const scheduleWithId = {
                ...newSchedule,
                id: `${selectedDay}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              };
              currentSchedules[selectedDay] = [
                ...(currentSchedules[selectedDay] || []),
                scheduleWithId,
              ];
            }
            await saveDailyScheduleOnly(currentSchedules);
            setShowModal(false);
            setEditingSchedule(null);
            return true;
          } catch (error) {
            console.error("Schedule save error:", error);
            return false;
          }
        }}
      />
    </View>
  );
}

// 색상 밝기 조절 함수 (10% 어둡게 하기 위함)
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = Math.max(0, R).toString(16);
  G = Math.max(0, G).toString(16);
  B = Math.max(0, B).toString(16);

  const RR = R.length === 1 ? "0" + R : R;
  const GG = G.length === 1 ? "0" + G : G;
  const BB = B.length === 1 ? "0" + B : B;

  return "#" + RR + GG + BB;
}

// 공통 스타일 적용
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // 헤더 공통 스타일
  gradientHeader: {
    paddingTop: Platform.OS === "ios" ? 45 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    paddingBottom: 12,
  },
  // 컨텐츠 컨테이너
  contentContainer: {
    flex: 1,
    marginTop: -20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // 헤더 컨트롤 행
  headerControlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: "100%",
  },
  // 복사 버튼
  copyButton: {
    backgroundColor: "#F1F3F5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
    flex: 1,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  copyButtonText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  // 체크 모드 버튼
  checkListButton: {
    backgroundColor: "#F1F3F5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkListButtonText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  checkListButtonTextActive: {
    color: "#FFFFFF",
  },
  // 요일 목록
  dayList: {
    flex: 1,
    paddingTop: 0,
  },
  dayListContent: {
    padding: 16,
    gap: 20,
  },
  // 요일 카드
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedDayCard: {
    backgroundColor: "#50cebb",
    transform: [{ scale: 1.02 }],
  },
  checkedDayCard: {
    backgroundColor: "#E3FAFF",
    borderColor: "#50cebb",
    borderWidth: 2,
  },
  multiSelectedDayCard: {
    backgroundColor: "#E3FAFF",
    borderColor: "#FA5252",
    borderWidth: 2,
  },
  dayContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  labelContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  engLabel: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    width: 70,
    opacity: 0.7,
  },
  selectedEngLabel: {
    color: "#fff",
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: "600",
    alignItems: "center",
    color: "#666666",
    marginLeft: 2,
    marginBottom: 6,
  },
  selectedDayLabel: {
    color: "#fff",
  },
  // 일정 개수 배지
  scheduleCountBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleCountText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  // 붙여넣기 완료 버튼
  pasteCompleteButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pasteCompleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  // 다중 요일 삭제 버튼
  deleteMultiButton: {
    backgroundColor: "#FA5252",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  deleteMultiButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  // 일정 헤더
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
  },
  scheduleTitleContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    opacity: 0.9,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  // 체크 모드 버튼
  checkModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#F1F3F5",
    borderRadius: 8,
    marginLeft: 8,
  },
  checkModeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
  },
  checkModeButtonTextActive: {
    color: "#fff",
  },
  // 체크 모드 컨트롤
  checkModeControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxCheck: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginLeft: 8,
  },
  // 액션 버튼 컨테이너
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkedCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  // 삭제 버튼
  deleteCheckedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FA5252",
    borderRadius: 6,
  },
  deleteCheckedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  // 체크박스 컨테이너
  checkboxContainer: {
    justifyContent: "center",
    marginRight: 12,
  },
  // 일정 목록
  scheduleList: {
    flex: 1,
    padding: 12,
  },
  // 일정 항목
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    maxWidth: 500,
    alignSelf: "center",
    width: "96%",
    borderLeftWidth: 4,
    paddingVertical: 5,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  scheduleItemChecked: {
    backgroundColor: "#F5F9FF",
    borderLeftWidth: 4,
  },
  // 시간 컨테이너
  scheduleTimeContainer: {
    alignItems: "center",
    marginRight: 16,
    width: 54,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
  scheduleTimeDivider: {
    fontSize: 12,
    color: "#999",
    marginVertical: 2,
  },
  scheduleContent: {
    flex: 1,
    justifyContent: "center",
  },
  scheduleTask: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  // 빈 일정 컨테이너
  emptyScheduleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyScheduleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptyScheduleSubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  // 추가 버튼
  addButton: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 80,
    alignItems: "center",
    backgroundColor: "#50cebb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // 삭제 알림 배너
  deleteBanner: {
    backgroundColor: "#ff0000",
    padding: 12,
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  deleteBannerText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
