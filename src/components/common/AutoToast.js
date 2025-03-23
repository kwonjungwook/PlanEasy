// src/components/common/AutoToast.js

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

// 전역으로 토스트 메시지를 관리하기 위한 이벤트 시스템
export const ToastEventSystem = {
  listeners: [],
  
  // 이벤트 리스너 등록
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  // 토스트 메시지 표시 이벤트 발생
  showToast(message, duration = 2000) {
    this.listeners.forEach(listener => listener(message, duration));
  }
};

// 토스트 컴포넌트
const AutoToast = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [message, setMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    // 이벤트 구독
    const unsubscribe = ToastEventSystem.subscribe((message, duration) => {
      // 이미 토스트가 표시 중이면 먼저 사라지게 함
      if (toastVisible) {
        hideToast(() => {
          showToastWithMessage(message, duration);
        });
      } else {
        showToastWithMessage(message, duration);
      }
    });
    
    return unsubscribe;
  }, [toastVisible]);
  
  // 메시지와 함께 토스트 표시
  const showToastWithMessage = (msg, duration) => {
    setMessage(msg);
    setToastVisible(true);
    
    // 페이드인 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // 자동으로 사라지는 타이머 설정
    const timer = setTimeout(() => {
      hideToast();
    }, duration);
    
    return () => clearTimeout(timer);
  };
  
  // 토스트 숨기기
  const hideToast = (callback) => {
    // 페이드아웃 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
      if (callback) callback();
    });
  };
  
  if (!toastVisible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AutoToast;