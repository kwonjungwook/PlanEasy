// src/hooks/useTimerLogic.js
import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ToastEventSystem } from "../components/common/AutoToast";
import * as KeepAwake from "expo-keep-awake";

export const useTimerLogic = (
  selectedMethod,
  selectedDate,
  recordStudySession,
  studySessions
) => {
  // 타이머 상태
  const [timeRemaining, setTimeRemaining] = useState(
    selectedMethod.workDuration
  );
  const [timerState, setTimerState] = useState("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [sessionSubject, setSessionSubject] = useState("공부시간");
  const [timerModeBeforePause, setTimerModeBeforePause] = useState("working");

  // 참조 값
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalElapsedRef = useRef(0);
  const cycleLogRef = useRef([]);

  // 화면 켜짐 유지 함수
  const activateKeepAwake = useCallback(async () => {
    try {
      if (KeepAwake.activateKeepAwakeAsync) {
        await KeepAwake.activateKeepAwakeAsync();
      } else if (KeepAwake.activate) {
        KeepAwake.activate();
      }
      console.log("화면 켜짐 유지 활성화");
    } catch (error) {
      console.error("화면 켜짐 유지 활성화 오류:", error);
    }
  }, []);

  const deactivateKeepAwake = useCallback(async () => {
    try {
      if (KeepAwake.deactivateKeepAwakeAsync) {
        await KeepAwake.deactivateKeepAwakeAsync();
      } else if (KeepAwake.deactivate) {
        KeepAwake.deactivate();
      }
      console.log("화면 켜짐 유지 비활성화");
    } catch (error) {
      console.error("화면 켜짐 유지 비활성화 오류:", error);
    }
  }, []);

  // 타이머 상태에 따라 화면 켜짐 유지 설정
  useEffect(() => {
    if (timerState === "working" || timerState === "break") {
      // 타이머가 실행 중일 때 화면 켜짐 유지
      activateKeepAwake();
    } else {
      // 타이머가 멈췄을 때 화면 켜짐 해제
      deactivateKeepAwake();
    }
  }, [timerState, activateKeepAwake, deactivateKeepAwake]);

  // 컴포넌트 언마운트 시 화면 켜짐 해제
  useEffect(() => {
    return () => {
      deactivateKeepAwake();
    };
  }, [deactivateKeepAwake]);

  // 기존 타이머 방식 변경 시 설정
  useEffect(() => {
    console.log(`타이머 방식 변경: ${selectedMethod.name}`);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState("idle");
    setTimeRemaining(selectedMethod.workDuration);
    setElapsedTime(0);
    setCurrentCycle(1);
  }, [selectedMethod]);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timerState === "idle" || timerState === "paused") {
      // 경과 시간 계산을 위한 시작 시간
      const startTime = Date.now() - elapsedTime * 1000;
      startTimeRef.current = startTime;

      // 타이머 상태 설정 - 일시정지 후 재개 시 이전 상태 복원
      let newState;
      if (timerState === "paused") {
        newState = timerModeBeforePause;
      } else {
        newState = "working";
      }

      setTimerState(newState);

      // 사이클 로그 추가
      if (
        newState === "working" &&
        (timerState === "idle" ||
          (timerState === "paused" &&
            timeRemaining === selectedMethod.workDuration))
      ) {
        const currentTime = new Date().toLocaleTimeString();
        cycleLogRef.current.push(`사이클 ${currentCycle} 시작: ${currentTime}`);
      }

      // 타이머 시작
      timerRef.current = setInterval(() => {
        // 경과 시간 계산
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        // 현재 단계 시간 (작업 또는 휴식)
        const currentPhaseDuration =
          newState === "working"
            ? selectedMethod.workDuration
            : selectedMethod.breakDuration;

        // 남은 시간 계산
        const remaining = Math.max(0, currentPhaseDuration - elapsed);
        setTimeRemaining(remaining);

        // 단계 완료 처리
        if (remaining <= 0) {
          clearInterval(timerRef.current);

          if (newState === "working") {
            // 작업 완료 -> 휴식 시간
            handleWorkCompleted(elapsed);
          } else {
            // 휴식 완료 -> 다음 작업 시간
            handleBreakCompleted();
          }
        }
      }, 1000);
    }
  }, [
    timerState,
    elapsedTime,
    timerModeBeforePause,
    currentCycle,
    timeRemaining,
    selectedMethod,
  ]);

  // 일시정지
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);

      // 일시정지 전 상태 저장
      setTimerModeBeforePause(timerState);

      // 상태를 일시정지로 변경
      setTimerState("paused");

      // 일시정지 로그 추가
      const currentTime = new Date().toLocaleTimeString();
      cycleLogRef.current.push(
        `사이클 ${currentCycle} 일시정지: ${currentTime}`
      );
    }
  }, [timerState, currentCycle]);

  // 작업 완료 처리
  const handleWorkCompleted = useCallback(
    (workedTime) => {
      // 작업 완료 로그
      const currentTime = new Date().toLocaleTimeString();
      cycleLogRef.current.push(
        `사이클 ${currentCycle} 작업 완료: ${currentTime} (${formatTime(
          workedTime
        )})`
      );

      // 총 작업 시간 누적
      totalElapsedRef.current += workedTime;
      console.log(
        `작업 완료: ${formatTime(
          workedTime
        )} 동안 작업, 총 공부시간: ${formatTime(totalElapsedRef.current)}`
      );

      // 다음 사이클 및 휴식 시간 설정
      const nextCycle = currentCycle + 1;
      setCurrentCycle(nextCycle);

      // 휴식 시간 로그
      const breakStartTime = new Date().toLocaleTimeString();
      cycleLogRef.current.push(
        `사이클 ${nextCycle} 휴식 시작: ${breakStartTime}`
      );

      // 휴식 모드로 전환
      setTimerState("break");
      setTimeRemaining(selectedMethod.breakDuration);
      setElapsedTime(0);
      startTimeRef.current = Date.now();

      // 휴식 타이머 시작
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, selectedMethod.breakDuration - elapsed);

        setTimeRemaining(remaining);
        setElapsedTime(elapsed);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleBreakCompleted();
        }
      }, 1000);
    },
    [currentCycle, selectedMethod]
  );

  // 휴식 완료 처리
  const handleBreakCompleted = useCallback(() => {
    // 휴식 완료 로그
    const currentTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(
      `사이클 ${currentCycle} 휴식 완료: ${currentTime}`
    );

    // 다음 작업 세션 준비
    const nextCycle = currentCycle + 1;
    setCurrentCycle(nextCycle);
    setTimerState("idle");
    setTimeRemaining(selectedMethod.workDuration);
    setElapsedTime(0);

    // 다음 사이클 준비 로그
    const newTime = new Date().toLocaleTimeString();
    cycleLogRef.current.push(`사이클 ${nextCycle} 준비됨: ${newTime}`);

    // 바로 다음 작업 시작
    startTimer();
  }, [currentCycle, selectedMethod]);

  // 타이머 정지 및 세션 저장
  const stopTimer = useCallback(() => {
    if (timerState !== "idle") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 현재 타이머 상태에 따라 총 시간 누적
      if (
        timerState === "working" ||
        (timerState === "paused" && timerModeBeforePause === "working")
      ) {
        totalElapsedRef.current += elapsedTime;
        console.log(
          `타이머 종료: 작업 중 상태, 총 시간에 ${elapsedTime}초 추가, 총 ${totalElapsedRef.current}초`
        );
      } else {
        console.log(
          `타이머 종료: 휴식 중 상태, 총 시간 ${totalElapsedRef.current}초 유지`
        );
      }

      // 종료 로그 추가
      const currentTime = new Date().toLocaleTimeString();
      cycleLogRef.current.push(`사이클 ${currentCycle} 종료: ${currentTime}`);

      // 최소 10초 이상일 때만 저장
      if (totalElapsedRef.current >= 10) {
        console.log(
          `종료 시 총 공부시간(${formatTime(totalElapsedRef.current)}) 저장`
        );
        saveSessionSilently();
      } else {
        console.log("10초 미만의 세션은 저장하지 않습니다.");
        resetTimer();
      }

      ToastEventSystem.showToast("타이머가 종료되었습니다", 1500);
    }
  }, [timerState, timerModeBeforePause, elapsedTime, currentCycle]);

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState("idle");
    setTimeRemaining(selectedMethod.workDuration);
    setElapsedTime(0);
    setCurrentCycle(1);
    setTimerModeBeforePause("working");
    totalElapsedRef.current = 0;
    cycleLogRef.current = [];
  }, [selectedMethod]);

  // 세션 자동 저장
  const saveSessionSilently = useCallback(() => {
    try {
      if (totalElapsedRef.current > 0) {
        // 세션 데이터 준비
        const sessionData = {
          id: `session-${Date.now()}`,
          date: selectedDate,
          method: selectedMethod.id,
          duration: totalElapsedRef.current,
          subject: sessionSubject,
          notes: cycleLogRef.current.join("\n"),
          timestamp: new Date().toISOString(),
          cycles: currentCycle,
        };

        // 세션 저장
        recordStudySession(sessionData);

        console.log(
          `${format(
            new Date(),
            "HH:mm:ss"
          )} - 공부 세션 저장됨. 시간: ${formatTime(totalElapsedRef.current)}`
        );
        ToastEventSystem.showToast("공부 시간이 기록되었습니다", 1500);
      }

      // 타이머 리셋
      resetTimer();
    } catch (error) {
      console.error("세션 저장 오류:", error);
      resetTimer();
    }
  }, [
    recordStudySession,
    selectedDate,
    selectedMethod,
    currentCycle,
    sessionSubject,
    resetTimer,
  ]);

  // 오늘 총 공부시간 계산
  const getTodayTotalStudyTime = useCallback(() => {
    try {
      // 오늘 날짜와 자정 시간 계산
      const todayStr = selectedDate;
      const today = new Date();
      const todayMidnight = new Date(today);
      todayMidnight.setHours(0, 0, 0, 0);

      // 실행 중인 타이머와 저장된 세션 시간 합산
      let totalSeconds = 0;

      // 1. 현재 실행 중인 타이머 시간 추가
      if (timerState === "working") {
        totalSeconds += totalElapsedRef.current + elapsedTime;
      } else if (
        timerState === "paused" &&
        timerModeBeforePause === "working"
      ) {
        totalSeconds += totalElapsedRef.current + elapsedTime;
      } else {
        totalSeconds += totalElapsedRef.current;
      }

      // 2. 오늘 저장된 세션 시간 추가
      const todaySessions = studySessions[todayStr] || [];
      if (Array.isArray(todaySessions) && todaySessions.length > 0) {
        const todayFilteredSessions = todaySessions.filter((session) => {
          if (!session.timestamp) return true;
          const sessionTime = new Date(session.timestamp);
          return sessionTime >= todayMidnight;
        });

        const savedSessionsTime = todayFilteredSessions.reduce(
          (sum, session) => sum + session.duration,
          0
        );

        totalSeconds += savedSessionsTime;
      }

      return formatLongTime(totalSeconds);
    } catch (error) {
      console.error("총 공부시간 계산 오류:", error);
      return formatLongTime(0);
    }
  }, [
    selectedDate,
    timerState,
    timerModeBeforePause,
    elapsedTime,
    studySessions,
  ]);

  // 시간 형식 (초 -> MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 긴 시간 형식 (초 -> HH:MM:SS)
  const formatLongTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    // 상태
    timerState,
    timeRemaining,
    elapsedTime,
    currentCycle,
    sessionSubject,
    timerModeBeforePause,
    cycleLogRef,
    totalElapsedRef,

    // 액션
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setSessionSubject,

    // 유틸리티
    formatTime,
    formatLongTime,
    getTodayTotalStudyTime,

    // 화면 켜짐 관련 함수 추가 - 필요할 경우 외부에서 직접 사용 가능
    activateKeepAwake,
    deactivateKeepAwake,
  };
};
