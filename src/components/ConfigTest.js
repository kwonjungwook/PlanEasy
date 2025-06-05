// src/components/ConfigTest.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { KAKAO_APP_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '@env'; // 환경변수 테스트

const ConfigTest = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 설정 값 확인</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 app.json 값들 (expo-constants)</Text>
        <Text style={styles.item}>앱 이름: {Constants.expoConfig?.name || '없음'}</Text>
        <Text style={styles.item}>버전: {Constants.expoConfig?.version || '없음'}</Text>
        <Text style={styles.item}>스킴: {Constants.expoConfig?.scheme || '없음'}</Text>
        <Text style={styles.item}>패키지명: {Constants.expoConfig?.android?.package || '없음'}</Text>
        <Text style={styles.item}>FREE_MODE: {Constants.expoConfig?.extra?.FREE_MODE_ENABLED || '없음'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 로그인 키 정보</Text>
        <Text style={styles.item}>
          카카오 앱키: {Constants.expoConfig?.plugins?.find(p => 
            Array.isArray(p) && p[0] === '@react-native-seoul/kakao-login'
          )?.[1]?.kakaoAppKey || '없음'}
        </Text>
        <Text style={styles.item}>
          네이버 클라이언트ID: {Constants.expoConfig?.plugins?.find(p => 
            Array.isArray(p) && p[0] === '@react-native-seoul/naver-login'
          )?.[1]?.consumerKey || '없음'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👀 환경변수 직접 테스트 (.env)</Text>
        <Text style={styles.item}>카카오 키: {KAKAO_APP_KEY || '로드 실패'}</Text>
        <Text style={styles.item}>네이버 ID: {NAVER_CLIENT_ID || '로드 실패'}</Text>
        <Text style={styles.item}>네이버 SECRET: {NAVER_CLIENT_SECRET || '로드 실패'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 딥링크 스킴</Text>
        {Constants.expoConfig?.android?.intentFilters?.map((filter, index) => (
          filter.data?.scheme && (
            <Text key={index} style={styles.item}>
              스킴 {index + 1}: {filter.data.scheme}
            </Text>
          )
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏗️ 빌드 정보</Text>
        <Text style={styles.item}>앱 버전: {Constants.nativeAppVersion || '없음'}</Text>
        <Text style={styles.item}>빌드 넘버: {Constants.nativeBuildVersion || '없음'}</Text>
        <Text style={styles.item}>플랫폼: {Constants.platform?.ios ? 'iOS' : 'Android'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐛 디버그 정보</Text>
        <Text style={styles.debugText}>
          {JSON.stringify(Constants.expoConfig, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
});

export default ConfigTest;