import { unlink, writeFile } from "node:fs/promises";
import {
    convertMP3ToOGGOpus,
    createVoiceTempFilePaths,
    getAudioDurationMs,
    inspectMp3,
} from "@deko-voice-bot/audio";
import { MAX_SUBMISSION_FILE_BYTES } from "@deko-voice-bot/contracts";
import { HttpError } from "../http/errors.ts";

export { parseTrimInput } from "../http/validation.ts";

export type TrimInput = { startMs: number; endMs: number | null };

export async function validateMp3Upload(file: File) {
    if (file.size < 1 || file.size > MAX_SUBMISSION_FILE_BYTES) {
        throw new HttpError(
            400,
            "INVALID_FILE",
            "Поддерживаются MP3-файлы размером до 20 МБ",
        );
    }
    const paths = createVoiceTempFilePaths();
    try {
        await writeFile(paths.input, new Uint8Array(await file.arrayBuffer()));
        await inspectMp3(paths.input);
    } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(
            400,
            "INVALID_FILE",
            "Не удалось прочитать MP3-файл",
        );
    } finally {
        await unlink(paths.input).catch(() => {});
    }
}

export function normalizeTrimForDuration(
    trim: TrimInput,
    durationMs: number,
): TrimInput {
    if (
        trim.startMs >= durationMs ||
        durationMs - trim.startMs < 100 ||
        (trim.endMs !== null && trim.endMs > durationMs + 25)
    ) {
        throw new HttpError(
            400,
            "INVALID_TRIM",
            "Границы обрезки выходят за длительность файла",
        );
    }
    return {
        ...trim,
        endMs: trim.endMs === null ? null : Math.min(trim.endMs, durationMs),
    };
}

export async function convertAndSendVoice(input: {
    bytes: Uint8Array;
    caption: string;
    trim: TrimInput;
}) {
    const paths = createVoiceTempFilePaths();
    try {
        await writeFile(paths.input, input.bytes);
        const durationMs = await getAudioDurationMs(paths.input).catch(() => {
            throw new HttpError(
                400,
                "INVALID_FILE",
                "Не удалось прочитать длительность MP3-файла",
            );
        });
        const normalizedTrim = normalizeTrimForDuration(input.trim, durationMs);
        const converted = await convertMP3ToOGGOpus(
            paths.input,
            paths.output,
            normalizedTrim,
        );
        if (!converted.status) {
            throw new HttpError(
                503,
                "AUDIO_PROCESSING_FAILED",
                "Не удалось обработать аудиофайл",
            );
        }
        const { sendVoiceToModeration } = await import("./telegram.ts");
        return await sendVoiceToModeration({
            caption: input.caption,
            filename: paths.output,
        });
    } finally {
        await Promise.allSettled([unlink(paths.input), unlink(paths.output)]);
    }
}
