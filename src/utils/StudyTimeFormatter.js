// src/utils/StudyTimeFormatter.js
/**
 * 공부 시간을 자연스러운 문장으로 포맷팅하는 유틸리티
 */

// 공부 시간을 자연스러운 문장으로 변환
export const formatStudyTimeNaturally = (seconds) => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  // 1. 1시간 미만: "XX분 공부했어요"
  if (hours === 0) {
    if (minutes < 5) {
      return `잠깐 ${minutes}분 공부했어요. 짧아도 꾸준함이 중요해요!`;
    } else if (minutes < 15) {
      return `${minutes}분 동안 집중했어요. 작은 노력이 모여 큰 결실을 맺을 거에요.`;
    } else if (minutes < 30) {
      return `${minutes}분 공부했어요. 꾸준한 학습 습관이 형성되고 있어요.`;
    } else {
      return `${minutes}분 집중했어요. 반 시간 이상 투자한 노력이 쌓이고 있어요!`;
    }
  }

  // 2. 1~2시간: "X시간 XX분 집중했어요"
  if (hours === 1) {
    if (minutes === 0) {
      return `정확히 1시간 공부했어요. 효율적인 시간 관리가 돋보여요!`;
    } else {
      return `1시간 ${minutes}분 집중했어요. 훌륭한 학습량이에요!`;
    }
  }

  // 3. 2~3시간: "X시간 넘게 깊이 공부했어요"
  if (hours === 2) {
    if (minutes === 0) {
      return `2시간 공부했어요. 깊이 있는 학습이 이루어졌네요!`;
    } else {
      return `2시간 ${minutes}분 공부했어요. 상당한 집중력이에요!`;
    }
  }

  // 4. 3시간 이상: "X시간 이상 몰입했어요"
  if (hours >= 3) {
    if (minutes === 0) {
      return `${hours}시간 공부했어요. 놀라운 집중력과 끈기를 보여줬어요!`;
    } else {
      return `${hours}시간 ${minutes}분 공부했어요. 대단한 몰입도예요!`;
    }
  }

  // 기본 응답
  return `${hours}시간 ${minutes}분 공부했어요.`;
};

// 여러 공부 세션을 분석하여 패턴을 설명
export const analyzeStudySessions = (sessions) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return null;
  }

  // 총 공부 시간
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );

  // 세션 수
  const sessionCount = sessions.length;

  // 평균 세션 길이
  const avgSessionLength = totalSeconds / sessionCount;

  // 가장 긴 세션
  const longestSession = Math.max(...sessions.map((s) => s.duration || 0));

  // 결과 분석
  let analysisText = "";

  // 세션이 1개인 경우
  if (sessionCount === 1) {
    return formatStudyTimeNaturally(totalSeconds);
  }

  // 세션이 여러 개인 경우
  if (sessionCount >= 2 && sessionCount <= 3) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (avgSessionLength < 600) {
      // 평균 10분 미만
      analysisText = `짧게 ${sessionCount}번에 나눠 총 `;
    } else if (avgSessionLength < 1800) {
      // 평균 30분 미만
      analysisText = `${sessionCount}회 나눠서 총 `;
    } else {
      // 평균 30분 이상
      analysisText = `긴 시간 ${sessionCount}번에 걸쳐 총 `;
    }

    if (hours > 0) {
      analysisText += `${hours}시간 ${
        minutes > 0 ? minutes + "분" : ""
      } 공부했어요.`;
    } else {
      analysisText += `${minutes}분 공부했어요.`;
    }
  }
  // 세션이 많은 경우 (4개 이상)
  else if (sessionCount >= 4) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (avgSessionLength < 600) {
      // 평균 10분 미만
      analysisText = `짧은 시간을 자주 활용해 ${sessionCount}회 공부했어요. 총 `;
    } else if (avgSessionLength < 1800) {
      // 평균 30분 미만
      analysisText = `적절한 휴식을 가지며 ${sessionCount}회 공부했어요. 총 `;
    } else {
      // 평균 30분 이상
      analysisText = `몰입감 있게 ${sessionCount}회 공부했어요. 총 `;
    }

    if (hours > 0) {
      analysisText += `${hours}시간 ${
        minutes > 0 ? minutes + "분" : ""
      } 학습했네요.`;
    } else {
      analysisText += `${minutes}분 학습했네요.`;
    }
  }

  return analysisText;
};

// 세션들의 시간대를 분석
export const analyzeStudyTimePatterns = (sessions) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return null;
  }

  // 시간대별 분류
  const timeSlots = {
    morning: 0, // 06:00 - 11:59
    afternoon: 0, // 12:00 - 17:59
    evening: 0, // 18:00 - 21:59
    night: 0, // 22:00 - 05:59
  };

  sessions.forEach((session) => {
    if (session.timestamp) {
      const date = new Date(session.timestamp);
      const hour = date.getHours();

      if (hour >= 6 && hour < 12) {
        timeSlots.morning += 1;
      } else if (hour >= 12 && hour < 18) {
        timeSlots.afternoon += 1;
      } else if (hour >= 18 && hour < 22) {
        timeSlots.evening += 1;
      } else {
        timeSlots.night += 1;
      }
    }
  });

  // 가장 많은 세션이 있는 시간대 찾기
  let mainTimeSlot = null;
  let mainTimeSlotCount = 0;

  Object.entries(timeSlots).forEach(([slot, count]) => {
    if (count > mainTimeSlotCount) {
      mainTimeSlotCount = count;
      mainTimeSlot = slot;
    }
  });

  // 결과 텍스트 생성
  if (mainTimeSlotCount > 0 && mainTimeSlot) {
    const timeSlotNames = {
      morning: "아침",
      afternoon: "오후",
      evening: "저녁",
      night: "늦은 밤",
    };

    const percentage = Math.round((mainTimeSlotCount / sessions.length) * 100);

    if (percentage >= 70) {
      return `주로 ${timeSlotNames[mainTimeSlot]} 시간대에 집중적으로 공부하는 패턴이에요.`;
    } else if (percentage >= 50) {
      return `${timeSlotNames[mainTimeSlot]} 시간대에 공부하는 경향이 있어요.`;
    } else {
      return null; // 뚜렷한 패턴이 없으면 텍스트 표시 안함
    }
  }

  return null;
};
