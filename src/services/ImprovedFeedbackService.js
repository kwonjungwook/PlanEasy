// src/services/ImprovedFeedbackService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInDays,
  sub,
  isLastDayOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import * as Notifications from "expo-notifications";

// 스토리지 키
const STORAGE_KEYS = {
  REPORTS: "@feedback_reports",
  LAST_VIEWED_WEEKLY: "@last_viewed_weekly_report",
  LAST_VIEWED_MONTHLY: "@last_viewed_monthly_report",
  NOTIFICATIONS_SETUP: "report_notifications_setup",
};

// 리포트 타입
export const REPORT_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

// 자동 갱신 주기 (밀리초)
const AUTO_REFRESH_INTERVALS = {
  [REPORT_TYPES.DAILY]: 5 * 60 * 1000, // 5분
  [REPORT_TYPES.WEEKLY]: 24 * 60 * 60 * 1000, // 1일
  [REPORT_TYPES.MONTHLY]: 7 * 24 * 60 * 60 * 1000, // 1주일
};

// 콜백 함수를 저장할 변수
let reportCallbackFunction = null;

// 콜백 함수 설정 함수 - 무한 재귀 방지 기능 추가
export const setReportCallback = (callback) => {
  if (typeof callback === "function") {
    // 무한 재귀 방지를 위해 generateFeedback은 사용하지 않도록 경고
    console.log(
      "리포트 콜백 함수가 등록되었습니다. 주의: 콜백 내에서 generateFeedback을 직접 호출하지 마세요."
    );

    // 콜백 함수 무시 (무한 재귀 방지를 위해)
    // 이 함수는 호환성을 위해 유지되지만 실제로는 사용되지 않음
    reportCallbackFunction = null;
    return true;
  }
  console.error("유효하지 않은 콜백 함수입니다");
  return false;
};

