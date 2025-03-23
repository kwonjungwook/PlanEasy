// src/context/SubscriptionContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

// Subscription storage key
const SUBSCRIPTION_KEY = "@user_subscription";

// Create context
const SubscriptionContext = createContext(null);

// Provider component
export const SubscriptionProvider = ({ children }) => {
  const { userData } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);

  // Load subscription status on mount and when user changes
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        setLoading(true);
        console.log("Loading subscription status...");

        // Only try to load subscription if user is logged in
        if (userData?.uid) {
          console.log("User logged in, fetching subscription data");
          const storedData = await AsyncStorage.getItem(SUBSCRIPTION_KEY);

          if (storedData) {
            const parsedData = JSON.parse(storedData);

            // Check if subscription data belongs to current user
            if (parsedData.userId === userData.uid) {
              console.log("Found subscription data for current user");
              setIsSubscribed(parsedData.isSubscribed || false);
              setSubscriptionData(parsedData);
            } else {
              // If different user, reset subscription
              console.log("Different user, resetting subscription");
              setIsSubscribed(false);
              setSubscriptionData(null);
            }
          } else {
            // No stored data, default to non-subscribed
            console.log("No stored subscription data");
            setIsSubscribed(false);
            setSubscriptionData(null);
          }
        } else {
          // Not logged in, reset subscription
          console.log("User not logged in, clearing subscription");
          setIsSubscribed(false);
          setSubscriptionData(null);
        }
      } catch (error) {
        console.error("Failed to load subscription status:", error);
        setIsSubscribed(false);
        setSubscriptionData(null);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, [userData]);

  // Save subscription to storage
  const saveSubscriptionData = async (data) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Failed to save subscription data:", error);
      return false;
    }
  };

  // Subscribe user
  const subscribe = async (planType = "monthly", paymentMethod = "unknown") => {
    if (!userData) {
      console.warn("Cannot subscribe: No user logged in");
      return false;
    }

    try {
      console.log(`Subscribing user to ${planType} plan`);
      const newSubscriptionData = {
        userId: userData.uid,
        isSubscribed: true,
        planType,
        startDate: new Date().toISOString(),
        paymentMethod,
        // Mock expiry date - one month from now for monthly, one year for yearly
        expiryDate: new Date(
          Date.now() + (planType === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      const success = await saveSubscriptionData(newSubscriptionData);

      if (success) {
        setIsSubscribed(true);
        setSubscriptionData(newSubscriptionData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to subscribe user:", error);
      return false;
    }
  };

  // Unsubscribe user
  const unsubscribe = async () => {
    if (!userData) {
      console.warn("Cannot unsubscribe: No user logged in");
      return false;
    }

    try {
      console.log("Unsubscribing user");
      const updatedData = {
        userId: userData.uid,
        isSubscribed: false,
        cancelDate: new Date().toISOString(),
        // Keep other properties from the previous subscription
        ...(subscriptionData || {}),
      };

      const success = await saveSubscriptionData(updatedData);

      if (success) {
        setIsSubscribed(false);
        setSubscriptionData(updatedData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to unsubscribe user:", error);
      return false;
    }
  };

  // Clear subscription data (used when logging out)
  const clearSubscriptionData = async () => {
    try {
      console.log("Clearing subscription data");
      await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
      setIsSubscribed(false);
      setSubscriptionData(null);
      return true;
    } catch (error) {
      console.error("Failed to clear subscription data:", error);
      return false;
    }
  };

  // Context value
  const value = {
    isSubscribed,
    subscriptionData,
    loading,
    subscribe,
    unsubscribe,
    clearSubscriptionData,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
