import type { DatabaseTraffic } from "../dependencies/types.ts";
import { HttpError } from "../http/errors.ts";
import { parseTitle } from "../http/validation.ts";
import type { ApiEnv } from "../types.ts";

export function fullname(user: ApiEnv["Variables"]["user"]) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

export async function bestEffortTelegram(
    logger: { warn: (object: object, message?: string) => void },
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
    if (!isAdmin)
        throw new HttpError(403, "ADMIN_REQUIRED", "Доступно только админам");
}

export const validateTitle = parseTitle;

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

export async function requireConsent(
    {
        database,
        getUserIsIgnoredStatus,
    }: DatabaseTraffic & {
        getUserIsIgnoredStatus(userId: number): Promise<boolean | null>;
    },
    userId: number,
) {
    if ((await database(() => getUserIsIgnoredStatus(userId))) !== false) {
        throw new HttpError(
            403,
            "CONSENT_REQUIRED",
            "Сначала подтвердите согласие на хранение данных",
        );
    }
}
