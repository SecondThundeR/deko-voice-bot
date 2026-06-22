import type { Context } from "#root/bot/context.js";
import { getFavoritesMenuIdentificator } from "#root/bot/helpers/menu.js";

export const fingerprintHandler = (ctx: Context) =>
    getFavoritesMenuIdentificator(ctx);
