import { Api, InputFile } from "grammy";
import { pino } from "pino";

import { parseDatabaseUrlFromEnvironment } from "#drizzle/database-url.js";
import { createEncryptedDatabaseBackup } from "#root/backup/create.js";
import { parseBackupEncryptionKey } from "#root/backup/encryption.js";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import {
    createBackupTempPaths,
    createDatedBackupFileName,
    removeBackupTempPaths,
} from "#root/backup/paths.js";
import { loadEnvironmentFile } from "#root/environment.js";
import { getSafeErrorInfo } from "#root/logging.js";

const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5_000;
const LOG_LEVELS = new Set([
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
    "silent",
]);

loadEnvironmentFile();

const requestedLogLevel = process.env.LOG_LEVEL;
const logger = pino({
    level:
        requestedLogLevel && LOG_LEVELS.has(requestedLogLevel)
            ? requestedLogLevel
            : "info",
});
const backupChatId = process.env.BACKUP_CHAT_ID;

if (!backupChatId) {
    logger.info({ msg: "Automatic database backup is disabled" });
} else {
    await runBackupCron(backupChatId);
}

async function runBackupCron(chatIdValue: string) {
    const chatId = Number(chatIdValue);
    const botToken = process.env.BOT_TOKEN;
    if (!Number.isSafeInteger(chatId) || !botToken) {
        logger.error({ msg: "Invalid backup cron configuration" });
        process.exitCode = 1;
        return;
    }

    const api = new Api(botToken);
    let lastError: unknown;

    for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
        let paths:
            | Awaited<ReturnType<typeof createBackupTempPaths>>
            | undefined;
        try {
            paths = await createBackupTempPaths("automatic-backup");
            const currentPaths = paths;
            const databaseUrl = parseDatabaseUrlFromEnvironment(
                process.env.DATABASE_URL,
            );
            const encryptionKey = parseBackupEncryptionKey(
                process.env.BACKUP_ENCRYPTION_KEY ?? "",
            );
            const sha256 = await withBackupAdvisoryLock(databaseUrl, () =>
                createEncryptedDatabaseBackup({
                    databaseUrl,
                    encryptionKey,
                    paths: currentPaths,
                }),
            );
            await api.sendDocument(
                chatId,
                new InputFile(
                    currentPaths.encrypted,
                    createDatedBackupFileName("automatic-backup"),
                ),
                {
                    caption: `Ежедневная резервная копия базы данных.\nSHA-256: ${sha256}`,
                },
            );
            logger.info({ msg: "Automatic database backup completed", sha256 });
            return;
        } catch (error) {
            lastError = error;
            logger.warn({
                msg: "Automatic database backup attempt failed",
                attempt,
                ...getSafeErrorInfo(error),
            });
            if (attempt < RETRY_COUNT) {
                await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY_MS),
                );
            }
        } finally {
            if (paths) await removeBackupTempPaths(paths);
        }
    }

    await api
        .sendMessage(
            chatId,
            "Не удалось создать ежедневную резервную копию базы данных после трёх попыток.",
        )
        .catch((error) => {
            logger.error({
                msg: "Failed to send backup failure notification",
                ...getSafeErrorInfo(error),
            });
        });
    logger.error({
        msg: "Automatic database backup failed",
        ...getSafeErrorInfo(lastError),
    });
    process.exitCode = 1;
}