// 사전 정의된 다양한 피드백 멘트 모음
export const FEEDBACK_MESSAGES = {
  // 일간 리포트 인사이트 메시지 (학습 시간 기준)
  dailyInsights: [
    // 0-1시간: 시작이 중요함을 강조
    {
      range: [0, 1],
      messages: [
        "오늘은 학습을 시작했네요. 첫 걸음이 항상 가장 중요합니다.",
        "짧은 시간이라도 공부를 시작한 것은 의미있는 일입니다.",
        "꾸준함이 실력을 만듭니다. 오늘 시작이 내일의 성장으로 이어질 거예요.",
        "마음을 모으기 어려운 날도 있어요. 내일은 더 집중해볼까요?",
        "짧은 시간의 학습도 쌓이면 큰 변화를 만듭니다.",
      ],
    },
    // 1-2시간: 꾸준한 노력 칭찬
    {
      range: [1, 2],
      messages: [
        "1시간 이상 집중했네요. 꾸준한 노력이 빛을 발하고 있어요.",
        "집중한 시간이 쌓이고 있어요. 꾸준함이 실력을 만듭니다.",
        "오늘도 의미있는 시간을 보냈네요. 이런 날들이 모여 성장이 됩니다.",
        "적당한 학습 시간을 유지하고 있어요. 균형 잡힌 학습 패턴입니다.",
        "꾸준히 학습하는 습관이 좋은 결과를 가져올 거예요.",
      ],
    },
    // 2-4시간: 좋은 패턴 형성 중임을 격려
    {
      range: [2, 4],
      messages: [
        "상당한 시간을 학습에 투자했네요. 좋은 학습 패턴이 형성되고 있어요.",
        "집중력이 돋보이는 하루였습니다. 이런 날들이 실력 향상의 열쇠예요.",
        "꾸준히 시간을 투자하고 있어요. 이런 노력이 큰 차이를 만듭니다.",
        "학습에 충분한 시간을 투자했어요. 하루하루 성장하고 있습니다.",
        "좋은 페이스를 유지하고 있어요. 지식은 꾸준한 노력으로 쌓입니다.",
      ],
    },
    // 4시간 이상: 열정 높은 학습 칭찬, 균형 조언
    {
      range: [4, 100],
      messages: [
        "정말 많은 시간을 학습에 투자했네요! 열정이 대단합니다.",
        "오늘은 특별히 집중력이 높은 날이었군요. 대단한 노력입니다.",
        "장시간 학습에 정말 수고하셨어요. 충분한 휴식도 잊지 마세요.",
        "열정적인 학습 태도가 돋보입니다. 균형 있는 휴식도 중요해요.",
        "깊이 있는 학습이 이루어진 하루네요. 이런 날들이 큰 성장을 만듭니다.",
      ],
    },
    // 학습이 없을 때
    {
      range: [-1, 0],
      messages: [
        "오늘은 기록된 학습이 없네요. 내일 새로운 마음으로 시작해봐요.",
        "때로는 충전의 시간도 필요합니다. 내일을 위해 에너지를 모아보세요.",
        "휴식도 학습의 일부입니다. 내일 다시 시작해봐요.",
        "오늘은 다른 일로 바빴나요? 내일 다시 페이스를 찾아보세요.",
        "모든 날이 완벽할 수는 없어요. 내일 다시 도전해봐요.",
      ],
    },
  ],

  // 일간 리포트 추천 메시지 (완료율 기준)
  dailyRecommendations: [
    // 0-30%: 일정 관리 조언
    {
      range: [0, 30],
      messages: [
        "일정 관리에 어려움이 있어 보여요. 더 현실적인 계획을 세워보는 건 어떨까요?",
        "할 일 목록을 더 작은 단위로 나누면 성취감을 더 자주 느낄 수 있어요.",
        "가장 중요한 일 3가지만 선택해서 집중해보세요.",
        "일정을 소화하기 어려웠던 이유를 생각해보고, 내일은 조금 더 현실적인 계획을 세워보세요.",
        "때로는 '하지 않기로 결정한 일'을 정하는 것도 중요해요. 우선순위를 다시 생각해보세요.",
      ],
    },
    // 30-60%: 개선 방향 제시
    {
      range: [30, 60],
      messages: [
        "절반 정도의 일정을 완료했네요. 우선순위를 더 명확히 하면 중요한 일부터 처리할 수 있어요.",
        "시간 관리 기법을 활용해보세요. 포모도로나 타임블록 방식이 도움이 될 수 있어요.",
        "완료하지 못한 일정 중 내일로 미룰 수 있는 것과 꼭 해야 하는 것을 구분해보세요.",
        "집중이 잘 되는 시간대에 중요한 일을 배치해보세요.",
        "목표 달성을 위한 점진적인 개선이 이루어지고 있어요. 조금씩 완료율을 높여보세요.",
      ],
    },
    // 60-80%: 긍정적 피드백과 조언
    {
      range: [60, 80],
      messages: [
        "상당수의 일정을 잘 완료했어요. 미완료 항목의 공통점을 찾아 개선해보세요.",
        "좋은 완료율입니다. 더 나아가기 위해 어제보다 오늘 더 발전한 점을 생각해보세요.",
        "계획 실행력이 좋습니다. 이제 각 활동의 질을 높이는 데 집중해보세요.",
        "대부분의 일정을 잘 소화했어요. 완료하지 못한 일은 정말 필요한 일인지 다시 생각해보세요.",
        "효율적인 일정 관리가 돋보입니다. 일과 휴식의 균형도 잘 유지해보세요.",
      ],
    },
    // 80-100%: 높은 성취 축하와 유지 조언
    {
      range: [80, 100],
      messages: [
        "대부분의 일정을 성공적으로 완료했어요! 이 페이스를 유지해보세요.",
        "훌륭한 완료율입니다! 이런 효율성을 유지하면서 도전적인 목표도 세워보세요.",
        "오늘의 성공 요인을 분석해보고, 이를 다른 날에도 적용해보세요.",
        "멋진 하루였습니다! 지금의 루틴을 더 발전시켜보세요.",
        "완벽에 가까운 일정 관리였어요. 무리하지 않고 이 상태를 유지하는 것도 중요합니다.",
      ],
    },
    // 일정이 없을 때
    {
      range: [-1, 0],
      messages: [
        "오늘은 계획된 일정이 없었네요. 내일은 간단한 to-do 리스트로 시작해보는 건 어떨까요?",
        "계획 없이 보낸 날도 있을 수 있어요. 내일은 작은 목표부터 세워보세요.",
        "때로는 계획 없는 날도 필요해요. 내일을 위한 간단한 계획을 세워보는 것도 좋겠네요.",
        "일정을 관리하면 하루가 더 효율적으로 변할 수 있어요. 내일은 간단한 목표부터 시작해보세요.",
        "계획이 없었던 오늘, 무엇을 배웠나요? 그 경험을 내일의 계획에 반영해보세요.",
      ],
    },
  ],

  // 주간 리포트 기본 피드백 (학습 시간 기준)
  weeklyInsights: [
    // 0-5시간: 시작 단계
    {
      range: [0, 5],
      messages: [
        "이번 주는 학습 시간이 다소 적었네요. 작은 습관부터 시작해보세요.",
        "매일 짧더라도 꾸준히 시간을 투자하는 것이 중요합니다.",
        "이번 주 경험을 토대로 다음 주는 더 규칙적인 학습 패턴을 만들어보세요.",
        "적은 시간이라도 꾸준히 학습하는 것이 중요합니다. 다음 주는 조금씩 늘려보세요.",
        "학습의 시작점에 서 있네요. 작은 걸음이 큰 변화를 가져올 거예요.",
      ],
    },
    // 5-10시간: 발전 단계
    {
      range: [5, 10],
      messages: [
        "주당 5시간 이상 학습하고 있어요. 좋은 학습 습관이 형성되고 있습니다.",
        "꾸준한 노력이 돋보이는 한 주였습니다. 이 페이스를 유지해보세요.",
        "일주일 동안 균형 잡힌 학습이 이루어졌네요. 점점 더 발전하고 있어요.",
        "학습에 상당한 시간을 투자하고 있어요. 효율을 높이는 방법도 함께 고민해보세요.",
        "꾸준한 학습 패턴을 만들어가고 있어요. 지식은 이런 꾸준함에서 쌓입니다.",
      ],
    },
    // 10-20시간: 집중 단계
    {
      range: [10, 20],
      messages: [
        "일주일 동안 상당한 시간을 학습에 투자했네요. 열정이 돋보입니다.",
        "주당 10시간 이상의 학습은 뛰어난 집중력을 보여줍니다. 균형 있는 휴식도 함께하세요.",
        "학습에 진지하게 임하고 있군요. 이런 집중력이 큰 성장을 이끌어낼 거예요.",
        "학습에 많은 시간을 투자하고 있어요. 효율적인 학습법도 함께 찾아보세요.",
        "열정적인 학습 태도가 엿보입니다. 이런 노력은 반드시 결실을 맺을 거예요.",
      ],
    },
    // 20시간 이상: 고급 단계
    {
      range: [20, 100],
      messages: [
        "주당 20시간 이상의 학습은 정말 놀라운 집중력입니다. 건강관리도 함께하세요.",
        "정말 많은 시간을 학습에 투자하고 있어요. 효율과 균형을 함께 고려해보세요.",
        "고강도 학습을 유지하고 있네요. 번아웃 없이 지속 가능한 페이스를 찾아보세요.",
        "대단한 학습량입니다. 깊이 있는 지식 습득이 이루어지고 있을 거예요.",
        "최상위 수준의 학습 몰입도를 보여주고 있어요. 휴식과 균형도 챙기세요.",
      ],
    },
    // 학습이 없을 때
    {
      range: [-1, 0],
      messages: [
        "이번 주는 기록된 학습이 없네요. 새로운 주를 시작하며 작은 목표부터 세워보세요.",
        "때로는 재충전의 시간도 필요합니다. 다음 주 새로운 마음으로 시작해보세요.",
        "이번 주를 돌아보고, 다음 주에는 어떤 변화를 줄 수 있을지 생각해보세요.",
        "학습 루틴을 만들기 어려웠나요? 다음 주는 정해진 시간에 짧게라도 학습해보세요.",
        "모든 주가 생산적일 수는 없어요. 새로운 주를 위한 에너지를 모아보세요.",
      ],
    },
  ],

  // 주간 리포트 기본 추천 (완료율 기준)
  weeklyRecommendations: [
    // 0-30%: 기본 시스템 재구축
    {
      range: [0, 30],
      messages: [
        "일정 관리 시스템을 재점검해보세요. 더 단순하고 실행 가능한 계획이 필요할 수 있어요.",
        "너무 많은 일을 계획하진 않았나요? 중요한 일 위주로 우선순위를 다시 설정해보세요.",
        "작은 단위로 일정을 나누고, 완료할 때마다 체크하는 습관을 들여보세요.",
        "가장 생산적인 시간대를 찾아 중요한 일을 그 시간에 배치해보세요.",
        "일정을 완료하지 못했을 때의 패턴을 분석해보세요. 공통적인 방해 요소가 있나요?",
      ],
    },
    // 30-60%: 최적화 조언
    {
      range: [30, 60],
      messages: [
        "시간 관리 기법을 적용해보세요. 포모도로, 타임블록, 아이젠하워 매트릭스 등이 도움될 수 있어요.",
        "할 수 있는 것과 할 수 없는 것을 구분하는 연습이 필요해요. 무리한 계획은 오히려 역효과가 날 수 있습니다.",
        "완료한 일정과 미완료한 일정의 특성을 비교해보세요. 어떤 패턴이 있나요?",
        "에너지 수준에 따라 일정을 배치해보세요. 집중력이 높을 때 중요한 일을 처리하는 것이 효율적입니다.",
        "일정을 50-80% 정도만 계획하고, 나머지는 유연성을 위해 비워두는 방법도 있어요.",
      ],
    },
    // 60-80%: 효율 향상 조언
    {
      range: [60, 80],
      messages: [
        "좋은 완료율입니다. 이제 각 활동의 질과 깊이를 높이는 데 집중해보세요.",
        "루틴을 잘 따르고 있군요. 다음 단계로 나아가기 위한 도전적 목표를 하나씩 추가해보세요.",
        "완료하지 못한 일정의 공통점을 찾아보세요. 특정 유형의 일에 어려움을 겪고 있나요?",
        "좋은 습관이 형성되고 있어요. 이를 더 견고하게 만들기 위한 시스템을 고민해보세요.",
        "효율적인 일정 관리 방식이 확립되고 있어요. 이제 일과 휴식의 균형에도 주의를 기울여보세요.",
      ],
    },
    // 80-100%: 최고 수준 유지 및 도전
    {
      range: [80, 100],
      messages: [
        "탁월한 일정 관리 능력을 보여주고 있어요. 이제 더 도전적인 목표를 설정해보세요.",
        "높은 완료율을 유지하고 있어요. 이 시스템을 다른 영역에도 적용해볼 수 있을 거예요.",
        "일정 관리에 능숙해졌어요. 이제 각 활동의 질적 향상에 집중해보는 것은 어떨까요?",
        "뛰어난 실행력을 갖추고 있네요. 장기적인 목표와 일상의 활동이 잘 연결되어 있는지 점검해보세요.",
        "거의 완벽한 일정 관리를 보여주고 있어요. 지속 가능한 방식으로 이 상태를 유지하는 것이 중요합니다.",
      ],
    },
    // 일정이 없을 때
    {
      range: [-1, 0],
      messages: [
        "이번 주에는 계획된 일정이 없었어요. 다음 주에는 간단한 주간 계획부터 시작해보세요.",
        "계획 없이 보낸 주간이었네요. 다음 주는 핵심 활동 몇 가지만 정해보는 것도 좋을 것 같아요.",
        "체계적인 일정 관리의 첫 걸음은 주간 단위의 큰 그림을 그리는 것입니다. 다음 주를 위한 간단한 로드맵을 만들어보세요.",
        "일정 관리가 어렵게 느껴진다면, 하루 3가지 중요한 일만 정하는 방식으로 시작해보세요.",
        "다음 주를 위한 주간 테마를 정해보는 것은 어떨까요? 예를 들어 '기초 다지기' 주간이나 '정리 주간' 등으로요.",
      ],
    },
  ],

  // 월간 리포트 기본 피드백 (패턴 분석)
  monthlyPatterns: [
    // 활동 비율에 따른 메시지
    {
      criteria: "activityRatio",
      ranges: [
        {
          range: [0, 30],
          messages: [
            "이번 달은 활동 기록이 다소 적었네요. 꾸준한 기록 습관을 들이면 더 정확한 분석이 가능해요.",
            "한 달 중 일부 기간만 활동이 기록되었어요. 더 규칙적인 패턴을 만들어보세요.",
            "활동 기록이 산발적이네요. 꾸준한 루틴이 더 나은 결과를 가져올 거예요.",
          ],
        },
        {
          range: [30, 70],
          messages: [
            "한 달의 절반 이상을 꾸준히 활동했어요. 좋은 패턴이 형성되고 있습니다.",
            "꾸준한 활동 패턴이 보이네요. 비활동 날에는 어떤 공통점이 있었는지 생각해보세요.",
            "규칙적인 활동 습관이 만들어지고 있어요. 더 일관된 패턴을 위해 노력해보세요.",
          ],
        },
        {
          range: [70, 100],
          messages: [
            "매우 꾸준한 활동 패턴이 보입니다. 뛰어난 지속력을 가지고 있네요!",
            "거의 매일 활동하는 훌륭한 습관이 형성되었어요. 이런 꾸준함이 큰 성장을 가져옵니다.",
            "탁월한 지속력을 보여주고 있어요. 이런 꾸준함은 장기적으로 큰 차이를 만들어냅니다.",
          ],
        },
      ],
    },
    // 요일별 활동 패턴
    {
      criteria: "dayPattern",
      patterns: [
        {
          pattern: "weekdayActive",
          messages: [
            "평일에 주로 활동하는 패턴이 보이네요. 주말에도 짧게라도 활동하면 연속성을 유지할 수 있어요.",
            "평일 중심의 규칙적인 패턴이 형성되었어요. 직장이나 학교 일정과 잘 맞추고 있네요.",
            "평일 활동이 주를 이루고 있어요. 생활 리듬이 안정적인 것 같습니다.",
          ],
        },
        {
          pattern: "weekendActive",
          messages: [
            "주말에 집중적으로 활동하는 패턴이네요. 평일에도 작은 활동을 추가하면 더 균형 잡힐 수 있어요.",
            "주말을 효율적으로 활용하고 있어요. 시간적 여유가 있을 때 집중하는 전략이군요.",
            "주말 활동이 두드러지네요. 평일과 주말의 균형을 조금 더 맞춰보는 것도 좋을 것 같아요.",
          ],
        },
        {
          pattern: "balanced",
          messages: [
            "평일과 주말에 균형 있게 활동하고 있어요. 안정적인 패턴이 형성되었네요.",
            "일주일 내내 꾸준한 활동 패턴을 보여주고 있어요. 균형 잡힌 습관이 형성되었네요.",
            "요일에 관계없이 꾸준한 활동이 이루어지고 있어요. 매우 안정적인 패턴입니다.",
          ],
        },
      ],
    },
    // 시간대별 패턴
    {
      criteria: "timeSlot",
      slots: [
        {
          slot: "오전(6-12시)",
          messages: [
            "주로 오전에 활동하는 패턴이네요. 아침 시간을 효율적으로 활용하고 있어요.",
            "오전 활동이 많네요. 많은 사람들이 오전에 집중력이 높다고 합니다. 좋은 습관이에요.",
            "아침형 인간이시군요! 오전 시간을 잘 활용하고 있습니다.",
          ],
        },
        {
          slot: "오후(12-18시)",
          messages: [
            "주로 오후에 활동하는 패턴이네요. 오후 시간을 효율적으로 활용하고 있어요.",
            "오후 시간대에 가장 활발하게 활동하고 있어요. 자신에게 맞는 리듬을 찾은 것 같네요.",
            "오후 시간을 주로 활용하고 있어요. 자신의 생체리듬에 맞춘 좋은 선택입니다.",
          ],
        },
        {
          slot: "저녁(18-24시)",
          messages: [
            "주로 저녁 시간에 활동하는 패턴이네요. 저녁 시간을 효율적으로 활용하고 있어요.",
            "저녁 시간대에 가장 활발하게 활동하고 있어요. 밤형 인간이시군요!",
            "저녁 시간을 주로 활용하고 있어요. 하루를 마무리하며 집중하는 패턴이네요.",
          ],
        },
        {
          slot: "야간(0-6시)",
          messages: [
            "야간에 활동하는 패턴이 보이네요. 본인에게 맞는 시간이라면 좋지만, 수면 패턴에도 신경 써주세요.",
            "밤 시간을 주로 활용하고 있어요. 집중이 잘 된다면 좋지만, 건강도 함께 챙기세요.",
            "심야 시간대에 활동이 집중되어 있어요. 충분한 휴식과 수면도 생산성에 중요합니다.",
          ],
        },
      ],
    },
  ],
};

