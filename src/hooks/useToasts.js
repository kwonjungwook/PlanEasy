// src/hooks/useToasts.js
// 알림: 이것은 기존 useToasts 훅의 추측에 기반한 수정 버전입니다.

import { useState, useCallback, useEffect } from 'react';

const useToasts = () => {
  const [toasts, setToasts] = useState([]);

  // 토스트 추가 함수
  const showToast = useCallback(({ id, message, type = 'info', duration = 3000, onPress }) => {
    // 고유 ID가 없으면 생성
    const toastId = id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast = {
      id: toastId,
      message,
      type,
      onPress,
      createdAt: Date.now(),
    };

    // 토스트 추가
    setToasts(prevToasts => [...prevToasts, newToast]);

    // 지정 시간 후 자동으로 제거
    if (duration) {
      setTimeout(() => {
        removeToast(toastId);
      }, duration);
    }
  }, []);

  // 토스트 제거 함수
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // 모든 토스트 제거
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
};

export default useToasts;