declare module "bun" {
    interface Env {
        ADMIN_IDS: string;
        BOT_TOKEN: string;
        DATABASE_URL: string;
        STICKER_FILE_ID_FOR_DEEPLINK?: string;
    }
}
