// src/context/NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  getAllNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  addSystemNotification,
  addMissedScheduleNotification,
  cleanupOldNotifications,
  checkMissedSchedulesOnAppStart
} from '../services/NotificationService';

// 컨텍스트 생성
const NotificationContext = createContext();

// NotificationProvider 컴포넌트
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 로드
  useEffect(() => {
    loadNotifications();
    
    // 앱 실행 시 놓친 일정 확인 및 알림 생성
    checkMissedSchedulesOnAppStart();
    
    // 30일 이상 지난 알림 정리
    cleanupOldNotifications(30);
  }, []);

  // 알림 데이터 로드
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationData = await getAllNotifications();
      setNotifications(notificationData);
      
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // 상태 업데이트
      setNotifications(prev => 
        prev.map(noti => 
          noti.id === notificationId ? { ...noti, read: true } : noti
        )
      );
      
      // 읽지 않은 알림 수 업데이트
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return false;
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // 상태 업데이트
      setNotifications(prev => 
        prev.map(noti => ({ ...noti, read: true }))
      );
      
      // 읽지 않은 알림 수 초기화
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
      return false;
    }
  };

  // 알림 삭제
  const deleteUserNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // 상태에서도 제거
      const removedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => 
        prev.filter(noti => noti.id !== notificationId)
      );
      
      // 읽지 않은 알림이었다면 카운트 감소
      if (removedNotification && !removedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      return false;
    }
  };

  // 시스템 알림 추가
  const addNewSystemNotification = async (title, message, data = {}) => {
    try {
      const newNotificationId = await addSystemNotification(title, message, data);
      if (newNotificationId) {
        await loadNotifications(); // 알림 목록 리로드
        return true;
      }
      return false;
    } catch (error) {
      console.error('시스템 알림 추가 오류:', error);
      return false;
    }
  };

  // 컨텍스트 값
  const value = {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteUserNotification,
    addSystemNotification: addNewSystemNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// 커스텀 훅
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};