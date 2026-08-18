import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toUserProfile } from "../src/profile.ts";

describe("toUserProfile", () => {
    it("returns all stored fields for an active profile", () => {
        const stored = {
            userId: 42,
            fullname: "Test User",
            username: "test_user",
            usesAmount: 7,
            lastUsedAt: 1_765_000_000_000,
        };

        assert.deepEqual(toUserProfile(stored), {
            status: "active",
            ...stored,
        });
    });

    it("returns the excluded state when no active profile exists", () => {
        assert.deepEqual(toUserProfile(null), { status: "excluded" });
    });
});
