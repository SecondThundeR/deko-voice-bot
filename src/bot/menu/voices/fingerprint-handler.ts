import type { Context } from "@/bot/context";
import { getVoicesMenuIdentificator } from "@/bot/helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getVoicesMenuIdentificator(ctx);
