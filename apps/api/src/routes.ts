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
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { convertAndSendVoice, parseTrimInput } from "./audio.ts";
import { HttpError } from "./errors.ts";
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

function fullname(user: ApiEnv["Variables"]["user"]) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

function validateMp3(file: File, bytes: Uint8Array) {
    const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const hasFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    return (
        file.type === "audio/mpeg" &&
        file.size > 0 &&
        file.size <= MAX_SUBMISSION_FILE_BYTES &&
        (hasId3 || hasFrame)
    );
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
    if ((await getUserIsIgnoredStatus(userId)) !== false) {
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
        const consent = (await getUserIsIgnoredStatus(user.id)) === false;
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
        const user = await getUserData(c.var.user.id);
        return c.json(toUserProfile(user));
    })
    .put("/me/consent", async (c) => {
        const user = c.var.user;
        await optInUser({
            userId: user.id,
            fullname: fullname(user),
            username: user.username ?? null,
        });
        return c.json({ ok: true });
    })
    .delete("/me/consent", async (c) => {
        await optOutUser(c.var.user.id);
        return c.json({ ok: true });
    })
    .get("/stats", async (c) => {
        const {
            mostUsedUsersStats,
            lastUsedUsersStats,
            mostUsedVoicesStats,
            ...stats
        } = await getFullStats();
        return c.json(stats);
    })
    .get("/leaderboards", async (c) => {
        const { mostUsedUsersStats, lastUsedUsersStats, mostUsedVoicesStats } =
            await getFullStats();
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
        const offset = Math.max(0, Number(c.req.query("offset")) || 0);
        const limit = Math.min(
            50,
            Math.max(1, Number(c.req.query("limit")) || 20),
        );
        const rows = await getAdminVoiceSubmissions({
            bucket,
            limit: limit + 1,
            offset,
        });
        return c.json({
            items: rows.slice(0, limit).map(toAdminSubmissionDto),
            nextOffset: rows.length > limit ? offset + limit : null,
        });
    })
    .get("/admin/submissions/:id/audio", async (c) => {
        requireAdmin(c.var.isAdmin);
        const submission = await getVoiceSubmission(c.req.param("id"));
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
        const submission = await updateVoiceSubmissionTitle(
            c.req.param("id"),
            title,
        );
        if (!submission) {
            throw new HttpError(
                409,
                "SUBMISSION_NOT_EDITABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }
        if (submission.sourceChatId && submission.sourceMessageId) {
            await editTelegramCaption(
                submission.sourceChatId,
                submission.sourceMessageId,
                moderationCaption(submission),
            ).catch(() => {});
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
        const submission = await rejectVoiceSubmission(
            c.req.param("id"),
            c.var.user.id,
            reason || undefined,
        );
        if (!submission) {
            throw new HttpError(
                409,
                "SUBMISSION_NOT_ACTIONABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }
        if (submission.sourceChatId && submission.sourceMessageId) {
            await deleteTelegramMessage(
                submission.sourceChatId,
                submission.sourceMessageId,
            ).catch(() => {});
        }
        await sendTelegramMessage(
            submission.submitterUserId,
            `Ваша заявка «${submission.title}» отклонена.${reason ? ` Причина: ${reason}` : ""}`,
        ).catch(() => {});
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
        const claimed = await claimVoiceSubmission(
            c.req.param("id"),
            c.var.user.id,
            title,
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
            sent = await convertAndSendVoice({
                bytes: new Uint8Array(await source.arrayBuffer()),
                caption: `Одобрено: ${title}`,
                trim,
            });
            const approved = await approveVoiceSubmission(claimed.id, {
                voiceId,
                voiceTitle: title,
                fileId: sent.fileId,
                fileUniqueId: sent.fileUniqueId,
            });
            if (!approved) {
                await deleteTelegramMessage(sent.chatId, sent.messageId).catch(
                    () => {},
                );
                throw new HttpError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID или файлом уже существует",
                );
            }
            if (claimed.sourceChatId && claimed.sourceMessageId) {
                await deleteTelegramMessage(
                    claimed.sourceChatId,
                    claimed.sourceMessageId,
                ).catch(() => {});
            }
            await sendTelegramMessage(
                claimed.submitterUserId,
                `Ваша заявка «${title}» одобрена и добавлена в каталог`,
            ).catch(() => {});
            return c.json(toSubmissionDto(approved));
        } catch (error) {
            if (sent) {
                await deleteTelegramMessage(sent.chatId, sent.messageId).catch(
                    () => {},
                );
            }
            await releaseVoiceSubmission(claimed.id);
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
            if (await getVoiceById(voiceId)) {
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
            const signature = new Uint8Array(
                await file.slice(0, 3).arrayBuffer(),
            );
            if (!validateMp3(file, signature)) {
                throw new HttpError(
                    400,
                    "INVALID_FILE",
                    "Поддерживаются MP3-файлы размером до 20 МБ",
                );
            }
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
            const added = await addVoice({
                voiceId,
                voiceTitle: title,
                fileId: sent.fileId,
                fileUniqueId: sent.fileUniqueId,
            }).catch(async (error) => {
                await deleteTelegramMessage(sent.chatId, sent.messageId).catch(
                    () => {},
                );
                throw error;
            });
            if (!added) {
                await deleteTelegramMessage(sent.chatId, sent.messageId).catch(
                    () => {},
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
        const query = c.req.query("query")?.trim();
        const offset = Math.max(0, Number(c.req.query("offset")) || 0);
        const limit = Math.min(
            50,
            Math.max(1, Number(c.req.query("limit")) || 20),
        );
        const favoritesUserId =
            (await getUserIsIgnoredStatus(c.var.user.id)) === false
                ? c.var.user.id
                : undefined;
        const items = await getVoicesPage({
            favoritesUserId,
            limit: limit + 1,
            offset,
            onlyFavorites: c.req.query("sort") === "favorites",
            orderUsesFirst: c.req.query("sort") === "popularity",
            query,
        });
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
        const voice = await getVoiceById(c.req.param("voiceId"));
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
        const voice = await getVoiceById(c.req.param("voiceId"));
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
        const added = await addUserFavorite({
            userId: c.var.user.id,
            voiceId: c.req.param("voiceId"),
        });
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
        await deleteUserFavorite({
            userId: c.var.user.id,
            voiceId: c.req.param("voiceId"),
        });
        return c.json({ ok: true });
    })
    .get("/submissions", async (c) => {
        await requireConsent(c.var.user.id);
        const submissions = await getUserVoiceSubmissions(c.var.user.id);
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
            const signature = new Uint8Array(
                await file.slice(0, 3).arrayBuffer(),
            );
            if (!validateMp3(file, signature)) {
                throw new HttpError(
                    400,
                    "INVALID_FILE",
                    "Поддерживаются MP3-файлы размером до 20 МБ",
                );
            }
            const id = randomUUID();
            const submission = await createVoiceSubmission({
                id,
                submitterUserId: c.var.user.id,
                title,
            });
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
                const pending = await markVoiceSubmissionPending(id, source);
                if (!pending)
                    throw new Error("Submission state changed while uploading");
                return c.json(toSubmissionDto(pending), 201);
            } catch (error) {
                await markVoiceSubmissionFailed(id);
                throw error;
            }
        },
    );
