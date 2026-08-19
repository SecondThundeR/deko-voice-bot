import { stat, unlink } from "node:fs/promises";
import {
    type BackupTempPaths,
    createBackupTempPaths,
    decryptBackupFile,
    hashFile,
    removeBackupTempPaths,
    unpackBackup,
    validateDatabaseDump,
} from "@deko-voice-bot/backup";
import { writeRequestBodyToPath } from "./files.ts";

type PreparedImport = {
    expiresAt: number;
    operationId: string;
    paths: BackupTempPaths;
    sha256: string;
    size: number;
};

export class ImportStore {
    readonly #imports = new Map<string, PreparedImport>();
    readonly #cleanupInterval: NodeJS.Timeout;
    readonly #encryptionKey: Buffer;
    readonly #maxBytes: number;
    readonly #ttlMs: number;

    constructor(encryptionKey: Buffer, maxBytes: number, ttlMs: number) {
        this.#encryptionKey = encryptionKey;
        this.#maxBytes = maxBytes;
        this.#ttlMs = ttlMs;
        this.#cleanupInterval = setInterval(() => void this.cleanup(), ttlMs);
        this.#cleanupInterval.unref();
    }

    async prepare(operationId: string, request: Request) {
        await this.delete(operationId);
        const paths = await createBackupTempPaths("operations-import");

        try {
            await writeRequestBodyToPath(
                request,
                paths.encrypted,
                this.#maxBytes,
            );
            await decryptBackupFile(
                paths.encrypted,
                paths.package,
                this.#encryptionKey,
            );
            await unpackBackup(paths.package, paths.dump);
            await unlink(paths.package);
            await validateDatabaseDump(paths.dump);

            const [sha256, fileStats] = await Promise.all([
                hashFile(paths.encrypted),
                stat(paths.encrypted),
            ]);
            const prepared: PreparedImport = {
                expiresAt: Date.now() + this.#ttlMs,
                operationId,
                paths,
                sha256,
                size: fileStats.size,
            };
            this.#imports.set(operationId, prepared);
            return prepared;
        } catch (error) {
            await removeBackupTempPaths(paths);
            throw error;
        }
    }

    get(operationId: string) {
        const prepared = this.#imports.get(operationId);
        if (!prepared || prepared.expiresAt <= Date.now()) {
            if (prepared) void this.delete(operationId);
            return null;
        }
        return prepared;
    }

    async delete(operationId: string) {
        const prepared = this.#imports.get(operationId);
        this.#imports.delete(operationId);
        if (prepared) await removeBackupTempPaths(prepared.paths);
    }

    async cleanup() {
        const now = Date.now();
        await Promise.all(
            [...this.#imports.values()]
                .filter(({ expiresAt }) => expiresAt <= now)
                .map(({ operationId }) => this.delete(operationId)),
        );
    }

    async close() {
        clearInterval(this.#cleanupInterval);
        await Promise.all(
            [...this.#imports.keys()].map((operationId) =>
                this.delete(operationId),
            ),
        );
    }
}
