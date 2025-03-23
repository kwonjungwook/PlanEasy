// src/screens/CalendarEditor.js
import React, { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { usePlanner } from "../context/PlannerContext";
import AddScheduleModal from "../components/AddScheduleModal";
import ScheduleItem from "../components/ScheduleItem";

const { width, height } = Dimensions.get("window");

// 색상 테마 정의
const COLORS = {
  primary: "#50cebb",
  secondary: "#4284F3",
  danger: "#EA4335",
  success: "#34A853",
  warning: "#FBBC04",
  info: "#4A90E2",
  light: "#F8F9FA",
  dark: "#212529",
  gray: "#868e96",
  border: "#E9ECEF",
  background: "#F8F9FA",
  scheduleColors: [
    { main: "#4284F3", bg: "#E9F2FF" }, // 파랑
    { main: "#34A853", bg: "#E6F7ED" }, // 초록
    { main: "#EA4335", bg: "#FDEBE9" }, // 빨강
    { main: "#9C27B0", bg: "#F4E6F8" }, // 보라
    { main: "#FF7043", bg: "#FFEDE6" }, // 주황
    { main: "#12B886", bg: "#E6F8F3" }, // 청록
  ],
};

export default function EditScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const { updateSchedule, schedules: allSchedules } = usePlanner();

  // 날짜 정보 가져오기
  const date = params?.date;

  // 일정 상태 초기화
  const [daySchedules, setDaySchedules] = useState(() => {
    try {
      return params?.schedules ? JSON.parse(params.schedules) : [];
    } catch (e) {
      console.error("Failed to parse schedules:", e);
      return [];
    }
  });

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // 선택 모드 관련 상태
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  // 스크롤 상태
  const [scrollPosition, setScrollPosition] = useState(0);

  // 스크롤 이벤트 핸들러
  const handleScroll = (event) => {
    const position = event.nativeEvent.contentOffset.y;
    setScrollPosition(position);
  };

  // 한 개의 일정 삭제 핸들러
  const handleDelete = async (scheduleId) => {
    Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const newSchedules = daySchedules.filter((s) => s.id !== scheduleId);
          try {
            await updateSchedule(date, newSchedules);
            setDaySchedules(newSchedules);
            if (newSchedules.length === 0) {
              navigation.goBack();
            }
          } catch (error) {
            Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 편집 모드 활성화 핸들러
  const handleEdit = (schedule) => {
    if (isSelecting) {
      // 선택 모드에서는 체크박스 토글
      toggleScheduleSelection(schedule.id);
    } else {
      // 일반 모드에서는 편집 모달 열기
      setEditingSchedule({
        ...schedule,
        isEditing: true,
      });
      setShowAddModal(true);
    }
  };

  // 일정 저장 핸들러
  const handleSave = async (schedule) => {
    try {
      // 편집 중인 일정을 찾아 업데이트
      let updatedSchedules;

      if (editingSchedule && !daySchedules.some((s) => s.id === schedule.id)) {
        // 새 일정 추가
        updatedSchedules = [...daySchedules, { ...schedule, isEditing: false }];
      } else {
        // 기존 일정 수정
        updatedSchedules = daySchedules.map((s) =>
          s.id === schedule.id ? { ...schedule, isEditing: false } : s
        );
      }

      // 일정 업데이트 저장
      await updateSchedule(date, updatedSchedules);
      setDaySchedules(updatedSchedules);
      setEditingSchedule(null);
      setShowAddModal(false);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("오류", "일정 수정 중 오류가 발생했습니다.");
    }
  };

  // 새 일정 추가 핸들러
  const handleAddSchedule = () => {
    setEditingSchedule({
      id: `${date}-${Date.now()}`,
      startTime: "",
      endTime: "",
      task: "",
      isEditing: true,
    });
    setShowAddModal(true);
  };

  // 선택 모드 토글 핸들러
  const toggleSelectionMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedSchedules([]);
  };

  // 일정 선택 토글 핸들러
  const toggleScheduleSelection = (id) => {
    setSelectedSchedules((prev) => {
      if (prev.includes(id)) {
        return prev.filter((scheduleId) => scheduleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 선택된 일정 삭제 핸들러
  const deleteSelectedSchedules = async () => {
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
            const newSchedules = daySchedules.filter(
              (schedule) => !selectedSchedules.includes(schedule.id)
            );

            try {
              await updateSchedule(date, newSchedules);
              setDaySchedules(newSchedules);
              setSelectedSchedules([]);
              setIsSelecting(false);

              if (newSchedules.length === 0) {
                navigation.goBack();
              }
            } catch (error) {
              console.error("Error deleting schedules:", error);
              Alert.alert("오류", "일정 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  // 색상 가져오기 (인덱스에 따라)
  const getColorByIndex = (index) => {
    return COLORS.scheduleColors[index % COLORS.scheduleColors.length];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{date}</Text>

            {/* 선택 모드 토글 버튼 */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                isSelecting && styles.selectButtonActive,
              ]}
              onPress={toggleSelectionMode}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  isSelecting && styles.selectButtonTextActive,
                ]}
              >
                {isSelecting ? "취소" : "선택"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 선택 모드 액션 바 */}
          {isSelecting && selectedSchedules.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionCount}>
                {selectedSchedules.length}개 선택됨
              </Text>
              <TouchableOpacity
                style={styles.deleteSelectedButton}
                onPress={deleteSelectedSchedules}
              >
                <Text style={styles.deleteSelectedButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 일정 목록 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {daySchedules.length > 0 ? (
            daySchedules.map((schedule, index) => {
              const color = getColorByIndex(index);
              const isSelected = selectedSchedules.includes(schedule.id);

              return (
                <TouchableOpacity
                  key={schedule.id || index}
                  style={[
                    styles.scheduleCard,
                    { backgroundColor: color.bg },
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => handleEdit(schedule)}
                  activeOpacity={0.7}
                >
                  {isSelecting && (
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && {
                            backgroundColor: color.main,
                            borderColor: color.main,
                          },
                        ]}
                      >
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>
                  )}

                  <View
                    style={[
                      styles.scheduleIndicator,
                      { backgroundColor: color.main },
                    ]}
                  />

                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleTime, { color: color.main }]}>
                      {schedule.startTime} ~ {schedule.endTime}
                    </Text>
                    <Text style={styles.scheduleText}>
                      {schedule.task || "-"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
              <Text style={styles.emptySubText}>
                아래 버튼을 눌러 새 일정을 추가해보세요
              </Text>
            </View>
          )}

          {/* 버튼 영역 확보를 위한 여백 */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 새 일정 추가 버튼 */}
        <TouchableOpacity
          style={[
            styles.addButton,
            { opacity: scrollPosition > 100 ? 0.9 : 1 },
          ]}
          onPress={handleAddSchedule}
        >
          <Text style={styles.addButtonText}>+ 새 일정 추가</Text>
        </TouchableOpacity>

        {/* 일정 추가/편집 모달 */}
        <AddScheduleModal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingSchedule(null);
          }}
          editingSchedule={editingSchedule} // initialData → editingSchedule로 props 이름 변경
          onSave={handleSave}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.dark,
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  selectButtonTextActive: {
    color: "#fff",
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.light,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  deleteSelectedButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.danger,
    borderRadius: 16,
  },
  deleteSelectedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 160, // 하단 여백 늘림
  },
  scheduleCard: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
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
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  checkboxContainer: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  scheduleIndicator: {
    width: 6,
  },
  scheduleContent: {
    flex: 1,
    padding: 16,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "center",
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
  },
  addButton: {
    position: "absolute",
    bottom: 80, // 바닥에서 더 멀리
    right: 20,
    left: 20,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    zIndex: 999, // 높은 z-index로 항상 위에 표시
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8, // 높은 elevation으로 항상 위에 표시
      },
    }),
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
