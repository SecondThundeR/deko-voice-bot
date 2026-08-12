import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { maskName } from "./privacy.ts";

describe("maskName", () => {
    it("keeps only the initial of every name part", () => {
        assert.equal(maskName("Иван Петров"), "И•••• П•••••");
    });

    it("does not reveal the length of short names", () => {
        assert.equal(maskName("Ли"), "Л••••");
    });

    it("uses a neutral fallback for absent names", () => {
        assert.equal(maskName(null), "П•••••••••••");
    });
});
