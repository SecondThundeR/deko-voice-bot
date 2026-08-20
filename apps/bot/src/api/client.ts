import { createWriteStream, openAsBlob } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as delay } from "node:timers/promises";
import {
    API_ROUTES,
    apiErrorSchema,
    apiHealthSchema,
    completedImportSchema,
    preparedImportSchema,
} from "@deko-voice-bot/contract";
import * as v from "valibot";
import { config } from "../config.ts";

type Artifact = {
    fileName: string;
    sha256: string;
};

export class ApiClient {
    readonly #baseUrl: URL;
    readonly #token: string;

    constructor(baseUrl: string, token: string) {
        this.#baseUrl = new URL(baseUrl);
        this.#token = token;
    }

    async getHealth() {
        const response = await this.#request(API_ROUTES.health);
        return v.parse(apiHealthSchema, await response.json());
    }

    async waitForRestoreIdle() {
        for (;;) {
            try {
                if (!(await this.getHealth()).restoringDatabase) {
                    return;
                }
            } catch (error) {
                if (
                    error instanceof ApiClientError &&
                    error.status &&
                    error.status < 500
                ) {
                    throw error;
                }
            }
            await delay(500);
        }
    }

    async convertVoice(inputPath: string, outputPath: string) {
        const body = await openAsBlob(inputPath, { type: "audio/mpeg" });
        await this.#download(
            API_ROUTES.voiceConvert,
            outputPath,
            { body, method: "POST" },
            false,
        );
    }

    async exportDatabase(outputPath: string) {
        return this.#download(
            API_ROUTES.exportDatabase,
            outputPath,
            { method: "POST" },
            true,
        );
    }

    async prepareImport(operationId: string, inputPath: string) {
        const body = await openAsBlob(inputPath, {
            type: "application/octet-stream",
        });
        const response = await this.#request(
            API_ROUTES.importDatabase(operationId),
            { body, method: "POST" },
        );
        return v.parse(preparedImportSchema, await response.json());
    }

    async cancelImport(operationId: string) {
        await this.#request(API_ROUTES.importDatabase(operationId), {
            method: "DELETE",
        });
    }

    async downloadEmergencyBackup(operationId: string, outputPath: string) {
        return this.#download(
            API_ROUTES.importEmergencyBackup(operationId),
            outputPath,
            { method: "POST" },
            true,
        );
    }

    async restoreImport(operationId: string) {
        const response = await this.#request(
            API_ROUTES.importRestore(operationId),
            { method: "POST" },
        );
        return v.parse(completedImportSchema, await response.json());
    }

    async #download(
        path: string,
        outputPath: string,
        init: RequestInit,
        requireMetadata: boolean,
    ): Promise<Artifact> {
        const response = await this.#request(path, init);
        if (!response.body) {
            throw new ApiClientError("API response body is missing");
        }

        try {
            await pipeline(
                Readable.fromWeb(response.body),
                createWriteStream(outputPath, { mode: 0o600 }),
            );
        } catch (error) {
            await unlink(outputPath).catch(() => {});
            throw error;
        }

        const sha256 = response.headers.get("x-backup-sha256") ?? "";
        if (requireMetadata && !sha256) {
            await unlink(outputPath).catch(() => {});
            throw new ApiClientError("Backup metadata is missing");
        }

        return {
            fileName: getResponseFileName(response) ?? "artifact.bin",
            sha256,
        };
    }

    async #request(path: string, init?: RequestInit) {
        const response = await fetch(new URL(path, this.#baseUrl), {
            ...init,
            headers: {
                authorization: `Bearer ${this.#token}`,
                ...init?.headers,
            },
        });
        if (response.ok) return response;

        let message = `API request failed with status ${response.status}`;
        try {
            message = v.parse(apiErrorSchema, await response.json()).error;
        } catch {}
        throw new ApiClientError(message, response.status);
    }
}

function getResponseFileName(response: Response) {
    const disposition = response.headers.get("content-disposition");
    return disposition?.match(/filename="([^"]+)"/)?.[1];
}

export class ApiClientError extends Error {
    readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}

export const apiClient = new ApiClient(config.apiUrl, config.apiToken);
