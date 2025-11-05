import { unlink } from "node:fs/promises";
import { Composer, InputFile } from "grammy";

import {
    isDatabaseMaintenanceActive,
    setDatabaseMaintenanceStatus,
} from "@/src/store/databaseMaintenance";

import type { BotContext } from "@/src/types/bot";

export const exportDataCommand = new Composer<BotContext>();

exportDataCommand.command("export", async (ctx) => {
    if (isDatabaseMaintenanceActive()) {
        return ctx.reply(ctx.t("exportData.maintenancePending"));
    }

    setDatabaseMaintenanceStatus(true);
    await ctx.replyWithChatAction("upload_document");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.dump`;

    try {
        const dumpProcess = Bun.spawn({
            cmd: [
                "pg_dump",
                process.env.DATABASE_URL,
                "-F",
                "c",
                "-f",
                backupFileName,
            ],
        });

        const exitCode = await dumpProcess.exited;

        if (exitCode !== 0) {
            const stderr = await new Response(dumpProcess.stderr).text();
            await ctx.reply(
                ctx.t("exportData.dumpError", { exitCode, stderr }),
            );
            return;
        }

        await ctx.replyWithDocument(new InputFile(backupFileName));
    } catch (error: unknown) {
        console.error("Failed to export data from DB. Details:", error);
        await ctx.reply(ctx.t("exportData.unknownError"));
    } finally {
        setDatabaseMaintenanceStatus(false);

        const file = Bun.file(backupFileName);
        if (await file.exists()) {
            await unlink(backupFileName);
        }
    }
});
