import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { createTtlMemoryStorage } from "../../../src/bot/store/ttl-memory-storage.ts";

describe("TTL memory storage", () => {
    it("stores values until their TTL expires", async () => {
        const storage = createTtlMemoryStorage<{ count: number }>({
            ttlMs: 10,
        });

        await storage.write("session:1", { count: 1 });
        assert.deepEqual(await storage.read("session:1"), { count: 1 });

        await delay(20);

        assert.equal(await storage.read("session:1"), undefined);
        assert.equal(await storage.has?.("session:1"), false);
    });
});
