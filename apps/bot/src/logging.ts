type SafeErrorInfo = {
    error: {
        code?: number | string;
        message?: string;
        stack?: string;
        type: string;
    };
};

const SAFE_ERROR_CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const HOME_PATH = /\/(?:Users|home)\/[^/\s]+/g;
const LABELED_ID =
    /\b(user|chat|from|sender|recipient|owner)([\s_-]*(?:id)?[\s:=#-]*)\+?\d+\b/gi;
const LONG_NUMBER = /(?<![\w])\+?\d{5,15}(?![\w])/g;
const SENSITIVE_LABELED_VALUE =
    /\b(charge(?:[_ ]?id)?|invoice(?:[_ ]?payload)?|file(?:[_ ]?(?:unique[_ ]?)?id))([\s:=#-]+)["']?[\w:-]+/gi;
const TELEGRAM_BOT_TOKEN = /bot\d+:[\w-]+/g;
const TELEGRAM_USERNAME = /@[a-z\d_]{5,32}\b/gi;

export function getSafeErrorInfo(error: unknown): SafeErrorInfo {
    if (!error || typeof error !== "object") {
        return { error: { type: typeof error } };
    }

    const errorRecord = error as Record<string, unknown>;
    const errorType =
        typeof errorRecord.name === "string" && errorRecord.name.length > 0
            ? errorRecord.name
            : (error.constructor?.name ?? "UnknownError");
    const errorCode = getSafeErrorCode(errorRecord);
    const errorMessage =
        error instanceof Error && error.message
            ? sanitizeLogText(error.message)
            : undefined;
    const errorStack =
        error instanceof Error ? getSafeStack(error.stack) : undefined;

    return {
        error: {
            type: errorType,
            ...(errorCode === undefined ? {} : { code: errorCode }),
            ...(errorMessage ? { message: errorMessage } : {}),
            ...(errorStack
                ? {
                      stack: `${errorType}${errorMessage ? `: ${errorMessage}` : ""}\n${errorStack}`,
                  }
                : {}),
        },
    };
}

export function sanitizeLogText(value: string) {
    return value
        .replace(TELEGRAM_BOT_TOKEN, "bot[redacted-token]")
        .replace(EMAIL, "[redacted-email]")
        .replace(TELEGRAM_USERNAME, "@[redacted-username]")
        .replace(LABELED_ID, "$1$2[redacted-id]")
        .replace(SENSITIVE_LABELED_VALUE, "$1$2[redacted-value]")
        .replace(LONG_NUMBER, "[redacted-id]")
        .replace(HOME_PATH, "/[redacted-home]");
}

function getSafeStack(stack: string | undefined) {
    if (!stack) {
        return undefined;
    }

    const frames = stack
        .split("\n")
        .slice(1, 21)
        .filter((line) => line.trimStart().startsWith("at "));

    return frames.length > 0 ? sanitizeLogText(frames.join("\n")) : undefined;
}

function getSafeErrorCode(error: Record<string, unknown>) {
    const code = error.error_code ?? error.code;

    if (typeof code === "number" && Number.isFinite(code)) {
        return code;
    }

    if (typeof code === "string" && SAFE_ERROR_CODE.test(code)) {
        return code;
    }

    return undefined;
}
