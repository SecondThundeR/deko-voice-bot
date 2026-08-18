import type { telegramAuth } from "../auth.ts";
import type {
    convertAndSendVoice,
    validateMp3Upload,
} from "../integrations/audio.ts";
import type {
    deleteTelegramMessage,
    editTelegramCaption,
    getTelegramFile,
    prepareVoiceMessage,
    sendSubmissionToModeration,
    sendTelegramMessage,
} from "../integrations/telegram.ts";
import type { logger } from "../observability/logger.ts";
import type { ApiMetrics } from "../observability/metrics.ts";
import type { RateLimiter } from "../rate-limit.ts";

export interface DatabaseTraffic {
    database<T>(operation: () => Promise<T>): Promise<T>;
}

export interface ApiDependencies extends DatabaseTraffic {
    logger: Pick<typeof logger, "info" | "warn" | "error">;
    readiness: {
        isReady(): Promise<boolean>;
        setDraining?(draining: boolean): void;
    };
    corsOrigins?: readonly string[];
    /** Enable only when the API receives the actual client socket address. */
    ipRateLimitEnabled?: boolean;
    metrics?: ApiMetrics;
    metricsToken?: string;
    rateLimiter: RateLimiter;
    telegramAuth: typeof telegramAuth;
    getUserData: typeof import("@deko-voice-bot/database/queries/users.js").getUserData;
    getUserIsIgnoredStatus: typeof import("@deko-voice-bot/database/queries/users.js").getUserIsIgnoredStatus;
    optInUser: typeof import("@deko-voice-bot/database/queries/users.js").optInUser;
    optOutUser: typeof import("@deko-voice-bot/database/queries/users.js").optOutUser;
    addUserFavorite: typeof import("@deko-voice-bot/database/queries/users-favorites.js").addUserFavorite;
    deleteUserFavorite: typeof import("@deko-voice-bot/database/queries/users-favorites.js").deleteUserFavorite;
    addVoice: typeof import("@deko-voice-bot/database/queries/voices.js").addVoice;
    getVoiceById: typeof import("@deko-voice-bot/database/queries/voices.js").getVoiceById;
    getVoicesPage: typeof import("@deko-voice-bot/database/queries/voices.js").getVoicesPage;
    getFullStats: typeof import("@deko-voice-bot/database/queries/stats.js").getFullStats;
    approveVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").approveVoiceSubmission;
    claimVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").claimVoiceSubmission;
    createVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").createVoiceSubmission;
    getAdminVoiceSubmissions: typeof import("@deko-voice-bot/database/queries/submissions.js").getAdminVoiceSubmissions;
    getUserVoiceSubmissions: typeof import("@deko-voice-bot/database/queries/submissions.js").getUserVoiceSubmissions;
    getVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").getVoiceSubmission;
    markVoiceSubmissionFailed: typeof import("@deko-voice-bot/database/queries/submissions.js").markVoiceSubmissionFailed;
    markVoiceSubmissionPending: typeof import("@deko-voice-bot/database/queries/submissions.js").markVoiceSubmissionPending;
    rejectVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").rejectVoiceSubmission;
    releaseVoiceSubmission: typeof import("@deko-voice-bot/database/queries/submissions.js").releaseVoiceSubmission;
    toAdminSubmissionDto: typeof import("@deko-voice-bot/database/queries/submissions.js").toAdminSubmissionDto;
    toSubmissionDto: typeof import("@deko-voice-bot/database/queries/submissions.js").toSubmissionDto;
    updateVoiceSubmissionTitle: typeof import("@deko-voice-bot/database/queries/submissions.js").updateVoiceSubmissionTitle;
    convertAndSendVoice: typeof convertAndSendVoice;
    validateMp3Upload: typeof validateMp3Upload;
    deleteTelegramMessage: typeof deleteTelegramMessage;
    editTelegramCaption: typeof editTelegramCaption;
    getTelegramFile: typeof getTelegramFile;
    prepareVoiceMessage: typeof prepareVoiceMessage;
    sendSubmissionToModeration: typeof sendSubmissionToModeration;
    sendTelegramMessage: typeof sendTelegramMessage;
    randomUUID(): string;
}

export type AccountRouteDependencies = Pick<
    ApiDependencies,
    | "database"
    | "getUserData"
    | "getUserIsIgnoredStatus"
    | "optInUser"
    | "optOutUser"
>;
export type AdminModerationRouteDependencies = Pick<
    ApiDependencies,
    | "database"
    | "approveVoiceSubmission"
    | "claimVoiceSubmission"
    | "convertAndSendVoice"
    | "deleteTelegramMessage"
    | "editTelegramCaption"
    | "getAdminVoiceSubmissions"
    | "getTelegramFile"
    | "getVoiceSubmission"
    | "rejectVoiceSubmission"
    | "releaseVoiceSubmission"
    | "sendTelegramMessage"
    | "toAdminSubmissionDto"
    | "toSubmissionDto"
    | "updateVoiceSubmissionTitle"
> &
    Pick<ApiDependencies, "logger">;
export type AdminUploadRouteDependencies = Pick<
    ApiDependencies,
    | "addVoice"
    | "convertAndSendVoice"
    | "database"
    | "deleteTelegramMessage"
    | "getVoiceById"
    | "logger"
    | "validateMp3Upload"
>;
export type PublicRouteDependencies = Pick<
    ApiDependencies,
    | "addUserFavorite"
    | "database"
    | "deleteUserFavorite"
    | "getTelegramFile"
    | "getUserIsIgnoredStatus"
    | "getVoiceById"
    | "getVoicesPage"
    | "prepareVoiceMessage"
    | "logger"
>;
export type StatsRouteDependencies = Pick<
    ApiDependencies,
    "database" | "getFullStats"
>;
export type SubmissionRouteDependencies = Pick<
    ApiDependencies,
    | "createVoiceSubmission"
    | "database"
    | "getUserIsIgnoredStatus"
    | "getUserVoiceSubmissions"
    | "markVoiceSubmissionFailed"
    | "markVoiceSubmissionPending"
    | "randomUUID"
    | "sendSubmissionToModeration"
    | "toSubmissionDto"
    | "validateMp3Upload"
    | "logger"
>;
