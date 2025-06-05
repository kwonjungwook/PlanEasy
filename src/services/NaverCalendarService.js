// src/services/NaverCalendarService.js
import { format } from "date-fns";

const NAVER_CALENDAR_API_BASE = "https://openapi.naver.com/calendar";

/**
 * 네이버 캘린더 API 연동 서비스
 * PlanEasy 앱과 네이버 캘린더 간 단방향 동기화 (앱 → 네이버)
 */
export class NaverCalendarService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  /**
   * PlanEasy 일정을 네이버 캘린더 iCal 형식으로 변환
   */
  convertToICal(schedule, date) {
    // 날짜를 YYYYMMDD 형식으로 변환
    const formattedDate = date.replace(/-/g, "");

    // 시간을 HHMMSS 형식으로 변환
    const startTime = schedule.startTime.replace(":", "") + "00";
    const endTime = schedule.endTime.replace(":", "") + "00";

    // UUID 생성 (간단하게)
    const uid = `planeasy-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const icalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:PlanEasy
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Asia/Seoul
BEGIN:STANDARD
DTSTART:19700101T000000
TZNAME:GMT+09:00
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
SEQUENCE:0
CLASS:PUBLIC
TRANSP:OPAQUE
UID:${uid}
DTSTART;TZID=Asia/Seoul:${formattedDate}T${startTime}
DTEND;TZID=Asia/Seoul:${formattedDate}T${endTime}
SUMMARY:${schedule.task}
DESCRIPTION:PlanEasy에서 생성된 일정
CREATED:${format(new Date(), "yyyyMMdd")}T${format(new Date(), "HHmmss")}Z
LAST-MODIFIED:${format(new Date(), "yyyyMMdd")}T${format(new Date(), "HHmmss")}Z
DTSTAMP:${format(new Date(), "yyyyMMdd")}T${format(new Date(), "HHmmss")}Z
END:VEVENT
END:VCALENDAR`;

    return icalString;
  }

  /**
   * 네이버 캘린더에 단일 이벤트 생성
   */
  async createEvent(schedule, date) {
    try {
      console.log(`📅 네이버 캘린더에 이벤트 생성: ${schedule.task} (${date})`);

      const icalString = this.convertToICal(schedule, date);
      const url = `${NAVER_CALENDAR_API_BASE}/createSchedule.json`;

      const formData = new URLSearchParams();
      formData.append("calendarId", "defaultCalendarId");
      formData.append("scheduleIcalString", icalString);

      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `네이버 캘린더 API 오류: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log(`✅ 네이버 캘린더 이벤트 생성 성공: ${schedule.task}`);
      return result;
    } catch (error) {
      console.error(
        `❌ 네이버 캘린더 이벤트 생성 실패 (${schedule.task}):`,
        error
      );
      throw error;
    }
  }

  /**
   * 앱 일정들을 네이버 캘린더에 동기화 (앱 → 네이버)
   */
  async syncSchedulesToNaver(schedules, selectedDates) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log(`🔄 네이버 캘린더 동기화 시작: ${selectedDates.length}일`);

      for (const date of selectedDates) {
        const daySchedules = schedules[date] || [];

        if (daySchedules.length === 0) {
          console.log(`⏭️ ${date}: 일정 없음, 건너뜀`);
          continue;
        }

        console.log(`📅 ${date}: ${daySchedules.length}개 일정 동기화 중...`);

        for (const schedule of daySchedules) {
          try {
            // 네이버에서 가져온 일정은 제외 (무한 루프 방지)
            if (schedule.source === "naver") {
              console.log(`⏭️ 네이버 원본 일정 건너뜀: ${schedule.task}`);
              continue;
            }

            await this.createEvent(schedule, date);
            results.success++;

            // API 호출 제한 방지를 위한 딜레이
            await new Promise((resolve) => setTimeout(resolve, 200));
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
        `✅ 네이버 캘린더 동기화 완료: 성공 ${results.success}개, 실패 ${results.failed}개`
      );
      return results;
    } catch (error) {
      console.error("❌ 네이버 캘린더 동기화 중 치명적 오류:", error);
      throw error;
    }
  }

  /**
   * 연결 상태 테스트 (간단한 더미 일정 생성)
   */
  async testConnection() {
    try {
      console.log("🔍 네이버 캘린더 연결 테스트...");

      const testSchedule = {
        task: "[PlanEasy 테스트] 연결 확인",
        startTime: "09:00",
        endTime: "09:01",
      };

      const today = format(new Date(), "yyyy-MM-dd");
      await this.createEvent(testSchedule, today);

      console.log("✅ 네이버 캘린더 연결 성공");
      return {
        success: true,
        message: "네이버 캘린더 연결 성공",
      };
    } catch (error) {
      console.error("❌ 네이버 캘린더 연결 테스트 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 싱글톤 패턴으로 서비스 인스턴스 관리
let naverCalendarServiceInstance = null;

/**
 * NaverCalendarService 인스턴스 생성/반환
 */
export const getNaverCalendarService = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error(
        "네이버 액세스 토큰이 없습니다. 먼저 네이버 로그인해주세요."
      );
    }

    // 인스턴스가 없거나 토큰이 다르면 새로 생성
    if (
      !naverCalendarServiceInstance ||
      naverCalendarServiceInstance.accessToken !== accessToken
    ) {
      naverCalendarServiceInstance = new NaverCalendarService(accessToken);
      console.log("✅ NaverCalendarService 인스턴스 생성 완료");
    }

    return naverCalendarServiceInstance;
  } catch (error) {
    console.error("❌ NaverCalendarService 인스턴스 생성 실패:", error);
    throw error;
  }
};

/**
 * 서비스 인스턴스 초기화 (로그아웃 시 사용)
 */
export const resetNaverCalendarService = () => {
  naverCalendarServiceInstance = null;
  console.log("🔄 NaverCalendarService 인스턴스 초기화 완료");
};
