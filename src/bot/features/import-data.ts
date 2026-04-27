import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer } from "grammy";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { downloadTelegramFileToPath } from "../helpers/api";
import { logHandle } from "../helpers/logging";
import {
    isMaintenanceActive,
    setMaintenanceStatus,
} from "../store/maintenance";

export const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.on(
    "msg:document",
    logHandle("import-data-document"),
    chatAction("typing"),
    async (ctx) => {
        if (isMaintenanceActive()) {
            return ctx.reply(ctx.t("importData.maintenancePending"));
        }

        const document = ctx.msg.document;
        if (
            !document.file_name?.endsWith(".dump") &&
            document.mime_type !== "application/octet-stream"
        ) {
            return;
        }

        setMaintenanceStatus(true);

        const message = await ctx.reply(ctx.t("importData.inProgress"));
        const fileData = await ctx.getFile();
        const restoreFileName = `${fileData.file_id}.dump`;

        try {
            const downloadStatus = await downloadTelegramFileToPath({
                filePath: fileData.file_path ?? "",
                outputPath: restoreFileName,
                token: ctx.api.token,
            });

            if (!downloadStatus) {
                throw new Error("Failed to download backup file");
            }

            const restoreProcess = Bun.spawn({
                cmd: [
                    "pg_restore",
                    "-d",
                    Bun.env.DATABASE_URL,
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
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(
                    `pg_restore failed with exit code ${exitCode}:\n${stderr}`,
                );
            }

            await message.editText(ctx.t("importData.done"));
        } catch (error) {
            console.error(
                "Import failed. Rollback has been completed. Details:",
                error,
            );

            if (error instanceof Error) {
                await message.editText(
                    ctx.t("importData.error", {
                        errorMessage: error.message,
                    }),
                );
            } else {
                await message.editText(ctx.t("importData.unknownError"));
            }
        } finally {
            setMaintenanceStatus(false);

            const file = Bun.file(restoreFileName);
            if (await file.exists()) {
                await unlink(restoreFileName);
            }
        }
    },
);

export { composer as importDataFeature };
