// src/components/Guide.js
// 앱 사용법 가이드 컴포넌트

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform
} from 'react-native';

export default function Guide() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>사용 가이드</Text>
        <Text style={styles.headerSubtitle}>
          앱을 효과적으로 활용하는 방법을 알아보세요
        </Text>
      </View>

      {/* 섹션 1: 루틴 설정 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>1</Text>
          <Text style={styles.sectionTitle}>루틴 만들기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📅</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>일정 유형 선택하기</Text>
              <Text style={styles.stepDescription}>
                루틴화면에서 원하는 일정 관리 방식을 선택하세요:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>평일 & 주말</Text>: 평일과 주말을 구분하여 일정 관리</Text>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>요일별 커스텀</Text>: 월~일요일까지 각각 다른 일정 설정</Text>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>사용자 커스텀</Text>: 개인화된 상세 일정 설정</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 TIP</Text>
            <Text style={styles.tipText}>
              규칙적인 생활을 하신다면 '평일 & 주말' 옵션이 편리하고, 요일마다 다른 일정이 있으시다면 '요일별 커스텀'을 추천해요!
            </Text>
          </View>
        </View>
      </View>

      {/* 섹션 2: 달력 적용 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>2</Text>
          <Text style={styles.sectionTitle}>달력에 일정 적용하기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🗓️</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>날짜 선택 및 적용</Text>
              <Text style={styles.stepDescription}>
                달력 화면에서 일정을 적용할 날짜를 선택하세요:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>단일 선택</Text>: 특정 날짜 하나를 탭하여 선택</Text>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>다중 선택</Text>: 우측측 상단 '다중 선택' 누른 후 여러 날짜 탭</Text>
                <Text style={styles.bullet}>• <Text style={styles.bulletText}>적용하기</Text>: 원하는 루틴을 선택한 날짜에 적용</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              일정을 적용하면 시간표 탭에도 자동으로 반영됩니다. 한 번의 설정으로 모든 화면이 동기화됩니다.
            </Text>
          </View>
        </View>
      </View>

      {/* 섹션 3: 홈 화면 알림 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>3</Text>
          <Text style={styles.sectionTitle}>오늘의 일정 확인하기</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏠</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>홈 화면 알림</Text>
              <Text style={styles.stepDescription}>
                홈 화면에서 오늘의 일정을 한눈에 확인할 수 있습니다:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• 현재 날짜가 자동으로 표시됩니다</Text>
                <Text style={styles.bullet}>• 오늘 일정의 요약 정보를 볼 수 있습니다</Text>
                <Text style={styles.bullet}>• 중요 일정은 강조 표시로 쉽게 확인 가능합니다</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 TIP</Text>
            <Text style={styles.tipText}>
              매일 아침 홈 화면을 확인하면 하루 일정을 놓치지 않고 효율적으로 관리할 수 있어요!
            </Text>
          </View>
        </View>
      </View>

      {/* 추가 도움말 섹션 */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>더 궁금한 점이 있으신가요?</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>자주 묻는 질문 보기</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>앱 버전 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4263EB',
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 28,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 4,
  },
  bulletText: {
    fontWeight: '600',
    color: '#343A40',
  },
  tipContainer: {
    backgroundColor: '#E9F3FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1971C2',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#1864AB',
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: '#FFF9DB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#E67700',
    lineHeight: 20,
  },
  helpSection: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: '#4263EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  versionText: {
    fontSize: 12,
    color: '#ADB5BD',
  },
});