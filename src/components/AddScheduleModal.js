// src/components/AddScheduleModal.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch // 추가
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddScheduleModal({ visible, onClose, onSave, editingSchedule }) {
    const [newSchedule, setNewSchedule] = useState({
        startTime: '',
        endTime: '',
        task: '',
        reminder: false, // 알림 활성화 여부
        reminderMinutes: 30 // 기본 30분 전 알림
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    
    // editingSchedule prop이 변경될 때마다 newSchedule 상태 업데이트
    useEffect(() => {
        if (editingSchedule) {
            console.log('Editing schedule:', editingSchedule);
            setNewSchedule({
                startTime: editingSchedule.startTime || '',
                endTime: editingSchedule.endTime || '',
                task: editingSchedule.task || '',
                reminder: editingSchedule.reminder || false,
                reminderMinutes: editingSchedule.reminderMinutes || 30
            });
        } else {
            // 새 일정 생성 시에는 초기값으로 리셋
            setNewSchedule({
                startTime: '',
                endTime: '',
                task: '',
                reminder: false,
                reminderMinutes: 30
            });
        }
    }, [editingSchedule, visible]);

    const formatTime = (date) => {
        if (!date) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const getTimeFromString = (timeString) => {
        const date = new Date();
        if (timeString && typeof timeString === 'string') {
            const [hours, minutes] = timeString.split(':').map(Number);
            date.setHours(hours || 0);
            date.setMinutes(minutes || 0);
        }
        return date;
    };

    const handleSubmit = async () => {
        if (!newSchedule.startTime || !newSchedule.endTime || !newSchedule.task) {
            Alert.alert('알림', '모든 항목을 입력해주세요.');
            return;
        }

        // 시간 검증 로직 추가
        const [startHour, startMinute] = newSchedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = newSchedule.endTime.split(':').map(Number);

        // 시작 시간과 종료 시간을 분 단위로 변환하여 비교
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        if (endTimeInMinutes <= startTimeInMinutes) {
            Alert.alert('시간 오류', '종료 시간은 시작 시간보다 나중이어야 합니다.');
            return;
        }

        try {
            // 편집 중인 일정이 있는 경우 ID 유지, 아니면 새 ID 생성
            const scheduleToSave = editingSchedule
                ? { ...newSchedule, id: editingSchedule.id }
                : {
                    ...newSchedule,
                    id: `schedule-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`
                  };

            const success = await onSave(scheduleToSave);
            if (success) {
                // 저장 성공 시만 초기화
                setNewSchedule({
                    startTime: '',
                    endTime: '',
                    task: '',
                    reminder: false,
                    reminderMinutes: 30
                });
            }
        } catch (error) {
            console.error('Schedule save error:', error);
            Alert.alert('오류', '일정 저장 중 오류가 발생했습니다.');
        }
    };

    const handleTimeSelect = (type, selectedTime) => {
        if (selectedTime) {
            const timeString = formatTime(selectedTime);
            setNewSchedule(prev => ({
                ...prev,
                [type]: timeString
            }));
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
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
                        onPress={e => e.stopPropagation()}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollViewContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>
                                    {editingSchedule ? '일정 수정' : '새 일정'}
                                </Text>

                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <Text style={[
                                        styles.inputText,
                                        !newSchedule.startTime && styles.placeholderText
                                    ]}>
                                        {newSchedule.startTime || '시작 시간 선택'}
                                    </Text>
                                </TouchableOpacity>

                                {showStartPicker && (
                                    <DateTimePicker
                                        value={getTimeFromString(newSchedule.startTime)}
                                        mode="time"
                                        is24Hour={true}
                                        display="spinner"
                                        onChange={(event, selectedTime) => {
                                            setShowStartPicker(false);
                                            if (selectedTime && event.type !== 'dismissed') {
                                                handleTimeSelect('startTime', selectedTime);
                                            }
                                        }}
                                    />
                                )}

                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowEndPicker(true)}
                                >
                                    <Text style={[
                                        styles.inputText,
                                        !newSchedule.endTime && styles.placeholderText
                                    ]}>
                                        {newSchedule.endTime || '종료 시간 선택'}
                                    </Text>
                                </TouchableOpacity>

                                {showEndPicker && (
                                    <DateTimePicker
                                        value={getTimeFromString(newSchedule.endTime)}
                                        mode="time"
                                        is24Hour={true}
                                        display="spinner"
                                        onChange={(event, selectedTime) => {
                                            setShowEndPicker(false);
                                            if (selectedTime && event.type !== 'dismissed') {
                                                handleTimeSelect('endTime', selectedTime);
                                            }
                                        }}
                                    />
                                )}

                                <TextInput
                                    style={[styles.input, styles.taskInput]}
                                    value={newSchedule.task}
                                    onChangeText={(text) => setNewSchedule(prev => ({ ...prev, task: text }))}
                                    placeholder="일정 내용"
                                    multiline
                                />

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
        color: '#9E9E9E',
    },
    activeReminderButton: {
        backgroundColor: '#50cebb',
        borderColor: '#50cebb',
    },
    reminderTimeText: {
        fontSize: 13,
        color: '#333333',
    },
    activeReminderText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    inputText: {
        fontSize: 16,
        color: '#495057'
    },
    taskInput: {
        height: 100,
        textAlignVertical: 'top'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',  // 더 진한 배경 오버레이
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
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
        fontWeight: '600',
        color: '#333333',
        marginBottom: 24,
        width: 250,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 6,
    },
    saveButton: {
        backgroundColor: '#333333',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    saveButtonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#333333',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    }
});