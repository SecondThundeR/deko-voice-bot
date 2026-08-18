import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HttpError } from "../src/http/errors.ts";
import {
    parsePagination,
    parseVoiceSearchQuery,
} from "../src/http/validation.ts";

describe("parsePagination", () => {
    it("uses bounded defaults and accepts safe integer values", () => {
        assert.deepEqual(parsePagination({}), { offset: 0, limit: 20 });
        assert.deepEqual(parsePagination({ offset: "40", limit: "50" }), {
            offset: 40,
            limit: 50,
        });
    });

    it("rejects malformed, fractional, and excessive values", () => {
        for (const query of [
            { offset: "-1" },
            { offset: "1.5" },
            { offset: "10001" },
            { limit: "0" },
            { limit: "51" },
        ]) {
            assert.throws(
                () => parsePagination(query),
                (error: unknown) =>
                    error instanceof HttpError &&
                    error.code === "INVALID_PAGINATION",
            );
        }
    });
});

describe("parseVoiceSearchQuery", () => {
    it("trims valid searches and rejects expensive oversized searches", () => {
        assert.equal(parseVoiceSearchQuery("  hello  "), "hello");
        assert.throws(
            () => parseVoiceSearchQuery("a".repeat(129)),
            (error: unknown) =>
                error instanceof HttpError &&
                error.code === "INVALID_SEARCH_QUERY",
        );
    });
});
