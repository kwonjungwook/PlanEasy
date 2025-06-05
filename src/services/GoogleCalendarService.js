// src/services/GoogleCalendarService.js
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { format, parseISO } from "date-fns";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const PRIMARY_CALENDAR_ID = "primary";

/**
 * Google Calendar API 연동 서비스
 * PlanEasy 앱과 구글 캘린더 간 양방향 동기화 담당
 */
export class GoogleCalendarService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * 액세스 토큰 갱신
   */
  async refreshAccessToken() {
    try {
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens.accessToken;
      this.headers["Authorization"] = `Bearer ${tokens.accessToken}`;
      console.log("✅ Google Calendar 토큰 갱신 완료");
      return tokens.accessToken;
    } catch (error) {
      console.error("❌ 토큰 갱신 실패:", error);
      throw new Error("구글 캘린더 토큰 갱신에 실패했습니다.");
    }
  }

  /**
   * API 요청 공통 처리 함수
   */
  async makeApiRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.headers,
        ...options,
      });

      // 인증 만료 시 토큰 갱신 후 재시도
      if (response.status === 401) {
        console.log("🔄 토큰 만료, 갱신 후 재시도...");
        await this.refreshAccessToken();

        const retryResponse = await fetch(url, {
          headers: this.headers,
          ...options,
        });

        if (!retryResponse.ok) {
          throw new Error(
            `API 재시도 실패: ${retryResponse.status} ${retryResponse.statusText}`
          );
        }

        return await retryResponse.json();
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API 호출 실패: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("❌ API 요청 오류:", error);
      throw error;
    }
  }

  /**
   * PlanEasy 일정을 Google Calendar 이벤트 형식으로 변환
   */
  convertToGoogleEvent(schedule, date) {
    const startDateTime = `${date}T${schedule.startTime}:00`;
    const endDateTime = `${date}T${schedule.endTime}:00`;

    return {
      summary: schedule.task,
      description: `PlanEasy에서 생성된 일정\n일정 ID: ${schedule.id}`,
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: this.getGoogleColorId(schedule.customColor),
      extendedProperties: {
        private: {
          planEasyId: schedule.id,
          planEasySource: "template",
          planEasyColor: schedule.customColor || "",
        },
      },
    };
  }

  /**
   * Google Calendar 이벤트를 PlanEasy 일정 형식으로 변환
   */
  convertToPlanEasySchedule(googleEvent) {
    const startTime = this.extractTimeFromDateTime(googleEvent.start.dateTime);
    const endTime = this.extractTimeFromDateTime(googleEvent.end.dateTime);

    return {
      id:
        googleEvent.extendedProperties?.private?.planEasyId ||
        `google-${googleEvent.id}`,
      task: googleEvent.summary || "제목 없음",
      startTime,
      endTime,
      customColor:
        googleEvent.extendedProperties?.private?.planEasyColor ||
        this.convertGoogleColor(googleEvent.colorId),
      googleEventId: googleEvent.id,
      lastModified: googleEvent.updated,
      source: "google",
    };
  }

  /**
   * DateTime에서 시간만 추출 (HH:mm 형식)
   */
  extractTimeFromDateTime(dateTimeString) {
    try {
      const date = parseISO(dateTimeString);
      return format(date, "HH:mm");
    } catch (error) {
      console.warn("시간 추출 실패:", dateTimeString);
      return "00:00";
    }
  }

  /**
   * 커스텀 색상을 Google Calendar 색상 ID로 변환
   */
  getGoogleColorId(customColor) {
    const colorMap = {
      "#50cebb": "2", // 틸/터키색
      "#4a73e2": "1", // 파란색
      "#e74c3c": "4", // 빨간색
      "#f39c12": "5", // 주황색
      "#9b59b6": "3", // 보라색
      "#2ecc71": "2", // 초록색
    };
    return colorMap[customColor] || "1"; // 기본값: 파란색
  }

  /**
   * Google Calendar 색상을 커스텀 색상으로 변환
   */
  convertGoogleColor(colorId) {
    const colorMap = {
      1: "#4a73e2", // 파란색
      2: "#50cebb", // 틸색
      3: "#9b59b6", // 보라색
      4: "#e74c3c", // 빨간색
      5: "#f39c12", // 주황색
    };
    return colorMap[colorId] || "#4a73e2";
  }

  /**
   * 구글 캘린더에 단일 이벤트 생성
   */
  async createEvent(schedule, date) {
    try {
      console.log(`📅 구글 캘린더에 이벤트 생성: ${schedule.task} (${date})`);

      const eventData = this.convertToGoogleEvent(schedule, date);
      const url = `${CALENDAR_API_BASE}/calendars/${PRIMARY_CALENDAR_ID}/events`;

      const result = await this.makeApiRequest(url, {
        method: "POST",
        body: JSON.stringify(eventData),
      });

      console.log(`✅ 이벤트 생성 성공: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`❌ 이벤트 생성 실패 (${schedule.task}):`, error);
      throw error;
    }
  }

  /**
   * 구글 캘린더 이벤트 업데이트
   */
  async updateEvent(eventId, schedule, date) {
    try {
      console.log(`📝 구글 캘린더 이벤트 업데이트: ${eventId}`);

      const eventData = this.convertToGoogleEvent(schedule, date);
      const url = `${CALENDAR_API_BASE}/calendars/${PRIMARY_CALENDAR_ID}/events/${eventId}`;

      const result = await this.makeApiRequest(url, {
        method: "PUT",
        body: JSON.stringify(eventData),
      });

      console.log(`✅ 이벤트 업데이트 성공: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`❌ 이벤트 업데이트 실패 (${eventId}):`, error);
      throw error;
    }
  }

  /**
   * 구글 캘린더 이벤트 삭제
   */
  async deleteEvent(eventId) {
    try {
      console.log(`🗑️ 구글 캘린더 이벤트 삭제: ${eventId}`);

      const url = `${CALENDAR_API_BASE}/calendars/${PRIMARY_CALENDAR_ID}/events/${eventId}`;

      await this.makeApiRequest(url, {
        method: "DELETE",
      });

      console.log(`✅ 이벤트 삭제 성공: ${eventId}`);
      return true;
    } catch (error) {
      console.error(`❌ 이벤트 삭제 실패 (${eventId}):`, error);
      return false;
    }
  }

  /**
   * 구글 캘린더에서 특정 기간의 이벤트 조회
   */
  async getEvents(startDate, endDate) {
    try {
      console.log(`📖 구글 캘린더 이벤트 조회: ${startDate} ~ ${endDate}`);

      const timeMin = `${startDate}T00:00:00Z`;
      const timeMax = `${endDate}T23:59:59Z`;

      const url =
        `${CALENDAR_API_BASE}/calendars/${PRIMARY_CALENDAR_ID}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=2500`;

      const result = await this.makeApiRequest(url);

      console.log(`✅ 이벤트 조회 성공: ${result.items?.length || 0}개`);
      return result.items || [];
    } catch (error) {
      console.error(`❌ 이벤트 조회 실패:`, error);
      throw error;
    }
  }

  /**
   * 앱 일정들을 구글 캘린더에 동기화 (앱 → 구글)
   */
  async syncSchedulesToGoogle(schedules, selectedDates) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log(
        `🔄 구글 캘린더 동기화 시작: ${selectedDates.length}일, 총 일정 수 계산 중...`
      );

      for (const date of selectedDates) {
        const daySchedules = schedules[date] || [];

        if (daySchedules.length === 0) {
          console.log(`⏭️ ${date}: 일정 없음, 건너뜀`);
          continue;
        }

        console.log(`📅 ${date}: ${daySchedules.length}개 일정 동기화 중...`);

        for (const schedule of daySchedules) {
          try {
            // PlanEasy에서 생성된 일정만 동기화 (Google에서 가져온 것 제외)
            if (schedule.source === "google") {
              console.log(`⏭️ 구글 원본 일정 건너뜀: ${schedule.task}`);
              continue;
            }

            await this.createEvent(schedule, date);
            results.success++;

            // API 호출 제한 방지를 위한 딜레이
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`❌ 일정 동기화 실패 (${schedule.task}):`, error);
            results.failed++;
            results.errors.push({
              date,
              schedule: schedule.task,
              error: error.message,
            });
          }
        }
      }

      console.log(
        `✅ 구글 캘린더 동기화 완료: 성공 ${results.success}개, 실패 ${results.failed}개`
      );
      return results;
    } catch (error) {
      console.error("❌ 구글 캘린더 동기화 중 치명적 오류:", error);
      throw error;
    }
  }

  /**
   * 구글 캘린더에서 앱으로 동기화 (구글 → 앱)
   */
  async syncEventsFromGoogle(startDate, endDate) {
    try {
      console.log(
        `📥 구글 캘린더에서 이벤트 가져오기: ${startDate} ~ ${endDate}`
      );

      const googleEvents = await this.getEvents(startDate, endDate);
      const schedulesByDate = {};

      for (const event of googleEvents) {
        try {
          // 날짜 추출
          const eventDate = event.start.dateTime
            ? format(parseISO(event.start.dateTime), "yyyy-MM-dd")
            : event.start.date;

          if (!schedulesByDate[eventDate]) {
            schedulesByDate[eventDate] = [];
          }

          // PlanEasy 형식으로 변환
          const planEasySchedule = this.convertToPlanEasySchedule(event);
          schedulesByDate[eventDate].push(planEasySchedule);
        } catch (conversionError) {
          console.warn("이벤트 변환 실패:", event.summary, conversionError);
        }
      }

      console.log(
        `✅ 구글 이벤트 변환 완료: ${Object.keys(schedulesByDate).length}일`
      );
      return schedulesByDate;
    } catch (error) {
      console.error("❌ 구글 캘린더에서 동기화 실패:", error);
      throw error;
    }
  }

  /**
   * 양방향 동기화 (Last-Write-Wins 방식)
   */
  async bidirectionalSync(localSchedules, startDate, endDate) {
    try {
      console.log(`🔄 양방향 동기화 시작: ${startDate} ~ ${endDate}`);

      // 1. 구글 캘린더에서 이벤트 가져오기
      const googleSchedules = await this.syncEventsFromGoogle(
        startDate,
        endDate
      );

      // 2. 날짜별로 동기화 수행
      const syncResults = {
        localToGoogle: 0,
        googleToLocal: 0,
        conflicts: 0,
        errors: [],
      };

      const mergedSchedules = { ...localSchedules };

      // 모든 날짜 수집 (로컬 + 구글)
      const allDates = new Set([
        ...Object.keys(localSchedules),
        ...Object.keys(googleSchedules),
      ]);

      for (const date of allDates) {
        try {
          const localDaySchedules = localSchedules[date] || [];
          const googleDaySchedules = googleSchedules[date] || [];

          // Last-Write-Wins 로직 적용
          const { mergedDaySchedules, stats } = this.mergeSchedulesForDate(
            localDaySchedules,
            googleDaySchedules
          );

          mergedSchedules[date] = mergedDaySchedules;

          // 통계 업데이트
          syncResults.localToGoogle += stats.localToGoogle;
          syncResults.googleToLocal += stats.googleToLocal;
          syncResults.conflicts += stats.conflicts;
        } catch (dateError) {
          console.error(`날짜별 동기화 실패 (${date}):`, dateError);
          syncResults.errors.push({
            date,
            error: dateError.message,
          });
        }
      }

      console.log(`✅ 양방향 동기화 완료:`, syncResults);
      return {
        mergedSchedules,
        syncResults,
      };
    } catch (error) {
      console.error("❌ 양방향 동기화 실패:", error);
      throw error;
    }
  }

  /**
   * 특정 날짜의 로컬/구글 일정 병합 (Last-Write-Wins)
   */
  mergeSchedulesForDate(localSchedules, googleSchedules) {
    const merged = [];
    const stats = {
      localToGoogle: 0,
      googleToLocal: 0,
      conflicts: 0,
    };

    // 로컬 일정 먼저 추가
    for (const localSchedule of localSchedules) {
      // 구글에서 동일한 일정 찾기 (ID 또는 제목+시간으로 매칭)
      const matchingGoogle = googleSchedules.find(
        (gs) =>
          gs.id === localSchedule.id ||
          (gs.task === localSchedule.task &&
            gs.startTime === localSchedule.startTime &&
            gs.endTime === localSchedule.endTime)
      );

      if (matchingGoogle) {
        // 동일한 일정이 있는 경우: Last-Write-Wins
        const localTime = new Date(localSchedule.lastModified || 0);
        const googleTime = new Date(matchingGoogle.lastModified);

        if (googleTime > localTime) {
          merged.push(matchingGoogle); // 구글 버전 채택
          stats.googleToLocal++;
        } else {
          merged.push(localSchedule); // 로컬 버전 채택
          stats.localToGoogle++;
        }
        stats.conflicts++;
      } else {
        // 로컬에만 있는 일정
        merged.push(localSchedule);
        stats.localToGoogle++;
      }
    }

    // 구글에만 있는 일정 추가
    for (const googleSchedule of googleSchedules) {
      const alreadyAdded = merged.some(
        (m) =>
          m.id === googleSchedule.id ||
          (m.task === googleSchedule.task &&
            m.startTime === googleSchedule.startTime &&
            m.endTime === googleSchedule.endTime)
      );

      if (!alreadyAdded) {
        merged.push(googleSchedule);
        stats.googleToLocal++;
      }
    }

    // 시간순 정렬
    merged.sort((a, b) => {
      const timeA = a.startTime.split(":").map(Number);
      const timeB = b.startTime.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

    return {
      mergedDaySchedules: merged,
      stats,
    };
  }

  /**
   * 연결 상태 테스트
   */
  async testConnection() {
    try {
      console.log("🔍 구글 캘린더 연결 테스트...");

      const url = `${CALENDAR_API_BASE}/calendars/${PRIMARY_CALENDAR_ID}`;
      const result = await this.makeApiRequest(url);

      console.log(`✅ 연결 성공: ${result.summary} 캘린더`);
      return {
        success: true,
        calendarName: result.summary,
        timeZone: result.timeZone,
      };
    } catch (error) {
      console.error("❌ 연결 테스트 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 싱글톤 패턴으로 서비스 인스턴스 관리
let googleCalendarServiceInstance = null;

/**
 * GoogleCalendarService 인스턴스 생성/반환
 */
export const getGoogleCalendarService = async () => {
  try {
    // 토큰 확인
    const tokens = await GoogleSignin.getTokens();

    if (!tokens.accessToken) {
      throw new Error("Google 액세스 토큰이 없습니다. 먼저 로그인해주세요.");
    }

    // 인스턴스가 없거나 토큰이 다르면 새로 생성
    if (
      !googleCalendarServiceInstance ||
      googleCalendarServiceInstance.accessToken !== tokens.accessToken
    ) {
      googleCalendarServiceInstance = new GoogleCalendarService(
        tokens.accessToken
      );
      console.log("✅ GoogleCalendarService 인스턴스 생성 완료");
    }

    return googleCalendarServiceInstance;
  } catch (error) {
    console.error("❌ GoogleCalendarService 인스턴스 생성 실패:", error);
    throw error;
  }
};

/**
 * 서비스 인스턴스 초기화 (로그아웃 시 사용)
 */
export const resetGoogleCalendarService = () => {
  googleCalendarServiceInstance = null;
  console.log("🔄 GoogleCalendarService 인스턴스 초기화 완료");
};
