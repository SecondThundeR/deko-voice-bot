import type { SubmissionStatus } from "@deko-voice-bot/contracts";

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
    uploading: "Загрузка",
    pending: "На проверке",
    processing: "Обработка",
    approved: "Одобрено",
    rejected: "Отклонено",
    failed: "Ошибка",
};

export function submissionStatusVariant(status: SubmissionStatus) {
    if (status === "rejected" || status === "failed") return "destructive";
    return status === "approved" ? "default" : "secondary";
}
