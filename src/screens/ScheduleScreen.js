// src/screens/ScheduleScreen.js
// 중앙 일정관리 메인화면

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    BackHandler,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WeekendSchedule from '../components/WeekendSchedule';
import DaySchedule from '../components/DaySchedule';
import ConsumerCustom from '../components/ConsumerCustom';
import Guide from '../components/Guide';

// 화면 높이를 가져옵니다.
const windowHeight = Dimensions.get('window').height;

export default function ScheduleScreen() {
    const [selectedMode, setSelectedMode] = useState(null);
    const navigation = useNavigation();
    
    // 안전한 바닥 패딩 값 - 탭바 높이(70) + 추가 안전 여백(20)
    const SAFE_BOTTOM_PADDING = 90;

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedMode) {
                    setSelectedMode(null);
                    return true;
                }
                return false;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                BackHandler.removeEventListener('hardwareBackPress', onBackPress);
            };
        }, [selectedMode])
    );

    // 모드가 선택된 경우에 백 버튼을 보여주는 헤더 컴포넌트
    const renderHeader = () => {
        if (selectedMode) {
            return (
                <View style={styles.headerWithBack}>
                  
                </View>
            );
        }
        return (
            <View style={styles.header}>
                {/* 기본 헤더 내용 */}
            </View>
        );
    };

    const renderModeSelection = () => (
        <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.sectionTitle}>일정 만들기</Text>
            <View style={styles.scheduleCardsContainer}>
                <TouchableOpacity
                    style={styles.modeCard}
                    onPress={() => setSelectedMode('weekday-weekend')}
                >
                    <View style={styles.modeIconContainer}>
                        <Text style={styles.modeIcon}>📅</Text>
                    </View>
                    <Text style={styles.modeTitle}>평일 & 주말 일정</Text>
                    <Text style={styles.modeDescription}>
                        평일과 주말로 나누어{'\n'}규칙적인 일정을 관리합니다
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.modeCard}
                    onPress={() => setSelectedMode('daily-custom')}
                >
                    <View style={styles.modeIconContainer}>
                        <Text style={styles.modeIcon}>🗓️</Text>
                    </View>
                    <Text style={styles.modeTitle}>요일별 커스텀</Text>
                    <Text style={styles.modeDescription}>
                        월~일요일까지{'\n'}각각 다른 일정을 설정합니다
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.modeCard}
                    onPress={() => setSelectedMode('consumer-custom')}
                >
                    <View style={styles.modeIconContainer}>
                        <Text style={styles.modeIcon}>⚙️</Text>
                    </View>
                    <Text style={styles.modeTitle}>사용자 커스텀</Text>
                    <Text style={styles.modeDescription}>
                        개인 설정에 맞게{'\n'}일정을 세부 조정합니다
                    </Text>
                </TouchableOpacity>
            </View>
            
            <Text style={styles.helpSectionTitle}>도움말</Text>
            <TouchableOpacity
                style={styles.guideCard}
                onPress={() => setSelectedMode('guide')}
            >
                <View style={styles.guideContent}>
                    <View style={styles.guideIconContainer}>
                        <Text style={styles.guideIcon}>📘</Text>
                    </View>
                    <View style={styles.guideTextContainer}>
                        <Text style={styles.guideTitle}>사용 가이드</Text>
                        <Text style={styles.guideDescription}>
                            앱 사용 방법과 다양한 기능을 알아봅니다
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
            
            {/* 탭바를 위한 안전한 하단 여백 */}
            <View style={{ height: SAFE_BOTTOM_PADDING }} />
        </ScrollView>
    );

    // 모드 별 컴포넌트를 렌더링하는 함수
    const renderModeContent = () => {
        if (!selectedMode) return null;

        // 모든 하위 컴포넌트를 ScrollView로 감싸서 렌더링
        return (
            <ScrollView 
                style={styles.modeContentScrollView}
                contentContainerStyle={{ paddingBottom: SAFE_BOTTOM_PADDING }}
            >
                {selectedMode === 'weekday-weekend' && <WeekendSchedule />}
                {selectedMode === 'daily-custom' && <DaySchedule />}
                {selectedMode === 'consumer-custom' && <ConsumerCustom />}
                {selectedMode === 'guide' && <Guide />}
            </ScrollView>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            {renderHeader()}
            
            {!selectedMode ? (
                renderModeSelection()
            ) : (
                renderModeContent()
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    modeContentScrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 20, // 기본 패딩, 하단 안전 영역은 View로 추가
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    headerWithBack: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#495057',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 16,
         },
    helpSectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#212529',
        marginTop:10,
        marginBottom: 16,
    },
    scheduleCardsContainer: {
        flexDirection: 'column',
        marginBottom: 12,
    },
    modeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 17,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    guideCard: {
        backgroundColor: '#EDF2FF',
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    guideContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guideTextContainer: {
        flex: 1,
    },
    modeIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    guideIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#DDE5FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modeIcon: {
        fontSize: 24,
    },
    guideIcon: {
        fontSize: 24,
    },
    modeTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 5,
    },
    guideTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#343A40',
        marginBottom: 4,
    },
    modeDescription: {
        fontSize: 15,
        color: '#868E96',
        lineHeight: 20,
    },
    guideDescription: {
        fontSize: 14,
        color: '#495057',
        lineHeight: 20,
    },
});