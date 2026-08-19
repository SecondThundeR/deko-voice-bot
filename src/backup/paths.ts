import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type BackupTempPaths = {
    directory: string;
    dump: string;
    encrypted: string;
    package: string;
};

export async function createBackupTempPaths(
    prefix: string,
): Promise<BackupTempPaths> {
    const directory = await mkdtemp(
        join(tmpdir(), `${prefix}-${randomUUID()}-`),
    );

    return {
        directory,
        dump: join(directory, "database.dump"),
        package: join(directory, "backup.package"),
        encrypted: join(directory, "backup.dump.enc"),
    };
}

export async function removeBackupTempPaths(paths: BackupTempPaths) {
    await rm(paths.directory, { force: true, recursive: true }).catch(() => {});
}

export function createDatedBackupFileName(prefix: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${prefix}-${timestamp}.dump.enc`;
}