// 템플릿 메시지 모음 (SimpleFeedbackService에서 가져온 것)
const TEMPLATES = {
  // 일간 리포트 인사이트 템플릿
  DAILY_INSIGHTS: {
    LOW_ACTIVITY: [
      "오늘은 학습 활동이 {HOURS}시간으로 적었네요. 내일은 조금 더 시간을 내어 보는 건 어떨까요?",
      "오늘은 {HOURS}시간의 짧은 학습 시간이었지만, 꾸준함이 중요합니다. 내일도 계속해보세요.",
      "오늘은 {HOURS}시간만 공부했네요. 다른 일로 바빴나요? 짧은 시간이라도 학습 습관을 유지하는 것이 중요합니다.",
    ],
    MEDIUM_ACTIVITY: [
      "오늘 학습에 {HOURS}시간을 투자했네요. 좋은 페이스를 유지하고 있어요!",
      "오늘은 {HOURS}시간으로 균형 잡힌 학습 시간이었습니다. 이대로 꾸준히 진행하면 좋은 결과가 있을 거예요.",
      "{HOURS}시간의 학습으로 꾸준한 학습 습관이 형성되고 있어요. 이 페이스를 유지해보세요.",
    ],
    HIGH_ACTIVITY: [
      "오늘은 {HOURS}시간 동안 정말 열심히 학습했네요! 충분한 휴식도 챙기는 것을 잊지 마세요.",
      "{HOURS}시간이라는 긴 시간 동안 집중력을 유지했군요. 대단합니다! 이런 날들이 모여 큰 성과를 만듭니다.",
      "오늘은 특별히 학습에 {HOURS}시간이라는 많은 시간을 투자했네요. 열정이 돋보입니다!",
    ],
  },

  // 완료율 기반 추천 템플릿
  RECOMMENDATIONS: {
    LOW_COMPLETION: [
      "일정 완료율이 {COMPLETION}%로 다소 낮습니다. 더 작은 단위로 나누어 계획해보는 건 어떨까요?",
      "일정의 {COMPLETION}%만 완료했어요. 내일은 가장 중요한 일 3가지만 선택해서 집중해보세요.",
      "완료율이 {COMPLETION}%입니다. 실현 가능한 목표를 설정하고 우선순위를 정하면 완료율을 높일 수 있어요.",
    ],
    MEDIUM_COMPLETION: [
      "일정의 {COMPLETION}%를 완료했네요. 남은 일정에 우선순위를 두고 집중해보세요.",
      "{COMPLETION}%의 완료율을 보여줍니다. 시간 관리가 점점 나아지고 있어요. 집중이 잘 되는 시간대에 중요한 일정을 배치해보세요.",
      "일정의 {COMPLETION}%를 완료했어요. 꾸준한 개선이 이루어지고 있어요. 내일은 완료율을 더 높여보세요.",
    ],
    HIGH_COMPLETION: [
      "일정의 {COMPLETION}%를 훌륭하게 완료했어요! 높은 실행력을 유지하고 있네요.",
      "{COMPLETION}%라는 높은 완료율을 보여줍니다. 오늘의 성공 요인을 생각해보고, 이를 내일도 적용해보세요.",
      "일정의 {COMPLETION}%를 완료했습니다. 뛰어난 일정 관리 능력을 보여주고 있어요. 이 습관을 계속 유지하세요!",
    ],
  },

  // 주간 리포트 인사이트 템플릿
  WEEKLY_INSIGHTS: {
    LOW_ACTIVITY: [
      "이번 주에는 총 {HOURS}시간 공부했어요. 다음 주에는 조금씩 학습 시간을 늘려보세요.",
      "주간 총 학습 시간이 {HOURS}시간으로 다소 적었어요. 매일 짧더라도 꾸준히 공부하는 습관이 중요합니다.",
      "이번 주 {HOURS}시간의 학습 시간은 시작점이 될 수 있어요. 꾸준한 학습 습관을 만들어 보세요.",
    ],
    MEDIUM_ACTIVITY: [
      "주당 {HOURS}시간 공부했어요. 균형 잡힌 학습 패턴이 형성되고 있습니다.",
      "이번 주 총 {HOURS}시간 학습했습니다. 꾸준한 노력이 보입니다. 이 페이스를 유지해보세요.",
      "주간 {HOURS}시간의 학습으로 안정적인 패턴을 보여주고 있어요. 좋은 습관이 형성되고 있습니다.",
    ],
    HIGH_ACTIVITY: [
      "이번 주 총 {HOURS}시간이라는 많은 시간을 학습에 투자했네요. 열정이 돋보입니다!",
      "{HOURS}시간의 주간 학습 시간은 매우 인상적입니다. 건강 관리와 휴식도 함께 챙기세요.",
      "이번 주에는 {HOURS}시간 동안 집중적으로 학습했네요. 훌륭한 노력입니다!",
    ],
  },

  // 주간 추천 템플릿
  WEEKLY_RECOMMENDATIONS: {
    LOW_COMPLETION: [
      "주간 일정 완료율이 {COMPLETION}%로 다소 낮았어요. 다음 주에는 더 현실적인 목표를 설정해보세요.",
      "일정 완료율이 {COMPLETION}%입니다. 중요한 작업 위주로 우선순위를 다시 설정해보는 것이 좋겠어요.",
      "{COMPLETION}%의 완료율을 보였습니다. 다음 주에는 일정을 더 작은 단위로 나누어 관리해보세요.",
    ],
    MEDIUM_COMPLETION: [
      "주간 일정의 {COMPLETION}%를 완료했어요. 시간 관리 기법을 활용하면 더 효율적으로 일정을 소화할 수 있을 거예요.",
      "{COMPLETION}%의 완료율은 괜찮은 수준입니다. 에너지 수준에 따라 일정을 배치해보세요.",
      "일정의 {COMPLETION}%를 완료했습니다. 완료하지 못한 일정의 공통점을 찾아 개선해보세요.",
    ],
    HIGH_COMPLETION: [
      "주간 일정의 {COMPLETION}%를 성공적으로 완료했어요! 이러한 높은 실행력을 유지하세요.",
      "{COMPLETION}%라는 훌륭한 완료율을 보였습니다. 이제 각 활동의 질적 향상에 집중해보세요.",
      "일정의 {COMPLETION}%를 완료했어요. 탁월한 일정 관리 능력을 보여주고 있습니다!",
    ],
  },

  // 월간 리포트 인사이트 템플릿
  MONTHLY_INSIGHTS: {
    LOW_ACTIVITY: [
      "이번 달에는 총 {HOURS}시간 공부했어요. 활동 일수는 {DAYS}일({RATIO}%)이었습니다. 조금씩 활동 일수를 늘려보세요.",
      "월간 총 학습 시간이 {HOURS}시간으로 활동 비율은 {RATIO}%였어요. 꾸준한 습관을 형성하는 데 집중해보세요.",
      "이번 달에는 {DAYS}일 동안 총 {HOURS}시간 학습했어요. 다음 달에는 더 규칙적인 패턴을 만들어보세요.",
    ],
    MEDIUM_ACTIVITY: [
      "이번 달에는 총 {HOURS}시간을 {DAYS}일({RATIO}%) 동안 학습했어요. 안정적인 패턴이 형성되고 있어요.",
      "월간 총 {HOURS}시간, {DAYS}일({RATIO}%)의 활동을 보였어요. 균형 잡힌 학습이 이루어지고 있습니다.",
      "이번 달에는 {DAYS}일({RATIO}%) 동안 총 {HOURS}시간 학습했어요. 꾸준한 노력이 돋보입니다.",
    ],
    HIGH_ACTIVITY: [
      "이번 달에는 {DAYS}일({RATIO}%)이라는 높은 활동 비율로 총 {HOURS}시간 학습했어요. 대단합니다!",
      "월간 총 {HOURS}시간, {RATIO}%의 활동 비율을 보였어요. 매우 열정적으로 학습에 임하고 있네요!",
      "이번 달에는 {DAYS}일({RATIO}%)에 걸쳐 총 {HOURS}시간 학습했어요. 탁월한 꾸준함을 보여주고 있습니다!",
    ],
  },
};

