import postgres from "postgres";

import { resetDatabaseConnection } from "./db.ts";
import { databaseUrl } from "./env.ts";

export const DATABASE_TRAFFIC_LOCK_ID = 1_863_268_677;

type ServiceState = {
    generation: string;
    maintenance: boolean;
};

let observedGeneration: string | undefined;
let generationRefresh = Promise.resolve();

async function refreshDatabaseConnection(generation: string) {
    generationRefresh = generationRefresh
        .catch(() => {})
        .then(async () => {
            if (observedGeneration === undefined) {
                observedGeneration = generation;
                return;
            }
            if (observedGeneration !== generation) {
                await resetDatabaseConnection();
                observedGeneration = generation;
            }
        });
    await generationRefresh;
}

export class DatabaseMaintenanceError extends Error {
    constructor() {
        super("Database maintenance is active");
        this.name = "DatabaseMaintenanceError";
    }
}

export async function withDatabaseTraffic<T>(operation: () => Promise<T>) {
    const lockClient = postgres(databaseUrl, { max: 1 });
    try {
        const [state] = await lockClient<ServiceState[]>`
            select generation::text, maintenance
            from bot_runtime.service_state
            where singleton = true
        `;
        if (!state || state.maintenance) throw new DatabaseMaintenanceError();

        const [lock] = await lockClient<[{ acquired: boolean }]>`
            select pg_try_advisory_lock_shared(${DATABASE_TRAFFIC_LOCK_ID}) as acquired
        `;
        if (!lock?.acquired) throw new DatabaseMaintenanceError();
        try {
            await refreshDatabaseConnection(state.generation);
            return await operation();
        } finally {
            await lockClient`
                select pg_advisory_unlock_shared(${DATABASE_TRAFFIC_LOCK_ID})
            `.catch(() => {});
        }
    } finally {
        await lockClient.end({ timeout: 5 });
    }
}

export async function beginGlobalDatabaseMaintenance() {
    const client = postgres(databaseUrl, { max: 1 });
    await client`
        update bot_runtime.service_state
        set maintenance = true, updated_at = now()
        where singleton = true and maintenance = false
    `;
    return client;
}

export async function lockGlobalDatabaseTraffic(
    client: ReturnType<typeof postgres>,
) {
    await client`select pg_advisory_lock(${DATABASE_TRAFFIC_LOCK_ID})`;
}

export async function endGlobalDatabaseMaintenance(
    client: ReturnType<typeof postgres>,
    incrementGeneration: boolean,
) {
    try {
        await client`
            update bot_runtime.service_state
            set maintenance = false,
                generation = generation + ${incrementGeneration ? 1 : 0},
                updated_at = now()
            where singleton = true
        `;
        await client`
            select pg_advisory_unlock(${DATABASE_TRAFFIC_LOCK_ID})
        `.catch(() => {});
    } finally {
        await client.end({ timeout: 5 });
    }
}
