import { type ExecFileException, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { promisify } from "node:util";

type FFMPEGConvertResultSuccess = { status: true; error: undefined };
type FFMPEGConvertResultFailure = { status: false; error: string };
type FFMPEGConvertResult =
    | FFMPEGConvertResultSuccess
    | FFMPEGConvertResultFailure;

let _canRunFFMPEG: boolean | null = null;

const execFilePromise = promisify(execFile);

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
        await execFilePromise("ffmpeg", ["-version"]);
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
        await execFilePromise("ffmpeg", [
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            inputFilename,
            "-c:a",
            "libopus",
            outputFilename,
        ]);

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

export function createDumpTempFilePath(prefix: string) {
    return join(tmpdir(), `${prefix}-${randomUUID()}.dump`);
}

export function isEmpty(val: unknown) {
    return val == null || !(Object.keys(val) || val).length;
}

export async function readTextWithLimit(
    stream: Readable | null | undefined,
    maxBytes: number,
) {
    if (!stream) {
        return "";
    }

    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let bytesRead = 0;
    let isTruncated = false;

    for await (const chunk of stream) {
        const buffer = chunk instanceof Buffer ? chunk : Buffer.from(chunk);

        if (bytesRead < maxBytes) {
            const remainingBytes = maxBytes - bytesRead;
            const chunkToDecode =
                buffer.length > remainingBytes
                    ? buffer.subarray(0, remainingBytes)
                    : buffer;

            chunks.push(decoder.decode(chunkToDecode, { stream: true }));
        }

        bytesRead += buffer.length;
        if (bytesRead > maxBytes) {
            isTruncated = true;
        }
    }

    chunks.push(decoder.decode());

    if (isTruncated) {
        chunks.push("\n... stderr output truncated");
    }

    return chunks.join("");
}
