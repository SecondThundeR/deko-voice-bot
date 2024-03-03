import { newRemoteVoices } from "@/src/conversations/newRemoteVoices.ts";
import { newVoices } from "@/src/conversations/newVoices.ts";
import { updateVoiceFile } from "@/src/conversations/updateVoiceFile.ts";
import { updateVoiceID } from "@/src/conversations/updateVoiceID.ts";
import { updateVoiceTitle } from "@/src/conversations/updateVoiceTitle.ts";
import { updateVoiceURL } from "@/src/conversations/updateVoiceURL.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

type ConversationsData = [
    string,
    ((conversation: ConversationContext, ctx: BotContext) => Promise<void>),
];

export const CONVERSATIONS: ConversationsData[] = [
    ["new-remove-voices", newRemoteVoices],
    ["new-voices", newVoices],
    ["voice-file-update", updateVoiceFile],
    ["voice-id-update", updateVoiceID],
    ["voice-title-update", updateVoiceTitle],
    ["voice-url-update", updateVoiceURL],
];
