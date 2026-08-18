import { getFullStats } from "@deko-voice-bot/database/queries/stats.js";
import { Hono } from "hono";
import { maskName } from "../privacy.ts";
import type { ApiEnv } from "../types.ts";
import { database } from "./helpers.ts";

export const statsRoutes = new Hono<ApiEnv>()
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
    });
