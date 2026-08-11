import { spawn } from "node:child_process";
import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import {
    createDumpTempFilePath,
    readTextWithLimit,
} from "#root/bot/helpers/general.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import {
    isMaintenanceActive,
    setMaintenanceStatus,
} from "#root/bot/store/maintenance.js";
import { getSafeErrorInfo } from "#root/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);
const MAX_DUMP_STDERR_BYTES = 16 * 1024;

feature.command(
    "export",
    logHandle("command-export"),
    chatAction("upload_document"),
    async (ctx) => {
        if (isMaintenanceActive()) {
            return ctx.reply(ctx.t("export-maintenance-pending"));
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
                    ctx.t("export-error", {
                        exitCode,
                        stderr: escapeHTML(stderr),
                    }),
                );
            }

            await ctx.replyWithDocument(new InputFile(backupFileName));
            ctx.logger.info({ msg: "Database export completed" });
        } catch (error: unknown) {
            ctx.logger.error({
                msg: "Failed to export data from DB",
                ...getSafeErrorInfo(error),
            });
            return ctx.reply(ctx.t("export-unknown-error"));
        } finally {
            setMaintenanceStatus(false);

            unlink(backupFileName).catch(() => {});
        }
    },
);

export { composer as exportFeature };