// 랜덤 메시지 선택 함수
export const getRandomMessage = (messageArray) => {
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
};

// 상황에 맞는 메시지 선택 함수
export const getContextualMessage = (category, value) => {
  // 해당 카테고리의 메시지 배열 찾기
  const messageCategory = FEEDBACK_MESSAGES[category];
  if (!messageCategory) return "분석 결과를 확인해보세요.";

  // 범위에 맞는 메시지 그룹 찾기
  let selectedGroup;

  if (value === 0 || value === null || value === undefined) {
    // 기록이 없는 경우
    selectedGroup = messageCategory.find((group) => group.range[0] === -1);
  } else {
    // 값에 맞는 범위 찾기
    selectedGroup = messageCategory.find(
      (group) => value >= group.range[0] && value < group.range[1]
    );
  }

  if (!selectedGroup) return "분석 결과를 확인해보세요.";

  // 해당 그룹에서 랜덤 메시지 선택
  return getRandomMessage(selectedGroup.messages);
};

// 패턴 기반 메시지 선택 함수
export const getPatternMessage = (patternType, pattern) => {
  const patternCategory = FEEDBACK_MESSAGES.monthlyPatterns.find(
    (cat) => cat.criteria === patternType
  );

  if (!patternCategory) return "패턴 분석 결과를 확인해보세요.";

  let selectedPattern;

  if (patternType === "activityRatio") {
    // 활동 비율 기반 메시지
    selectedPattern = patternCategory.ranges.find(
      (range) => pattern >= range.range[0] && pattern < range.range[1]
    );
  } else if (patternType === "dayPattern") {
    // 요일 패턴 기반 메시지
    selectedPattern = patternCategory.patterns.find(
      (pat) => pat.pattern === pattern
    );
  } else if (patternType === "timeSlot") {
    // 시간대 기반 메시지
    selectedPattern = patternCategory.slots.find(
      (slot) => slot.slot === pattern
    );
  }

  if (!selectedPattern) return "패턴 분석 결과를 확인해보세요.";

  return getRandomMessage(selectedPattern.messages);
};

