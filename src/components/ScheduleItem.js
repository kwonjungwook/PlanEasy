// src/components/ScheduleItem.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    TextInput,
    Pressable,
    Animated,
    Alert,
    ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const SCHEDULE_COLORS = [
    { bg: '#E9F5FF', border: '#4299E1', text: '#2B6CB0' }, // 파랑
    { bg: '#F0FFF4', border: '#48BB78', text: '#2F855A' }, // 초록
    { bg: '#FFF5F5', border: '#FC8181', text: '#C53030' }, // 빨강
    { bg: '#FAF5FF', border: '#9F7AEA', text: '#553C9A' }, // 보라
    { bg: '#FFFAF0', border: '#F6AD55', text: '#C05621' }, // 주황
];

export default function ScheduleItem({
    schedule,
    editingSchedule,
    handleEdit,
    handleDelete,
    handleSave,
    index = 0
}) {
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [localSchedule, setLocalSchedule] = useState(schedule);
    const [longPressAnim] = useState(new Animated.Value(1));

    // 색상 순환
    const colorIndex = index % SCHEDULE_COLORS.length;
    const colorScheme = SCHEDULE_COLORS[colorIndex];

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        return date;
    };

    const handleTimeChange = (event, selectedDate, isStart) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
            setShowEndPicker(false);
        }

        if (selectedDate) {
            const timeString = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
            setLocalSchedule(prev => ({
                ...prev,
                [isStart ? 'startTime' : 'endTime']: timeString
            }));
        }
    };

    const handleLongPress = () => {
        Animated.sequence([
            Animated.timing(longPressAnim, {
                toValue: 0.95,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(longPressAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        Alert.alert(
            '일정 관리',
            '선택한 일정을 관리합니다.',
            [
                {
                    text: '수정',
                    onPress: () => handleEdit(schedule)
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => handleDelete(schedule.id)
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    };

    const TimePickerModal = ({ isVisible, onClose, isStart, currentValue }) => {
        const [hours, setHours] = useState(currentValue ? parseInt(currentValue.split(':')[0]) : 0);
        const [minutes, setMinutes] = useState(currentValue ? parseInt(currentValue.split(':')[1]) : 0);

        const timeNumbers = {
            hours: Array.from({ length: 24 }, (_, i) => i),
            minutes: Array.from({ length: 60 }, (_, i) => i)
        };

        const handleConfirm = () => {
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            // 시간 검증 (종료 시간을 설정하는 경우에만)
            if (!isStart) {
                const [startHour, startMinute] = localSchedule.startTime.split(':').map(Number);
                const startTimeInMinutes = startHour * 60 + startMinute;
                const endTimeInMinutes = hours * 60 + minutes;

                if (endTimeInMinutes <= startTimeInMinutes) {
                    Alert.alert('시간 오류', '종료 시간은 시작 시간보다 나중이어야 합니다.');
                    return;
                }
            }

            setLocalSchedule(prev => ({
                ...prev,
                [isStart ? 'startTime' : 'endTime']: timeString
            }));
            onClose();
        };

        if (!isVisible) return null;

        return (
            <Modal
                transparent={true}
                visible={isVisible}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modernPickerContainer}>
                        <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.cancelText}>취소</Text>
                            </TouchableOpacity>
                            <Text style={styles.pickerTitle}>
                                {isStart ? '시작 시간' : '종료 시간'} 선택
                            </Text>
                            <TouchableOpacity onPress={handleConfirm}>
                                <Text style={styles.doneText}>완료</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modernPickerContent}>
                            <View style={styles.wheelColumn}>
                                <Text style={styles.wheelLabel}>시</Text>
                                <ScrollView
                                    style={styles.wheel}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {timeNumbers.hours.map((h) => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[
                                                styles.wheelItem,
                                                hours === h && styles.wheelItemSelected
                                            ]}
                                            onPress={() => setHours(h)}
                                        >
                                            <Text style={[
                                                styles.wheelItemText,
                                                hours === h && styles.wheelItemTextSelected
                                            ]}>
                                                {h.toString().padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.wheelColumn}>
                                <Text style={styles.wheelLabel}>분</Text>
                                <ScrollView
                                    style={styles.wheel}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {timeNumbers.minutes.map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.wheelItem,
                                                minutes === m && styles.wheelItemSelected
                                            ]}
                                            onPress={() => setMinutes(m)}
                                        >
                                            <Text style={[
                                                styles.wheelItemText,
                                                minutes === m && styles.wheelItemTextSelected
                                            ]}>
                                                {m.toString().padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (editingSchedule?.id === schedule.id) {
        return (
            <View style={styles.editContainer}>
                <View style={styles.timeContainer}>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Text style={styles.timeButtonText}>
                            {localSchedule.startTime || '시작 시간'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.timeSeperator}>~</Text>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Text style={styles.timeButtonText}>
                            {localSchedule.endTime || '종료 시간'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TimePickerModal
                    isVisible={showStartPicker}
                    onClose={() => setShowStartPicker(false)}
                    isStart={true}
                    currentValue={localSchedule.startTime}
                />
                <TimePickerModal
                    isVisible={showEndPicker}
                    onClose={() => setShowEndPicker(false)}
                    isStart={false}
                    currentValue={localSchedule.endTime}
                />

                <TextInput
                    style={styles.input}
                    value={localSchedule.task}
                    onChangeText={(text) => setLocalSchedule(prev => ({ ...prev, task: text }))}
                    placeholder="일정을 입력하세요"
                    placeholderTextColor="#A0AEC0"
                />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={() => {
                            // 시간 검증 로직 추가
                            const [startHour, startMinute] = localSchedule.startTime.split(':').map(Number);
                            const [endHour, endMinute] = localSchedule.endTime.split(':').map(Number);

                            // 시작 시간과 종료 시간을 분 단위로 변환하여 비교
                            const startTimeInMinutes = startHour * 60 + startMinute;
                            const endTimeInMinutes = endHour * 60 + endMinute;

                            if (endTimeInMinutes <= startTimeInMinutes) {
                                Alert.alert('시간 오류', '종료 시간은 시작 시간보다 나중이어야 합니다.');
                                return;
                            }

                            handleSave(localSchedule);
                        }}
                    >
                        <Text style={styles.saveButtonText}>저장</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: longPressAnim }],
                    backgroundColor: colorScheme.bg,
                    borderColor: colorScheme.border,
                }
            ]}
        >
            <Pressable
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={({ pressed }) => [
                    styles.scheduleContent,
                    pressed && styles.pressed
                ]}
            >
                <View style={styles.scheduleHeader}>
                    <View style={[styles.timeIndicator, { backgroundColor: colorScheme.border }]} />
                    <Text style={[styles.timeText, { color: colorScheme.text }]}>
                        {schedule.startTime} ~ {schedule.endTime}
                    </Text>
                </View>
                <Text style={[styles.taskText, { color: colorScheme.text }]}>{schedule.task}</Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    editContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    scheduleContent: {
        padding: 16,
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeIndicator: {
        width: 4,
        height: 16,
        borderRadius: 2,
        marginRight: 8,
    },
    pressed: {
        opacity: 0.8,
    },
    // Time Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modernPickerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modernPickerContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
        height: 200,
    },
    wheelColumn: {
        alignItems: 'center',
        marginHorizontal: 20,
    },
    wheelLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 8,
    },
    wheel: {
        height: 150,
    },
    wheelItem: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    wheelItemSelected: {
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
    },
    wheelItemText: {
        fontSize: 20,
        color: '#718096',
    },
    wheelItemTextSelected: {
        color: '#2D3748',
        fontWeight: '600',
    },
    pickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2D3748',
    },
    cancelText: {
        color: '#718096',
        fontSize: 16,
    },
    doneText: {
        color: '#50cebb',
        fontSize: 16,
        fontWeight: '600',
    },
    // Existing styles...
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeButton: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timeButtonText: {
        fontSize: 16,
        color: '#2D3748',
        textAlign: 'center',
        fontWeight: '500',
    },
    timeSeperator: {
        marginHorizontal: 12,
        fontSize: 18,
        color: '#718096',
        fontWeight: '500',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    taskText: {
        fontSize: 15,
        lineHeight: 22,
        marginTop: 4,
    },
    input: {
        backgroundColor: '#F7FAFC',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#EDF2F7',
    },
    saveButton: {
        backgroundColor: '#50cebb',
    },
    cancelButtonText: {
        color: '#4A5568',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    }
});