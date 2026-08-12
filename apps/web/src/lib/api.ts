import type {
    ApiError,
    Leaderboards,
    Stats,
    Submission,
    Viewer,
    VoicesPage,
} from "@deko-voice-bot/contracts";
import { WebApp } from "./telegram";

export class ApiRequestError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = "ApiRequestError";
        this.code = code;
    }
}

export async function apiFetch<T>(path: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (WebApp?.initData)
        headers.set("authorization", `tma ${WebApp.initData}`);
    const response = await fetch(`/api/v1${path}`, { ...init, headers });
    if (!response.ok) {
        const body = (await response
            .json()
            .catch(() => null)) as ApiError | null;
        throw new ApiRequestError(
            body?.error.code || "REQUEST_FAILED",
            body?.error.message || "Не удалось выполнить запрос",
        );
    }
    return response.json() as Promise<T>;
}

export const api = {
    viewer: () => apiFetch<Viewer>("/me"),
    consent: () => apiFetch<{ ok: true }>("/me/consent", { method: "PUT" }),
    stats: () => apiFetch<Stats>("/stats"),
    leaderboards: () => apiFetch<Leaderboards>("/leaderboards"),
    voices: (
        query: string,
        sort: "title" | "popularity" | "favorites",
        offset: number,
    ) => {
        const params = new URLSearchParams({
            query,
            sort,
            limit: "30",
            offset: String(offset),
        });
        return apiFetch<VoicesPage>(`/voices?${params}`);
    },
    favorite: (voiceId: string, favorite: boolean) =>
        apiFetch<{ ok: true }>(`/voices/${voiceId}/favorite`, {
            method: favorite ? "PUT" : "DELETE",
        }),
    audio: async (voiceId: string) => {
        const headers = new Headers();
        if (WebApp?.initData)
            headers.set("authorization", `tma ${WebApp.initData}`);
        const response = await fetch(`/api/v1/voices/${voiceId}/audio`, {
            headers,
        });
        if (!response.ok) throw new Error("Не удалось загрузить аудио");
        return URL.createObjectURL(await response.blob());
    },
    submissions: () => apiFetch<Submission[]>("/submissions"),
    submit: (form: FormData) =>
        apiFetch<Submission>("/submissions", { method: "POST", body: form }),
};
