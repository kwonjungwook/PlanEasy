// src/firebaseConfig.js
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase 구성 정보
const firebaseConfig = {
  apiKey: "AIzaSyCueOL8BWqP2YNoJw626mjO-LHikCxo6ZM",
  authDomain: "planeasy-74132.firebaseapp.com",
  projectId: "planeasy-74132",
  storageBucket: "planeasy-74132.firebasestorage.app",
  messagingSenderId: "68267517120",
  appId: "1:68267517120:web:05f2844c52bf805cc2f925",
  measurementId: "G-XHGCVS4EKS",
};

// 싱글톤 패턴으로 변경 - Firebase가 이미 초기화되었는지 확인
let app;
let auth;

// Firebase 앱이 이미 초기화되었는지 확인
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Auth 초기화 with persistent storage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApps()[0]; // 이미 초기화된 앱 사용
  auth = getAuth(app); // 이미 초기화된 인증 사용
}

export { auth, GoogleAuthProvider };
export default app;
