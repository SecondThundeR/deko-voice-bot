import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BOT_ALLOWED_UPDATES } from "../updates.ts";

describe("BOT_ALLOWED_UPDATES", () => {
    it("contains exactly the update types handled by the bot", () => {
        assert.deepEqual(BOT_ALLOWED_UPDATES, [
            "message",
            "callback_query",
            "inline_query",
            "chosen_inline_result",
            "pre_checkout_query",
        ]);
    });
});
