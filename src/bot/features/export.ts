import { spawn } from "node:child_process";
import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import {
    createDumpTempFilePath,
    readTextWithLimit,
} from "@/bot/helpers/general";
import { getUpdateInfo, logHandle } from "@/bot/helpers/logging";
import {
    isMaintenanceActive,
    setMaintenanceStatus,
} from "@/bot/store/maintenance";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);
const MAX_DUMP_STDERR_BYTES = 16 * 1024;

feature.command(
    "export",
    logHandle("command-export"),
    chatAction("upload_document"),
    async (ctx) => {
        if (isMaintenanceActive()) {
            return ctx.reply(ctx.t("export.maintenancePending"));
        }

        setMaintenanceStatus(true);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFileName = createDumpTempFilePath(`backup-${timestamp}`);

        try {
            const dumpProcess = spawn(
                "pg_dump",
                [process.env.DATABASE_URL, "-F", "c", "-f", backupFileName],
                {
                    stdio: ["ignore", "ignore", "pipe"],
                },
            );

            const exitCodePromise = new Promise<number>((resolve, reject) => {
                dumpProcess.on("close", (code) => {
                    resolve(code ?? 1);
                });
                dumpProcess.on("error", (err) => {
                    reject(err);
                });
            });

            const [exitCode, stderr] = await Promise.all([
                exitCodePromise,
                readTextWithLimit(dumpProcess.stderr, MAX_DUMP_STDERR_BYTES),
            ]);

            if (exitCode !== 0) {
                return ctx.reply(
                    ctx.t("export.dumpError", { exitCode, stderr }),
                );
            }

            await ctx.replyWithDocument(new InputFile(backupFileName));
        } catch (error: unknown) {
            ctx.logger.error({
                err: `Failed to export data from DB. Details: ${String(error)}`,
                update: getUpdateInfo(ctx),
            });
            return ctx.reply(ctx.t("export.unknownError"));
        } finally {
            setMaintenanceStatus(false);

            unlink(backupFileName).catch(() => {});
        }
    },
);

export { composer as exportFeature };
