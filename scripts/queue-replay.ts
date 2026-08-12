import { createWebhookInbox } from "../src/webhook/inbox.ts";

const updateId = Number(process.argv[2]);
if (!Number.isSafeInteger(updateId) || updateId < 0) {
    throw new Error("Usage: pnpm queue:replay <update_id>");
}

const inbox = createWebhookInbox();
try {
    const replayed = await inbox.replay(updateId);
    if (!replayed) {
        throw new Error(
            `Failed update ${updateId} was not found or has no payload`,
        );
    }
    console.log(`Queued update ${updateId} for replay`);
} finally {
    await inbox.close();
}
