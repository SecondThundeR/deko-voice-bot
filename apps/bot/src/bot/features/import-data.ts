import {
    createBackupTempPaths,
    ENCRYPTED_BACKUP_EXTENSION,
    removeBackupTempPaths,
} from "@deko-voice-bot/backup";
import { getSafeErrorInfo } from "@deko-voice-bot/shared";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { downloadTelegramFileToPath } from "#root/bot/helpers/api.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { databaseImportCoordinator } from "#root/bot/store/database-import.js";
import { importSessions } from "#root/bot/store/import-sessions.js";
import { operationsClient } from "#root/operations/client.js";

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
        const pendingSession = importSessions.get(ctx.from.id, ctx.chat.id);
        if (pendingSession?.stage !== "awaiting-file") {
            return next();
        }

        const maxBytes = getMaxBackupBytes(ctx);
        const document = ctx.msg.document;

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

        const session = importSessions.takeAwaitingFile(
            ctx.from.id,
            ctx.chat.id,
        );
        if (!session) {
            return ctx.reply(ctx.t("import-session-expired"));
        }

        const paths = await createBackupTempPaths("restore");

        try {
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

            const { sha256, size } = await operationsClient.prepareImport(
                session.operationId,
                paths.encrypted,
            );
            importSessions.addAwaitingConfirmation(
                session,
                {
                    sha256,
                    size,
                },
                getImportSessionTtlMs(ctx),
            );
            await removeBackupTempPaths(paths);

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
                    sizeMb: (size / 1024 / 1024).toFixed(2),
                }),
                { reply_markup: keyboard },
            );
        } catch (error: unknown) {
            await importSessions.cancel(ctx.from.id, ctx.chat.id);
            await Promise.allSettled([
                removeBackupTempPaths(paths),
                operationsClient.cancelImport(session.operationId),
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
            await operationsClient
                .cancelImport(session.operationId)
                .catch((error: unknown) => {
                    ctx.logger.warn({
                        msg: "Failed to remove prepared database import",
                        operationId: session.operationId,
                        ...getSafeErrorInfo(error),
                    });
                });
            return ctx.editMessageText(ctx.t("import-cancelled"));
        }

        const started = databaseImportCoordinator.start({
            api: ctx.api,
            chatId: ctx.chat.id,
            logger: ctx.logger,
            messageId: ctx.callbackQuery.message?.message_id,
            messages: {
                completed: ctx.t("import-completed"),
                emergencyBackup: (sha256) =>
                    ctx.t("import-emergency-backup", { sha256 }),
                error: ctx.t("import-error", {
                    operationId: session.operationId,
                }),
                preparing: ctx.t("import-preparing"),
            },
            session,
        });
        if (!started) {
            await operationsClient
                .cancelImport(session.operationId)
                .catch(() => {});
            return ctx.editMessageText(
                ctx.t("import-error", {
                    operationId: session.operationId,
                }),
            );
        }

        return;
    },
);

export { composer as importDataFeature };
