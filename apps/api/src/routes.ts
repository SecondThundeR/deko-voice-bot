import { randomUUID } from "node:crypto";
import {
    MAX_SUBMISSION_FILE_BYTES,
    SUBMISSION_DAILY_LIMIT,
    SUBMISSION_PENDING_LIMIT,
} from "@deko-voice-bot/contracts";
import { getFullStats } from "@deko-voice-bot/database/queries/stats.js";
import {
    approveVoiceSubmission,
    claimVoiceSubmission,
    createVoiceSubmission,
    getAdminVoiceSubmissions,
    getUserVoiceSubmissions,
    getVoiceSubmission,
    markVoiceSubmissionFailed,
    markVoiceSubmissionPending,
    rejectVoiceSubmission,
    releaseVoiceSubmission,
    toAdminSubmissionDto,
    toSubmissionDto,
    updateVoiceSubmissionTitle,
} from "@deko-voice-bot/database/queries/submissions.js";
import {
    getUserData,
    getUserIsIgnoredStatus,
    optInUser,
    optOutUser,
} from "@deko-voice-bot/database/queries/users.js";
import {
    addUserFavorite,
    deleteUserFavorite,
} from "@deko-voice-bot/database/queries/users-favorites.js";
import {
    addVoice,
    getVoiceById,
    getVoicesPage,
    isValidVoiceId,
} from "@deko-voice-bot/database/queries/voices.js";
import { withDatabaseTraffic } from "@deko-voice-bot/database/traffic.js";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
    convertAndSendVoice,
    parseTrimInput,
    validateMp3Upload,
} from "./audio.ts";
import { HttpError } from "./errors.ts";
import { logger } from "./logger.ts";
import { parsePagination, parseVoiceSearchQuery } from "./pagination.ts";
import { maskName } from "./privacy.ts";
import { toUserProfile } from "./profile.ts";
import {
    deleteTelegramMessage,
    editTelegramCaption,
    getTelegramFile,
    prepareVoiceMessage,
    sendSubmissionToModeration,
    sendTelegramMessage,
} from "./telegram.ts";
import type { ApiEnv } from "./types.ts";

const database = <T>(operation: () => Promise<T>) =>
    withDatabaseTraffic(operation);

function fullname(user: ApiEnv["Variables"]["user"]) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

async function bestEffortTelegram(
    requestId: string,
    action: string,
    operation: () => Promise<unknown>,
) {
    try {
        await operation();
    } catch (error) {
        logger.warn(
            {
                requestId,
                action,
                error: error instanceof Error ? error.message : String(error),
            },
            "Best-effort Telegram action failed",
        );
    }
}

function requireAdmin(isAdmin: boolean) {
    if (!isAdmin) {
        throw new HttpError(403, "ADMIN_REQUIRED", "Доступно только админам");
    }
}

function validateTitle(value: unknown) {
    const title = String(value ?? "").trim();
    if (title.length < 1 || title.length > 128) {
        throw new HttpError(
            400,
            "INVALID_TITLE",
            "Название должно содержать от 1 до 128 символов",
        );
    }
    return title;
}

function moderationCaption(submission: {
    id: string;
    submitterUserId: number;
    title: string;
}) {
    return [
        "Новая заявка на реплику",
        `Название: ${submission.title}`,
        `Автор: ${submission.submitterUserId}`,
        `ID: ${submission.id}`,
    ].join("\n");
}

async function requireConsent(userId: number) {
    if ((await database(() => getUserIsIgnoredStatus(userId))) !== false) {
        throw new HttpError(
            403,
            "CONSENT_REQUIRED",
            "Сначала подтвердите согласие на хранение данных",
        );
    }
}

