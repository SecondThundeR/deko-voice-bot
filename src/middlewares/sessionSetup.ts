import { session } from "grammy";

import { getSessionKey } from "@/src/helpers/api";
import { canRunFFMPEG } from "@/src/helpers/general";

import type { BotContext, SessionType } from "@/src/types/bot";

export const sessionSetup = async () => {
    const ffmpegStatus = await canRunFFMPEG();

    return session<SessionType["session"], BotContext>({
        getSessionKey,
        initial: () => ({
            currentFavoritesOffset: 0,
            currentVoicesOffset: 0,
            canRunFFMPEG: ffmpegStatus,
            isDatabaseMaintenanceActive: false,
        }),
    });
};
