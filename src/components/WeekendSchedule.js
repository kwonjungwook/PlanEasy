// WeekendSchedule.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { usePlanner } from "../context/PlannerContext";
import AddScheduleModal from "./AddScheduleModal";

import { LinearGradient } from "expo-linear-gradient";
import { commonStyles, SCHEDULE_COLORS } from "../styles/scheduleStyles";

// 색상 시스템 정의
const Colors = {
  primary: "#6B7A99",
  secondary: "#8C9AAF",
  background: "#F8F9FD",
  white: "#FFFFFF",
  text: {
    primary: "#4A5568",
    secondary: "#9BA5BF",
    active: "#6B7A99",
  },
  categories: {
    morning: "#FFB5B5", // 아침 일정
    afternoon: "#B5D4FF", // 오후 일정
    evening: "#FFE4B5", // 저녁 일정
    night: "#E1BEE7", // 밤 일정
  },
  shadow: {
    light: "#A0A0A0",
    medium: "#8B9FDB",
    dark: "#C5CEE6",
  },
};

// 공통 스타일을 위한 상수
const COLORS = {
  primary: "#4284F3", // 평일 색상
  secondary: "#FF7043", // 주말 색상
  background: "#F8F9FD",
  white: "#FFFFFF",
};

export default function WeekendSchedule() {
  const [activeTab, setActiveTab] = useState("weekday");
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const {
    defaultWeekdaySchedule,
    defaultWeekendSchedule,
    saveDefaultSchedule,
  } = usePlanner();
  const [fadeAnim] = useState(new Animated.Value(1));

  // 체크 모드 관련 상태 추가
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [checkedSchedules, setCheckedSchedules] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // 탭 전환 애니메이션
  const handleTabChange = (newTab) => {
    // 탭 전환 시 체크 모드 해제
    setIsCheckMode(false);
    setCheckedSchedules([]);
    setSelectAllChecked(false);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(newTab);
  };

  // 체크 모드 토글 함수
  const toggleCheckMode = () => {
    if (isCheckMode) {
      setIsCheckMode(false);
      setCheckedSchedules([]);
      setSelectAllChecked(false);
    } else {
      setIsCheckMode(true);
    }
  };

  // 전체 선택 토글 함수
  const toggleSelectAll = () => {
    const currentSchedules =
      activeTab === "weekday" ? defaultWeekdaySchedule : defaultWeekendSchedule;

    if (selectAllChecked) {
      setSelectAllChecked(false);
      setCheckedSchedules([]);
    } else {
      setSelectAllChecked(true);
      const allScheduleIds = currentSchedules.map((schedule) => schedule.id);
      setCheckedSchedules(allScheduleIds);
    }
  };

  // 개별 일정 체크 토글 함수
  const toggleScheduleCheck = (scheduleId) => {
    setCheckedSchedules((prev) => {
      if (prev.includes(scheduleId)) {
        return prev.filter((id) => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  // 선택된 일정 삭제 함수
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
              const currentSchedules =
                activeTab === "weekday"
                  ? defaultWeekdaySchedule
                  : defaultWeekendSchedule;
              const updatedSchedules = currentSchedules.filter(
                (schedule) => !checkedSchedules.includes(schedule.id)
              );
              await saveDefaultSchedule(
                updatedSchedules,
                activeTab === "weekday"
              );
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

  // 시간대별 카테고리 결정 함수
  const getScheduleCategory = (startTime) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  };

  const sortSchedules = (schedules) => {
    return [...schedules].sort((a, b) => {
      const timeA = a.startTime.split(":").map(Number);
      const timeB = b.startTime.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "weekday" && styles.activeTab]}
        onPress={() => handleTabChange("weekday")}
      >
        <View style={styles.tabContent}>
          <Text style={styles.emoji}>💼</Text>
          <Text
            style={[
              styles.tabText,
              activeTab === "weekday" && styles.activeTabText,
            ]}
          >
            평일 일정
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "weekend" && styles.activeTab]}
        onPress={() => handleTabChange("weekend")}
      >
        <View style={[styles.tabContent, styles.weekendContent]}>
          <Text style={styles.emoji}>🍺</Text>
          <Text
            style={[
              styles.tabText,
              styles.weekendText,
              activeTab === "weekend" && styles.activeWeekendText,
            ]}
          >
            주말 일정
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // renderScheduleItem 함수 수정 (인덱스를 전달받아 첫 번째 항목에만 마진 적용)
  const renderScheduleItem = (schedule, index) => {
    const category = getScheduleCategory(schedule.startTime);
    const currentColor = activeTab === "weekday" ? "#4284F3" : "#FF7043";

    // 첫 번째 아이템에만 marginTop 적용
    const isFirstItem = index === 0;

    return (
      <TouchableOpacity
        key={schedule.id}
        style={[
          styles.scheduleItem,
          styles[`schedule${category}`],
          isFirstItem && styles.firstScheduleItem, // 첫 번째 아이템에만 적용될 스타일
          isCheckMode &&
            checkedSchedules.includes(schedule.id) &&
            styles.scheduleItemChecked,
        ]}
        onPress={() => {
          if (isCheckMode) {
            toggleScheduleCheck(schedule.id);
          }
        }}
        onLongPress={() => {
          if (!isCheckMode) {
            Alert.alert("일정 관리", "일정을 어떻게 관리하시겠습니까?", [
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
                  Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: async () => {
                        const currentSchedules =
                          activeTab === "weekday"
                            ? defaultWeekdaySchedule
                            : defaultWeekendSchedule;
                        const updatedSchedules = currentSchedules.filter(
                          (s) => s.id !== schedule.id
                        );
                        await saveDefaultSchedule(
                          updatedSchedules,
                          activeTab === "weekday"
                        );
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
        {/* 체크 모드일 때 체크박스 표시 */}
        {isCheckMode && (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: currentColor },
                checkedSchedules.includes(schedule.id) && {
                  backgroundColor: currentColor,
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

        <View style={styles.scheduleContent}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {schedule.startTime} - {schedule.endTime}
            </Text>
          </View>
          <Text style={styles.taskText}>{schedule.task}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 공통 헤더 적용 */}
      <LinearGradient
        colors={[COLORS.primary, "#3b75d9"]}
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>평일 & 주말 일정</Text>
        <Text style={styles.headerSubtitle}>
          원하는 시간에 맞춰 일정을 관리해보세요
        </Text>
      </LinearGradient>

      {/* 내용 컨테이너 */}
      <View style={styles.contentContainer}>
        {/* 탭 내비게이션 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weekday" && styles.activeTab]}
            onPress={() => handleTabChange("weekday")}
          >
            <View style={styles.tabContent}>
              <Text style={styles.emoji}>💼</Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "weekday" && styles.activeTabText,
                ]}
              >
                평일 일정
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weekend" && styles.activeTab]}
            onPress={() => handleTabChange("weekend")}
          >
            <View style={[styles.tabContent, styles.weekendContent]}>
              <Text style={styles.emoji}>🍺</Text>
              <Text
                style={[
                  styles.tabText,
                  styles.weekendText,
                  activeTab === "weekend" && styles.activeWeekendText,
                ]}
              >
                주말 일정
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* 체크 모드 헤더 */}
          {isCheckMode && (
            <View style={styles.checkModeControls}>
              <View style={styles.selectAllContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        activeTab === "weekday"
                          ? COLORS.primary
                          : COLORS.secondary,
                    },
                    selectAllChecked && {
                      backgroundColor:
                        activeTab === "weekday"
                          ? COLORS.primary
                          : COLORS.secondary,
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

          {/* 일정 목록 헤더 */}
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleTitleContainer}>
              <Text style={styles.scheduleTitle}>
                {activeTab === "weekday" ? "평일" : "주말"} 일정
              </Text>
              <Text style={styles.scheduleSubtitle}>
                {(activeTab === "weekday"
                  ? defaultWeekdaySchedule
                  : defaultWeekendSchedule
                ).length > 0
                  ? `${
                      (activeTab === "weekday"
                        ? defaultWeekdaySchedule
                        : defaultWeekendSchedule
                      ).length
                    }개의 일정이 있습니다`
                  : "등록된 일정이 없습니다"}
              </Text>
            </View>

            {/* 체크 모드 토글 버튼 */}
            {(activeTab === "weekday"
              ? defaultWeekdaySchedule
              : defaultWeekendSchedule
            ).length > 0 && (
              <TouchableOpacity
                style={[
                  styles.checkModeButton,
                  isCheckMode && {
                    backgroundColor:
                      activeTab === "weekday"
                        ? COLORS.primary
                        : COLORS.secondary,
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

          {/* 일정 목록 */}
          <ScrollView
            style={styles.scheduleList}
            contentContainerStyle={styles.scheduleListContent}
          >
            {sortSchedules(
              activeTab === "weekday"
                ? defaultWeekdaySchedule
                : defaultWeekendSchedule
            ).map((schedule, index) => renderScheduleItem(schedule, index))}
          </ScrollView>
        </Animated.View>

        {/* 추가 버튼 - 공통 스타일 적용 */}
        {!isCheckMode && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor:
                  activeTab === "weekday" ? COLORS.primary : COLORS.secondary,
              },
            ]}
            onPress={() => {
              setEditingSchedule(null);
              setShowModal(true);
            }}
          >
            <Text style={styles.addButtonText}>+ 새 일정 추가</Text>
          </TouchableOpacity>
        )}

        {/* 모달은 그대로 유지 */}
        <AddScheduleModal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          editingSchedule={editingSchedule}
          onSave={async (newSchedule) => {
            try {
              // 시간 검증 로직 추가
              const [startHour, startMinute] = newSchedule.startTime
                .split(":")
                .map(Number);
              const [endHour, endMinute] = newSchedule.endTime
                .split(":")
                .map(Number);

              // 시작 시간과 종료 시간을 분 단위로 변환하여 비교
              const startTimeInMinutes = startHour * 60 + startMinute;
              const endTimeInMinutes = endHour * 60 + endMinute;

              if (endTimeInMinutes <= startTimeInMinutes) {
                Alert.alert(
                  "시간 오류",
                  "종료 시간은 시작 시간보다 나중이어야 합니다."
                );
                return false;
              }

              const currentSchedules =
                activeTab === "weekday"
                  ? [...defaultWeekdaySchedule]
                  : [...defaultWeekendSchedule];

              let updatedSchedules;

              if (editingSchedule) {
                updatedSchedules = currentSchedules.map((schedule) =>
                  schedule.id === editingSchedule.id
                    ? { ...newSchedule, id: editingSchedule.id }
                    : schedule
                );
              } else {
                const newId = `${activeTab}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;
                updatedSchedules = [
                  ...currentSchedules,
                  { ...newSchedule, id: newId },
                ];
              }

              updatedSchedules = sortSchedules(updatedSchedules);
              await saveDefaultSchedule(
                updatedSchedules,
                activeTab === "weekday"
              );
              setShowModal(false);
              setEditingSchedule(null);
              return true;
            } catch (error) {
              console.error("Save error:", error);
              Alert.alert("오류", "일정 저장 중 문제가 발생했습니다.");
              return false;
            }
          }}
        />
      </View>
    </View>
  );
}

// 공통 스타일을 적용한 StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  // 컨텐츠 컨테이너 공통 스타일
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
  // 기존 스타일도 유지 (tabContainer, tab 등)
  tabContainer: {
    flexDirection: "row",
    margin: 12,
    backgroundColor: "#F3F4F8",
    borderRadius: 16,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#8B9FDB",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weekendContent: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 16,
    textAlign: "center",
    color: "#9BA5BF",
  },
  activeTabText: {
    color: "#6B7A99",
    fontWeight: "600",
  },
  weekendText: {
    fontWeight: "600",
    color: "#FF8569",
  },
  activeWeekendText: {
    color: "#FF5252",
    fontWeight: "600",
  },
  // 추가 버튼 스타일 - 공통화
  addButton: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 80,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.15)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // 나머지 필요한 스타일들...
  scheduleList: {
    flex: 1,
    padding: 12,
  },
  scheduleListContent: {
    paddingTop: 8,
    paddingBottom: 90,
  },
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 14,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // 체크 모드 관련 스타일
  checkModeControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  checkboxContainer: {
    justifyContent: "center",
    marginRight: 12,
  },
  // 일정 헤더 스타일
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  scheduleTitleContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: "#868e96",
    marginTop: 4,
  },
  checkModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#F1F3F5",
    borderRadius: 8,
    marginLeft: 8,
  },
  checkModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  checkModeButtonTextActive: {
    color: "#fff",
  },
});
