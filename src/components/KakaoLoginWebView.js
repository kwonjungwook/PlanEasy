// src/components/KakaoLoginWebView.js
import React, { useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";

const KakaoLoginWebView = ({ visible, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  // 웹뷰에 주입할 JavaScript 코드
  const INJECTED_JAVASCRIPT = `
    if (!window.kakaoProcessed) {
      window.kakaoProcessed = true;
      
      // 카카오 SDK 로드
      const script = document.createElement('script');
      script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
      script.onload = () => {
        // SDK 초기화
        Kakao.init('b0c6503f9985f98ade15374ac2f4f580'); // JavaScript 키
        
        // 로그인 시도
        if (!Kakao.isInitialized()) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: '카카오 SDK 초기화 실패'
          }));
          return;
        }
        
        Kakao.Auth.login({
          success: (authObj) => {
            // 사용자 정보 요청
            Kakao.API.request({
              url: '/v2/user/me',
              success: (res) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'success',
                  token: authObj,
                  profile: res
                }));
              },
              fail: (error) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: '사용자 정보 요청 실패: ' + JSON.stringify(error)
                }));
              }
            });
          },
          fail: (error) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: '로그인 실패: ' + JSON.stringify(error)
            }));
          }
        });
      };
      document.head.appendChild(script);
    }
    true;
  `;

  // 웹뷰에서 메시지 수신 처리
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "success") {
        const userData = {
          uid: `kakao-${data.profile.id}`,
          email: data.profile.kakao_account?.email || "",
          displayName:
            data.profile.kakao_account?.profile?.nickname || "카카오 사용자",
          photoURL:
            data.profile.kakao_account?.profile?.profile_image_url || null,
          authProvider: "kakao",
          accessToken: data.token.access_token,
        };

        onLoginSuccess(userData);
        onClose();
      } else if (data.type === "error") {
        console.error("카카오 로그인 에러:", data.message);
        Alert.alert("로그인 오류", "카카오 로그인 중 오류가 발생했습니다.");
        onClose();
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{
            uri: "https://accounts.kakao.com/login?continue=https://kauth.kakao.com/oauth/authorize?client_id=b0c6503f9985f98ade15374ac2f4f580&redirect_uri=http://localhost:19006&response_type=code",
          }}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          // WebView 설정에 필요한 속성 추가
          setSupportMultipleWindows={true}
          allowsBackForwardNavigationGestures={true}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FEE500" />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default KakaoLoginWebView;
