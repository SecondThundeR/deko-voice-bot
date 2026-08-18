import {
    getUserData,
    getUserIsIgnoredStatus,
    optInUser,
    optOutUser,
} from "@deko-voice-bot/database/queries/users.js";
import { Hono } from "hono";
import { toUserProfile } from "../profile.ts";
import type { ApiEnv } from "../types.ts";
import { database, fullname } from "./helpers.ts";

export const accountRoutes = new Hono<ApiEnv>()
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
    });