// 조건에 따른 템플릿 선택 함수 (SimpleFeedbackService)
const selectTemplate = (category, data) => {
  // 카테고리별 다른 조건 검사
  let templateArray;

  if (category === "DAILY_INSIGHTS") {
    const { totalHours } = data;
    if (totalHours >= 5) {
      templateArray = TEMPLATES.DAILY_INSIGHTS.HIGH_ACTIVITY;
    } else if (totalHours >= 2) {
      templateArray = TEMPLATES.DAILY_INSIGHTS.MEDIUM_ACTIVITY;
    } else {
      templateArray = TEMPLATES.DAILY_INSIGHTS.LOW_ACTIVITY;
    }
  } else if (category === "RECOMMENDATIONS") {
    const { completionRate } = data;
    if (completionRate >= 75) {
      templateArray = TEMPLATES.RECOMMENDATIONS.HIGH_COMPLETION;
    } else if (completionRate >= 40) {
      templateArray = TEMPLATES.RECOMMENDATIONS.MEDIUM_COMPLETION;
    } else {
      templateArray = TEMPLATES.RECOMMENDATIONS.LOW_COMPLETION;
    }
  } else if (category === "WEEKLY_INSIGHTS") {
    const { totalHours } = data;
    if (totalHours >= 15) {
      templateArray = TEMPLATES.WEEKLY_INSIGHTS.HIGH_ACTIVITY;
    } else if (totalHours >= 7) {
      templateArray = TEMPLATES.WEEKLY_INSIGHTS.MEDIUM_ACTIVITY;
    } else {
      templateArray = TEMPLATES.WEEKLY_INSIGHTS.LOW_ACTIVITY;
    }
  } else if (category === "WEEKLY_RECOMMENDATIONS") {
    const { completionRate } = data;
    if (completionRate >= 75) {
      templateArray = TEMPLATES.WEEKLY_RECOMMENDATIONS.HIGH_COMPLETION;
    } else if (completionRate >= 40) {
      templateArray = TEMPLATES.WEEKLY_RECOMMENDATIONS.MEDIUM_COMPLETION;
    } else {
      templateArray = TEMPLATES.WEEKLY_RECOMMENDATIONS.LOW_COMPLETION;
    }
  } else if (category === "MONTHLY_INSIGHTS") {
    const { totalHours, activityRatio } = data;
    if (activityRatio >= 70) {
      templateArray = TEMPLATES.MONTHLY_INSIGHTS.HIGH_ACTIVITY;
    } else if (activityRatio >= 40) {
      templateArray = TEMPLATES.MONTHLY_INSIGHTS.MEDIUM_ACTIVITY;
    } else {
      templateArray = TEMPLATES.MONTHLY_INSIGHTS.LOW_ACTIVITY;
    }
  } else {
    // 기본값
    return "데이터 분석 중...";
  }

  // 랜덤하게 하나 선택
  return templateArray[Math.floor(Math.random() * templateArray.length)];
};

// 템플릿에 데이터 적용 함수 (SimpleFeedbackService)
const applyTemplate = (template, data) => {
  // 변수 치환 (예: {HOURS} -> data.totalHours)
  let result = template;

  // 모든 {KEY} 형태의 문자열을 data 객체의 값으로 대체
  const placeholders = template.match(/\{([A-Z_]+)\}/g) || [];

  placeholders.forEach((placeholder) => {
    const key = placeholder.replace(/[{}]/g, "");
    const value = data[key] || "";
    result = result.replace(placeholder, value);
  });

  return result;
};

// 인공적 지연 함수 (SimpleFeedbackService)
export const simulateProcessing = (callback, progressCallback) => {
  // 단계별 메시지
  const steps = [
    { message: "데이터 로딩 중...", duration: 500 },
    { message: "데이터 분석 중...", duration: 700 },
    { message: "패턴 인식 중...", duration: 600 },
    { message: "인사이트 생성 중...", duration: 500 },
    { message: "결과 최적화 중...", duration: 400 },
  ];

  let currentStep = 0;

  // 첫 번째 단계 시작
  if (progressCallback) {
    progressCallback(steps[0].message, 0);
  }

  // 단계별 지연 처리
  const processStep = () => {
    currentStep++;

    if (currentStep < steps.length) {
      // 다음 단계 진행
      if (progressCallback) {
        progressCallback(
          steps[currentStep].message,
          (currentStep / steps.length) * 100
        );
      }

      setTimeout(processStep, steps[currentStep].duration);
    } else {
      // 모든 단계 완료
      if (progressCallback) {
        progressCallback("분석 완료!", 100);
      }

      // 약간의 지연 후 최종 콜백 실행
      setTimeout(() => {
        if (callback) callback();
      }, 300);
    }
  };

  // 첫 번째 단계 이후 진행
  setTimeout(processStep, steps[0].duration);
};

// 목표 처리 함수
export const processGoalsForReport = (goalTargets) => {
  if (!goalTargets || !Array.isArray(goalTargets) || goalTargets.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return goalTargets.map((goal) => {
    const targetDate = new Date(goal.targetDate);
    targetDate.setHours(0, 0, 0, 0);

    const daysLeft = differenceInDays(targetDate, today);

    let dDayText = "";
    let message = "";

    if (daysLeft === 0) {
      dDayText = "D-Day";
      message = "Today is the big day!";
    } else if (daysLeft > 0) {
      dDayText = `D-${daysLeft}`;

      if (daysLeft <= 7) {
        message = `Only ${daysLeft} days left - time to focus!`;
      } else if (daysLeft <= 30) {
        message = `${daysLeft} days remaining - keep making progress.`;
      } else {
        message = `${daysLeft} days until your target date.`;
      }
    } else {
      dDayText = `D+${Math.abs(daysLeft)}`;
      message = `Target date passed ${Math.abs(daysLeft)} days ago.`;
    }

    // 목표 유형에 따른 추가 메시지 (간단한 예)
    let additionalMessage = "";
    if (goal.type) {
      if (goal.type === "exam") {
        additionalMessage = " 시험을 위한 계획적인 학습이 필요합니다.";
      } else if (goal.type === "project") {
        additionalMessage = " 프로젝트를 위한 단계별 접근이 중요합니다.";
      } else if (goal.type === "habit") {
        additionalMessage = " 꾸준한 습관 형성이 목표 달성의 열쇠입니다.";
      }
    }

    return {
      ...goal,
      daysLeft,
      dDayText,
      message: message + additionalMessage,
    };
  });
};

// 일간 리포트 생성 함수
const generateDailyReport = (date, data) => {
  const { studySessions = {}, tasks = {}, goalTargets = [] } = data;

  // 1. 해당 날짜의 공부 세션 추출
  const todaySessions = studySessions[date] || [];

  // 2. 총 공부 시간 계산
  const totalStudyTime = todaySessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );
  const totalHours = Math.round((totalStudyTime / 3600) * 10) / 10; // 소수점 첫째 자리까지

  // 3. 가장 생산적인 시간대 찾기
  let mostProductiveHour = null;
  let maxDuration = 0;

  // 시간별 공부 시간 집계
  const hourlyStudy = {};

  todaySessions.forEach((session) => {
    if (session.timestamp) {
      const sessionTime = new Date(session.timestamp);
      const hour = sessionTime.getHours();

      hourlyStudy[hour] = (hourlyStudy[hour] || 0) + (session.duration || 0);

      if (hourlyStudy[hour] > maxDuration) {
        maxDuration = hourlyStudy[hour];
        mostProductiveHour = hour;
      }
    }
  });

  // 4. 일정 완료율 계산
  const todayTasks = tasks[date] || {};
  const taskCount = Object.keys(todayTasks).length;
  const completedCount = Object.values(todayTasks).filter(Boolean).length;
  const completionRate =
    taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  // 5. 과목별 공부 시간 분석
  const subjectAnalysis = {};
  todaySessions.forEach((session) => {
    const subject = session.subject || "기타";
    subjectAnalysis[subject] =
      (subjectAnalysis[subject] || 0) + (session.duration || 0);
  });

  // 6. 목표 처리
  const upcomingGoalsInfo = processGoalsForReport(goalTargets);

  // 7. 템플릿 기반 인사이트 생성 (SimpleFeedbackService 방식)
  const insightData = { totalHours, completionRate };
  const insightTemplate = selectTemplate("DAILY_INSIGHTS", insightData);
  const recommendationTemplate = selectTemplate("RECOMMENDATIONS", insightData);

  const insights = applyTemplate(insightTemplate, {
    HOURS: totalHours.toString(),
    COMPLETION: completionRate.toString(),
  });

  const recommendations = applyTemplate(recommendationTemplate, {
    HOURS: totalHours.toString(),
    COMPLETION: completionRate.toString(),
  });

  // 8. 최종 리포트 객체 반환
  return {
    type: REPORT_TYPES.DAILY,
    date,
    timestamp: new Date().toISOString(),
    totalHours,
    completionRate,
    mostProductiveTime:
      mostProductiveHour !== null ? `${mostProductiveHour}시` : "N/A",
    subjectAnalysis,
    upcomingGoalsInfo,
    insights,
    recommendations,
    isAIGenerated: false, // 기본은 AI 생성 아님
  };
};

