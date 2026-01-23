import { donateConversation } from "@/src/conversations/donate";
import { newVoices } from "@/src/conversations/newVoices";
import { updateVoiceFile } from "@/src/conversations/updateVoiceFile";
import { updateVoiceID } from "@/src/conversations/updateVoiceID";
import { updateVoiceTitle } from "@/src/conversations/updateVoiceTitle";

import type { ConversationsData } from "@/src/types/conversations";

export const CONVERSATIONS: ConversationsData[] = [
    ["new-voices", newVoices],
    ["voice-file-update", updateVoiceFile],
    ["voice-id-update", updateVoiceID],
    ["voice-title-update", updateVoiceTitle],
    ["donate", donateConversation],
];
