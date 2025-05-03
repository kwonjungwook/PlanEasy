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
import { LinearGradient } from "expo-linear-gradient";
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
  // 상태 관리 코드 유지
  const [isDetailScreen, setIsDetailScreen] = useState(false);
  const [selectedCustomSchedule, setSelectedCustomSchedule] = useState(null);
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

  // 현재 선택된 커스텀 일정의 색상 가져오기
  const getCurrentColor = () => {
    return selectedCustomSchedule?.color || CUSTOM_COLORS[0].color;
  };

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

  // 체크된 일정 삭제
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
                // 세부 화면에서 시간 슬롯 삭제
                const updatedCustomSchedules = [...customSchedules];
                const scheduleIndex = updatedCustomSchedules.findIndex(
                  (schedule) => schedule.id === selectedCustomSchedule?.id
                );

                if (scheduleIndex !== -1) {
                  updatedCustomSchedules[scheduleIndex].timeSlots =
                    updatedCustomSchedules[scheduleIndex].timeSlots.filter(
                      (slot) => !checkedSchedules.includes(slot.id)
                    );

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
                // 메인 화면에서 전체 커스텀 일정 삭제
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

  // 새 일정 생성 함수
  const handleCreateNewSchedule = () => {
    if (customSchedules.length >= 30) {
      Alert.alert("알림", "최대 30개의 커스텀 일정만 생성할 수 있습니다.");
      return;
    }

    // 사용 중인 색상 찾기
    const usedColors = customSchedules.map((schedule) => schedule.color);

    // 사용되지 않은 색상 찾기
    const availableColors = CUSTOM_COLORS.filter(
      (color) => !usedColors.includes(color.color)
    );

    // 색상 선택
    let selectedColor;
    if (availableColors.length > 0) {
      selectedColor = availableColors[0].color;
    } else {
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
        // 기존 일정 업데이트
        updatedCustomSchedules[existingIndex] = {
          ...updatedCustomSchedules[existingIndex],
          name: newScheduleName,
        };
      } else {
        // 새 일정 추가
        updatedCustomSchedules.push({
          ...selectedCustomSchedule,
          name: newScheduleName,
        });
      }

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
              <Text style={styles.namingModalSaveText}>💾 저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 메인 화면 렌더링 - 공통 디자인 적용
  const renderMainScreen = () => {
    return (
      <View style={styles.container}>
        {/* 그라데이션 헤더 추가 */}
        <LinearGradient
          colors={["#50CEBB", "#3bb2a0"]}
          style={styles.gradientHeader}
        >
          <Text style={styles.headerTitle}>사용자 커스텀</Text>
          <Text style={styles.headerSubtitle}>
            개인 설정에 맞게 일정을 자유롭게 관리하세요
          </Text>
        </LinearGradient>

        {/* 컨텐츠 컨테이너 - 공통 스타일 적용 */}
        <View style={styles.contentContainer}>
          {/* 헤더 컨트롤 */}
          <View style={styles.headerControlsRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleEmoji}>✨</Text>
              <Text style={styles.sectionTitle}>커스텀 일정 목록</Text>
            </View>

            {/* 선택 버튼 */}
            <TouchableOpacity
              style={[
                styles.checkListButton,
                isCheckMode && styles.checkListButtonActive,
              ]}
              onPress={toggleCheckMode}
            >
              <View style={styles.buttonContent}>
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

          {/* 일정 목록 */}
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
                      {schedule.timeSlots?.length > 0 ? "📝 " : "✨ "}
                      {schedule.timeSlots?.length || 0}개의 일정
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyScheduleContainer}>
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

          {/* 체크 모드 액션 바 */}
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
                    checkedSchedules.length !== 1 &&
                      styles.disabledActionButton,
                  ]}
                  onPress={() => {
                    if (checkedSchedules.length === 1) {
                      const selectedSchedule = customSchedules.find(
                        (schedule) => schedule.id === checkedSchedules[0]
                      );
                      if (selectedSchedule) {
                        setNewScheduleName(selectedSchedule.name);
                        setEditingSchedule(selectedSchedule);
                        setIsNaming(true);
                        setIsCheckMode(false);
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
              <Text style={styles.addButtonText}>✨ 새 커스텀 일정 추가</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Modify the header part in the renderDetailScreen function
  const renderDetailScreen = () => {
    if (!selectedCustomSchedule) return null;

    const scheduleColor = getCurrentColor();
    const timeSlots = selectedCustomSchedule?.timeSlots || [];

    return (
      <View style={styles.container}>
        {/* 그라데이션 헤더 */}
        <LinearGradient
          colors={[scheduleColor, shadeColor(scheduleColor, -10)]}
          style={styles.gradientHeader}
        >
          <Text style={styles.headerTitle}>{selectedCustomSchedule.name}</Text>
          <Text style={styles.headerSubtitle}>개별 일정을 관리합니다</Text>
        </LinearGradient>

        {/* 컨텐츠 컨테이너 */}
        <View style={styles.contentContainer}>
          {/* 헤더 컨트롤 */}
          <View style={styles.headerControlsRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setIsDetailScreen(false);
                setSelectedCustomSchedule(null);
              }}
            >
              <Text style={styles.backButtonText}>← 목록으로</Text>
            </TouchableOpacity>

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

          {/* 체크 모드 컨트롤 */}
          {isCheckMode && timeSlots.length > 0 && (
            <View
              style={[
                styles.checkModeControls,
                { borderBottomColor: scheduleColor + "30" },
              ]}
            >
              <View style={styles.checkModeActionBar}>
                <Text
                  style={[styles.checkedCountText, { color: scheduleColor }]}
                >
                  {checkedSchedules.length}개 선택됨
                </Text>

                <View style={styles.actionButtonsContainer}>
                  {/* 수정 버튼 - 하나만 선택했을 때 활성화 */}
                  <TouchableOpacity
                    style={[
                      styles.editCheckedButton,
                      { backgroundColor: scheduleColor + "20" },
                      checkedSchedules.length !== 1 &&
                        styles.disabledActionButton,
                    ]}
                    onPress={() => {
                      if (checkedSchedules.length === 1) {
                        const selectedTimeSlot =
                          selectedCustomSchedule.timeSlots.find(
                            (slot) => slot.id === checkedSchedules[0]
                          );
                        if (selectedTimeSlot) {
                          setEditingSchedule(selectedTimeSlot);
                          setShowModal(true);
                          setIsCheckMode(false);
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
                          checkedSchedules.length > 0
                            ? "#FA5252"
                            : scheduleColor,
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

          {/* 일정 목록 */}
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
                          backgroundColor: scheduleColor + "10",
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
                                            updatedCustomSchedules[
                                              scheduleIndex
                                            ].timeSlots,
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
                  {/* 체크박스 */}
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

                  {/* 시간 정보 */}
                  <View style={styles.scheduleTimeContainer}>
                    <Text
                      style={[styles.scheduleTime, { color: scheduleColor }]}
                    >
                      {timeSlot.startTime}
                    </Text>
                    <Text style={styles.scheduleTimeDivider}>~</Text>
                    <Text
                      style={[styles.scheduleTime, { color: scheduleColor }]}
                    >
                      {timeSlot.endTime}
                    </Text>
                  </View>

                  {/* 일정 내용 */}
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

          {/* 추가 버튼 */}
          {!isCheckMode && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: scheduleColor }]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.addButtonText}>✨ 새 일정 추가</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // 메인 렌더링
  return (
    <View style={styles.container}>
      {isNaming && renderNamingModal()}
      {isDetailScreen ? renderDetailScreen() : renderMainScreen()}

      {/* 일정 추가/수정 모달 */}
      <AddScheduleModal
        visible={showModal}
        onClose={() => {
          if (editingSchedule) {
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
                  updatedCustomSchedules[scheduleIndex].timeSlots.map((slot) =>
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
              setSelectedCustomSchedule(updatedCustomSchedules[scheduleIndex]);
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
}

// 색상 밝기 조절 함수
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

// 스타일 정의
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
  // 헤더 컨트롤 로우
  headerControlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // 헤더 타이틀 컨테이너
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // 헤더 타이틀 이모지
  headerTitleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  // 섹션 타이틀
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  // 버튼 컨텐츠
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // 버튼 아이콘
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "#4A6FA5",
    fontWeight: "bold",
  },
  buttonIconActive: {
    color: "#FFFFFF",
  },
  // 체크리스트 버튼
  checkListButton: {
    backgroundColor: "#F0F5FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 90,
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
  checkListButtonText: {
    color: "#4A6FA5",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  checkListButtonTextActive: {
    color: "#FFFFFF",
  },
  // 스케줄 리스트
  scheduleList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scheduleListContent: {
    padding: 8,
    paddingTop: 12,
    paddingBottom: 90,
  },
  // 커스텀 스케줄 아이템
  customScheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  // 체크된 스케줄 아이템
  checkedScheduleItem: {
    backgroundColor: "#F5F9FF",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  // 스케줄 서클 컨테이너
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
  // 스케줄 카운트 배지
  scheduleCountBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
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
  // 빈 스케줄 컨테이너
  emptyScheduleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyScheduleEmoji: {
    fontSize: 50,
    marginBottom: 16,
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
  // 체크 모드 액션 바
  checkModeActionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  // 체크 개수 텍스트
  checkedCountText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#495057",
  },
  // 액션 버튼 컨테이너
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  // 비활성화된 액션 버튼
  disabledActionButton: {
    backgroundColor: "#E9ECEF",
  },
  disabledActionButtonText: {
    color: "#ADB5BD",
  },
  // 삭제 버튼
  deleteCheckedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FA5252",
    borderRadius: 8,
  },
  deleteCheckedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  // 추가 버튼
  addButton: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 80,
    alignItems: "center",
    backgroundColor: "#50CEBB",
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
  // 네이밍 모달
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
  // 체크박스 컨테이너
  checkboxContainer: {
    justifyContent: "center",
    marginRight: 12,
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
  // 체크 모드 컨트롤
  checkModeControls: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  // 세부 화면 추가 스타일
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  backButtonText: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "600",
  },
  headerButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconButton: {
    width: 36,
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
  // 스케줄 아이템
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 8,
    maxWidth: 390,
    alignSelf: "center",
    width: "96%",
    borderLeftWidth: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  scheduleItemChecked: {
    backgroundColor: "#F5F9FF",
  },
  scheduleTimeContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 52,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  scheduleTimeDivider: {
    fontSize: 12,
    color: "#999",
    marginVertical: 2,
  },
  scheduleContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 4,
  },
  scheduleTask: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
});
