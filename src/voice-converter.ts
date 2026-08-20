import { type ExecException, execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { downloadTelegramFileToPath } from "#root/bot/helpers/api.js";

const execFilePromise = promisify(execFile);
const FFMPEG_CHECK_TIMEOUT_MS = 10_000;
const FFMPEG_CONVERSION_TIMEOUT_MS = 2 * 60 * 1_000;
const FFMPEG_MAX_OUTPUT_BYTES = 256 * 1_024;

export type ConvertedVoiceFile = {
    directory: string;
    path: string;
};

function isExecFileError(
    error: unknown,
): error is ExecException & { stderr: string } {
    return (
        error instanceof Error &&
        "stderr" in error &&
        typeof (error as Record<string, unknown>).stderr === "string"
    );
}

export async function isVoiceConverterAvailable() {
    try {
        await execFilePromise("ffmpeg", ["-version"], {
            timeout: FFMPEG_CHECK_TIMEOUT_MS,
        });
        return true;
    } catch {
        return false;
    }
}

export async function downloadAndConvertVoice(
    telegramFilePath: string,
    botToken: string,
): Promise<ConvertedVoiceFile | null> {
    const directory = await mkdtemp(join(tmpdir(), "deko-voice-"));
    const inputPath = join(directory, "input.mp3");
    const outputPath = join(directory, "output.ogg");

    try {
        const downloaded = await downloadTelegramFileToPath(
            telegramFilePath,
            inputPath,
            botToken,
        );
        if (!downloaded) {
            await removeConvertedVoice({ directory, path: outputPath });
            return null;
        }

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
        return { directory, path: outputPath };
    } catch (error) {
        await removeConvertedVoice({ directory, path: outputPath });
        if (isExecFileError(error)) {
            throw new Error(error.stderr.trim() || error.message);
        }
        throw error;
    }
}

export async function removeConvertedVoice(file: ConvertedVoiceFile) {
    await rm(file.directory, { force: true, recursive: true }).catch(() => {});
}
