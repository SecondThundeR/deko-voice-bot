import { type ExecFileException, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

type ConvertResult =
    | { status: true; error: undefined }
    | { status: false; error: string };

export type AudioTrim = {
    startMs?: number;
    endMs?: number | null;
};

const execFilePromise = promisify(execFile);
const FFMPEG_CHECK_TIMEOUT_MS = 10_000;
const FFMPEG_CONVERSION_TIMEOUT_MS = 2 * 60 * 1_000;
const FFMPEG_MAX_OUTPUT_BYTES = 256 * 1_024;
let canRunCache: boolean | null = null;

function errorMessage(error: unknown) {
    if (
        error instanceof Error &&
        "stderr" in error &&
        typeof (error as ExecFileException & { stderr?: unknown }).stderr ===
            "string"
    ) {
        return (
            (error as ExecFileException & { stderr: string }).stderr.trim() ||
            error.message
        );
    }
    return error instanceof Error ? error.message : "Unknown error occurred";
}

export async function getFFMPEGStatus() {
    if (canRunCache !== null) return canRunCache;
    try {
        await execFilePromise("ffmpeg", ["-version"], {
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        });
        canRunCache = true;
    } catch {
        canRunCache = false;
    }
    return canRunCache;
}

export async function getAudioDurationMs(filename: string) {
    const { stdout } = await execFilePromise(
        "ffprobe",
        [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            filename,
        ],
        {
            maxBuffer: FFMPEG_MAX_OUTPUT_BYTES,
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        },
    );
    const durationMs = Math.round(Number(stdout.trim()) * 1_000);
    if (!Number.isSafeInteger(durationMs) || durationMs <= 0) {
        throw new Error("Unable to determine audio duration");
    }
    return durationMs;
}

export async function convertMP3ToOGGOpus(
    inputFilename: string,
    outputFilename: string,
    trim: AudioTrim = {},
): Promise<ConvertResult> {
    const startMs = trim.startMs ?? 0;
    const args = ["-hide_banner", "-nostdin", "-loglevel", "error", "-y"];
    if (startMs > 0) args.push("-ss", (startMs / 1_000).toFixed(3));
    args.push("-i", inputFilename);
    if (trim.endMs != null) {
        args.push("-t", ((trim.endMs - startMs) / 1_000).toFixed(3));
    }
    args.push("-vn", "-ac", "1", "-c:a", "libopus", outputFilename);

    try {
        await execFilePromise("ffmpeg", args, {
            killSignal: "SIGKILL",
            maxBuffer: FFMPEG_MAX_OUTPUT_BYTES,
            timeout: FFMPEG_CONVERSION_TIMEOUT_MS,
        });
        return { status: true, error: undefined };
    } catch (error) {
        return { status: false, error: errorMessage(error) };
    }
}

export function createVoiceTempFilePaths() {
    const basename = join(tmpdir(), `deko-voice-${randomUUID()}`);
    return { input: `${basename}.mp3`, output: `${basename}.ogg` };
}
