import {
    OUTBOX_NOOP_JOB_TYPE,
    validateOutboxJob,
} from "@deko-voice-bot/database/queries/outbox-helpers.js";
import { createWorkerMetrics, type WorkerMetrics } from "./metrics.ts";

export type ClaimedOutboxJob = {
    id: string;
    job_type: unknown;
    payload: unknown;
};

export type WorkerLogger = {
    info: (bindings: object, message?: string) => void;
    warn: (bindings: object, message?: string) => void;
    error: (bindings: object, message?: string) => void;
};

export type WorkerPorts = {
    claim: (input: {
        owner: string;
        limit: 1;
        leaseMs: number;
    }) => Promise<ClaimedOutboxJob[]>;
    complete: (input: {
        id: string;
        owner: string;
    }) => Promise<{ id: string } | null>;
    extend: (input: {
        id: string;
        owner: string;
        leaseMs: number;
    }) => Promise<{ id: string } | null>;
    fail: (input: {
        id: string;
        owner: string;
        error: string;
    }) => Promise<{ id: string } | null>;
    retry: (input: {
        id: string;
        owner: string;
        error: string;
    }) => Promise<{ id: string } | null>;
    logger: WorkerLogger;
    metrics?: WorkerMetrics;
    handleNoop?: (job: ClaimedOutboxJob) => Promise<void>;
};

export type WorkerOptions = {
    owner: string;
    leaseMs: number;
    pollIntervalMs: number;
};

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

/** A single-concurrency outbox loop with injectable persistence and handler ports. */
export function createWorker(ports: WorkerPorts, options: WorkerOptions) {
    const metrics = ports.metrics ?? createWorkerMetrics();
    let stopping = false;
    let running: Promise<void> | undefined;
    let wakePoll: (() => void) | undefined;

    async function processOne() {
        if (stopping) return false;

        const [job] = await ports.claim({
            owner: options.owner,
            limit: 1,
            leaseMs: options.leaseMs,
        });
        if (!job) return false;

        const started = Date.now();
        const record = (outcome: "completed" | "failed" | "retry") =>
            metrics.record({
                jobType: job.job_type,
                outcome,
                durationMs: Date.now() - started,
            });

        let leaseLost = false;
        let heartbeatInFlight: Promise<void> | undefined;
        const heartbeat = setInterval(
            () => {
                if (heartbeatInFlight) return;
                heartbeatInFlight = ports
                    .extend({
                        id: job.id,
                        owner: options.owner,
                        leaseMs: options.leaseMs,
                    })
                    .then((extended) => {
                        if (extended) return;
                        leaseLost = true;
                        ports.logger.warn(
                            { jobId: job.id },
                            "Outbox lease was lost while processing job",
                        );
                    })
                    .catch((error: unknown) => {
                        leaseLost = true;
                        ports.logger.warn(
                            { jobId: job.id, error: errorMessage(error) },
                            "Outbox lease heartbeat failed",
                        );
                    })
                    .finally(() => {
                        heartbeatInFlight = undefined;
                    });
            },
            Math.max(1, Math.floor(options.leaseMs / 2)),
        );
        heartbeat.unref();

        async function stopHeartbeat() {
            clearInterval(heartbeat);
            await heartbeatInFlight;
        }

        try {
            validateOutboxJob({
                jobType: job.job_type,
                payload: job.payload,
            });
        } catch (error) {
            const message = errorMessage(error);
            ports.logger.error(
                { jobId: job.id, error: message },
                "Invalid outbox job",
            );
            await stopHeartbeat();
            const failed = await ports.fail({
                id: job.id,
                owner: options.owner,
                error: message,
            });
            if (failed) record("failed");
            else
                ports.logger.warn(
                    { jobId: job.id },
                    "Outbox lease was lost before job could be failed",
                );
            return true;
        }

        try {
            if (job.job_type !== OUTBOX_NOOP_JOB_TYPE) {
                throw new Error(
                    `Unexpected validated job type: ${job.job_type}`,
                );
            }
            await ports.handleNoop?.(job);
        } catch (error) {
            const message = errorMessage(error);
            ports.logger.warn(
                { jobId: job.id, error: message },
                "Outbox job will retry",
            );
            await stopHeartbeat();
            if (leaseLost) return true;
            const retried = await ports.retry({
                id: job.id,
                owner: options.owner,
                error: message,
            });
            if (retried) record("retry");
            else
                ports.logger.warn(
                    { jobId: job.id },
                    "Outbox lease was lost before job could be retried",
                );
            return true;
        }

        await stopHeartbeat();
        if (leaseLost) return true;
        ports.logger.info(
            { jobId: job.id, jobType: job.job_type },
            "Completed noop outbox job",
        );
        const completed = await ports.complete({
            id: job.id,
            owner: options.owner,
        });
        if (completed) record("completed");
        else
            ports.logger.warn(
                { jobId: job.id },
                "Outbox lease was lost before job could be completed",
            );
        return true;
    }

    function waitForPoll() {
        return new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                wakePoll = undefined;
                resolve();
            }, options.pollIntervalMs);
            wakePoll = () => {
                clearTimeout(timer);
                wakePoll = undefined;
                resolve();
            };
        });
    }

    async function runLoop() {
        while (!stopping) {
            const claimed = await processOne();
            if (!claimed && !stopping) await waitForPoll();
        }
    }

    return {
        processOne,
        start() {
            running ??= runLoop();
            return running;
        },
        async stop() {
            stopping = true;
            wakePoll?.();
            await running;
        },
    };
}
