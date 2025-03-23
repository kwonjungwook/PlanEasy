// src/screens2/FAQ.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQ = ({ navigation }) => {
  // 자주 묻는 질문 목록
  const faqItems = [
    {
      question: '플랜이지는а어떤 앱인가요?',
      answer: '플랜이지는 학습과 일상 계획을 효율적으로 관리할 수 있는 종합 플래너 앱입니다. 시간표 관리, 일정 추적, 학습 타이머, AI 학습 피드백 등의 기능을 제공합니다.'
    },
    {
      question: '무료로 사용할 수 있나요?',
      answer: '네, 기본 기능은 무료로 사용하실 수 있습니다. 다만 일부 고급 기능은 플랜이지 플러스 구독을 통해 이용하실 수 있습니다.'
    },
    {
      question: '플랜이지 플러스 구독은 얼마인가요?',
      answer: '플랜이지 플러스 구독은 월 9,900원, 연 99,000원으로 제공됩니다. 학생 할인과 정기적인 프로모션도 진행하고 있으니 앱 내 알림을 확인해 주세요.'
    },
    {
      question: '알림 설정은 어디서 변경하나요?',
      answer: '마이페이지 > 알림 설정에서 각종 알림을 켜고 끌 수 있습니다. 원하는 시간에 학습 알림을 받을 수 있도록 시간 설정도 가능합니다.'
    },
    {
      question: '데이터 백업 방법이 있나요?',
      answer: '네, 계정에 로그인하시면 데이터가 자동으로 클라우드에 백업됩니다. 기기를 변경하더라도 같은 계정으로 로그인하시면 이전 데이터를 불러올 수 있습니다.'
    },
    {
      question: 'AI 피드백 기능은 어떻게 사용하나요?',
      answer: 'AI 탭에서 학습 내용이나 계획을 입력하시면 AI가 학습 효율성을 분석하고 맞춤형 조언을 제공합니다. 플랜이지 플러스 구독자는 더 상세한 분석과 추천을 받으실 수 있습니다.'
    },
    {
      question: '시간표는 어떻게 설정하나요?',
      answer: '시간표 탭에서 요일별, 시간별로 수업이나 일정을 등록할 수 있습니다. 드래그 앤 드롭으로 쉽게 일정을 조정할 수 있으며, 반복 일정 설정도 가능합니다.'
    },
    {
      question: '학습 타이머는 어떻게 활용하나요?',
      answer: '타이머 탭에서 공부 시간과 휴식 시간을 설정할 수 있습니다. 포모도로 기법을 적용한 집중-휴식 사이클로 효율적인 학습을 도와드립니다. 공부 시간은 자동으로 기록되어 통계를 확인할 수 있습니다.'
    },
    {
      question: '구독을 취소하려면 어떻게 해야 하나요?',
      answer: '마이페이지 > 플랜이지 플러스 > 구독관리에서 구독을 관리할 수 있습니다. 구독 취소는 앱 내에서 직접 하실 수도 있고, 구글 플레이 스토어나 앱 스토어의 구독 관리 메뉴에서도 가능합니다.'
    },
    {
      question: '앱 사용 중 문제가 발생했습니다. 어디에 문의해야 하나요?',
      answer: '마이페이지 > 도움말 및 문의하기 메뉴를 통해 문의하시거나, support@planizy.com으로 이메일을 보내주시면 빠르게 답변드리겠습니다.'
    }
  ];

  // 각 FAQ 항목의 확장/축소 상태를 관리
  const [expandedItems, setExpandedItems] = useState({});

  // FAQ 항목 토글 함수
  const toggleItem = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>자주 묻는 질문</Text>
        <Text style={styles.subtitle}>플랜이지 사용에 대한 도움이 필요하신가요?</Text>
      </View>
      
      {faqItems.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.faqItem}
          onPress={() => toggleItem(index)}
          activeOpacity={0.7}
        >
          <View style={styles.questionContainer}>
            <Text style={styles.question}>{item.question}</Text>
            <Ionicons 
              name={expandedItems[index] ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#50cebb" 
            />
          </View>
          
          {expandedItems[index] && (
            <View style={styles.answerContainer}>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>더 궁금한 점이 있으신가요?</Text>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.contactButtonText}>문의하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    padding: 16,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    paddingRight: 10,
  },
  answerContainer: {
    marginTop: 12,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  answer: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  contactSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  contactTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  contactButton: {
    backgroundColor: '#50cebb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default FAQ;