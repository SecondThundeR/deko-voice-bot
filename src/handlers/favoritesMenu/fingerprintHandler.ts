import { getFavoritesMenuIdentificator } from "@/src/helpers/menu";

import type { BotContext } from "@/src/types/bot";

export const fingerprintHandler = (ctx: BotContext) =>
    getFavoritesMenuIdentificator(ctx);
