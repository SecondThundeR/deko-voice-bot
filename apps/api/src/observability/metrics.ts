import { MetricsRegistry } from "@deko-voice-bot/metrics";

const ROUTES = new Set([
    "/health",
    "/ready",
    "/metrics",
    "/api/v1/me",
    "/api/v1/me/profile",
    "/api/v1/me/consent",
    "/api/v1/stats",
    "/api/v1/leaderboards",
    "/api/v1/voices",
    "/api/v1/voices/:voiceId/audio",
    "/api/v1/voices/:voiceId/share",
    "/api/v1/voices/:voiceId/favorite",
    "/api/v1/submissions",
    "/api/v1/admin/uploads",
    "/api/v1/admin/submissions",
    "/api/v1/admin/submissions/:id/audio",
    "/api/v1/admin/submissions/:id",
    "/api/v1/admin/submissions/:id/reject",
    "/api/v1/admin/submissions/:id/approve",
]);

function safeRoute(route: string | undefined) {
    return route && ROUTES.has(route) ? route : "unmatched";
}

function safeMethod(method: string) {
    return ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST"].includes(
        method,
    )
        ? method
        : "OTHER";
}

function statusClass(status: number | undefined) {
    return status === undefined ? "network" : `${Math.floor(status / 100)}xx`;
}

function telegramOperation(operation: string) {
    return [
        "deleteMessage",
        "downloadFile",
        "editMessageCaption",
        "getFile",
        "savePreparedInlineMessage",
        "sendDocument",
        "sendMessage",
        "sendVoice",
    ].includes(operation)
        ? operation
        : "other";
}

export function createApiMetrics() {
    const registry = new MetricsRegistry();
    const requests = registry.counter(
        "deko_api_requests_total",
        "Completed API HTTP requests.",
        ["method", "route", "status"],
    );
    const requestDuration = registry.histogram(
        "deko_api_request_duration_seconds",
        "API HTTP request duration in seconds.",
        ["method", "route"],
    );
    const rateLimitDecisions = registry.counter(
        "deko_api_rate_limit_decisions_total",
        "API rate-limit decisions.",
        ["scope", "decision", "policy"],
    );
    const telegramFailures = registry.counter(
        "deko_api_telegram_failures_total",
        "Telegram request failures observed by the API.",
        ["operation", "status_class", "retryable"],
    );
    const readinessFailures = registry.counter(
        "deko_api_readiness_failures_total",
        "API readiness check failures.",
    );

    return {
        render: () => registry.render(),
        request(input: {
            method: string;
            route?: string;
            status: number;
            durationMs: number;
        }) {
            const labels = {
                method: safeMethod(input.method),
                route: safeRoute(input.route),
            };
            requests.inc({ ...labels, status: String(input.status) });
            requestDuration.observe(
                labels,
                Math.max(0, input.durationMs) / 1_000,
            );
        },
        rateLimit(input: {
            scope: "ip" | "user";
            allowed: boolean;
            strict: boolean;
        }) {
            rateLimitDecisions.inc({
                scope: input.scope,
                decision: input.allowed ? "allowed" : "rejected",
                policy: input.strict ? "strict" : "default",
            });
        },
        telegramFailure(input: {
            operation: string;
            status?: number;
            retryable: boolean;
        }) {
            telegramFailures.inc({
                operation: telegramOperation(input.operation),
                status_class: statusClass(input.status),
                retryable: String(input.retryable),
            });
        },
        readinessFailure() {
            readinessFailures.inc();
        },
    };
}

export type ApiMetrics = ReturnType<typeof createApiMetrics>;
