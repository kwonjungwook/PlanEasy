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

  // 웹뷰에서 메시지 수신 처리 (새로운 형식)
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "success") {
        // 새로운 형식에서는 userData가 이미 완성된 형태로 전송됨
        onLoginSuccess(data.userData);
        onClose();
      } else if (data.type === "error") {
        console.error("카카오 로그인 에러:", data.message);
        Alert.alert("로그인 오류", data.message || "카카오 로그인 중 오류가 발생했습니다.");
        onClose();
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
      Alert.alert("로그인 오류", "로그인 처리 중 오류가 발생했습니다.");
      onClose();
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
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>카카오 로그인</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                  background: #f8f9fa;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .login-container {
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 300px;
                  width: 100%;
                }
                .kakao-logo {
                  width: 60px;
                  height: 60px;
                  background: #FEE500;
                  border-radius: 50%;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 24px;
                  font-weight: bold;
                }
                .login-btn {
                  background: #FEE500;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  font-size: 16px;
                  font-weight: bold;
                  cursor: pointer;
                  width: 100%;
                  color: #3C1E1E;
                }
                .login-btn:hover {
                  background: #FFDB00;
                }
                .loading {
                  display: none;
                  margin-top: 20px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="login-container">
                <div class="kakao-logo">K</div>
                <h2>카카오 로그인</h2>
                <p>카카오 계정으로 로그인하세요</p>
                <button id="kakao-login-btn" class="login-btn" onclick="loginWithKakao()">카카오로 로그인</button>
                <div id="loading" class="loading">로그인 중...</div>
              </div>
              
              <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
              <script>
                // 카카오 SDK 초기화
                Kakao.init('f6e0c48ea0ec5bf79602db7c14ae07bc');
                
                function loginWithKakao() {
                  document.getElementById('kakao-login-btn').style.display = 'none';
                  document.getElementById('loading').style.display = 'block';
                  
                  Kakao.Auth.login({
                    success: function(authObj) {
                      console.log('로그인 성공:', authObj);
                      
                      // 사용자 정보 요청
                      Kakao.API.request({
                        url: '/v2/user/me',
                        success: function(res) {
                          console.log('사용자 정보:', res);
                          
                          const userData = {
                            uid: 'kakao-' + res.id,
                            email: res.kakao_account?.email || '',
                            displayName: res.kakao_account?.profile?.nickname || '카카오 사용자',
                            photoURL: res.kakao_account?.profile?.profile_image_url || null,
                            authProvider: 'kakao',
                            accessToken: authObj.access_token
                          };
                          
                          // React Native로 결과 전송
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'success',
                            userData: userData
                          }));
                        },
                        fail: function(error) {
                          console.error('사용자 정보 요청 실패:', error);
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'error',
                            message: '사용자 정보를 가져올 수 없습니다.'
                          }));
                        }
                      });
                    },
                    fail: function(err) {
                      console.error('로그인 실패:', err);
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'error',
                        message: '로그인에 실패했습니다.'
                      }));
                    }
                  });
                }
              </script>
            </body>
            </html>
            `,
          }}
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
