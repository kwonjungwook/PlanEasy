package com.kwonjihoo.PlanEasy;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.navercorp.nid.NaverIdLoginSDK;
import com.navercorp.nid.oauth.NidOAuthLoginState;
import com.navercorp.nid.oauth.OAuthLoginCallback;

public class NaverLoginModule extends ReactContextBaseJavaModule {

    private static final String TAG = "NaverLoginModule";
    private final ReactApplicationContext reactContext;

    private Promise loginPromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            // 필요시 여기서 활동 결과 처리
        }
    };

    public NaverLoginModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(activityEventListener);
    }

    @NonNull
    @Override
    public String getName() {
        return "NaverLoginModule";
    }

    // 단일 객체를 받는 메서드 추가
    @ReactMethod
    public void initialize(ReadableMap config) {
        try {
            String clientId = config.getString("kConsumerKey");
            String clientSecret = config.getString("kConsumerSecret");
            String clientName = config.getString("kServiceAppName");
            
            Log.d(TAG, "Initializing Naver SDK with: " + clientId + ", " + clientName);
            NaverIdLoginSDK.INSTANCE.initialize(reactContext, clientId, clientSecret, clientName);
            Log.d(TAG, "Naver SDK initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Naver SDK: " + e.getMessage());
        }
    }

    // 기존 메서드도 유지 (호환성을 위해)
    @ReactMethod
    public void initializeWithParams(String clientId, String clientSecret, String clientName) {
        try {
            Log.d(TAG, "Initializing Naver SDK with: " + clientId + ", " + clientName);
            NaverIdLoginSDK.INSTANCE.initialize(reactContext, clientId, clientSecret, clientName);
            Log.d(TAG, "Naver SDK initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Naver SDK: " + e.getMessage());
        }
    }

    @ReactMethod
    public void login(final Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        // 안전하게 처리하기 위해 이전 Promise 참조 확인
        if (loginPromise != null) {
            loginPromise.reject("E_CANCELLED", "Previous login request cancelled");
        }

        loginPromise = promise;

        try {
            Log.d(TAG, "시작: 네이버 로그인 인증");

            // 네이버 로그인 콜백
            OAuthLoginCallback oauthLoginCallback = new OAuthLoginCallback() {
                @Override
                public void onSuccess() {
                    Log.d(TAG, "성공: 네이버 로그인");

                    try {
                        String accessToken = NaverIdLoginSDK.INSTANCE.getAccessToken();
                        String refreshToken = NaverIdLoginSDK.INSTANCE.getRefreshToken();

                        if (accessToken != null && !accessToken.isEmpty()) {
                            WritableMap response = new WritableNativeMap();
                            response.putString("accessToken", accessToken);
                            response.putString("refreshToken", refreshToken != null ? refreshToken : "");
                            response.putString("tokenType", NaverIdLoginSDK.INSTANCE.getTokenType());

                            Log.d(TAG, "토큰 정보: " + accessToken.substring(0, Math.min(10, accessToken.length())) + "...");

                            // Promise가 아직 유효한지 확인
                            if (loginPromise != null) {
                                loginPromise.resolve(response);
                                loginPromise = null;
                            }
                        } else {
                            // 토큰이 없는 경우
                            Log.e(TAG, "토큰 없음: 네이버 로그인 성공했으나 토큰이 없음");
                            if (loginPromise != null) {
                                loginPromise.reject("E_NO_TOKEN", "Login succeeded but no token returned");
                                loginPromise = null;
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "오류: 성공 콜백 처리 중 예외 발생", e);
                        if (loginPromise != null) {
                            loginPromise.reject("E_CALLBACK_ERROR", "Error in success callback: " + e.getMessage(), e);
                            loginPromise = null;
                        }
                    }
                }

                public void onFailure(int httpStatus, @NonNull String message) {
                Log.e(TAG, "실패: 네이버 로그인 - HTTP 상태: " + httpStatus + ", 메시지: " + message);
                Log.e(TAG, "추가 정보: " + NaverIdLoginSDK.INSTANCE.getLastErrorCode());
                Log.e(TAG, "추가 설명: " + NaverIdLoginSDK.INSTANCE.getLastErrorDescription());
                    if (loginPromise != null) {
                        loginPromise.reject("E_LOGIN_FAILURE", "Login failed: " + message);
                        loginPromise = null;
                    }
                }

                @Override
                public void onError(int errorCode, @NonNull String message) {
                    Log.e(TAG, "오류: 네이버 로그인 - 에러 코드: " + errorCode + ", 메시지: " + message);
                    if (loginPromise != null) {
                        loginPromise.reject("E_LOGIN_ERROR", "Login error: " + message);
                        loginPromise = null;
                    }
                }
            };

            // 로그인 인증 시작
            NaverIdLoginSDK.INSTANCE.authenticate(currentActivity, oauthLoginCallback);
        } catch (Exception e) {
            Log.e(TAG, "예외: 네이버 인증 시작 중 오류", e);
            loginPromise.reject("E_LOGIN_EXCEPTION", "Exception during login: " + e.getMessage(), e);
            loginPromise = null;
        }
    }
    @ReactMethod
public void logout(final Promise promise) {
    try {
        Log.d(TAG, "logout 시작");
        
        if (NaverIdLoginSDK.INSTANCE.getAccessToken() == null) {
            String error = "네이버 SDK가 초기화되지 않았거나 로그인되지 않았습니다";
            Log.e(TAG, error);
            promise.reject("NOT_INITIALIZED", error);
            return;
        }
        
        // 네이버 SDK 로그아웃
        NaverIdLoginSDK.INSTANCE.logout();
        Log.d(TAG, "네이버 로그아웃 완료");
        promise.resolve(true);
    } catch (Exception e) {
        String errorMsg = "네이버 로그아웃 오류: " + e.getMessage();
        Log.e(TAG, errorMsg, e);
        promise.reject("LOGOUT_ERROR", errorMsg, e);
    }
}

@ReactMethod
public void deleteToken(final Promise promise) {
    try {
        Log.d(TAG, "deleteToken 시작");
        
        if (NaverIdLoginSDK.INSTANCE.getAccessToken() == null) {
            String error = "네이버 SDK가 초기화되지 않았거나 로그인되지 않았습니다";
            Log.e(TAG, error);
            promise.reject("NOT_INITIALIZED", error);
            return;
        }
        
        // 네이버 SDK 토큰 삭제 - 신버전 API 사용
        NaverIdLoginSDK.INSTANCE.logout();
        Log.d(TAG, "네이버 토큰 삭제 완료");
        promise.resolve(true);
    } catch (Exception e) {
        String errorMsg = "네이버 토큰 삭제 오류: " + e.getMessage();
        Log.e(TAG, errorMsg, e);
        promise.reject("DELETE_TOKEN_ERROR", errorMsg, e);
    }
}
}