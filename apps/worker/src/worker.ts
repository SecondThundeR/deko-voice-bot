import {
    OUTBOX_NOOP_JOB_TYPE,
    validateOutboxJob,
} from "@deko-voice-bot/database/queries/outbox-helpers.js";

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
    complete: (input: { id: string; owner: string }) => Promise<unknown>;
    fail: (input: {
        id: string;
        owner: string;
        error: string;
    }) => Promise<unknown>;
    retry: (input: {
        id: string;
        owner: string;
        error: string;
    }) => Promise<unknown>;
    logger: WorkerLogger;
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
            await ports.fail({
                id: job.id,
                owner: options.owner,
                error: message,
            });
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
            await ports.retry({
                id: job.id,
                owner: options.owner,
                error: message,
            });
            return true;
        }

        ports.logger.info(
            { jobId: job.id, jobType: job.job_type },
            "Completed noop outbox job",
        );
        await ports.complete({ id: job.id, owner: options.owner });
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
