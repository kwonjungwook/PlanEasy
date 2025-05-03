package com.kwonjihoo.PlanEasy;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
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
import com.navercorp.nid.oauth.NidOAuthLogin;
import com.navercorp.nid.profile.NidProfileCallback;
import com.navercorp.nid.profile.data.NidProfileResponse;
import com.navercorp.nid.profile.data.NidProfile;

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

    /**
     * 네이버 로그인 인증 유형 설정 (force, reprompt 등)
     */
    @ReactMethod
    public void setAuthType(String authType, final Promise promise) {
        try {
            Log.d(TAG, "인증 유형 설정: " + authType);
            Log.d(TAG, "인증 유형 설정은 현재 SDK에서 직접 지원되지 않습니다. 무시합니다.");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "인증 유형 설정 오류: " + e.getMessage(), e);
            promise.reject("SET_AUTH_TYPE_ERROR", "인증 유형 설정 오류: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void setScopes(ReadableArray scopesArray, final Promise promise) {
        try {
            if (NaverIdLoginSDK.INSTANCE == null) {
                Log.e(TAG, "NaverIdLoginSDK가 초기화되지 않았습니다");
                promise.reject("NOT_INITIALIZED", "NaverIdLoginSDK가 초기화되지 않았습니다");
                return;
            }

            // 스코프 목록만 로그로 출력하고 실제 SDK 호출은 하지 않음
            List<String> scopesList = new ArrayList<>();
            for (int i = 0; i < scopesArray.size(); i++) {
                scopesList.add(scopesArray.getString(i));
            }
            Log.d(TAG, "권한 범위 설정 무시됨 (SDK 호환성 문제): " + scopesList.toString());

            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "권한 범위 설정 오류: " + e.getMessage(), e);
            promise.reject("SET_SCOPES_ERROR", "권한 범위 설정 오류: " + e.getMessage(), e);
        }
    }

    // 단일 객체를 받는 메서드 추가
    @ReactMethod
    public void initialize(ReadableMap config, final Promise promise) {
        try {
            String clientId = config.getString("kConsumerKey");
            String clientSecret = config.getString("kConsumerSecret");
            String clientName = config.getString("kServiceAppName");
            // 콜백 URL 정보 추가 (config에서 받거나 기본값 설정)
            String callbackUrl = config.hasKey("kServiceAppUrlScheme")
                    ? config.getString("kServiceAppUrlScheme") + "://oauth"
                    : "naverY3OUgvCptmtmaPTb9GLc://oauth";

            Log.d(TAG, "Initializing Naver SDK with: " + clientId + ", " + clientName);
            Log.d(TAG, "Callback URL: " + callbackUrl);

            // SDK 초기화만 실행
            NaverIdLoginSDK.INSTANCE.initialize(reactContext, clientId, clientSecret, clientName);

            // 권한 범위 설정 코드 제거함
            Log.d(TAG, "Naver SDK initialized successfully");

            // 개발 로그 활성화 (디버깅 용도)
            NaverIdLoginSDK.INSTANCE.showDevelopersLog(true);

            // SDK 상태 확인
            NidOAuthLoginState state = NaverIdLoginSDK.INSTANCE.getState();
            Log.d(TAG, "Naver SDK state after init: " + state);

            // 결과를 JavaScript로 반환
            WritableMap result = new WritableNativeMap();
            result.putString("state", state.toString());
            result.putBoolean("success", true);
            result.putString("callbackUrl", callbackUrl);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Naver SDK: " + e.getMessage(), e);
            promise.reject("E_INIT_ERROR", "Failed to initialize Naver SDK: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getProfile(final Promise promise) {
        try {
            if (NaverIdLoginSDK.INSTANCE.getAccessToken() == null) {
                promise.reject("NO_ACCESS_TOKEN", "Access token is not available. Please login first.");
                return;
            }

            Log.d(TAG, "네이버 프로필 정보 요청 시작");

            // 네이버 SDK 임포트
            com.navercorp.nid.oauth.NidOAuthLogin authLogin = new com.navercorp.nid.oauth.NidOAuthLogin();

            // 콜백 정의 (제네릭 타입 명시)
            authLogin.callProfileApi(
                    new com.navercorp.nid.profile.NidProfileCallback<com.navercorp.nid.profile.data.NidProfileResponse>() {
                        @Override
                        public void onSuccess(com.navercorp.nid.profile.data.NidProfileResponse result) {
                            Log.d(TAG, "프로필 정보 요청 성공");

                            try {
                                // 프로필 정보 추출
                                com.navercorp.nid.profile.data.NidProfile profile = result.getProfile();

                                // 결과 맵 생성
                                WritableMap profileMap = new WritableNativeMap();

                                // 필수 항목 (설정에서 '필수'로 표시된 정보)
                                profileMap.putString("id", profile.getId());
                                profileMap.putString("name", profile.getName());
                                profileMap.putString("email", profile.getEmail());
                                profileMap.putString("nickname", profile.getNickname());

                                // 추가 항목 (설정에서 '추가'로 표시된 정보)
                                // 프로필 사진 - 추가 권한
                                if (profile.getProfileImage() != null) {
                                    profileMap.putString("profileImage", profile.getProfileImage());
                                }

                                // 성별 - 추가 권한
                                if (profile.getGender() != null) {
                                    profileMap.putString("gender", profile.getGender());
                                }

                                // 연령대 - 추가 권한
                                if (profile.getAge() != null) {
                                    profileMap.putString("age", profile.getAge());
                                }

                                // 생일, 출생연도, 휴대전화번호는 권한 설정에 없으므로 제외

                                Log.d(TAG, "프로필 정보: " + profileMap.toString());
                                promise.resolve(profileMap);
                            } catch (Exception e) {
                                Log.e(TAG, "프로필 정보 처리 중 오류: " + e.getMessage(), e);
                                promise.reject("PROFILE_PARSING_ERROR",
                                        "Error while parsing profile: " + e.getMessage(), e);
                            }
                        }

                        @Override
                        public void onFailure(int statusCode, String message) {
                            Log.e(TAG, "프로필 정보 요청 실패: " + message);
                            promise.reject("PROFILE_FAILURE", "Failed to get profile: " + message);
                        }

                        @Override
                        public void onError(int errorCode, String message) {
                            Log.e(TAG, "프로필 정보 요청 오류: " + message);
                            promise.reject("PROFILE_ERROR", "Error getting profile: " + message);
                        }
                    });
        } catch (Exception e) {
            Log.e(TAG, "프로필 정보 요청 예외: " + e.getMessage(), e);
            promise.reject("PROFILE_EXCEPTION", "Exception while getting profile: " + e.getMessage());
        }
    }

    // NaverLoginModule.java
    @ReactMethod
    public void initializeWithParams(String clientId, String clientSecret, String clientName, final Promise promise) {
        try {
            Log.d(TAG, "Initializing Naver SDK with: " + clientId + ", " + clientName);

            // 클라이언트 ID와 시크릿이 빈 값이 아닌지 확인
            if (clientId == null || clientId.isEmpty() || clientSecret == null || clientSecret.isEmpty()) {
                throw new Exception("Client ID or Client Secret is empty");
            }

            NaverIdLoginSDK.INSTANCE.initialize(reactContext, clientId, clientSecret, clientName);

            // 권한 범위 설정 코드 제거함
            Log.d(TAG, "Naver SDK initialized successfully");

            // 개발 로그 활성화
            NaverIdLoginSDK.INSTANCE.showDevelopersLog(true);

            // SDK 상태 확인
            NidOAuthLoginState state = NaverIdLoginSDK.INSTANCE.getState();
            Log.d(TAG, "Naver SDK state after init: " + state);

            WritableMap result = new WritableNativeMap();
            result.putString("state", state.toString());
            result.putBoolean("success", true);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Naver SDK: " + e.getMessage(), e);
            promise.reject("E_INIT_ERROR", "Failed to initialize Naver SDK: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void login(final Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        Log.d(TAG, "SDK 초기화 상태: " + NaverIdLoginSDK.INSTANCE.getState());
        Log.d(TAG, "현재 액티비티: " + currentActivity.getClass().getName());

        // 안전하게 처리하기 위해 이전 Promise 참조 확인
        if (loginPromise != null) {
            loginPromise.reject("E_CANCELLED", "Previous login request cancelled");
        }

        loginPromise = promise;

        try {
            Log.d(TAG, "시작: 네이버 로그인 인증");

            // 먼저 기존 토큰이 있으면 로그아웃
            if (NaverIdLoginSDK.INSTANCE.getAccessToken() != null) {
                Log.d(TAG, "기존 세션 존재: 로그아웃 수행");
                NaverIdLoginSDK.INSTANCE.logout();
            }

            // 네이버 로그인 콜백
            OAuthLoginCallback oauthLoginCallback = new OAuthLoginCallback() {
                // 기존 콜백 내용 유지
                @Override
                public void onSuccess() {
                    // 기존 코드와 동일
                    Log.d(TAG, "성공: 네이버 로그인");

                    try {
                        String accessToken = NaverIdLoginSDK.INSTANCE.getAccessToken();
                        String refreshToken = NaverIdLoginSDK.INSTANCE.getRefreshToken();

                        if (accessToken != null && !accessToken.isEmpty()) {
                            WritableMap response = new WritableNativeMap();
                            response.putString("accessToken", accessToken);
                            response.putString("refreshToken", refreshToken != null ? refreshToken : "");
                            response.putString("tokenType", NaverIdLoginSDK.INSTANCE.getTokenType());

                            Log.d(TAG,
                                    "토큰 정보: " + accessToken.substring(0, Math.min(10, accessToken.length())) + "...");

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
                        // 예외 처리
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
                        WritableMap errorMap = new WritableNativeMap();
                        errorMap.putInt("httpStatus", httpStatus);
                        errorMap.putString("message", message);
                        errorMap.putString("errorCode", NaverIdLoginSDK.INSTANCE.getLastErrorCode().toString());
                        errorMap.putString("errorDesc", NaverIdLoginSDK.INSTANCE.getLastErrorDescription());

                        loginPromise.reject("E_LOGIN_FAILURE", "Login failed: " + message, errorMap);
                        loginPromise = null;
                    }
                }

                @Override
                public void onError(int errorCode, @NonNull String message) {
                    Log.e(TAG, "오류: 네이버 로그인 - 에러 코드: " + errorCode + ", 메시지: " + message);

                    if (loginPromise != null) {
                        WritableMap errorMap = new WritableNativeMap();
                        errorMap.putInt("errorCode", errorCode);
                        errorMap.putString("message", message);

                        loginPromise.reject("E_LOGIN_ERROR", "Login error: " + message, errorMap);
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