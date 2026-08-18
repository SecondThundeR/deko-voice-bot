import { Hono } from "hono";
import { parseTrimInput } from "../audio.ts";
import type { AdminModerationRouteDependencies } from "../dependencies.ts";
import { HttpError } from "../errors.ts";
import { parsePagination } from "../pagination.ts";
import type { ApiEnv } from "../types.ts";
import {
    parseOptionalJsonBody,
    parseRejectionReason,
    parseTitle,
    parseVoiceId,
} from "../validation.ts";
import {
    bestEffortTelegram,
    moderationCaption,
    requireAdmin,
} from "./helpers.ts";

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
            const claimed = await deps.database(() =>
                deps.claimVoiceSubmission(
                    c.req.param("id"),
                    c.var.user.id,
                    title,
                ),
            );
            if (!claimed)
                throw new HttpError(
                    409,
                    "SUBMISSION_NOT_ACTIONABLE",
                    "Заявка уже обрабатывается или завершена",
                );
            let sent:
                | Awaited<ReturnType<typeof deps.convertAndSendVoice>>
                | undefined;
            try {
                if (!claimed.sourceFileId)
                    throw new HttpError(
                        404,
                        "SUBMISSION_AUDIO_NOT_FOUND",
                        "Исходный файл заявки не найден",
                    );
                const source = await deps.getTelegramFile(claimed.sourceFileId);
                if (!source.ok)
                    throw new HttpError(
                        503,
                        "TELEGRAM_UNAVAILABLE",
                        "Не удалось загрузить аудио заявки",
                    );
                const converted = await deps.convertAndSendVoice({
                    bytes: new Uint8Array(await source.arrayBuffer()),
                    caption: `Одобрено: ${title}`,
                    trim,
                });
                sent = converted;
                const approved = await deps.database(() =>
                    deps.approveVoiceSubmission(claimed.id, {
                        voiceId,
                        voiceTitle: title,
                        fileId: converted.fileId,
                        fileUniqueId: converted.fileUniqueId,
                    }),
                );
                if (!approved) {
                    await bestEffortTelegram(
                        deps.logger,
                        c.var.requestId,
                        "delete_conflicting_voice",
                        () =>
                            deps.deleteTelegramMessage(
                                converted.chatId,
                                converted.messageId,
                            ),
                    );
                    throw new HttpError(
                        409,
                        "VOICE_CONFLICT",
                        "Реплика с таким ID или файлом уже существует",
                    );
                }
                const sourceChatId = claimed.sourceChatId;
                const sourceMessageId = claimed.sourceMessageId;
                if (sourceChatId && sourceMessageId)
                    await bestEffortTelegram(
                        deps.logger,
                        c.var.requestId,
                        "delete_approved_submission",
                        () =>
                            deps.deleteTelegramMessage(
                                sourceChatId,
                                sourceMessageId,
                            ),
                    );
                await bestEffortTelegram(
                    deps.logger,
                    c.var.requestId,
                    "notify_submission_approval",
                    () =>
                        deps.sendTelegramMessage(
                            claimed.submitterUserId,
                            `Ваша заявка «${title}» одобрена и добавлена в каталог`,
                        ),
                );
                return c.json(deps.toSubmissionDto(approved));
            } catch (error) {
                const sentVoice = sent;
                if (sentVoice)
                    await bestEffortTelegram(
                        deps.logger,
                        c.var.requestId,
                        "compensate_approved_voice",
                        () =>
                            deps.deleteTelegramMessage(
                                sentVoice.chatId,
                                sentVoice.messageId,
                            ),
                    );
                await deps.database(() =>
                    deps.releaseVoiceSubmission(claimed.id),
                );
                throw error;
            }
        });
}
