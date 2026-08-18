import { readFile } from "node:fs/promises";
import { config } from "../config/index.ts";
import { TelegramError } from "../http/errors.ts";

export { TelegramError } from "../http/errors.ts";

type TelegramDocumentMessage = {
    message_id: number;
    chat: { id: number };
    document?: { file_id: string; file_unique_id: string };
    audio?: { file_id: string; file_unique_id: string };
};
type TelegramVoiceMessage = {
    message_id: number;
    chat: { id: number };
    voice?: { file_id: string; file_unique_id: string };
};
type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };
type PreparedInlineMessage = { id: string; expiration_date: number };

function isRetryableStatus(status: number | undefined) {
    return status === undefined || status === 429 || status >= 500;
}

async function telegramRequest<T>(method: string, body?: FormData) {
    let response: Response;
    try {
        response = await fetch(
            `https://api.telegram.org/bot${config.botToken}/${method}`,
            {
                method: body ? "POST" : "GET",
                body,
                signal: AbortSignal.timeout(30_000),
            },
        );
    } catch (error) {
        throw new TelegramError(
            method,
            undefined,
            true,
            error instanceof Error ? error.message : "Telegram request failed",
        );
    }
    let result: TelegramResponse<T>;
    try {
        result = (await response.json()) as TelegramResponse<T>;
    } catch {
        throw new TelegramError(
            method,
            response.status,
            isRetryableStatus(response.status),
            "Telegram returned an invalid response",
        );
    }
    if (!response.ok || !result.ok || result.result === undefined) {
        throw new TelegramError(
            method,
            response.status,
            isRetryableStatus(response.status),
            result.description || `Telegram ${method} failed`,
        );
    }
    return result.result;
}

export async function sendSubmissionToModeration(input: {
    id: string;
    title: string;
    userId: number;
    file: File;
}) {
    const body = new FormData();
    body.set("chat_id", String(config.moderationChatId));
    body.set(
        "caption",
        [
            "Новая заявка на реплику",
            `Название: ${input.title}`,
            `Автор: ${input.userId}`,
            `ID: ${input.id}`,
        ].join("\n"),
    );
    body.set("document", input.file, `${input.id}.mp3`);
    body.set(
        "reply_markup",
        JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: "Одобрить",
                        callback_data: `submission:approve:${input.id}`,
                    },
                    {
                        text: "Изменить название",
                        callback_data: `submission:edit:${input.id}`,
                    },
                ],
                [
                    {
                        text: "Отклонить",
                        callback_data: `submission:reject:${input.id}`,
                    },
                ],
            ],
        }),
    );
    const message = await telegramRequest<TelegramDocumentMessage>(
        "sendDocument",
        body,
    );
    const sourceFile = message.document ?? message.audio;
    if (!sourceFile)
        throw new TelegramError(
            "sendDocument",
            200,
            false,
            "Telegram omitted submission file",
        );
    return {
        sourceChatId: message.chat.id,
        sourceMessageId: message.message_id,
        sourceFileId: sourceFile.file_id,
        sourceFileUniqueId: sourceFile.file_unique_id,
    };
}

export async function getTelegramFile(fileId: string) {
    const result = await telegramRequest<{ file_path?: string }>(
        `getFile?${new URLSearchParams({ file_id: fileId })}`,
    );
    if (!result.file_path)
        throw new TelegramError(
            "getFile",
            200,
            false,
            "Telegram file path is missing",
        );
    try {
        const response = await fetch(
            `https://api.telegram.org/file/bot${config.botToken}/${result.file_path}`,
            { signal: AbortSignal.timeout(30_000) },
        );
        if (!response.ok)
            throw new TelegramError(
                "downloadFile",
                response.status,
                isRetryableStatus(response.status),
                "Telegram file download failed",
            );
        return response;
    } catch (error) {
        if (error instanceof TelegramError) throw error;
        throw new TelegramError(
            "downloadFile",
            undefined,
            true,
            error instanceof Error
                ? error.message
                : "Telegram file download failed",
        );
    }
}

export async function prepareVoiceMessage(input: {
    userId: number;
    voiceId: string;
    title: string;
    fileId: string;
}) {
    const body = new FormData();
    body.set("user_id", String(input.userId));
    body.set(
        "result",
        JSON.stringify({
            type: "voice",
            id: input.voiceId,
            voice_file_id: input.fileId,
            title: input.title,
        }),
    );
    body.set("allow_user_chats", "true");
    body.set("allow_group_chats", "true");
    body.set("allow_channel_chats", "true");
    return telegramRequest<PreparedInlineMessage>(
        "savePreparedInlineMessage",
        body,
    );
}

export async function sendVoiceToModeration(input: {
    caption: string;
    filename: string;
}) {
    const body = new FormData();
    body.set("chat_id", String(config.moderationChatId));
    body.set("caption", input.caption);
    body.set(
        "voice",
        new Blob([await readFile(input.filename)], { type: "audio/ogg" }),
        "voice.ogg",
    );
    const message = await telegramRequest<TelegramVoiceMessage>(
        "sendVoice",
        body,
    );
    if (!message.voice)
        throw new TelegramError(
            "sendVoice",
            200,
            false,
            "Telegram omitted voice data",
        );
    return {
        chatId: message.chat.id,
        messageId: message.message_id,
        fileId: message.voice.file_id,
        fileUniqueId: message.voice.file_unique_id,
    };
}

export async function deleteTelegramMessage(chatId: number, messageId: number) {
    const body = new FormData();
    body.set("chat_id", String(chatId));
    body.set("message_id", String(messageId));
    await telegramRequest<boolean>("deleteMessage", body);
}
export async function editTelegramCaption(
    chatId: number,
    messageId: number,
    caption: string,
) {
    const body = new FormData();
    body.set("chat_id", String(chatId));
    body.set("message_id", String(messageId));
    body.set("caption", caption);
    await telegramRequest<TelegramDocumentMessage>("editMessageCaption", body);
}
export async function sendTelegramMessage(chatId: number, text: string) {
    const body = new FormData();
    body.set("chat_id", String(chatId));
    body.set("text", text);
    await telegramRequest<unknown>("sendMessage", body);
}
