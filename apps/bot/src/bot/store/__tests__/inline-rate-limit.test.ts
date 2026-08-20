import assert from "node:assert/strict";
import { it } from "node:test";

import { consumeInlineQueryToken } from "../inline-rate-limit.ts";

it("limits an inline-query burst per user", () => {
    const userId = 1;

    for (let i = 0; i < 30; i++) {
        assert.equal(consumeInlineQueryToken(userId), true);
    }
    assert.equal(consumeInlineQueryToken(userId), false);
    assert.equal(consumeInlineQueryToken(userId + 1), true);
});
