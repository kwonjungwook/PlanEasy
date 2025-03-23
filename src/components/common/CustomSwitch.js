// src/components/common/CustomSwitch.js

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Platform } from 'react-native';

const CustomSwitch = ({ value, onValueChange, activeColor = "#7676ED", inactiveColor = "#E9ECEF", style = {} }) => {
  // 애니메이션 값
  const animatedValue = new Animated.Value(value ? 1 : 0);
  
  // 버튼 위치와 배경색 애니메이션
  const buttonTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22]
  });
  
  const backgroundColorInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor]
  });

  // value가 변경될 때 애니메이션 실행
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      bounciness: 2,
      speed: 12,
      useNativeDriver: false
    }).start();
  }, [value]);

  // 토글 처리
  const handleToggle = () => {
    onValueChange && onValueChange(!value);
  };

  return (
    <TouchableWithoutFeedback onPress={handleToggle}>
      <View style={[styles.container, style]}>
        <Animated.View 
          style={[
            styles.toggleBackground, 
            { 
              backgroundColor: backgroundColorInterpolate,
              borderColor: value ? activeColor : '#D1D1D1',
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.thumb, 
              { transform: [{ translateX: buttonTranslate }] }
            ]}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBackground: {
    width: 46,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  }
});

export default CustomSwitch;