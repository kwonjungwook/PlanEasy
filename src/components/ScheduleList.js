// src/components/ScheduleList.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ScheduleList = ({ schedule, onEditTask, onDeleteTask }) => {
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const sortedSchedule = [...schedule].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  return (
    <View style={styles.container}>
      {sortedSchedule.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{task.startTime}</Text>
            <Text style={styles.timeText}>~</Text>
            <Text style={styles.timeText}>{task.endTime}</Text>
          </View>
          <View style={styles.taskContent}>
            <Text style={styles.taskText}>{task.task}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEditTask(task)}
            >
              <Text style={styles.buttonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDeleteTask(task.id)}
            >
              <Text style={styles.buttonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginHorizontal: 10,
  },  
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#50cebb',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
},
dateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
},
scheduleItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    overflow: 'hidden',
    ...Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
        },
        android: {
            elevation: 2,
        },
    }),
},
timeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
},
timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',  // 검정색으로 변경
},
taskContainer: {
    padding: 16,
},
taskText: {
    fontSize: 17,
    color: '#333333',
    fontWeight: '500',
},
addButton: {
    backgroundColor: '#333333',  // 검정색 배경
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',  // 하단에 고정
    marginBottom: 16,
    ...Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 3,
        },
    }),
},
addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
}
});

export default ScheduleList;