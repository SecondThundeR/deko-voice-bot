import type { Api, Context } from "grammy";

import { CREATOR_COMMANDS } from "@/src/constants/creatorCommands";
import { BASE_LINK_URL } from "@/src/constants/general";
import { USER_COMMANDS } from "@/src/constants/userCommands";

export async function registerUserCommands(api: Api) {
    await api.setMyCommands(USER_COMMANDS);
}

export async function registerCreatorCommands(api: Api, creatorID?: string) {
    if (!creatorID) return;

    await api.setMyCommands(CREATOR_COMMANDS, {
        scope: {
            type: "chat",
            chat_id: Number(creatorID),
        },
    });
}

export async function isBotBlockedByUser(ctx: Context) {
    try {
        await ctx.replyWithChatAction("find_location");
        return false;
    } catch (_error: unknown) {
        return true;
    }
}

export function getSessionKey(ctx: Context) {
    return ctx.chat?.id.toString();
}

export async function fetchMediaFileBlob(filePath: string, token: string) {
    const file = await fetch(`${BASE_LINK_URL}${token}/${filePath}`);
    const blob = await file.blob();

    return blob;
}
