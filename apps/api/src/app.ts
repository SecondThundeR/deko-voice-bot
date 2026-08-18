import { DatabaseMaintenanceError } from "@deko-voice-bot/database/traffic.js";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { telegramAuth } from "./auth.ts";
import { HttpError } from "./errors.ts";
import { logger } from "./logger.ts";
import { routes } from "./routes.ts";
import { TelegramError } from "./telegram.ts";
import type { ApiEnv } from "./types.ts";

export function createApp() {
    const app = new Hono<ApiEnv>();

    app.use(requestId());
    app.get("/health", (c) => c.json({ status: true, version: "3.10.0" }));
    app.use("/api/v1/*", telegramAuth);
    app.route("/api/v1", routes);

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
        if (error instanceof DatabaseMaintenanceError) {
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
            logger.warn(
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
        if (error instanceof HttpError) {
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
        }
        const unexpected =
            error instanceof Error ? error : new Error(String(error));
        logger.error(
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
