import { getFavoritesMenuIdentificator } from "@/src/helpers/menu.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const fingerprintHandler = (ctx: BotContext) =>
    getFavoritesMenuIdentificator(ctx);
