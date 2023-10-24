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
        voiceStats: "voiceStats",
        usersStats: "usersStats",
    },
} as const;
