// src/services/BasicFeedbackService.js
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isLastDayOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import * as Notifications from "expo-notifications";

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

// 기본 일간 피드백 생성 함수 (AI 없이 사전 정의된 메시지 사용)
// 1. BasicFeedbackService.js 수정

// 기본 일간 피드백 생성 함수를 수정하여 목표 데이터 포함
export const generateDailyFeedback = (
  date,
  schedules,
  tasks,
  studySessions,
  goalTargets = []
) => {
  try {
    console.log(
      `일간 피드백 생성 중: ${date}, 목표 데이터 포함: ${goalTargets.length}개`
    );

    // 1. 해당 날짜의 일정 및 작업 데이터 수집
    const dateSchedules = schedules[date] || [];
    const dateTasks = tasks[date] || {};

    // 2. 공부 세션 데이터 수집
    const dateStudySessions = studySessions[date] || [];
    const totalStudyTime = dateStudySessions.reduce(
      (total, session) => total + session.duration,
      0
    );
    const totalStudyHours = Math.round((totalStudyTime / 3600) * 10) / 10; // 소수점 첫째자리까지

    // 3. 일정 완료율 계산
    const totalTasks = Object.keys(dateTasks).length;
    const completedTasks = Object.values(dateTasks).filter(Boolean).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 4. 활동 분석 데이터
    const categoryAnalysis = {};
    const methodAnalysis = {};
    let mostProductiveTime = "N/A";

    // 세션에서 카테고리별, 방법별 시간 계산
    dateStudySessions.forEach((session) => {
      const category = session.subject || "미지정";
      const method = session.method || "기타";

      categoryAnalysis[category] =
        (categoryAnalysis[category] || 0) + session.duration;
      methodAnalysis[method] = (methodAnalysis[method] || 0) + session.duration;

      // 가장 긴 세션이 가장 생산적인 시간으로 가정
      if (
        mostProductiveTime === "N/A" ||
        session.duration > mostProductiveTime.duration
      ) {
        mostProductiveTime = session.timestamp
          ? format(parseISO(session.timestamp), "HH:mm")
          : "N/A";
      }
    });

    // 5. 목표 데이터 분석 (수정된 부분 - 상세 메시지)
    let upcomingGoalsInfo = [];

    // 현재 날짜 기준으로 가까운 목표가 있는지 확인
    if (goalTargets && goalTargets.length > 0) {
      // 오늘 날짜 기준
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 미래 목표 필터링 및 날짜순 정렬
      const upcomingGoals = goalTargets
        .filter((goal) => new Date(goal.targetDate) >= today)
        .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

      // 각 목표별로 개별 D-day 정보 생성 (최대 3개)
      if (upcomingGoals.length > 0) {
        // 최대 3개까지만 처리
        const goalsToShow = upcomingGoals.slice(0, 3);

        goalsToShow.forEach((goal) => {
          const targetDate = new Date(goal.targetDate);
          const diffDays = Math.ceil(
            (targetDate - today) / (1000 * 60 * 60 * 24)
          );

          // 각 목표별 개별 D-day 메시지 생성
          let dDayText = "";
          if (diffDays === 0) {
            dDayText = `D-Day`;
          } else if (diffDays === 1) {
            dDayText = `D-1`;
          } else if (diffDays <= 7) {
            dDayText = `D-${diffDays}`;
          } else if (diffDays <= 30) {
            dDayText = `D-${diffDays}`;
          } else {
            dDayText = `D-${diffDays}`;
          }

          // 현재 시간 정보 가져오기
          const now = new Date();
          const currentHour = now.getHours();
          const isWeekend = now.getDay() === 0 || now.getDay() === 6;
          const dayNames = [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일",
          ];
          const currentDayName = dayNames[now.getDay()];

          // 목표 진행 상태에 따른 추가 메시지 (진행률이 있다고 가정)
          let progressMessage = "";
          if (goal.progress && typeof goal.progress === "number") {
            if (goal.progress < 30) {
              progressMessage =
                " 아직 초기 단계입니다. 기초를 탄탄히 다지세요.";
            } else if (goal.progress < 60) {
              progressMessage =
                " 절반을 향해 나아가고 있습니다. 지금의 페이스를 유지하세요.";
            } else if (goal.progress < 80) {
              progressMessage =
                " 많은 부분을 완료했습니다. 마무리를 위한 집중이 필요합니다.";
            } else {
              progressMessage =
                " 거의 완료되었습니다. 마지막 점검에 신경 써주세요.";
            }
          }

          // D-Day 메시지 결정
          let personalizedMessage = "";

          if (diffDays === 0) {
            // D-Day - 시간대별 맞춤 메시지
            if (currentHour < 9) {
              personalizedMessage = `"${goal.title}" 목표의 D-Day입니다! 아침부터 집중력을 발휘할 때입니다. 오늘 하루 일정을 마지막으로 점검하고 최선을 다하세요.`;
            } else if (currentHour < 12) {
              personalizedMessage = `"${goal.title}" 목표의 D-Day입니다! 오전 시간을 효율적으로 활용하고 계신가요? 중간 점검을 통해 남은 과제를 확인하세요.`;
            } else if (currentHour < 18) {
              personalizedMessage = `"${goal.title}" 목표의 D-Day입니다! 지금까지 준비한 모든 것을 발휘할 시간입니다. 오후 시간을 활용해 마무리 작업에 집중하세요.`;
            } else {
              personalizedMessage = `"${goal.title}" 목표의 D-Day입니다! 하루를 마무리하며 목표 달성 여부를 점검하고 필요한 부분을 완성하세요.`;
            }
          } else if (diffDays === 1) {
            // D-1
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDayName = dayNames[tomorrow.getDay()];

            if (isWeekend) {
              personalizedMessage = `"${goal.title}" 목표까지 단 하루 남았습니다. 내일(${tomorrowDayName})이 D-Day입니다. 주말 시간을 활용해 마지막 준비 사항을 완벽하게 마무리하세요.`;
            } else {
              personalizedMessage = `"${goal.title}" 목표까지 단 하루 남았습니다. 내일(${tomorrowDayName})이 D-Day입니다. 오늘 업무를 정리하고 목표 달성을 위한 마지막 준비에 집중하세요.`;
            }
          } else if (diffDays === 2) {
            // D-2
            personalizedMessage = `"${goal.title}" 목표까지 이틀 남았습니다. 핵심 준비 사항은 내일까지 완료하고, D-Day에는 최종 점검만 남겨두는 것이 좋습니다.${progressMessage}`;
          } else if (diffDays === 3) {
            // D-3
            personalizedMessage = `"${goal.title}" 목표까지 3일 남았습니다. 마무리 단계에 접어들었습니다. 아직 완료하지 못한 부분을 우선순위에 따라 정리하세요.${progressMessage}`;
          } else if (diffDays === 4) {
            // D-4
            personalizedMessage = `"${goal.title}" 목표까지 4일 남았습니다. 이번 주 내에 목표를 달성하게 됩니다. 완성도를 높이기 위한 세부 사항을 점검하세요. 마지막 주간 계획을 세우세요.${progressMessage}`;
          } else if (diffDays === 5) {
            // D-5
            personalizedMessage = `"${goal.title}" 목표까지 5일 남았습니다. 약 80%의 준비가 완료되어야 할 시점입니다. 핵심 부분은 모두 완료하고 마무리 작업에 집중하세요.${progressMessage}`;
          } else if (diffDays === 6) {
            // D-6
            personalizedMessage = `"${goal.title}" 목표까지 6일 남았습니다. 일주일 내로 목표를 달성하게 됩니다. 주간 계획을 세워 매일의 작업량을 균등하게 분배하세요.${progressMessage}`;
          } else if (diffDays === 7) {
            // D-7 (정확히 일주일)
            if (isWeekend) {
              personalizedMessage = `"${goal.title}" 목표까지 정확히 일주일 남았습니다. 오늘 주말을 활용해 다음 주 목표 달성을 위한 세부 계획을 수립하세요. 하루하루가 중요합니다.${progressMessage}`;
            } else {
              personalizedMessage = `"${goal.title}" 목표까지 정확히 일주일 남았습니다. 오늘부터 시작하는 일주일이 목표 달성의 최종 카운트다운입니다. 효율적인 주간 계획을 세우세요.${progressMessage}`;
            }
          } else if (diffDays === 8) {
            // D-8
            personalizedMessage = `"${goal.title}" 목표까지 8일 남았습니다. 진행 상황을 체크하고 지금 70% 이상 완료되었는지 확인하세요. 아직 부족한 부분이 있다면 이번 주에 집중적으로 보완해야 합니다.${progressMessage}`;
          } else if (diffDays === 9) {
            // D-9
            personalizedMessage = `"${goal.title}" 목표까지 9일 남았습니다. 목표 달성까지 열흘도 채 남지 않았습니다. 계획에서 벗어난 부분은 없는지 점검하고 필요하다면 전략을 수정하세요.${progressMessage}`;
          } else if (diffDays === 10) {
            // D-10
            personalizedMessage = `"${goal.title}" 목표까지 10일 남았습니다. 이제 진행 상황이 65% 이상이 되어야 합니다. 목표의 핵심 부분을 먼저 완료하고 세부 사항은 후순위로 미루세요.${progressMessage}`;
          } else if (diffDays === 11) {
            // D-11
            personalizedMessage = `"${goal.title}" 목표까지 11일 남았습니다. 약 1주 반이 남았습니다. 지금까지의 진행을 되돌아보고 향후 10일간의 일정을 계획하세요.${progressMessage}`;
          } else if (diffDays === 12) {
            // D-12
            personalizedMessage = `"${goal.title}" 목표까지 12일 남았습니다. 중간 단계를 지나고 있습니다. 이번 주까지 목표의 60%를 달성하는 것을 목표로 하세요.${progressMessage}`;
          } else if (diffDays === 13) {
            // D-13
            personalizedMessage = `"${goal.title}" 목표까지 13일 남았습니다. 진행 중 어려움이나 장애물은 없었나요? 남은 기간을 위한 리스크 관리 계획을 검토하세요.${progressMessage}`;
          } else if (diffDays === 14) {
            // D-14 (정확히 2주)
            personalizedMessage = `"${goal.title}" 목표까지 정확히 2주(14일) 남았습니다. 현재까지의 진행 상황을 객관적으로 평가하고, 남은 기간 동안의 일정을 주 단위로 세부적으로 재조정해보세요.${progressMessage}`;
          } else if (diffDays === 15) {
            // D-15
            personalizedMessage = `"${goal.title}" 목표까지 15일 남았습니다. 절반의 중간 지점을 지나고 있습니다. 지금까지의 성과를 정리하고 남은 절반을 위한 에너지를 충전하세요.${progressMessage}`;
          } else if (diffDays === 16) {
            // D-16
            personalizedMessage = `"${goal.title}" 목표까지 16일 남았습니다. 목표 달성의 중간 지점을 지나고 있습니다. 진행률이 50% 정도라면 순조롭습니다. 매일의 진전을 기록해보세요.${progressMessage}`;
          } else if (diffDays === 17) {
            // D-17
            personalizedMessage = `"${goal.title}" 목표까지 17일 남았습니다. 목표를 향한 여정의 약 절반을 지났습니다. 아직 시작하지 않은 부분이 있다면 지금 시작해야 합니다.${progressMessage}`;
          } else if (diffDays === 18) {
            // D-18
            personalizedMessage = `"${goal.title}" 목표까지 18일 남았습니다. 목표를 향한 여정의 약 40%를 완료했습니다. 지금까지의 접근 방식이 효과적인지 평가해보세요.${progressMessage}`;
          } else if (diffDays === 19) {
            // D-19
            personalizedMessage = `"${goal.title}" 목표까지 19일 남았습니다. 3주 이내에 목표를 달성하게 됩니다. 계획된 일정에서 크게 벗어나지 않도록 매일의 진도를 확인하세요.${progressMessage}`;
          } else if (diffDays === 20) {
            // D-20
            personalizedMessage = `"${goal.title}" 목표까지 20일 남았습니다. 목표까지의 약 2/3 여정이 남아있습니다. 매일 꾸준한 진전이 목표 달성의 핵심입니다.${progressMessage}`;
          } else if (diffDays === 21) {
            // D-21 (정확히 3주)
            personalizedMessage = `"${goal.title}" 목표까지 정확히 3주(21일) 남았습니다. 지금 준비 상황이 30% 정도라면 순조롭게 진행되고 있습니다. 주간 단위로 세부 목표를 설정해보세요.${progressMessage}`;
          } else if (diffDays === 22) {
            // D-22
            personalizedMessage = `"${goal.title}" 목표까지 22일 남았습니다. 한 달도 채 남지 않았습니다. 목표를 위한 습관을 형성하여 매일의 진전을 만들어가세요.${progressMessage}`;
          } else if (diffDays === 23) {
            // D-23
            personalizedMessage = `"${goal.title}" 목표까지 23일 남았습니다. 남은 3주 동안 체계적으로 접근할 수 있도록 주간 단위의 세부 목표를 설정하세요.${progressMessage}`;
          } else if (diffDays === 24) {
            // D-24
            personalizedMessage = `"${goal.title}" 목표까지 24일 남았습니다. 목표 달성을 위한 자원과 정보가 충분한지 확인하고, 부족한 부분은 지금 보완하세요.${progressMessage}`;
          } else if (diffDays === 25) {
            // D-25
            personalizedMessage = `"${goal.title}" 목표까지 25일 남았습니다. 약 3주 반이 남았습니다. 목표를 향한 첫 발걸음이 시작되었는지 확인하세요.${progressMessage}`;
          } else if (diffDays === 26) {
            // D-26
            personalizedMessage = `"${goal.title}" 목표까지 26일 남았습니다. 한 달이 채 남지 않았습니다. 목표 달성을 위한 기본 계획은 이미 수립되어 있어야 합니다.${progressMessage}`;
          } else if (diffDays === 27) {
            // D-27
            personalizedMessage = `"${goal.title}" 목표까지 27일 남았습니다. 약 4주가 남았습니다. 목표를 위한 환경 구성과 기본 준비는 완료했나요?${progressMessage}`;
          } else if (diffDays === 28) {
            // D-28 (정확히 4주)
            personalizedMessage = `"${goal.title}" 목표까지 정확히 4주(28일) 남았습니다. 한 달 동안의 계획을 주간 단위로 나누어 세부 목표를 설정하세요. 큰 그림과 세부 계획 모두 중요합니다.${progressMessage}`;
          } else if (diffDays === 29) {
            // D-29
            personalizedMessage = `"${goal.title}" 목표까지 29일 남았습니다. 한 달 정도의 시간이 있습니다. 이 기간 동안 꾸준히 작은 성과를 쌓아가는 것이 중요합니다.${progressMessage}`;
          } else if (diffDays === 30) {
            // D-30 (정확히 한 달)
            personalizedMessage = `"${goal.title}" 목표까지 정확히 한 달(30일) 남았습니다. 한 달은 새로운 습관을 형성하기에 충분한 시간입니다. 매일의 작은 진전이 목표 달성의 열쇠가 될 것입니다.${progressMessage}`;
          } else if (diffDays <= 45) {
            // D-31~45 (약 1.5개월)
            personalizedMessage = `"${goal.title}" 목표까지 약 1.5개월(${diffDays}일) 남았습니다. 중장기 목표를 위한 집중력을 유지하기 위해 작은 성취를 기록하고 축하하며 진행하세요.${progressMessage}`;
          } else if (diffDays <= 60) {
            // D-46~60 (약 2개월)
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            personalizedMessage = `"${goal.title}" 목표까지 약 ${months}개월${
              remainingDays > 0 ? ` ${remainingDays}일` : ""
            }(${diffDays}일) 남았습니다. 지금까지의 성과를 점검하고, 8주 계획으로 세분화하여 주간 목표를 설정해보세요.${progressMessage}`;
          } else if (diffDays <= 90) {
            // D-61~90 (약 3개월)
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            personalizedMessage = `"${goal.title}" 목표까지 ${months}개월${
              remainingDays > 0 ? ` ${remainingDays}일` : ""
            }(${diffDays}일) 남았습니다. 분기별 목표처럼 단계별 성취 지점을 설정하고 월별 진행 상황을 확인하세요.${progressMessage}`;
          } else if (diffDays <= 180) {
            // D-91~180 (약 3~6개월)
            const months = Math.floor(diffDays / 30);
            personalizedMessage = `"${goal.title}" 목표까지 약 ${months}개월(${diffDays}일) 남았습니다. 장기 목표는 작은 단위로 나누어 접근하는 것이 효과적입니다. 월별 성취 목표와 주간 실천 계획을 세워보세요.${progressMessage}`;
          } else if (diffDays <= 365) {
            // D-181~365 (약 6개월~1년)
            const months = Math.floor(diffDays / 30);
            personalizedMessage = `"${goal.title}" 목표까지 약 ${months}개월(${diffDays}일) 남았습니다. 1년 이내의 목표는 분기별 계획을 세우고 매월 1일에 진행 상황을 검토하는 습관을 들이세요.${progressMessage}`;
          } else {
            // 1년 이상
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);

            if (years >= 1 && remainingMonths > 0) {
              personalizedMessage = `"${goal.title}" 목표까지 ${years}년 ${remainingMonths}개월(총 ${diffDays}일)의 여정이 남아있습니다. 장기적인 비전을 유지하면서 분기별, 연도별 마일스톤을 설정하여 꾸준히 진행하세요.${progressMessage}`;
            } else {
              personalizedMessage = `"${goal.title}" 목표까지 ${years}년(총 ${diffDays}일)의 여정이 남아있습니다. 장기적인 비전을 유지하면서 연도별, 분기별 마일스톤을 설정하고 정기적인 점검 일정을 만들어 꾸준히 진행하세요.${progressMessage}`;
            }
          }

          // 중요한 이벤트나 특별한 날에 따른 추가 메시지
          if (goal.importance && goal.importance === "high") {
            personalizedMessage +=
              " 이 목표는 당신에게 매우 중요합니다. 우선순위를 두고 집중하세요.";
          }

          // 목표 유형에 따른 추가 메시지
          if (goal.type) {
            if (goal.type === "career") {
              personalizedMessage +=
                " 커리어 목표는 당신의 성장과 직결됩니다. 매일의 노력이 모여 큰 성과를 이룹니다.";
            } else if (goal.type === "health") {
              personalizedMessage +=
                " 건강 목표는 꾸준함이 핵심입니다. 작은 습관부터 시작하세요.";
            } else if (goal.type === "education") {
              personalizedMessage +=
                " 교육 목표는 단계적 접근이 효과적입니다. 기초부터 탄탄히 다지세요.";
            }
          }

          upcomingGoalsInfo.push({
            id: goal.id,
            title: goal.title,
            daysLeft: diffDays,
            dDayText: dDayText,
            message: personalizedMessage,
          });
        });
      }
    }

    // 6. 기본 인사이트 생성
    const baseInsights = getContextualMessage("dailyInsights", totalStudyHours);

    // 7. 사전 정의된 메시지에서 상황에 맞는 추천 선택
    const recommendations = getContextualMessage(
      "dailyRecommendations",
      completionRate
    );

    // 8. 결과 객체 반환
    return {
      date,
      type: "daily",
      insights: baseInsights,
      recommendations,
      completionRate,
      totalHours: totalStudyHours,
      mostProductiveTime,
      subjectAnalysis: categoryAnalysis,
      methodAnalysis,
      upcomingGoalsInfo,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("일간 피드백 생성 오류:", error);
    return {
      date,
      type: "daily",
      insights: "데이터 분석 중 오류가 발생했습니다.",
      recommendations: "앱을 다시 시작하거나 지원팀에 문의해주세요.",
      completionRate: 0,
      totalHours: 0,
      timestamp: new Date().toISOString(),
    };
  }
};

