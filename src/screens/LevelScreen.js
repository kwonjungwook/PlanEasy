// src/screens/LevelScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../context/ProgressContext';

const LevelScreen = ({ navigation }) => {
  const { 
    level, 
    xp, 
    levelProgress,
    addXP,
    earnedBadges,
    ALL_BADGES,
    BADGE_RARITY
  } = useProgress();

  // 애니메이션 값
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Progress 애니메이션 시작
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: levelProgress.percentage / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [levelProgress.percentage]);

  // 레벨별 필요 XP 계산 헬퍼 함수
  const getRequiredXP = (lvl) => {
    return Math.floor(100 * lvl + Math.pow(lvl, 1.8) * 10);
  };

  // 레벨에 따른 이모지 결정
  const getLevelEmoji = (lvl) => {
    if (lvl < 5) return '🌱'; // 새싹
    if (lvl < 10) return '🌿'; // 식물
    if (lvl < 15) return '🍀'; // 클로버
    if (lvl < 20) return '🌴'; // 야자나무
    if (lvl < 30) return '🌲'; // 나무
    if (lvl < 50) return '🚀'; // 로켓
    if (lvl < 70) return '⭐'; // 별
    if (lvl < 90) return '🌟'; // 빛나는 별
    return '👑'; // 왕관
  };

  // 레벨별 색상 결정
  const getLevelColor = (lvl) => {
    if (lvl < 5) return '#8BC34A'; // 연두색
    if (lvl < 10) return '#4CAF50'; // 초록색
    if (lvl < 20) return '#009688'; // 청록색
    if (lvl < 30) return '#2196F3'; // 파란색
    if (lvl < 50) return '#673AB7'; // 보라색
    if (lvl < 70) return '#9C27B0'; // 자주색
    if (lvl < 90) return '#FF9800'; // 주황색
    return '#F44336'; // 빨간색
  };

  // 현재 레벨 색상
  const currentLevelColor = getLevelColor(level);

  // 다음 레벨에서 해금되는 배지 찾기
  const getNextLevelBadges = () => {
    return ALL_BADGES.filter(badge => 
      badge.level === level + 1 && !earnedBadges.includes(badge.id)
    );
  };

  // 다음 레벨에서 해금되는 기능
  const getNextLevelFeatures = () => {
    const features = [];
    
    // 특정 레벨에서 해금되는 기능들
    if (level + 1 === 3) {
      features.push({
        name: 'D-Day 슬롯 확장',
        description: '세 번째 D-Day 슬롯을 구매할 수 있습니다',
        icon: '🎯'
      });
    }
    
    if (level + 1 === 5) {
      features.push({
        name: '주간 통계',
        description: '상세 주간 통계를 확인할 수 있습니다',
        icon: '📊'
      });
    }
    
    if (level + 1 === 10) {
      features.push({
        name: '특별 슬롯 해금',
        description: '4번째 D-Day 슬롯을 특별 가격으로 구매할 수 있습니다',
        icon: '✨'
      });
    }
    
    if (level + 1 === 15) {
      features.push({
        name: '캘린더 뷰',
        description: '확장된 캘린더 뷰를 사용할 수 있습니다',
        icon: '📅'
      });
    }
    
    if (level + 1 === 20) {
      features.push({
        name: '테마 커스터마이징',
        description: '앱 테마를 변경할 수 있습니다',
        icon: '🎨'
      });
    }
    
    return features;
  };

  // 다음 레벨 배지와 기능
  const nextLevelBadges = getNextLevelBadges();
  const nextLevelFeatures = getNextLevelFeatures();

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
        <Text style={styles.headerTitle}>레벨 정보</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FAQ')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 현재 레벨 카드 */}
        <View style={[styles.levelCard, { backgroundColor: currentLevelColor }]}>
          <View style={styles.levelCardContent}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>현재 레벨</Text>
              <Text style={styles.levelValue}>{level}</Text>
              <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
            </View>
            <View style={styles.levelEmojiContainer}>
              <Text style={styles.levelEmoji}>{getLevelEmoji(level)}</Text>
            </View>
          </View>
          
          {/* 레벨 진행 바 */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) }
              ]}
            />
          </View>
          
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>
              다음 레벨까지: {levelProgress.current.toLocaleString()} / {levelProgress.required.toLocaleString()} XP
            </Text>
            <Text style={styles.progressPercentage}>
              {levelProgress.percentage}%
            </Text>
          </View>
        </View>

        {/* 해금된 배지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>🏆</Text> 레벨로 해금된 배지
          </Text>
          
          <View style={styles.badgesContainer}>
            {ALL_BADGES.filter(badge => 
              badge.id.startsWith('level_') && 
              earnedBadges.includes(badge.id)
            ).map(badge => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[
                  styles.badgeIconContainer,
                  { borderColor: badge.rarity?.color || '#8BC34A' }
                ]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 다음 레벨 혜택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>⚡</Text> 다음 레벨 혜택
          </Text>
          
          {nextLevelBadges.length > 0 && (
            <View style={styles.nextLevelItem}>
              <View style={styles.nextLevelItemIconContainer}>
                <Text style={styles.nextLevelItemIcon}>🏆</Text>
              </View>
              <View style={styles.nextLevelItemContent}>
                <Text style={styles.nextLevelItemTitle}>새로운 배지</Text>
                {nextLevelBadges.map(badge => (
                  <View key={badge.id} style={styles.nextLevelBadge}>
                    <Text style={styles.nextLevelBadgeIcon}>{badge.icon}</Text>
                    <Text style={styles.nextLevelBadgeText}>{badge.name}</Text>
                    <Text style={[
                      styles.nextLevelBadgeRarity,
                      { color: badge.rarity?.color }
                    ]}>
                      {badge.rarity?.name || '일반'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {nextLevelFeatures.length > 0 && (
            nextLevelFeatures.map((feature, index) => (
              <View key={index} style={styles.nextLevelItem}>
                <View style={styles.nextLevelItemIconContainer}>
                  <Text style={styles.nextLevelItemIcon}>{feature.icon}</Text>
                </View>
                <View style={styles.nextLevelItemContent}>
                  <Text style={styles.nextLevelItemTitle}>{feature.name}</Text>
                  <Text style={styles.nextLevelItemDesc}>{feature.description}</Text>
                </View>
              </View>
            ))
          )}
          
          {nextLevelBadges.length === 0 && nextLevelFeatures.length === 0 && (
            <View style={styles.emptyNextLevel}>
              <Text style={styles.emptyNextLevelText}>
                Lv.{level + 1}에서는 특별한 혜택이 없습니다.
                계속해서 일정을 완료하고 포인트를 모아보세요!
              </Text>
            </View>
          )}

          {/* 포인트 보상 정보 (항상 표시) */}
          <View style={styles.nextLevelItem}>
            <View style={styles.nextLevelItemIconContainer}>
              <Text style={styles.nextLevelItemIcon}>💰</Text>
            </View>
            <View style={styles.nextLevelItemContent}>
              <Text style={styles.nextLevelItemTitle}>포인트 보상</Text>
              <Text style={styles.nextLevelItemDesc}>
                Lv.{level + 1} 달성 시 {(level + 1) * 20}P 획득
              </Text>
            </View>
          </View>
        </View>

        {/* 레벨별 필요 XP 테이블 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>📊</Text> 레벨별 필요 XP
          </Text>
          
          <View style={styles.xpTableContainer}>
            <View style={styles.xpTableHeader}>
              <Text style={styles.xpTableHeaderText}>레벨</Text>
              <Text style={styles.xpTableHeaderText}>필요 XP</Text>
              <Text style={styles.xpTableHeaderText}>누적 XP</Text>
            </View>
            
            {Array.from({ length: Math.min(10, level + 5) }, (_, i) => {
              const lvl = level - 2 + i;
              if (lvl <= 0) return null;
              
              const requiredXP = getRequiredXP(lvl);
              const cumulativeXP = Array.from({ length: lvl }, (_, j) => getRequiredXP(j + 1))
                .reduce((sum, xp) => sum + xp, 0);
              
              return (
                <View 
                  key={lvl} 
                  style={[
                    styles.xpTableRow,
                    lvl === level && styles.xpTableRowCurrent
                  ]}
                >
                  <Text 
                    style={[
                      styles.xpTableCell,
                      lvl === level && styles.xpTableCellCurrent
                    ]}
                  >
                    {getLevelEmoji(lvl)} {lvl}
                  </Text>
                  <Text 
                    style={[
                      styles.xpTableCell,
                      lvl === level && styles.xpTableCellCurrent
                    ]}
                  >
                    {requiredXP.toLocaleString()}
                  </Text>
                  <Text 
                    style={[
                      styles.xpTableCell,
                      lvl === level && styles.xpTableCellCurrent
                    ]}
                  >
                    {cumulativeXP.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 레벨업 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>💡</Text> 레벨업 팁
          </Text>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✅</Text>
            <Text style={styles.tipText}>일정을 매일 꾸준히 완료하세요</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🔥</Text>
            <Text style={styles.tipText}>연속 출석으로 추가 XP를 획득하세요</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🏆</Text>
            <Text style={styles.tipText}>다양한 배지를 수집하면 XP 보너스가 있습니다</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✨</Text>
            <Text style={styles.tipText}>하루의 모든 일정을 완료하여 '완벽한 하루' 보너스를 받으세요</Text>
          </View>
        </View>
                {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

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
  levelCard: {
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  levelEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 40,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
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
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  badgeItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#495057',
  },
  nextLevelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nextLevelItemIconContainer: {
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
  nextLevelItemIcon: {
    fontSize: 20,
  },
  nextLevelItemContent: {
    flex: 1,
  },
  nextLevelItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  nextLevelItemDesc: {
    fontSize: 14,
    color: '#6C757D',
  },
  nextLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  nextLevelBadgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  nextLevelBadgeText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  nextLevelBadgeRarity: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyNextLevel: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyNextLevelText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  xpTableContainer: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  xpTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 12,
  },
  xpTableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  xpTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 12,
  },
  xpTableRowCurrent: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  xpTableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#495057',
  },
  xpTableCellCurrent: {
    fontWeight: '600',
    color: '#007BFF',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },

});

export default LevelScreen;