// 주간 리포트 생성 함수
const generateWeeklyReport = (date, data) => {
  const {
    studySessions = {},
    tasks = {},
    schedules = {},
    goalTargets = [],
  } = data;

  // 1. 날짜 범위 계산
  const currentDate = new Date(date);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // 월요일 시작
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // 일요일 끝

  const startDateStr = format(weekStart, "yyyy-MM-dd");
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  // 2. 주간 날짜 배열 생성
  const dateArray = [];
  let currentDay = new Date(weekStart);
  while (currentDay <= weekEnd) {
    dateArray.push(format(currentDay, "yyyy-MM-dd"));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // 3. 주간 데이터 수집
  let totalStudyTime = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let mostStudyDay = null;
  let maxDayStudy = 0;

  const subjectAnalysis = {};
  const dailyStudyTime = {};
  const dailyCompletionRate = {};

  // 요일별 일정 분포
  const schedulesByDay = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0, 일: 0 };

  // 일정 유형별 개수
  const scheduleTypeCount = { 학습: 0, 업무: 0, 회의: 0, 개인: 0, 기타: 0 };

  // 4. 날짜별 집계
  dateArray.forEach((dayStr) => {
    // 공부 세션 분석
    const daySessions = studySessions[dayStr] || [];
    const dayStudyTime = daySessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );

    totalStudyTime += dayStudyTime;
    dailyStudyTime[dayStr] = dayStudyTime;

    // 가장 공부를 많이 한 날 체크
    if (dayStudyTime > maxDayStudy) {
      maxDayStudy = dayStudyTime;
      mostStudyDay = dayStr;
    }

    // 과목별 분석
    daySessions.forEach((session) => {
      const subject = session.subject || "기타";
      subjectAnalysis[subject] =
        (subjectAnalysis[subject] || 0) + (session.duration || 0);
    });

    // 일정 완료율 분석
    const dayTasks = tasks[dayStr] || {};
    const dayTaskCount = Object.keys(dayTasks).length;
    const dayCompletedCount = Object.values(dayTasks).filter(Boolean).length;

    totalTasks += dayTaskCount;
    completedTasks += dayCompletedCount;

    // 날짜별 완료율 저장
    dailyCompletionRate[dayStr] =
      dayTaskCount > 0
        ? Math.round((dayCompletedCount / dayTaskCount) * 100)
        : 0;

    // 요일별 일정 수 집계
    const daySchedules = schedules[dayStr] || [];
    const dayDate = new Date(dayStr);
    const dayIndex = dayDate.getDay(); // 0: 일요일, 1: 월요일, ...
    const koreanDays = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = koreanDays[dayIndex];

    schedulesByDay[dayName] += daySchedules.length;

    // 일정 유형별 개수 집계
    daySchedules.forEach((schedule) => {
      const type = schedule.type || "기타";
      if (scheduleTypeCount[type] !== undefined) {
        scheduleTypeCount[type]++;
      } else {
        scheduleTypeCount["기타"]++;
      }
    });
  });

  // 5. 총계 계산
  const totalHours = Math.round((totalStudyTime / 3600) * 10) / 10;
  const avgDailyHours = Math.round((totalStudyTime / 3600 / 7) * 10) / 10;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 6. 목표 정보 처리
  const upcomingGoalsInfo = processGoalsForReport(goalTargets);

  // 7. 템플릿 기반 인사이트 생성
  const insightData = { totalHours, completionRate };
  const insightTemplate = selectTemplate("WEEKLY_INSIGHTS", insightData);
  const recommendationTemplate = selectTemplate(
    "WEEKLY_RECOMMENDATIONS",
    insightData
  );

  const insights = applyTemplate(insightTemplate, {
    HOURS: totalHours.toString(),
    COMPLETION: completionRate.toString(),
  });

  const recommendations = applyTemplate(recommendationTemplate, {
    HOURS: totalHours.toString(),
    COMPLETION: completionRate.toString(),
  });

  // 8. 주간 테마와 집중 영역 생성 (기본값)
  let weeklyTheme = "꾸준함의 가치";
  let focusAdvice = "시간 관리와 집중력 향상에 집중해보세요";

  if (totalHours < 7) {
    weeklyTheme = "첫 걸음의 중요성";
    focusAdvice = "학습 습관 형성에 집중해보세요";
  } else if (totalHours < 15) {
    weeklyTheme = "꾸준함의 힘";
    focusAdvice = "학습 시간을 조금씩 늘려보세요";
  } else if (totalHours < 25) {
    weeklyTheme = "깊이 있는 성장";
    focusAdvice = "학습의 질과 깊이에 집중해보세요";
  } else {
    weeklyTheme = "균형 있는 발전";
    focusAdvice = "학습과 휴식의 균형을 유지하세요";
  }

  // 9. 일정 인사이트 생성
  let scheduleInsights = "";
  const weekdaySchedules =
    schedulesByDay.월 +
    schedulesByDay.화 +
    schedulesByDay.수 +
    schedulesByDay.목 +
    schedulesByDay.금;
  const weekendSchedules = schedulesByDay.토 + schedulesByDay.일;

  if (weekdaySchedules === 0 && weekendSchedules === 0) {
    scheduleInsights =
      "이번 주에는 기록된 일정이 없습니다. 계획적인 일정 관리가 생산성 향상에 도움이 됩니다.";
  } else if (weekdaySchedules > weekendSchedules * 3) {
    scheduleInsights =
      "평일에 일정이 집중되어 있습니다. 주말에도 적절한 활동을 배치하면 연속성을 유지할 수 있습니다.";
  } else if (weekendSchedules > weekdaySchedules) {
    scheduleInsights =
      "주말에 일정이 집중되어 있습니다. 평일에도 일정을 분산하면 부담을 줄일 수 있습니다.";
  } else {
    scheduleInsights =
      "평일과 주말에 균형 있게 일정이 배치되어 있습니다. 좋은 패턴입니다.";
  }

  // 주요 일정 유형에 대한 인사이트 추가
  const mainScheduleType = Object.entries(scheduleTypeCount)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)[0];

  if (mainScheduleType) {
    scheduleInsights += ` 주로 ${mainScheduleType[0]} 유형의 일정이 많았습니다.`;
  }

  // 10. 최종 리포트 객체 반환
  return {
    type: REPORT_TYPES.WEEKLY,
    startDate: startDateStr,
    endDate: endDateStr,
    timestamp: new Date().toISOString(),
    totalHours,
    avgDailyHours,
    completionRate,
    mostProductiveDay: mostStudyDay,
    subjectAnalysis,
    dailyStudyTime,
    dailyCompletionRate,
    schedulesByDay,
    scheduleTypeCount,
    upcomingGoalsInfo,
    insights,
    recommendations,
    weeklyTheme,
    focusAdvice,
    scheduleInsights,
    isAIGenerated: false,
  };
};

