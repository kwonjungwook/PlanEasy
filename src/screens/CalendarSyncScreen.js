// src/screens/CalendarSyncScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { CalendarPermissionService } from "../services/CalendarPermissionService";
import { getGoogleCalendarService } from "../services/GoogleCalendarService";
import { getNaverCalendarService } from "../services/NaverCalendarService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_PREFERENCES_KEY = "@calendar_sync_preferences";

const CalendarSyncScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasGooglePermission, setHasGooglePermission] = useState(false);
  const [syncPreferences, setSyncPreferences] = useState({
    googleCalendar: {
      enabled: false,
      direction: "bidirectional", // "bidirectional", "toGoogle", "fromGoogle"
    },
    naverCalendar: {
      enabled: false,
      direction: "toNaver", // 네이버는 단방향만 지원
    },
  });

  // 초기화: 권한 상태 및 설정 불러오기
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 구글 캘린더 권한 확인
      if (user?.authProvider === "google") {
        const hasPermission = await CalendarPermissionService.hasCalendarPermission();
        setHasGooglePermission(hasPermission);
      }

      // 저장된 동기화 설정 불러오기
      const savedPreferences = await AsyncStorage.getItem(SYNC_PREFERENCES_KEY);
      if (savedPreferences) {
        setSyncPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error("설정 로드 오류:", error);
    }
  };

  // 구글 캘린더 권한 요청
  const handleRequestGooglePermission = async () => {
    try {
      setLoading(true);
      const granted = await CalendarPermissionService.requestCalendarPermission();
      
      if (granted) {
        setHasGooglePermission(true);
        Alert.alert("성공", "구글 캘린더 권한을 획득했습니다.");
      } else {
        Alert.alert("실패", "구글 캘린더 권한 획득에 실패했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 동기화 설정 저장
  const saveSyncPreferences = async (newPreferences) => {
    try {
      setSyncPreferences(newPreferences);
      await AsyncStorage.setItem(
        SYNC_PREFERENCES_KEY,
        JSON.stringify(newPreferences)
      );
    } catch (error) {
      console.error("설정 저장 오류:", error);
    }
  };

  // 구글 캘린더 동기화 토글
  const toggleGoogleSync = async (value) => {
    if (value && !hasGooglePermission) {
      Alert.alert(
        "권한 필요",
        "구글 캘린더 동기화를 사용하려면 먼저 권한을 허용해주세요.",
        [{ text: "확인" }]
      );
      return;
    }

    const newPreferences = {
      ...syncPreferences,
      googleCalendar: {
        ...syncPreferences.googleCalendar,
        enabled: value,
      },
    };
    await saveSyncPreferences(newPreferences);
  };

  // 네이버 캘린더 동기화 토글
  const toggleNaverSync = async (value) => {
    if (user?.authProvider !== "naver") {
      Alert.alert(
        "네이버 로그인 필요",
        "네이버 캘린더 동기화는 네이버 로그인 사용자만 이용할 수 있습니다.",
        [{ text: "확인" }]
      );
      return;
    }

    const newPreferences = {
      ...syncPreferences,
      naverCalendar: {
        ...syncPreferences.naverCalendar,
        enabled: value,
      },
    };
    await saveSyncPreferences(newPreferences);
  };

  // 동기화 방향 변경
  const changeGoogleSyncDirection = async (direction) => {
    const newPreferences = {
      ...syncPreferences,
      googleCalendar: {
        ...syncPreferences.googleCalendar,
        direction: direction,
      },
    };
    await saveSyncPreferences(newPreferences);
  };

  // 수동 동기화 실행
  const handleManualSync = async () => {
    try {
      setLoading(true);
      
      if (syncPreferences.googleCalendar.enabled) {
        // 구글 캘린더 동기화 로직
        const calendarService = await getGoogleCalendarService();
        const testResult = await calendarService.testConnection();
        
        if (testResult.success) {
          Alert.alert("성공", "구글 캘린더 연결 테스트 성공!");
        } else {
          Alert.alert("실패", "구글 캘린더 연결 실패: " + testResult.error);
        }
      }
      
      if (syncPreferences.naverCalendar.enabled) {
        // 네이버 캘린더 동기화 로직
        const accessToken = user?.accessToken;
        if (accessToken) {
          const calendarService = await getNaverCalendarService(accessToken);
          const testResult = await calendarService.testConnection();
          
          if (testResult.success) {
            Alert.alert("성공", "네이버 캘린더 연결 테스트 성공!");
          } else {
            Alert.alert("실패", "네이버 캘린더 연결 실패: " + testResult.error);
          }
        }
      }
    } catch (error) {
      Alert.alert("오류", "동기화 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>캘린더 동기화</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 구글 캘린더 섹션 */}
        {user?.authProvider === "google" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>구글 캘린더</Text>
            
            {!hasGooglePermission ? (
              <View style={styles.permissionCard}>
                <Ionicons name="calendar-outline" size={48} color="#4285F4" />
                <Text style={styles.permissionText}>
                  구글 캘린더와 동기화하려면{"\n"}권한이 필요합니다.
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={handleRequestGooglePermission}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.permissionButtonText}>권한 허용</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.syncOption}>
                  <Text style={styles.optionLabel}>동기화 사용</Text>
                  <Switch
                    value={syncPreferences.googleCalendar.enabled}
                    onValueChange={toggleGoogleSync}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={syncPreferences.googleCalendar.enabled ? "#4285F4" : "#f4f3f4"}
                  />
                </View>
                
                {syncPreferences.googleCalendar.enabled && (
                  <View style={styles.directionOptions}>
                    <Text style={styles.directionLabel}>동기화 방향</Text>
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        syncPreferences.googleCalendar.direction === "bidirectional" &&
                          styles.directionButtonActive,
                      ]}
                      onPress={() => changeGoogleSyncDirection("bidirectional")}
                    >
                      <Ionicons name="swap-horizontal" size={20} color="#333" />
                      <Text style={styles.directionButtonText}>양방향</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        syncPreferences.googleCalendar.direction === "toGoogle" &&
                          styles.directionButtonActive,
                      ]}
                      onPress={() => changeGoogleSyncDirection("toGoogle")}
                    >
                      <Ionicons name="arrow-forward" size={20} color="#333" />
                      <Text style={styles.directionButtonText}>앱 → 구글</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        syncPreferences.googleCalendar.direction === "fromGoogle" &&
                          styles.directionButtonActive,
                      ]}
                      onPress={() => changeGoogleSyncDirection("fromGoogle")}
                    >
                      <Ionicons name="arrow-back" size={20} color="#333" />
                      <Text style={styles.directionButtonText}>구글 → 앱</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* 네이버 캘린더 섹션 */}
        {user?.authProvider === "naver" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>네이버 캘린더</Text>
            
            <View style={styles.syncOption}>
              <Text style={styles.optionLabel}>동기화 사용</Text>
              <Switch
                value={syncPreferences.naverCalendar.enabled}
                onValueChange={toggleNaverSync}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={syncPreferences.naverCalendar.enabled ? "#1EC800" : "#f4f3f4"}
              />
            </View>
            
            {syncPreferences.naverCalendar.enabled && (
              <Text style={styles.infoText}>
                네이버 캘린더는 앱 → 네이버 단방향 동기화만 지원됩니다.
              </Text>
            )}
          </View>
        )}

        {/* 수동 동기화 버튼 */}
        {(syncPreferences.googleCalendar.enabled ||
          syncPreferences.naverCalendar.enabled) && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSync}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sync" size={24} color="#fff" />
                <Text style={styles.syncButtonText}>지금 동기화</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* 안내 문구 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>동기화 안내</Text>
          <Text style={styles.infoText}>
            • 양방향 동기화: 앱과 캘린더 간 일정이 서로 동기화됩니다.{"\n"}
            • 단방향 동기화: 선택한 방향으로만 일정이 전송됩니다.{"\n"}
            • 동기화는 수동으로 실행하거나 일정 저장 시 자동으로 실행됩니다.{"\n"}
            • 중복 방지를 위해 동일한 일정은 한 번만 동기화됩니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  permissionCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  syncOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  optionLabel: {
    fontSize: 16,
    color: "#333",
  },
  directionOptions: {
    marginTop: 10,
  },
  directionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  directionButtonActive: {
    backgroundColor: "#e8f0fe",
    borderColor: "#4285F4",
  },
  directionButtonText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#50cebb",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default CalendarSyncScreen;
