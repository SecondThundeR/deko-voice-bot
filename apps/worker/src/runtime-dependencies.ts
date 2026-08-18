import {
    claimOutboxJobs,
    completeOutboxJob,
    extendOutboxJobLease,
    failOutboxJob,
    retryOutboxJob,
} from "@deko-voice-bot/database/queries/outbox.js";
import { logger } from "./logger.ts";

export const runtimeDependencies = {
    claim: claimOutboxJobs,
    complete: completeOutboxJob,
    extend: extendOutboxJobLease,
    fail: failOutboxJob,
    retry: retryOutboxJob,
    logger,
};
