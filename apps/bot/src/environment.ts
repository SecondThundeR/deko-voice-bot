export function loadEnvironmentFile() {
    try {
        process.loadEnvFile();
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
