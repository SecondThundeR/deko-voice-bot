import type { Context } from "../../context";
import { getVoicesMenuIdentificator } from "../../helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getVoicesMenuIdentificator(ctx);
