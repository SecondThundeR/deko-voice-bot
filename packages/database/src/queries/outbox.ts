import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    OUTBOX_BACKOFF_INITIAL_MS,
    OUTBOX_BACKOFF_MAX_MS,
    OUTBOX_DEFAULT_LEASE_MS,
    OUTBOX_DEFAULT_MAX_ATTEMPTS,
    type OUTBOX_NOOP_JOB_TYPE,
    type OutboxJobStatus,
    validateOutboxJob,
} from "./outbox-helpers.ts";

export {
    getOutboxBackoffMs,
    OUTBOX_BACKOFF_INITIAL_MS,
    OUTBOX_BACKOFF_MAX_MS,
    OUTBOX_DEFAULT_LEASE_MS,
    OUTBOX_DEFAULT_MAX_ATTEMPTS,
    OUTBOX_NOOP_JOB_TYPE,
    type OutboxJobStatus,
    type OutboxNoopJobInput,
    validateOutboxJob,
} from "./outbox-helpers.ts";

export type OutboxJob = {
    id: string;
    job_type: typeof OUTBOX_NOOP_JOB_TYPE;
    payload: Record<string, never>;
    status: OutboxJobStatus;
    priority: number;
    attempts: number;
    max_attempts: number;
    last_error: string | null;
    available_at: Date;
    claimed_at: Date | null;
    lease_owner: string | null;
    lease_expires_at: Date | null;
    completed_at: Date | null;
    failed_at: Date | null;
    created_at: Date;
    updated_at: Date;
};

function assertOwner(owner: string) {
    if (!owner.trim()) throw new TypeError("lease owner must not be empty");
}

function assertPositiveSafeInteger(value: number, name: string) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new RangeError(`${name} must be a positive safe integer`);
    }
}

