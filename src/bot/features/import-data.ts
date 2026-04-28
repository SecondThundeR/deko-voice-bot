import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer } from "grammy";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { downloadTelegramFileToPath } from "../helpers/api";
import { createDumpTempFilePath, readTextWithLimit } from "../helpers/general";
import { logHandle } from "../helpers/logging";
import {
    isMaintenanceActive,
    setMaintenanceStatus,
} from "../store/maintenance";

export const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);
const MAX_RESTORE_STDERR_BYTES = 16 * 1024;

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

        let restoreFileName: string | null = null;
        let message: Awaited<ReturnType<typeof ctx.reply>> | null = null;

        try {
            message = await ctx.reply(ctx.t("importData.inProgress"));
            const fileData = await ctx.getFile();
            if (!fileData.file_path) {
                throw new Error("Backup file path is missing");
            }

            restoreFileName = createDumpTempFilePath("restore");
            const downloadStatus = await downloadTelegramFileToPath({
                filePath: fileData.file_path,
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
                stdout: null,
            });

            const [exitCode, stderr] = await Promise.all([
                restoreProcess.exited,
                readTextWithLimit(
                    restoreProcess.stderr,
                    MAX_RESTORE_STDERR_BYTES,
                ),
            ]);

            if (exitCode !== 0) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(
                    `pg_restore failed with exit code ${exitCode}:\n${stderr}`,
                );
            }

            await message.editText(ctx.t("importData.done"));
        } catch (error) {
            ctx.logger.error({
                msg: "Import failed. Rollback has been completed",
                error,
            });

            if (error instanceof Error) {
                const errorMessage = ctx.t("importData.error", {
                    errorMessage: error.message,
                });

                if (message) await message.editText(errorMessage);
                else await ctx.reply(errorMessage);
            } else {
                const errorMessage = ctx.t("importData.unknownError");

                if (message) await message.editText(errorMessage);
                else await ctx.reply(errorMessage);
            }
        } finally {
            setMaintenanceStatus(false);

            if (restoreFileName) {
                const file = Bun.file(restoreFileName);
                if (await file.exists()) {
                    await unlink(restoreFileName);
                }
            }
        }
    },
);

export { composer as importDataFeature };
