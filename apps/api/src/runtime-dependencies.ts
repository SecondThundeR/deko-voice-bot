import { randomUUID } from "node:crypto";
import * as stats from "@deko-voice-bot/database/queries/stats.js";
import * as submissions from "@deko-voice-bot/database/queries/submissions.js";
import * as users from "@deko-voice-bot/database/queries/users.js";
import * as favorites from "@deko-voice-bot/database/queries/users-favorites.js";
import * as voices from "@deko-voice-bot/database/queries/voices.js";
import { withDatabaseTraffic } from "@deko-voice-bot/database/traffic.js";
import * as audio from "./audio.ts";
import { telegramAuth } from "./auth.ts";
import type { ApiDependencies } from "./dependencies.ts";
import { logger } from "./logger.ts";
import * as telegram from "./telegram.ts";

export const runtimeDependencies: ApiDependencies = {
    database: withDatabaseTraffic,
    logger,
    telegramAuth,
    randomUUID,
    ...audio,
    ...telegram,
    ...submissions,
    ...stats,
    ...users,
    ...favorites,
    ...voices,
};
