import type { Update } from "grammy/types";
import postgres from "postgres";

import { databaseUrl } from "#drizzle/env.js";
import type { Bot } from "#root/bot/index.js";
import type { Logger } from "#root/logger.js";
import { getSafeErrorInfo } from "#root/logging.js";
import { getWebhookRetryDelayMs, isTransientWebhookError } from "./retry.ts";

const STALE_CLAIM_SECONDS = 120;
const RETENTION_DAYS = 7;
const MAX_PROCESSING_ATTEMPTS = 3;
const INITIAL_IDLE_DELAY_MS = 100;
const MAX_IDLE_DELAY_MS = 1_000;
const STALE_RECOVERY_INTERVAL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 60 * 60_000;

type InboxRow = {
    attempts: number;
    update_id: string;
    payload: Update;
    retryable: boolean;
};

function isExplicitlyIdempotent(update: Update) {
    return Boolean(
        update.chosen_inline_result ||
            update.pre_checkout_query ||
            update.message?.refunded_payment,
    );
}

function routingKey(update: Update) {
    const userId =
        update.message?.from?.id ??
        update.edited_message?.from?.id ??
        update.callback_query?.from.id ??
        update.inline_query?.from.id ??
        update.chosen_inline_result?.from.id ??
        update.pre_checkout_query?.from.id;
    return userId ? `user:${userId}` : `update:${update.update_id}`;
}

export function createWebhookInbox() {
    const client = postgres(databaseUrl, { max: 5 });

    async function enqueue(update: Update) {
        await client`
            insert into bot_runtime.webhook_inbox
                (update_id, payload, routing_key, priority, retryable)
            values (
                ${update.update_id}::bigint,
                ${client.json(update as unknown as postgres.JSONValue)},
                ${routingKey(update)},
                ${update.pre_checkout_query ? 100 : 0},
                ${isExplicitlyIdempotent(update)}
            )
            on conflict (update_id) do nothing
        `;
    }

    async function recoverStaleClaims() {
        await client`
            update bot_runtime.webhook_inbox
            set status = 'failed', claimed_at = null,
                last_error = 'Worker stopped during a non-idempotent handler; manual replay required'
            where status = 'processing' and retryable = false
              and claimed_at < now() - ${STALE_CLAIM_SECONDS} * interval '1 second'
        `;
    }

    async function claim(priorityOnly: boolean) {
        const rows = await client<InboxRow[]>`
            with candidate as (
                select i.update_id
                from bot_runtime.webhook_inbox i
                where
                    (${priorityOnly}::boolean = false or i.priority >= 100)
                    and (
                        (i.status = 'pending' and i.available_at <= now())
                        or (i.status = 'processing' and i.retryable = true and i.claimed_at < now() - ${STALE_CLAIM_SECONDS} * interval '1 second')
                    )
                    and not exists (
                        select 1 from bot_runtime.webhook_inbox active
                        where active.routing_key = i.routing_key
                          and active.status = 'processing'
                          and active.update_id <> i.update_id
                          and active.claimed_at >= now() - ${STALE_CLAIM_SECONDS} * interval '1 second'
                    )
                order by i.priority desc, i.received_at
                for update skip locked
                limit 1
            )
            update bot_runtime.webhook_inbox i
            set status = 'processing', claimed_at = now(), attempts = attempts + 1
            from candidate
            where i.update_id = candidate.update_id
            returning i.update_id::text, i.payload, i.retryable, i.attempts
        `;
        return rows[0] ?? null;
    }

    async function complete(updateId: string) {
        await client`
            update bot_runtime.webhook_inbox
            set status = 'completed', payload = null, last_error = null,
                processed_at = now(), claimed_at = null
            where update_id = ${updateId}::bigint
        `;
    }

    async function fail(updateId: string, error: unknown) {
        const info = getSafeErrorInfo(error);
        const message = JSON.stringify(info).slice(0, 8_000);
        await client`
            update bot_runtime.webhook_inbox
            set status = 'failed', last_error = ${message}, claimed_at = null
            where update_id = ${updateId}::bigint
        `;
    }

    async function retry(updateId: string, error: unknown, delayMs: number) {
        const info = getSafeErrorInfo(error);
        const message = JSON.stringify(info).slice(0, 8_000);
        await client`
            update bot_runtime.webhook_inbox
            set status = 'pending', last_error = ${message}, claimed_at = null,
                available_at = now() + ${delayMs} * interval '1 millisecond'
            where update_id = ${updateId}::bigint
        `;
    }

    async function replay(updateId: number) {
        const rows = await client`
            update bot_runtime.webhook_inbox
            set status = 'pending', available_at = now(), claimed_at = null,
                processed_at = null, last_error = null
            where update_id = ${updateId}::bigint
              and status = 'failed' and payload is not null
            returning update_id
        `;
        return rows.length === 1;
    }

    async function cleanup() {
        await client.begin(async (tx) => {
            await tx`
            delete from bot_runtime.webhook_inbox
            where coalesce(processed_at, received_at) < now() - ${RETENTION_DAYS} * interval '1 day'
            `;
            await tx`
                delete from public.processed_usage_updates
                where processed_at < now() - ${RETENTION_DAYS} * interval '1 day'
            `;
        });
    }

    return {
        claim,
        cleanup,
        complete,
        enqueue,
        fail,
        recoverStaleClaims,
        replay,
        retry,
        close: () => client.end({ timeout: 5 }),
    };
}

