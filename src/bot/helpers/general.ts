type FFMPEGConvertResult =
    | { status: true; error: undefined }
    | {
          status: false;
          error: string;
      };

let _canRunFFMPEG: boolean | null = null;

async function canRunFFMPEG() {
    try {
        const { exited } = Bun.spawn(["ffmpeg", "-version"], {
            stdout: null,
            stderr: null,
        });

        return (await exited) === 0;
    } catch {
        return false;
    }
}

export async function getFFMPEGStatus() {
    if (_canRunFFMPEG === null) {
        _canRunFFMPEG = await canRunFFMPEG();
    }
    return _canRunFFMPEG;
}

export async function convertMP3ToOGGOpus(
    inputFilename: string,
    outputFilename: string,
): Promise<FFMPEGConvertResult> {
    try {
        const { exited, stderr } = Bun.spawn([
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            inputFilename,
            "-c:a",
            "libopus",
            outputFilename,
        ]);

        if ((await exited) === 0)
            return {
                status: true,
                error: undefined,
            };

        return {
            status: false,
            error: await new Response(stderr).text(),
        };
    } catch (error: unknown) {
        if (!(error instanceof Error)) {
            return {
                status: false,
                error: "Unknown error occurred",
            };
        }

        return {
            status: false,
            error: error.message,
        };
    }
}

export function isEmpty(val: unknown) {
    return val == null || !(Object.keys(val) || val).length;
}

export async function readTextWithLimit(
    stream: ReadableStream<Uint8Array> | null | undefined,
    maxBytes: number,
) {
    if (!stream) return "";

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let bytesRead = 0;
    let isTruncated = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (bytesRead < maxBytes) {
            const remainingBytes = maxBytes - bytesRead;
            const chunk =
                value.byteLength > remainingBytes
                    ? value.slice(0, remainingBytes)
                    : value;

            chunks.push(decoder.decode(chunk, { stream: true }));
        }

        bytesRead += value.byteLength;
        if (bytesRead > maxBytes) isTruncated = true;
    }

    chunks.push(decoder.decode());

    if (isTruncated) {
        chunks.push("\n... stderr output truncated");
    }

    return chunks.join("");
}
