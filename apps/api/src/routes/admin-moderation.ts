import {
    approveVoiceSubmission,
    claimVoiceSubmission,
    getAdminVoiceSubmissions,
    getVoiceSubmission,
    rejectVoiceSubmission,
    releaseVoiceSubmission,
    toAdminSubmissionDto,
    toSubmissionDto,
    updateVoiceSubmissionTitle,
} from "@deko-voice-bot/database/queries/submissions.js";
import { isValidVoiceId } from "@deko-voice-bot/database/queries/voices.js";
import { Hono } from "hono";
import { convertAndSendVoice, parseTrimInput } from "../audio.ts";
import { HttpError } from "../errors.ts";
import { parsePagination } from "../pagination.ts";
import {
    deleteTelegramMessage,
    editTelegramCaption,
    getTelegramFile,
    sendTelegramMessage,
} from "../telegram.ts";
import type { ApiEnv } from "../types.ts";
import {
    bestEffortTelegram,
    database,
    moderationCaption,
    requireAdmin,
    validateTitle,
} from "./helpers.ts";

export const adminModerationRoutes = new Hono<ApiEnv>()
    .get("/admin/submissions", async (c) => {
        requireAdmin(c.var.isAdmin);
        const bucket =
            c.req.query("bucket") === "history" ? "history" : "queue";
        const { offset, limit } = parsePagination({
            offset: c.req.query("offset"),
            limit: c.req.query("limit"),
        });
        const rows = await database(() =>
            getAdminVoiceSubmissions({ bucket, limit: limit + 1, offset }),
        );
        return c.json({
            items: rows.slice(0, limit).map(toAdminSubmissionDto),
            nextOffset: rows.length > limit ? offset + limit : null,
        });
    })
    .get("/admin/submissions/:id/audio", async (c) => {
        requireAdmin(c.var.isAdmin);
        const submission = await database(() =>
            getVoiceSubmission(c.req.param("id")),
        );
        if (!submission?.sourceFileId) {
            throw new HttpError(
                404,
                "SUBMISSION_AUDIO_NOT_FOUND",
                "Исходный файл заявки не найден",
            );
        }
        const response = await getTelegramFile(submission.sourceFileId);
        if (!response.ok || !response.body) {
            throw new HttpError(
                503,
                "TELEGRAM_UNAVAILABLE",
                "Не удалось загрузить аудио заявки",
            );
        }
        return new Response(response.body, {
            headers: {
                "cache-control": "private, max-age=60",
                "content-type": "audio/mpeg",
            },
        });
    })
    .patch("/admin/submissions/:id", async (c) => {
        requireAdmin(c.var.isAdmin);
        const body = await c.req
            .json<{ title?: unknown }>()
            .catch((): { title?: unknown } => ({}));
        const title = validateTitle(body.title);
        const submission = await database(() =>
            updateVoiceSubmissionTitle(c.req.param("id"), title),
        );
        if (!submission)
            throw new HttpError(
                409,
                "SUBMISSION_NOT_EDITABLE",
                "Заявка уже обрабатывается или завершена",
            );
        const sourceChatId = submission.sourceChatId;
        const sourceMessageId = submission.sourceMessageId;
        if (sourceChatId && sourceMessageId) {
            await bestEffortTelegram(
                c.var.requestId,
                "edit_submission_caption",
                () =>
                    editTelegramCaption(
                        sourceChatId,
                        sourceMessageId,
                        moderationCaption(submission),
                    ),
            );
        }
        return c.json(toSubmissionDto(submission));
    })
    .post("/admin/submissions/:id/reject", async (c) => {
        requireAdmin(c.var.isAdmin);
        const body = await c.req
            .json<{ reason?: unknown }>()
            .catch((): { reason?: unknown } => ({}));
        const reason = String(body.reason ?? "").trim();
        if (reason.length > 512)
            throw new HttpError(
                400,
                "INVALID_REJECTION_REASON",
                "Причина отклонения не должна превышать 512 символов",
            );
        const submission = await database(() =>
            rejectVoiceSubmission(
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
        if (sourceChatId && sourceMessageId) {
            await bestEffortTelegram(
                c.var.requestId,
                "delete_rejected_submission",
                () => deleteTelegramMessage(sourceChatId, sourceMessageId),
            );
        }
        await bestEffortTelegram(
            c.var.requestId,
            "notify_submission_rejection",
            () =>
                sendTelegramMessage(
                    submission.submitterUserId,
                    `Ваша заявка «${submission.title}» отклонена.${reason ? ` Причина: ${reason}` : ""}`,
                ),
        );
        return c.json(toSubmissionDto(submission));
    })
    .post("/admin/submissions/:id/approve", async (c) => {
        requireAdmin(c.var.isAdmin);
        const body = await c.req
            .json<{
                voiceId?: unknown;
                title?: unknown;
                startMs?: unknown;
                endMs?: unknown;
            }>()
            .catch(
                (): {
                    voiceId?: unknown;
                    title?: unknown;
                    startMs?: unknown;
                    endMs?: unknown;
                } => ({}),
            );
        const title = validateTitle(body.title);
        const voiceId = String(body.voiceId ?? "").trim();
        if (!isValidVoiceId(voiceId))
            throw new HttpError(
                400,
                "INVALID_VOICE_ID",
                "ID должен содержать от 1 до 64 латинских букв, цифр, _ или -",
            );
        const trim = parseTrimInput(body);
        const claimed = await database(() =>
            claimVoiceSubmission(c.req.param("id"), c.var.user.id, title),
        );
        if (!claimed)
            throw new HttpError(
                409,
                "SUBMISSION_NOT_ACTIONABLE",
                "Заявка уже обрабатывается или завершена",
            );
        let sent: Awaited<ReturnType<typeof convertAndSendVoice>> | undefined;
        try {
            if (!claimed.sourceFileId)
                throw new HttpError(
                    404,
                    "SUBMISSION_AUDIO_NOT_FOUND",
                    "Исходный файл заявки не найден",
                );
            const source = await getTelegramFile(claimed.sourceFileId);
            if (!source.ok)
                throw new HttpError(
                    503,
                    "TELEGRAM_UNAVAILABLE",
                    "Не удалось загрузить аудио заявки",
                );
            const converted = await convertAndSendVoice({
                bytes: new Uint8Array(await source.arrayBuffer()),
                caption: `Одобрено: ${title}`,
                trim,
            });
            sent = converted;
            const approved = await database(() =>
                approveVoiceSubmission(claimed.id, {
                    voiceId,
                    voiceTitle: title,
                    fileId: converted.fileId,
                    fileUniqueId: converted.fileUniqueId,
                }),
            );
            if (!approved) {
                await bestEffortTelegram(
                    c.var.requestId,
                    "delete_conflicting_voice",
                    () =>
                        deleteTelegramMessage(
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
                    c.var.requestId,
                    "delete_approved_submission",
                    () => deleteTelegramMessage(sourceChatId, sourceMessageId),
                );
            await bestEffortTelegram(
                c.var.requestId,
                "notify_submission_approval",
                () =>
                    sendTelegramMessage(
                        claimed.submitterUserId,
                        `Ваша заявка «${title}» одобрена и добавлена в каталог`,
                    ),
            );
            return c.json(toSubmissionDto(approved));
        } catch (error) {
            const sentVoice = sent;
            if (sentVoice)
                await bestEffortTelegram(
                    c.var.requestId,
                    "compensate_approved_voice",
                    () =>
                        deleteTelegramMessage(
                            sentVoice.chatId,
                            sentVoice.messageId,
                        ),
                );
            await database(() => releaseVoiceSubmission(claimed.id));
            throw error;
        }
    });
