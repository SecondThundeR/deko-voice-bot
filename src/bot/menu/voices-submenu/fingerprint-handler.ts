import type { Context } from "../../context";
import { getVoiceSubmenuIdentificator } from "../../helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getVoiceSubmenuIdentificator(ctx);
