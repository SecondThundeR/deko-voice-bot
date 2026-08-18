import { Hono } from "hono";
import type { StatsRouteDependencies } from "../dependencies/types.ts";
import { maskName } from "../domain/privacy.ts";
import type { ApiEnv } from "../types.ts";

export function createStatsRoutes(deps: StatsRouteDependencies) {
    return new Hono<ApiEnv>()
        .get("/stats", async (c) => {
            const {
                mostUsedUsersStats,
                lastUsedUsersStats,
                mostUsedVoicesStats,
                ...stats
            } = await deps.database(() => deps.getFullStats());
            return c.json(stats);
        })
        .get("/leaderboards", async (c) => {
            const {
                mostUsedUsersStats,
                lastUsedUsersStats,
                mostUsedVoicesStats,
            } = await deps.database(() => deps.getFullStats());
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
}