// 기본 주간 피드백 생성 함수 (AI 없이)
export const generateWeeklyFeedback = (
  date,
  schedules,
  tasks,
  studySessions,
  weeklyStats = null
) => {
  try {
    // 1. 날짜 범위 계산 (해당 주의 시작과 끝)
    const currentDate = new Date(date);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const startDateStr = format(weekStart, "yyyy-MM-dd");
    const endDateStr = format(weekEnd, "yyyy-MM-dd");

    // 현재 날짜의 주차 정보 계산
    const year = currentDate.getFullYear();
    const weekKey = `week-${date}`;

    console.log(`기본 주간 피드백 생성 중: ${startDateStr} ~ ${endDateStr}`);

    // 데이터 유효성 검사
    if (!studySessions || typeof studySessions !== "object") {
      console.error("공부 세션 데이터가 유효하지 않습니다:", studySessions);
      studySessions = {}; // 기본값으로 초기화
    }

    if (!schedules || typeof schedules !== "object") {
      console.error("일정 데이터가 유효하지 않습니다:", schedules);
      schedules = {}; // 기본값으로 초기화
    }

    if (!tasks || typeof tasks !== "object") {
      console.error("태스크 데이터가 유효하지 않습니다:", tasks);
      tasks = {}; // 기본값으로 초기화
    }

    // 아래 코드를 generateWeeklyFeedback 함수 내 데이터 수집 부분 앞에 추가
    const schedulesByDay = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0, 일: 0 };
    const schedulesByTimeSlot = {
      "오전(6-12시)": 0,
      "오후(12-18시)": 0,
      "저녁(18-24시)": 0,
      "야간(0-6시)": 0,
    };

    // 2. 데이터 수집 및 분석
    let totalStudyTime = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    const categoryAnalysis = {};
    const methodAnalysis = {};
    const dailyStudyTime = {};
    const dailyCompletionRate = {};

    // 날짜 범위 내의 모든 날짜 배열 생성
    const dateArray = [];
    let currentDay = new Date(weekStart);
    while (currentDay <= weekEnd) {
      dateArray.push(format(currentDay, "yyyy-MM-dd"));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // 날짜별 데이터 수집
    // generateMonthlyFeedback 함수의 문제 부분 수정
    // BasicFeedbackService.js 파일 내부

    // 날짜별 데이터 수집 부분 수정
    dateArray.forEach((dayStr) => {
      // 공부 시간 계산 - 방어 코드 추가
      const dayStudySessions = studySessions[dayStr] || [];

      // 배열 확인 후 reduce 실행
      const dayStudyTime = Array.isArray(dayStudySessions)
        ? dayStudySessions.reduce(
            (total, session) => total + (session.duration || 0),
            0
          )
        : 0;

      totalStudyTime += dayStudyTime;
      dailyStudyTime[dayStr] = dayStudyTime;

      // 요일별 통계
      const date = new Date(dayStr);
      const dayOfWeek = date.getDay();
      const korDays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = korDays[dayOfWeek];

      // 활동이 있는 날 카운트
      if (dayStudyTime > 0) {
        schedulesByDay[dayName] = (schedulesByDay[dayName] || 0) + 1;
      }

      // 과목 및 방법별 시간 - 배열 확인 후 처리
      if (Array.isArray(dayStudySessions)) {
        dayStudySessions.forEach((session) => {
          if (session && typeof session === "object") {
            const category = session.subject || "미지정";
            const method = session.method || "기타";

            categoryAnalysis[category] =
              (categoryAnalysis[category] || 0) + (session.duration || 0);
            methodAnalysis[method] =
              (methodAnalysis[method] || 0) + (session.duration || 0);

            // 시간대 분석 (세션 시작 시간 기준)
            if (session.timestamp) {
              const sessionTime = new Date(session.timestamp);
              const hour = sessionTime.getHours();

              if (hour >= 6 && hour < 12) {
                schedulesByTimeSlot["오전(6-12시)"]++;
              } else if (hour >= 12 && hour < 18) {
                schedulesByTimeSlot["오후(12-18시)"]++;
              } else if (hour >= 18 && hour < 24) {
                schedulesByTimeSlot["저녁(18-24시)"]++;
              } else {
                schedulesByTimeSlot["야간(0-6시)"]++;
              }
            }
          }
        });
      }

      // 일정 완료율 계산
      const dayTasks = tasks[dayStr] || {};
      const dayTaskCount = Object.keys(dayTasks).length;
      const dayCompletedCount = Object.values(dayTasks).filter(Boolean).length;

      totalTasks += dayTaskCount;
      completedTasks += dayCompletedCount;
    });

    // 3. 전체 데이터 분석
    const totalStudyHours = Math.round((totalStudyTime / 3600) * 10) / 10;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 공부시간이 가장 많은 날 찾기 - 방어 코드 추가
    let mostProductiveDay = null;
    try {
      const studyTimeEntries = Object.entries(dailyStudyTime);
      if (studyTimeEntries.length > 0) {
        mostProductiveDay = studyTimeEntries.sort((a, b) => b[1] - a[1])[0];
      }
    } catch (error) {
      console.error("가장 생산적인 날 계산 오류:", error);
    }

    // 4. 사전 정의된 메시지에서 상황에 맞는 인사이트 선택
    let insights = "이번 주 공부 데이터를 분석했습니다.";
    try {
      insights = getContextualMessage("weeklyInsights", totalStudyHours);
    } catch (error) {
      console.error("인사이트 메시지 생성 오류:", error);
    }

    // 5. 사전 정의된 메시지에서 상황에 맞는 추천 선택
    let recommendations = "다음 주에는 더 체계적인 계획을 세워보세요.";
    try {
      recommendations = getContextualMessage(
        "weeklyRecommendations",
        completionRate
      );
    } catch (error) {
      console.error("추천 메시지 생성 오류:", error);
    }

    // 간단한 주간 테마와 포커스 생성
    let weeklyTheme = "꾸준함의 힘";
    let focusAdvice = "집중 시간의 질을 높이는 데 집중해보세요.";

    if (totalStudyHours < 5) {
      weeklyTheme = "새로운 시작";
      focusAdvice = "규칙적인 학습 습관 만들기에 집중해보세요.";
    } else if (totalStudyHours < 10) {
      weeklyTheme = "꾸준함의 가치";
      focusAdvice = "학습 시간을 조금씩 늘려보세요.";
    } else if (totalStudyHours < 20) {
      weeklyTheme = "균형 잡힌 성장";
      focusAdvice = "학습의 질과 깊이를 높여보세요.";
    } else {
      weeklyTheme = "전문성 향상";
      focusAdvice = "지속 가능한 학습 페이스를 유지하세요.";
    }

    // 일정 인사이트 생성
    let scheduleInsights = "이번 주는 일정 관리와 학습이 균형을 이루었습니다.";

    if (completionRate < 30) {
      scheduleInsights =
        "일정 관리에 어려움이 있었습니다. 더 현실적인 계획을 세워보세요.";
    } else if (completionRate < 60) {
      scheduleInsights =
        "절반 이상의 일정을 완료했습니다. 우선순위 설정이 도움이 될 수 있어요.";
    } else if (completionRate < 80) {
      scheduleInsights =
        "대부분의 일정을 잘 완료했습니다. 좋은 실행력을 보여주고 있어요.";
    } else {
      scheduleInsights =
        "탁월한 일정 관리 능력을 보여주었습니다. 이런 습관을 유지하세요!";
    }

    // 6. 최종 리포트 데이터 구성
    return {
      weekKey,
      startDate: startDateStr,
      endDate: endDateStr,
      type: "weekly",
      insights,
      recommendations,
      weeklyTheme,
      focusAdvice,
      scheduleInsights,
      completionRate,
      totalHours: totalStudyHours,
      dailyStudyTime,
      dailyCompletionRate,
      subjectAnalysis: categoryAnalysis,
      methodAnalysis,
      mostProductiveDay: mostProductiveDay ? mostProductiveDay[0] : null,
      timestamp: new Date().toISOString(),
      isAIGenerated: false, // AI가 생성한 것이 아님을 표시
    };
  } catch (error) {
    console.error("기본 주간 피드백 생성 오류:", error);
    return {
      weekKey: `week-${date}`,
      type: "weekly",
      insights: "이번 주 활동 데이터를 분석하는 중 오류가 발생했습니다.",
      recommendations: "잠시 후 다시 시도하거나, 앱을 재시작해보세요.",
      completionRate: 0,
      totalHours: 0,
      timestamp: new Date().toISOString(),
      isAIGenerated: false,
    };
  }
};

