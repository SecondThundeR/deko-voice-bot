declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: "development" | "production";
            BOT_TOKEN: string;
            DATABASE_URL: string;
            ADMIN_IDS?: string;
            VOICE_MODERATION_CHAT_ID: string;
            PORT?: string;
            LOG_LEVEL?: string;
            LOG_FORMAT?: "pretty" | "json";
        }
    }
}

export {};
