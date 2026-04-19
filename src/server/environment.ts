import type { Logger } from "../logger";

export interface Env {
    Variables: {
        requestId: string;
        logger: Logger;
    };
}
