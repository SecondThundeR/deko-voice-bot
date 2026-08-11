import { findPackageJSON } from "node:module";
import { dirname, resolve } from "node:path";
import { I18n } from "@grammyjs/i18n";

import type { Context } from "./context.ts";
import { escapeHTML } from "./helpers/html.ts";

const packageJsonPath = findPackageJSON(".", import.meta.url);
if (!packageJsonPath) {
    throw new Error("Unable to locate package.json for locale loading");
}

export const i18n = new I18n<Context>({
    defaultLocale: "ru",
    directory: resolve(dirname(packageJsonPath), "locales"),
    globalTranslationContext: (ctx) => ({
        botUsername: escapeHTML(`@${ctx.me.username}`),
    }),
    useSession: true,
    fluentBundleOptions: {
        useIsolating: false,
    },
});
