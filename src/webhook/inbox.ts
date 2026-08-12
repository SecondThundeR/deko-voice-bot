import type { Update } from "grammy/types";
import postgres from "postgres";

import { databaseUrl } from "#drizzle/env.js";
import type { Bot } from "#root/bot/index.js";
import type { Logger } from "#root/logger.js";
import { getSafeErrorInfo } from "#root/logging.js";

const STALE_CLAIM_SECONDS = 120;
const RETENTION_DAYS = 7;

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

function isTransientError(error: unknown) {
    if (!error || typeof error !== "object") return false;
    const code = "code" in error ? error.code : undefined;
    const errorCode = "error_code" in error ? error.error_code : undefined;
    return (
        (typeof code === "string" &&
            [
                "40001",
                "40P01",
                "55P03",
                "57014",
                "08000",
                "08003",
                "08006",
            ].includes(code)) ||
        (typeof errorCode === "number" &&
            (errorCode === 429 || errorCode >= 500))
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

    async function claim(priorityOnly: boolean) {
        await client`
            update bot_runtime.webhook_inbox
            set status = 'failed', claimed_at = null,
                last_error = 'Worker stopped during a non-idempotent handler; manual replay required'
            where status = 'processing' and retryable = false
              and claimed_at < now() - ${STALE_CLAIM_SECONDS} * interval '1 second'
        `;
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

    async function retry(updateId: string, error: unknown) {
        const info = getSafeErrorInfo(error);
        const message = JSON.stringify(info).slice(0, 8_000);
        await client`
            update bot_runtime.webhook_inbox
            set status = 'pending', last_error = ${message}, claimed_at = null,
                available_at = now() + interval '1 second'
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

    async function worker(priorityOnly: boolean) {
        while (!stopped) {
            const item = await inbox.claim(priorityOnly);
            if (!item) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }
            try {
                await bot.handleUpdate(item.payload);
                await inbox.complete(item.update_id);
            } catch (error) {
                const willRetry =
                    item.retryable &&
                    item.attempts < 3 &&
                    isTransientError(error);
                if (willRetry) await inbox.retry(item.update_id, error);
                else await inbox.fail(item.update_id, error);
                logger.error({
                    msg: willRetry
                        ? "Idempotent webhook inbox update failed transiently; retry scheduled"
                        : "Webhook inbox update failed; manual replay required",
                    updateId: item.update_id,
                    ...getSafeErrorInfo(error),
                });
            }
        }
    }

    const tasks = [worker(true), worker(false), worker(false), worker(false)];
    const cleanupTimer = setInterval(() => void inbox.cleanup(), 60 * 60_000);
    cleanupTimer.unref();

    return async () => {
        stopped = true;
        clearInterval(cleanupTimer);
        await Promise.allSettled(tasks);
    };
}
