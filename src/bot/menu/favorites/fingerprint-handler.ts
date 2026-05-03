import type { Context } from "@/bot/context";
import { getFavoritesMenuIdentificator } from "@/bot/helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getFavoritesMenuIdentificator(ctx);
