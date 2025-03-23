// /src/components/layout/ImprovedNoticeBar.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ImprovedNoticeBar = () => {
  // Split the notice text into individual lines
  const noticeLines = [
    "★오늘 마감★ 종료되기 전에 꼭 확인하세요➡",
    "★런칭 기념★ 70% 폭탄세일! 오늘만 특별 혜택!",
    "● PlanEasy ver1.0 출시기념 이벤트! ●",
    "✨생산성 10,000% 폭탄세일! !",
    "● 새로운 기능 업데이트!"
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const animatedValue = useRef(new Animated.Value(40)).current; // 화면 아래에서 시작
  const animationRef = useRef(null);

  // 다음 인덱스 계산 함수
  const getNextIndex = (current) => (current + 1) % noticeLines.length;

  // 애니메이션 시작 함수
  const startAnimation = () => {
    // 이전 애니메이션 중지 (안전을 위해)
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // 애니메이션 초기화
    animatedValue.setValue(40); // 화면 아래에서 시작

    // 애니메이션 시퀀스 생성
    animationRef.current = Animated.sequence([
      // 1. 텍스트를 아래에서 위로 올라오게 함 (천천히)
      Animated.timing(animatedValue, {
        toValue: 0, // 정상 위치
        duration: 1000, // 1초 동안 올라옴
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      
      // 2. 5초 동안 표시 유지
      Animated.delay(5000),
      
      // 3. 텍스트를 위로 올려 화면에서 사라지게 함
      Animated.timing(animatedValue, {
        toValue: -40, // 화면 위로 사라짐
        duration: 1000, // 1초 동안 올라감
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // 애니메이션 시작 및 완료 후 다음 텍스트로 변경
    animationRef.current.start(() => {
      // 다음 인덱스로 업데이트
      setCurrentIndex(getNextIndex(currentIndex));
    });
  };

  // 인덱스가 변경될 때마다 애니메이션 시작
  useEffect(() => {
    startAnimation();
    
    // 컴포넌트 언마운트 시 애니메이션 중지
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>notice</Text>
      </View>

      <View style={styles.noticeContainer}>
        <Animated.Text
          style={[
            styles.noticeText,
            { transform: [{ translateY: animatedValue }] },
          ]}
        >
          {noticeLines[currentIndex]}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 0,
    paddingHorizontal: 16,
    height: 40,
    overflow: "hidden",
  },
  badge: {
    backgroundColor: "#FE99A4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
    zIndex: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  noticeContainer: {
    flex: 1,
    overflow: "hidden",
    height: 40,
    justifyContent: "center",
  },
  noticeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    position: "absolute",
    left: 0,
    right: 0,
  },
});

export default ImprovedNoticeBar;