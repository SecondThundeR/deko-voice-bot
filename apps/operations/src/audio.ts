import { type ExecFileException, execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFilePromise = promisify(execFile);
const FFMPEG_CHECK_TIMEOUT_MS = 10_000;
const FFMPEG_CONVERSION_TIMEOUT_MS = 2 * 60 * 1_000;
const FFMPEG_MAX_OUTPUT_BYTES = 256 * 1_024;

function isExecFileError(
    error: unknown,
): error is ExecFileException & { stderr: string } {
    return (
        error instanceof Error &&
        "stderr" in error &&
        typeof (error as Record<string, unknown>).stderr === "string"
    );
}

export async function canRunFFmpeg() {
    try {
        await execFilePromise("ffmpeg", ["-version"], {
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        });
        return true;
    } catch {
        return false;
    }
}

export async function convertMP3ToOggOpus(
    inputPath: string,
    outputPath: string,
) {
    try {
        await execFilePromise(
            "ffmpeg",
            [
                "-hide_banner",
                "-nostdin",
                "-loglevel",
                "error",
                "-y",
                "-i",
                inputPath,
                "-c:a",
                "libopus",
                outputPath,
            ],
            {
                killSignal: "SIGKILL",
                maxBuffer: FFMPEG_MAX_OUTPUT_BYTES,
                timeout: FFMPEG_CONVERSION_TIMEOUT_MS,
            },
        );
    } catch (error) {
        if (isExecFileError(error)) {
            throw new Error(error.stderr.trim() || error.message);
        }
        throw error;
    }
}

export async function createAudioTempPaths() {
    const directory = await mkdtemp(join(tmpdir(), "operations-audio-"));
    return {
        directory,
        input: join(directory, "input.mp3"),
        output: join(directory, "output.ogg"),
    };
}

export async function removeAudioTempPaths(paths: { directory: string }) {
    await rm(paths.directory, { force: true, recursive: true }).catch(() => {});
}
