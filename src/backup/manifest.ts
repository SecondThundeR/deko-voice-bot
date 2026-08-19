import { createReadStream, createWriteStream } from "node:fs";
import { open } from "node:fs/promises";
import { pipeline } from "node:stream/promises";

import { BackupError } from "./errors.ts";

const PACKAGE_MAGIC = Buffer.from("DEKOPKG2", "ascii");
const MAX_MANIFEST_BYTES = 16 * 1024;
export const BACKUP_FORMAT_VERSION = 2;
export const CURRENT_SCHEMA_VERSION = "0017_simplify_runtime";
const RESTORABLE_SCHEMA_VERSIONS = [
    CURRENT_SCHEMA_VERSION,
    "0016_runtime_inbox_and_invariants",
] as const;

export type BackupManifest = {
    createdAt: string;
    formatVersion: number;
    schemaVersion: string;
};

export async function packBackup(dumpPath: string, packagePath: string) {
    const manifest: BackupManifest = {
        createdAt: new Date().toISOString(),
        formatVersion: BACKUP_FORMAT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
    };
    const encoded = Buffer.from(JSON.stringify(manifest), "utf8");
    const header = Buffer.alloc(PACKAGE_MAGIC.length + 4);
    PACKAGE_MAGIC.copy(header);
    header.writeUInt32BE(encoded.length, PACKAGE_MAGIC.length);

    const output = createWriteStream(packagePath, { mode: 0o600 });
    output.write(header);
    output.write(encoded);
    await pipeline(createReadStream(dumpPath), output);
    return manifest;
}

export async function unpackBackup(packagePath: string, dumpPath: string) {
    const handle = await open(packagePath, "r");
    try {
        const header = Buffer.alloc(PACKAGE_MAGIC.length + 4);
        const headerRead = await handle.read(header, 0, header.length, 0);
        if (
            headerRead.bytesRead !== header.length ||
            !header.subarray(0, PACKAGE_MAGIC.length).equals(PACKAGE_MAGIC)
        ) {
            throw new BackupError(
                "Legacy or invalid backup package; inspect/upgrade it offline",
                "BACKUP_SCHEMA_MISMATCH",
            );
        }
        const manifestLength = header.readUInt32BE(PACKAGE_MAGIC.length);
        if (manifestLength < 2 || manifestLength > MAX_MANIFEST_BYTES) {
            throw new BackupError(
                "Invalid backup manifest length",
                "INVALID_BACKUP_FORMAT",
            );
        }
        const encoded = Buffer.alloc(manifestLength);
        const manifestRead = await handle.read(
            encoded,
            0,
            manifestLength,
            header.length,
        );
        if (manifestRead.bytesRead !== manifestLength) {
            throw new BackupError(
                "Incomplete backup manifest",
                "INVALID_BACKUP_FORMAT",
            );
        }
        const manifest = JSON.parse(
            encoded.toString("utf8"),
        ) as Partial<BackupManifest>;
        if (
            manifest.formatVersion !== BACKUP_FORMAT_VERSION ||
            !RESTORABLE_SCHEMA_VERSIONS.some(
                (schemaVersion) => schemaVersion === manifest.schemaVersion,
            ) ||
            typeof manifest.createdAt !== "string" ||
            !Number.isFinite(Date.parse(manifest.createdAt))
        ) {
            throw new BackupError(
                "Backup format or schema version does not match this bot release",
                "BACKUP_SCHEMA_MISMATCH",
            );
        }
        const offset = header.length + manifestLength;
        await pipeline(
            createReadStream(packagePath, { start: offset }),
            createWriteStream(dumpPath, { mode: 0o600 }),
        );
        return manifest as BackupManifest;
    } catch (error) {
        if (error instanceof BackupError) throw error;
        throw new BackupError(
            "Invalid backup manifest",
            "INVALID_BACKUP_FORMAT",
            { cause: error },
        );
    } finally {
        await handle.close();
    }
}
