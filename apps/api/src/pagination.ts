import { HttpError } from "./errors.ts";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_OFFSET = 10_000;

function parseSafeInteger(
    value: string | undefined,
    fallback: number,
    name: string,
) {
    if (value === undefined) return fallback;
    if (!/^(?:0|[1-9]\d*)$/.test(value)) {
        throw new HttpError(
            400,
            "INVALID_PAGINATION",
            `${name} должен быть целым неотрицательным числом`,
        );
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
        throw new HttpError(
            400,
            "INVALID_PAGINATION",
            `${name} имеет недопустимое значение`,
        );
    }
    return parsed;
}

interface ParsePaginationQuery {
    offset?: string;
    limit?: string;
}

export function parsePagination(query: ParsePaginationQuery) {
    const offset = parseSafeInteger(query.offset, 0, "offset");
    const requestedLimit = parseSafeInteger(
        query.limit,
        DEFAULT_LIMIT,
        "limit",
    );
    if (
        offset > MAX_OFFSET ||
        requestedLimit < 1 ||
        requestedLimit > MAX_LIMIT
    ) {
        throw new HttpError(
            400,
            "INVALID_PAGINATION",
            `offset не должен превышать ${MAX_OFFSET}, limit — от 1 до ${MAX_LIMIT}`,
        );
    }
    return { offset, limit: requestedLimit };
}

export function parseVoiceSearchQuery(value: string | undefined) {
    const query = value?.trim();
    if (query && query.length > 128) {
        throw new HttpError(
            400,
            "INVALID_SEARCH_QUERY",
            "Поисковый запрос не должен превышать 128 символов",
        );
    }
    return query;
}
