import { object, array, string, boolean, number } from "zod";

import {
    FEATURE_FLAG_NAME_LENGTH,
    FILE_ID_LENGTH,
    FILE_UNIQUE_ID_LENGTH,
    FULLNAME_LENGTH,
    USERNAME_LENGTH,
    VOICE_ID_LENGTH,
    VOICE_TITLE_LENGTH,
} from "@/drizzle/constraints";

export const importFileSchema = object({
    featureFlags: array(
        object({
            name: string().max(FEATURE_FLAG_NAME_LENGTH),
            status: boolean(),
        }),
    ),
    voices: array(
        object({
            voiceId: string().max(VOICE_ID_LENGTH),
            voiceTitle: string().max(VOICE_TITLE_LENGTH),
            url: string().nullable(),
            fileId: string().max(FILE_ID_LENGTH).nullable(),
            fileUniqueId: string().max(FILE_UNIQUE_ID_LENGTH),
            usesAmount: number().default(0),
        }),
    ),
    users: array(
        object({
            userId: number(),
            fullname: string().max(FULLNAME_LENGTH).nullable(),
            username: string().max(USERNAME_LENGTH).nullable(),
            usesAmount: number().default(0).nullable(),
            lastUsedAt: number().nullable(),
            isIgnored: boolean().default(false),
        }),
    ),
    usersFavorites: array(
        object({
            userId: number(),
            voiceId: string().max(VOICE_ID_LENGTH),
        }),
    ),
});
