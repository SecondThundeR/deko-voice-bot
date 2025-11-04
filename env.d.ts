declare module "bun" {
    interface Env {
        ADMIN_IDS: string;
        BOT_TOKEN: string;
        DATABASE_URL: string;
    }
}
