import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSafeErrorInfo } from "./logging.ts";

describe("getSafeErrorInfo", () => {
    it("keeps useful error details while redacting identifiers", () => {
        const error = new Error("user 123 sent secret text");

        const safeError = getSafeErrorInfo(error);

        assert.equal(safeError.error.type, "Error");
        assert.equal(
            safeError.error.message,
            "user [redacted-id] sent secret text",
        );
        assert.match(
            safeError.error.stack ?? "",
            /^Error: user \[redacted-id\] sent secret text\n {4}at /,
        );
    });

    it("redacts Telegram identifiers and contact details from messages", () => {
        const error = new Error(
            "user 123456789, @private_user, test@example.com, bot123456:secret",
        );

        assert.equal(
            getSafeErrorInfo(error).error.message,
            "user [redacted-id], @[redacted-username], [redacted-email], bot[redacted-token]",
        );
    });

    it("keeps numeric and conventional technical error codes", () => {
        assert.deepEqual(
            getSafeErrorInfo({ name: "GrammyError", error_code: 400 }),
            { error: { type: "GrammyError", code: 400 } },
        );
        assert.deepEqual(
            getSafeErrorInfo({ name: "SystemError", code: "ECONNRESET" }),
            { error: { type: "SystemError", code: "ECONNRESET" } },
        );
    });

    it("drops arbitrary string codes that could contain personal data", () => {
        assert.deepEqual(
            getSafeErrorInfo({
                name: "RemoteError",
                code: "user-123-secret",
                message: "private message",
                payload: { text: "private message" },
            }),
            { error: { type: "RemoteError" } },
        );
    });
});
