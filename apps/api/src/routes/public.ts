import { getUserIsIgnoredStatus } from "@deko-voice-bot/database/queries/users.js";
import {
    addUserFavorite,
    deleteUserFavorite,
} from "@deko-voice-bot/database/queries/users-favorites.js";
import {
    getVoiceById,
    getVoicesPage,
} from "@deko-voice-bot/database/queries/voices.js";
import { Hono } from "hono";
import { HttpError } from "../errors.ts";
import { parsePagination, parseVoiceSearchQuery } from "../pagination.ts";
import { getTelegramFile, prepareVoiceMessage } from "../telegram.ts";
import type { ApiEnv } from "../types.ts";
import { database, requireConsent } from "./helpers.ts";

export const publicRoutes = new Hono<ApiEnv>()
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
        if (!response.ok || !response.body)
            throw new HttpError(
                503,
                "TELEGRAM_UNAVAILABLE",
                "Не удалось загрузить аудио",
            );
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
    });
