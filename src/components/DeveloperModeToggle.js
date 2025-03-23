// src/components/DeveloperModeToggle.js
import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext"; // useAuth 사용

// 개발자 모드 토글 컴포넌트
const DeveloperModeToggle = ({ onClose }) => {
  const [visible, setVisible] = useState(false);
  const [useRealAuth, setUseRealAuthState] = useState(false);

  // AuthContext에서 필요한 기능 가져오기
  const { logout, setRealAuth } = useAuth();

  // 현재 실제 인증 상태 로드
  useEffect(() => {
    const loadAuthState = async () => {
      const value = await AsyncStorage.getItem("@use_real_auth");
      setUseRealAuthState(value === "true");
    };
    loadAuthState();
  }, []);

  // 실제 인증 상태 변경 처리
  const handleToggleRealAuth = async (value) => {
    setUseRealAuthState(value);
    await setRealAuth(value);
    console.log(`실제 인증 모드: ${value ? "활성화" : "비활성화"}`);
  };

  // 앱 재시작 안내 및 로그아웃
  const handleApplyChanges = async () => {
    await logout();
    alert("설정이 적용되었습니다. 로그아웃되었으니 다시 로그인해주세요.");
    if (onClose) onClose();
  };

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  if (!__DEV__) return null; // 개발 모드에서만 표시

  return (
    <View style={styles.container}>
      {!visible ? (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleVisibility}
        >
          <Text style={styles.toggleButtonText}>개발자 옵션</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.title}>개발자 옵션</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionText}>실제 구글 로그인 사용</Text>
            <Switch
              value={useRealAuth}
              onValueChange={handleToggleRealAuth}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={useRealAuth ? "#2196F3" : "#f4f3f4"}
            />
          </View>

          <Text style={styles.description}>
            {useRealAuth
              ? "실제 구글 로그인이 활성화되었습니다. 로그아웃 후 다시 로그인하세요."
              : "테스트용 임시 계정이 사용됩니다."}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleApplyChanges}
            >
              <Text style={styles.buttonText}>적용 및 로그아웃</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={toggleVisibility}
            >
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80, // 탭 네비게이션 위에 위치하도록 조정
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: "white",
    fontSize: 12,
  },
  panel: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  optionText: {
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#50cebb", // 앱 테마에 맞게 색상 변경
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default DeveloperModeToggle;
