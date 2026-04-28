import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { readTextWithLimit } from "../helpers/general";
import { getUpdateInfo, logHandle } from "../helpers/logging";
import {
    getCachedMaintenanceFeatureFlag,
    setCachedMaintenanceFeatureFlag,
} from "../store/maintenance";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);
const MAX_DUMP_STDERR_BYTES = 16 * 1024;

feature.command(
    "export",
    logHandle("command-export"),
    chatAction("upload_document"),
    async (ctx) => {
        if (getCachedMaintenanceFeatureFlag()) {
            return ctx.reply(ctx.t("export.maintenancePending"));
        }

        setCachedMaintenanceFeatureFlag(true);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFileName = `backup-${timestamp}.dump`;

        try {
            const dumpProcess = Bun.spawn({
                cmd: [
                    "pg_dump",
                    Bun.env.DATABASE_URL,
                    "-F",
                    "c",
                    "-f",
                    backupFileName,
                ],
                stdout: null,
            });

            const [exitCode, stderr] = await Promise.all([
                dumpProcess.exited,
                readTextWithLimit(dumpProcess.stderr, MAX_DUMP_STDERR_BYTES),
            ]);

            if (exitCode !== 0) {
                await ctx.reply(
                    ctx.t("export.dumpError", { exitCode, stderr }),
                );
                return;
            }

            await ctx.replyWithDocument(new InputFile(backupFileName));
        } catch (error: unknown) {
            ctx.logger.error({
                err: `Failed to export data from DB. Details: ${String(error)}`,
                update: getUpdateInfo(ctx),
            });
            await ctx.reply(ctx.t("export.unknownError"));
        } finally {
            setCachedMaintenanceFeatureFlag(false);

            const file = Bun.file(backupFileName);
            if (await file.exists()) {
                await unlink(backupFileName);
            }
        }
    },
);

export { composer as exportFeature };
