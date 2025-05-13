// src/utils/pointHistoryManager.js

import AsyncStorage from "@react-native-async-storage/async-storage";

//---------------------------------
// 🔑 Storage keys
//---------------------------------
const POINT_HISTORY_KEY = "@point_history"; // 모든 히스토리 공통 저장소
const COLOR_PURCHASES_KEY = "@color_purchases"; // ⚠️ 별도 색상 구매 캐시가 필요할 때만 사용

//---------------------------------
// 🗂️ Generic helpers
//---------------------------------
// 1) 전체(또는 limit개) 히스토리 불러오기
export const getPointHistory = async (limit = -1) => {
  try {
    const json = await AsyncStorage.getItem(POINT_HISTORY_KEY);
    const history = json ? JSON.parse(json) : [];
    return limit > 0 ? history.slice(0, limit) : history;
  } catch (err) {
    console.error("포인트 내역 로드 오류:", err);
    return [];
  }
};

// 2) 히스토리 항목 하나 저장 (earn / spend 공통)
export const savePointHistory = async (entry) => {
  try {
    const prev = await getPointHistory();
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(), // ✅ 통일: date 필드 사용
      ...entry,
    };
    await AsyncStorage.setItem(
      POINT_HISTORY_KEY,
      JSON.stringify([newEntry, ...prev])
    );
    return true;
  } catch (err) {
    console.error("포인트 히스토리 저장 오류:", err);
    return false;
  }
};

//---------------------------------
// 💸 Spend helpers
//---------------------------------
export const addDDaySlotPurchase = (price) =>
  savePointHistory({
    type: "spend",
    category: "dday",
    amount: -Math.abs(price),
    description: "D‑Day 슬롯 구매",
    meta: {},
  });

export const addColorPurchase = (price, colorIndex) =>
  savePointHistory({
    type: "spend",
    category: "color",
    amount: -Math.abs(price),
    description: "색상 구매",
    meta: { colorIndex },
  });

//---------------------------------
// 💰 Earn helpers
//---------------------------------
export const addPointEarnEntry = (amount, source = "task", description = "") =>
  savePointHistory({
    type: "earn",
    category: source, // e.g. task | streak | level
    amount: Math.abs(amount),
    description,
    meta: {},
  });

//---------------------------------
// 🎨 (옵션) 색상 구매 캐시: 별도 보관이 필요할 경우만 사용
//---------------------------------
export const getColorPurchases = async (limit = -1) => {
  try {
    const json = await AsyncStorage.getItem(COLOR_PURCHASES_KEY);
    const purchases = json ? JSON.parse(json) : [];
    return limit > 0 ? purchases.slice(0, limit) : purchases;
  } catch (err) {
    console.error("색상 구매 내역 로드 오류:", err);
    return [];
  }
};

export const getRecentColorPurchases = (limit = 5) => getColorPurchases(limit);
