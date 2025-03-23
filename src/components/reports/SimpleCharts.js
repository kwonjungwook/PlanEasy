// src/components/reports/SimpleCharts.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 40;

// 일간 리포트용 시간대별 바 차트
export const DailyStudyChart = ({ studySessions }) => {
  // 시간대별 데이터 준비 (4시간 간격으로 그룹화)
  const timeSlots = [
    { label: '새벽 (0-4시)', hours: [0, 1, 2, 3], value: 0 },
    { label: '오전 (4-8시)', hours: [4, 5, 6, 7], value: 0 },
    { label: '오전 (8-12시)', hours: [8, 9, 10, 11], value: 0 },
    { label: '오후 (12-16시)', hours: [12, 13, 14, 15], value: 0 },
    { label: '오후 (16-20시)', hours: [16, 17, 18, 19], value: 0 },
    { label: '밤 (20-24시)', hours: [20, 21, 22, 23], value: 0 }
  ];
  
  // 세션 데이터로 시간대별 분포 계산
  if (Array.isArray(studySessions)) {
    studySessions.forEach(session => {
      if (session.timestamp) {
        const hour = new Date(session.timestamp).getHours();
        const slot = timeSlots.find(slot => slot.hours.includes(hour));
        if (slot) {
          slot.value += session.duration / 60; // 분 단위로 변환
        }
      }
    });
  }
  
  // 비어있는지 확인
  const hasData = timeSlots.some(slot => slot.value > 0);
  
  if (!hasData) {
    return (
      <View style={styles.emptyChartContainer}>
        <Text style={styles.emptyChartText}>아직 기록된 학습 데이터가 없습니다.</Text>
      </View>
    );
  }

  // 최대값 찾기
  const maxValue = Math.max(...timeSlots.map(slot => slot.value));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>시간대별 학습 분포</Text>
      <View style={styles.barChartContainer}>
        {timeSlots.map((slot, index) => {
          const percentage = maxValue > 0 ? (slot.value / maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barChartItem}>
              <Text style={styles.barChartLabel}>{slot.label}</Text>
              <View style={styles.barOuterContainer}>
                <View 
                  style={[
                    styles.barInner, 
                    { 
                      width: `${percentage}%`,
                      backgroundColor: getBarColor(index)
                    }
                  ]}
                />
              </View>
              <Text style={styles.barChartValue}>{Math.round(slot.value)}분</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// 주간 리포트용 일별 바 차트
export const WeeklyStudyChart = ({ dailyStudyTime }) => {
  if (!dailyStudyTime || Object.keys(dailyStudyTime).length === 0) {
    return (
      <View style={styles.emptyChartContainer}>
        <Text style={styles.emptyChartText}>아직 기록된 학습 데이터가 없습니다.</Text>
      </View>
    );
  }

  // 요일 데이터 준비
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  const dayData = dayLabels.map(day => ({
    label: day,
    value: 0
  }));
  
  // 데이터 매핑
  Object.entries(dailyStudyTime).forEach(([date, duration]) => {
    const dayIndex = new Date(date).getDay();
    dayData[dayIndex].value += duration / 3600; // 시간 단위로 변환
  });
  
  // 최대값 찾기
  const maxValue = Math.max(...dayData.map(day => day.value));
  
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>일별 학습 시간</Text>
      <View style={styles.columnChartContainer}>
        {dayData.map((day, index) => {
          const percentage = maxValue > 0 ? (day.value / maxValue) * 80 : 0; // 80%까지만 차지하도록
          const displayValue = Math.round(day.value * 10) / 10; // 소수점 첫째자리까지
          
          return (
            <View key={index} style={styles.columnChartItem}>
              <View style={styles.columnChartBarContainer}>
                <View style={[styles.columnFill, { height: `${percentage}%` }]} />
              </View>
              <Text style={styles.columnChartValue}>{displayValue > 0 ? `${displayValue}h` : '-'}</Text>
              <Text style={styles.columnChartLabel}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// 월간 리포트용 과목별 점유율 차트
export const MonthlySubjectChart = ({ subjectAnalysis }) => {
  if (!subjectAnalysis || Object.keys(subjectAnalysis).length === 0) {
    return (
      <View style={styles.emptyChartContainer}>
        <Text style={styles.emptyChartText}>아직 기록된 학습 데이터가 없습니다.</Text>
      </View>
    );
  }

  // 데이터 변환 (상위 5개만 표시)
  const totalSeconds = Object.values(subjectAnalysis).reduce((sum, val) => sum + val, 0);
  
  const subjects = Object.entries(subjectAnalysis)
    .map(([subject, seconds]) => ({
      subject,
      hours: Math.round((seconds / 3600) * 10) / 10,
      percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5); // 상위 5개만

  // 데이터가 있는지 확인
  if (subjects.length === 0) {
    return (
      <View style={styles.emptyChartContainer}>
        <Text style={styles.emptyChartText}>아직 기록된 학습 데이터가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>과목별 학습 시간 비율</Text>
      <View style={styles.pieChartAlternative}>
        {subjects.map((item, index) => (
          <View key={index} style={styles.pieChartItem}>
            <View style={[styles.pieColorIndicator, { backgroundColor: getSubjectColor(index) }]} />
            <Text style={styles.pieSubjectText}>{item.subject}</Text>
            <Text style={styles.pieHoursText}>{item.hours}시간</Text>
            <Text style={styles.piePercentText}>{item.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 색상 생성 함수들
const getBarColor = (index) => {
  const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#4285F4', '#34A853'];
  return colors[index % colors.length];
};

const getSubjectColor = (index) => {
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0', '#FF5722'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center'
  },
  emptyChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  
  // 수평 바 차트 스타일 (일간)
  barChartContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  barChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barChartLabel: {
    width: 100,
    fontSize: 12,
    color: '#666',
  },
  barOuterContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barInner: {
    height: '100%',
    borderRadius: 8,
  },
  barChartValue: {
    width: 40,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  
  // 세로 바 차트 스타일 (주간)
  columnChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
    paddingBottom: 10,
  },
  columnChartItem: {
    flex: 1,
    alignItems: 'center',
  },
  columnChartBarContainer: {
    width: 24,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  columnFill: {
    width: '100%',
    backgroundColor: '#50cebb',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  columnChartValue: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  columnChartLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  
  // 원형 차트 대체 스타일 (월간)
  pieChartAlternative: {
    marginTop: 10,
    marginBottom: 10,
  },
  pieChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pieColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  pieSubjectText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  pieHoursText: {
    width: 60,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginRight: 10,
  },
  piePercentText: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#50cebb',
    textAlign: 'right',
  }
});

export default {
  DailyStudyChart,
  WeeklyStudyChart,
  MonthlySubjectChart
};