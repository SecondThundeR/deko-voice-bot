import { readFile } from "node:fs/promises";
import { config } from "./config.ts";

type TelegramDocumentMessage = {
    message_id: number;
    chat: { id: number };
    document?: {
        file_id: string;
        file_unique_id: string;
    };
};

type TelegramVoiceMessage = {
    message_id: number;
    chat: { id: number };
    voice?: {
        file_id: string;
        file_unique_id: string;
    };
};

type TelegramResponse<T> = {
    ok: boolean;
    result?: T;
    description?: string;
};

type PreparedInlineMessage = {
    id: string;
    expiration_date: number;
};

async function telegramRequest<T>(method: string, body?: FormData) {
    const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/${method}`,
        {
            method: body ? "POST" : "GET",
            body,
            signal: AbortSignal.timeout(30_000),
        },
    );
    const result = (await response.json()) as TelegramResponse<T>;
    if (!response.ok || !result.ok || result.result === undefined) {
        throw new Error(result.description || `Telegram ${method} failed`);
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
            `Новая заявка на реплику`,
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
    if (!message.document)
        throw new Error("Telegram omitted submission document");
    return {
        sourceChatId: message.chat.id,
        sourceMessageId: message.message_id,
        sourceFileId: message.document.file_id,
        sourceFileUniqueId: message.document.file_unique_id,
    };
}

export async function getTelegramFile(fileId: string) {
    const params = new URLSearchParams({ file_id: fileId });
    const result = await telegramRequest<{ file_path?: string }>(
        `getFile?${params}`,
    );
    if (!result.file_path) throw new Error("Telegram file path is missing");
    return fetch(
        `https://api.telegram.org/file/bot${config.botToken}/${result.file_path}`,
        { signal: AbortSignal.timeout(30_000) },
    );
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
    if (!message.voice) throw new Error("Telegram omitted voice data");
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