// 월간 리포트 생성 함수
const generateMonthlyReport = (date, data) => {
  const {
    studySessions = {},
    tasks = {},
    schedules = {},
    goalTargets = [],
  } = data;

  // 1. 날짜 범위 계산
  const currentDate = new Date(date);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  // 2. 월간 날짜 배열 생성
  const dateArray = [];
  let currentDay = new Date(monthStart);
  while (currentDay <= monthEnd) {
    dateArray.push(format(currentDay, "yyyy-MM-dd"));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // 3. 월간 데이터 수집
  let totalStudyTime = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let daysWithActivity = 0;

  const subjectAnalysis = {};
  const dailyStudyTime = {};

  // 요일별 일정 분포
  const schedulesByDay = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0, 일: 0 };

  // 시간대별 일정 분포
  const schedulesByTimeSlot = {
    "오전(6-12시)": 0,
    "오후(12-18시)": 0,
    "저녁(18-24시)": 0,
    "야간(0-6시)": 0,
  };

  // 자주 반복되는 일정 집계
  const taskFrequency = {};

  // 4. 날짜별 집계
  dateArray.forEach((dayStr) => {
    // 공부 세션 분석
    const daySessions = studySessions[dayStr] || [];
    const dayStudyTime = daySessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );

    // 활동 일수 계산
    if (
      dayStudyTime > 0 ||
      (schedules[dayStr] && schedules[dayStr].length > 0)
    ) {
      daysWithActivity++;
    }

    totalStudyTime += dayStudyTime;
    dailyStudyTime[dayStr] = dayStudyTime;

    // 과목별 분석
    daySessions.forEach((session) => {
      const subject = session.subject || "기타";
      subjectAnalysis[subject] =
        (subjectAnalysis[subject] || 0) + (session.duration || 0);
    });

    // 일정 완료율 분석
    const dayTasks = tasks[dayStr] || {};
    const dayTaskCount = Object.keys(dayTasks).length;
    const dayCompletedCount = Object.values(dayTasks).filter(Boolean).length;

    totalTasks += dayTaskCount;
    completedTasks += dayCompletedCount;

    // 요일별 일정 수 집계
    const daySchedules = schedules[dayStr] || [];
    const dayDate = new Date(dayStr);
    const dayIndex = dayDate.getDay(); // 0: 일요일, 1: 월요일, ...
    const koreanDays = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = koreanDays[dayIndex];

    schedulesByDay[dayName] += daySchedules.length;

    // 시간대별 일정 분포 계산
    daySchedules.forEach((schedule) => {
      if (schedule.startTime) {
        const hour = parseInt(schedule.startTime.split(":")[0]);

        let timeSlot = "";
        if (hour >= 6 && hour < 12) timeSlot = "오전(6-12시)";
        else if (hour >= 12 && hour < 18) timeSlot = "오후(12-18시)";
        else if (hour >= 18 && hour < 24) timeSlot = "저녁(18-24시)";
        else timeSlot = "야간(0-6시)";

        schedulesByTimeSlot[timeSlot]++;
      }

      // 일정 빈도 계산
      if (schedule.task) {
        taskFrequency[schedule.task] = (taskFrequency[schedule.task] || 0) + 1;
      }
    });
  });

  // 5. 총계 계산
  const daysInMonth = dateArray.length;
  const totalHours = Math.round((totalStudyTime / 3600) * 10) / 10;
  const avgDailyHours =
    daysWithActivity > 0
      ? Math.round((totalStudyTime / 3600 / daysWithActivity) * 10) / 10
      : 0;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activityRatio = Math.round((daysWithActivity / daysInMonth) * 100);

  // 자주 반복되는 일정 정렬
  const frequentTasks = Object.entries(taskFrequency)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([task, count]) => ({ task, count }));

  // 6. 목표 정보 처리
  const upcomingGoalsInfo = processGoalsForReport(goalTargets);

  // 7. 템플릿 기반 인사이트 생성
  const insightData = {
    totalHours,
    completionRate,
    activityRatio,
    DAYS: daysWithActivity.toString(),
    RATIO: activityRatio.toString(),
  };

  const insightTemplate = selectTemplate("MONTHLY_INSIGHTS", insightData);

  const insights = applyTemplate(insightTemplate, {
    HOURS: totalHours.toString(),
    DAYS: daysWithActivity.toString(),
    RATIO: activityRatio.toString(),
  });

  // 8. 생산성 점수 계산 (단순 알고리즘)
  // 활동 비율 30%, 완료율 40%, 평균 학습 시간 30%
  const activityScore = Math.min(activityRatio, 100) * 0.3;
  const completionScore = Math.min(completionRate, 100) * 0.4;
  const studyScore = Math.min(avgDailyHours * 30, 100) * 0.3;
  const productivityScore = Math.round(
    activityScore + completionScore + studyScore
  );

  // 9. 패턴 분석 메시지 생성
  // 요일 패턴 분석
  let dayPattern = "balanced";
  const weekdayActivity =
    schedulesByDay["월"] +
    schedulesByDay["화"] +
    schedulesByDay["수"] +
    schedulesByDay["목"] +
    schedulesByDay["금"];
  const weekendActivity = schedulesByDay["토"] + schedulesByDay["일"];

  if (weekdayActivity > weekendActivity * 2) {
    dayPattern = "weekdayActive";
  } else if (weekendActivity > weekdayActivity) {
    dayPattern = "weekendActive";
  }

  // 시간대 패턴 찾기
  const mostActiveTimeSlot = Object.entries(schedulesByTimeSlot)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)[0];

  // 패턴 메시지 생성
  const activityMessage = getPatternMessage("activityRatio", activityRatio);
  const dayPatternMessage = getPatternMessage("dayPattern", dayPattern);
  const timeSlotMessage = mostActiveTimeSlot
    ? getPatternMessage("timeSlot", mostActiveTimeSlot[0])
    : "특정 시간대에 집중된 활동 패턴은 보이지 않습니다.";

  // 패턴 인사이트 조합
  const schedulePatternInsights = `${activityMessage} ${dayPatternMessage} ${timeSlotMessage}`;

  // 10. 월간 테마와 다음 월 집중 포인트 생성
  let monthlyTheme = "성장의 여정";
  let nextMonthFocus = "균형 있는 학습 계획 수립하기";

  if (activityRatio < 30) {
    monthlyTheme = "새로운 시작";
    nextMonthFocus = "꾸준한 학습 습관 만들기";
  } else if (activityRatio < 60) {
    monthlyTheme = "발전과 도전";
    nextMonthFocus = "학습 시간 늘리기";
  } else if (completionRate < 50) {
    monthlyTheme = "체계적인 성장";
    nextMonthFocus = "일정 관리 개선하기";
  } else if (totalHours < 30) {
    monthlyTheme = "꾸준함의 힘";
    nextMonthFocus = "학습 시간 효율화하기";
  } else {
    monthlyTheme = "균형 있는 성취";
    nextMonthFocus = "깊이 있는 학습 경험 만들기";
  }

  // 11. 장기 추천 메시지 생성
  let longTermRecommendations = "";
  if (activityRatio < 50) {
    longTermRecommendations =
      "꾸준한 학습을 위해 매일 조금씩이라도 공부하는 습관을 만들어보세요. 습관 형성이 장기적인 성과의 열쇠입니다.";
  } else if (avgDailyHours < 2) {
    longTermRecommendations =
      "학습의 질을 높이기 위해 집중 시간을 조금씩 늘려보세요. 하루 2-3시간의 집중된 학습이 효과적입니다.";
  } else if (completionRate < 70) {
    longTermRecommendations =
      "일정 관리 능력을 향상시키기 위해 더 실현 가능한 목표를 세우고, 하루의 우선순위를 정해보세요.";
  } else {
    longTermRecommendations =
      "현재 학습 패턴이 매우 좋습니다. 이 페이스를 유지하되, 학습 내용의 다양성과 깊이를 더해보세요.";
  }

  // 12. 월간 개요 생성
  const monthlyOverview = `${format(
    monthStart,
    "yyyy년 MM월"
  )}에는 총 ${totalHours}시간 공부했으며, 한 달 중 ${daysWithActivity}일 (${activityRatio}%) 활동했습니다. ${
    totalHours > 0
      ? `주요 학습 분야는 ${
          Object.entries(subjectAnalysis).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "없음"
        }였습니다.`
      : ""
  }`;

  // 13. 최종 리포트 객체 반환
  return {
    type: REPORT_TYPES.MONTHLY,
    month: format(monthStart, "yyyy년 MM월"),
    startDate: startDateStr,
    endDate: endDateStr,
    timestamp: new Date().toISOString(),
    totalHours,
    avgDailyHours,
    completionRate,
    daysWithStudy: daysWithActivity,
    activityRatio,
    subjectAnalysis,
    dailyStudyTime,
    schedulesByDay,
    schedulesByTimeSlot,
    frequentTasks,
    upcomingGoalsInfo,
    insights,
    monthlyOverview,
    longTermRecommendations,
    monthlyTheme,
    nextMonthFocus,
    schedulePatternInsights,
    productivityScore,
    isAIGenerated: false,
  };
};

