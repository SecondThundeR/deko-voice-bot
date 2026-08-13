import { unlink } from "node:fs/promises";
import {
    convertMP3ToOGGOpus,
    createVoiceTempFilePaths,
} from "@deko-voice-bot/audio";
import { SUBMISSION_RETENTION_DAYS } from "@deko-voice-bot/contracts";
import { databaseUrl } from "@deko-voice-bot/database/env.js";
import {
    approveVoiceSubmission,
    claimVoiceSubmission,
    deleteExpiredVoiceSubmissions,
    getVoiceSubmission,
    rejectVoiceSubmission,
    releaseVoiceSubmission,
    updateVoiceSubmissionTitle,
} from "@deko-voice-bot/database/queries/submissions.js";
import { Composer, InputFile } from "grammy";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { downloadTelegramFileToPath } from "#root/bot/helpers/api.js";

const actionPattern = /^submission:(approve|edit|reject):([0-9a-f-]{36})$/;
const editPromptPattern = /^Новое название для заявки ([0-9a-f-]{36}):$/;
const rejectPromptPattern = /^Причина отклонения заявки ([0-9a-f-]{36}):$/;

const composer = new Composer<Context>();
const admin = composer.filter(isAdmin);

function moderationCaption(submission: {
    id: string;
    submitterUserId: number;
    title: string;
}) {
    return [
        "Новая заявка на реплику",
        `Название: ${submission.title}`,
        `Автор: ${submission.submitterUserId}`,
        `ID: ${submission.id}`,
    ].join("\n");
}

async function notifyUser(ctx: Context, userId: number, text: string) {
    await ctx.api.sendMessage(userId, text).catch(() => {});
}

admin.callbackQuery(actionPattern, async (ctx) => {
    const [, action, id] = ctx.match;
    const submission = await getVoiceSubmission(id);
    if (!submission) {
        return ctx.answerCallbackQuery({
            text: "Заявка не найдена",
            show_alert: true,
        });
    }
    if (ctx.chat?.id !== ctx.config.moderationChatId) {
        return ctx.answerCallbackQuery({
            text: "Неверный чат",
            show_alert: true,
        });
    }

    if (action === "edit") {
        await ctx.answerCallbackQuery();
        return ctx.reply(`Новое название для заявки ${id}:`, {
            reply_markup: { force_reply: true, selective: true },
        });
    }
    if (action === "reject") {
        await ctx.answerCallbackQuery();
        return ctx.reply(`Причина отклонения заявки ${id}:`, {
            reply_markup: { force_reply: true, selective: true },
        });
    }

    const claimed = await claimVoiceSubmission(id, ctx.from.id);
    if (!claimed) {
        return ctx.answerCallbackQuery({
            text: "Заявка уже обрабатывается или завершена",
            show_alert: true,
        });
    }
    await ctx.answerCallbackQuery({ text: "Начинаю обработку" });
    if (
        !claimed.sourceFileId ||
        !claimed.sourceChatId ||
        !claimed.sourceMessageId
    ) {
        await releaseVoiceSubmission(id);
        return ctx.reply("В заявке отсутствует исходный файл");
    }

    const paths = createVoiceTempFilePaths();
    try {
        const file = await ctx.api.getFile(claimed.sourceFileId);
        if (!file.file_path) throw new Error("Telegram file path is missing");
        const downloaded = await downloadTelegramFileToPath(
            file.file_path,
            paths.input,
            ctx.api.token,
            20 * 1024 * 1024,
        );
        if (!downloaded) throw new Error("Failed to download submission");
        const conversion = await convertMP3ToOGGOpus(paths.input, paths.output);
        if (!conversion.status) throw new Error(conversion.error);
        const sent = await ctx.api.sendVoice(
            claimed.sourceChatId,
            new InputFile(paths.output),
            { caption: `Одобрено: ${claimed.title}` },
        );
        const approved = await approveVoiceSubmission(id, {
            voiceId: id,
            voiceTitle: claimed.title,
            fileId: sent.voice.file_id,
            fileUniqueId: sent.voice.file_unique_id,
        });
        if (!approved) throw new Error("Failed to finalize submission");
        await ctx.api
            .deleteMessage(claimed.sourceChatId, claimed.sourceMessageId)
            .catch(() => {});
        await ctx
            .editMessageCaption({
                caption: `${moderationCaption(claimed)}\n\n✅ Одобрено`,
            })
            .catch(() => {});
        await notifyUser(
            ctx,
            claimed.submitterUserId,
            `Ваша заявка «${claimed.title}» одобрена и добавлена в каталог`,
        );
    } catch (error) {
        await releaseVoiceSubmission(id);
        ctx.logger.error({
            msg: "Voice submission approval failed",
            submissionId: id,
            errorType:
                error instanceof Error ? error.constructor.name : "Unknown",
            errorMessage:
                error instanceof Error ? error.message : "Unknown error",
        });
        await ctx.reply(
            "Не удалось обработать заявку. Её можно повторить кнопкой одобрения",
        );
    } finally {
        await Promise.allSettled([unlink(paths.input), unlink(paths.output)]);
    }
});

admin.on("message:text", async (ctx, next) => {
    const prompt = ctx.msg.reply_to_message?.text;
    if (!prompt) return next();

    const editMatch = prompt.match(editPromptPattern);
    if (editMatch) {
        const title = ctx.msg.text.trim();
        if (!title || title.length > 128) {
            return ctx.reply("Название должно содержать от 1 до 128 символов");
        }
        const submission = await updateVoiceSubmissionTitle(
            editMatch[1],
            title,
        );
        if (!submission)
            return ctx.reply("Заявка уже обрабатывается или завершена");
        if (submission.sourceChatId && submission.sourceMessageId) {
            await ctx.api.editMessageCaption(
                submission.sourceChatId,
                submission.sourceMessageId,
                { caption: moderationCaption(submission) },
            );
        }
        return ctx.reply("Название обновлено");
    }

    const rejectMatch = prompt.match(rejectPromptPattern);
    if (rejectMatch) {
        const reason =
            ctx.msg.text.trim() === "/skip" ? undefined : ctx.msg.text.trim();
        if (reason && reason.length > 512)
            return ctx.reply("Причина слишком длинная");
        const submission = await rejectVoiceSubmission(
            rejectMatch[1],
            ctx.from.id,
            reason,
        );
        if (!submission)
            return ctx.reply("Заявка уже обрабатывается или завершена");
        if (submission.sourceChatId && submission.sourceMessageId) {
            await ctx.api
                .deleteMessage(
                    submission.sourceChatId,
                    submission.sourceMessageId,
                )
                .catch(() => {});
        }
        await notifyUser(
            ctx,
            submission.submitterUserId,
            `Ваша заявка «${submission.title}» отклонена.${reason ? ` Причина: ${reason}` : ""}`,
        );
        return ctx.reply("Заявка отклонена");
    }
    return next();
});

export function startSubmissionCleanup() {
    const run = () =>
        withBackupAdvisoryLock(databaseUrl, () =>
            deleteExpiredVoiceSubmissions(SUBMISSION_RETENTION_DAYS),
        ).catch(() => {});
    void run();
    const interval = setInterval(run, 24 * 60 * 60 * 1_000);
    interval.unref();
    return () => clearInterval(interval);
}

export { composer as submissionModerationFeature };
