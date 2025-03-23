import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { usePlanner } from "../context/PlannerContext";
import AddScheduleModal from "./AddScheduleModal";
import { BackHandler } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native";

// Colors for the custom schedules
const CUSTOM_COLORS = [
  { color: "#4284F3", lightColor: "#E8F1FE" },
  { color: "#50CEBB", lightColor: "#E6F7F5" },
  { color: "#9C27B0", lightColor: "#F3E5F5" },
  { color: "#FF7043", lightColor: "#FFF3EF" },
  { color: "#34A853", lightColor: "#E8F5E9" },
  { color: "#4A90E2", lightColor: "#E3F2FD" },
  { color: "#EA4335", lightColor: "#FCE8E6" },
];

export default function ConsumerCustom() {
  // State for managing screens
  const [isDetailScreen, setIsDetailScreen] = useState(false);
  const [selectedCustomSchedule, setSelectedCustomSchedule] = useState(null);

  // State for custom schedules
  const [showModal, setShowModal] = useState(false);
  const {
    customSchedules = [],
    saveCustomSchedulesOnly: saveCustomSchedulesOnly,
  } = usePlanner();
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [checkedSchedules, setCheckedSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [isNaming, setIsNaming] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showModal) {
          setShowModal(false);
          return true;
        }
        if (isNaming) {
          setIsNaming(false);
          return true;
        }
        if (isCheckMode) {
          setIsCheckMode(false);
          setCheckedSchedules([]);
          return true;
        }
        if (isDetailScreen) {
          setIsDetailScreen(false);
          setSelectedCustomSchedule(null);
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [showModal, isDetailScreen, isCheckMode, isNaming])
  );

  // Save custom schedule function
  const saveCustomSchedule = async (updatedSchedules) => {
    try {
      if (typeof saveCustomSchedulesOnly !== "function") {
        console.error("saveCustomSchedulesOnly is not a function");
        Alert.alert(
          "오류",
          "PlannerContext에서 saveCustomSchedulesOnly 함수를 사용할 수 없습니다."
        );
        return false;
      }
      await saveCustomSchedulesOnly(updatedSchedules);
      return true;
    } catch (error) {
      console.error("Save custom schedule error:", error);
      Alert.alert("오류", "일정 저장 중 오류가 발생했습니다.");
      return false;
    }
  };

  // Toggle check mode
  const toggleCheckMode = () => {
    if (isCheckMode) {
      setIsCheckMode(false);
      setCheckedSchedules([]);
    } else {
      setIsCheckMode(true);
    }
  };

  // Toggle schedule check
  const toggleScheduleCheck = (scheduleId) => {
    setCheckedSchedules((prev) => {
      if (prev.includes(scheduleId)) {
        return prev.filter((id) => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  // Delete checked schedules
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
              if (isDetailScreen) {
                // If in detail screen, delete time slots
                const updatedCustomSchedules = [...customSchedules];
                const scheduleIndex = updatedCustomSchedules.findIndex(
                  (schedule) => schedule.id === selectedCustomSchedule?.id
                );

                if (scheduleIndex !== -1) {
                  updatedCustomSchedules[scheduleIndex].timeSlots =
                    updatedCustomSchedules[scheduleIndex].timeSlots.filter(
                      (slot) => !checkedSchedules.includes(slot.id)
                    );

                  // 현재 선택된 스케줄도 업데이트
                  const updatedSelectedSchedule = {
                    ...selectedCustomSchedule,
                    timeSlots: updatedCustomSchedules[scheduleIndex].timeSlots,
                  };
                  setSelectedCustomSchedule(updatedSelectedSchedule);

                  await saveCustomSchedule(updatedCustomSchedules);
                  setCheckedSchedules([]);
                  setIsCheckMode(false);
                  Alert.alert("완료", "선택한 일정이 삭제되었습니다.");
                }
              } else {
                // If in main screen, delete entire custom schedules
                const updatedCustomSchedules = customSchedules.filter(
                  (schedule) => !checkedSchedules.includes(schedule.id)
                );

                await saveCustomSchedule(updatedCustomSchedules);
                setCheckedSchedules([]);
                setIsCheckMode(false);
                Alert.alert("완료", "선택한 일정이 삭제되었습니다.");
              }
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };
  const handleCreateNewSchedule = () => {
    if (customSchedules.length >= 30) {
      Alert.alert("알림", "최대 30개의 커스텀 일정만 생성할 수 있습니다.");
      return;
    }

    // 현재 사용 중인 색상들 찾기
    const usedColors = customSchedules.map((schedule) => schedule.color);

    // 사용되지 않은 색상 찾기
    const availableColors = CUSTOM_COLORS.filter(
      (color) => !usedColors.includes(color.color)
    );

    // 사용되지 않은 색상이 있으면 그 중에서 선택, 없으면 랜덤 선택
    let selectedColor;
    if (availableColors.length > 0) {
      selectedColor = availableColors[0].color;
    } else {
      // 모든 색상이 사용 중이면 랜덤 선택
      const randomIndex = Math.floor(Math.random() * CUSTOM_COLORS.length);
      selectedColor = CUSTOM_COLORS[randomIndex].color;
    }

    setIsDetailScreen(true);
    setSelectedCustomSchedule({
      id: `custom-${Date.now()}`,
      name: "새 일정",
      timeSlots: [],
      color: selectedColor,
    });
  };

  // Save schedule with name
  const saveScheduleWithName = async () => {
    if (!newScheduleName.trim()) {
      Alert.alert("알림", "일정 이름을 입력해주세요.");
      return;
    }

    try {
      let updatedCustomSchedules = [...(customSchedules || [])];
      const existingIndex = updatedCustomSchedules.findIndex(
        (schedule) => schedule.id === selectedCustomSchedule?.id
      );

      if (existingIndex !== -1) {
        // 기존 일정 업데이트 - 색상 포함 전체 속성 유지
        updatedCustomSchedules[existingIndex] = {
          ...updatedCustomSchedules[existingIndex], // 기존 속성 유지 (색상 포함)
          name: newScheduleName,
        };
      } else {
        // 새 일정 추가
        updatedCustomSchedules.push({
          ...selectedCustomSchedule, // 색상 정보 포함
          name: newScheduleName,
        });
      }

      // saveCustomSchedulesOnly로 수정
      await saveCustomSchedulesOnly(updatedCustomSchedules);
      setIsNaming(false);
      setNewScheduleName("");
      setIsDetailScreen(false);
      setSelectedCustomSchedule(null);
      Alert.alert("완료", "일정이 저장되었습니다.");
    } catch (error) {
      console.error("Save name error:", error);
      Alert.alert("오류", "일정 저장 중 오류가 발생했습니다.");
    }
  };

  // Render custom schedule item for main screen
  const renderCustomScheduleItem = (schedule, index) => {
    const colorIndex = index % CUSTOM_COLORS.length;
    const scheduleColor = schedule.color || CUSTOM_COLORS[colorIndex].color;

    return (
      <TouchableOpacity
        // key={schedule.id} <- 이 줄을 제거
        style={[
          styles.customScheduleItem,
          isCheckMode &&
            checkedSchedules.includes(schedule.id) &&
            styles.checkedScheduleItem,
        ]}
        onPress={() => {
          if (isCheckMode) {
            toggleScheduleCheck(schedule.id);
          } else {
            setSelectedCustomSchedule(schedule);
            setIsDetailScreen(true);
          }
        }}
        onLongPress={() => {
          if (!isCheckMode) {
            Alert.alert("일정 관리", "일정을 어떻게 관리하시겠습니까?", [
              {
                text: "이름 수정",
                onPress: () => {
                  setNewScheduleName(schedule.name);
                  setEditingSchedule(schedule); // 편집할 일정 설정
                  setIsNaming(true);
                },
              },
              {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                  Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: async () => {
                        const updatedSchedules = customSchedules.filter(
                          (s) => s.id !== schedule.id
                        );
                        await saveCustomSchedule(updatedSchedules);
                      },
                    },
                  ]);
                },
              },
              { text: "취소", style: "cancel" },
            ]);
          }
        }}
      >
        {/* Check box */}
        {isCheckMode && (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: scheduleColor },
                checkedSchedules.includes(schedule.id) && {
                  backgroundColor: scheduleColor,
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

        {/* Schedule circle and name */}
        <View style={styles.scheduleCircleContainer}>
          <View
            style={[styles.scheduleCircle, { backgroundColor: scheduleColor }]}
          >
            <Text style={styles.scheduleInitial}>
              {schedule.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.scheduleName}>{schedule.name}</Text>
        </View>

        {/* Item count */}
        <View
          style={[
            styles.scheduleCountBadge,
            { backgroundColor: scheduleColor + "20" },
          ]}
        >
          <Text style={[styles.scheduleCountText, { color: scheduleColor }]}>
            {schedule.timeSlots?.length || 0}개의 일정
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render custom schedule time slot item for detail screen
  const renderTimeSlotItem = (timeSlot) => {
    const scheduleColor =
      selectedCustomSchedule?.color || CUSTOM_COLORS[0].color;

    return (
      <TouchableOpacity
        // key={timeSlot.id} <- 이 줄을 제거 (Fragment에서 이미 key를 설정했기 때문)
        style={[
          styles.scheduleItem,
          { borderLeftColor: scheduleColor },
          isCheckMode &&
            checkedSchedules.includes(timeSlot.id) && [
              styles.scheduleItemChecked,
              { borderLeftColor: scheduleColor },
            ],
        ]}
        onPress={() => {
          if (isCheckMode) {
            toggleScheduleCheck(timeSlot.id);
          }
        }}
        onLongPress={() => {
          if (!isCheckMode) {
            Alert.alert("일정 관리", "일정을 어떻게 관리하시겠습니까?", [
              {
                text: "수정",
                onPress: () => {
                  setEditingSchedule(timeSlot);
                  setShowModal(true);
                },
              },
              {
                text: "삭제",
                style: "destructive",
                onPress: () => {
                  Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: async () => {
                        const updatedCustomSchedules = [...customSchedules];
                        const scheduleIndex = updatedCustomSchedules.findIndex(
                          (schedule) =>
                            schedule.id === selectedCustomSchedule?.id
                        );

                        if (scheduleIndex !== -1) {
                          updatedCustomSchedules[scheduleIndex].timeSlots =
                            updatedCustomSchedules[
                              scheduleIndex
                            ].timeSlots.filter(
                              (slot) => slot.id !== timeSlot.id
                            );

                          // 현재 선택된 스케줄도 업데이트
                          const updatedSelectedSchedule = {
                            ...selectedCustomSchedule,
                            timeSlots:
                              updatedCustomSchedules[scheduleIndex].timeSlots,
                          };
                          setSelectedCustomSchedule(updatedSelectedSchedule);

                          await saveCustomSchedule(updatedCustomSchedules);
                        }
                      },
                    },
                  ]);
                },
              },
              { text: "취소", style: "cancel" },
            ]);
          }
        }}
      >
        {isCheckMode && (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  borderColor: scheduleColor,
                  borderWidth: 2,
                },
                checkedSchedules.includes(timeSlot.id) && {
                  backgroundColor: scheduleColor,
                },
              ]}
              onPress={() => toggleScheduleCheck(timeSlot.id)}
            >
              {checkedSchedules.includes(timeSlot.id) && (
                <Text style={[styles.checkboxCheck, { color: "#FFFFFF" }]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {/* Time info */}
        <View style={styles.scheduleTimeContainer}>
          <Text style={[styles.scheduleTime, { color: scheduleColor }]}>
            {timeSlot.startTime}
          </Text>
          <Text style={styles.scheduleTimeDivider}>~</Text>
          <Text style={[styles.scheduleTime, { color: scheduleColor }]}>
            {timeSlot.endTime}
          </Text>
        </View>
        {/* Schedule content */}
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleTask}>{timeSlot.task}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 이름 저장 모달 개선
  const renderNamingModal = () => {
    return (
      <View style={styles.namingModalOverlay}>
        <View style={styles.namingModalContainer}>
          {/* 이모지 추가 */}
          <Text style={styles.namingModalTitle}>✏️ 일정 이름 저장</Text>
          <TextInput
            style={styles.namingInput}
            placeholder="일정 이름을 입력하세요"
            value={newScheduleName}
            onChangeText={setNewScheduleName}
            autoFocus
          />
          <View style={styles.namingModalButtons}>
            <TouchableOpacity
              style={styles.namingModalCancelButton}
              onPress={() => setIsNaming(false)}
            >
              <Text style={styles.namingModalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.namingModalSaveButton}
              onPress={saveScheduleWithName}
            >
              {/* 이모지 추가 */}
              <Text style={styles.namingModalSaveText}>💾 저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 메인 헤더 버튼 개선
  const renderMainScreen = () => {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerControlsRow}>
            {/* 왼쪽에 타이틀 추가 */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleEmoji}>✨</Text>
              <Text style={styles.headerTitle}>사용자 커스텀</Text>
            </View>

            {/* 오른쪽에 선택 버튼 배치 */}
            <TouchableOpacity
              style={[
                styles.checkListButton,
                isCheckMode && styles.checkListButtonActive,
              ]}
              onPress={toggleCheckMode}
            >
              <View style={styles.buttonContent}>
                {/* 항상 체크 이모지 사용하고 배경색 변경으로 상태 표시 */}
                <Text
                  style={[
                    styles.buttonIcon,
                    isCheckMode && styles.buttonIconActive,
                  ]}
                >
                  ✓
                </Text>
                <Text
                  style={[
                    styles.checkListButtonText,
                    isCheckMode && styles.checkListButtonTextActive,
                  ]}
                >
                  {isCheckMode ? "완료" : "선택"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* 나머지 코드는 그대로 유지 */}
        <ScrollView
          style={styles.scheduleList}
          contentContainerStyle={styles.scheduleListContent}
        >
          {(customSchedules || []).length > 0 ? (
            (customSchedules || []).map((schedule, index) => (
              <TouchableOpacity
                key={schedule.id || `custom-${index}`}
                style={[
                  styles.customScheduleItem,
                  isCheckMode &&
                    checkedSchedules.includes(schedule.id) &&
                    styles.checkedScheduleItem,
                ]}
                onPress={() => {
                  if (isCheckMode) {
                    toggleScheduleCheck(schedule.id);
                  } else {
                    setSelectedCustomSchedule(schedule);
                    setIsDetailScreen(true);
                  }
                }}
                onLongPress={() => {
                  if (!isCheckMode) {
                    Alert.alert(
                      "일정 관리 🛠️",
                      "일정을 어떻게 관리하시겠습니까?",
                      [
                        {
                          text: "✏️ 이름 수정",
                          onPress: () => {
                            setNewScheduleName(schedule.name);
                            setEditingSchedule(schedule);
                            setIsNaming(true);
                          },
                        },
                        {
                          text: "🗑️ 삭제",
                          style: "destructive",
                          onPress: async () => {
                            Alert.alert(
                              "일정 삭제 ⚠️",
                              "이 일정을 삭제하시겠습니까?",
                              [
                                { text: "취소", style: "cancel" },
                                {
                                  text: "삭제",
                                  style: "destructive",
                                  onPress: async () => {
                                    const updatedSchedules =
                                      customSchedules.filter(
                                        (s) => s.id !== schedule.id
                                      );
                                    await saveCustomSchedulesOnly(
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
                        {
                          borderColor:
                            schedule.color ||
                            CUSTOM_COLORS[index % CUSTOM_COLORS.length].color,
                        },
                        checkedSchedules.includes(schedule.id) && {
                          backgroundColor:
                            schedule.color ||
                            CUSTOM_COLORS[index % CUSTOM_COLORS.length].color,
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

                {/* 일정 아이콘과 이름 */}
                <View style={styles.scheduleCircleContainer}>
                  <View
                    style={[
                      styles.scheduleCircle,
                      {
                        backgroundColor:
                          schedule.color ||
                          CUSTOM_COLORS[index % CUSTOM_COLORS.length].color,
                      },
                    ]}
                  >
                    <Text style={styles.scheduleInitial}>
                      {schedule.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.scheduleName}>{schedule.name}</Text>
                </View>

                {/* 일정 개수 배지 */}
                <View
                  style={[
                    styles.scheduleCountBadge,
                    {
                      backgroundColor:
                        (schedule.color ||
                          CUSTOM_COLORS[index % CUSTOM_COLORS.length].color) +
                        "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scheduleCountText,
                      {
                        color:
                          schedule.color ||
                          CUSTOM_COLORS[index % CUSTOM_COLORS.length].color,
                      },
                    ]}
                  >
                    {/* 이모지 추가 */}
                    {schedule.timeSlots?.length > 0 ? "📝 " : "✨ "}
                    {schedule.timeSlots?.length || 0}개의 일정
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyScheduleContainer}>
              {/* 이모지 추가 */}
              <Text style={styles.emptyScheduleEmoji}>📝</Text>
              <Text style={styles.emptyScheduleText}>
                등록된 커스텀 일정이 없습니다
              </Text>
              <Text style={styles.emptyScheduleSubText}>
                아래 버튼을 눌러 새 일정을 추가해보세요
              </Text>
            </View>
          )}
        </ScrollView>

        {isCheckMode && checkedSchedules.length > 0 && (
          <View style={styles.checkModeActionBar}>
            <Text style={styles.checkedCountText}>
              {checkedSchedules.length}개 선택됨
            </Text>

            <View style={styles.actionButtonsContainer}>
              {/* 수정 버튼 - 하나만 선택했을 때 활성화 */}
              <TouchableOpacity
                style={[
                  styles.editCheckedButton,
                  checkedSchedules.length !== 1 && styles.disabledActionButton,
                ]}
                onPress={() => {
                  // 하나만 선택된 경우에만 수정 가능
                  if (checkedSchedules.length === 1) {
                    const selectedSchedule = customSchedules.find(
                      (schedule) => schedule.id === checkedSchedules[0]
                    );
                    if (selectedSchedule) {
                      setNewScheduleName(selectedSchedule.name);
                      setEditingSchedule(selectedSchedule);
                      setIsNaming(true);
                      setIsCheckMode(false); // 체크 모드 종료
                      setCheckedSchedules([]);
                    }
                  }
                }}
                disabled={checkedSchedules.length !== 1}
              >
                <Text
                  style={[
                    styles.editCheckedButtonText,
                    checkedSchedules.length !== 1 &&
                      styles.disabledActionButtonText,
                  ]}
                >
                  ✏️ 수정
                </Text>
              </TouchableOpacity>

              {/* 삭제 버튼 */}
              <TouchableOpacity
                style={styles.deleteCheckedButton}
                onPress={deleteCheckedSchedules}
              >
                <Text style={styles.deleteCheckedButtonText}>🗑️ 삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* 새 일정 추가 버튼 */}
        {!isCheckMode && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateNewSchedule}
          >
            <Text style={styles.addButtonText}>
              {/* 이모지 추가 */}✨ 새 커스텀 일정 추가
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Modify the header part in the renderDetailScreen function
  const renderDetailScreen = () => {
    if (!selectedCustomSchedule) return null;

    const scheduleColor =
      selectedCustomSchedule?.color || CUSTOM_COLORS[0].color;
    const timeSlots = selectedCustomSchedule?.timeSlots || [];

    return (
      <View style={styles.container}>
        {/* Simplified header without back button */}
        <View
          style={[
            styles.combinedHeaderContainer,
            { borderBottomColor: scheduleColor + "30" },
          ]}
        >
          {/* Title moved to the left for better balance */}
          <View style={styles.scheduleTitleContainer}>
            <Text style={[styles.scheduleTitle, { color: scheduleColor }]}>
              {selectedCustomSchedule.name}
            </Text>
            <Text style={styles.scheduleSubtitle}>
              {timeSlots.length > 0
                ? `📝 ${timeSlots.length}개의 일정이 있습니다`
                : "📝 등록된 일정이 없습니다"}
            </Text>
          </View>

          {/* Action buttons on the right */}
          <View style={styles.headerButtonsContainer}>
            {/* 선택 모드 버튼 */}
            {timeSlots.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.actionIconButton,
                  isCheckMode
                    ? { backgroundColor: scheduleColor }
                    : {
                        backgroundColor: "#F1F3F5",
                        borderColor: scheduleColor,
                        borderWidth: 1,
                      },
                ]}
                onPress={toggleCheckMode}
              >
                <Text
                  style={[
                    styles.actionIconText,
                    isCheckMode
                      ? { color: "#FFFFFF" }
                      : { color: scheduleColor },
                  ]}
                >
                  ✓
                </Text>
              </TouchableOpacity>
            )}

            {/* 저장 버튼 */}
            {!isCheckMode && timeSlots.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.actionIconButton,
                  { backgroundColor: scheduleColor },
                ]}
                onPress={() => {
                  setIsNaming(true);
                  setNewScheduleName(selectedCustomSchedule.name);
                }}
              >
                <Text style={styles.actionIconText}>💾</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Rest of the code remains the same */}
        {isCheckMode && timeSlots.length > 0 && (
          <View
            style={[
              styles.checkModeControls,
              { borderBottomColor: scheduleColor + "30" },
            ]}
          >
            <View style={styles.checkModeActionBar}>
              <Text style={[styles.checkedCountText, { color: scheduleColor }]}>
                {checkedSchedules.length}개 선택됨
              </Text>

              <View style={styles.actionButtonsContainer}>
                {/* 수정 버튼 - 하나만 선택했을 때 활성화 */}
                <TouchableOpacity
                  style={[
                    styles.editCheckedButton,
                    { backgroundColor: scheduleColor + "20" }, // 약한 배경색 사용
                    checkedSchedules.length !== 1 &&
                      styles.disabledActionButton,
                  ]}
                  onPress={() => {
                    // 하나만 선택된 경우에만 수정 가능
                    if (checkedSchedules.length === 1) {
                      const selectedTimeSlot =
                        selectedCustomSchedule.timeSlots.find(
                          (slot) => slot.id === checkedSchedules[0]
                        );
                      if (selectedTimeSlot) {
                        setEditingSchedule(selectedTimeSlot);
                        setShowModal(true);
                        setIsCheckMode(false); // 체크 모드 종료
                        setCheckedSchedules([]);
                      }
                    }
                  }}
                  disabled={checkedSchedules.length !== 1}
                >
                  <Text
                    style={[
                      styles.editCheckedButtonText,
                      {
                        color:
                          checkedSchedules.length === 1
                            ? scheduleColor
                            : "#ADB5BD",
                      },
                    ]}
                  >
                    ✏️ 수정
                  </Text>
                </TouchableOpacity>

                {/* 삭제 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.deleteCheckedButton,
                    {
                      backgroundColor:
                        checkedSchedules.length > 0 ? "#FA5252" : scheduleColor,
                    },
                  ]}
                  onPress={deleteCheckedSchedules}
                >
                  <Text style={styles.deleteCheckedButtonText}>🗑️ 삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Time slots list */}
        <ScrollView style={styles.scheduleList}>
          {timeSlots.length > 0 ? (
            timeSlots.map((timeSlot, index) => (
              <TouchableOpacity
                key={timeSlot.id || `slot-${index}`}
                style={[
                  styles.scheduleItem,
                  { borderLeftColor: scheduleColor },
                  isCheckMode &&
                    checkedSchedules.includes(timeSlot.id) && [
                      styles.scheduleItemChecked,
                      {
                        borderLeftColor: scheduleColor,
                        backgroundColor: scheduleColor + "3", // 매우 옅은 배경색
                        borderColor: scheduleColor,
                        borderWidth: 1,
                      },
                    ],
                ]}
                onPress={() => {
                  if (isCheckMode) {
                    toggleScheduleCheck(timeSlot.id);
                  }
                }}
                onLongPress={() => {
                  if (!isCheckMode) {
                    Alert.alert(
                      "일정 관리 🛠️",
                      "일정을 어떻게 관리하시겠습니까?",
                      [
                        {
                          text: "✏️ 수정",
                          onPress: () => {
                            setEditingSchedule(timeSlot);
                            setShowModal(true);
                          },
                        },
                        {
                          text: "🗑️ 삭제",
                          style: "destructive",
                          onPress: () => {
                            Alert.alert(
                              "일정 삭제 ⚠️",
                              "이 일정을 삭제하시겠습니까?",
                              [
                                { text: "취소", style: "cancel" },
                                {
                                  text: "삭제",
                                  style: "destructive",
                                  onPress: async () => {
                                    const updatedCustomSchedules = [
                                      ...customSchedules,
                                    ];
                                    const scheduleIndex =
                                      updatedCustomSchedules.findIndex(
                                        (schedule) =>
                                          schedule.id ===
                                          selectedCustomSchedule?.id
                                      );

                                    if (scheduleIndex !== -1) {
                                      updatedCustomSchedules[
                                        scheduleIndex
                                      ].timeSlots = updatedCustomSchedules[
                                        scheduleIndex
                                      ].timeSlots.filter(
                                        (slot) => slot.id !== timeSlot.id
                                      );

                                      const updatedSelectedSchedule = {
                                        ...selectedCustomSchedule,
                                        timeSlots:
                                          updatedCustomSchedules[scheduleIndex]
                                            .timeSlots,
                                      };
                                      setSelectedCustomSchedule(
                                        updatedSelectedSchedule
                                      );

                                      await saveCustomSchedule(
                                        updatedCustomSchedules
                                      );
                                    }
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
                {/* Checkbox */}
                {isCheckMode && (
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        {
                          borderColor: scheduleColor,
                          borderWidth: 2,
                        },
                        checkedSchedules.includes(timeSlot.id) && {
                          backgroundColor: scheduleColor,
                        },
                      ]}
                      onPress={() => toggleScheduleCheck(timeSlot.id)}
                    >
                      {checkedSchedules.includes(timeSlot.id) && (
                        <Text
                          style={[styles.checkboxCheck, { color: "#FFFFFF" }]}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Time info */}
                <View style={styles.scheduleTimeContainer}>
                  <Text
                    style={[
                      styles.scheduleTime,
                      {
                        color:
                          selectedCustomSchedule?.color ||
                          CUSTOM_COLORS[0].color,
                      },
                    ]}
                  >
                    {timeSlot.startTime}
                  </Text>
                  <Text style={styles.scheduleTimeDivider}>~</Text>
                  <Text
                    style={[
                      styles.scheduleTime,
                      {
                        color:
                          selectedCustomSchedule?.color ||
                          CUSTOM_COLORS[0].color,
                      },
                    ]}
                  >
                    {timeSlot.endTime}
                  </Text>
                </View>

                {/* Schedule content */}
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTask}>📌 {timeSlot.task}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyScheduleContainer}>
              <Text style={styles.emptyScheduleEmoji}>📝</Text>
              <Text style={styles.emptyScheduleText}>
                등록된 일정이 없습니다
              </Text>
              <Text style={styles.emptyScheduleSubText}>
                아래 버튼을 눌러 새 일정을 추가해보세요
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add button (when not in check mode) */}
        {!isCheckMode && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: scheduleColor }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addButtonText}>✨ 새 일정 추가</Text>
          </TouchableOpacity>
        )}

        {/* 일정 모달 */}
        <AddScheduleModal
          visible={showModal}
          onClose={() => {
            if (editingSchedule) {
              // 편집 중이었다면 변경사항 있음으로 표시
              setHasUnsavedChanges(true);
            }
            setShowModal(false);
            setEditingSchedule(null);
          }}
          editingSchedule={editingSchedule}
          onSave={async (newSchedule) => {
            try {
              const updatedCustomSchedules = [...(customSchedules || [])];
              const scheduleIndex = updatedCustomSchedules.findIndex(
                (schedule) => schedule.id === selectedCustomSchedule?.id
              );

              if (scheduleIndex === -1) {
                // 새 커스텀 일정인 경우
                const scheduleWithTimeSlot = {
                  ...selectedCustomSchedule,
                  timeSlots: [
                    {
                      ...newSchedule,
                      id: `slot-${Date.now()}-${Math.random()
                        .toString(36)
                        .substr(2, 9)}`,
                    },
                  ],
                };
                updatedCustomSchedules.push(scheduleWithTimeSlot);
              } else {
                // 기존 커스텀 일정 업데이트
                if (editingSchedule) {
                  // 기존 시간 슬롯 편집
                  updatedCustomSchedules[scheduleIndex].timeSlots =
                    updatedCustomSchedules[scheduleIndex].timeSlots.map(
                      (slot) =>
                        slot.id === editingSchedule.id
                          ? { ...newSchedule, id: slot.id }
                          : slot
                    );
                } else {
                  // 새 시간 슬롯 추가
                  const timeSlotWithId = {
                    ...newSchedule,
                    id: `slot-${Date.now()}-${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                  };
                  updatedCustomSchedules[scheduleIndex].timeSlots = [
                    ...(updatedCustomSchedules[scheduleIndex].timeSlots || []),
                    timeSlotWithId,
                  ];
                }
              }

              await saveCustomSchedulesOnly(updatedCustomSchedules);

              // 선택된 커스텀 일정 상태 업데이트
              if (scheduleIndex !== -1) {
                setSelectedCustomSchedule(
                  updatedCustomSchedules[scheduleIndex]
                );
              } else {
                setSelectedCustomSchedule(
                  updatedCustomSchedules[updatedCustomSchedules.length - 1]
                );
              }

              // 성공적으로 저장 완료
              setHasUnsavedChanges(false);
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
  };

  // Main render
  return (
    <View style={styles.container}>
      {isNaming && renderNamingModal()}
      {isDetailScreen ? renderDetailScreen() : renderMainScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // 헤더 타이틀 컨테이너
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // 헤더 타이틀 이모지
  headerTitleEmoji: {
    fontSize: 22,
    marginRight: 8,
  },

  // 헤더 타이틀 텍스트
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },

  // 헤더 버튼 행 레이아웃 변경
  headerControlsRow: {
    flexDirection: "row",
    justifyContent: "space-between", // 좌우 배치로 변경
    alignItems: "center",
    width: "100%",
    paddingVertical: 5,
  },

  // 버튼 내용 컨테이너
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // 버튼 텍스트 스타일
  checkListButtonText: {
    color: "#4A6FA5",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },

  // 활성화 시 아이콘과 텍스트 색상
  checkListButtonTextActive: {
    color: "#FFFFFF",
  },

  // 상세 화면 헤더 버튼 컨테이너
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // 버튼 사이 간격
  },

  // 뒤로가기 버튼 스타일 조정
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  backButtonText: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "600",
    marginLeft: 4,
  },

  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#50CEBB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  scheduleList: {
    flex: 1,
  },
  // ===== 메인 화면 일정 간격 조정 =====
  scheduleListContent: {
    padding: 12,
    paddingTop: 18, // 상단 여백 추가
    gap: 3, // 스케줄 간 간격 줄임 (기존 20에서 12로)
  },

  // 2. 일정 항목 자체의 여백 줄이기
  customScheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18, // 내부 여백 줄임 (원래 16에서 12로)
    marginBottom: 8, // 하단 여백 줄임 (원래 10에서 8로)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // 아이템 선택 시 스타일 개선
  checkedScheduleItem: {
    backgroundColor: "#F5F9FF",
    borderWidth: 1,
    borderColor: "#4A90E2",
    // 추가 그림자 효과
    ...Platform.select({
      ios: {
        shadowColor: "#4A90E2",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  // 6. 일정 제목과 이름 컨테이너 수정
  scheduleCircleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  scheduleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scheduleInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  // 7. 배지 스타일 조정
  scheduleCountBadge: {
    paddingVertical: 5, // 상하 패딩 줄임 (원래 6에서 5로)
    paddingHorizontal: 12, // 좌우 패딩 줄임 (원래 14에서 12로)
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

  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  // 5. 체크박스 컨테이너 여백 줄이기
  checkboxContainer: {
    justifyContent: "center",
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginRight: 6,
  },
  checkboxCheck: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Detail screen styles
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
  },
  scheduleTitleContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 25,
    fontWeight: "700",
    opacity: 0.9,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  // 아이콘만 있는 버튼들 스타일
  checkModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F3F5",
  },
  checkModeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
  },
  checkModeButtonTextActive: {
    color: "#fff",
    fontSize: 15,
  },
  checkModeControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },

  // 수정 버튼
  editCheckedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    marginRight: 8,
  },

  editCheckedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // 비활성화된 버튼
  disabledActionButton: {
    backgroundColor: "#E9ECEF",
  },

  disabledActionButtonText: {
    color: "#ADB5BD",
  },

  // 액션 버튼 컨테이너
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // 버튼 아이콘 활성화 스타일
  buttonIconActive: {
    color: "#FFFFFF",
  },

  // 체크 모드 액션 바
  checkModeActionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // 선택한 아이템 수 표시
  checkedCountText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#495057",
  },
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

  // 3. 상세 화면의 일정 항목(시간 슬롯) 간격 줄이기
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 12, // 하단 여백 줄임 (원래 15에서 10으로)
    maxWidth: 390,
    alignSelf: "center",
    width: "96%",
    borderLeftWidth: 4,
    paddingVertical: 4, // 상하 여백 줄임 (원래 5에서 4로)
    paddingHorizontal: 14, // 좌우 여백 줄임 (원래 16에서 14로)
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
  // 4. 더 컴팩트한 시간 표시를 위한 스타일 수정
  scheduleTimeContainer: {
    alignItems: "center",
    marginRight: 12, // 여백 줄임 (원래 16에서 12로)
    width: 52, // 너비도 약간 줄임 (원래 54에서 52로)
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
  // Naming modal styles
  namingModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  namingModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  namingModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
    textAlign: "center",
  },
  namingInput: {
    borderWidth: 1,
    borderColor: "#DDE2E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  namingModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  namingModalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F1F3F5",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  namingModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  namingModalSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#50CEBB",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  namingModalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // 빈 일정 화면 이모지
  emptyScheduleEmoji: {
    fontSize: 60,
    marginBottom: 16,
    textAlign: "center",
  },

  // 버튼 크기 및 디자인 조정
  checkListButton: {
    backgroundColor: "#F0F5FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 90, // 크기 줄임 (우측에 위치하므로)
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D0E1FF",
    ...Platform.select({
      ios: {
        shadowColor: "#4A6FA5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  checkListButtonActive: {
    backgroundColor: "#4A90E2",
    borderColor: "#3A80D2",
  },

  // 체크박스 버튼 아이콘 크기 조정
  buttonIcon: {
    fontSize: 15, // 크기 증가
    marginRight: 8,
    color: "#4A6FA5",
    fontWeight: "bold",
  },

  // 일정 추가 버튼 디자인 향상
  addButton: {
    margin: 20,
    padding: 16,
    borderRadius: 16, // 더 둥글게
    alignItems: "center",
    backgroundColor: "#50CEBB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700", // 더 굵게
  },

  // 삭제 버튼 효과 강화
  deleteButton: {
    backgroundColor: "#FA5252",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16, // 더 둥글게
    margin: 20,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#5a0000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  combinedHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
  },

  // Adjusted title container - now takes more space
  scheduleTitleContainer: {
    flex: 1,
  },

  // Adjusted styles for the title text
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    opacity: 0.9,
  },

  scheduleSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  // Action icon buttons (check and save)
  actionIconButton: {
    width: 36, // Slightly larger for better touch targets
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 157, 189, 0.36)",
  },

  actionIconText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  actionIconTextActive: {
    color: "#fff",
  },

  // Container for action buttons
  headerButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },

  // Schedule list with more space at the top
  scheduleList: {
    flex: 1,
    paddingTop: 8, // Increased from 4 to give more space
  },

  // Schedule items with optimized styling
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6, // Consistent vertical spacing
    marginHorizontal: 8, // Some horizontal padding
    maxWidth: 390,
    alignSelf: "center",
    width: "96%",
    borderLeftWidth: 4,
    paddingVertical: 8, // Slightly increased for better readability
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4, // Lighter shadow
      },
      android: {
        elevation: 3, // Lighter elevation
      },
    }),
  },

  // Improved styling for the schedule content
  scheduleContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 4, // Give a little breathing room on the right
  },

  // Time container adjustments
  scheduleTimeContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 52,
  },

  // Improve empty state container
  emptyScheduleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40, // Move up a bit since we freed up header space
    padding: 20,
  },
});
