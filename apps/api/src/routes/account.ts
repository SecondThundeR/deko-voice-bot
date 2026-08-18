import { Hono } from "hono";
import type { AccountRouteDependencies } from "../dependencies.ts";
import { toUserProfile } from "../profile.ts";
import type { ApiEnv } from "../types.ts";
import { fullname } from "./helpers.ts";

export function createAccountRoutes(deps: AccountRouteDependencies) {
    return new Hono<ApiEnv>()
        .get("/me", async (c) => {
            const user = c.var.user;
            const consent =
                (await deps.database(() =>
                    deps.getUserIsIgnoredStatus(user.id),
                )) === false;
            return c.json({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                isAdmin: c.var.isAdmin,
                hasConsent: consent,
            });
        })
        .get("/me/profile", async (c) =>
            c.json(
                toUserProfile(
                    await deps.database(() => deps.getUserData(c.var.user.id)),
                ),
            ),
        )
        .put("/me/consent", async (c) => {
            const user = c.var.user;
            await deps.database(() =>
                deps.optInUser({
                    userId: user.id,
                    fullname: fullname(user),
                    username: user.username ?? null,
                }),
            );
            return c.json({ ok: true });
        })
        .delete("/me/consent", async (c) => {
            await deps.database(() => deps.optOutUser(c.var.user.id));
            return c.json({ ok: true });
        });
}
