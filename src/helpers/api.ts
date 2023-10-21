import { Api } from "@/deps.ts";

import { creatorCommands } from "@/src/constants.ts";

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
