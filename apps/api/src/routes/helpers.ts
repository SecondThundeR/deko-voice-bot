import { getUserIsIgnoredStatus } from "@deko-voice-bot/database/queries/users.js";
import { withDatabaseTraffic } from "@deko-voice-bot/database/traffic.js";
import { HttpError } from "../errors.ts";
import { logger } from "../logger.ts";
import type { ApiEnv } from "../types.ts";

export const database = <T>(operation: () => Promise<T>) =>
    withDatabaseTraffic(operation);

export function fullname(user: ApiEnv["Variables"]["user"]) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

export async function bestEffortTelegram(
    requestId: string,
    action: string,
    operation: () => Promise<unknown>,
) {
    try {
        await operation();
    } catch (error) {
        logger.warn(
            {
                requestId,
                action,
                error: error instanceof Error ? error.message : String(error),
            },
            "Best-effort Telegram action failed",
        );
    }
}

export function requireAdmin(isAdmin: boolean) {
    if (!isAdmin) {
        throw new HttpError(403, "ADMIN_REQUIRED", "Доступно только админам");
    }
}

export function validateTitle(value: unknown) {
    const title = String(value ?? "").trim();
    if (title.length < 1 || title.length > 128) {
        throw new HttpError(
            400,
            "INVALID_TITLE",
            "Название должно содержать от 1 до 128 символов",
        );
    }
    return title;
}

export function moderationCaption(submission: {
    id: string;
    submitterUserId: number;
    title: string;
}) {
    return [
        "Новая заявка на реплику",
        `Название: ${submission.title}`,
        `Автор: ${submission.submitterUserId}`,
        `ID: ${submission.id}`,
    ].join("\n");
}

export async function requireConsent(userId: number) {
    if ((await database(() => getUserIsIgnoredStatus(userId))) !== false) {
        throw new HttpError(
            403,
            "CONSENT_REQUIRED",
            "Сначала подтвердите согласие на хранение данных",
        );
    }
}
