import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvironmentFile } from "@deko-voice-bot/shared";
import {
    decryptBackupFile,
    encryptBackupFile,
    parseBackupEncryptionKey,
} from "../src/encryption.ts";

loadEnvironmentFile();

const invocationDirectory = process.env.INIT_CWD ?? process.cwd();

const [action, inputArgument, outputArgument] = process.argv.slice(2);
if (
    (action !== "encrypt" && action !== "decrypt") ||
    !inputArgument ||
    !outputArgument
) {
    throw new Error(
        "Usage: pnpm backup:crypto <encrypt|decrypt> <input> <output>",
    );
}

const inputPath = resolve(invocationDirectory, inputArgument);
const outputPath = resolve(invocationDirectory, outputArgument);
if (inputPath === outputPath) {
    throw new Error("Input and output paths must be different");
}

const keyValue = process.env.BACKUP_ENCRYPTION_KEY;
if (!keyValue) {
    throw new Error("BACKUP_ENCRYPTION_KEY is not set");
}
const key = parseBackupEncryptionKey(keyValue);

try {
    if (action === "encrypt") {
        await encryptBackupFile(inputPath, outputPath, key);
    } else {
        await decryptBackupFile(inputPath, outputPath, key);
    }
    process.stdout.write(`${action} completed: ${outputPath}\n`);
} catch (error) {
    await unlink(outputPath).catch(() => {});
    throw error;
}
