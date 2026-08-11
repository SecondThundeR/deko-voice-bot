import { randomUUID } from "node:crypto";
import { stat, unlink } from "node:fs/promises";
import { Composer, InlineKeyboard, InputFile } from "grammy";

import {
    createDatabaseDump,
    hashFile,
    restoreDatabaseDump,
    validateDatabaseDump,
    validateRestoredDatabase,
} from "#root/backup/database.js";
import {
    decryptBackupFile,
    ENCRYPTED_BACKUP_EXTENSION,
    encryptBackupFile,
    parseBackupEncryptionKey,
} from "#root/backup/encryption.js";
import { BackupOperationBusyError } from "#root/backup/errors.js";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import { createBackupTempPaths } from "#root/backup/paths.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { downloadTelegramFileToPath } from "#root/bot/helpers/api.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import {
    beginDatabaseImportMaintenance,
    endDatabaseImportMaintenance,
} from "#root/bot/store/database-traffic.js";
import { importSessions } from "#root/bot/store/import-sessions.js";
import { setCachedMaintenanceFeatureFlag } from "#root/bot/store/maintenance.js";
import { getSafeErrorInfo } from "#root/logging.js";

const IMPORT_CALLBACK = /^import:(confirm|cancel):([0-9a-f-]{36})$/;

export const composer = new Composer<Context>();
const feature = composer.chatType("private").filter(isAdmin);

function getImportSessionTtlMs(ctx: Context) {
    return ctx.config.importSessionTtlMinutes * 60 * 1_000;
}

function getMaxBackupBytes(ctx: Context) {
    return ctx.config.backupMaxSizeMb * 1024 * 1024;
}

feature.command("import", logHandle("command-import"), async (ctx) => {
    await importSessions.start(
        ctx.from.id,
        ctx.chat.id,
        getImportSessionTtlMs(ctx),
    );
    return ctx.reply(
        ctx.t("import-awaiting-file", {
            maxSizeMb: ctx.config.backupMaxSizeMb,
            ttlMinutes: ctx.config.importSessionTtlMinutes,
        }),
    );
});

feature.on(
    "msg:document",
    logHandle("import-data-document"),
    async (ctx, next) => {
        const session = importSessions.takeAwaitingFile(
            ctx.from.id,
            ctx.chat.id,
        );
        if (!session) {
            return next();
        }

        const paths = createBackupTempPaths("restore");
        const maxBytes = getMaxBackupBytes(ctx);
        const document = ctx.msg.document;

        try {
            if (!document.file_name?.endsWith(ENCRYPTED_BACKUP_EXTENSION)) {
                return ctx.reply(ctx.t("import-invalid-file-type"));
            }
            if (document.file_size && document.file_size > maxBytes) {
                return ctx.reply(
                    ctx.t("import-file-too-large", {
                        maxSizeMb: ctx.config.backupMaxSizeMb,
                    }),
                );
            }

            const statusMessage = await ctx.reply(ctx.t("import-validating"));
            const fileData = await ctx.getFile();
            if (!fileData.file_path) {
                throw new Error("Backup file path is missing");
            }

            const downloaded = await downloadTelegramFileToPath(
                fileData.file_path,
                paths.encrypted,
                ctx.api.token,
                maxBytes,
            );
            if (!downloaded) {
                throw new Error("Failed to download backup file");
            }

            const encryptionKey = parseBackupEncryptionKey(
                ctx.config.backupEncryptionKey,
            );
            await decryptBackupFile(paths.encrypted, paths.dump, encryptionKey);
            await validateDatabaseDump(paths.dump);

            const [sha256, fileStats] = await Promise.all([
                hashFile(paths.encrypted),
                stat(paths.encrypted),
            ]);
            importSessions.addAwaitingConfirmation(session, {
                dumpPath: paths.dump,
                encryptedPath: paths.encrypted,
                sha256,
                size: fileStats.size,
            });

            const keyboard = new InlineKeyboard()
                .text(
                    ctx.t("import-confirm-button"),
                    `import:confirm:${session.operationId}`,
                )
                .text(
                    ctx.t("import-cancel-button"),
                    `import:cancel:${session.operationId}`,
                );
            return statusMessage.editText(
                ctx.t("import-confirmation", {
                    sha256,
                    sizeMb: (fileStats.size / 1024 / 1024).toFixed(2),
                }),
                { reply_markup: keyboard },
            );
        } catch (error: unknown) {
            await importSessions.cancel(ctx.from.id, ctx.chat.id);
            await Promise.allSettled([
                unlink(paths.dump),
                unlink(paths.encrypted),
            ]);
            ctx.logger.warn({
                msg: "Database import file validation failed",
                operationId: session.operationId,
                ...getSafeErrorInfo(error),
            });
            return ctx.reply(ctx.t("import-validation-failed"));
        }
    },
);

