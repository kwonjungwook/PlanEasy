// src/context/SubscriptionContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

// 구독 관련 상수
const SUBSCRIPTION_KEY = "@user_subscription";

// SubscriptionContext 생성
const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  // 모든 기능을 무료로 제공하므로 항상 true로 설정
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState({
    userId: "free_user",
    planType: "free",
    startDate: new Date().toISOString(),
    expiryDate: null, // 무기한
    paymentMethod: "free",
    status: "active",
  });
  const [loading, setLoading] = useState(false); // 로딩 불필요
  const [error, setError] = useState(null);

  // 초기 구독 상태 로드 - 무료 제공으로 변경
  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        setLoading(false); // 로딩 상태 비활성화

        // 모든 사용자에게 무료로 모든 기능 제공
        setIsSubscribed(true);
        setSubscriptionData({
          userId: user?.uid || "free_user",
          planType: "free",
          startDate: new Date().toISOString(),
          expiryDate: null, // 무기한 무료 제공
          paymentMethod: "free",
          status: "active",
        });
      } catch (err) {
        console.error("구독 정보 로드 오류:", err);
        setError(err.message);
        // 오류가 발생해도 무료로 제공
        setIsSubscribed(true);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionData();
  }, [user]);

  // 구독 시작 함수 - 무료 제공 안내
  const subscribe = async (planType, paymentMethod) => {
    try {
      // 무료 제공 안내
      return true; // 항상 성공 반환
    } catch (err) {
      console.error("구독 시작 오류:", err);
      setError(err.message);
      return true; // 오류가 발생해도 무료로 제공
    }
  };

  // 구독 취소 함수 - 무료 제공이므로 취소 불필요
  const unsubscribe = async () => {
    try {
      // 무료 제공이므로 취소할 구독이 없음
      return true;
    } catch (err) {
      console.error("구독 취소 오류:", err);
      setError(err.message);
      return true;
    }
  };

  // 구독 상태 확인 함수 - 항상 true 반환
  const checkSubscriptionStatus = async () => {
    return true; // 모든 기능 무료 제공
  };

  // Context value
  const value = {
    isSubscribed: true, // 항상 구독 상태로 설정
    subscriptionData,
    loading,
    error,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// useSubscription 훅
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription은 SubscriptionProvider 내부에서만 사용할 수 있습니다"
    );
  }
  return context;
};
