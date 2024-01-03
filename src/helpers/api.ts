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
 * Returns object for setting up reply on message
 *
 * @description If passed `messageId` is missing, returning `undefined` instead
 *
 * @param messageId ID of message to reply on
 * @returns Object with reply parameters or `undefined`, if message ID in `undefined`
 */
export function getReplyParameters(messageId?: number) {
    if (!messageId) return;

    return {
        reply_parameters: {
            message_id: messageId,
        },
    };
}
