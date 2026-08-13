import type {
    AdminSubmissionBucket,
    AdminSubmissionsPage,
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

async function apiBlob(path: string) {
    const headers = new Headers();
    if (WebApp?.initData)
        headers.set("authorization", `tma ${WebApp.initData}`);
    const response = await fetch(`/api/v1${path}`, { headers });
    if (!response.ok) {
        const body = (await response
            .json()
            .catch(() => null)) as ApiError | null;
        throw new ApiRequestError(
            body?.error.code || "REQUEST_FAILED",
            body?.error.message || "Не удалось загрузить файл",
        );
    }
    return URL.createObjectURL(await response.blob());
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
    audio: (voiceId: string) => apiBlob(`/voices/${voiceId}/audio`),
    prepareVoiceShare: (voiceId: string) =>
        apiFetch<{ id: string }>(`/voices/${voiceId}/share`, {
            method: "POST",
        }),
    submissions: () => apiFetch<Submission[]>("/submissions"),
    submit: (form: FormData) =>
        apiFetch<Submission>("/submissions", { method: "POST", body: form }),
    adminSubmissions: (bucket: AdminSubmissionBucket, offset: number) => {
        const params = new URLSearchParams({
            bucket,
            limit: "20",
            offset: String(offset),
        });
        return apiFetch<AdminSubmissionsPage>(`/admin/submissions?${params}`);
    },
    submissionAudio: (id: string) => apiBlob(`/admin/submissions/${id}/audio`),
    updateSubmission: (id: string, title: string) =>
        apiFetch<Submission>(`/admin/submissions/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title }),
        }),
    approveSubmission: (
        id: string,
        input: {
            voiceId: string;
            title: string;
            startMs: number;
            endMs: number | null;
        },
    ) =>
        apiFetch<Submission>(`/admin/submissions/${id}/approve`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
        }),
    rejectSubmission: (id: string, reason: string) =>
        apiFetch<Submission>(`/admin/submissions/${id}/reject`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reason }),
        }),
    addVoice: (form: FormData) =>
        apiFetch<{ ok: true; voiceId: string }>("/admin/voices", {
            method: "POST",
            body: form,
        }),
};
