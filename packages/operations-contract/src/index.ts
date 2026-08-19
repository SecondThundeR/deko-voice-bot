import * as v from "valibot";

export const OPERATIONS_ROUTES = {
    exportDatabase: "/database/exports",
    health: "/health",
    importDatabase: (operationId: string) => `/database/imports/${operationId}`,
    importEmergencyBackup: (operationId: string) =>
        `/database/imports/${operationId}/emergency-backup`,
    importRestore: (operationId: string) =>
        `/database/imports/${operationId}/restore`,
    voiceConvert: "/voice/convert",
} as const;

export const operationsHealthSchema = v.object({
    ffmpegAvailable: v.boolean(),
    restoringDatabase: v.boolean(),
    status: v.literal(true),
});

export const preparedImportSchema = v.object({
    operationId: v.string(),
    sha256: v.string(),
    size: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
});

export const completedImportSchema = v.object({
    operationId: v.string(),
    status: v.literal("completed"),
});

export const operationErrorSchema = v.object({
    code: v.optional(v.string()),
    error: v.string(),
});

export type OperationsHealth = v.InferOutput<typeof operationsHealthSchema>;
export type PreparedImport = v.InferOutput<typeof preparedImportSchema>;
export type CompletedImport = v.InferOutput<typeof completedImportSchema>;
