import { session } from "@/deps.ts";

import { getSessionKey } from "@/src/helpers/api.ts";

export function sessionSetup() {
    return session({
        getSessionKey,
        initial() {
            return {
                currentOffset: 0,
            };
        },
    });
}
