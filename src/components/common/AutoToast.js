// src/components/common/AutoToast.js

import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

// 전역으로 토스트 메시지를 관리하기 위한 이벤트 시스템
export const ToastEventSystem = {
  listeners: [],

  // 이벤트 리스너 등록
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  },

  // 토스트 메시지 표시 이벤트 발생
  showToast(message, duration = 2000) {
    if (__DEV__) {
      console.log(`[ToastEventSystem] 토스트 표시: "${message}"`);
    }
    this.listeners.forEach((listener) => listener(message, duration));
  },
};

// 토스트 컴포넌트
const AutoToast = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [message, setMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 이벤트 구독
    const unsubscribe = ToastEventSystem.subscribe((message, duration) => {
      showToastWithMessage(message, duration);
    });

    return unsubscribe;
  }, []);

  // 메시지와 함께 토스트 표시
  const showToastWithMessage = (msg, duration) => {
    setMessage(msg);
    setToastVisible(true);

    // 초기값 설정
    fadeAnim.setValue(0);
    translateY.setValue(50);

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
    setTimeout(() => {
      hideToast();
    }, duration);
  };

  // 토스트 숨기기
  const hideToast = () => {
    // 페이드아웃 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  if (!toastVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  text: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AutoToast;
