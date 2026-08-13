import * as v from "valibot";

export const MAX_SUBMISSION_FILE_BYTES = 20 * 1024 * 1024;
export const SUBMISSION_RETENTION_DAYS = 90;
export const SUBMISSION_DAILY_LIMIT = 3;
export const SUBMISSION_PENDING_LIMIT = 3;

export const apiErrorSchema = v.object({
    error: v.object({
        code: v.string(),
        message: v.string(),
        requestId: v.optional(v.string()),
    }),
});

export const viewerSchema = v.object({
    id: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    isAdmin: v.boolean(),
    hasConsent: v.boolean(),
});

export const statsSchema = v.object({
    allUsedUsers: v.number(),
    allIgnoredUsers: v.number(),
    allMAUUsers: v.number(),
    allInactiveUsers: v.number(),
    allUsedVoices: v.number(),
});

export const publicLeaderboardUserSchema = v.object({
    visibility: v.literal("masked"),
    displayName: v.string(),
    usesAmount: v.number(),
    lastUsedAt: v.nullable(v.number()),
});

export const adminLeaderboardUserSchema = v.object({
    visibility: v.literal("full"),
    fullname: v.nullable(v.string()),
    username: v.nullable(v.string()),
    usesAmount: v.number(),
    lastUsedAt: v.nullable(v.number()),
});

export const leaderboardUserSchema = v.variant("visibility", [
    publicLeaderboardUserSchema,
    adminLeaderboardUserSchema,
]);

export const leaderboardVoiceSchema = v.object({
    voiceTitle: v.string(),
    usesAmount: v.number(),
});

export const leaderboardsSchema = v.object({
    mostUsedUsers: v.array(leaderboardUserSchema),
    lastUsedUsers: v.array(leaderboardUserSchema),
    mostUsedVoices: v.array(leaderboardVoiceSchema),
});

export const voiceSchema = v.object({
    voiceId: v.string(),
    voiceTitle: v.string(),
    usesAmount: v.number(),
    isFavorite: v.boolean(),
});

export const voicesPageSchema = v.object({
    items: v.array(voiceSchema),
    nextOffset: v.nullable(v.number()),
});

export const submissionStatusSchema = v.picklist([
    "uploading",
    "pending",
    "processing",
    "approved",
    "rejected",
    "failed",
]);

export const submissionSchema = v.object({
    id: v.string(),
    title: v.string(),
    status: submissionStatusSchema,
    rejectionReason: v.nullable(v.string()),
    approvedVoiceId: v.nullable(v.string()),
    createdAt: v.string(),
    finalizedAt: v.nullable(v.string()),
});

export const submissionsSchema = v.array(submissionSchema);

export const adminSubmissionBucketSchema = v.picklist(["queue", "history"]);

export const adminSubmissionSchema = v.object({
    id: v.string(),
    title: v.string(),
    status: submissionStatusSchema,
    rejectionReason: v.nullable(v.string()),
    approvedVoiceId: v.nullable(v.string()),
    createdAt: v.string(),
    finalizedAt: v.nullable(v.string()),
    moderatorUserId: v.nullable(v.number()),
    submitter: v.object({
        id: v.number(),
        fullname: v.nullable(v.string()),
        username: v.nullable(v.string()),
    }),
});

export const adminSubmissionsPageSchema = v.object({
    items: v.array(adminSubmissionSchema),
    nextOffset: v.nullable(v.number()),
});

export type ApiError = v.InferOutput<typeof apiErrorSchema>;
export type Viewer = v.InferOutput<typeof viewerSchema>;
export type Stats = v.InferOutput<typeof statsSchema>;
export type Leaderboards = v.InferOutput<typeof leaderboardsSchema>;
export type Voice = v.InferOutput<typeof voiceSchema>;
export type VoicesPage = v.InferOutput<typeof voicesPageSchema>;
export type Submission = v.InferOutput<typeof submissionSchema>;
export type SubmissionStatus = v.InferOutput<typeof submissionStatusSchema>;
export type AdminSubmissionBucket = v.InferOutput<
    typeof adminSubmissionBucketSchema
>;
export type AdminSubmission = v.InferOutput<typeof adminSubmissionSchema>;
export type AdminSubmissionsPage = v.InferOutput<
    typeof adminSubmissionsPageSchema
>;
