import assert from "node:assert/strict";
import test from "node:test";

import { escapeHTML } from "../../../src/bot/helpers/html.ts";

test("escapeHTML escapes Telegram HTML control characters", () => {
    assert.equal(
        escapeHTML(`<b title="Tom & Jerry's">test</b>`),
        "&lt;b title=&quot;Tom &amp; Jerry&#39;s&quot;&gt;test&lt;/b&gt;",
    );
});

test("escapeHTML does not double-process replacement entities", () => {
    assert.equal(escapeHTML("<&"), "&lt;&amp;");
});
