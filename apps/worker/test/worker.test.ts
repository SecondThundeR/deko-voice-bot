import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OUTBOX_NOOP_JOB_TYPE } from "@deko-voice-bot/database/queries/outbox-helpers.js";
import { createWorkerMetrics } from "../src/metrics.ts";
import { createWorker, type WorkerPorts } from "../src/worker.ts";

const owner = "test-worker";

function createPorts(
    jobs: Array<{ id: string; job_type: unknown; payload: unknown }>,
    overrides: Partial<WorkerPorts> = {},
) {
    const calls = {
        claim: 0,
        complete: [] as Array<{ id: string; owner: string }>,
        fail: [] as Array<{ id: string; owner: string; error: string }>,
        retry: [] as Array<{ id: string; owner: string; error: string }>,
    };
    const ports: WorkerPorts = {
        async claim() {
            calls.claim += 1;
            const job = jobs.shift();
            return job ? [job] : [];
        },
        async complete(input) {
            calls.complete.push(input);
        },
        async fail(input) {
            calls.fail.push(input);
        },
        async retry(input) {
            calls.retry.push(input);
        },
        logger: {
            info() {},
            warn() {},
            error() {},
        },
        ...overrides,
    };
    return { calls, ports };
}

function createTestWorker(ports: WorkerPorts) {
    return createWorker(ports, {
        owner,
        leaseMs: 60_000,
        pollIntervalMs: 60_000,
    });
}

describe("outbox worker", () => {
    it("completes the supported noop job", async () => {
        const { calls, ports } = createPorts([
            { id: "noop", job_type: OUTBOX_NOOP_JOB_TYPE, payload: {} },
        ]);

        const claimed = await createTestWorker(ports).processOne();

        assert.equal(claimed, true);
        assert.deepEqual(calls.complete, [{ id: "noop", owner }]);
        assert.deepEqual(calls.fail, []);
        assert.deepEqual(calls.retry, []);
    });

    it("terminal-fails unknown and malformed jobs", async () => {
        const { calls, ports } = createPorts([
            { id: "unknown", job_type: "audio.convert.v1", payload: {} },
            {
                id: "malformed",
                job_type: OUTBOX_NOOP_JOB_TYPE,
                payload: { x: 1 },
            },
        ]);
        const worker = createTestWorker(ports);

        await worker.processOne();
        await worker.processOne();

        assert.deepEqual(
            calls.fail.map(({ id }) => id),
            ["unknown", "malformed"],
        );
        assert.deepEqual(calls.complete, []);
        assert.deepEqual(calls.retry, []);
    });

    it("retries unexpected noop handler failures", async () => {
        const { calls, ports } = createPorts(
            [{ id: "retry", job_type: OUTBOX_NOOP_JOB_TYPE, payload: {} }],
            {
                async handleNoop() {
                    throw new Error("temporary failure");
                },
            },
        );

        await createTestWorker(ports).processOne();

        assert.deepEqual(calls.retry, [
            { id: "retry", owner, error: "temporary failure" },
        ]);
        assert.deepEqual(calls.complete, []);
    });

    it("records bounded outcome and retry metrics", async () => {
        const metrics = createWorkerMetrics();
        const { ports } = createPorts(
            [{ id: "retry", job_type: OUTBOX_NOOP_JOB_TYPE, payload: {} }],
            {
                metrics,
                async handleNoop() {
                    throw new Error("contains secret user title");
                },
            },
        );

        await createTestWorker(ports).processOne();

        const rendered = metrics.render();
        assert.match(
            rendered,
            /deko_worker_jobs_total\{job_type="outbox.noop.v1",outcome="retry"\} 1/,
        );
        assert.match(
            rendered,
            /deko_worker_job_retries_total\{job_type="outbox.noop.v1"\} 1/,
        );
        assert.equal(rendered.includes("secret"), false);
    });

    it("does nothing when no job is claimed", async () => {
        const { calls, ports } = createPorts([]);

        assert.equal(await createTestWorker(ports).processOne(), false);
        assert.equal(calls.claim, 1);
        assert.deepEqual(calls.complete, []);
        assert.deepEqual(calls.fail, []);
        assert.deepEqual(calls.retry, []);
    });

    it("stops claiming and drains an in-flight job on shutdown", async () => {
        let releaseHandler: (() => void) | undefined;
        let enteredHandler: (() => void) | undefined;
        const entered = new Promise<void>((resolve) => {
            enteredHandler = resolve;
        });
        const { calls, ports } = createPorts(
            [{ id: "drain", job_type: OUTBOX_NOOP_JOB_TYPE, payload: {} }],
            {
                async handleNoop() {
                    enteredHandler?.();
                    await new Promise<void>((resolve) => {
                        releaseHandler = resolve;
                    });
                },
            },
        );
        const worker = createTestWorker(ports);

        const running = worker.start();
        await entered;
        let stopped = false;
        const stopping = worker.stop().then(() => {
            stopped = true;
        });
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(stopped, false);
        releaseHandler?.();
        await stopping;
        await running;

        assert.deepEqual(calls.complete, [{ id: "drain", owner }]);
        assert.equal(calls.claim, 1);
        assert.equal(await worker.processOne(), false);
        assert.equal(calls.claim, 1);
    });
});
