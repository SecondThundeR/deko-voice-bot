import type {
    FullStats,
    FullUsersStats,
    FullVoicesStats,
} from "@deko-voice-bot/database/queries/stats.js";
import type { TranslateFunction } from "@grammyjs/i18n";
import { escapeHTML } from "./html.ts";
import { formatMoscowDateTime } from "./time.ts";

function formatUserStatsLine(
    translate: TranslateFunction,
    locale: string,
    { username, fullname, usesAmount, lastUsedAt }: FullUsersStats,
) {
    const userName = escapeHTML(username ? `@${username}` : (fullname ?? ""));

    if (lastUsedAt) {
        return translate("stats-user-line-with-date", {
            userName,
            usesAmount,
            lastUsedAt: escapeHTML(formatMoscowDateTime(lastUsedAt, locale)),
        });
    }

    return translate("stats-user-line", { userName, usesAmount });
}

function formatVoiceStatsLine(
    translate: TranslateFunction,
    { voiceTitle, usesAmount }: FullVoicesStats,
) {
    return translate("stats-voice-line", {
        voiceTitle: escapeHTML(voiceTitle),
        usesAmount,
    });
}

export function getFullStatsData(
    {
        mostUsedUsersStats,
        lastUsedUsersStats,
        mostUsedVoicesStats,
        ...basicStats
    }: FullStats,
    translate: TranslateFunction,
    locale: string,
) {
    const mostUsedUsers = mostUsedUsersStats
        .map((user) => formatUserStatsLine(translate, locale, user))
        .join("\n");
    const mostUsedVoices = mostUsedVoicesStats
        .map((voice) => formatVoiceStatsLine(translate, voice))
        .join("\n");
    const lastUsedUsers = lastUsedUsersStats
        .map((user) => formatUserStatsLine(translate, locale, user))
        .join("\n");

    const noData = translate("stats-no-data");

    return {
        ...basicStats,
        mostUsedUsers: mostUsedUsers || noData,
        lastUsedUsers: lastUsedUsers || noData,
        mostUsedVoices: mostUsedVoices || noData,
    };
}
