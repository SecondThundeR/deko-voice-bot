type FFMPEGConvertResult =
    | { status: true; error: undefined }
    | {
          status: false;
          error: string;
      };

export async function canRunFFMPEG() {
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
