import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseDatabaseUrl } from "../src/database-url.ts";

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
});
