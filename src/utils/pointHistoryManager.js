// src/utils/pointHistoryManager.js

import AsyncStorage from '@react-native-async-storage/async-storage';

// 포인트 내역 관련 상수
const POINT_HISTORY_KEY = '@point_history';
const COLOR_PURCHASES_KEY = '@color_purchases';

/**
 * 포인트 내역에 새 항목 추가
 * @param {Object} entry - 포인트 내역 항목 객체
 * @param {string} entry.type - 내역 유형 (earn: 획득, spend: 사용)
 * @param {string} entry.category - 카테고리 (color, dday, level 등)
 * @param {number} entry.amount - 포인트 금액 (양수 또는 음수)
 * @param {string} entry.description - 설명
 * @param {Date} entry.date - 날짜 (기본값: 현재 시간)
 */
export const addPointHistoryEntry = async (entry) => {
  try {
    // 기존 내역 불러오기
    const history = await getPointHistory();
    
    // 새 항목 추가
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...entry
    };
    
    // 내역 업데이트 및 저장
    const updatedHistory = [newEntry, ...history];
    await AsyncStorage.setItem(POINT_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    return true;
  } catch (error) {
    console.error('포인트 내역 추가 오류:', error);
    return false;
  }
};

/**
 * 저장된 포인트 내역 불러오기
 * @param {number} limit - 불러올 항목 수 제한 (기본값: 모든 항목)
 * @returns {Array} 포인트 내역 배열
 */
export const getPointHistory = async (limit = -1) => {
  try {
    const jsonValue = await AsyncStorage.getItem(POINT_HISTORY_KEY);
    if (!jsonValue) return [];
    
    const history = JSON.parse(jsonValue);
    return limit > 0 ? history.slice(0, limit) : history;
  } catch (error) {
    console.error('포인트 내역 로드 오류:', error);
    return [];
  }
};

/**
 * 색상 구매 내역에 새 항목 추가
 * @param {Object} purchase - 구매 내역 항목
 * @param {number} purchase.colorIndex - 색상 인덱스
 * @param {string} purchase.colorName - 색상 이름 (프리미엄, 레어 등)
 * @param {number} purchase.price - 구매 가격
 */
export const addColorPurchase = async (purchase) => {
  try {
    // 기존 구매 내역 불러오기
    const purchases = await getColorPurchases();
    
    // 새 항목 추가
    const newPurchase = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...purchase
    };
    
    // 구매 내역 업데이트 및 저장
    const updatedPurchases = [newPurchase, ...purchases];
    await AsyncStorage.setItem(COLOR_PURCHASES_KEY, JSON.stringify(updatedPurchases));
    
    // 포인트 내역에도 추가
    await addPointHistoryEntry({
      type: 'spend',
      category: 'color',
      amount: -purchase.price,
      description: `색상 구매: ${purchase.colorName}`
    });
    
    return true;
  } catch (error) {
    console.error('색상 구매 내역 추가 오류:', error);
    return false;
  }
};

/**
 * 저장된 색상 구매 내역 불러오기
 * @param {number} limit - 불러올 항목 수 제한 (기본값: 모든 항목)
 * @returns {Array} 색상 구매 내역 배열
 */
export const getColorPurchases = async (limit = -1) => {
  try {
    const jsonValue = await AsyncStorage.getItem(COLOR_PURCHASES_KEY);
    if (!jsonValue) return [];
    
    const purchases = JSON.parse(jsonValue);
    return limit > 0 ? purchases.slice(0, limit) : purchases;
  } catch (error) {
    console.error('색상 구매 내역 로드 오류:', error);
    return [];
  }
};

/**
 * 최근 색상 구매 내역 불러오기
 * @param {number} limit - 불러올 항목 수 (기본값: 5개)
 * @returns {Array} 최근 색상 구매 내역 배열
 */
export const getRecentColorPurchases = async (limit = 5) => {
  try {
    const purchases = await getColorPurchases();
    return purchases.slice(0, limit);
  } catch (error) {
    console.error('최근 색상 구매 내역 로드 오류:', error);
    return [];
  }
};

/**
 * D-Day 슬롯 구매 내역 추가
 * @param {number} price - 구매 가격
 */
export const addDDaySlotPurchase = async (price) => {
  try {
    // 포인트 내역에 추가
    await addPointHistoryEntry({
      type: 'spend',
      category: 'dday',
      amount: -price,
      description: 'D-Day 슬롯 구매'
    });
    
    return true;
  } catch (error) {
    console.error('D-Day 슬롯 구매 내역 추가 오류:', error);
    return false;
  }
};

/**
 * 포인트 획득 내역 추가
 * @param {number} amount - 획득한 포인트 양
 * @param {string} source - 포인트 획득 출처 (task, streak, level 등)
 * @param {string} description - 상세 설명
 */
export const addPointEarnEntry = async (amount, source, description) => {
  try {
    await addPointHistoryEntry({
      type: 'earn',
      category: source,
      amount: amount,
      description: description
    });
    
    return true;
  } catch (error) {
    console.error('포인트 획득 내역 추가 오류:', error);
    return false;
  }
};