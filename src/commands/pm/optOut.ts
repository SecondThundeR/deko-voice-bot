import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import { addIgnoredUser } from "@/src/database/general/ignoredUsers/addIgnoredUser";

import { getOptOutMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

export const optOutCommand = new Composer<BotContext>();

optOutCommand.command("optout", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToFindUserData"));
    }

    const currentUserID = ctx.from.id;

    try {
        const lastUserData = await addIgnoredUser(currentUserID);
        if (!lastUserData) return await ctx.reply(ctx.t("optout.failed"));

        const successText = getOptOutMessageText(ctx, lastUserData);

        await ctx.reply(successText, {
            parse_mode: "HTML",
        });
    } catch (error) {
        console.log(
            `Failed process opt out for "${currentUserID}": ${
                (error as Error).message
            }`,
        );

        await ctx.reply(ctx.t("optout.exception"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }
});
