import { Composer } from "grammy";
import { unlink } from "node:fs/promises";

import { fetchMediaFileData, getMessageEditCallback } from "@/src/helpers/api";

import type { BotContext } from "@/src/types/bot";

export const importDataHandler = new Composer<BotContext>();

importDataHandler.on("msg:document", async (ctx) => {
    if (ctx.session.isDatabaseMaintenanceActive) {
        return ctx.reply(ctx.t("importData.maintenancePending"));
    }

    const document = ctx.msg.document;
    if (
        !document.file_name?.endsWith(".dump") &&
        document.mime_type !== "application/octet-stream"
    ) {
        return;
    }

    ctx.session.isDatabaseMaintenanceActive = true;
    await ctx.replyWithChatAction("typing");

    const message = await ctx.reply(ctx.t("importData.inProgress"));
    const editMessage = getMessageEditCallback(ctx, message);

    const fileData = await ctx.getFile();
    const fileBlob = await fetchMediaFileData({
        filePath: fileData.file_path!,
        token: ctx.api.token,
        returnType: "blob",
    });
    const restoreFileName = `${fileData.file_id}.dump`;

    try {
        await Bun.write(restoreFileName, fileBlob);

        const restoreProcess = Bun.spawn({
            cmd: [
                "pg_restore",
                "-d",
                process.env.DATABASE_URL,
                "--single-transaction",
                "--clean",
                "--if-exists",
                "--no-owner",
                restoreFileName,
            ],
        });

        const exitCode = await restoreProcess.exited;

        if (exitCode !== 0) {
            await unlink(restoreFileName);
            const stderr = await new Response(restoreProcess.stderr).text();
            throw new Error(
                `pg_restore failed with exit code ${exitCode}:\n${stderr}`,
            );
        }

        await editMessage(ctx.t("importData.done"));
    } catch (error) {
        console.error(
            "Import failed. Rollback has been completed. Details:",
            error,
        );

        if (error instanceof Error) {
            await editMessage(
                ctx.t("importData.error", {
                    errorMessage: error.message,
                }),
                {
                    parse_mode: "HTML",
                },
            );
        } else {
            await editMessage(ctx.t("importData.unknownError"));
        }
    } finally {
        ctx.session.isDatabaseMaintenanceActive = false;

        const file = Bun.file(restoreFileName);
        if (await file.exists()) {
            await unlink(restoreFileName);
        }
    }
});
