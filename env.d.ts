declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: "development" | "production";
            BOT_TOKEN: string;
            BOT_MODE?: "polling" | "webhook";
            BOT_ALLOWED_UPDATES?: string;
            BOT_WEBHOOK?: string;
            BOT_WEBHOOK_SECRET?: string;
            SERVER_HOST?: string;
            SERVER_PORT?: string;
            DATABASE_URL: string;
            REDIS_URL?: string;
            BACKUP_ENCRYPTION_KEY: string;
            BACKUP_MAX_SIZE_MB?: string;
            IMPORT_SESSION_TTL_MINUTES?: string;
            ADMIN_IDS?: string;
            LOG_LEVEL?:
                | "trace"
                | "debug"
                | "info"
                | "warn"
                | "error"
                | "fatal"
                | "silent";
            LOG_COLORIZE?: string;
            LOG_FORMAT?: "pretty" | "json";
            USE_DEBUG?: string;
        }
    }
}

export {};
