// src/services/NotificationService.js

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";
import { IntentLauncher } from "expo-intent-launcher";
import { Platform, Linking } from "react-native";
import { ToastEventSystem } from "../components/common/AutoToast";
import { format } from 'date-fns';

// 백그라운드 알림 태스크 이름 정의
export const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// 알림 상태 저장소 키
const NOTIFICATION_ENABLED_KEY = "notificationEnabled";
const NOTIFICATIONS_STORAGE_KEY = "@notifications_list";

// 저장된 알림 ID 객체
const notificationIds = {};


// 업데이트 중 플래그 - let으로 변경하고 초기화
let isUpdatingNotifications = false;

// 백그라운드 태스크 정의 (외부에서 호출하도록)
export const defineBackgroundTask = () => {
  if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
    TaskManager.defineTask(
      BACKGROUND_NOTIFICATION_TASK,
      async ({ data, error }) => {
        if (error) {
          console.error("백그라운드 알림 처리 오류:", error);
          return;
        }
        console.log("백그라운드에서 알림 수신:", data);

        // 여기서는 알림을 취소하지 않음
        if (data && data.notification) {
          console.log(
            "백그라운드 알림 처리 중",
            data.notification.request.identifier
          );
        }
      }
    );
  }
};


// 알림 권한 요청 함수
export const requestNotificationPermissions = async () => {
  try {
    console.log("알림 권한 확인 중...");

    // 현재 권한 상태 확인
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("현재 알림 권한 상태:", existingStatus);

    if (existingStatus !== "granted") {
      console.log("알림 권한 요청 중...");
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowSound: true,
          allowVibrate: true,
        },
      });
      console.log("알림 권한 요청 결과:", status);
      return status === "granted";
    }
    return true;
  } catch (error) {
    console.error("알림 권한 요청 오류:", error);
    console.error("에러 세부 정보:", error.message);
    console.error("에러 스택:", error.stack);
    return false;
  }
};


// 푸시 알림 토큰 가져오기
export const getExpoPushTokenAsync = async () => {
  if (!Device.isDevice) {
    ToastEventSystem.showToast(
      "실제 기기에서만 알림을 사용할 수 있습니다",
      2000
    );
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }
  }

  try {
    // Android 채널 설정 (푸시 알림을 위해)
    if (Platform.OS === "android") {
      await setupAndroidChannels();
    }

    // 토큰 가져오기
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn(
        "Project ID not found, push notifications may not work correctly"
      );
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    console.log("Expo 푸시 알림 토큰:", token.data);
    return token;
  } catch (error) {
    console.error("Expo 토큰 가져오기 실패:", error);
    return null;
  }
};

// Android 알림 채널 설정 - 단순화
export const setupAndroidChannels = async () => {
  if (Platform.OS === "android") {
    // 항상 소리와 진동 활성화
    await Notifications.setNotificationChannelAsync("schedule-notifications", {
      name: "일정 알림",
      description: "일정 시간에 맞춰 발송되는 중요한 알림입니다",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: true,
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // 방해금지 모드 무시
    });

    // 기본 알림 채널도 업그레이드
    await Notifications.setNotificationChannelAsync("default", {
      name: "기본 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: true,
      enableVibrate: true,
    });
  }
};

// 알림 토글 기본 함수 - 토스트 사용
export const toggleNotifications = async (schedules, isEnabled) => {
  try {
    const success = isEnabled
      ? await disableNotificationsWithToast()
      : await enableNotificationsWithToast(schedules);

    return success;
  } catch (error) {
    console.error("알림 토글 오류:", error);
    ToastEventSystem.showToast("알림 설정 중 오류가 발생했습니다", 2000);
    return false;
  }
};

// 토스트 메시지와 함께 알림 활성화
export const enableNotificationsWithToast = async (schedules) => {
  try {
    // 알림 권한 확인 및 요청
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      ToastEventSystem.showToast("알림 권한이 필요합니다", 2000);
      setTimeout(() => {
        ToastEventSystem.showToast("설정에서 권한을 허용해주세요", 3000, () => {
          Linking.openSettings();
        });
      }, 2500);
      return false;
    }

    // 백그라운드 태스크 등록
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

    // 상태 업데이트 (로컬 저장소)
    await saveNotificationState(true);

    // 현재 시간 이후의 일정만 필터링
    const now = new Date();
    const upcomingSchedules = schedules.filter((schedule) => {
      const [hours, minutes] = schedule.startTime.split(":");
      const scheduleTime = new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return scheduleTime > now;
    });

    console.log(`설정할 알림 수: ${upcomingSchedules.length}`);

    // 알림 설정 성공 횟수 추적
    let successCount = 0;

    // 각 일정에 대해 알림 설정
    for (const schedule of upcomingSchedules) {
      const id = await scheduleNotification(schedule);
      if (id) {
        successCount++;
      }
    }

    // 예약된 알림 확인
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log(`실제 예약된 알림 수: ${scheduledNotifications.length}`);

    // 토스트 메시지로 알림
    ToastEventSystem.showToast(
      `${successCount}개의 일정에 알림이 설정되었습니다`,
      2000
    );

    return true;
  } catch (error) {
    console.error("알림 활성화 오류:", error);
    ToastEventSystem.showToast("알림 설정 중 오류가 발생했습니다", 2000);
    return false;
  }
};

