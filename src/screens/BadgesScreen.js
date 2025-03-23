// src/screens/BadgesScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../context/ProgressContext';

const BadgesScreen = ({ navigation }) => {
  const { 
    earnedBadges, 
    ALL_BADGES,
    BADGE_RARITY
  } = useProgress();
  
  // 필터 및 검색 상태
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRarity, setActiveRarity] = useState('all');
  
  // 배지 카테고리
  const categories = [
    { id: 'all', name: '전체', icon: '🏆' },
    { id: 'level', name: '레벨', icon: '⭐' },
    { id: 'streak', name: '출석', icon: '🔥' },
    { id: 'complete', name: '완료', icon: '✅' },
    { id: 'time', name: '시간대', icon: '⏰' },
    { id: 'special', name: '특별', icon: '✨' },
  ];

  // 희귀도 필터
  const rarities = [
    { id: 'all', name: '전체', color: '#6c757d' },
    { id: 'common', name: BADGE_RARITY.COMMON.name, color: BADGE_RARITY.COMMON.color },
    { id: 'uncommon', name: BADGE_RARITY.UNCOMMON.name, color: BADGE_RARITY.UNCOMMON.color },
    { id: 'rare', name: BADGE_RARITY.RARE.name, color: BADGE_RARITY.RARE.color },
    { id: 'epic', name: BADGE_RARITY.EPIC.name, color: BADGE_RARITY.EPIC.color },
    { id: 'legendary', name: BADGE_RARITY.LEGENDARY.name, color: BADGE_RARITY.LEGENDARY.color },
  ];

  // 배지 카테고리 분류 함수
  const getBadgeCategory = (badgeId) => {
    if (badgeId.startsWith('level_') || badgeId.startsWith('milestone_level_')) {
      return 'level';
    } else if (badgeId.startsWith('streak_')) {
      return 'streak';
    } else if (badgeId.includes('complete')) {
      return 'complete';
    } else if (
      badgeId.includes('morning') || 
      badgeId.includes('night') || 
      badgeId.includes('afternoon') ||
      badgeId.includes('early') ||
      badgeId.includes('midnight')
    ) {
      return 'time';
    } else {
      return 'special';
    }
  };

  // 배지 필터링
  const getFilteredBadges = () => {
    return ALL_BADGES.filter(badge => {
      // 카테고리 필터링
      if (activeCategory !== 'all' && getBadgeCategory(badge.id) !== activeCategory) {
        return false;
      }
      
      // 희귀도 필터링
      if (
        activeRarity !== 'all' && 
        (!badge.rarity || 
         badge.rarity.name.toLowerCase() !== rarities.find(r => r.id === activeRarity)?.name.toLowerCase())
      ) {
        return false;
      }
      
      return true;
    });
  };

  // 필터링된 배지
  const filteredBadges = getFilteredBadges();
  
  // 획득한 배지와 미획득 배지 분류
  const earnedFilteredBadges = filteredBadges.filter(badge => 
    earnedBadges.includes(badge.id)
  );
  
  const unearnedFilteredBadges = filteredBadges.filter(badge => 
    !earnedBadges.includes(badge.id)
  );
  
  // 배지 진행도 계산
  const totalBadges = ALL_BADGES.length;
  const earnedCount = earnedBadges.length;
  const progressPercentage = Math.round((earnedCount / totalBadges) * 100);
  
  // 각 희귀도별 획득 수 계산
  const getRarityProgress = (rarityName) => {
    const totalOfRarity = ALL_BADGES.filter(
      badge => badge.rarity && badge.rarity.name === rarityName
    ).length;
    
    const earnedOfRarity = ALL_BADGES.filter(
      badge => badge.rarity && 
               badge.rarity.name === rarityName &&
               earnedBadges.includes(badge.id)
    ).length;
    
    return {
      earned: earnedOfRarity,
      total: totalOfRarity,
      percentage: totalOfRarity ? Math.round((earnedOfRarity / totalOfRarity) * 100) : 0
    };
  };

  // 배지 상세 정보 팝업 상태
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // 배지 클릭 핸들러
  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
  };
  
  // 배지 팝업 닫기
  const closeBadgeDetail = () => {
    setSelectedBadge(null);
  };

  // 배지 렌더링 함수
  const renderBadge = ({ item }) => {
    const isEarned = earnedBadges.includes(item.id);
    const badgeStyle = isEarned ? styles.badgeItem : styles.badgeItemLocked;
    const rarityColor = item.rarity?.color || '#6c757d';
    
    return (
      <TouchableOpacity 
        style={badgeStyle}
        onPress={() => handleBadgePress(item)}
      >
        <View style={[
          styles.badgeIconContainer,
          isEarned ? { borderColor: rarityColor } : styles.badgeIconContainerLocked
        ]}>
          <Text style={styles.badgeIcon}>
            {isEarned ? item.icon : '?'}
          </Text>
        </View>
        <Text 
          style={[
            styles.badgeName,
            !isEarned && styles.badgeNameLocked
          ]}
          numberOfLines={1}
        >
          {isEarned ? item.name : '???'}
        </Text>
        <View style={[
          styles.badgeRarity,
          { backgroundColor: isEarned ? rarityColor : '#adb5bd' }
        ]}>
          <Text style={styles.badgeRarityText}>
            {item.rarity?.name || '일반'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>배지 컬렉션</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FAQ')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 배지 진행도 카드 */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>배지 진행도</Text>
            <Text style={styles.progressCardCount}>{earnedCount}/{totalBadges}</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          
          <View style={styles.rarityContainer}>
            {Object.values(BADGE_RARITY).map(rarity => {
              const progress = getRarityProgress(rarity.name);
              
              return (
                <View key={rarity.name} style={styles.rarityItem}>
                  <View style={styles.rarityTop}>
                    <View style={[
                      styles.rarityIcon,
                      { backgroundColor: rarity.color }
                    ]} />
                    <Text style={styles.rarityName}>{rarity.name}</Text>
                  </View>
                  <Text style={styles.rarityCount}>
                    {progress.earned}/{progress.total}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* 카테고리 필터 */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>카테고리</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  activeCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  activeCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 희귀도 필터 */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>희귀도</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {rarities.map(rarity => (
              <TouchableOpacity
                key={rarity.id}
                style={[
                  styles.rarityButton,
                  activeRarity === rarity.id && styles.rarityButtonActive,
                  activeRarity === rarity.id && { borderColor: rarity.color }
                ]}
                onPress={() => setActiveRarity(rarity.id)}
              >
                <Text style={[
                  styles.rarityText,
                  activeRarity === rarity.id && styles.rarityTextActive,
                  activeRarity === rarity.id && { color: rarity.color }
                ]}>
                  {rarity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 획득한 배지 섹션 */}
        {earnedFilteredBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.badgesSectionTitle}>
              <Text style={styles.badgesSectionEmoji}>🏆</Text> 획득한 배지
            </Text>
            
            <FlatList
              data={earnedFilteredBadges}
              renderItem={renderBadge}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.badgesGrid}
            />
          </View>
        )}
        
        {/* 미획득 배지 섹션 */}
        {unearnedFilteredBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.badgesSectionTitle}>
              <Text style={styles.badgesSectionEmoji}>🔒</Text> 미획득 배지
            </Text>
            
            <FlatList
              data={unearnedFilteredBadges}
              renderItem={renderBadge}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.badgesGrid}
            />
          </View>
        )}
        
        {/* 필터링 결과가 없는 경우 */}
        {filteredBadges.length === 0 && (
          <View style={styles.emptyResultContainer}>
            <Text style={styles.emptyResultEmoji}>🔍</Text>
            <Text style={styles.emptyResultText}>
              해당 필터에 맞는 배지가 없습니다.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setActiveCategory('all');
                setActiveRarity('all');
              }}
            >
              <Text style={styles.resetButtonText}>필터 초기화</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* 배지 상세 정보 팝업 */}
      {selectedBadge && (
        <View style={styles.badgeDetailOverlay}>
          <TouchableOpacity 
            style={styles.badgeDetailBackground}
            onPress={closeBadgeDetail}
            activeOpacity={0.7}
          />
          
          <View style={styles.badgeDetailCard}>
            <View style={[
              styles.badgeDetailHeader,
              { backgroundColor: selectedBadge.rarity?.color || '#6c757d' }
            ]}>
              <Text style={styles.badgeDetailRarity}>
                {selectedBadge.rarity?.name || '일반'} 배지
              </Text>
              <TouchableOpacity
                style={styles.badgeDetailCloseButton}
                onPress={closeBadgeDetail}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.badgeDetailContent}>
              <View style={styles.badgeDetailTop}>
                <View style={[
                  styles.badgeDetailIconContainer,
                  { borderColor: selectedBadge.rarity?.color || '#6c757d' }
                ]}>
                  <Text style={styles.badgeDetailIcon}>
                    {earnedBadges.includes(selectedBadge.id) ? selectedBadge.icon : '?'}
                  </Text>
                </View>
                
                <View style={styles.badgeDetailInfo}>
                  <Text style={styles.badgeDetailName}>
                    {earnedBadges.includes(selectedBadge.id) ? selectedBadge.name : '???'}
                  </Text>
                  
                  <Text style={styles.badgeDetailDesc}>
                    {earnedBadges.includes(selectedBadge.id) 
                      ? selectedBadge.description 
                      : '이 배지의 획득 조건은 아직 알 수 없습니다. 계속 도전해보세요!'}
                  </Text>
                </View>
              </View>
              
              {earnedBadges.includes(selectedBadge.id) && (
                <View style={styles.badgeDetailStats}>
                  <View style={styles.badgeDetailStat}>
                    <Text style={styles.badgeDetailStatLabel}>레벨 요구사항</Text>
                    <Text style={styles.badgeDetailStatValue}>
                      {selectedBadge.level ? `Lv.${selectedBadge.level}` : '없음'}
                    </Text>
                  </View>
                  
                  <View style={styles.badgeDetailStat}>
                    <Text style={styles.badgeDetailStatLabel}>XP 보상</Text>
                    <Text style={styles.badgeDetailStatValue}>
                      {selectedBadge.xpBonus ? `${selectedBadge.xpBonus} XP` : '없음'}
                    </Text>
                  </View>
                </View>
              )}
              
              {!earnedBadges.includes(selectedBadge.id) && (
                <TouchableOpacity style={styles.badgeDetailHintButton}>
                  <Text style={styles.badgeDetailHintButtonText}>
                    힌트 확인 (50P)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  progressCardCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E9ECEF',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 6,
  },
  rarityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rarityItem: {
    width: '30%',
    marginBottom: 12,
  },
  rarityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  rarityName: {
    fontSize: 12,
    color: '#495057',
  },
  rarityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  filterSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#FFF3CD',
  },
  categoryIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#495057',
  },
  categoryTextActive: {
    color: '#856404',
    fontWeight: '600',
  },
  rarityButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  rarityButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  rarityText: {
    fontSize: 14,
    color: '#495057',
  },
  rarityTextActive: {
    fontWeight: '600',
  },
  badgesSection: {
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
  badgesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  badgesSectionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  badgesGrid: {
    paddingBottom: 8,
  },
  badgeItem: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  badgeItemLocked: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeIconContainerLocked: {
    borderColor: '#CED4DA',
    backgroundColor: '#E9ECEF',
  },
  badgeIcon: {
    fontSize: 30,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#6C757D',
  },
  badgeRarity: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeRarityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  emptyResultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyResultEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyResultText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  badgeDetailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  badgeDetailBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  badgeDetailCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  badgeDetailRarity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeDetailCloseButton: {
    padding: 4,
  },
  badgeDetailContent: {
    padding: 16,
  },
  badgeDetailTop: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badgeDetailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeDetailIcon: {
    fontSize: 40,
  },
  badgeDetailInfo: {
    flex: 1,
  },
  badgeDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  badgeDetailDesc: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  badgeDetailStats: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  badgeDetailStat: {
    flex: 1,
  },
  badgeDetailStatLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  badgeDetailStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  badgeDetailHintButton: {
    backgroundColor: '#FFC107',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  badgeDetailHintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
});

export default BadgesScreen;