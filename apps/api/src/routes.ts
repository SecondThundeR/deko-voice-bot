import { randomUUID } from "node:crypto";
import {
    MAX_SUBMISSION_FILE_BYTES,
    SUBMISSION_DAILY_LIMIT,
    SUBMISSION_PENDING_LIMIT,
} from "@deko-voice-bot/contracts";
import { getFullStats } from "@deko-voice-bot/database/queries/stats.js";
import {
    createVoiceSubmission,
    getUserVoiceSubmissions,
    markVoiceSubmissionFailed,
    markVoiceSubmissionPending,
    toSubmissionDto,
} from "@deko-voice-bot/database/queries/submissions.js";
import {
    getUserIsIgnoredStatus,
    optInUser,
    optOutUser,
} from "@deko-voice-bot/database/queries/users.js";
import {
    addUserFavorite,
    deleteUserFavorite,
} from "@deko-voice-bot/database/queries/users-favorites.js";
import {
    getVoiceById,
    getVoicesPage,
} from "@deko-voice-bot/database/queries/voices.js";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HttpError } from "./errors.ts";
import { maskName } from "./privacy.ts";
import { getTelegramFile, sendSubmissionToModeration } from "./telegram.ts";
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
            orderFavoritesFirst: c.req.query("sort") === "favorites",
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
