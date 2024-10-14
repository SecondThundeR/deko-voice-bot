import { session } from "grammy";

import { getSessionKey } from "@/src/helpers/api";
import { canRunFFMPEG } from "@/src/helpers/general";

import type { SessionType } from "@/src/types/bot";

export const sessionSetup = async () => {
    const ffmpegStatus = await canRunFFMPEG();

    return session({
        getSessionKey,
        initial: (): SessionType["session"] => ({
            currentFavoritesOffset: 0,
            currentVoicesOffset: 0,
            canRunFFMPEG: ffmpegStatus,
        }),
    });
};
