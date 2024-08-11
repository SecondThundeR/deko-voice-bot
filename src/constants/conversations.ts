import { newRemoteVoices } from "@/src/conversations/newRemoteVoices";
import { newVoices } from "@/src/conversations/newVoices";
import { updateVoiceFile } from "@/src/conversations/updateVoiceFile";
import { updateVoiceID } from "@/src/conversations/updateVoiceID";
import { updateVoiceTitle } from "@/src/conversations/updateVoiceTitle";
import { updateVoiceURL } from "@/src/conversations/updateVoiceURL";

import type { ConversationsData } from "@/src/types/conversations";

export const CONVERSATIONS: ConversationsData[] = [
    ["new-remote-voices", newRemoteVoices],
    ["new-voices", newVoices],
    ["voice-file-update", updateVoiceFile],
    ["voice-id-update", updateVoiceID],
    ["voice-title-update", updateVoiceTitle],
    ["voice-url-update", updateVoiceURL],
];

export const VOICE_ID_LENGTH = 64;
