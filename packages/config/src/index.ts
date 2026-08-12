import * as v from "valibot";

export const logLevelSchema = v.optional(
    v.picklist(["trace", "debug", "info", "warn", "error", "fatal", "silent"]),
    "info",
);

export const jsonBooleanSchema = v.optional(
    v.pipe(v.string(), v.transform(JSON.parse), v.boolean()),
    "false",
);

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

export function parseEnvironment<TSchema extends v.GenericSchema>(
    schema: TSchema,
    input: unknown,
) {
    loadEnvironmentFile();
    try {
        return v.parse(schema, input);
    } catch (error) {
        throw new Error("Invalid config", { cause: error });
    }
}
