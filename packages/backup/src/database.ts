import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import postgres from "postgres";

import { BackupError } from "./errors.ts";
import { type ProcessResult, runProcess } from "./process.ts";

const REQUIRED_TABLES = [
    "feature_flags",
    "payments",
    "users",
    "users_favorites",
    "voices",
] as const;
const REQUIRED_CONSTRAINTS = [
    "voices_file_unique_id_unique",
    "voices_uses_amount_nonnegative",
    "users_uses_amount_nonnegative",
] as const;

function getUtilityConnection(databaseUrl: string) {
    const parsed = new URL(databaseUrl);
    const password = decodeURIComponent(parsed.password);
    parsed.password = "";
    return {
        url: parsed.toString(),
        env: password ? { PGPASSWORD: password } : undefined,
    };
}

function assertSuccessfulProcess(
    result: ProcessResult,
    utility: "pg_dump" | "pg_restore",
) {
    if (result.timedOut) {
        throw new BackupError(
            `${utility} timed out`,
            `${utility.toUpperCase()}_TIMEOUT`,
            { cause: result.stderr },
        );
    }
    if (result.exitCode !== 0) {
        throw new BackupError(
            `${utility} exited with code ${result.exitCode}`,
            `${utility.toUpperCase()}_FAILED`,
            { cause: result.stderr },
        );
    }
}

export async function createDatabaseDump(
    databaseUrl: string,
    outputPath: string,
) {
    const connection = getUtilityConnection(databaseUrl);
    const result = await runProcess(
        "pg_dump",
        [
            connection.url,
            "--format=custom",
            "--schema=public",
            "--no-owner",
            "--no-acl",
            "--file",
            outputPath,
        ],
        { env: connection.env },
    );
    assertSuccessfulProcess(result, "pg_dump");
}

export async function validateDatabaseDump(dumpPath: string) {
    const result = await runProcess("pg_restore", ["--list", dumpPath], {
        captureStdout: true,
    });
    assertSuccessfulProcess(result, "pg_restore");

    const missingTables = REQUIRED_TABLES.filter(
        (table) =>
            !new RegExp(`\\bTABLE(?: DATA)? public ${table}\\b`).test(
                result.stdout,
            ),
    );
    if (missingTables.length > 0) {
        throw new BackupError(
            `The backup is missing required tables: ${missingTables.join(", ")}`,
            "BACKUP_SCHEMA_MISMATCH",
        );
    }
    if (/\bbot_runtime\b/.test(result.stdout)) {
        throw new BackupError(
            "Operational bot_runtime objects must not be present in an application backup",
            "BACKUP_SCHEMA_MISMATCH",
        );
    }
    const missingConstraints = REQUIRED_CONSTRAINTS.filter(
        (constraint) => !result.stdout.includes(constraint),
    );
    if (missingConstraints.length > 0) {
        throw new BackupError(
            `The backup is missing required constraints: ${missingConstraints.join(", ")}`,
            "BACKUP_SCHEMA_MISMATCH",
        );
    }
}

export async function restoreDatabaseDump(
    databaseUrl: string,
    dumpPath: string,
) {
    const connection = getUtilityConnection(databaseUrl);
    const result = await runProcess(
        "pg_restore",
        [
            "--dbname",
            connection.url,
            "--schema=public",
            "--single-transaction",
            "--clean",
            "--if-exists",
            "--no-owner",
            "--no-acl",
            dumpPath,
        ],
        { env: connection.env },
    );
    assertSuccessfulProcess(result, "pg_restore");
}

export async function normalizeRestoredDatabase(databaseUrl: string) {
    const client = postgres(databaseUrl, { max: 1 });

    try {
        await client.begin(async (transaction) => {
            await transaction`drop schema if exists bot_runtime cascade`;

            const tables = await transaction<{ tableName: string }[]>`
                select table_name as "tableName"
                from information_schema.tables
                where table_schema = 'public'
                  and table_type = 'BASE TABLE'
            `;
            const requiredTables = new Set<string>(REQUIRED_TABLES);
            const unexpectedTables = tables.filter(
                ({ tableName }) => !requiredTables.has(tableName),
            );

            for (const { tableName } of unexpectedTables) {
                await transaction`drop table ${transaction(tableName)} cascade`;
            }
        });
    } finally {
        await client.end({ timeout: 5 });
    }
}

export async function validateRestoredDatabase(databaseUrl: string) {
    const client = postgres(databaseUrl, { max: 1 });

    try {
        const rows = await client<[{ tables: string[] }]>`
            select array_agg(table_name order by table_name) as tables
            from information_schema.tables
            where table_schema = 'public'
        `;
        const restoredTables = new Set(rows[0]?.tables ?? []);
        const missingTables = REQUIRED_TABLES.filter(
            (table) => !restoredTables.has(table),
        );
        if (missingTables.length > 0) {
            throw new BackupError(
                `The restored database is missing required tables: ${missingTables.join(", ")}`,
                "RESTORED_SCHEMA_MISMATCH",
            );
        }
        const unexpectedTables = [...restoredTables].filter(
            (table) => !REQUIRED_TABLES.some((required) => required === table),
        );
        if (unexpectedTables.length > 0) {
            throw new BackupError(
                `The restored database contains unexpected tables: ${unexpectedTables.join(", ")}`,
                "RESTORED_SCHEMA_MISMATCH",
            );
        }

        await client`select 1 from users limit 1`;
        await client`select 1 from voices limit 1`;
        const constraints = await client<{ conname: string }[]>`
            select conname from pg_constraint
            where connamespace = 'public'::regnamespace
        `;
        const names = new Set(constraints.map(({ conname }) => conname));
        const missingConstraints = REQUIRED_CONSTRAINTS.filter(
            (constraint) => !names.has(constraint),
        );
        if (missingConstraints.length > 0) {
            throw new BackupError(
                `The restored database is missing required constraints: ${missingConstraints.join(", ")}`,
                "RESTORED_SCHEMA_MISMATCH",
            );
        }
    } finally {
        await client.end({ timeout: 5 });
    }
}

export async function hashFile(path: string) {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(path)) {
        hash.update(chunk as Buffer);
    }
    return hash.digest("hex");
}
