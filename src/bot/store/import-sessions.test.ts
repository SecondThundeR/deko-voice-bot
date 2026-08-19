import assert from "node:assert/strict";
import { access, rm, writeFile } from "node:fs/promises";
import { afterEach, describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { createBackupTempPaths } from "#root/backup/paths.js";
import { ImportSessionStore } from "./import-sessions.ts";

const tempDirectories: string[] = [];

async function createSessionFiles() {
    const paths = await createBackupTempPaths("deko-import-test");
    tempDirectories.push(paths.directory);
    await Promise.all([
        writeFile(paths.dump, "dump"),
        writeFile(paths.encrypted, "encrypted"),
    ]);
    return paths;
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

describe("ImportSessionStore", () => {
    it("reads an awaiting-file session without consuming it", async () => {
        const store = new ImportSessionStore();
        const started = await store.start(10, 20, 60_000);

        assert.equal(store.get(10, 20), started);
        assert.equal(store.takeAwaitingFile(10, 20), started);
    });

    it("requires the matching user, chat and operation to confirm", async () => {
        const store = new ImportSessionStore();
        const started = await store.start(10, 20, 60_000);
        const awaitingFile = store.takeAwaitingFile(10, 20);
        assert.ok(awaitingFile);

        const paths = await createSessionFiles();
        store.addAwaitingConfirmation(awaitingFile, {
            paths,
            sha256: "abc",
            size: 42,
        });

        assert.equal(
            store.takeForConfirmation(11, 20, started.operationId),
            null,
        );
        assert.equal(
            store.takeForConfirmation(10, 21, started.operationId),
            null,
        );
        assert.equal(store.takeForConfirmation(10, 20, "wrong"), null);
        assert.equal(
            store.takeForConfirmation(10, 20, started.operationId)?.stage,
            "awaiting-confirmation",
        );
        assert.equal(
            store.takeForConfirmation(10, 20, started.operationId),
            null,
        );
    });

    it("deletes temporary files when cancelled", async () => {
        const store = new ImportSessionStore();
        await store.start(10, 20, 60_000);
        const awaitingFile = store.takeAwaitingFile(10, 20);
        assert.ok(awaitingFile);
        const paths = await createSessionFiles();
        store.addAwaitingConfirmation(awaitingFile, {
            paths,
            sha256: "abc",
            size: 42,
        });

        assert.equal(await store.cancel(10, 20), true);
        await assert.rejects(access(paths.dump));
        await assert.rejects(access(paths.encrypted));
    });

    it("expires sessions and deletes temporary files", async () => {
        const store = new ImportSessionStore();
        await store.start(10, 20, 10);
        const awaitingFile = store.takeAwaitingFile(10, 20);
        assert.ok(awaitingFile);
        const paths = await createSessionFiles();
        store.addAwaitingConfirmation(awaitingFile, {
            paths,
            sha256: "abc",
            size: 42,
        });

        await delay(30);

        assert.equal(store.get(10, 20), null);
        await assert.rejects(access(paths.dump));
        await assert.rejects(access(paths.encrypted));
    });
});
