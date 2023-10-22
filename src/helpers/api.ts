import { Api, User } from "@/deps.ts";

import { creatorCommands } from "@/src/constants/creatorCommands.ts";
import { getFullName } from "@/src/helpers/general.ts";

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
export function extractUserDetails(from: User) {
    const { id, first_name, last_name, username } = from;

    return {
        userID: id,
        fullName: getFullName(first_name, last_name),
        username,
    };
}
