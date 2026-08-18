import { timingSafeEqual } from "node:crypto";
import { ApplicationError } from "@deko-voice-bot/application";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import type { ApiDependencies } from "./dependencies/types.ts";
import { HttpError, TelegramError } from "./http/errors.ts";
import { cors } from "./middleware/cors.ts";
import { requestLogging } from "./middleware/logging.ts";
import { ipRateLimit, userRateLimit } from "./middleware/rate-limit.ts";
import { secureHeaders } from "./middleware/security.ts";
import { InMemoryRateLimiter } from "./rate-limit.ts";
import { createRoutes } from "./routes/index.ts";
import type { ApiEnv } from "./types.ts";

function hasValidMetricsToken(
    requestToken: string | undefined,
    configuredToken: string,
) {
    if (!requestToken?.startsWith("Bearer ")) return false;
    const token = Buffer.from(requestToken.slice("Bearer ".length));
    const expected = Buffer.from(configuredToken);
    return token.length === expected.length && timingSafeEqual(token, expected);
}

export function createApp(deps: ApiDependencies) {
    // Defaults keep isolated route tests deterministic; production supplies explicit runtime dependencies.
    deps.rateLimiter ??= new InMemoryRateLimiter();
    deps.readiness ??= { isReady: async () => true };
    const app = new Hono<ApiEnv>();
    app.use(requestId());
    app.use(secureHeaders);
    app.use(cors(deps.corsOrigins ?? []));
    app.use(requestLogging(deps));
    if (deps.ipRateLimitEnabled ?? true) app.use(ipRateLimit(deps));
    app.get("/health", (c) => c.json({ status: true, version: "3.10.0" }));
    app.get("/ready", async (c) => {
        try {
            if (await deps.readiness.isReady()) return c.json({ status: true });
        } catch {
            // A dependency exception is a failed readiness check, not an API error.
        }
        deps.metrics?.readinessFailure();
        return c.json({ status: false }, 503);
    });
    const metrics = deps.metrics;
    const metricsToken = deps.metricsToken;
    if (metrics && metricsToken && metricsToken.length >= 32) {
        app.get("/metrics", (c) => {
            if (
                !hasValidMetricsToken(
                    c.req.header("authorization"),
                    metricsToken,
                )
            )
                return c.body(null, 401);
            c.header(
                "content-type",
                "text/plain; version=0.0.4; charset=utf-8",
            );
            return c.body(metrics.render());
        });
    }
    app.use("/api/v1/*", deps.telegramAuth);
    app.use("/api/v1/*", userRateLimit(deps));
    app.route("/api/v1", createRoutes(deps));
    app.notFound((c) =>
        c.json(
            {
                error: {
                    code: "NOT_FOUND",
                    message: "Маршрут не найден",
                    requestId: c.var.requestId,
                },
            },
            404,
        ),
    );
    app.onError((error, c) => {
        if (
            error instanceof Error &&
            error.name === "DatabaseMaintenanceError"
        ) {
            c.header("retry-after", "30");
            return c.json(
                {
                    error: {
                        code: "MAINTENANCE",
                        message: "Выполняются технические работы",
                        requestId: c.var.requestId,
                    },
                },
                503,
            );
        }
        if (error instanceof TelegramError) {
            deps.metrics?.telegramFailure({
                operation: error.operation,
                status: error.upstreamStatus,
                retryable: error.retryable,
            });
            deps.logger.warn(
                {
                    requestId: c.var.requestId,
                    operation: error.operation,
                    status: error.upstreamStatus,
                    retryable: error.retryable,
                },
                "Telegram request failed",
            );
            return c.json(
                {
                    error: {
                        code: "TELEGRAM_UNAVAILABLE",
                        message: "Сервис Telegram временно недоступен",
                        requestId: c.var.requestId,
                    },
                },
                503,
            );
        }
        if (error instanceof HttpError || error instanceof ApplicationError)
            return c.json(
                {
                    error: {
                        code: error.code,
                        message: error.message,
                        requestId: c.var.requestId,
                    },
                },
                error.status,
            );
        const unexpected =
            error instanceof Error ? error : new Error(String(error));
        deps.logger.error(
            {
                errorType: unexpected.constructor.name,
                requestId: c.var.requestId,
                stack: unexpected.stack,
            },
            "Unexpected API error",
        );
        return c.json(
            {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Что-то пошло не так",
                    requestId: c.var.requestId,
                },
            },
            500,
        );
    });
    return app;
}

export type App = ReturnType<typeof createApp>;
