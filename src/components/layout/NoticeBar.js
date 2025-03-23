// src/components/layout/NoticeBar.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NoticeBar = ({ message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>notice</Text>
      </View>
      <Text style={styles.message}>
        <Text style={styles.highlight}>★오늘 마감★</Text> 놓치면 다음은 없어요! 종료되기 전에 꼭 확인하세요➡
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  badge: {
    backgroundColor: '#FE99A4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  highlight: {
    fontWeight: 'bold',
  },
});

export default NoticeBar;