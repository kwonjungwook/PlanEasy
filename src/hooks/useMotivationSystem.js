// src/hooks/useMotivationSystem.js

import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Required XP for each level
const getRequiredXP = (level) => 100 + (level - 1) * 20;

const useMotivationSystem = () => {
  // Core state
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState(null);
  const [morningTasksCompleted, setMorningTasksCompleted] = useState(0);
  const [eveningTasksCompleted, setEveningTasksCompleted] = useState(0);
  
  // Animation state
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  
  // Progress bar animation
  const progressWidth = useRef(new Animated.Value(0)).current;
  
  // Sounds
  const [levelUpSound, setLevelUpSound] = useState(null);
  const [badgeSound, setBadgeSound] = useState(null);
  
  // Load motivation data
  const loadMotivationData = async () => {
    try {
      const data = await AsyncStorage.getItem('@motivation_data');
      if (data) {
        const parsed = JSON.parse(data);
        setLevel(parsed.level || 1);
        setXp(parsed.xp || 0);
        setEarnedBadges(parsed.earnedBadges || []);
        setTotalCompletedTasks(parsed.totalCompletedTasks || 0);
        setCurrentStreak(parsed.currentStreak || 0);
        setLastCompletionDate(parsed.lastCompletionDate);
        setMorningTasksCompleted(parsed.morningTasksCompleted || 0);
        setEveningTasksCompleted(parsed.eveningTasksCompleted || 0);
      }
      
      // Load sounds
      await loadSounds();
    } catch (error) {
      console.log('동기부여 데이터 로드 오류:', error);
    }
  };
  
  // Load sound effects for motivation system
  const loadSounds = async () => {
    try {
      // Load level-up sound
      const { sound: levelSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/levelup.wav'),
        { volume: 1.0 }
      ).catch(() => ({ sound: null }));
      
      // Load badge sound
      const { sound: badgeAudio } = await Audio.Sound.createAsync(
        require('../../assets/sounds/badge.mp3'),
        { volume: 1.0 }
      ).catch(() => ({ sound: null }));
      
      setLevelUpSound(levelSound);
      setBadgeSound(badgeAudio);
    } catch (error) {
      console.log('동기부여 사운드 로드 오류:', error);
    }
  };
  
  // Save motivation data
  const saveMotivationData = async () => {
    try {
      const data = {
        level,
        xp,
        earnedBadges,
        totalCompletedTasks,
        currentStreak,
        lastCompletionDate,
        morningTasksCompleted,
        eveningTasksCompleted,
      };
      await AsyncStorage.setItem('@motivation_data', JSON.stringify(data));
    } catch (error) {
      console.log('동기부여 데이터 저장 오류:', error);
    }
  };
  
  // Effect to update XP bar when level or XP changes
  useEffect(() => {
    const requiredXP = getRequiredXP(level);
    const progress = Math.min(xp / requiredXP, 1);
    
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [xp, level]);
  
  // Effect to clean up sounds
  useEffect(() => {
    return () => {
      if (levelUpSound) levelUpSound.unloadAsync();
      if (badgeSound) badgeSound.unloadAsync();
    };
  }, [levelUpSound, badgeSound]);
  
  // Auto-dismiss level-up animation
  useEffect(() => {
    if (showLevelUpAnimation) {
      const timer = setTimeout(() => {
        setShowLevelUpAnimation(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showLevelUpAnimation]);
  
  // Auto-dismiss badge animation
  useEffect(() => {
    if (showBadgeAnimation) {
      const timer = setTimeout(() => {
        setShowBadgeAnimation(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showBadgeAnimation]);
  
  // Check and handle level up
  const checkAndHandleLevelUp = (newXp) => {
    const requiredXP = getRequiredXP(level);
    if (newXp >= requiredXP) {
      // Level up!
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setXp(newXp - requiredXP);
      
      setNewLevel(nextLevel);
      setShowLevelUpAnimation(true);
      
      // Check for level badges
      if (nextLevel === 5) {
        checkAndAddBadge("level_5");
      } else if (nextLevel === 10) {
        checkAndAddBadge("level_10");
      }
      
      return true;
    }
    return false;
  };
  
  // Check and add badge
  const checkAndAddBadge = (badgeId, extraData = {}) => {
    // Already earned this badge?
    if (earnedBadges.some((badge) => badge.id === badgeId)) {
      return false;
    }
    
    // Find badge in badge definitions
    const BADGES = [
      { id: "first_complete", name: "첫걸음", icon: "🌱", description: "첫 번째 일정을 완료했습니다!", xpBonus: 10 },
      { id: "five_complete", name: "불타오르네", icon: "🔥", description: "5개의 일정을 완료했습니다!", xpBonus: 15 },
      { id: "ten_complete", name: "열일중", icon: "💯", description: "10개의 일정을 완료했습니다!", xpBonus: 20 },
      { id: "streak_3", name: "습관의 시작", icon: "⚡", description: "3일 연속 일정을 완료했습니다!", xpBonus: 30 },
      { id: "level_5", name: "성장하는 중", icon: "📈", description: "레벨 5에 도달했습니다!", xpBonus: 50 },
      { id: "level_10", name: "플래너 마스터", icon: "🏆", description: "레벨 10에 도달했습니다!", xpBonus: 100 },
      { id: "perfect_day", name: "완벽한 하루", icon: "🌟", description: "하루의 모든 일정을 완료했습니다!", xpBonus: 40 },
      { id: "morning_person", name: "아침형 인간", icon: "🌞", description: "아침 일정을 3개 이상 완료했습니다!", xpBonus: 20 },
      { id: "night_owl", name: "밤 올빼미", icon: "🌙", description: "저녁 일정을 3개 이상 완료했습니다!", xpBonus: 20 },
    ];
    
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return false;
    
    // Add badge
    const newEarnedBadges = [
      ...earnedBadges,
      {
        ...badge,
        earnedAt: new Date().toISOString(),
        extraData,
      },
    ];
    setEarnedBadges(newEarnedBadges);
    
    // Show badge animation
    setEarnedBadge(badge);
    setShowBadgeAnimation(true);
    
    // Apply XP bonus
    if (badge.xpBonus) {
      const bonusXP = badge.xpBonus;
      setXp(prevXP => {
        const newTotalXP = prevXP + bonusXP;
        checkAndHandleLevelUp(newTotalXP);
        return newTotalXP;
      });
    }
    
    return true;
  };
  
  // Handle task completion
  const handleTaskCompletion = async (task) => {
    try {
      // Base XP for completing a task
      const earnedXP = 20;
      const newXP = xp + earnedXP;
      const newTotalCompletedTasks = totalCompletedTasks + 1;
      
      // Date calculations for streaks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastDate = lastCompletionDate ? new Date(lastCompletionDate) : null;
      let newStreak = currentStreak;
      
      if (lastDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.getTime() === yesterday.getTime()) {
          newStreak++;
        } else if (lastDate.getTime() < yesterday.getTime()) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      // Update state
      setXp(prevXP => {
        const didLevelUp = checkAndHandleLevelUp(newXP);
        return didLevelUp ? prevXP : newXP;
      });
      
      setTotalCompletedTasks(newTotalCompletedTasks);
      setCurrentStreak(newStreak);
      setLastCompletionDate(today.toISOString());
      
      // Time-specific counters
      const hour = parseInt(task.startTime.split(":")[0]);
      if (hour < 12) {
        const newMorningCount = morningTasksCompleted + 1;
        setMorningTasksCompleted(newMorningCount);
        
        if (newMorningCount >= 3) {
          checkAndAddBadge("morning_person");
        }
      } else if (hour >= 18) {
        const newEveningCount = eveningTasksCompleted + 1;
        setEveningTasksCompleted(newEveningCount);
        
        if (newEveningCount >= 3) {
          checkAndAddBadge("night_owl");
        }
      }
      
      // Task count badges
      if (newTotalCompletedTasks === 1) {
        checkAndAddBadge("first_complete");
      } else if (newTotalCompletedTasks === 5) {
        checkAndAddBadge("five_complete");
      } else if (newTotalCompletedTasks === 10) {
        checkAndAddBadge("ten_complete");
      }
      
      // Streak badges
      if (newStreak >= 3) {
        checkAndAddBadge("streak_3");
      }
      
      // Save data
      await saveMotivationData();
    } catch (error) {
      console.error("Task completion handling error:", error);
    }
  };
  
  // Handle task uncompletion (reverse the completion)
  const handleTaskUncompletion = async (task) => {
    try {
      // Subtract XP (same as earned when completed)
      const lostXP = 20;
      const newXP = Math.max(0, xp - lostXP);
      setXp(newXP);
      
      // Decrement total completed task count
      const newTotalCompletedTasks = Math.max(0, totalCompletedTasks - 1);
      setTotalCompletedTasks(newTotalCompletedTasks);
      
      // Adjust time-of-day counters
      const hour = parseInt(task.startTime.split(":")[0]);
      if (hour < 12) {
        const newMorningCount = Math.max(0, morningTasksCompleted - 1);
        setMorningTasksCompleted(newMorningCount);
      } else if (hour >= 18) {
        const newEveningCount = Math.max(0, eveningTasksCompleted - 1);
        setEveningTasksCompleted(newEveningCount);
      }
      
      // Save updated data
      await saveMotivationData();
    } catch (error) {
      console.error("Task uncompletion handling error:", error);
    }
  };
  
  // Play level-up sound
  const playLevelUpSound = async () => {
    try {
      if (levelUpSound) {
        await levelUpSound.setStatusAsync({ volume: 1.0 });
        await levelUpSound.replayAsync();
      }
    } catch (error) {
      console.log("레벨업 사운드 재생 오류:", error);
    }
  };
  
  // Play badge sound
  const playBadgeSound = async () => {
    try {
      if (badgeSound) {
        await badgeSound.setStatusAsync({ volume: 1.0 });
        await badgeSound.replayAsync();
      }
    } catch (error) {
      console.log("배지 사운드 재생 오류:", error);
    }
  };
  
  return {
    // State
    level,
    xp,
    earnedBadges, 
    totalCompletedTasks,
    currentStreak,
    morningTasksCompleted,
    eveningTasksCompleted,
    lastCompletionDate,
    
    // Animation state
    showLevelUpAnimation,
    newLevel,
    showBadgeAnimation,
    earnedBadge,
    progressWidth,
    
    // Functions
    loadMotivationData,
    saveMotivationData,
    handleTaskCompletion,
    handleTaskUncompletion,
    checkAndAddBadge
  };
};

export default useMotivationSystem;