feature.callbackQuery(
    IMPORT_CALLBACK,
    logHandle("import-data-confirmation"),
    async (ctx) => {
        const [, action, operationId] = ctx.match;
        const session = importSessions.takeForConfirmation(
            ctx.from.id,
            ctx.chat.id,
            operationId,
        );
        if (!session) {
            return ctx.answerCallbackQuery({
                text: ctx.t("import-session-expired"),
                show_alert: true,
            });
        }

        await ctx.answerCallbackQuery().catch((error: unknown) => {
            ctx.logger.warn({
                msg: "Failed to answer database import callback query",
                operationId: session.operationId,
                ...getSafeErrorInfo(error),
            });
        });
        if (action === "cancel") {
            await Promise.allSettled([
                unlink(session.dumpPath),
                unlink(session.encryptedPath),
            ]);
            return ctx.editMessageText(ctx.t("import-cancelled"));
        }

        const runtimeOperationId = randomUUID();
        const emergencyPaths = createBackupTempPaths("pre-import");
        let maintenanceStarted = false;

        try {
            await ctx.editMessageText(ctx.t("import-preparing"));
            maintenanceStarted = await beginDatabaseImportMaintenance();
            if (!maintenanceStarted) {
                throw new BackupOperationBusyError();
            }

            const encryptionKey = parseBackupEncryptionKey(
                ctx.config.backupEncryptionKey,
            );
            await withBackupAdvisoryLock(process.env.DATABASE_URL, async () => {
                await createDatabaseDump(
                    process.env.DATABASE_URL,
                    emergencyPaths.dump,
                );
                await encryptBackupFile(
                    emergencyPaths.dump,
                    emergencyPaths.encrypted,
                    encryptionKey,
                );
                const emergencySha256 = await hashFile(
                    emergencyPaths.encrypted,
                );

                const timestamp = new Date()
                    .toISOString()
                    .replace(/[:.]/g, "-");
                await ctx.replyWithDocument(
                    new InputFile(
                        emergencyPaths.encrypted,
                        `pre-import-${timestamp}.dump.enc`,
                    ),
                    {
                        caption: ctx.t("import-emergency-backup", {
                            sha256: emergencySha256,
                        }),
                    },
                );

                await restoreDatabaseDump(
                    process.env.DATABASE_URL,
                    session.dumpPath,
                );
                setCachedMaintenanceFeatureFlag(null);
                await validateRestoredDatabase(process.env.DATABASE_URL);
            });

            ctx.logger.info({
                msg: "Database import completed",
                operationId: runtimeOperationId,
                sourceSha256: session.sha256,
                sourceSize: session.size,
            });
            return ctx.reply(ctx.t("import-completed"));
        } catch (error: unknown) {
            ctx.logger.error({
                msg: "Database import failed",
                operationId: runtimeOperationId,
                sourceSha256: session.sha256,
                sourceSize: session.size,
                ...getSafeErrorInfo(error),
            });
            return ctx.reply(
                ctx.t("import-error", {
                    operationId: runtimeOperationId,
                }),
            );
        } finally {
            if (maintenanceStarted) {
                endDatabaseImportMaintenance();
            }
            await Promise.allSettled([
                unlink(session.dumpPath),
                unlink(session.encryptedPath),
                unlink(emergencyPaths.dump),
                unlink(emergencyPaths.encrypted),
            ]);
        }
    },
);

export { composer as importDataFeature };
