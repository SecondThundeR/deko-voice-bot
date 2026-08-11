import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createBackupTempPaths(prefix: string) {
    const basename = join(tmpdir(), `${prefix}-${randomUUID()}`);

    return {
        dump: `${basename}.dump`,
        encrypted: `${basename}.dump.enc`,
    };
}
