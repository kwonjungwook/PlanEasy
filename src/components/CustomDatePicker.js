// src/components/CustomDatePicker.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// Get the window dimensions for responsive styling
const { width } = Dimensions.get('window');

/**
 * A custom date picker component to replace the native DateTimePicker
 * This is a JavaScript-only solution that works in Expo Go
 */
const CustomDatePicker = ({ 
  visible, 
  onClose, 
  onSelect, 
  initialDate = new Date() 
}) => {
  // State for the currently selected date
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
  
  // State for the year and month being viewed
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  
  // Generate years array (from current year - 5 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);
  
  // Months array
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  // Get days in the selected month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Generate days array for the current view month
  const generateDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    
    // Get the day of week for the 1st of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Create array for all days in the month plus empty spots for padding
    const days = [];
    
    // Add empty spaces for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add the actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  // Handle month navigation
  const changeMonth = (increment) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setViewDate(newDate);
  };
  
  // Handle selecting a day
  const selectDay = (day) => {
    if (day === null) return;
    
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };
  
  // Handle selecting a month
  const selectMonth = (month) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(month);
    setViewDate(newDate);
  };
  
  // Handle selecting a year
  const selectYear = (year) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
  };
  
  // Get styles for a date cell
  const getDateCellStyle = (day) => {
    if (day === null) return [styles.dayCell, styles.emptyCellStyle];
    
    const isToday = 
      new Date().getDate() === day && 
      new Date().getMonth() === viewDate.getMonth() && 
      new Date().getFullYear() === viewDate.getFullYear();
    
    const isSelected = 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === viewDate.getMonth() && 
      selectedDate.getFullYear() === viewDate.getFullYear();
    
    return [
      styles.dayCell,
      isToday && styles.todayCell,
      isSelected && styles.selectedCell
    ];
  };
  
  // Get text style for a date cell
  const getDateTextStyle = (day) => {
    if (day === null) return styles.dayText;
    
    const isToday = 
      new Date().getDate() === day && 
      new Date().getMonth() === viewDate.getMonth() && 
      new Date().getFullYear() === viewDate.getFullYear();
    
    const isSelected = 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === viewDate.getMonth() && 
      selectedDate.getFullYear() === viewDate.getFullYear();
    
    return [
      styles.dayText,
      isToday && styles.todayText,
      isSelected && styles.selectedText
    ];
  };
  
  // Render the calendar grid
  const renderCalendarGrid = () => {
    const days = generateDays();
    
    // Create the weekday headers
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    
    return (
      <View style={styles.calendarContainer}>
        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {weekdays.map((day, index) => (
            <Text key={`weekday-${index}`} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={`day-${index}`}
              style={getDateCellStyle(day)}
              onPress={() => day !== null && selectDay(day)}
              disabled={day === null}
            >
              {day !== null && (
                <Text style={getDateTextStyle(day)}>{day}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  // Handle confirming the date selection
  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };
  
  // Render the picker view (year, month, or day)
  const renderCalendarView = () => {
    return (
      <View style={styles.calendarViewContainer}>
        {/* Calendar header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => changeMonth(-1)}
          >
            <Text style={styles.navigationText}>{"<"}</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <TouchableOpacity onPress={() => selectYear(viewDate.getFullYear())}>
              <Text style={styles.headerYear}>
                {viewDate.getFullYear()}년
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectMonth(viewDate.getMonth())}>
              <Text style={styles.headerMonth}>
                {viewDate.getMonth() + 1}월
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => changeMonth(1)}
          >
            <Text style={styles.navigationText}>{">"}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Calendar grid */}
        {renderCalendarGrid()}
      </View>
    );
  };
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header section */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>날짜 선택</Text>
            <Text style={styles.selectedDateText}>
              {format(selectedDate, 'yyyy년 MM월 dd일')}
            </Text>
          </View>
          
          {/* Calendar section */}
          {renderCalendarView()}
          
          {/* Footer buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#50cebb',
    fontWeight: '500',
  },
  calendarViewContainer: {
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerYear: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  headerMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  navigationButton: {
    padding: 8,
  },
  navigationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#50cebb',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
    fontSize: 14,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyCellStyle: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  todayCell: {
    backgroundColor: '#e6f7f5',
    borderRadius: 18,
  },
  todayText: {
    fontWeight: 'bold',
    color: '#50cebb',
  },
  selectedCell: {
    backgroundColor: '#50cebb',
    borderRadius: 18,
  },
  selectedText: {
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#50cebb',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default CustomDatePicker;