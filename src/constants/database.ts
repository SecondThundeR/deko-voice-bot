export const databaseNames = {
    general: "general",
    deko: "deko",
} as const;

export const collectionNames = {
    [databaseNames.general]: {
        featureFlags: "featureFlags",
    },
    [databaseNames.deko]: {
        voices: "voices",
        ignoredUsers: "ignoredUsers",
        usersStats: "usersStats",
    },
} as const;

export const featureFlags = {
    maintenance: "maintenance",
} as const;
