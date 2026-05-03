import { isUnauthorizedApiResponse, redirectToLogin } from '@/lib/client-auth'
import type { ApiResponse } from '@/types/api'

export async function fetchApi<T>(url: string, defaultError: string): Promise<T> {
    const res = await fetch(url)
    const json = (await res.json()) as ApiResponse<T>
    if (isUnauthorizedApiResponse(res, json)) {
        redirectToLogin()
        throw new Error(!json.ok ? (json.error?.message ?? defaultError) : defaultError)
    }
    if (!json.ok) throw new Error(json.error?.message ?? defaultError)
    return json.data
}
