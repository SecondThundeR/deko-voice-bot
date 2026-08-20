import { createReadStream, createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function writeRequestBodyToPath(
    request: Request,
    outputPath: string,
    maxBytes: number,
) {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new FileSizeLimitError();
    }
    if (!request.body) {
        throw new Error("Request body is missing");
    }

    let receivedBytes = 0;
    const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            receivedBytes += chunk.length;
            callback(
                receivedBytes > maxBytes ? new FileSizeLimitError() : null,
                chunk,
            );
        },
    });

    await pipeline(
        Readable.fromWeb(request.body),
        limiter,
        createWriteStream(outputPath, { mode: 0o600 }),
    );
}

export function createFileResponse(
    path: string,
    fileName: string,
    options: {
        contentType: string;
        headers?: Record<string, string>;
        onClose?: () => Promise<void> | void;
    },
) {
    const file = createReadStream(path);
    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        void options.onClose?.();
    };
    file.once("close", close);
    file.once("error", close);

    return new Response(Readable.toWeb(file) as ReadableStream, {
        headers: {
            "content-disposition": `attachment; filename="${fileName}"`,
            "content-type": options.contentType,
            ...options.headers,
        },
    });
}

export class FileSizeLimitError extends Error {}