// 토스트 메시지와 함께 알림 비활성화
export const disableNotificationsWithToast = async () => {
  try {
    // 백그라운드 태스크 해제
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(
      (error) => console.log("태스크 해제 오류:", error)
    );

    // 모든 알림 취소
    await cancelAllScheduledNotifications();

    // 상태 저장
    await saveNotificationState(false);

    // 토스트 메시지로 알림
    ToastEventSystem.showToast("모든 일정 알림이 해제되었습니다", 2000);

    return true;
  } catch (error) {
    console.error("알림 비활성화 오류:", error);
    ToastEventSystem.showToast("알림 해제 중 오류가 발생했습니다", 2000);
    return false;
  }
};

// 기존의 Alert 없는 함수들 (호환성 유지)
export const toggleNotificationsWithoutAlert = async (schedules, isEnabled) => {
  return isEnabled
    ? await disableNotificationsWithoutAlert()
    : await enableNotificationsWithoutAlert(schedules);
};

export const enableNotificationsWithoutAlert = async (schedules) => {
  try {
    // 알림 권한 확인 및 요청
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      return false;
    }

    // 백그라운드 태스크 등록
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

    // 상태 업데이트 (로컬 저장소)
    await saveNotificationState(true);

    // 현재 시간 이후의 일정만 필터링
    const now = new Date();
    const upcomingSchedules = schedules.filter((schedule) => {
      const [hours, minutes] = schedule.startTime.split(":");
      const scheduleTime = new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return scheduleTime > now;
    });

    // 알림 설정 성공 횟수 추적
    let successCount = 0;

    // 각 일정에 대해 알림 설정
    for (const schedule of upcomingSchedules) {
      const id = await scheduleNotification(schedule);
      if (id) {
        successCount++;
      }
    }

    return true;
  } catch (error) {
    console.error("알림 활성화 오류:", error);
    return false;
  }
};

export const disableNotificationsWithoutAlert = async () => {
  try {
    // 백그라운드 태스크 해제
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(
      (error) => console.log("태스크 해제 오류:", error)
    );

    // 모든 알림 취소
    await cancelAllScheduledNotifications();

    // 상태 저장
    await saveNotificationState(false);

    return true;
  } catch (error) {
    console.error("알림 비활성화 오류:", error);
    return false;
  }
};

