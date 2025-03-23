import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CategoryTabs = ({ activeCategory, onSelectCategory }) => {
  const categories = [
    { id: 'search', label: '', icon: 'search-outline' },
    { id: 'all', label: '전체', icon: '' },
    { id: 'subscribe', label: '구독', icon: '' },
    { id: 'travel', label: '여행스케줄 ✈️', icon: '' },
    { id: 'schedule', label: '시간표😎', icon: '' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tabItem,
              category.id === 'search' && styles.searchTab,
              activeCategory === category.id && styles.activeTab,
            ]}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            {category.icon ? (
              <Ionicons
                name={category.icon}
                size={22}
                color={activeCategory === category.id ? '#fff' : '#333'}
              />
            ) : (
              <Text
                style={[
                  styles.tabLabel,
                  activeCategory === category.id && styles.activeTabLabel,
                ]}
              >
                {category.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchTab: {
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#222',
  },
  tabLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#fff',
  },
});

export default CategoryTabs;