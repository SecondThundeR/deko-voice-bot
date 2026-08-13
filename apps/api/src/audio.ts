import { unlink, writeFile } from "node:fs/promises";
import {
    convertMP3ToOGGOpus,
    createVoiceTempFilePaths,
    getAudioDurationMs,
} from "@deko-voice-bot/audio";
import { HttpError } from "./errors.ts";
import { sendVoiceToModeration } from "./telegram.ts";

export type TrimInput = { startMs: number; endMs: number | null };

export function parseTrimInput(input: {
    startMs?: unknown;
    endMs?: unknown;
}): TrimInput {
    const startMs = Number(input.startMs ?? 0);
    const endMs =
        input.endMs === null || input.endMs === undefined || input.endMs === ""
            ? null
            : Number(input.endMs);
    if (
        !Number.isSafeInteger(startMs) ||
        startMs < 0 ||
        (endMs !== null &&
            (!Number.isSafeInteger(endMs) || endMs - startMs < 100))
    ) {
        throw new HttpError(
            400,
            "INVALID_TRIM",
            "Выберите корректный фрагмент длительностью не менее 0,1 секунды",
        );
    }
    return { startMs, endMs };
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
        return await sendVoiceToModeration({
            caption: input.caption,
            filename: paths.output,
        });
    } finally {
        await Promise.allSettled([unlink(paths.input), unlink(paths.output)]);
    }
}
