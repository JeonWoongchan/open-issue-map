// 같은 key로 이미 진행 중인(아직 resolve되지 않은) 비동기 작업이 있으면 새로 시작하지 않고 그 결과를 공유한다.
// unstable_cache는 "이미 끝난 계산 결과"만 캐싱하므로, 캐시가 채워지기 전에 동시에 들어온
// 같은 key의 요청들은 각자 따로 계산해버리는 문제(cache stampede)가 있다 — 이를 보완한다.
// 이 in-flight 목록은 서버 프로세스 메모리에만 있으므로, 같은 웜 인스턴스가 처리하는
// 동시 요청 사이에서만 동작한다(여러 서버리스 인스턴스 간 공유되지 않음).
const inFlight = new Map<string, Promise<unknown>>()

export function withSingleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(key)
    if (existing) {
        return existing as Promise<T>
    }

    const promise = run().finally(() => {
        inFlight.delete(key)
    })
    inFlight.set(key, promise)
    return promise
}
