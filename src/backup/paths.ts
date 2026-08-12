import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createBackupTempPaths(prefix: string) {
    const basename = join(tmpdir(), `${prefix}-${randomUUID()}`);

    return {
        dump: `${basename}.dump`,
        package: `${basename}.package`,
        encrypted: `${basename}.dump.enc`,
    };
}

export function createDatedBackupFileName(prefix: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${prefix}-${timestamp}.dump.enc`;
}
