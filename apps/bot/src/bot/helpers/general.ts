import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createVoiceTempFilePaths() {
    const basename = join(tmpdir(), `deko-voice-${randomUUID()}`);

    return {
        input: `${basename}.mp3`,
        output: `${basename}.ogg`,
    };
}
