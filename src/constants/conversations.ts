import { newRemoteVoices } from "@/src/conversations/newRemoteVoices";
import { newVoices } from "@/src/conversations/newVoices";
import { updateVoiceFile } from "@/src/conversations/updateVoiceFile";
import { updateVoiceID } from "@/src/conversations/updateVoiceID";
import { updateVoiceTitle } from "@/src/conversations/updateVoiceTitle";
import { updateVoiceURL } from "@/src/conversations/updateVoiceURL";

import type { BotContext, ConversationContext } from "@/src/types/bot";

type ConversationsData = [
    string,
    (conversation: ConversationContext, ctx: BotContext) => Promise<void>,
];

export const CONVERSATIONS: ConversationsData[] = [
    ["new-remote-voices", newRemoteVoices],
    ["new-voices", newVoices],
    ["voice-file-update", updateVoiceFile],
    ["voice-id-update", updateVoiceID],
    ["voice-title-update", updateVoiceTitle],
    ["voice-url-update", updateVoiceURL],
];
