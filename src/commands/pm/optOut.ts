import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import { addIgnoredUser } from "@/src/database/general/ignoredUsers/addIgnoredUser";

import { getOptOutMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

export const optOutCommand = new Composer<BotContext>();

optOutCommand.command("optout", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const currentUserID = ctx.from.id;

    try {
        const lastUserData = await addIgnoredUser(currentUserID);
        if (!lastUserData) return await ctx.reply(ctx.t("optout.failed"));

        await ctx.reply(getOptOutMessageText(ctx, lastUserData), {
            parse_mode: "HTML",
        });
    } catch (error: unknown) {
        let errorMessage = `User "${currentUserID}" failed to opt out. Details: `;

        if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += JSON.stringify(error, null, 4);
        }

        console.error(errorMessage);
        await ctx.reply(ctx.t("optout.exception"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }
});
