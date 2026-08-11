import postgres from "postgres";

import { BackupOperationBusyError } from "./errors.ts";

const BACKUP_ADVISORY_LOCK_ID = 1_863_268_676;

export async function withBackupAdvisoryLock<T>(
    databaseUrl: string,
    operation: () => Promise<T>,
) {
    const lockClient = postgres(databaseUrl, { max: 1 });

    try {
        const [row] = await lockClient<[{ acquired: boolean }]>`
            select pg_try_advisory_lock(${BACKUP_ADVISORY_LOCK_ID}) as acquired
        `;
        if (!row?.acquired) {
            throw new BackupOperationBusyError();
        }

        try {
            return await operation();
        } finally {
            await lockClient`
                select pg_advisory_unlock(${BACKUP_ADVISORY_LOCK_ID})
            `.catch(() => {});
        }
    } finally {
        await lockClient.end({ timeout: 5 });
    }
}
