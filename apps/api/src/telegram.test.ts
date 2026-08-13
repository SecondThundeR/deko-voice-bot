import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

process.env.BOT_TOKEN = "123456:test-token";
process.env.VOICE_MODERATION_CHAT_ID = "-1001234567890";

const originalFetch = globalThis.fetch;
const { prepareVoiceMessage } = await import("./telegram.ts");

afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe("prepareVoiceMessage", () => {
    it("prepares a cached voice for the requesting user", async () => {
        globalThis.fetch = async (input, init) => {
            assert.equal(
                String(input),
                "https://api.telegram.org/bot123456:test-token/savePreparedInlineMessage",
            );
            assert.equal(init?.method, "POST");
            assert.ok(init?.body instanceof FormData);
            assert.equal(init.body.get("user_id"), "42");
            assert.deepEqual(JSON.parse(String(init.body.get("result"))), {
                type: "voice",
                id: "greeting",
                voice_file_id: "telegram-file-id",
                title: "Приветствие",
            });
            assert.equal(init.body.get("allow_user_chats"), "true");
            assert.equal(init.body.get("allow_group_chats"), "true");
            assert.equal(init.body.get("allow_channel_chats"), "true");
            return Response.json({
                ok: true,
                result: { id: "prepared-id", expiration_date: 1_800_000_000 },
            });
        };

        assert.deepEqual(
            await prepareVoiceMessage({
                userId: 42,
                voiceId: "greeting",
                title: "Приветствие",
                fileId: "telegram-file-id",
            }),
            { id: "prepared-id", expiration_date: 1_800_000_000 },
        );
    });
});
