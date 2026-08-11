import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.BOT_MODE = "polling";
process.env.BOT_TOKEN = "123456:test-token";
process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32).toString("base64");
process.env.NODE_ENV = "development";
delete process.env.REDIS_URL;

const { createConfig } = await import("./config.ts");

const baseConfig = {
    backupEncryptionKey: Buffer.alloc(32).toString("base64"),
    botMode: "polling" as const,
    botToken: "123456:test-token",
    nodeEnv: "development" as const,
};

describe("createConfig", () => {
    it("accepts positive safe Telegram administrator identifiers", () => {
        const config = createConfig({
            ...baseConfig,
            adminIds: `[1, ${Number.MAX_SAFE_INTEGER}]`,
        });

        assert.deepEqual(config.adminIds, [1, Number.MAX_SAFE_INTEGER]);
    });

    it("rejects invalid Telegram administrator identifiers", () => {
        for (const adminIds of ["[0]", "[-1]", "[1.5]"]) {
            assert.throws(() => createConfig({ ...baseConfig, adminIds }));
        }
    });

    it("accepts only valid TCP ports in webhook mode", () => {
        const webhookConfig = {
            ...baseConfig,
            botMode: "webhook" as const,
            botWebhook: "https://example.com/webhook",
            botWebhookSecret: "test-secret-token",
        };

        const config = createConfig({
            ...webhookConfig,
            serverPort: "65535",
        });
        assert.equal(config.botMode, "webhook");
        if (config.botMode !== "webhook") {
            assert.fail("Expected webhook config");
        }
        assert.equal(config.serverPort, 65_535);
        for (const serverPort of ["0", "1.5", "65536", "not-a-port"]) {
            assert.throws(() => createConfig({ ...webhookConfig, serverPort }));
        }
    });

    it("accepts only Redis connection URLs", () => {
        assert.equal(
            createConfig({ ...baseConfig, redisUrl: "rediss://redis:6379" })
                .redisUrl,
            "rediss://redis:6379",
        );
        for (const redisUrl of ["https://redis:6379", "not-a-url"]) {
            assert.throws(() => createConfig({ ...baseConfig, redisUrl }));
        }
    });

    it("allows in-memory sessions only in development", () => {
        assert.equal(createConfig(baseConfig).redisUrl, undefined);
        assert.throws(() =>
            createConfig({
                ...baseConfig,
                nodeEnv: "production",
            }),
        );
        assert.equal(
            createConfig({
                ...baseConfig,
                nodeEnv: "production",
                redisUrl: "redis://redis:6379",
            }).redisUrl,
            "redis://redis:6379",
        );
    });
});
