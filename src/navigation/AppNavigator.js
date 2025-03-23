// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 스크린 가져오기
import DailyScreen from '../screens/DailyScreen';
import WeeklyTimetableScreen from '../screens/WeeklyTimetableScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EditScheduleScreen from '../screens/EditScheduleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AIFeedbackScreen from '../screens/AIFeedbackScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 메인 탭 네비게이션
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Daily') {
          iconName = focused ? 'today' : 'today-outline';
        } else if (route.name === 'Weekly') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Calendar') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'AI') {
          iconName = focused ? 'analytics' : 'analytics-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FE99A4',
      tabBarInactiveTintColor: 'gray',
      headerShown: false, // MainLayout이 헤더를 대체하므로 기본 헤더 숨김
    })}
  >
    <Tab.Screen name="Daily" component={DailyScreen} options={{ title: '오늘' }} />
    <Tab.Screen name="Weekly" component={WeeklyTimetableScreen} options={{ title: '주간' }} />
    <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: '달력' }} />
    <Tab.Screen name="AI" component={AIFeedbackScreen} options={{ title: '분석' }} />
  </Tab.Navigator>
);

// 앱 전체 네비게이션
const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen name="EditSchedule" component={EditScheduleScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Missions" component={MissionsScreen} />
  </Stack.Navigator>
);

export default AppNavigator;