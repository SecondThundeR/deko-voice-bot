import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

process.env.BOT_TOKEN = "123456:test-token";
process.env.VOICE_MODERATION_CHAT_ID = "-1001234567890";

const { validateInitData } = await import("./auth.ts");

function createInitData(
    authDate: number,
    user = JSON.stringify({ id: 42, first_name: "Test" }),
) {
    const params = new URLSearchParams({
        auth_date: String(authDate),
        query_id: "test-query",
        user,
    });
    const check = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    const secret = createHmac("sha256", "WebAppData")
        .update(process.env.BOT_TOKEN)
        .digest();
    params.set(
        "hash",
        createHmac("sha256", secret).update(check).digest("hex"),
    );
    return params.toString();
}

describe("validateInitData", () => {
    it("accepts a current Telegram-signed user", () => {
        const now = Date.now();
        assert.deepEqual(
            validateInitData(createInitData(Math.floor(now / 1_000)), now),
            { id: 42, first_name: "Test" },
        );
    });

    it("rejects stale and tampered data", () => {
        const now = Date.now();
        assert.equal(
            validateInitData(
                createInitData(Math.floor(now / 1_000) - 24 * 60 * 60 - 1),
                now,
            ),
            null,
        );
        assert.equal(
            validateInitData(
                createInitData(Math.floor(now / 1_000)).replace(
                    "Test",
                    "Other",
                ),
                now,
            ),
            null,
        );
    });

    it("rejects malformed signed user data without throwing", () => {
        const malformed = createInitData(Math.floor(Date.now() / 1_000), "{");
        assert.equal(validateInitData(malformed), null);
    });
});
