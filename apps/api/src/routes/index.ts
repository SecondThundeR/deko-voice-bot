import { Hono } from "hono";
import type { ApiDependencies } from "../dependencies/types.ts";
import type { ApiEnv } from "../types.ts";
import { createAccountRoutes } from "./account.ts";
import { createAdminModerationRoutes } from "./admin-moderation.ts";
import { createAdminUploadRoutes } from "./admin-uploads.ts";
import { createPublicRoutes } from "./public.ts";
import { createStatsRoutes } from "./stats.ts";
import { createSubmissionRoutes } from "./submissions.ts";

export function createRoutes(deps: ApiDependencies) {
    return new Hono<ApiEnv>()
        .route("/", createAccountRoutes(deps))
        .route("/", createStatsRoutes(deps))
        .route("/", createAdminModerationRoutes(deps))
        .route("/", createAdminUploadRoutes(deps))
        .route("/", createPublicRoutes(deps))
        .route("/", createSubmissionRoutes(deps));
}
