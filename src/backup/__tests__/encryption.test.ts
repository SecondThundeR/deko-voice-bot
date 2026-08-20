import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import {
    decryptBackupFile,
    encryptBackupFile,
    parseBackupEncryptionKey,
} from "../encryption.ts";

const tempDirectories: string[] = [];

async function createTempPaths() {
    const directory = await mkdtemp(join(tmpdir(), "deko-backup-test-"));
    tempDirectories.push(directory);
    return {
        input: join(directory, "input.dump"),
        encrypted: join(directory, "backup.dump.enc"),
        decrypted: join(directory, "decrypted.dump"),
    };
}

afterEach(async () => {
    await Promise.all(
        tempDirectories
            .splice(0)
            .map((directory) =>
                rm(directory, { force: true, recursive: true }),
            ),
    );
});

describe("backup encryption", () => {
    it("round-trips a backup without loading it into memory", async () => {
        const paths = await createTempPaths();
        const key = randomBytes(32);
        const contents = randomBytes(256 * 1024 + 13);
        await writeFile(paths.input, contents);

        await encryptBackupFile(paths.input, paths.encrypted, key);
        await decryptBackupFile(paths.encrypted, paths.decrypted, key);

        assert.deepEqual(await readFile(paths.decrypted), contents);
        assert.notDeepEqual(await readFile(paths.encrypted), contents);
    });

    it("supports empty dump files", async () => {
        const paths = await createTempPaths();
        const key = randomBytes(32);
        await writeFile(paths.input, Buffer.alloc(0));

        await encryptBackupFile(paths.input, paths.encrypted, key);
        await decryptBackupFile(paths.encrypted, paths.decrypted, key);

        assert.equal((await readFile(paths.decrypted)).length, 0);
    });

    it("rejects a backup encrypted with another key", async () => {
        const paths = await createTempPaths();
        await writeFile(paths.input, "database dump");
        await encryptBackupFile(paths.input, paths.encrypted, randomBytes(32));

        await assert.rejects(
            decryptBackupFile(
                paths.encrypted,
                paths.decrypted,
                randomBytes(32),
            ),
            { code: "BACKUP_KEY_MISMATCH" },
        );
    });

    it("detects ciphertext tampering", async () => {
        const paths = await createTempPaths();
        const key = randomBytes(32);
        await writeFile(paths.input, "database dump contents");
        await encryptBackupFile(paths.input, paths.encrypted, key);

        const encrypted = await readFile(paths.encrypted);
        encrypted[encrypted.length - 17] ^= 1;
        await writeFile(paths.encrypted, encrypted);

        await assert.rejects(
            decryptBackupFile(paths.encrypted, paths.decrypted, key),
            { code: "BACKUP_AUTHENTICATION_FAILED" },
        );
    });

    it("parses only 32-byte base64 keys", () => {
        const key = randomBytes(32);
        assert.deepEqual(parseBackupEncryptionKey(key.toString("base64")), key);
        assert.throws(() => parseBackupEncryptionKey("not-a-key"), {
            code: "INVALID_BACKUP_KEY",
        });
    });
});
