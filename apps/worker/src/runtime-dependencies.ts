import {
    claimOutboxJobs,
    completeOutboxJob,
    failOutboxJob,
    retryOutboxJob,
} from "@deko-voice-bot/database/queries/outbox.js";
import { logger } from "./logger.ts";

export const runtimeDependencies = {
    claim: claimOutboxJobs,
    complete: completeOutboxJob,
    fail: failOutboxJob,
    retry: retryOutboxJob,
    logger,
};
