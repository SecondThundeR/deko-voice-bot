import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getWebhookRetryDelayMs, isTransientWebhookError } from "./retry.ts";

describe("webhook retry policy", () => {
    it("unwraps grammY BotError and retries network failures", () => {
        assert.equal(
            isTransientWebhookError({
                name: "BotError",
                error: {
                    name: "HttpError",
                    error: { code: "ECONNRESET" },
                },
            }),
            true,
        );
    });

    it("retries transient PostgreSQL and Telegram errors", () => {
        assert.equal(isTransientWebhookError({ code: "40001" }), true);
        assert.equal(isTransientWebhookError({ error_code: 429 }), true);
        assert.equal(isTransientWebhookError({ error_code: 503 }), true);
        assert.equal(isTransientWebhookError({ error_code: 400 }), false);
        assert.equal(
            isTransientWebhookError(new Error("invalid input")),
            false,
        );
    });

    it("uses exponential delay and honors Telegram retry_after", () => {
        assert.equal(getWebhookRetryDelayMs({}, 1), 1_000);
        assert.equal(getWebhookRetryDelayMs({}, 2), 2_000);
        assert.equal(
            getWebhookRetryDelayMs(
                {
                    name: "BotError",
                    error: {
                        error_code: 429,
                        parameters: { retry_after: 12 },
                    },
                },
                1,
            ),
            12_000,
        );
    });
});
