import { config } from "./config.ts";

type TelegramDocumentMessage = {
    message_id: number;
    chat: { id: number };
    document?: {
        file_id: string;
        file_unique_id: string;
    };
};

type TelegramResponse<T> = {
    ok: boolean;
    result?: T;
    description?: string;
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
