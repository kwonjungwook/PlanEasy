// src/screens/NotificationsScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ToastEventSystem } from '../components/common/AutoToast';

const NotificationsScreen = ({ navigation }) => {
  const { 
    notifications, 
    isLoading, 
    loadNotifications, 
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  // 화면 포커스될 때마다 알림 목록 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications();
    });

    return unsubscribe;
  }, [navigation, loadNotifications]);

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      ToastEventSystem.showToast('모든 알림을 읽음 처리했습니다', 2000);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNotification(notificationId);
            if (success) {
              ToastEventSystem.showToast('알림이 삭제되었습니다', 2000);
            }
          }
        }
      ]
    );
  };

  // 알림 아이콘 선택
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'missed_schedule':
        return <Ionicons name="calendar-outline" size={24} color="#E74C3C" />;
      case 'system':
        return <Ionicons name="information-circle-outline" size={24} color="#3498DB" />;
      case 'announcement':
        return <Ionicons name="megaphone-outline" size={24} color="#9B59B6" />;
      case 'special_event':
        return <Ionicons name="star-outline" size={24} color="#F39C12" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#7F8C8D" />;
    }
  };

  // 알림 아이템 렌더링
  const renderNotificationItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          item.read ? styles.readNotification : styles.unreadNotification
        ]}
        onPress={() => markAsRead(item.id)}
        onLongPress={() => handleDeleteNotification(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIconContainer}>
          {getNotificationIcon(item.type)}
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          
          {item.type === 'missed_schedule' && item.data && (
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleTime}>
                {item.data.startTime} ~ {item.data.endTime}
              </Text>
            </View>
          )}
          
          <Text style={styles.notificationTime}>
            {format(new Date(item.createdAt), 'M월 d일 a h:mm', { locale: ko })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 빈 알림 메시지
  const renderEmptyNotifications = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#ADB5BD" />
      <Text style={styles.emptyText}>알림이 없습니다</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity
          style={styles.readAllButton}
          onPress={handleMarkAllAsRead}
          disabled={notifications.length === 0 || notifications.every(n => n.read)}
        >
          <Text style={[
            styles.readAllButtonText,
            (notifications.length === 0 || notifications.every(n => n.read)) && 
            styles.disabledButton
          ]}>
            모두 읽음
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 알림 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE99A4" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyNotifications}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  readAllButton: {
    padding: 8,
  },
  readAllButtonText: {
    fontSize: 14,
    color: '#FE99A4',
    fontWeight: '500',
  },
  disabledButton: {
    color: '#CED4DA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FE99A4',
  },
  readNotification: {
    opacity: 0.8,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 16,
    width: 32,
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FE99A4',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  scheduleInfo: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 12,
    color: '#868E96',
  },
  notificationTime: {
    fontSize: 12,
    color: '#ADB5BD',
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#868E96',
  },
});

export default NotificationsScreen;