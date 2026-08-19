import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function findEnvironmentFile(startDirectory: string) {
    let directory = resolve(startDirectory);

    for (;;) {
        const environmentFile = join(directory, ".env");
        if (
            existsSync(environmentFile) ||
            existsSync(join(directory, "pnpm-workspace.yaml"))
        ) {
            return environmentFile;
        }

        const parent = dirname(directory);
        if (parent === directory) {
            return join(resolve(startDirectory), ".env");
        }
        directory = parent;
    }
}

export function loadEnvironmentFile() {
    try {
        process.loadEnvFile(
            findEnvironmentFile(process.env.INIT_CWD ?? process.cwd()),
        );
    } catch (error) {
        if (
            !error ||
            typeof error !== "object" ||
            !("code" in error) ||
            error.code !== "ENOENT"
        ) {
            throw error;
        }
    }
}