// 기본 월간 피드백 생성 함수 (AI 없이)
export const generateMonthlyFeedback = (
  date,
  schedules,
  tasks,
  studySessions,
  monthlyStats = null
) => {
  try {
    // 1. 날짜 범위 계산 (해당 월의 시작과 끝)
    const currentDate = new Date(date);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const startDateStr = format(monthStart, "yyyy-MM-dd");
    const endDateStr = format(monthEnd, "yyyy-MM-dd");
    const monthKey = format(currentDate, "yyyy-MM");

    console.log(
      `기본 월간 피드백 생성 중: ${format(monthStart, "yyyy년 MM월")}`
    );

    // 2. 데이터 수집 및 분석 (이전과 유사한 로직)
    // (여기서는 코드 간소화를 위해 중간 단계 생략)

    // 최종 데이터 계산
    let totalStudyTime = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    const categoryAnalysis = {};
    const methodAnalysis = {};
    const dailyStudyTime = {};

    // 일정 관련 통계
    const schedulesByDay = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0, 일: 0 };
    const schedulesByTimeSlot = {
      "오전(6-12시)": 0,
      "오후(12-18시)": 0,
      "저녁(18-24시)": 0,
      "야간(0-6시)": 0,
    };

    // 날짜 범위 내의 모든 날짜 배열 생성
    const dateArray = [];
    let currentDay = new Date(monthStart);
    while (currentDay <= monthEnd) {
      dateArray.push(format(currentDay, "yyyy-MM-dd"));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // 날짜별 데이터 수집
    dateArray.forEach((dayStr) => {
      // 공부 시간 계산
      const dayStudySessions = studySessions[dayStr] || [];
      const dayStudyTime = dayStudySessions.reduce(
        (total, session) => total + session.duration,
        0
      );
      totalStudyTime += dayStudyTime;
      dailyStudyTime[dayStr] = dayStudyTime;

      // 요일별 통계
      const date = new Date(dayStr);
      const dayOfWeek = date.getDay();
      const korDays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = korDays[dayOfWeek];

      // 활동이 있는 날 카운트
      if (dayStudyTime > 0) {
        schedulesByDay[dayName] = (schedulesByDay[dayName] || 0) + 1;
      }

      // 과목 및 방법별 시간
      dayStudySessions.forEach((session) => {
        const category = session.subject || "미지정";
        const method = session.method || "기타";

        categoryAnalysis[category] =
          (categoryAnalysis[category] || 0) + session.duration;
        methodAnalysis[method] =
          (methodAnalysis[method] || 0) + session.duration;

        // 시간대 분석 (세션 시작 시간 기준)
        if (session.timestamp) {
          const sessionTime = new Date(session.timestamp);
          const hour = sessionTime.getHours();

          if (hour >= 6 && hour < 12) {
            schedulesByTimeSlot["오전(6-12시)"]++;
          } else if (hour >= 12 && hour < 18) {
            schedulesByTimeSlot["오후(12-18시)"]++;
          } else if (hour >= 18 && hour < 24) {
            schedulesByTimeSlot["저녁(18-24시)"]++;
          } else {
            schedulesByTimeSlot["야간(0-6시)"]++;
          }
        }
      });

      // 일정 완료율 계산
      const dayTasks = tasks[dayStr] || {};
      const dayTaskCount = Object.keys(dayTasks).length;
      const dayCompletedCount = Object.values(dayTasks).filter(Boolean).length;

      totalTasks += dayTaskCount;
      completedTasks += dayCompletedCount;
    });

    // 3. 전체 데이터 분석
    const daysInMonth = dateArray.length;
    const totalStudyHours = Math.round((totalStudyTime / 3600) * 10) / 10;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgDailyStudyHours = totalStudyHours / daysInMonth;
    const daysWithActivity = Object.values(dailyStudyTime).filter(
      (time) => time > 0
    ).length;
    const activityRatio = Math.round((daysWithActivity / daysInMonth) * 100);

    // 가장 활동적인 요일과 시간대
    const mostActiveDay = Object.entries(schedulesByDay).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const mostActiveTimeSlot = Object.entries(schedulesByTimeSlot).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // 4. 패턴 분석 및 메시지 생성

    // 활동 비율에 따른 메시지
    const activityMessage = getPatternMessage("activityRatio", activityRatio);

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

    const dayPatternMessage = getPatternMessage("dayPattern", dayPattern);

    // 시간대 패턴 메시지
    const timeSlotMessage = mostActiveTimeSlot
      ? getPatternMessage("timeSlot", mostActiveTimeSlot[0])
      : "특정 시간대에 집중된 활동 패턴은 보이지 않습니다.";

    // 생산성 점수 계산 (간단한 알고리즘)
    // - 활동 비율 (30%)
    // - 완료율 (40%)
    // - 평균 일일 학습 시간 (30%)
    const activityScore = Math.min(activityRatio, 100) * 0.3;
    const completionScore = Math.min(completionRate, 100) * 0.4;
    const studyTimeScore = Math.min(avgDailyStudyHours * 33, 100) * 0.3; // 3시간 이상이면 만점

    const productivityScore = Math.round(
      activityScore + completionScore + studyTimeScore
    );

    // 5. 최종 리포트 데이터 구성
    return {
      monthKey: `month-${monthKey}`,
      startDate: startDateStr,
      endDate: endDateStr,
      month: format(currentDate, "yyyy년 MM월"),
      type: "monthly",
      monthlyOverview: `${format(
        monthStart,
        "yyyy년 MM월"
      )}에는 총 ${totalStudyHours}시간 공부했으며, 한 달 중 ${daysWithActivity}일 (${activityRatio}%) 활동했습니다.`,
      insights: activityMessage,
      longTermRecommendations:
        "꾸준한 학습 습관을 유지하고, 일정 관리 시스템을 더 효율적으로 발전시켜보세요.",
      monthlyTheme: "꾸준함의 힘",
      nextMonthFocus: "일관된 학습 루틴 유지하기",
      productivityScore,
      schedulePatternInsights: `${dayPatternMessage} ${timeSlotMessage}`,
      completionRate,
      totalHours: totalStudyHours,
      avgDailyHours: Math.round(avgDailyStudyHours * 10) / 10,
      daysWithStudy: daysWithActivity,
      activityRatio,
      subjectAnalysis: categoryAnalysis,
      methodAnalysis,
      schedulesByDay,
      schedulesByTimeSlot,
      mostActiveDay: mostActiveDay ? mostActiveDay[0] : null,
      mostActiveTimeSlot: mostActiveTimeSlot ? mostActiveTimeSlot[0] : null,
      timestamp: new Date().toISOString(),
      isAIGenerated: false, // AI가 생성한 것이 아님을 표시
    };
  } catch (error) {
    console.error("기본 월간 피드백 생성 오류:", error);
    return {
      monthKey: `month-${format(new Date(date), "yyyy-MM")}`,
      type: "monthly",
      insights: "월간 데이터 분석 중 오류가 발생했습니다.",
      recommendations: "잠시 후 다시 시도하거나, 앱을 재시작해보세요.",
      completionRate: 0,
      totalHours: 0,
      timestamp: new Date().toISOString(),
      isAIGenerated: false,
    };
  }
};

// 알림 핸들러 등록 (앱 시작 시 호출 필요)
export const registerNotificationHandler = () => {
  // 알림 응답 핸들러 설정
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
};

// 알림 취소 함수
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error("알림 취소 오류:", error);
    return false;
  }
};
