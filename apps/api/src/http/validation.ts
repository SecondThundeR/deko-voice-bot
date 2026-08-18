import * as v from "valibot";
import { HttpError } from "./errors.ts";

const normalizeString = (value: unknown) => String(value ?? "").trim();

export const titleSchema = v.pipe(
    v.unknown(),
    v.transform(normalizeString),
    v.minLength(1),
    v.maxLength(128),
);
export const voiceIdSchema = v.pipe(
    v.unknown(),
    v.transform(normalizeString),
    v.regex(/^[A-Za-z0-9_-]{1,64}$/),
);
export const paginationIntegerSchema = v.pipe(
    v.string(),
    v.regex(/^(?:0|[1-9]\d*)$/),
    v.transform(Number),
    v.safeInteger(),
);
export const searchQuerySchema = v.optional(
    v.pipe(
        v.string(),
        v.transform((value) => value.trim()),
        v.maxLength(128),
    ),
);
export const rejectionReasonSchema = v.pipe(
    v.unknown(),
    v.transform(normalizeString),
    v.maxLength(512),
);
export const trimInputSchema = v.object({
    startMs: v.optional(v.unknown()),
    endMs: v.optional(v.unknown()),
});

function requireValid<T>(
    result: v.SafeParseResult<v.BaseSchema<unknown, T, v.BaseIssue<unknown>>>,
    error: HttpError,
): T {
    if (!result.success) throw error;
    return result.output;
}

export function parseTitle(value: unknown) {
    return requireValid(
        v.safeParse(titleSchema, value),
        new HttpError(
            400,
            "INVALID_TITLE",
            "Название должно содержать от 1 до 128 символов",
        ),
    );
}

export function parseVoiceId(value: unknown) {
    return requireValid(
        v.safeParse(voiceIdSchema, value),
        new HttpError(
            400,
            "INVALID_VOICE_ID",
            "ID должен содержать от 1 до 64 латинских букв, цифр, _ или -",
        ),
    );
}

function parsePaginationInteger(
    value: string | undefined,
    fallback: number,
    name: string,
) {
    if (value === undefined) return fallback;
    const result = v.safeParse(paginationIntegerSchema, value);
    if (!result.success) {
        const message = /^(?:0|[1-9]\d*)$/.test(value)
            ? `${name} имеет недопустимое значение`
            : `${name} должен быть целым неотрицательным числом`;
        throw new HttpError(400, "INVALID_PAGINATION", message);
    }
    return result.output;
}

export function parsePagination(query: { offset?: string; limit?: string }) {
    const offset = parsePaginationInteger(query.offset, 0, "offset");
    const limit = parsePaginationInteger(query.limit, 20, "limit");
    if (offset > 10_000 || limit < 1 || limit > 50) {
        throw new HttpError(
            400,
            "INVALID_PAGINATION",
            "offset не должен превышать 10000, limit — от 1 до 50",
        );
    }
    return { offset, limit };
}

export function parseVoiceSearchQuery(value: string | undefined) {
    return requireValid(
        v.safeParse(searchQuerySchema, value),
        new HttpError(
            400,
            "INVALID_SEARCH_QUERY",
            "Поисковый запрос не должен превышать 128 символов",
        ),
    );
}

export function parseRejectionReason(value: unknown) {
    return requireValid(
        v.safeParse(rejectionReasonSchema, value),
        new HttpError(
            400,
            "INVALID_REJECTION_REASON",
            "Причина отклонения не должна превышать 512 символов",
        ),
    );
}

export function parseTrimInput(input: { startMs?: unknown; endMs?: unknown }) {
    const body = requireValid(
        v.safeParse(trimInputSchema, input),
        new HttpError(
            400,
            "INVALID_TRIM",
            "Выберите корректный фрагмент длительностью не менее 0,1 секунды",
        ),
    );
    const startMs = Number(body.startMs ?? 0);
    const endMs =
        body.endMs === null || body.endMs === undefined || body.endMs === ""
            ? null
            : Number(body.endMs);
    if (
        !Number.isSafeInteger(startMs) ||
        startMs < 0 ||
        (endMs !== null &&
            (!Number.isSafeInteger(endMs) || endMs - startMs < 100))
    ) {
        throw new HttpError(
            400,
            "INVALID_TRIM",
            "Выберите корректный фрагмент длительностью не менее 0,1 секунды",
        );
    }
    return { startMs, endMs };
}

export async function parseOptionalJsonBody(
    request: Request,
): Promise<Record<string, unknown>> {
    try {
        const body: unknown = await request.json();
        return body && typeof body === "object" && !Array.isArray(body)
            ? (body as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}
