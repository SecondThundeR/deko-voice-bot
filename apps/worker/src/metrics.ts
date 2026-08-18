import { MetricsRegistry } from "@deko-voice-bot/metrics";

function jobType(value: unknown) {
    return value === "outbox.noop.v1" ? "outbox.noop.v1" : "unknown";
}

export function createWorkerMetrics() {
    const registry = new MetricsRegistry();
    const outcomes = registry.counter(
        "deko_worker_jobs_total",
        "Worker job processing outcomes.",
        ["job_type", "outcome"],
    );
    const retries = registry.counter(
        "deko_worker_job_retries_total",
        "Worker jobs scheduled for retry.",
        ["job_type"],
    );
    const duration = registry.histogram(
        "deko_worker_job_processing_duration_seconds",
        "Worker job processing duration in seconds.",
        ["job_type", "outcome"],
    );

    return {
        render: () => registry.render(),
        record(input: {
            jobType: unknown;
            outcome: "completed" | "failed" | "retry";
            durationMs: number;
        }) {
            const labels = {
                job_type: jobType(input.jobType),
                outcome: input.outcome,
            };
            outcomes.inc(labels);
            if (input.outcome === "retry")
                retries.inc({ job_type: labels.job_type });
            duration.observe(labels, Math.max(0, input.durationMs) / 1_000);
        },
    };
}

export type WorkerMetrics = ReturnType<typeof createWorkerMetrics>;
