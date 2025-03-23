// src/screens/PointHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../context/ProgressContext';
import { getPointHistory } from '../utils/pointHistoryManager';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const PointHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'earn', 'spend'
  const { points } = useProgress();

  // 포인트 내역 불러오기
  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getPointHistory();
      setHistory(data);
    } catch (error) {
      console.error('포인트 내역 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 첫 로딩 시 내역 불러오기
  useEffect(() => {
    loadHistory();
  }, []);

  // 당겨서 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // 필터링된 내역 가져오기
  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    return history.filter(item => item.type === filter);
  };

  // 총 획득/사용 포인트 계산
  const getTotalPoints = (type) => {
    return history
      .filter(item => item.type === type)
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  };

  // 카테고리별 아이콘 및 색상 설정
  const getCategoryInfo = (category) => {
    const categoryMap = {
      task: { icon: '✅', color: '#4CAF50', name: '일정 완료' },
      streak: { icon: '🔥', color: '#FF9800', name: '출석 보상' },
      level: { icon: '⭐', color: '#9C27B0', name: '레벨업' },
      dday: { icon: '🎯', color: '#2196F3', name: 'D-Day 슬롯' },
      color: { icon: '🎨', color: '#F44336', name: '테마 색상' },
      badge: { icon: '🏆', color: '#FFC107', name: '배지 획득' },
      perfect: { icon: '✨', color: '#3F51B5', name: '완벽한 하루' },
      // 기본값 설정
      default: { icon: '💰', color: '#607D8B', name: '기타' },
    };

    return categoryMap[category] || categoryMap.default;
  };

  // 내역 아이템 렌더링
  const renderHistoryItem = ({ item }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const date = new Date(item.date);
    const formattedDate = format(date, 'yyyy. MM. dd', { locale: ko });
    const formattedTime = format(date, 'HH:mm', { locale: ko });
    const isEarned = item.type === 'earn';
    
    return (
      <View style={styles.historyItem}>
        <View style={[styles.historyIconContainer, { backgroundColor: `${categoryInfo.color}20` }]}>
          <Text style={styles.historyIcon}>{categoryInfo.icon}</Text>
        </View>
        
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>{item.description || categoryInfo.name}</Text>
            <Text 
              style={[
                styles.historyAmount, 
                { color: isEarned ? '#4CAF50' : '#F44336' }
              ]}
            >
              {isEarned ? '+' : '-'}{Math.abs(item.amount)}P
            </Text>
          </View>
          
          <View style={styles.historyFooter}>
            <Text style={styles.historyCategory}>{categoryInfo.name}</Text>
            <Text style={styles.historyDate}>{formattedDate} {formattedTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  // 필터 탭 렌더링
  const renderFilterTab = (filterName, label, count) => (
    <TouchableOpacity 
      style={[styles.filterTab, filter === filterName && styles.activeFilterTab]}
      onPress={() => setFilter(filterName)}
    >
      <Text style={[styles.filterLabel, filter === filterName && styles.activeFilterLabel]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.filterBadge, filter === filterName && styles.activeFilterBadge]}>
          <Text style={[styles.filterBadgeText, filter === filterName && styles.activeFilterBadgeText]}>
            {count}
          </Text>
        </View>
      )}
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
        <Text style={styles.headerTitle}>포인트 내역</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 포인트 요약 카드 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>현재 포인트</Text>
            <Text style={styles.currentPoints}>{points}P</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>총 획득</Text>
            <Text style={styles.earnedPoints}>+{getTotalPoints('earn')}P</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>총 사용</Text>
            <Text style={styles.spentPoints}>-{getTotalPoints('spend')}P</Text>
          </View>
        </View>
      </View>

      {/* 필터 탭 */}
      <View style={styles.filterContainer}>
        {renderFilterTab('all', '전체', history.length)}
        {renderFilterTab('earn', '획득', history.filter(item => item.type === 'earn').length)}
        {renderFilterTab('spend', '사용', history.filter(item => item.type === 'spend').length)}
      </View>

      {/* 내역 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>내역을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredHistory()}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' 
                  ? '포인트 내역이 없습니다' 
                  : filter === 'earn' 
                    ? '획득한 포인트 내역이 없습니다' 
                    : '사용한 포인트 내역이 없습니다'}
              </Text>
              <Text style={styles.emptySubText}>
                {filter === 'all' 
                  ? '앱을 사용하면 포인트 내역이 여기에 표시됩니다' 
                  : filter === 'earn' 
                    ? '일정 완료, 출석 체크 등으로 포인트를 획득해보세요' 
                    : '포인트를 사용하면 내역이 여기에 표시됩니다'}
              </Text>
            </View>
          }
        />
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
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  currentPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  earnedPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  spentPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E9ECEF',
    marginHorizontal: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeFilterLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: '#007AFF20',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#6C757D',
    fontWeight: '600',
  },
  activeFilterBadgeText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIcon: {
    fontSize: 20,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCategory: {
    fontSize: 13,
    color: '#6C757D',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PointHistoryScreen;