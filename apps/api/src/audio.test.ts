import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.BOT_TOKEN = "123456:test-token";
process.env.VOICE_MODERATION_CHAT_ID = "-1001234567890";

const { parseTrimInput } = await import("./audio.ts");

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
