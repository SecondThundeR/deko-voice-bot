import { Api, Context, User } from "@/deps.ts";

import { creatorCommands } from "@/src/constants/creatorCommands.ts";
import { userCommands } from "@/src/constants/userCommands.ts";

import { getFullName } from "@/src/helpers/general.ts";

/**
 * Registers commands for regular user
 *
 * @param api Api object to register commands
 */
export async function registerUserCommands(api: Api) {
    await api.setMyCommands(userCommands);
}

/**
 * Registers commands for creator
 *
 * @description If ID is missing, skips registering
 *
 * @param api Api object to register commands
 * @param creatorID ID of creator (or undefined, if not provided)
 */
export async function registerCreatorCommands(api: Api, creatorID?: string) {
    if (!creatorID) return;

    await api.setMyCommands(creatorCommands, {
        scope: {
            type: "chat",
            chat_id: Number(creatorID),
        },
    });
}

/**
 * Extracts essential fields from user object
 *
 * @param ctx User object
 * @returns Object with user's id, full name and username
 */
export function extractUserDetails(from?: User) {
    if (!from) return null;

    const { id: userID, first_name, last_name, username } = from;
    const fullName = getFullName(first_name, last_name);

    return { userID, fullName, username };
}

/**
 * Sends chat action to check, if user blocks bot (Method throws error, if bot is blocked)
 *
 * @param ctx Context object to send chat action
 * @returns Status of bot block
 */
export async function isBotBlockedByUser(ctx: Context) {
    try {
        await ctx.replyWithChatAction("find_location");
        return false;
    } catch (_error: unknown) {
        return true;
    }
}

/**
 * Returns chat ID as string for using as a session key
 *
 * @description Needed for runner's `sequentialize`
 *
 * @param ctx Context object
 * @returns String representation of chat's ID
 */
export function getSessionKey(ctx: Context) {
    return ctx.chat?.id.toString();
}

/**
 * Fetches media file and returns blob of it
 *
 * @param filePath Telegram's file path to get file
 * @returns Blob of fetched file
 */
export async function fetchMediaFileBlob(filePath: string) {
    const token = Deno.env.get("BOT_TOKEN");
    if (!token) return null;

    const file = await fetch(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
    );
    const blob = await file.blob();

    return blob;
}
