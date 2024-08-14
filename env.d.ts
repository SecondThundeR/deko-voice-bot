declare module "bun" {
    interface Env {
        CREATOR_ID?: string;
        BOT_TOKEN?: string;
        DATABASE_URL?: string;
        STICKER_FILE_ID_FOR_DEEPLINK?: string;
    }
}
