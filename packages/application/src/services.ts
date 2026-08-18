import {
    SUBMISSION_DAILY_LIMIT,
    SUBMISSION_PENDING_LIMIT,
} from "@deko-voice-bot/contracts";

export type TrimInput = { startMs: number; endMs: number | null };

export type UploadFile = { arrayBuffer(): Promise<ArrayBuffer> };

export type Submission = {
    id: string;
    submitterUserId: number;
    title: string;
    sourceFileId: string | null;
    sourceChatId: number | null;
    sourceMessageId: number | null;
};

export type SentVoice = {
    chatId: number;
    messageId: number;
    fileId: string;
    fileUniqueId: string;
};

export type SubmissionSource = {
    sourceChatId: number;
    sourceMessageId: number;
    sourceFileId: string;
    sourceFileUniqueId: string;
};

export class ApplicationError extends Error {
    readonly status: 400 | 404 | 409 | 429 | 503;
    readonly code: string;

    constructor(
        status: 400 | 404 | 409 | 429 | 503,
        code: string,
        message: string,
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = "ApplicationError";
    }
}

export interface SubmissionPorts {
    createSubmission(input: {
        id: string;
        submitterUserId: number;
        title: string;
    }): Promise<Submission | null>;
    markPending(
        id: string,
        source: SubmissionSource,
    ): Promise<Submission | null>;
    markFailed(id: string): Promise<void>;
    listForUser(userId: number): Promise<Submission[]>;
    sendToModeration(input: {
        id: string;
        title: string;
        userId: number;
        file: UploadFile;
    }): Promise<SubmissionSource>;
}

export class SubmissionService {
    private readonly ports: SubmissionPorts;

    constructor(ports: SubmissionPorts) {
        this.ports = ports;
    }

    list(userId: number) {
        return this.ports.listForUser(userId);
    }

    async submit(input: {
        id: string;
        userId: number;
        title: string;
        file: UploadFile;
    }) {
        const submission = await this.ports.createSubmission({
            id: input.id,
            submitterUserId: input.userId,
            title: input.title,
        });
        if (!submission) {
            throw new ApplicationError(
                429,
                "SUBMISSION_LIMIT",
                `Можно отправить не более ${SUBMISSION_DAILY_LIMIT} заявок за сутки и иметь не более ${SUBMISSION_PENDING_LIMIT} незавершённых`,
            );
        }
        try {
            const source = await this.ports.sendToModeration({
                id: input.id,
                title: input.title,
                userId: input.userId,
                file: input.file,
            });
            const pending = await this.ports.markPending(input.id, source);
            if (!pending)
                throw new Error("Submission state changed while uploading");
            return pending;
        } catch (error) {
            await this.ports.markFailed(input.id);
            throw error;
        }
    }
}

export interface CatalogPorts {
    getVoiceById(voiceId: string): Promise<unknown | null>;
    addVoice(input: {
        voiceId: string;
        voiceTitle: string;
        fileId: string;
        fileUniqueId: string;
    }): Promise<boolean>;
    convertAndSend(input: {
        bytes: Uint8Array;
        caption: string;
        trim: TrimInput;
    }): Promise<SentVoice>;
    deleteMessage(chatId: number, messageId: number): Promise<unknown>;
    warn(action: string, error: unknown): void;
}

export class CatalogService {
    private readonly ports: CatalogPorts;

    constructor(ports: CatalogPorts) {
        this.ports = ports;
    }

    async addAdminVoice(input: {
        voiceId: string;
        title: string;
        bytes: Uint8Array;
        trim: TrimInput;
        addedBy: string;
    }) {
        if (await this.ports.getVoiceById(input.voiceId)) {
            throw new ApplicationError(
                409,
                "VOICE_CONFLICT",
                "Реплика с таким ID уже существует",
            );
        }
        const sent = await this.ports.convertAndSend({
            bytes: input.bytes,
            caption: [
                `ID: ${input.voiceId}`,
                `Название: ${input.title}`,
                `Добавлено модератором: ${input.addedBy}`,
            ].join("\n"),
            trim: input.trim,
        });
        let added: boolean;
        try {
            added = await this.ports.addVoice({
                voiceId: input.voiceId,
                voiceTitle: input.title,
                fileId: sent.fileId,
                fileUniqueId: sent.fileUniqueId,
            });
        } catch (error) {
            await this.compensate(sent, "compensate_admin_voice");
            throw error;
        }
        if (!added) {
            await this.compensate(sent, "delete_conflicting_admin_voice");
            throw new ApplicationError(
                409,
                "VOICE_CONFLICT",
                "Реплика с таким ID или файлом уже существует",
            );
        }
        return { ok: true as const, voiceId: input.voiceId };
    }

