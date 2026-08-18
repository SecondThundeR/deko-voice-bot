import { type ExecException, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
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
const require = createRequire(import.meta.url);
const ffmpegStatic = require("ffmpeg-static") as string | null;
const ffprobeStatic = require("@derhuerst/ffprobe-static") as string | null;
const FFMPEG_CHECK_TIMEOUT_MS = 10_000;
const FFMPEG_CONVERSION_TIMEOUT_MS = 2 * 60 * 1_000;
const FFMPEG_MAX_OUTPUT_BYTES = 256 * 1_024;
const executableCache = new Map<string, Promise<string>>();

function errorMessage(error: unknown) {
    if (
        error instanceof Error &&
        "stderr" in error &&
        typeof (error as ExecException & { stderr?: unknown }).stderr ===
            "string"
    ) {
        return (
            (error as ExecException & { stderr: string }).stderr.trim() ||
            error.message
        );
    }
    return error instanceof Error ? error.message : "Unknown error occurred";
}

async function resolveExecutable(
    name: "ffmpeg" | "ffprobe",
    override: string | undefined,
    packaged: string | null,
) {
    const candidates = [...new Set([override, name, packaged])].filter(
        (candidate): candidate is string => Boolean(candidate),
    );
    for (const candidate of candidates) {
        try {
            await execFilePromise(candidate, ["-version"], {
                timeout: FFMPEG_CHECK_TIMEOUT_MS,
            });
            return candidate;
        } catch {
            // Try the next configured, system, or packaged executable.
        }
    }
    throw new Error(`${name} executable is unavailable`);
}

function getExecutable(name: "ffmpeg" | "ffprobe") {
    let executable = executableCache.get(name);
    if (!executable) {
        executable =
            name === "ffmpeg"
                ? resolveExecutable(name, process.env.FFMPEG_BIN, ffmpegStatic)
                : resolveExecutable(
                      name,
                      process.env.FFPROBE_BIN,
                      ffprobeStatic,
                  );
        executableCache.set(name, executable);
    }
    return executable;
}

export async function getFFMPEGStatus() {
    try {
        await Promise.all([getExecutable("ffmpeg"), getExecutable("ffprobe")]);
        return true;
    } catch {
        return false;
    }
}

export async function inspectMp3(filename: string) {
    const ffprobe = await getExecutable("ffprobe");
    const { stdout } = await execFilePromise(
        ffprobe,
        [
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "format=duration:stream=codec_name",
            "-of",
            "json",
            filename,
        ],
        {
            maxBuffer: FFMPEG_MAX_OUTPUT_BYTES,
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        },
    );
    const result = JSON.parse(stdout) as {
        format?: { duration?: string };
        streams?: Array<{ codec_name?: string }>;
    };
    const durationMs = Math.round(Number(result.format?.duration) * 1_000);
    if (
        result.streams?.[0]?.codec_name !== "mp3" ||
        !Number.isSafeInteger(durationMs) ||
        durationMs <= 0
    ) {
        throw new Error("File is not a readable MP3 audio stream");
    }
    return { durationMs };
}

export async function getAudioDurationMs(filename: string) {
    return (await inspectMp3(filename)).durationMs;
}

export async function convertMP3ToOGGOpus(
    inputFilename: string,
    outputFilename: string,
    trim: AudioTrim = {},
): Promise<ConvertResult> {
    let ffmpeg: string;
    try {
        ffmpeg = await getExecutable("ffmpeg");
    } catch (error) {
        return { status: false, error: errorMessage(error) };
    }
    const startMs = trim.startMs ?? 0;
    const args = ["-hide_banner", "-nostdin", "-loglevel", "error", "-y"];
    if (startMs > 0) args.push("-ss", (startMs / 1_000).toFixed(3));
    args.push("-i", inputFilename);
    if (trim.endMs != null) {
        args.push("-t", ((trim.endMs - startMs) / 1_000).toFixed(3));
    }
    args.push("-vn", "-ac", "1", "-c:a", "libopus", outputFilename);

    try {
        await execFilePromise(ffmpeg, args, {
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
