import { MAX_SUBMISSION_FILE_BYTES } from "@deko-voice-bot/contracts";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { parseTrimInput } from "../audio.ts";
import type { AdminUploadRouteDependencies } from "../dependencies.ts";
import { HttpError } from "../errors.ts";
import type { ApiEnv } from "../types.ts";
import { parseVoiceId } from "../validation.ts";
import {
    bestEffortTelegram,
    fullname,
    requireAdmin,
    validateTitle,
} from "./helpers.ts";

export function createAdminUploadRoutes(deps: AdminUploadRouteDependencies) {
    return new Hono<ApiEnv>().post(
        "/admin/voices",
        bodyLimit({
            maxSize: MAX_SUBMISSION_FILE_BYTES + 64 * 1024,
            onError: (c) =>
                c.json(
                    {
                        error: {
                            code: "FILE_TOO_LARGE",
                            message: "Файл превышает 20 МБ",
                            requestId: c.var.requestId,
                        },
                    },
                    413,
                ),
        }),
        async (c) => {
            requireAdmin(c.var.isAdmin);
            const form = await c.req.formData();
            const title = validateTitle(form.get("title"));
            const voiceId = parseVoiceId(form.get("voiceId"));
            if (await deps.database(() => deps.getVoiceById(voiceId)))
                throw new HttpError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID уже существует",
                );
            const file = form.get("file");
            if (!(file instanceof File))
                throw new HttpError(400, "INVALID_FILE", "Выберите MP3-файл");
            await deps.validateMp3Upload(file);
            const trim = parseTrimInput({
                startMs: form.get("startMs"),
                endMs: form.get("endMs"),
            });
            const addedBy = c.var.user.username
                ? `@${c.var.user.username}`
                : fullname(c.var.user);
            const sent = await deps.convertAndSendVoice({
                bytes: new Uint8Array(await file.arrayBuffer()),
                caption: [
                    `ID: ${voiceId}`,
                    `Название: ${title}`,
                    `Добавлено модератором: ${addedBy}`,
                ].join("\n"),
                trim,
            });
            const added = await deps
                .database(() =>
                    deps.addVoice({
                        voiceId,
                        voiceTitle: title,
                        fileId: sent.fileId,
                        fileUniqueId: sent.fileUniqueId,
                    }),
                )
                .catch(async (error) => {
                    await bestEffortTelegram(
                        deps.logger,
                        c.var.requestId,
                        "compensate_admin_voice",
                        () =>
                            deps.deleteTelegramMessage(
                                sent.chatId,
                                sent.messageId,
                            ),
                    );
                    throw error;
                });
            if (!added) {
                await bestEffortTelegram(
                    deps.logger,
                    c.var.requestId,
                    "delete_conflicting_admin_voice",
                    () =>
                        deps.deleteTelegramMessage(sent.chatId, sent.messageId),
                );
                throw new HttpError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID или файлом уже существует",
                );
            }
            return c.json({ ok: true as const, voiceId }, 201);
        },
    );
}
