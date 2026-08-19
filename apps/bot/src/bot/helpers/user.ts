import type { TranslateFunction } from "@grammyjs/i18n";
import type { User } from "grammy/types";
import type { SelectUser } from "#drizzle/schema.js";

import { escapeHTML } from "./html.ts";
import { formatMoscowDateTime } from "./time.ts";

export function getLocalizedUserData(
    translate: TranslateFunction,
    locale: string,
    {
        userId,
        fullname,
        username,
        lastUsedAt,
        usesAmount,
    }: Omit<SelectUser, "isIgnored">,
) {
    const lines = [translate("my-data-user-id", { userId })];

    if (fullname) {
        lines.push(
            translate("my-data-full-name", {
                fullName: escapeHTML(fullname),
            }),
        );
    }
    if (username) {
        lines.push(
            translate("my-data-username", { username: escapeHTML(username) }),
        );
    }

    lines.push(translate("my-data-uses-amount", { usesAmount }));

    if (lastUsedAt) {
        lines.push(
            translate("my-data-last-used-at", {
                lastUsedAt: escapeHTML(
                    formatMoscowDateTime(lastUsedAt, locale),
                ),
            }),
        );
    }

    return lines.join("\n");
}

function getUserFullname(firstName: string, lastName?: string) {
    return !lastName ? firstName : `${firstName} ${lastName}`;
}

export function extractUserDetails(from: User) {
    const { id: userId, first_name, last_name, username = null } = from;
    const fullname = getUserFullname(first_name, last_name);

    return { userId, fullname, username: username ?? null };
}
