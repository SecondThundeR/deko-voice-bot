import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { ImportSessionStore } from "./import-sessions.ts";

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

        store.addAwaitingConfirmation(awaitingFile, {
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

    it("cancels a prepared import when the session is cancelled", async () => {
        const cancelledOperations: string[] = [];
        const store = new ImportSessionStore(async (operationId) => {
            cancelledOperations.push(operationId);
        });
        const started = await store.start(10, 20, 60_000);
        const awaitingFile = store.takeAwaitingFile(10, 20);
        assert.ok(awaitingFile);
        store.addAwaitingConfirmation(awaitingFile, {
            sha256: "abc",
            size: 42,
        });

        assert.equal(await store.cancel(10, 20), true);
        assert.deepEqual(cancelledOperations, [started.operationId]);
    });

    it("expires sessions and cancels their prepared imports", async () => {
        const cancelledOperations: string[] = [];
        const store = new ImportSessionStore(async (operationId) => {
            cancelledOperations.push(operationId);
        });
        const started = await store.start(10, 20, 10);
        const awaitingFile = store.takeAwaitingFile(10, 20);
        assert.ok(awaitingFile);
        store.addAwaitingConfirmation(awaitingFile, {
            sha256: "abc",
            size: 42,
        });

        await delay(30);

        assert.equal(store.get(10, 20), null);
        assert.deepEqual(cancelledOperations, [started.operationId]);
    });
});
