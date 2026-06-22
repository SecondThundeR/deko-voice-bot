import type { Context } from "#root/bot/context.js";
import { getVoiceSubmenuIdentificator } from "#root/bot/helpers/menu.js";

export const fingerprintHandler = (ctx: Context) =>
    getVoiceSubmenuIdentificator(ctx);
