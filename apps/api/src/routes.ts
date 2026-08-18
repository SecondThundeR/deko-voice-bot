import { Hono } from "hono";
import { accountRoutes } from "./routes/account.ts";
import { adminModerationRoutes } from "./routes/admin-moderation.ts";
import { adminUploadRoutes } from "./routes/admin-uploads.ts";
import { publicRoutes } from "./routes/public.ts";
import { statsRoutes } from "./routes/stats.ts";
import { submissionRoutes } from "./routes/submissions.ts";
import type { ApiEnv } from "./types.ts";

export const routes = new Hono<ApiEnv>()
    .route("/", accountRoutes)
    .route("/", statsRoutes)
    .route("/", adminModerationRoutes)
    .route("/", adminUploadRoutes)
    .route("/", publicRoutes)
    .route("/", submissionRoutes);
