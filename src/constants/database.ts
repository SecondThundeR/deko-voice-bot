export const databaseNames = {
    general: "general",
} as const;

export const collectionNames = {
    [databaseNames.general]: {
        featureFlags: "featureFlags",
        voices: "voices",
        ignoredUsers: "ignoredUsers",
        usersData: "usersData",
    },
} as const;

export const featureFlags = {
    maintenance: "maintenance",
} as const;
