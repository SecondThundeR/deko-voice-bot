import { createDatabaseDump, hashFile } from "./database.ts";
import { encryptBackupFile } from "./encryption.ts";
import { packBackup } from "./manifest.ts";
import type { BackupTempPaths } from "./paths.ts";

type CreateEncryptedDatabaseBackupOptions = {
    databaseUrl: string;
    encryptionKey: Buffer;
    paths: BackupTempPaths;
};

export async function createEncryptedDatabaseBackup({
    databaseUrl,
    encryptionKey,
    paths,
}: CreateEncryptedDatabaseBackupOptions) {
    await createDatabaseDump(databaseUrl, paths.dump);
    await packBackup(paths.dump, paths.package);
    await encryptBackupFile(paths.package, paths.encrypted, encryptionKey);
    return hashFile(paths.encrypted);
}
