// 비로그인 일일 한도 초과 — Drawer에서 instanceof로 식별해 로그인 유도 UI를 표시한다
export class GuestLimitError extends Error {
    constructor() {
        super('하루 무료 AI 분석 한도(5회)를 초과했습니다.')
        this.name = 'GuestLimitError'
    }
}
