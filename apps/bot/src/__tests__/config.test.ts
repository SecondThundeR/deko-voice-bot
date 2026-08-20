import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.BOT_MODE = "polling";
process.env.BOT_TOKEN = "123456:test-token";
process.env.NODE_ENV = "development";
process.env.API_TOKEN = "test-api-token-123456789";
process.env.API_URL = "http://localhost:3003";

const { createConfig, createConfigFromEnvironment } = await import(
    "../config.ts"
);

const baseConfig = {
    botMode: "polling" as const,
    botToken: "123456:test-token",
    nodeEnv: "development" as const,
    apiToken: "test-api-token-123456789",
    apiUrl: "http://localhost:3003",
};

describe("createConfig", () => {
    it("does not expose rejected environment values", () => {
        const secret = "TEST_SECRET_TOKEN_VALUE";

        assert.throws(
            () =>
                createConfigFromEnvironment({
                    BOT_MODE: "polling",
                    BOT_TOKEN: secret,
                    NODE_ENV: "development",
                    API_TOKEN: "test-api-token-123456789",
                    API_URL: "http://localhost:3003",
                }),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.equal(
                    error.message,
                    "Invalid application configuration: BOT_TOKEN",
                );
                assert.equal(error.cause, undefined);
                assert.doesNotMatch(String(error), new RegExp(secret));
                return true;
            },
        );
    });

    it("reports malformed JSON by environment variable name", () => {
        assert.throws(
            () =>
                createConfigFromEnvironment({
                    ADMIN_IDS: "[",
                    BOT_MODE: "polling",
                    BOT_TOKEN: "123456:test-token",
                    NODE_ENV: "development",
                    API_TOKEN: "test-api-token-123456789",
                    API_URL: "http://localhost:3003",
                }),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.equal(
                    error.message,
                    "Invalid application configuration: ADMIN_IDS",
                );
                assert.doesNotMatch(String(error), /Received|Unexpected|\[/);
                return true;
            },
        );
    });

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

    it("uses human-readable logs in development and JSON in production", () => {
        assert.equal(createConfig(baseConfig).logFormat, "pretty");
        assert.equal(
            createConfig({
                ...baseConfig,
                nodeEnv: "production",
            }).logFormat,
            "json",
        );
        assert.equal(
            createConfig({
                ...baseConfig,
                logFormat: "pretty",
                nodeEnv: "production",
            }).logFormat,
            "pretty",
        );
    });
});
