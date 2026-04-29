// 첫 번째 배치임을 나타내는 sentinel — cursor 없이 GitHub 첫 페이지 요청
export const INITIAL_BATCH = 'initial' as const

export function encodeBatch(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function decodeBatch<T>(encoded: string): T | null {
    try {
        return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as T
    } catch {
        return null
    }
}
