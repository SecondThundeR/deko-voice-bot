import type { Context } from "#root/bot/context.js";
import { getVoicesMenuIdentificator } from "#root/bot/helpers/menu.js";

export const fingerprintHandler = (ctx: Context) =>
    getVoicesMenuIdentificator(ctx);
