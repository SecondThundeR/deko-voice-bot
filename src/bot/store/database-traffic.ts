import type { Middleware } from "grammy";

import type { Context } from "#root/bot/context.js";

let isImportMaintenanceActive = false;
let activeRequests = 0;
const drainWaiters = new Set<() => void>();

function notifyDrainWaiters() {
    for (const resolve of drainWaiters) {
        resolve();
    }
    drainWaiters.clear();
}

export function isDatabaseImportMaintenanceActive() {
    return isImportMaintenanceActive;
}

export function databaseTrafficGatekeep(): Middleware<Context> {
    return async (ctx, next) => {
        if (isImportMaintenanceActive) {
            if (ctx.inlineQuery) {
                return ctx.answerInlineQuery([], {
                    button: {
                        text: ctx.t("maintenance-inline-button"),
                        start_parameter: "maintenance",
                    },
                    cache_time: 30,
                    is_personal: true,
                });
            }

            return ctx.reply(ctx.t("maintenance-chat-unavailable"));
        }

        activeRequests += 1;
        try {
            await next();
        } finally {
            activeRequests -= 1;
            notifyDrainWaiters();
        }
    };
}

async function waitForActiveRequestsAtMost(limit: number) {
    while (activeRequests > limit) {
        await new Promise<void>((resolve) => drainWaiters.add(resolve));
    }
}

/**
 * Stops new updates and waits until only the update that initiated the import
 * remains active. This coordinator is intentionally process-local and assumes
 * that the bot is deployed as a single replica.
 */
export async function beginDatabaseImportMaintenance() {
    if (isImportMaintenanceActive) {
        return false;
    }

    isImportMaintenanceActive = true;
    await waitForActiveRequestsAtMost(1);
    return true;
}

export function endDatabaseImportMaintenance() {
    isImportMaintenanceActive = false;
}
