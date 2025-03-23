// src/components/common/ToastManager.js

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';

const ToastManager = ({ toasts }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer}>
      {toasts.map((toast) => {
        const ToastComponent = toast.onPress ? TouchableOpacity : Animated.View;
        
        return (
          <ToastComponent 
            key={toast.id} 
            style={styles.toast}
            onPress={toast.onPress}
            activeOpacity={toast.onPress ? 0.7 : 1}
          >
            <Text style={styles.toastText}>
              {toast.message.includes("완료") ? "✓ " : ""}
              {toast.message}
            </Text>
            {toast.onPress && (
              <View style={styles.toastAction}>
                <Text style={styles.toastActionText}>탭하기</Text>
              </View>
            )}
          </ToastComponent>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: 'rgba(43, 38, 38, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  toastText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  toastAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  toastActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ToastManager;