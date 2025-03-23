// components/RewardPopup.js
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions,
  Easing
} from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const RewardPopup = ({ 
  visible, 
  title = "보상 획득!", 
  message = "보상을 획득했습니다", 
  rewards = [], 
  onClose 
}) => {
  // 애니메이션 값
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rewardAnimations = useRef(rewards.map(() => new Animated.Value(0))).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  const [confetti, setConfetti] = useState([]);
  
  // 컨페티 생성
  useEffect(() => {
    if (visible) {
      // 랜덤 컨페티 생성
      const createConfetti = () => {
        const newConfetti = [];
        for (let i = 0; i < 50; i++) {
          newConfetti.push({
            id: i,
            x: Math.random() * width,
            size: Math.random() * 10 + 5,
            color: [
              '#FFD700', '#FF6B6B', '#4CAF50', 
              '#2196F3', '#9C27B0', '#FF9800'
            ][Math.floor(Math.random() * 6)],
            speed: Math.random() * 3 + 2,
            delay: Math.random() * 500,
          });
        }
        setConfetti(newConfetti);
      };
      
      createConfetti();
      
      // 애니메이션 시작
      Animated.sequence([
        // 팝업 등장
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 70,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        // 컨페티 애니메이션
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        // 보상 순차적 등장
        Animated.stagger(200, 
          rewardAnimations.map(anim => 
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else {
      // 팝업 닫을 때 애니메이션 초기화
      rewardAnimations.forEach(anim => anim.setValue(0));
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, rewardAnimations, confettiAnim]);
  
  // 보상 없으면 렌더링 안함
  if (!visible) return null;
  
  // 보상 유형에 따른 아이콘/배경색 결정
  const getRewardStyle = (type) => {
    switch (type) {
      case 'badge':
        return { 
          icon: '🏆',
          bgColor: '#FFF9C4',
          borderColor: '#FFC107'
        };
      case 'title':
        return { 
          icon: '👑',
          bgColor: '#E3F2FD',
          borderColor: '#2196F3'
        };
      case 'level':
        return { 
          icon: '⭐',
          bgColor: '#E8F5E9',
          borderColor: '#4CAF50'
        };
      case 'points':
        return { 
          icon: '💰',
          bgColor: '#FFF3E0',
          borderColor: '#FF9800'
        };
      default:
        return { 
          icon: '🎁',
          bgColor: '#F3E5F5',
          borderColor: '#9C27B0'
        };
    }
  };
  
  return (
    <View style={styles.container}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />
      
      {/* 컨페티 */}
      {confetti.map(item => (
        <Animated.View
          key={item.id}
          style={{
            position: 'absolute',
            left: item.x,
            top: -item.size,
            width: item.size,
            height: item.size,
            backgroundColor: item.color,
            borderRadius: item.size / 2,
            transform: [{
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, height + item.size + item.delay],
              })
            }]
          }}
        />
      ))}
      
      {/* 메인 팝업 */}
      <Animated.View 
        style={[
          styles.popup,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {/* 보상 목록 */}
        <View style={styles.rewardsContainer}>
          {rewards.map((reward, index) => {
            const rewardStyle = getRewardStyle(reward.type);
            
            return (
              <Animated.View 
                key={`${reward.type}-${reward.id || index}`}
                style={[
                  styles.rewardItem,
                  {
                    backgroundColor: rewardStyle.bgColor,
                    borderColor: rewardStyle.borderColor,
                    transform: [
                      { scale: rewardAnimations[index] },
                      {
                        rotate: rewardAnimations[index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ['-20deg', '15deg', '0deg']
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.rewardIcon}>
                  {reward.icon || rewardStyle.icon}
                </Text>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardDescription}>
                  {reward.description}
                </Text>
              </Animated.View>
            );
          })}
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>확인</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  popup: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  rewardItem: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  rewardName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#50cebb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default RewardPopup;