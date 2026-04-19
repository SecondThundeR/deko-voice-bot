import type { Context } from "../../context";
import { getFavoritesMenuIdentificator } from "../../helpers/menu";

export const fingerprintHandler = (ctx: Context) =>
    getFavoritesMenuIdentificator(ctx);
