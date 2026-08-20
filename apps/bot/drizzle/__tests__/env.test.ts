import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    parseDatabaseUrl,
    parseDatabaseUrlFromEnvironment,
} from "../database-url.ts";

describe("parseDatabaseUrl", () => {
    it("accepts PostgreSQL connection URLs", () => {
        assert.equal(
            parseDatabaseUrl("postgres://user:password@localhost:5432/app"),
            "postgres://user:password@localhost:5432/app",
        );
        assert.equal(
            parseDatabaseUrl("postgresql://user:password@localhost/app"),
            "postgresql://user:password@localhost/app",
        );
    });

    it("rejects missing, malformed, and non-PostgreSQL URLs", () => {
        assert.throws(() => parseDatabaseUrl(undefined));
        assert.throws(() => parseDatabaseUrl("postgres://"));
        assert.throws(() => parseDatabaseUrl("https://localhost/app"));
    });

    it("does not expose rejected database credentials", () => {
        const secretUrl = "https://user:TEST_SECRET_PASSWORD@example.com/app";

        assert.throws(
            () => parseDatabaseUrlFromEnvironment(secretUrl),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.equal(
                    error.message,
                    "Invalid DATABASE_URL configuration",
                );
                assert.equal(error.cause, undefined);
                assert.doesNotMatch(String(error), /TEST_SECRET_PASSWORD/);
                return true;
            },
        );
    });
});
