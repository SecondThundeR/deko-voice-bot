import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runProcess } from "../process.ts";

describe("backup process runner", () => {
    it("captures process output", async () => {
        const result = await runProcess(
            process.execPath,
            [
                "--eval",
                'process.stdout.write("ok"); process.stderr.write("warning")',
            ],
            { captureStdout: true },
        );

        assert.deepEqual(result, {
            exitCode: 0,
            stderr: "warning",
            stdout: "ok",
            timedOut: false,
        });
    });

    it("force-kills a process that ignores graceful termination", async () => {
        const startedAt = Date.now();
        const result = await runProcess(
            process.execPath,
            [
                "--eval",
                'process.on("SIGTERM", () => {}); setInterval(() => {}, 1_000)',
            ],
            { terminationGraceMs: 50, timeoutMs: 50 },
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.timedOut, true);
        assert.ok(Date.now() - startedAt < 2_000);
    });

    it("does not retain its timeout after a spawn error", async () => {
        const startedAt = Date.now();

        await assert.rejects(
            runProcess("missing-deko-backup-executable", [], {
                timeoutMs: 10_000,
            }),
            { code: "ENOENT" },
        );

        assert.ok(Date.now() - startedAt < 2_000);
    });
});