    private async compensate(sent: SentVoice, action: string) {
        try {
            await this.ports.deleteMessage(sent.chatId, sent.messageId);
        } catch (error) {
            this.ports.warn(action, error);
        }
    }
}

export interface ModerationPorts {
    claim(
        id: string,
        moderatorUserId: number,
        title: string,
    ): Promise<Submission | null>;
    approve(
        id: string,
        voice: {
            voiceId: string;
            voiceTitle: string;
            fileId: string;
            fileUniqueId: string;
        },
    ): Promise<Submission | null>;
    release(id: string): Promise<void>;
    getFile(fileId: string): Promise<Response>;
    convertAndSend(input: {
        bytes: Uint8Array;
        caption: string;
        trim: TrimInput;
    }): Promise<SentVoice>;
    deleteMessage(chatId: number, messageId: number): Promise<unknown>;
    sendMessage(userId: number, text: string): Promise<unknown>;
    warn(action: string, error: unknown): void;
}

export class ModerationService {
    private readonly ports: ModerationPorts;

    constructor(ports: ModerationPorts) {
        this.ports = ports;
    }

    async approve(input: {
        id: string;
        moderatorUserId: number;
        title: string;
        voiceId: string;
        trim: TrimInput;
    }) {
        const claimed = await this.ports.claim(
            input.id,
            input.moderatorUserId,
            input.title,
        );
        if (!claimed) {
            throw new ApplicationError(
                409,
                "SUBMISSION_NOT_ACTIONABLE",
                "Заявка уже обрабатывается или завершена",
            );
        }
        let sent: SentVoice | undefined;
        try {
            if (!claimed.sourceFileId) {
                throw new ApplicationError(
                    404,
                    "SUBMISSION_AUDIO_NOT_FOUND",
                    "Исходный файл заявки не найден",
                );
            }
            const source = await this.ports.getFile(claimed.sourceFileId);
            if (!source.ok) {
                throw new ApplicationError(
                    503,
                    "TELEGRAM_UNAVAILABLE",
                    "Не удалось загрузить аудио заявки",
                );
            }
            sent = await this.ports.convertAndSend({
                bytes: new Uint8Array(await source.arrayBuffer()),
                caption: `Одобрено: ${input.title}`,
                trim: input.trim,
            });
            const approved = await this.ports.approve(claimed.id, {
                voiceId: input.voiceId,
                voiceTitle: input.title,
                fileId: sent.fileId,
                fileUniqueId: sent.fileUniqueId,
            });
            if (!approved) {
                await this.compensate(sent, "delete_conflicting_voice");
                sent = undefined;
                throw new ApplicationError(
                    409,
                    "VOICE_CONFLICT",
                    "Реплика с таким ID или файлом уже существует",
                );
            }
            if (claimed.sourceChatId && claimed.sourceMessageId) {
                await this.compensate(
                    {
                        chatId: claimed.sourceChatId,
                        messageId: claimed.sourceMessageId,
                        fileId: "",
                        fileUniqueId: "",
                    },
                    "delete_approved_submission",
                );
            }
            try {
                await this.ports.sendMessage(
                    claimed.submitterUserId,
                    `Ваша заявка «${input.title}» одобрена и добавлена в каталог`,
                );
            } catch (error) {
                this.ports.warn("notify_submission_approval", error);
            }
            return { claimed, approved };
        } catch (error) {
            if (sent) await this.compensate(sent, "compensate_approved_voice");
            await this.ports.release(claimed.id);
            throw error;
        }
    }

    private async compensate(sent: SentVoice, action: string) {
        try {
            await this.ports.deleteMessage(sent.chatId, sent.messageId);
        } catch (error) {
            this.ports.warn(action, error);
        }
    }
}
