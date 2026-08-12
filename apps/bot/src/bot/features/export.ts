import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { databaseUrl } from "@deko-voice-bot/database/env.js";
import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer, InputFile } from "grammy";

import { createEncryptedDatabaseBackup } from "#root/backup/create.js";
import { parseBackupEncryptionKey } from "#root/backup/encryption.js";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import {
    createBackupTempPaths,
    createDatedBackupFileName,
} from "#root/backup/paths.js";
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
        const fileName = createDatedBackupFileName("backup");
        const paths = createBackupTempPaths("export");

        try {
            const encryptionKey = parseBackupEncryptionKey(
                ctx.config.backupEncryptionKey,
            );
            const sha256 = await withBackupAdvisoryLock(databaseUrl, () =>
                createEncryptedDatabaseBackup({
                    databaseUrl,
                    encryptionKey,
                    paths,
                }),
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
                unlink(paths.package),
                unlink(paths.encrypted),
            ]);
        }
    },
);

export { composer as exportFeature };
