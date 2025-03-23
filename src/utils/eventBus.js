// src/utils/eventBus.js
// 간단한 이벤트 버스 구현 - 컴포넌트/컨텍스트 간 통신을 위한 이벤트 시스템

/**
 * 간단한 이벤트 버스 구현
 * - 컴포넌트/컨텍스트 간 직접적인 의존성 없이 통신할 수 있는 방법 제공
 * - 순환 참조 문제 해결에 도움
 */
export const eventBus = {
    // 이벤트 저장소
    events: {},
  
    /**
     * 이벤트 구독
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 이벤트 발생 시 실행할 콜백 함수
     */
    on(event, callback) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },
  
    /**
     * 이벤트 구독 취소
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 제거할 콜백 함수
     */
    off(event, callback) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      }
    },
  
    /**
     * 이벤트 발생
     * @param {string} event - 이벤트 이름
     * @param {*} data - 이벤트와 함께 전달할 데이터
     */
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data));
      }
    }
  };
  
  // 사용 예시:
  // - PlannerContext에서: eventBus.emit('goalAdded', { goalId: 'goal-123' });
  // - ProgressContext에서: eventBus.on('goalAdded', (data) => { /* 처리 로직 */ });