// 공통 기능 함수들
export const scheduleNotification = async (schedule) => {
  try {
    console.log(`"${schedule.task}" 일정에 대한 알림 예약 시작...`);

    // 시간 파싱
    const [hours, minutes] = schedule.startTime
      .split(":")
      .map((num) => parseInt(num, 10));

    // 예약 시간 설정 (정확한 원래 시간 유지)
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // 이미 지난 시간인지 확인 - 더 명확한 로직으로 수정
    const now = new Date();
    const isPast =
      scheduledDate.getDate() === now.getDate() &&
      scheduledDate.getMonth() === now.getMonth() &&
      scheduledDate.getFullYear() === now.getFullYear() &&
      (scheduledDate.getHours() < now.getHours() ||
        (scheduledDate.getHours() === now.getHours() &&
          scheduledDate.getMinutes() <= now.getMinutes()));

    if (isPast) {
      console.log(
        `지난 일정 알림 무시: ${schedule.task} (${
          schedule.startTime
        }) - 현재 시간: ${now.toLocaleTimeString()}`
      );
      return null;
    }

    // 지금부터 다음날까지의 알림만 허용
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    if (scheduledDate > tomorrow) {
      console.log(
        `24시간 이상 후의 알림은 나중에 스케줄링됩니다: ${
          schedule.task
        } (${scheduledDate.toLocaleString()})`
      );
      return null;
    }

    console.log(`알림 예약 예정 시간: ${scheduledDate.toLocaleTimeString()}`);

    // 기존 알림이 있으면 먼저 취소 (중복 방지)
    if (notificationIds[schedule.id]) {
      try {
        await cancelNotificationById(notificationIds[schedule.id]);
      } catch (e) {
        console.log(`이전 알림 취소 실패: ${e.message}`);
      }
    }

    // 알림 예약 - 우선순위 최대화
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${schedule.task} 일정 알림`,
        body: `일정 시작 시간: ${schedule.startTime}`,
        sound: true,
        priority: "max",
        data: {
          scheduleId: schedule.id,
          task: schedule.task,
          time: schedule.startTime,
          screen: "홈",
        },
        // Android용 추가 설정
        android: {
          channelId: "schedule-notifications",
          priority: "max",
          sound: true,
          vibrate: [0, 250, 250, 250],
          color: "#FF231F7C",
        },
      },
      trigger: {
        type: "date",
        date: scheduledDate,
      },
    });

    console.log(
      `알림 예약 완료: ${
        schedule.task
      }, ID: ${identifier}, 시간: ${scheduledDate.toLocaleTimeString()}`
    );

    // 새 알림 ID 저장
    notificationIds[schedule.id] = identifier;
    return identifier;
  } catch (error) {
    console.error("알림 예약 실패:", error);
    console.error("오류 세부 정보:", error.message);
    return null;
  }
};

// 알림 상태 불러오기
export const getNotificationEnabled = async () => {
  try {
    const savedState = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return savedState !== null ? JSON.parse(savedState) : false;
  } catch (error) {
    console.log("알림 상태 불러오기 오류:", error);
    return false;
  }
};

// 알림 상태 저장하기
export const saveNotificationState = async (enabled) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_ENABLED_KEY,
      JSON.stringify(enabled)
    );
    return true;
  } catch (error) {
    console.log("알림 상태 저장 오류:", error);
    return false;
  }
};

// ===== 새로 추가된 알림 관리 기능 =====

// 모든 알림 가져오기
export const getAllNotifications = async () => {
  try {
    const notificationsData = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!notificationsData) return [];
    return JSON.parse(notificationsData);
  } catch (error) {
    console.error("알림 목록 가져오기 오류:", error);
    return [];
  }
};

// 읽지 않은 알림 개수 가져오기
export const getUnreadNotificationsCount = async () => {
  try {
    const notifications = await getAllNotifications();
    return notifications.filter(notification => !notification.read).length;
  } catch (error) {
    console.error("읽지 않은 알림 개수 가져오기 오류:", error);
    return 0;
  }
};

// 알림 저장
const saveNotifications = async (notifications) => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error("알림 저장 오류:", error);
    return false;
  }
};

// 새 알림 추가
export const addNotification = async (type, title, message, data = {}) => {
  try {
    const notifications = await getAllNotifications();
    const newNotification = {
      id: `${type}_${Date.now()}`,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date().toISOString()
    };

    notifications.unshift(newNotification);
    await saveNotifications(notifications);
    return newNotification.id;
  } catch (error) {
    console.error("알림 추가 오류:", error);
    return null;
  }
};

// 시스템 알림 추가
export const addSystemNotification = async (title, message, data = {}) => {
  return await addNotification('system', title, message, data);
};

// 놓친 일정 알림 추가
export const addMissedScheduleNotification = async (schedule, date) => {
  // 이미 존재하는 알림인지 확인
  const notifications = await getAllNotifications();
  const isDuplicate = notifications.some(
    noti => noti.type === 'missed_schedule' && 
            noti.data.scheduleId === schedule.id &&
            noti.data.date === date
  );

  if (isDuplicate) return null;

  const data = {
    scheduleId: schedule.id,
    task: schedule.task,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    date
  };

  return await addNotification(
    'missed_schedule',
    '놓친 일정 알림',
    `"${schedule.task}" 일정을 완료하지 않았습니다.`,
    data
  );
};

// 알림 읽음 처리
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifications = await getAllNotifications();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );

    await saveNotifications(updatedNotifications);
    return true;
  } catch (error) {
    console.error("알림 읽음 처리 오류:", error);
    return false;
  }
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = async () => {
  try {
    const notifications = await getAllNotifications();
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));

    await saveNotifications(updatedNotifications);
    return true;
  } catch (error) {
    console.error("모든 알림 읽음 처리 오류:", error);
    return false;
  }
};

// 알림 삭제
export const deleteNotification = async (notificationId) => {
  try {
    const notifications = await getAllNotifications();
    const filteredNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );

    await saveNotifications(filteredNotifications);
    return true;
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return false;
  }
};

// 오래된 알림 정리 (30일 이상 지난 알림 삭제)
export const cleanupOldNotifications = async (daysToKeep = 30) => {
  try {
    const notifications = await getAllNotifications();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const updatedNotifications = notifications.filter(notification => 
      new Date(notification.createdAt) >= cutoffDate
    );

    if (updatedNotifications.length !== notifications.length) {
      await saveNotifications(updatedNotifications);
      console.log(`${notifications.length - updatedNotifications.length}개의 오래된 알림이 삭제되었습니다.`);
    }
    return true;
  } catch (error) {
    console.error("오래된 알림 정리 오류:", error);
    return false;
  }
};

// 지난 일정 확인하여 알림 생성
export const checkMissedSchedules = async (allSchedules) => {
  try {
    // 알림 설정이 활성화되어 있는지 확인
    const isEnabled = await getNotificationEnabled();
    if (!isEnabled) return false;

    // 어제 날짜
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // 어제 일정이 없으면 종료
    if (!allSchedules[yesterdayStr] || allSchedules[yesterdayStr].length === 0) return false;

    // 완료된 태스크 정보 가져오기
    const completedTasksStr = await AsyncStorage.getItem('@completed_tasks');
    const completedTasks = completedTasksStr ? JSON.parse(completedTasksStr) : {};

    let addedCount = 0;

    // 어제 일정 중 완료되지 않은 항목 확인
    for (const schedule of allSchedules[yesterdayStr]) {
      if (!completedTasks[schedule.id]) {
        const notificationId = await addMissedScheduleNotification(schedule, yesterdayStr);
        if (notificationId) addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`${addedCount}개의 놓친 일정 알림이 추가되었습니다.`);
      
      // 토스트 메시지 표시 (선택 사항)
      if (ToastEventSystem && ToastEventSystem.showToast) {
        ToastEventSystem.showToast(
          `${addedCount}개의 완료하지 않은 일정이 있습니다`,
          3000
        );
      }
    }

    return addedCount > 0;
  } catch (error) {
    console.error("놓친 일정 확인 오류:", error);
    return false;
  }
};

// 앱 시작 시 놓친 일정 확인
export const checkMissedSchedulesOnAppStart = async () => {
  try {
    // 스케줄 데이터 가져오기
    const schedulesData = await AsyncStorage.getItem('@schedules');
    if (!schedulesData) return false;
    
    const allSchedules = JSON.parse(schedulesData);
    return await checkMissedSchedules(allSchedules);
  } catch (error) {
    console.error("앱 시작 시 놓친 일정 확인 오류:", error);
    return false;
  }
};

// 특별 이벤트/공지 알림 추가
export const addSpecialEventNotification = async (title, message, data = {}) => {
  return await addNotification('special_event', title, message, data);
};

// 공지사항 알림 추가
export const addAnnouncementNotification = async (title, message, data = {}) => {
  return await addNotification('announcement', title, message, data);
};


// 모든 예약된 알림 취소
export const cancelAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // 저장된 알림 ID 초기화
    Object.keys(notificationIds).forEach((key) => delete notificationIds[key]);
    console.log("모든 알림이 취소되었습니다.");
    return true;
  } catch (error) {
    console.error("알림 취소 오류:", error);
    return false;
  }
};

// 특정 일정에 대한 알림 취소
export const cancelScheduledNotification = async (scheduleId) => {
  try {
    const notificationId = notificationIds[scheduleId];
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      delete notificationIds[scheduleId];
      console.log(`일정 ID ${scheduleId}에 대한 알림이 취소되었습니다.`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`일정 ID ${scheduleId}에 대한 알림 취소 오류:`, error);
    return false;
  }
};

// 배터리 최적화 예외 요청 함수
export const requestBatteryOptimizationExemption = async () => {
  if (Platform.OS === "android") {
    try {
      const pkg =
        Constants.expoConfig?.android?.package ||
        Constants.manifest?.android?.package;

      if (pkg) {
        await IntentLauncher.startActivityAsync(
          "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
          { data: `package:${pkg}` }
        );
        return true;
      }
    } catch (error) {
      console.error("배터리 최적화 설정 열기 실패:", error);
    }
  } else if (Platform.OS === "ios") {
    // iOS 설정 앱으로 이동
    Linking.openSettings();
    return true;
  }
  return false;
};

// 예약된 알림 확인 및 누락된 알림 재설정
export const checkAndRescheduleNotifications = async (schedules, isEnabled) => {
  if (!isEnabled) return;

  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log(`현재 예약된 알림 수: ${notifications.length}`);

    // 현재 시간 이후의 일정만 필터링
    const now = new Date();
    const upcomingSchedules = schedules.filter((schedule) => {
      const [hours, minutes] = schedule.startTime.split(":");
      const scheduleTime = new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return scheduleTime > now;
    });

    // 알림이 누락된 경우 재설정
    if (notifications.length < upcomingSchedules.length) {
      console.log("누락된 알림 발견, 알림 재설정");
      // 누락된 알림만 재설정
      for (const schedule of upcomingSchedules) {
        if (
          !notificationIds[schedule.id] ||
          !notifications.some(
            (n) => n.identifier === notificationIds[schedule.id]
          )
        ) {
          console.log(`알림 재설정: ${schedule.task}`);
          await scheduleNotification(schedule);
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("예약된 알림 확인 오류:", error);
    return false;
  }
};

// 일정에 대한 알림 업데이트
export const updateNotificationsForSchedules = async (schedules) => {
  // 이미 실행 중이면 중복 실행 방지
  if (isUpdatingNotifications) {
    console.log("알림 업데이트가 이미 진행 중입니다. 스킵합니다.");
    return 0;
  }

  // 알림이 활성화되어 있는지 확인
  const isEnabled = await getNotificationEnabled();
  if (!isEnabled) return 0;

  try {
    isUpdatingNotifications = true;

    console.log("일정 변경으로 인한 알림 재설정...");

    // 현재 예약된 알림 가져오기
    const currentNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log(`현재 예약된 알림 수: ${currentNotifications.length}`);

    // 현재 시간 이후의 일정만 필터링
    const now = new Date();
    const upcomingSchedules = schedules.filter((schedule) => {
      const [hours, minutes] = schedule.startTime.split(":");
      const scheduleTime = new Date();
      scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return scheduleTime > now;
    });

    // 위험: 모든 알림을 취소하고 다시 설정
    await Notifications.cancelAllScheduledNotificationsAsync();

    // notificationIds 객체 초기화
    Object.keys(notificationIds).forEach((key) => delete notificationIds[key]);

    // 각 일정에 대해 알림 설정
    let successCount = 0;
    for (const schedule of upcomingSchedules) {
      const id = await scheduleNotification(schedule);
      if (id) {
        successCount++;
      }
    }

    console.log(
      `알림 재설정 완료: ${successCount}/${upcomingSchedules.length}`
    );
    isUpdatingNotifications = false;
    return successCount;
  } catch (error) {
    console.error("알림 업데이트 오류:", error);
    isUpdatingNotifications = false;
    return 0;
  }
};

// NotificationService.js에 추가
export const cancelNotificationById = async (notificationId) => {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`알림 취소됨: ${notificationId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`알림 취소 오류: ${error.message}`);
    return false;
  }
};

