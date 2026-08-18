import {
    type ModerationPorts,
    ModerationService,
} from "@deko-voice-bot/application";
import { Hono } from "hono";
import type { AdminModerationRouteDependencies } from "../dependencies/types.ts";
import { HttpError } from "../http/errors.ts";
import { parsePagination } from "../http/pagination.ts";
import {
    parseOptionalJsonBody,
    parseRejectionReason,
    parseTitle,
    parseVoiceId,
} from "../http/validation.ts";
import { parseTrimInput } from "../integrations/audio.ts";
import type { ApiEnv } from "../types.ts";
import {
    bestEffortTelegram,
    moderationCaption,
    requireAdmin,
} from "./helpers.ts";

function moderationService(
    deps: AdminModerationRouteDependencies,
    requestId: string,
) {
    const ports: ModerationPorts = {
        claim: (id, moderatorUserId, title) =>
            deps.database(() =>
                deps.claimVoiceSubmission(id, moderatorUserId, title),
            ),
        approve: (id, voice) =>
            deps.database(() => deps.approveVoiceSubmission(id, voice)),
        release: (id) => deps.database(() => deps.releaseVoiceSubmission(id)),
        getFile: (fileId) => deps.getTelegramFile(fileId),
        convertAndSend: (input) => deps.convertAndSendVoice(input),
        deleteMessage: (chatId, messageId) =>
            deps.deleteTelegramMessage(chatId, messageId),
        sendMessage: (userId, text) => deps.sendTelegramMessage(userId, text),
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
    return new ModerationService(ports);
}

export function createAdminModerationRoutes(
    deps: AdminModerationRouteDependencies,
) {
    return new Hono<ApiEnv>()
        .get("/admin/submissions", async (c) => {
            requireAdmin(c.var.isAdmin);
            const bucket =
                c.req.query("bucket") === "history" ? "history" : "queue";
            const { offset, limit } = parsePagination({
                offset: c.req.query("offset"),
                limit: c.req.query("limit"),
            });
            const rows = await deps.database(() =>
                deps.getAdminVoiceSubmissions({
                    bucket,
                    limit: limit + 1,
                    offset,
                }),
            );
            return c.json({
                items: rows.slice(0, limit).map(deps.toAdminSubmissionDto),
                nextOffset: rows.length > limit ? offset + limit : null,
            });
        })
        .get("/admin/submissions/:id/audio", async (c) => {
            requireAdmin(c.var.isAdmin);
            const submission = await deps.database(() =>
                deps.getVoiceSubmission(c.req.param("id")),
            );
            if (!submission?.sourceFileId)
                throw new HttpError(
                    404,
                    "SUBMISSION_AUDIO_NOT_FOUND",
                    "Исходный файл заявки не найден",
                );
            const response = await deps.getTelegramFile(
                submission.sourceFileId,
            );
            if (!response.ok || !response.body)
                throw new HttpError(
                    503,
                    "TELEGRAM_UNAVAILABLE",
                    "Не удалось загрузить аудио заявки",
                );
            return new Response(response.body, {
                headers: {
                    "cache-control": "private, max-age=60",
                    "content-type": "audio/mpeg",
                },
            });
        })
        .patch("/admin/submissions/:id", async (c) => {
            requireAdmin(c.var.isAdmin);
            const body = await parseOptionalJsonBody(c.req.raw);
            const title = parseTitle(body.title);
            const submission = await deps.database(() =>
                deps.updateVoiceSubmissionTitle(c.req.param("id"), title),
            );
            if (!submission)
                throw new HttpError(
                    409,
                    "SUBMISSION_NOT_EDITABLE",
                    "Заявка уже обрабатывается или завершена",
                );
            const sourceChatId = submission.sourceChatId;
            const sourceMessageId = submission.sourceMessageId;
            if (sourceChatId && sourceMessageId)
                await bestEffortTelegram(
                    deps.logger,
                    c.var.requestId,
                    "edit_submission_caption",
                    () =>
                        deps.editTelegramCaption(
                            sourceChatId,
                            sourceMessageId,
                            moderationCaption(submission),
                        ),
                );
            return c.json(deps.toSubmissionDto(submission));
        })
        .post("/admin/submissions/:id/reject", async (c) => {
            requireAdmin(c.var.isAdmin);
            const body = await parseOptionalJsonBody(c.req.raw);
            const reason = parseRejectionReason(body.reason);
            const submission = await deps.database(() =>
                deps.rejectVoiceSubmission(
                    c.req.param("id"),
                    c.var.user.id,
                    reason || undefined,
                ),
            );
            if (!submission)
                throw new HttpError(
                    409,
                    "SUBMISSION_NOT_ACTIONABLE",
                    "Заявка уже обрабатывается или завершена",
                );
            const sourceChatId = submission.sourceChatId;
            const sourceMessageId = submission.sourceMessageId;
            if (sourceChatId && sourceMessageId)
                await bestEffortTelegram(
                    deps.logger,
                    c.var.requestId,
                    "delete_rejected_submission",
                    () =>
                        deps.deleteTelegramMessage(
                            sourceChatId,
                            sourceMessageId,
                        ),
                );
            await bestEffortTelegram(
                deps.logger,
                c.var.requestId,
                "notify_submission_rejection",
                () =>
                    deps.sendTelegramMessage(
                        submission.submitterUserId,
                        `Ваша заявка «${submission.title}» отклонена.${reason ? ` Причина: ${reason}` : ""}`,
                    ),
            );
            return c.json(deps.toSubmissionDto(submission));
        })
        .post("/admin/submissions/:id/approve", async (c) => {
            requireAdmin(c.var.isAdmin);
            const body = await parseOptionalJsonBody(c.req.raw);
            const title = parseTitle(body.title);
            const voiceId = parseVoiceId(body.voiceId);
            const trim = parseTrimInput(body);
            const { approved } = await moderationService(
                deps,
                c.var.requestId,
            ).approve({
                id: c.req.param("id"),
                moderatorUserId: c.var.user.id,
                title,
                voiceId,
                trim,
            });
            return c.json(
                deps.toSubmissionDto(
                    approved as Parameters<typeof deps.toSubmissionDto>[0],
                ),
            );
        });
}