export const routes = new Hono<ApiEnv>()
    .get("/me", async (c) => {
        const user = c.var.user;
        const consent =
            (await database(() => getUserIsIgnoredStatus(user.id))) === false;
        return c.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            isAdmin: c.var.isAdmin,
            hasConsent: consent,
        });
    })
    .get("/me/profile", async (c) => {
        const user = await database(() => getUserData(c.var.user.id));
        return c.json(toUserProfile(user));
    })
    .put("/me/consent", async (c) => {
        const user = c.var.user;
        await database(() =>
            optInUser({
                userId: user.id,
                fullname: fullname(user),
                username: user.username ?? null,
            }),
        );
        return c.json({ ok: true });
    })
    .delete("/me/consent", async (c) => {
        await database(() => optOutUser(c.var.user.id));
        return c.json({ ok: true });
    })
    .get("/stats", async (c) => {
        const {
            mostUsedUsersStats,
            lastUsedUsersStats,
            mostUsedVoicesStats,
            ...stats
        } = await database(() => getFullStats());
        return c.json(stats);
    })
    .get("/leaderboards", async (c) => {
        const { mostUsedUsersStats, lastUsedUsersStats, mostUsedVoicesStats } =
            await database(() => getFullStats());
        const mapUser = (user: (typeof mostUsedUsersStats)[number]) =>
            c.var.isAdmin
                ? {
                      visibility: "full" as const,
                      fullname: user.fullname,
                      username: user.username,
                      usesAmount: user.usesAmount,
                      lastUsedAt: user.lastUsedAt,
                  }
                : {
                      visibility: "masked" as const,
                      displayName: maskName(user.fullname),
                      usesAmount: user.usesAmount,
                      lastUsedAt: user.lastUsedAt,
                  };
        return c.json({
            mostUsedUsers: mostUsedUsersStats.map(mapUser),
            lastUsedUsers: lastUsedUsersStats.map(mapUser),
            mostUsedVoices: mostUsedVoicesStats,
        });
    })
    .get("/admin/submissions", async (c) => {
        requireAdmin(c.var.isAdmin);
        const bucket =
            c.req.query("bucket") === "history" ? "history" : "queue";
        const { offset, limit } = parsePagination({
            offset: c.req.query("offset"),
            limit: c.req.query("limit"),
        });
        const rows = await database(() =>
            getAdminVoiceSubmissions({
                bucket,
                limit: limit + 1,
                offset,
            }),
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
        if (!submission) {
            throw new HttpError(
                409,
                "SUBMISSION_NOT_EDITABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }
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
        if (reason.length > 512) {
            throw new HttpError(
                400,
                "INVALID_REJECTION_REASON",
                "Причина отклонения не должна превышать 512 символов",
            );
        }
        const submission = await database(() =>
            rejectVoiceSubmission(
                c.req.param("id"),
                c.var.user.id,
                reason || undefined,
            ),
        );
        if (!submission) {
            throw new HttpError(
                409,
                "SUBMISSION_NOT_ACTIONABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }
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
        if (!isValidVoiceId(voiceId)) {
            throw new HttpError(
                400,
                "INVALID_VOICE_ID",
                "ID должен содержать от 1 до 64 латинских букв, цифр, _ или -",
            );
        }
        const trim = parseTrimInput(body);
        const claimed = await database(() =>
            claimVoiceSubmission(c.req.param("id"), c.var.user.id, title),
        );
        if (!claimed) {
            throw new HttpError(
                409,
                "SUBMISSION_NOT_ACTIONABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }

        let sent: Awaited<ReturnType<typeof convertAndSendVoice>> | undefined;
        try {
            if (!claimed.sourceFileId) {
                throw new HttpError(
                    404,
                    "SUBMISSION_AUDIO_NOT_FOUND",
                    "Исходный файл заявки не найден",
                );
            }
            const source = await getTelegramFile(claimed.sourceFileId);
            if (!source.ok) {
                throw new HttpError(
                    503,
                    "TELEGRAM_UNAVAILABLE",
                    "Не удалось загрузить аудио заявки",
                );
            }
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
            if (sourceChatId && sourceMessageId) {
                await bestEffortTelegram(
                    c.var.requestId,
                    "delete_approved_submission",
                    () => deleteTelegramMessage(sourceChatId, sourceMessageId),
                );
            }
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
            if (sentVoice) {
                await bestEffortTelegram(
                    c.var.requestId,
                    "compensate_approved_voice",
                    () =>
                        deleteTelegramMessage(
                            sentVoice.chatId,
                            sentVoice.messageId,
                        ),
                );
            }
            await database(() => releaseVoiceSubmission(claimed.id));
            throw error;
        }
    })
    .post(
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
            const voiceId = String(form.get("voiceId") ?? "").trim();
            if (!isValidVoiceId(voiceId)) {
                throw new HttpError(
                    400,
                    "INVALID_VOICE_ID",
                    "ID должен содержать от 1 до 64 латинских букв, цифр, _ или -",
                );
            }
            if (await database(() => getVoiceById(voiceId))) {
                throw new HttpError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID уже существует",
                );
            }
            const file = form.get("file");
            if (!(file instanceof File)) {
                throw new HttpError(400, "INVALID_FILE", "Выберите MP3-файл");
            }
            await validateMp3Upload(file);
            const trim = parseTrimInput({
                startMs: form.get("startMs"),
                endMs: form.get("endMs"),
            });
            const addedBy = c.var.user.username
                ? `@${c.var.user.username}`
                : fullname(c.var.user);
            const sent = await convertAndSendVoice({
                bytes: new Uint8Array(await file.arrayBuffer()),
                caption: [
                    `ID: ${voiceId}`,
                    `Название: ${title}`,
                    `Добавлено модератором: ${addedBy}`,
                ].join("\n"),
                trim,
            });
            const added = await database(() =>
                addVoice({
                    voiceId,
                    voiceTitle: title,
                    fileId: sent.fileId,
                    fileUniqueId: sent.fileUniqueId,
                }),
            ).catch(async (error) => {
                await bestEffortTelegram(
                    c.var.requestId,
                    "compensate_admin_voice",
                    () => deleteTelegramMessage(sent.chatId, sent.messageId),
                );
                throw error;
            });
            if (!added) {
                await bestEffortTelegram(
                    c.var.requestId,
                    "delete_conflicting_admin_voice",
                    () => deleteTelegramMessage(sent.chatId, sent.messageId),
                );
                throw new HttpError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID или файлом уже существует",
                );
            }
            return c.json({ ok: true as const, voiceId }, 201);
        },
    )
    .get("/voices", async (c) => {
        const query = parseVoiceSearchQuery(c.req.query("query"));
        const { offset, limit } = parsePagination({
            offset: c.req.query("offset"),
            limit: c.req.query("limit"),
        });
        const favoritesUserId =
            (await database(() => getUserIsIgnoredStatus(c.var.user.id))) ===
            false
                ? c.var.user.id
                : undefined;
        const items = await database(() =>
            getVoicesPage({
                favoritesUserId,
                limit: limit + 1,
                offset,
                onlyFavorites: c.req.query("sort") === "favorites",
                orderUsesFirst: c.req.query("sort") === "popularity",
                query,
            }),
        );
        return c.json({
            items: items
                .slice(0, limit)
                .map(
                    ({
                        fileId: _fileId,
                        fileUniqueId: _fileUniqueId,
                        ...voice
                    }) => voice,
                ),
            nextOffset: items.length > limit ? offset + limit : null,
        });
    })
    .get("/voices/:voiceId/audio", async (c) => {
        const voice = await database(() =>
            getVoiceById(c.req.param("voiceId")),
        );
        if (!voice)
            throw new HttpError(404, "VOICE_NOT_FOUND", "Реплика не найдена");
        const response = await getTelegramFile(voice.fileId);
        if (!response.ok || !response.body) {
            throw new HttpError(
                503,
                "TELEGRAM_UNAVAILABLE",
                "Не удалось загрузить аудио",
            );
        }
        return new Response(response.body, {
            headers: {
                "cache-control": "private, max-age=300",
                "content-type":
                    response.headers.get("content-type") || "audio/ogg",
            },
        });
    })
    .post("/voices/:voiceId/share", async (c) => {
        const voice = await database(() =>
            getVoiceById(c.req.param("voiceId")),
        );
        if (!voice)
            throw new HttpError(404, "VOICE_NOT_FOUND", "Реплика не найдена");
        const prepared = await prepareVoiceMessage({
            userId: c.var.user.id,
            voiceId: voice.voiceId,
            title: voice.voiceTitle,
            fileId: voice.fileId,
        });
        return c.json({ id: prepared.id });
    })
    .put("/voices/:voiceId/favorite", async (c) => {
        await requireConsent(c.var.user.id);
        const added = await database(() =>
            addUserFavorite({
                userId: c.var.user.id,
                voiceId: c.req.param("voiceId"),
            }),
        );
        if (!added)
            throw new HttpError(
                404,
                "VOICE_NOT_FOUND",
                "Реплика не найдена или уже добавлена",
            );
        return c.json({ ok: true });
    })
    .delete("/voices/:voiceId/favorite", async (c) => {
        await requireConsent(c.var.user.id);
        await database(() =>
            deleteUserFavorite({
                userId: c.var.user.id,
                voiceId: c.req.param("voiceId"),
            }),
        );
        return c.json({ ok: true });
    })
    .get("/submissions", async (c) => {
        await requireConsent(c.var.user.id);
        const submissions = await database(() =>
            getUserVoiceSubmissions(c.var.user.id),
        );
        return c.json(submissions.map(toSubmissionDto));
    })
    .post(
        "/submissions",
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
            await requireConsent(c.var.user.id);
            const form = await c.req.formData();
            const title = String(form.get("title") || "").trim();
            const file = form.get("file");
            if (title.length < 1 || title.length > 128) {
                throw new HttpError(
                    400,
                    "INVALID_TITLE",
                    "Название должно содержать от 1 до 128 символов",
                );
            }
            if (!(file instanceof File)) {
                throw new HttpError(400, "INVALID_FILE", "Выберите MP3-файл");
            }
            await validateMp3Upload(file);
            const id = randomUUID();
            const submission = await database(() =>
                createVoiceSubmission({
                    id,
                    submitterUserId: c.var.user.id,
                    title,
                }),
            );
            if (!submission) {
                throw new HttpError(
                    429,
                    "SUBMISSION_LIMIT",
                    `Можно отправить не более ${SUBMISSION_DAILY_LIMIT} заявок за сутки и иметь не более ${SUBMISSION_PENDING_LIMIT} незавершённых`,
                );
            }
            try {
                const source = await sendSubmissionToModeration({
                    id,
                    title,
                    userId: c.var.user.id,
                    file,
                });
                const pending = await database(() =>
                    markVoiceSubmissionPending(id, source),
                );
                if (!pending)
                    throw new Error("Submission state changed while uploading");
                return c.json(toSubmissionDto(pending), 201);
            } catch (error) {
                await database(() => markVoiceSubmissionFailed(id));
                throw error;
            }
        },
    );
