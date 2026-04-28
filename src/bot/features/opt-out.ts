import { Composer } from "grammy";
import { optOutUser } from "@/drizzle/queries/users";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { getFormattedUserData } from "../helpers/user";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optout", logHandle("command-optout"), async (ctx) => {
    const userId = ctx.from.id;
    const lastUserData = await optOutUser(userId);
    if (!lastUserData) return await ctx.reply(ctx.t("optout.failed"));

    await ctx.reply(
        ctx.t("optout.success", getFormattedUserData(lastUserData)),
    );
});

export { composer as optoutFeature };
