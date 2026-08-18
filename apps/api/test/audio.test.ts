import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.BOT_TOKEN = "123456:test-token";
process.env.VOICE_MODERATION_CHAT_ID = "-1001234567890";

const { normalizeTrimForDuration, parseTrimInput } = await import(
    "../src/integrations/audio.ts"
);

describe("parseTrimInput", () => {
    it("uses the complete file when the end is omitted", () => {
        assert.deepEqual(parseTrimInput({}), { startMs: 0, endMs: null });
        assert.deepEqual(parseTrimInput({ startMs: "250", endMs: "" }), {
            startMs: 250,
            endMs: null,
        });
    });

    it("accepts integer millisecond boundaries", () => {
        assert.deepEqual(parseTrimInput({ startMs: 125, endMs: 1_250 }), {
            startMs: 125,
            endMs: 1_250,
        });
    });

    it("rejects negative, fractional, and too-short selections", () => {
        for (const input of [
            { startMs: -1, endMs: null },
            { startMs: 1.5, endMs: 500 },
            { startMs: 200, endMs: 299 },
            { startMs: 500, endMs: 400 },
        ]) {
            assert.throws(
                () => parseTrimInput(input),
                (error: unknown) =>
                    error instanceof Error && error.name === "HttpError",
            );
        }
    });
});

describe("normalizeTrimForDuration", () => {
    it("keeps the complete file selection", () => {
        assert.deepEqual(
            normalizeTrimForDuration({ startMs: 0, endMs: null }, 1_000),
            { startMs: 0, endMs: null },
        );
    });

    it("keeps valid boundaries and clamps the duration tolerance", () => {
        assert.deepEqual(
            normalizeTrimForDuration({ startMs: 100, endMs: 700 }, 1_000),
            { startMs: 100, endMs: 700 },
        );
        assert.deepEqual(
            normalizeTrimForDuration({ startMs: 100, endMs: 1_020 }, 1_000),
            { startMs: 100, endMs: 1_000 },
        );
    });

    it("rejects boundaries outside the file duration", () => {
        for (const trim of [
            { startMs: 1_000, endMs: null },
            { startMs: 950, endMs: null },
            { startMs: 100, endMs: 1_026 },
        ]) {
            assert.throws(
                () => normalizeTrimForDuration(trim, 1_000),
                (error: unknown) =>
                    error instanceof Error && error.name === "HttpError",
            );
        }
    });
});
