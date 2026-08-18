import { Hono } from "hono";
import type { ApiDependencies } from "./dependencies.ts";
import { createAccountRoutes } from "./routes/account.ts";
import { createAdminModerationRoutes } from "./routes/admin-moderation.ts";
import { createAdminUploadRoutes } from "./routes/admin-uploads.ts";
import { createPublicRoutes } from "./routes/public.ts";
import { createStatsRoutes } from "./routes/stats.ts";
import { createSubmissionRoutes } from "./routes/submissions.ts";
import type { ApiEnv } from "./types.ts";

export function createRoutes(deps: ApiDependencies) {
    return new Hono<ApiEnv>()
        .route("/", createAccountRoutes(deps))
        .route("/", createStatsRoutes(deps))
        .route("/", createAdminModerationRoutes(deps))
        .route("/", createAdminUploadRoutes(deps))
        .route("/", createPublicRoutes(deps))
        .route("/", createSubmissionRoutes(deps));
}
