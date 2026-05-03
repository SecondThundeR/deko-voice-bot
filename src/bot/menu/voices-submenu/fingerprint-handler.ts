import type { Context } from "@/bot/context";
import { getVoiceSubmenuIdentificator } from "@/bot/helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getVoiceSubmenuIdentificator(ctx);