export type WebhookInbox = ReturnType<typeof createWebhookInbox>;

export function startWebhookWorkers(
    inbox: WebhookInbox,
    bot: Bot,
    logger: Logger,
) {
    let stopped = false;
    const backgroundTasks = new Set<Promise<void>>();

    function wait(delayMs: number) {
        return new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    async function worker(priorityOnly: boolean) {
        let idleDelayMs = INITIAL_IDLE_DELAY_MS;

        while (!stopped) {
            let item: Awaited<ReturnType<WebhookInbox["claim"]>>;
            try {
                item = await inbox.claim(priorityOnly);
            } catch (error) {
                logger.warn({
                    msg: "Webhook inbox claim failed; retrying",
                    priorityOnly,
                    retryDelayMs: idleDelayMs,
                    ...getSafeErrorInfo(error),
                });
                await wait(idleDelayMs);
                idleDelayMs = Math.min(MAX_IDLE_DELAY_MS, idleDelayMs * 2);
                continue;
            }

            if (!item) {
                await wait(idleDelayMs);
                idleDelayMs = Math.min(MAX_IDLE_DELAY_MS, idleDelayMs * 2);
                continue;
            }
            idleDelayMs = INITIAL_IDLE_DELAY_MS;

            try {
                await bot.handleUpdate(item.payload);
                await inbox.complete(item.update_id);
            } catch (error) {
                const willRetry =
                    item.retryable &&
                    item.attempts < MAX_PROCESSING_ATTEMPTS &&
                    isTransientWebhookError(error);
                let failureStatePersisted = true;
                try {
                    if (willRetry) {
                        await inbox.retry(
                            item.update_id,
                            error,
                            getWebhookRetryDelayMs(error, item.attempts),
                        );
                    } else {
                        await inbox.fail(item.update_id, error);
                    }
                } catch (persistenceError) {
                    failureStatePersisted = false;
                    logger.error({
                        msg: "Failed to persist webhook inbox failure state",
                        updateId: item.update_id,
                        ...getSafeErrorInfo(persistenceError),
                    });
                }
                logger.error({
                    msg: !failureStatePersisted
                        ? "Webhook inbox update failed; stale-claim recovery required"
                        : willRetry
                          ? "Idempotent webhook inbox update failed transiently; retry scheduled"
                          : "Webhook inbox update failed; manual replay required",
                    updateId: item.update_id,
                    ...getSafeErrorInfo(error),
                });
            }
        }
    }

    function runBackgroundTask(
        taskName: string,
        operation: () => Promise<unknown>,
    ) {
        const task = operation()
            .then(() => undefined)
            .catch((error) => {
                logger.error({
                    msg: "Webhook inbox background task failed",
                    taskName,
                    ...getSafeErrorInfo(error),
                });
            })
            .finally(() => backgroundTasks.delete(task));
        backgroundTasks.add(task);
        return task;
    }

    const tasks = [worker(true), worker(false), worker(false), worker(false)];
    void runBackgroundTask("recover-stale-claims", () =>
        inbox.recoverStaleClaims(),
    );
    const staleRecoveryTimer = setInterval(
        () =>
            void runBackgroundTask("recover-stale-claims", () =>
                inbox.recoverStaleClaims(),
            ),
        STALE_RECOVERY_INTERVAL_MS,
    );
    staleRecoveryTimer.unref();
    const cleanupTimer = setInterval(
        () => void runBackgroundTask("cleanup", () => inbox.cleanup()),
        CLEANUP_INTERVAL_MS,
    );
    cleanupTimer.unref();

    return async () => {
        stopped = true;
        clearInterval(staleRecoveryTimer);
        clearInterval(cleanupTimer);
        await Promise.allSettled([...tasks, ...backgroundTasks]);
    };
}
