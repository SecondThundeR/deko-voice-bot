import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseDonationAmount } from "../../../src/bot/helpers/api.ts";

describe("parseDonationAmount", () => {
    it("parses positive integer amounts", () => {
        assert.equal(parseDonationAmount("1"), 1);
        assert.equal(parseDonationAmount("250"), 250);
        assert.equal(
            parseDonationAmount(String(Number.MAX_SAFE_INTEGER)),
            Number.MAX_SAFE_INTEGER,
        );
    });

    it("rejects partial, non-positive and unsafe amounts", () => {
        for (const value of [
            "",
            "0",
            "-1",
            "1.5",
            "25abc",
            " 25",
            String(Number.MAX_SAFE_INTEGER + 1),
        ]) {
            assert.equal(parseDonationAmount(value), null);
        }
    });
});
