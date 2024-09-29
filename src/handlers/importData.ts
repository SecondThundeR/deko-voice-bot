import { Composer } from "grammy";
import { DrizzleError } from "drizzle-orm";

import { fetchMediaFileJSON, getMessageEditCallback } from "@/src/helpers/api";
import { importDBTransactionHelper } from "@/src/helpers/database";
import { isMimeTypeJson } from "@/src/helpers/general";

import { importFileSchema } from "@/src/schema/importFile";

import type { BotContext } from "@/src/types/bot";

export const importDataHandler = new Composer<BotContext>();

importDataHandler.on("msg:document", async (ctx) => {
    const document = ctx.msg.document;
    if (!isMimeTypeJson(document?.mime_type)) return;

    await ctx.replyWithChatAction("typing");

    const message = await ctx.reply(ctx.t("importData.inProgress"));
    const editMessage = getMessageEditCallback(ctx, message);

    const fileData = await ctx.getFile();
    const fileJSON = await fetchMediaFileJSON(
        fileData.file_path!,
        ctx.api.token,
    );

    const { data, success } = await importFileSchema.safeParseAsync(fileJSON);
    if (!success) {
        return await editMessage(ctx.t("importData.validationFailed"));
    }

    try {
        await importDBTransactionHelper(ctx, editMessage, data);
    } catch (error) {
        if (error instanceof DrizzleError) {
            console.log("Import failed. Rollback has been completed");
        }
    }
});
