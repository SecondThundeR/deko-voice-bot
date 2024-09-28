import { z } from "zod";

import {
    FEATURE_FLAG_NAME_LENGTH,
    FILE_ID_LENGTH,
    FILE_UNIQUE_ID_LENGTH,
    FULLNAME_LENGTH,
    USERNAME_LENGTH,
    VOICE_ID_LENGTH,
    VOICE_TITLE_LENGTH,
} from "@/drizzle/constraints";

export const importFileSchema = z.object({
    featureFlags: z.array(
        z.object({
            name: z.string().max(FEATURE_FLAG_NAME_LENGTH),
            status: z.boolean(),
        }),
    ),
    voices: z.array(
        z.object({
            voiceId: z.string().max(VOICE_ID_LENGTH),
            voiceTitle: z.string().max(VOICE_TITLE_LENGTH),
            url: z.string().nullable(),
            fileId: z.string().max(FILE_ID_LENGTH).nullable(),
            fileUniqueId: z.string().max(FILE_UNIQUE_ID_LENGTH),
            usesAmount: z.number().default(0),
        }),
    ),
    users: z.array(
        z.object({
            userId: z.number(),
            fullname: z.string().max(FULLNAME_LENGTH).nullable(),
            username: z.string().max(USERNAME_LENGTH).nullable(),
            usesAmount: z.number().default(0),
            lastUsedAt: z.number().nullable(),
            isIgnored: z.boolean().default(false),
        }),
    ),
    usersFavorites: z.array(
        z.object({
            userId: z.number(),
            voiceId: z.string().max(VOICE_ID_LENGTH),
        }),
    ),
});
