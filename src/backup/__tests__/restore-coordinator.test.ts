import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { Api, Bot } from "grammy";
import { pino } from "pino";
import type { Context } from "#root/bot/context.js";

process.env.DATABASE_URL = "postgres://test:test@localhost/restore_test";

const { DatabaseRestoreCoordinator } = await import(
    "../restore-coordinator.ts"
);
const { createBackupTempPaths } = await import("../paths.ts");

async function createScenario(failingStage?: string) {
    const events: string[] = [];
    async function stage(name: string) {
        events.push(name);
        if (failingStage === name) throw new Error(`Failed at ${name}`);
    }

    const coordinator = new DatabaseRestoreCoordinator({
        createEncryptedDatabaseBackup: async () => {
            await stage("backup");
            return "test-hash";
        },
        withBackupAdvisoryLock: async (_url, operation) => operation(),
        withDatabaseDisconnected: async (operation) => {
            const result = await operation();
            await stage("reconnect");
            return result;
        },
        restoreDatabaseDump: async () => stage("restore"),
        normalizeRestoredDatabase: async () => stage("normalize"),
        validateRestoredDatabase: async () => stage("validate"),
    });
    const api = new Api("123456:test-token");
    mock.method(api, "sendDocument", async () => stage("send-backup"));
    mock.method(api, "sendMessage", async (_chatId: number, text: string) => {
        if (text === "completed") await stage("notify-completed");
    });
    const paths = await createBackupTempPaths("restore-test");
    const job = {
        api,
        chatId: 1,
        encryptionKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        logger: pino({ level: "silent" }),
        messages: {
            completed: "completed",
            emergencyBackup: () => "backup",
            error: "error",
            recoveryRequired: "recovery-required",
            preparing: "preparing",
        },
        session: {
            stage: "awaiting-confirmation" as const,
            operationId: "test-operation",
            userId: 1,
            chatId: 1,
            expiresAt: Date.now() + 60_000,
            paths,
            sha256: "test-hash",
            size: 1,
        },
    };
    assert.equal(coordinator.start(job), true);
    await coordinator.waitForIdle();

    const bot = new Bot<Context>("123456:test-token", {
        botInfo: {
            id: 123456,
            is_bot: true,
            first_name: "Test",
            username: "test_bot",
            can_join_groups: false,
            can_read_all_group_messages: false,
            supports_inline_queries: true,
            can_connect_to_business: false,
            has_main_web_app: false,
            has_topics_enabled: false,
            allows_users_to_create_topics: false,
            can_manage_bots: false,
            supports_join_request_queries: false,
        },
    });
    let admitted = false;
    bot.use((ctx, next) => {
        ctx.t = () => "maintenance";
        mock.method(ctx, "reply", async () => {});
        return next();
    });
    bot.use(coordinator.databaseTrafficGatekeep());
    bot.use(() => {
        admitted = true;
    });
    await bot.handleUpdate({ update_id: 1 });
    return { admitted, events, coordinator, job };
}

describe("restore traffic safety", () => {
    for (const stage of ["restore", "normalize", "reconnect", "validate"]) {
        it(`keeps traffic blocked after ${stage} fails`, async () => {
            const scenario = await createScenario(stage);
            assert.equal(scenario.admitted, false);
            assert.ok(scenario.events.includes(stage));
            assert.equal(scenario.coordinator.start(scenario.job), false);
        });
    }

    for (const stage of ["backup", "send-backup"]) {
        it(`resumes traffic when ${stage} fails before database work`, async () => {
            const { admitted, events } = await createScenario(stage);
            assert.equal(admitted, true);
            assert.equal(events.includes("restore"), false);
        });
    }

    it("resumes traffic after a validated restore", async () => {
        const { admitted, events } = await createScenario();
        assert.equal(admitted, true);
        assert.deepEqual(events, [
            "backup",
            "send-backup",
            "restore",
            "normalize",
            "reconnect",
            "validate",
            "notify-completed",
        ]);
    });

    it("resumes traffic if only the completion notification fails", async () => {
        const { admitted, events } = await createScenario("notify-completed");
        assert.equal(admitted, true);
        assert.ok(events.includes("validate"));
    });
});
