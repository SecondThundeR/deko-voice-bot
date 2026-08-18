import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    getOutboxBackoffMs,
    OUTBOX_BACKOFF_INITIAL_MS,
    OUTBOX_BACKOFF_MAX_MS,
    OUTBOX_NOOP_JOB_TYPE,
    validateOutboxJob,
} from "./outbox-helpers.ts";

describe("validateOutboxJob", () => {
    it("accepts only the initial noop job with an empty payload", () => {
        assert.deepEqual(
            validateOutboxJob({
                jobType: OUTBOX_NOOP_JOB_TYPE,
                payload: {},
            }),
            { jobType: OUTBOX_NOOP_JOB_TYPE, payload: {} },
        );
    });

    it("rejects unknown job types and non-empty payloads", () => {
        assert.throws(() =>
            validateOutboxJob({ jobType: "outbox.email.v1", payload: {} }),
        );
        assert.throws(() =>
            validateOutboxJob({ jobType: OUTBOX_NOOP_JOB_TYPE, payload: null }),
        );
        assert.throws(() =>
            validateOutboxJob({ jobType: OUTBOX_NOOP_JOB_TYPE, payload: [] }),
        );
        assert.throws(() =>
            validateOutboxJob({
                jobType: OUTBOX_NOOP_JOB_TYPE,
                payload: { unexpected: true },
            }),
        );
    });
});

describe("getOutboxBackoffMs", () => {
    it("increases exponentially from the first claimed attempt", () => {
        assert.equal(getOutboxBackoffMs(1), OUTBOX_BACKOFF_INITIAL_MS);
        assert.equal(getOutboxBackoffMs(2), OUTBOX_BACKOFF_INITIAL_MS * 2);
        assert.equal(getOutboxBackoffMs(3), OUTBOX_BACKOFF_INITIAL_MS * 4);
    });

    it("caps the delay and rejects invalid attempt counts", () => {
        assert.equal(getOutboxBackoffMs(100), OUTBOX_BACKOFF_MAX_MS);
        assert.throws(() => getOutboxBackoffMs(0), RangeError);
        assert.throws(() => getOutboxBackoffMs(1.5), RangeError);
        assert.throws(
            () => getOutboxBackoffMs(Number.MAX_SAFE_INTEGER + 1),
            RangeError,
        );
    });
});
