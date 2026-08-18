import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMiddleware } from "hono/factory";
import { createApp } from "./app.ts";
import type { ApiDependencies } from "./dependencies.ts";
import { HttpError, TelegramError } from "./errors.ts";
import { InMemoryRateLimiter } from "./rate-limit.ts";
import type { ApiEnv } from "./types.ts";

type ErrorResponse = { error: { code: string; requestId?: string } };

function createTestApp() {
    const telegramAuth = createMiddleware<ApiEnv>(async (c, next) => {
        if (c.req.header("authorization") !== "test")
            throw new HttpError(
                401,
                "UNAUTHORIZED",
                "Test authorization failed",
            );
        c.set("user", { id: 7, first_name: "Test", username: "tester" });
        c.set("isAdmin", c.req.header("x-test-admin") === "true");
        await next();
    });
    const deps = {
        telegramAuth,
        database: <T>(operation: () => Promise<T>) => operation(),
        logger: { warn: () => {}, error: () => {} },
        getUserIsIgnoredStatus: async () => false,
        getVoicesPage: async () => {
            throw new TelegramError("getFile", 503, true, "down");
        },
    } as unknown as ApiDependencies;
    return createApp(deps);
}

describe("API route integration", () => {
    it("composes routes behind the auth middleware", async () => {
        const response = await createTestApp().request("/api/v1/me");
        assert.equal(response.status, 401);
        assert.equal(
            ((await response.json()) as ErrorResponse).error.code,
            "UNAUTHORIZED",
        );
    });

    it("enforces the admin gate", async () => {
        const response = await createTestApp().request(
            "/api/v1/admin/submissions",
            {
                headers: { authorization: "test" },
            },
        );
        assert.equal(response.status, 403);
        assert.deepEqual(
            ((await response.json()) as ErrorResponse).error.code,
            "ADMIN_REQUIRED",
        );
    });

    it("returns public validation errors with a request ID", async () => {
        const response = await createTestApp().request(
            "/api/v1/voices?limit=51",
            {
                headers: { authorization: "test" },
            },
        );
        const body = (await response.json()) as ErrorResponse;
        assert.equal(response.status, 400);
        assert.equal(body.error.code, "INVALID_PAGINATION");
        assert.equal(typeof body.error.requestId, "string");
    });

    it("maps Telegram failures to a 503 response", async () => {
        const response = await createTestApp().request("/api/v1/voices", {
            headers: { authorization: "test" },
        });
        assert.equal(response.status, 503);
        assert.deepEqual(
            ((await response.json()) as ErrorResponse).error.code,
            "TELEGRAM_UNAVAILABLE",
        );
    });

    it("returns a successful authenticated response", async () => {
        const response = await createTestApp().request("/api/v1/me", {
            headers: { authorization: "test", "x-test-admin": "true" },
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            id: 7,
            firstName: "Test",
            username: "tester",
            isAdmin: true,
            hasConsent: true,
        });
    });
});

function createPolicyApp(ready = true) {
    const logs: Array<Record<string, unknown>> = [];
    const deps = {
        telegramAuth: createMiddleware<ApiEnv>(async (c, next) => {
            c.set("user", { id: 9, first_name: "Rate" });
            c.set("isAdmin", false);
            await next();
        }),
        database: <T>(operation: () => Promise<T>) => operation(),
        readiness: { isReady: async () => ready },
        corsOrigins: ["https://mini.example"],
        rateLimiter: new InMemoryRateLimiter(),
        logger: {
            info: (data: Record<string, unknown>) => logs.push(data),
            warn: () => {},
            error: () => {},
        },
        getUserData: async () => null,
    } as unknown as ApiDependencies;
    return { app: createApp(deps), logs };
}
describe("operational HTTP policy", () => {
    it("keeps liveness public and exposes dependency readiness", async () => {
        assert.equal(
            (await createPolicyApp().app.request("/health")).status,
            200,
        );
        assert.equal(
            (await createPolicyApp(false).app.request("/ready")).status,
            503,
        );
    });
    it("applies secure headers and strict CORS including preflight", async () => {
        const { app } = createPolicyApp();
        const allowed = await app.request("/api/v1/me", {
            method: "OPTIONS",
            headers: { origin: "https://mini.example" },
        });
        assert.equal(allowed.status, 204);
        assert.equal(
            allowed.headers.get("access-control-allow-origin"),
            "https://mini.example",
        );
        assert.equal(allowed.headers.get("x-frame-options"), "DENY");
        assert.equal(
            (
                await app.request("/health", {
                    headers: { origin: "https://evil.example" },
                })
            ).status,
            403,
        );
    });
    it("limits requests and logs no raw query values", async () => {
        const { app, logs } = createPolicyApp();
        for (let i = 0; i < 120; i++)
            await app.request("/api/v1/me?token=secret", {
                headers: { "x-real-ip": "127.0.0.1" },
            });
        const response = await app.request("/api/v1/me?token=secret", {
            headers: { "x-real-ip": "127.0.0.1" },
        });
        assert.equal(response.status, 429);
        assert.ok(response.headers.get("retry-after"));
        assert.equal(
            ((await response.json()) as ErrorResponse).error.code,
            "RATE_LIMITED",
        );
        assert.equal(logs[0].method, "GET");
        assert.equal(typeof logs[0].requestId, "string");
        assert.equal(
            logs.some((entry) => JSON.stringify(entry).includes("secret")),
            false,
        );
    });
});
