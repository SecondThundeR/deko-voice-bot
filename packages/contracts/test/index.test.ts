import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as v from "valibot";
import { userProfileSchema } from "../src/index.ts";

describe("userProfileSchema", () => {
    it("accepts active and excluded profiles", () => {
        assert.equal(
            v.safeParse(userProfileSchema, {
                status: "active",
                userId: 42,
                fullname: null,
                username: "test_user",
                usesAmount: 0,
                lastUsedAt: null,
            }).success,
            true,
        );
        assert.equal(
            v.safeParse(userProfileSchema, { status: "excluded" }).success,
            true,
        );
    });

    it("rejects invalid counters and identifiers", () => {
        assert.equal(
            v.safeParse(userProfileSchema, {
                status: "active",
                userId: 0,
                fullname: null,
                username: null,
                usesAmount: -1,
                lastUsedAt: null,
            }).success,
            false,
        );
    });
});
