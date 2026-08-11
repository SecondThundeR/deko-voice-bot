import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";

import { createDatabaseDump, hashFile } from "#root/backup/database.js";
import {
    encryptBackupFile,
    parseBackupEncryptionKey,
} from "#root/backup/encryption.js";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import { createBackupTempPaths } from "#root/backup/paths.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getSafeErrorInfo } from "#root/logging.js";

const composer = new Composer<Context>();
const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "export",
    logHandle("command-export"),
    chatAction("upload_document"),
    async (ctx) => {
        const operationId = randomUUID();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `backup-${timestamp}.dump.enc`;
        const paths = createBackupTempPaths("export");

        try {
            const encryptionKey = parseBackupEncryptionKey(
                ctx.config.backupEncryptionKey,
            );
            const sha256 = await withBackupAdvisoryLock(
                process.env.DATABASE_URL,
                async () => {
                    await createDatabaseDump(
                        process.env.DATABASE_URL,
                        paths.dump,
                    );
                    await encryptBackupFile(
                        paths.dump,
                        paths.encrypted,
                        encryptionKey,
                    );
                    return hashFile(paths.encrypted);
                },
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
            await Promise.allSettled([
                unlink(paths.dump),
                unlink(paths.encrypted),
            ]);
        }
    },
);

export { composer as exportFeature };
