// src/context/SubscriptionContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

// 구독 관련 상수
const SUBSCRIPTION_KEY = "@user_subscription";

// SubscriptionContext 생성
const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 구독 상태 로드
  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        setLoading(true);

        // 사용자가 로그인되어 있지 않으면 구독 취소
        if (!user) {
          setIsSubscribed(false);
          setSubscriptionData(null);
          return;
        }

        // AsyncStorage에서 구독 정보 가져오기
        const storedData = await AsyncStorage.getItem(SUBSCRIPTION_KEY);

        if (storedData) {
          const parsedData = JSON.parse(storedData);

          // 구독 만료 확인
          const isExpired =
            parsedData.expiryDate &&
            new Date(parsedData.expiryDate) < new Date();

          if (!isExpired) {
            setIsSubscribed(true);
            setSubscriptionData(parsedData);
          } else {
            // 만료된 구독 정보 제거
            await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
            setIsSubscribed(false);
            setSubscriptionData(null);
          }
        } else {
          setIsSubscribed(false);
          setSubscriptionData(null);
        }
      } catch (err) {
        console.error("구독 정보 로드 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionData();
  }, [user]);

  // 구독 시작 함수
  const subscribe = async (planType, paymentMethod) => {
    try {
      if (!user) return false;

      // 현재 날짜
      const startDate = new Date();

      // 만료일 계산 (월간: 1개월, 연간: 1년)
      const expiryDate = new Date();
      if (planType === "monthly") {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      // 구독 데이터 생성
      const newSubscription = {
        userId: user.uid,
        planType,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        paymentMethod,
        status: "active",
      };

      // AsyncStorage에 저장
      await AsyncStorage.setItem(
        SUBSCRIPTION_KEY,
        JSON.stringify(newSubscription)
      );

      // 상태 업데이트
      setIsSubscribed(true);
      setSubscriptionData(newSubscription);

      return true;
    } catch (err) {
      console.error("구독 시작 오류:", err);
      setError(err.message);
      return false;
    }
  };

  // 구독 취소 함수
  const unsubscribe = async () => {
    try {
      if (!subscriptionData) return false;

      // 구독 상태 업데이트 (사용자는 만료일까지 서비스 이용 가능)
      const updatedSubscription = {
        ...subscriptionData,
        status: "cancelled",
      };

      // AsyncStorage 업데이트
      await AsyncStorage.setItem(
        SUBSCRIPTION_KEY,
        JSON.stringify(updatedSubscription)
      );

      // 상태 업데이트
      setSubscriptionData(updatedSubscription);

      return true;
    } catch (err) {
      console.error("구독 취소 오류:", err);
      setError(err.message);
      return false;
    }
  };

  // 컨텍스트 값 정의
  const contextValue = {
    isSubscribed,
    subscriptionData,
    loading,
    error,
    subscribe,
    unsubscribe,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
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
