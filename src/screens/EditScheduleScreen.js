// src/screens/EditScheduleScreen.js
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddScheduleModal from "../components/AddScheduleModal";
import ScheduleItem from "../components/ScheduleItem";
import { usePlanner } from "../context/PlannerContext";

export default function EditScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const { updateSchedule, schedules: allSchedules } = usePlanner();

  // useEffect로 params 확인
  useEffect(() => {
    // 디버깅 코드
    console.log("Params received:", params);
    console.log("Schedules type:", typeof params?.schedules);
    if (params?.schedules) {
      try {
        console.log("Parsed schedules:", JSON.parse(params.schedules));
      } catch (e) {
        console.error("Parse error:", e, params.schedules);
      }
    }
  }, [params]);

  // params에서 데이터 추출 (한 번만 선언)
  const date = params?.date;
  const initialSchedules = params?.schedules
    ? JSON.parse(params.schedules)
    : [];

  const [daySchedules, setDaySchedules] = useState(() => {
    try {
      return params?.schedules ? JSON.parse(params.schedules) : [];
    } catch (e) {
      console.error("Failed to parse schedules:", e);
      return [];
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

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

  const handleEdit = (schedule) => {
    setEditingSchedule({
      ...schedule,
      isEditing: true,
    });
    setShowAddModal(true); // 모달을 통해 편집하도록 변경
  };

  const handleSave = async (schedule) => {
    try {
      const updatedSchedules = daySchedules.map((s) =>
        s.id === schedule.id ? { ...schedule, isEditing: false } : s
      );
      await updateSchedule(date, updatedSchedules); // ← 컨텍스트 저장
      setDaySchedules(updatedSchedules);
      setEditingSchedule(null);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("오류", "일정 수정 중 오류가 발생했습니다.");
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule({
      id: `${date}-${Date.now()}`,
      startTime: "",
      endTime: "",
      task: "",
      isEditing: true,
    });
    setShowAddModal(true); // 모달 열기 추가
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{date}</Text>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              Alert.alert("완료", "일정 수정을 완료하시겠습니까?", [
                {
                  text: "취소",
                  style: "cancel",
                },
                {
                  text: "확인",
                  onPress: () => navigation.goBack(), // router.back()에서 수정
                },
              ]);
            }}
          >
            <Text style={styles.completeButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {daySchedules.map((schedule, index) => (
          <ScheduleItem
            key={schedule.id || index}
            schedule={schedule}
            index={index} // index prop 추가
            editingSchedule={editingSchedule}
            setEditingSchedule={setEditingSchedule}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleSave={handleSave}
          />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
        <Text style={styles.addButtonText}>+ 새 일정 추가</Text>
      </TouchableOpacity>

      <AddScheduleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        editingSchedule={editingSchedule} // 편집할 일정 데이터 전달
        onSave={async (newSchedule) => {
          try {
            const scheduleToAdd = {
              ...newSchedule,
              id: newSchedule.id || `${date}-${Date.now()}`,
            };
            const updatedSchedules = [...daySchedules, scheduleToAdd];
            await updateSchedule(date, updatedSchedules);

            setDaySchedules(updatedSchedules);
            setShowAddModal(false);
            setEditingSchedule(null); // 편집 상태 초기화
          } catch (error) {
            console.error("Error adding schedule:", error);
            Alert.alert("오류", "일정 추가 중 오류가 발생했습니다.");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
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
    color: "#212529",
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#50cebb",
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    backgroundColor: "#50cebb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
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
});
