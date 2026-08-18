import { type CatalogPorts, CatalogService } from "@deko-voice-bot/application";
import { MAX_SUBMISSION_FILE_BYTES } from "@deko-voice-bot/contracts";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AdminUploadRouteDependencies } from "../dependencies/types.ts";
import { HttpError } from "../http/errors.ts";
import { parseTrimInput, parseVoiceId } from "../http/validation.ts";
import type { ApiEnv } from "../types.ts";
import { fullname, requireAdmin, validateTitle } from "./helpers.ts";

function catalogService(deps: AdminUploadRouteDependencies, requestId: string) {
    const ports: CatalogPorts = {
        getVoiceById: (voiceId) =>
            deps.database(() => deps.getVoiceById(voiceId)),
        addVoice: (input) => deps.database(() => deps.addVoice(input)),
        convertAndSend: (input) => deps.convertAndSendVoice(input),
        deleteMessage: (chatId, messageId) =>
            deps.deleteTelegramMessage(chatId, messageId),
        warn: (action, error) =>
            deps.logger.warn(
                {
                    requestId,
                    action,
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                "Best-effort Telegram action failed",
            ),
    };
    return new CatalogService(ports);
}

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
            const file = form.get("file");
            if (!(file instanceof File)) {
                throw new HttpError(400, "INVALID_FILE", "Выберите MP3-файл");
            }
            await deps.validateMp3Upload(file);
            const trim = parseTrimInput({
                startMs: form.get("startMs"),
                endMs: form.get("endMs"),
            });
            const addedBy = c.var.user.username
                ? `@${c.var.user.username}`
                : fullname(c.var.user);
            const result = await catalogService(
                deps,
                c.var.requestId,
            ).addAdminVoice({
                voiceId,
                title,
                bytes: new Uint8Array(await file.arrayBuffer()),
                trim,
                addedBy,
            });
            return c.json(result, 201);
        },
    );
}
