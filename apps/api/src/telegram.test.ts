import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

process.env.BOT_TOKEN = "123456:test-token";
process.env.VOICE_MODERATION_CHAT_ID = "-1001234567890";

const originalFetch = globalThis.fetch;
const { TelegramError, prepareVoiceMessage, sendSubmissionToModeration } =
    await import("./telegram.ts");

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

describe("Telegram errors", () => {
    it("exposes upstream failure details without returning a generic error", async () => {
        globalThis.fetch = async () =>
            Response.json(
                { ok: false, description: "Too Many Requests" },
                { status: 429 },
            );

        await assert.rejects(
            prepareVoiceMessage({
                userId: 42,
                voiceId: "greeting",
                title: "Приветствие",
                fileId: "telegram-file-id",
            }),
            (error: unknown) =>
                error instanceof TelegramError &&
                error.operation === "savePreparedInlineMessage" &&
                error.upstreamStatus === 429 &&
                error.retryable,
        );
    });
});

describe("sendSubmissionToModeration", () => {
    for (const attachmentType of ["document", "audio"] as const) {
        it(`accepts the uploaded MP3 as ${attachmentType}`, async () => {
            globalThis.fetch = async (input, init) => {
                assert.equal(
                    String(input),
                    "https://api.telegram.org/bot123456:test-token/sendDocument",
                );
                assert.equal(init?.method, "POST");
                assert.ok(init?.body instanceof FormData);
                assert.equal(init.body.get("chat_id"), "-1001234567890");
                const document = init.body.get("document");
                assert.ok(document instanceof File);
                assert.equal(document.name, "submission-id.mp3");
                return Response.json({
                    ok: true,
                    result: {
                        message_id: 123,
                        chat: { id: -1001234567890 },
                        [attachmentType]: {
                            file_id: "telegram-file-id",
                            file_unique_id: "telegram-unique-id",
                        },
                    },
                });
            };

            assert.deepEqual(
                await sendSubmissionToModeration({
                    id: "submission-id",
                    title: "Приветствие",
                    userId: 42,
                    file: new File(["ID3"], "greeting.mp3", {
                        type: "audio/mpeg",
                    }),
                }),
                {
                    sourceChatId: -1001234567890,
                    sourceMessageId: 123,
                    sourceFileId: "telegram-file-id",
                    sourceFileUniqueId: "telegram-unique-id",
                },
            );
        });
    }
});