// PlannerContext에서 사용하는 generateFeedback 함수 구현
// 내부적으로는 generateReport를 호출하여 재사용
export const generateFeedback = async (
  date,
  reportType,
  schedules,
  tasks,
  studySessions,
  statsData,
  useAI = false,
  isPremiumUser = false,
  goalTargets = []
) => {
  try {
    // 데이터 객체 구성
    const data = {
      schedules,
      tasks,
      studySessions,
      goalTargets,
    };

    // statsData가 제공된 경우 포함
    if (statsData) {
      data.statsData = statsData;
    }

    // 중요: 콜백 함수를 호출하지 않고 직접 리포트 생성
    // 콜백 함수 사용을 제거하여 무한 재귀 방지

    // generateReport 함수 호출
    const report = await generateReport(date, reportType, data, useAI);

    // 프리미엄 사용자 여부 추가
    if (report) {
      report.isPremiumUser = isPremiumUser;
    }

    return report;
  } catch (error) {
    console.error(`피드백 생성 오류(${reportType}):`, error);
    return null;
  }
};

// 통합 피드백 생성 함수
export const generateReport = async (date, type, data, useAI = false) => {
  // 1. 먼저 저장된 리포트가 있는지 확인
  const existingReport = await getReport(date, type);
  if (existingReport) {
    return existingReport;
  }

  // 2. 리포트 타입에 따라 적절한 함수 호출
  let report;
  switch (type) {
    case REPORT_TYPES.DAILY:
      report = generateDailyReport(date, data);
      break;
    case REPORT_TYPES.WEEKLY:
      report = generateWeeklyReport(date, data);
      break;
    case REPORT_TYPES.MONTHLY:
      report = generateMonthlyReport(date, data);
      break;
    default:
      throw new Error(`지원하지 않는 리포트 타입: ${type}`);
  }

  // 3. 처리 지연 시뮬레이션 (useAI가 true인 경우)
  if (useAI) {
    await new Promise((resolve) => {
      simulateProcessing(resolve);
    });
  }

  // 4. 리포트 저장
  await saveReport(date, type, report);

  return report;
};

// 저장소 관련 함수들
export const saveReport = async (date, type, report) => {
  try {
    const key = `${STORAGE_KEYS.REPORTS}_${type}_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(report));
    return true;
  } catch (error) {
    console.error("리포트 저장 오류:", error);
    return false;
  }
};

export const getReport = async (date, type) => {
  try {
    const key = `${STORAGE_KEYS.REPORTS}_${type}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("리포트 조회 오류:", error);
    return null;
  }
};

// 저장된 모든 리포트 지우기 (테스트용)
export const clearAllReports = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reportKeys = keys.filter((key) =>
      key.startsWith(STORAGE_KEYS.REPORTS)
    );
    await AsyncStorage.multiRemove(reportKeys);
    return true;
  } catch (error) {
    console.error("리포트 삭제 오류:", error);
    return false;
  }
};

// 저장된 AI 리포트 조회
export const getSavedAIReports = async (reportType) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reportKeys = keys.filter(
      (key) =>
        key.includes(`_${reportType}_`) && key.startsWith(STORAGE_KEYS.REPORTS)
    );

    const reports = {};

    for (const key of reportKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const report = JSON.parse(data);

        // 주간/월간 리포트용 키 생성
        let reportKey;
        if (reportType === REPORT_TYPES.WEEKLY) {
          // 주차 정보 추출 (ex: '2023-W01')
          const date = new Date(report.startDate || report.timestamp);
          const year = date.getFullYear();
          const weekNumber = Math.ceil(
            (date.getDate() + 6 - date.getDay()) / 7
          );
          reportKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;
        } else {
          // 월 정보 추출 (ex: '2023-01')
          const date = new Date(report.startDate || report.timestamp);
          reportKey = format(date, "yyyy-MM");
        }

        reports[reportKey] = report;
      }
    }

    return reports;
  } catch (error) {
    console.error(`저장된 ${reportType} 리포트 조회 오류:`, error);
    return {};
  }
};

// 알림 업데이트 함수
export const updateReportScheduling = async (isSubscribed) => {
  try {
    // 구독 상태에 따라 알림 설정
    if (isSubscribed) {
      // 알림 권한 요청
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          console.log("알림 권한이 거부되었습니다");
          await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_SETUP, "false");
          return false;
        }
      }

      // 기존 알림 취소
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 주간 리포트 알림 (매주 일요일 저녁 9시)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "주간 리포트 준비 완료",
          body: "지난 한 주 활동에 대한 분석 리포트가 준비되었습니다.",
          data: { reportType: REPORT_TYPES.WEEKLY },
        },
        trigger: {
          weekday: 7, // 일요일
          hour: 21,
          minute: 0,
          repeats: true,
        },
      });

      // 월간 리포트 알림 (매월 마지막 날 저녁 9시)
      // 알림 스케줄링이 복잡하므로 단순화하여 매월 28일로 설정
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "월간 리포트 준비 완료",
          body: "이번 달 활동에 대한 분석 리포트가 준비되었습니다.",
          data: { reportType: REPORT_TYPES.MONTHLY },
        },
        trigger: {
          day: 28,
          hour: 21,
          minute: 0,
          repeats: true,
        },
      });

      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_SETUP, "true");
      return true;
    } else {
      // 비구독자는 알림 취소
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_SETUP, "false");
      return true;
    }
  } catch (error) {
    console.error("알림 업데이트 오류:", error);
    return false;
  }
};

// 알림 핸들러 등록
export const setupNotificationHandlers = async () => {
  // 알림 핸들러 설정
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // 알림 응답 리스너 설정
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log("알림에 응답함:", data);

    // 여기서 필요한 처리 수행 가능
  });

  return true;
};

export const initializeNotifications = async () => {
  try {
    // 알림 핸들러 설정
    await setupNotificationHandlers();
    console.log("알림 시스템 초기화 완료");
    return true;
  } catch (error) {
    console.error("알림 초기화 오류:", error);
    return false;
  }
};

export const initFeedbackService = (config = {}) => {
  console.log("FeedbackService 초기화", config);
  setupNotificationHandlers();
  return true;
};

// 내보내기
export default {
  generateReport,
  generateFeedback,
  saveReport,
  getReport,
  clearAllReports,
  simulateProcessing,
  REPORT_TYPES,
  getSavedAIReports,
  processGoalsForReport,
  updateReportScheduling,
  setupNotificationHandlers,
  setReportCallback,
  initFeedbackService,
  AUTO_REFRESH_INTERVALS,
};
