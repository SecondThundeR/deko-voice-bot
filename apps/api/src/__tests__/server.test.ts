import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { createApiServer } from "../server.ts";

const serviceToken = "test-api-token-123456789";
const server = createApiServer(
    {
        backupEncryptionKey: Buffer.alloc(32).toString("base64"),
        backupMaxSizeMb: 1,
        databaseUrl: "postgres://user:password@localhost/database",
        host: "localhost",
        importTtlMinutes: 1,
        port: 3003,
        serviceToken,
        voiceMaxSizeMb: 1,
    },
    { ffmpegAvailable: false },
);

after(() => server.close());

describe("API server", () => {
    it("exposes only the basic readiness route without authentication", async () => {
        const readiness = await server.fetch(new Request("http://localhost/"));
        assert.equal(readiness.status, 200);
        assert.deepEqual(await readiness.json(), { status: true });

        const health = await server.fetch(
            new Request("http://localhost/health"),
        );
        assert.equal(health.status, 401);
    });

    it("returns capabilities to an authenticated bot", async () => {
        const response = await server.fetch(
            new Request("http://localhost/health", {
                headers: { authorization: `Bearer ${serviceToken}` },
            }),
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            ffmpegAvailable: false,
            restoringDatabase: false,
            status: true,
        });
    });

    it("rejects voice conversion when FFmpeg is unavailable", async () => {
        const response = await server.fetch(
            new Request("http://localhost/voice/convert", {
                body: "audio",
                headers: { authorization: `Bearer ${serviceToken}` },
                method: "POST",
            }),
        );

        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), {
            error: "FFmpeg is unavailable",
        });
    });
});
