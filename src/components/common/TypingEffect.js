// src/components/common/TypingEffect.js
import React, { useState, useEffect, useRef } from "react";
import { Text, Animated, Easing, StyleSheet } from "react-native";

const TypingEffect = ({
  text,
  style = {},
  typingSpeed = 30,
  onComplete = () => {},
  startDelay = 500,
  pauseDelay = 0,
  isPlaying = true,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);

  // 텍스트가 변경되면 애니메이션 리셋
  useEffect(() => {
    resetTyping();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  // 애니메이션 재생/일시정지 제어
  useEffect(() => {
    if (isPlaying) {
      if (currentIndex === 0) {
        // 첫 시작 시 페이드인 애니메이션
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // 시작 딜레이 후 타이핑 시작
        timeoutRef.current = setTimeout(() => {
          typeNextCharacter();
        }, startDelay);
      } else if (isPaused) {
        // 일시정지 상태에서 재개
        setIsPaused(false);
        typeNextCharacter();
      }
    } else if (!isPaused && currentIndex < text.length) {
      // 애니메이션 일시정지
      setIsPaused(true);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentIndex, isPaused]);

  // 타이핑 애니메이션 리셋 함수
  const resetTyping = () => {
    setDisplayedText("");
    setCurrentIndex(0);
    opacityAnim.setValue(0);
    setIsPaused(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 다음 글자 타이핑 함수
  const typeNextCharacter = () => {
    if (isPaused || currentIndex >= text.length) return;

    const nextChar = text[currentIndex];
    setDisplayedText((prev) => prev + nextChar);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // 텍스트 완료 여부 체크
    if (nextIndex >= text.length) {
      onComplete();
      return;
    }

    // 문장 부호에 따른 딜레이 조정
    let delay = typingSpeed;

    // 문장 부호에 따른 추가 딜레이
    if ([".", "!", "?", "\n"].includes(nextChar)) {
      delay = typingSpeed * 8; // 문장 끝에서 더 긴 딜레이
    } else if ([",", ";", ":"].includes(nextChar)) {
      delay = typingSpeed * 5; // 쉼표 등에서 중간 딜레이
    }

    // 특정 문자 이후 구간 일시정지 (예: 단락 구분)
    if (nextChar === "\n" && pauseDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        typeNextCharacter();
      }, pauseDelay);
    } else {
      timeoutRef.current = setTimeout(() => {
        typeNextCharacter();
      }, delay);
    }
  };

  return (
    <Animated.Text style={[styles.text, { opacity: opacityAnim }, style]}>
      {displayedText}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});

export default TypingEffect;
