import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import type { Context } from "#root/bot/context.js";
import {
    beginDatabaseImportMaintenance,
    databaseTrafficGatekeep,
    endDatabaseImportMaintenance,
} from "./database-traffic.ts";

function createContext(replies: string[]) {
    return {
        reply: (text: string) => {
            replies.push(text);
            return Promise.resolve(undefined);
        },
        t: (key: string) => key,
    } as unknown as Context;
}

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

afterEach(() => endDatabaseImportMaintenance());

describe("database import traffic gate", () => {
    it("waits for all requests except the import initiator", async () => {
        const gate = databaseTrafficGatekeep();
        const first = deferred();
        const second = deferred();
        const firstRequest = gate(createContext([]), () => first.promise);
        const secondRequest = gate(createContext([]), () => second.promise);

        let maintenanceStarted = false;
        const maintenance = beginDatabaseImportMaintenance().then((started) => {
            maintenanceStarted = started;
        });
        await Promise.resolve();
        assert.equal(maintenanceStarted, false);

        first.resolve();
        await firstRequest;
        await maintenance;
        assert.equal(maintenanceStarted, true);

        second.resolve();
        await secondRequest;
    });

    it("does not invoke downstream conversation work during import", async () => {
        const replies: string[] = [];
        const gate = databaseTrafficGatekeep();
        assert.equal(await beginDatabaseImportMaintenance(), true);

        let downstreamCalled = false;
        await gate(createContext(replies), () => {
            downstreamCalled = true;
            return Promise.resolve();
        });

        assert.equal(downstreamCalled, false);
        assert.deepEqual(replies, ["maintenance-chat-unavailable"]);
    });
});