function assertNonnegativeSafeInteger(value: number, name: string) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a nonnegative safe integer`);
    }
}

function normalizeError(error: string) {
    return error.slice(0, 8_000);
}

export async function enqueueOutboxJob(input: {
    job: { jobType: unknown; payload: unknown };
    id?: string;
    priority?: number;
    availableAt?: Date;
    maxAttempts?: number;
}) {
    const job = validateOutboxJob(input.job);
    const id = input.id ?? randomUUID();
    const priority = input.priority ?? 0;
    const maxAttempts = input.maxAttempts ?? OUTBOX_DEFAULT_MAX_ATTEMPTS;
    assertNonnegativeSafeInteger(maxAttempts, "maxAttempts");
    if (maxAttempts === 0) throw new RangeError("maxAttempts must be positive");
    if (
        !Number.isSafeInteger(priority) ||
        priority < -32_768 ||
        priority > 32_767
    ) {
        throw new RangeError("priority must be a signed 16-bit integer");
    }

    const rows = await db.execute<OutboxJob>(sql`
        insert into bot_runtime.outbox
            (id, job_type, payload, priority, available_at, max_attempts)
        values (
            ${id}::uuid,
            ${job.jobType},
            ${JSON.stringify(job.payload)}::jsonb,
            ${priority}::smallint,
            ${input.availableAt ?? new Date()},
            ${maxAttempts}::integer
        )
        returning *
    `);
    return rows[0] ?? null;
}

/** Atomically claims pending jobs or jobs whose processing lease has expired. */
export async function claimOutboxJobs(input: {
    owner: string;
    limit?: number;
    leaseMs?: number;
}) {
    assertOwner(input.owner);
    const limit = input.limit ?? 1;
    const leaseMs = input.leaseMs ?? OUTBOX_DEFAULT_LEASE_MS;
    assertPositiveSafeInteger(limit, "limit");
    assertPositiveSafeInteger(leaseMs, "leaseMs");
    if (limit > 100) throw new RangeError("limit must not exceed 100");

    return db.execute<OutboxJob>(sql`
        with candidate as (
            select id
            from bot_runtime.outbox
            where
                (status = 'pending' and available_at <= now())
                or (status = 'processing' and lease_expires_at <= now())
            order by priority desc, available_at, created_at
            for update skip locked
            limit ${limit}
        )
        update bot_runtime.outbox job
        set
            status = 'processing',
            attempts = job.attempts + 1,
            claimed_at = now(),
            lease_owner = ${input.owner},
            lease_expires_at = now() + ${leaseMs} * interval '1 millisecond',
            updated_at = now()
        from candidate
        where job.id = candidate.id
        returning job.*
    `);
}

export async function completeOutboxJob(input: { id: string; owner: string }) {
    assertOwner(input.owner);
    const rows = await db.execute<OutboxJob>(sql`
        update bot_runtime.outbox
        set
            status = 'completed',
            last_error = null,
            claimed_at = null,
            lease_owner = null,
            lease_expires_at = null,
            completed_at = now(),
            updated_at = now()
        where
            id = ${input.id}::uuid
            and status = 'processing'
            and lease_owner = ${input.owner}
            and lease_expires_at > now()
        returning *
    `);
    return rows[0] ?? null;
}

/** Releases a job for bounded exponential retry, or fails it after its final attempt. */
export async function retryOutboxJob(input: {
    id: string;
    owner: string;
    error: string;
}) {
    assertOwner(input.owner);
    const rows = await db.execute<OutboxJob>(sql`
        update bot_runtime.outbox
        set
            status = case when attempts >= max_attempts then 'failed' else 'pending' end,
            last_error = ${normalizeError(input.error)},
            available_at = case
                when attempts >= max_attempts then available_at
                else now() + least(
                    ${OUTBOX_BACKOFF_MAX_MS}::double precision,
                    ${OUTBOX_BACKOFF_INITIAL_MS}::double precision * power(2::double precision, least(attempts - 1, 30))
                ) * interval '1 millisecond'
            end,
            claimed_at = null,
            lease_owner = null,
            lease_expires_at = null,
            failed_at = case when attempts >= max_attempts then now() else null end,
            updated_at = now()
        where
            id = ${input.id}::uuid
            and status = 'processing'
            and lease_owner = ${input.owner}
            and lease_expires_at > now()
        returning *
    `);
    return rows[0] ?? null;
}

export async function failOutboxJob(input: {
    id: string;
    owner: string;
    error: string;
}) {
    assertOwner(input.owner);
    const rows = await db.execute<OutboxJob>(sql`
        update bot_runtime.outbox
        set
            status = 'failed',
            last_error = ${normalizeError(input.error)},
            claimed_at = null,
            lease_owner = null,
            lease_expires_at = null,
            failed_at = now(),
            updated_at = now()
        where
            id = ${input.id}::uuid
            and status = 'processing'
            and lease_owner = ${input.owner}
            and lease_expires_at > now()
        returning *
    `);
    return rows[0] ?? null;
}

export async function getOutboxJob(id: string) {
    const rows = await db.execute<OutboxJob>(sql`
        select * from bot_runtime.outbox where id = ${id}::uuid
    `);
    return rows[0] ?? null;
}

export async function getOutboxJobStatus(id: string) {
    const rows = await db.execute<Pick<OutboxJob, "id" | "status">>(sql`
        select id, status from bot_runtime.outbox where id = ${id}::uuid
    `);
    return rows[0] ?? null;
}

export async function listOutboxJobs(
    input: { status?: OutboxJobStatus; limit?: number; offset?: number } = {},
) {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;
    assertPositiveSafeInteger(limit, "limit");
    assertNonnegativeSafeInteger(offset, "offset");
    if (limit > 100) throw new RangeError("limit must not exceed 100");

    return db.execute<OutboxJob>(sql`
        select *
        from bot_runtime.outbox
        where (${input.status ?? null}::text is null or status = ${input.status ?? null})
        order by created_at desc
        limit ${limit}
        offset ${offset}
    `);
}

export async function requeueOutboxJob(id: string) {
    const rows = await db.execute<OutboxJob>(sql`
        update bot_runtime.outbox
        set
            status = 'pending',
            attempts = 0,
            last_error = null,
            available_at = now(),
            claimed_at = null,
            lease_owner = null,
            lease_expires_at = null,
            completed_at = null,
            failed_at = null,
            updated_at = now()
        where id = ${id}::uuid and status = 'failed'
        returning *
    `);
    return rows[0] ?? null;
}

export async function cleanupOutboxJobs(retentionDays: number) {
    assertPositiveSafeInteger(retentionDays, "retentionDays");
    return db.execute<Pick<OutboxJob, "id">>(sql`
        delete from bot_runtime.outbox
        where
            (status = 'completed' and completed_at < now() - ${retentionDays} * interval '1 day')
            or (status = 'failed' and failed_at < now() - ${retentionDays} * interval '1 day')
        returning id
    `);
}
