import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import type { Bot } from "#root/bot/index.js";
import type { Logger } from "#root/logger.js";

process.env.DATABASE_URL = "postgres://test:test@localhost/test";

const { startWebhookWorkers } = await import("./inbox.ts");
type WebhookInbox = Parameters<typeof startWebhookWorkers>[0];

describe("webhook workers", () => {
    it("keep polling after transient inbox claim failures", async () => {
        let claims = 0;
        let recoveries = 0;
        const warnings: unknown[] = [];
        const inbox = {
            claim: async () => {
                claims += 1;
                if (claims <= 4) {
                    throw new Error("temporary database outage");
                }
                return null;
            },
            cleanup: async () => {},
            recoverStaleClaims: async () => {
                recoveries += 1;
            },
        } as unknown as WebhookInbox;
        const bot = {} as Bot;
        const logger = {
            error: () => {},
            warn: (data: unknown) => warnings.push(data),
        } as unknown as Logger;

        const stop = startWebhookWorkers(inbox, bot, logger);
        await delay(250);
        await stop();

        assert.ok(claims >= 8);
        assert.equal(warnings.length, 4);
        assert.equal(recoveries, 1);
    });
});
