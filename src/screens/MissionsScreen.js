// src/screens/MissionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../context/ProgressContext';
import { ToastEventSystem } from "../components/common/AutoToast";

const MissionsScreen = ({ navigation }) => {
  const { 
    points, 
    addPoints,
    addXP,
    completedTasks,
    streak
  } = useProgress();
  
  // 미션 상태 관리
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  
  // 미션 데이터 생성 (실제로는 Context에서 관리하거나 API에서 가져오는 것이 좋습니다)
  useEffect(() => {
    // 일일 미션
    const generateDailyMissions = () => [
      {
        id: 'morning_task',
        title: '아침형 인간',
        description: '오전 9시 전에 일정 1개 이상 완료하기',
        reward: { points: 15, xp: 20 },
        icon: '🌅',
        completed: Math.random() < 0.5, // 예시용 랜덤 상태
        progress: Math.random() < 0.5 ? 1 : 0,
        total: 1
      },
      {
        id: 'triple_complete',
        title: '세 마리 토끼',
        description: '오늘 일정 3개 이상 완료하기',
        reward: { points: 20, xp: 30 },
        icon: '🐰',
        completed: completedTasks >= 3,
        progress: Math.min(completedTasks, 3),
        total: 3
      },
      {
        id: 'evening_plan',
        title: '내일 계획',
        description: '저녁에 내일 일정 2개 이상 추가하기',
        reward: { points: 10, xp: 15 },
        icon: '📝',
        completed: Math.random() < 0.3, // 예시용 랜덤 상태
        progress: Math.floor(Math.random() * 3), // 예시용 랜덤 진행도
        total: 2
      },
    ];
    
    // 주간 미션
    const generateWeeklyMissions = () => [
      {
        id: 'weekly_streak',
        title: '주간 연속 출석',
        description: '이번 주 7일 연속 출석하기',
        reward: { points: 50, xp: 100 },
        icon: '🔥',
        completed: streak >= 7,
        progress: Math.min(streak, 7),
        total: 7
      },
      {
        id: 'category_variety',
        title: '다재다능',
        description: '주간 5개 이상의 카테고리에서 일정 완료하기',
        reward: { points: 40, xp: 80 },
        icon: '🎯',
        completed: Math.random() < 0.4, // 예시용 랜덤 상태
        progress: Math.floor(1 + Math.random() * 5), // 예시용 랜덤 진행도
        total: 5
      },
      {
        id: 'perfect_days',
        title: '완벽한 주',
        description: '이번 주 3일 이상 모든 일정 완료하기',
        reward: { points: 70, xp: 120 },
        icon: '✨',
        completed: Math.random() < 0.2, // 예시용 랜덤 상태
        progress: Math.floor(Math.random() * 4), // 예시용 랜덤 진행도
        total: 3
      },
    ];
    
    setDailyMissions(generateDailyMissions());
    setWeeklyMissions(generateWeeklyMissions());
  }, [completedTasks, streak]);
  
  // 미션 완료 처리 함수
  const claimMissionReward = (mission) => {
    if (mission.completed && !mission.claimed) {
      // 보상 지급
      addPoints(mission.reward.points, `미션 보상: ${mission.title}`);
      addXP(mission.reward.xp, `미션 보상: ${mission.title}`);
      
      // 토스트 메시지 표시
      ToastEventSystem.showToast(
        `미션 완료! +${mission.reward.points}P, +${mission.reward.xp}XP`, 
        2000
      );
      
      // 미션 상태 업데이트
      if (mission.id.includes('daily')) {
        setDailyMissions(prev => 
          prev.map(m => m.id === mission.id ? {...m, claimed: true} : m)
        );
      } else {
        setWeeklyMissions(prev => 
          prev.map(m => m.id === mission.id ? {...m, claimed: true} : m)
        );
      }
    }
  };
  
  // 미션 렌더링 함수
  const renderMission = (mission) => (
    <TouchableOpacity
      key={mission.id}
      style={[
        styles.missionItem,
        mission.completed && styles.missionItemCompleted,
        mission.claimed && styles.missionItemClaimed
      ]}
      onPress={() => mission.completed && !mission.claimed && claimMissionReward(mission)}
      disabled={!mission.completed || mission.claimed}
    >
      <View style={styles.missionIconContainer}>
        <Text style={styles.missionIcon}>{mission.icon}</Text>
      </View>
      
      <View style={styles.missionContent}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDescription}>{mission.description}</Text>
        
        {/* 진행도 표시 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(mission.progress / mission.total) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {mission.progress}/{mission.total}
          </Text>
        </View>
      </View>
      
      <View style={styles.missionReward}>
        {mission.completed && !mission.claimed ? (
          <View style={styles.claimButton}>
            <Text style={styles.claimButtonText}>받기</Text>
          </View>
        ) : mission.claimed ? (
          <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>완료</Text>
          </View>
        ) : (
          <>
            <Text style={styles.rewardText}>+{mission.reward.points}P</Text>
            <Text style={styles.rewardXp}>+{mission.reward.xp}XP</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일일/주간 미션</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FAQ')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 일일 미션 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>📅</Text> 일일 미션
          </Text>
          
          {dailyMissions.map(renderMission)}
          
          <Text style={styles.sectionNote}>
            매일 자정에 초기화됩니다
          </Text>
        </View>
        
        {/* 주간 미션 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>🗓️</Text> 주간 미션
          </Text>
          
          {weeklyMissions.map(renderMission)}
          
          <Text style={styles.sectionNote}>
            매주 월요일 자정에 초기화됩니다
          </Text>
        </View>
        
        {/* 미션 혜택 설명 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>미션 혜택</Text>
          <Text style={styles.infoText}>
            • 일일 미션을 모두 완료하면 추가 25P와 35XP를 받습니다.{"\n"}
            • 주간 미션을 모두 완료하면 추가 100P와 150XP를 받습니다.{"\n"}
            • 미션 보상을 받으면 해당 미션의 진행도가 레벨업과 배지 획득에 반영됩니다.
          </Text>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// 스타일은 기존 코드 스타일을 따라갑니다
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionNote: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  missionItemCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  missionItemClaimed: {
    opacity: 0.7,
  },
  missionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  missionIcon: {
    fontSize: 20,
  },
  missionContent: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  missionDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007BFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#495057',
    width: 30,
    textAlign: 'right',
  },
  missionReward: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007BFF',
  },
  rewardXp: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
  },
  claimedBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  claimedText: {
    fontSize: 12,
    color: '#6C757D',
  },
  infoSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default MissionsScreen;