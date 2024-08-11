export const DATABASE_NAMES = {
    general: "general",
} as const;

export const COLLECTION_NAMES = {
    [DATABASE_NAMES.general]: {
        featureFlags: "featureFlags",
        voices: "voices",
        ignoredUsers: "ignoredUsers",
        usersData: "usersData",
    },
} as const;

export const FEATURE_FLAGS = {
    maintenance: "maintenance",
} as const;
