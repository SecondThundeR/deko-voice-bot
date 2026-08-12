import { type ExecFileException, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

type FFMPEGConvertResultSuccess = { status: true; error: undefined };
type FFMPEGConvertResultFailure = { status: false; error: string };
type FFMPEGConvertResult =
    | FFMPEGConvertResultSuccess
    | FFMPEGConvertResultFailure;

let _canRunFFMPEG: boolean | null = null;

const execFilePromise = promisify(execFile);
const FFMPEG_CHECK_TIMEOUT_MS = 10_000;
const FFMPEG_CONVERSION_TIMEOUT_MS = 2 * 60 * 1_000;
const FFMPEG_MAX_OUTPUT_BYTES = 256 * 1_024;

function isExecFileError(
    error: unknown,
): error is ExecFileException & { stderr: string; stdout: string } {
    return (
        error instanceof Error &&
        "stderr" in error &&
        typeof (error as Record<string, unknown>).stderr === "string"
    );
}

async function canRunFFMPEG(): Promise<boolean> {
    try {
        await execFilePromise("ffmpeg", ["-version"], {
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        });
        return true;
    } catch {
        return false;
    }
}

export async function getFFMPEGStatus() {
    if (_canRunFFMPEG === null) {
        _canRunFFMPEG = await canRunFFMPEG();
    }
    return _canRunFFMPEG;
}

export async function convertMP3ToOGGOpus(
    inputFilename: string,
    outputFilename: string,
): Promise<FFMPEGConvertResult> {
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
                inputFilename,
                "-c:a",
                "libopus",
                outputFilename,
            ],
            {
                killSignal: "SIGKILL",
                maxBuffer: FFMPEG_MAX_OUTPUT_BYTES,
                timeout: FFMPEG_CONVERSION_TIMEOUT_MS,
            },
        );

        return {
            status: true,
            error: undefined,
        };
    } catch (error: unknown) {
        if (isExecFileError(error)) {
            return {
                status: false,
                error: error.stderr.trim() || error.message,
            };
        }

        if (error instanceof Error) {
            return {
                status: false,
                error: error.message,
            };
        }

        return {
            status: false,
            error: "Unknown error occurred",
        };
    }
}

export function createVoiceTempFilePaths() {
    const basename = join(tmpdir(), `deko-voice-${randomUUID()}`);

    return {
        input: `${basename}.mp3`,
        output: `${basename}.ogg`,
    };
}
