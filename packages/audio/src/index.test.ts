import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";
import {
    convertMP3ToOGGOpus,
    getAudioDurationMs,
    getFFMPEGStatus,
} from "./index.ts";

const execFilePromise = promisify(execFile);
const require = createRequire(import.meta.url);
const ffmpegStatic = require("ffmpeg-static") as string | null;

describe("audio tools", () => {
    it("uses packaged binaries when system tools are unavailable", async () => {
        assert.ok(ffmpegStatic);
        const directory = await mkdtemp(join(tmpdir(), "deko-audio-test-"));
        const input = join(directory, "input.mp3");
        const output = join(directory, "output.ogg");
        const originalPath = process.env.PATH;

        try {
            await execFilePromise(ffmpegStatic, [
                "-hide_banner",
                "-nostdin",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:duration=1",
                "-y",
                input,
            ]);
            process.env.PATH = "";

            assert.equal(await getFFMPEGStatus(), true);
            assert.ok(Math.abs((await getAudioDurationMs(input)) - 1_000) < 50);

            const converted = await convertMP3ToOGGOpus(input, output, {
                startMs: 200,
                endMs: 700,
            });
            assert.ok(converted.status, converted.error ?? "conversion failed");
            const trimmedDuration = await getAudioDurationMs(output);
            assert.ok(trimmedDuration >= 450 && trimmedDuration <= 550);
        } finally {
            if (originalPath === undefined) delete process.env.PATH;
            else process.env.PATH = originalPath;
            await rm(directory, { force: true, recursive: true });
        }
    });
});