// 수정된 알림 수신 핸들러 - 알림을 즉시 취소하지 않도록 변경
export const handleNotificationReceived = async (notification) => {
  console.log("알림 수신됨:", notification?.request?.identifier);

  // 알림을 즉시 취소하지 않고 표시됨을 로그로 기록
  if (notification && notification.request) {
    const requestId = notification.request.identifier;
    console.log(`알림 ID ${requestId}이(가) 표시되었습니다.`);
  }
  return true;
};

// 수정된 알림 응답 핸들러 - 사용자가 알림에 반응했을 때만 취소
export const handleNotificationResponse = async (response) => {
  console.log("알림 응답됨:", response?.notification?.request?.identifier);

  // 사용자가 알림에 반응한 후에 취소
  if (response && response.notification && response.notification.request) {
    const requestId = response.notification.request.identifier;
    console.log(
      `사용자가 알림 ID ${requestId}에 응답했습니다. 이제 취소합니다.`
    );
    return await cancelNotificationById(requestId);
  }
  return false;
};

// 알림 리스너 등록
export const addNotificationListeners = (onReceive, onResponse) => {
  const receivedListener =
    Notifications.addNotificationReceivedListener(onReceive);
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(onResponse);

  // 앱이 시작될 때 지나간 알림 응답 처리
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      console.log("지난 알림 응답 처리:", response);
      onResponse(response);
    }
  });

  return {
    receivedListener,
    responseListener,
    remove: () => {
      Notifications.removeNotificationSubscription(receivedListener);
      Notifications.removeNotificationSubscription(responseListener);
    },
  };
};

// 기존 호환성을 위한 함수들 (Alert 사용) - 이제 토스트로 대체됨
export const enableNotifications = enableNotificationsWithToast;
export const disableNotifications = disableNotificationsWithToast;
