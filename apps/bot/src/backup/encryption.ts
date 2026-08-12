import {
    createCipheriv,
    createDecipheriv,
    createHash,
    type DecipherGCM,
    randomBytes,
} from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { Transform, type TransformCallback } from "node:stream";
import { pipeline } from "node:stream/promises";

import { BackupError } from "./errors.ts";

const ALGORITHM = "aes-256-gcm";
const MAGIC = Buffer.from("DEKOBK01", "ascii");
const IV_LENGTH = 12;
const KEY_ID_LENGTH = 8;
const AUTH_TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + KEY_ID_LENGTH + IV_LENGTH;

export const ENCRYPTED_BACKUP_EXTENSION = ".dump.enc";

export function parseBackupEncryptionKey(value: string) {
    if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) {
        throw new BackupError(
            "BACKUP_ENCRYPTION_KEY must be 32 bytes encoded as base64",
            "INVALID_BACKUP_KEY",
        );
    }

    const key = Buffer.from(value, "base64");
    if (key.length !== 32) {
        throw new BackupError(
            "BACKUP_ENCRYPTION_KEY must be 32 bytes encoded as base64",
            "INVALID_BACKUP_KEY",
        );
    }

    return key;
}

function getKeyId(key: Buffer) {
    return createHash("sha256").update(key).digest().subarray(0, KEY_ID_LENGTH);
}

class EncryptTransform extends Transform {
    readonly #cipher;
    readonly #header: Buffer;
    #headerWritten = false;

    constructor(key: Buffer) {
        super();
        const iv = randomBytes(IV_LENGTH);
        this.#cipher = createCipheriv(ALGORITHM, key, iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });
        this.#header = Buffer.concat([MAGIC, getKeyId(key), iv]);
    }

    #writeHeader() {
        if (!this.#headerWritten) {
            this.push(this.#header);
            this.#headerWritten = true;
        }
    }

    override _transform(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: TransformCallback,
    ) {
        try {
            this.#writeHeader();
            this.push(this.#cipher.update(chunk));
            callback();
        } catch (error) {
            callback(error as Error);
        }
    }

    override _flush(callback: TransformCallback) {
        try {
            this.#writeHeader();
            this.push(this.#cipher.final());
            this.push(this.#cipher.getAuthTag());
            callback();
        } catch (error) {
            callback(error as Error);
        }
    }
}

class DecryptTransform extends Transform {
    readonly #key: Buffer;
    #decipher: DecipherGCM | null = null;
    #pending = Buffer.alloc(0);

    constructor(key: Buffer) {
        super();
        this.#key = key;
    }

    #initializeDecipher() {
        if (this.#decipher || this.#pending.length < HEADER_LENGTH) {
            return;
        }

        const magic = this.#pending.subarray(0, MAGIC.length);
        if (!magic.equals(MAGIC)) {
            throw new BackupError(
                "The file is not an encrypted Deko backup",
                "INVALID_BACKUP_FORMAT",
            );
        }

        const keyIdStart = MAGIC.length;
        const keyIdEnd = keyIdStart + KEY_ID_LENGTH;
        const keyId = this.#pending.subarray(keyIdStart, keyIdEnd);
        if (!keyId.equals(getKeyId(this.#key))) {
            throw new BackupError(
                "The backup was encrypted with another key",
                "BACKUP_KEY_MISMATCH",
            );
        }

        const iv = this.#pending.subarray(keyIdEnd, HEADER_LENGTH);
        this.#decipher = createDecipheriv(ALGORITHM, this.#key, iv, {
            authTagLength: AUTH_TAG_LENGTH,
        }) as DecipherGCM;
        this.#pending = this.#pending.subarray(HEADER_LENGTH);
    }

    #decryptAvailableBytes() {
        if (!this.#decipher || this.#pending.length <= AUTH_TAG_LENGTH) {
            return;
        }

        const encryptedLength = this.#pending.length - AUTH_TAG_LENGTH;
        const encrypted = this.#pending.subarray(0, encryptedLength);
        this.#pending = this.#pending.subarray(encryptedLength);
        this.push(this.#decipher.update(encrypted));
    }

    override _transform(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: TransformCallback,
    ) {
        try {
            this.#pending = Buffer.concat([this.#pending, chunk]);
            this.#initializeDecipher();
            this.#decryptAvailableBytes();
            callback();
        } catch (error) {
            callback(error as Error);
        }
    }

    override _flush(callback: TransformCallback) {
        try {
            this.#initializeDecipher();
            this.#decryptAvailableBytes();

            if (!this.#decipher || this.#pending.length !== AUTH_TAG_LENGTH) {
                throw new BackupError(
                    "The encrypted backup is incomplete",
                    "INVALID_BACKUP_FORMAT",
                );
            }

            this.#decipher.setAuthTag(this.#pending);
            this.push(this.#decipher.final());
            callback();
        } catch (error) {
            callback(
                error instanceof BackupError
                    ? error
                    : new BackupError(
                          "The encrypted backup failed authentication",
                          "BACKUP_AUTHENTICATION_FAILED",
                          { cause: error },
                      ),
            );
        }
    }
}

export async function encryptBackupFile(
    inputPath: string,
    outputPath: string,
    key: Buffer,
) {
    await pipeline(
        createReadStream(inputPath),
        new EncryptTransform(key),
        createWriteStream(outputPath, { mode: 0o600 }),
    );
}

export async function decryptBackupFile(
    inputPath: string,
    outputPath: string,
    key: Buffer,
) {
    await pipeline(
        createReadStream(inputPath),
        new DecryptTransform(key),
        createWriteStream(outputPath, { mode: 0o600 }),
    );
}
