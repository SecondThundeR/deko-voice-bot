import { randomUUID } from "node:crypto";
import {
    createBackupTempPaths,
    removeBackupTempPaths,
} from "@deko-voice-bot/backup";
import { getSafeErrorInfo } from "@deko-voice-bot/shared";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";
import { apiClient } from "#root/api/client.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();
const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "export",
    logHandle("command-export"),
    chatAction("upload_document"),
    async (ctx) => {
        const operationId = randomUUID();
        const paths = await createBackupTempPaths("export");

        try {
            const { fileName, sha256 } = await apiClient.exportDatabase(
                paths.encrypted,
            );

            await ctx.replyWithDocument(
                new InputFile(paths.encrypted, fileName),
                {
                    caption: ctx.t("export-completed", {
                        sha256,
                    }),
                },
            );
            ctx.logger.info({
                msg: "Database export completed",
                operationId,
                sha256,
            });
        } catch (error: unknown) {
            ctx.logger.error({
                msg: "Failed to export data from DB",
                operationId,
                ...getSafeErrorInfo(error),
            });
            return ctx.reply(ctx.t("export-unknown-error", { operationId }));
        } finally {
            await removeBackupTempPaths(paths);
        }
    },
);

export { composer as exportFeature };
