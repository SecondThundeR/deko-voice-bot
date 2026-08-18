import type {
    AdminSubmissionBucket,
    AdminSubmissionsPage,
    ApiError,
    Submission,
    Viewer,
} from "@deko-voice-bot/contracts";
import { WebApp } from "./telegram";

class ApiRequestError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = "ApiRequestError";
        this.code = code;
    }
}

async function apiFetch<T>(path: string, init?: RequestInit) {
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
};
