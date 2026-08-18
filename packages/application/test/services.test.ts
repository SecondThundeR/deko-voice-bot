import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    ApplicationError,
    CatalogService,
    ModerationService,
    type Submission,
    SubmissionService,
} from "../src/services.ts";

const submission: Submission = {
    id: "submission-1",
    submitterUserId: 7,
    title: "Hello",
    sourceFileId: "source-file",
    sourceChatId: 10,
    sourceMessageId: 11,
};

describe("SubmissionService", () => {
    it("creates, sends, and marks a submission pending", async () => {
        const calls: string[] = [];
        const service = new SubmissionService({
            createSubmission: async () => ({ ...submission }),
            sendToModeration: async () => {
                calls.push("send");
                return {
                    sourceChatId: 1,
                    sourceMessageId: 2,
                    sourceFileId: "f",
                    sourceFileUniqueId: "u",
                };
            },
            markPending: async () => {
                calls.push("pending");
                return { ...submission };
            },
            markFailed: async () => {
                calls.push("failed");
            },
            listForUser: async () => [],
        });
        const result = await service.submit({
            id: submission.id,
            userId: 7,
            title: "Hello",
            file: { arrayBuffer: async () => new ArrayBuffer(0) },
        });
        assert.equal(result.id, submission.id);
        assert.deepEqual(calls, ["send", "pending"]);
    });
});

describe("CatalogService", () => {
    it("deletes the uploaded Telegram voice when persistence conflicts", async () => {
        const deleted: Array<[number, number]> = [];
        const service = new CatalogService({
            getVoiceById: async () => null,
            addVoice: async () => false,
            convertAndSend: async () => ({
                chatId: 1,
                messageId: 2,
                fileId: "file",
                fileUniqueId: "unique",
            }),
            deleteMessage: async (chatId, messageId) =>
                deleted.push([chatId, messageId]),
            warn: () => {},
        });
        await assert.rejects(
            service.addAdminVoice({
                voiceId: "voice",
                title: "Voice",
                bytes: new Uint8Array(),
                trim: { startMs: 0, endMs: null },
                addedBy: "@admin",
            }),
            (error: unknown) =>
                error instanceof ApplicationError &&
                error.code === "VOICE_CONFLICT",
        );
        assert.deepEqual(deleted, [[1, 2]]);
    });
});

describe("ModerationService", () => {
    it("compensates the sent voice and releases the claim on approval conflict", async () => {
        const deleted: Array<[number, number]> = [];
        const released: string[] = [];
        const service = new ModerationService({
            claim: async () => ({ ...submission }),
            approve: async () => null,
            release: async (id) => {
                released.push(id);
            },
            getFile: async () => new Response(new Uint8Array([1])),
            convertAndSend: async () => ({
                chatId: 3,
                messageId: 4,
                fileId: "voice-file",
                fileUniqueId: "voice-unique",
            }),
            deleteMessage: async (chatId, messageId) =>
                deleted.push([chatId, messageId]),
            sendMessage: async () => {},
            warn: () => {},
        });
        await assert.rejects(
            service.approve({
                id: submission.id,
                moderatorUserId: 1,
                title: "Approved",
                voiceId: "voice",
                trim: { startMs: 0, endMs: null },
            }),
            (error: unknown) =>
                error instanceof ApplicationError &&
                error.code === "VOICE_CONFLICT",
        );
        assert.deepEqual(deleted, [[3, 4]]);
        assert.deepEqual(released, [submission.id]);
    });
});
