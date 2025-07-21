// src/components/AddScheduleModal.js
// AddScheduleModal.js 맨 윗줄
console.log("MODAL   MOUNT", Date.now());

import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddScheduleModal({
  visible,
  onClose,
  onSave,
  editingSchedule,
}) {
  const [newSchedule, setNewSchedule] = useState({
    startTime: "",
    endTime: "",
    task: "",
    reminder: false,
    reminderMinutes: 30,
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // picker 전용 상태 추가 - 고정된 날짜 기준으로 시간만 관리
  const [startPickerTime, setStartPickerTime] = useState(() => {
    const fixedDate = new Date(2024, 0, 1, 9, 0, 0, 0); // 2024-01-01 09:00:00 고정
    return fixedDate;
  });
  const [endPickerTime, setEndPickerTime] = useState(() => {
    const fixedDate = new Date(2024, 0, 1, 18, 0, 0, 0); // 2024-01-01 18:00:00 고정
    return fixedDate;
  });

  useEffect(() => {
    if (editingSchedule) {
      setNewSchedule({
        id: editingSchedule.id,
        startTime: editingSchedule.startTime || "",
        endTime: editingSchedule.endTime || "",
        task: editingSchedule.task || "",
        reminder: editingSchedule.reminder || false,
        reminderMinutes: editingSchedule.reminderMinutes || 30,
      });
      
      // picker 상태도 함께 업데이트
      if (editingSchedule.startTime) {
        setStartPickerTime(getTimeFromString(editingSchedule.startTime));
      }
      if (editingSchedule.endTime) {
        setEndPickerTime(getTimeFromString(editingSchedule.endTime));
      }
    } else {
      setNewSchedule({
        startTime: "",
        endTime: "",
        task: "",
        reminder: false,
        reminderMinutes: 30,
      });
      
      // picker 상태 초기화
      setStartPickerTime(new Date(2024, 0, 1, 9, 0, 0, 0));
      setEndPickerTime(new Date(2024, 0, 1, 18, 0, 0, 0));
    }
  }, [editingSchedule, visible]);

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const getTimeFromString = (timeString) => {
    // 고정된 날짜(2024-01-01)를 기준으로 시간만 설정
    const date = new Date(2024, 0, 1, 9, 0, 0, 0);
    if (typeof timeString === "string" && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":").map(Number);
      date.setHours(hours || 9);
      date.setMinutes(minutes || 0);
      date.setSeconds(0);
      date.setMilliseconds(0);
    }
    return date;
  };

  // picker 값은 별도 상태에서 관리 (더 이상 매번 재계산하지 않음)

  const handleSubmit = async () => {
    // ... (handleSubmit logic remains unchanged)
    if (!newSchedule.startTime || !newSchedule.endTime || !newSchedule.task) {
      Alert.alert("알림", "모든 항목을 입력해주세요.");
      return;
    }
    const [startHour, startMinute] = newSchedule.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = newSchedule.endTime.split(":").map(Number);
    const startInMin = startHour * 60 + startMinute;
    const endInMin = endHour * 60 + endMinute;

    if (endInMin <= startInMin) {
      Alert.alert("시간 오류", "종료 시간은 시작 시간보다 나중이어야 합니다.");
      return;
    }

    try {
      const scheduleToSave = editingSchedule
        ? { ...newSchedule } // newSchedule already has the id from useEffect
        : {
            ...newSchedule,
            id: `schedule-${new Date().toISOString()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          };
      const success = await onSave(scheduleToSave);
      if (success) {
        // Resetting state after save is handled by useEffect when modal closes/re-opens
      }
    } catch (err) {
      console.error("Schedule save error:", err);
      Alert.alert("오류", "일정 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingSchedule ? "일정 수정" : "새 일정"}
                </Text>

                {/* 시작 시간 */}
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !newSchedule.startTime && styles.placeholderText,
                    ]}
                  >
                    {newSchedule.startTime || "시작 시간 선택"}
                  </Text>
                </TouchableOpacity>

                {showStartPicker && (
                  <DateTimePicker
                    value={startPickerTime}
                    mode="time"
                    is24Hour
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (event.type === "dismissed") {
                        setShowStartPicker(false);
                        return;
                      }

                      if (selectedTime) {
                        // picker 상태 업데이트
                        setStartPickerTime(selectedTime);
                        // 화면 표시용 시간 문자열 업데이트
                        setNewSchedule((prev) => ({
                          ...prev,
                          startTime: formatTime(selectedTime),
                        }));
                      }

                      if (Platform.OS === "android") {
                        setShowStartPicker(false);
                      }
                    }}
                  />
                )}

                {/* 종료 시간 */}
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !newSchedule.endTime && styles.placeholderText,
                    ]}
                  >
                    {newSchedule.endTime || "종료 시간 선택"}
                  </Text>
                </TouchableOpacity>

                {showEndPicker && (
                  <DateTimePicker
                    value={endPickerTime}
                    mode="time"
                    is24Hour
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (event.type === "dismissed") {
                        setShowEndPicker(false);
                        return;
                      }

                      if (selectedTime) {
                        // picker 상태 업데이트
                        setEndPickerTime(selectedTime);
                        // 화면 표시용 시간 문자열 업데이트
                        setNewSchedule((prev) => ({
                          ...prev,
                          endTime: formatTime(selectedTime),
                        }));
                      }

                      if (Platform.OS === "android") {
                        setShowEndPicker(false);
                      }
                    }}
                  />
                )}

                {/* 일정 내용 */}
                <TextInput
                  style={[styles.input, styles.taskInput]}
                  value={newSchedule.task}
                  onChangeText={(text) =>
                    setNewSchedule((prev) => ({ ...prev, task: text }))
                  }
                  placeholder="일정 내용"
                  multiline
                />

                {/* 버튼 */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  placeholderText: {
    color: "#9E9E9E",
  },
  activeReminderButton: {
    backgroundColor: "#50cebb",
    borderColor: "#50cebb",
  },
  reminderTimeText: {
    fontSize: 13,
    color: "#333333",
  },
  activeReminderText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  inputText: {
    fontSize: 16,
    color: "#495057",
  },
  taskInput: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 더 진한 배경 오버레이
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 24,
    width: 250,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#333333",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  saveButton: {
    backgroundColor: "#333333",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  saveButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#333333",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
