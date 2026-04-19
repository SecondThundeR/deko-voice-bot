import { resolve } from "node:path";
import { cwd } from "node:process";
import { I18n } from "@grammyjs/i18n";

import type { Context } from "./context";

export const i18n = new I18n<Context>({
    defaultLocale: "ru",
    directory: resolve(cwd(), "locales"),
    globalTranslationContext: (ctx) => ({
        botUsername: `@${ctx.me.username}`,
    }),
    useSession: true,
    fluentBundleOptions: {
        useIsolating: true,
    },
});
