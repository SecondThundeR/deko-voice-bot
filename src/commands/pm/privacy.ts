import { Composer } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

const PRIVACY_POLICY_LINK =
    "https://github.com/SecondThundeR/deko-voice-bot/blob/main/PRIVACY_POLICY.md";
const PRIVACY_POLICY_CHANGES_LINK = "https://t.me/tginfo/4053";

export const privacyCommand = new Composer<BotContext>();

privacyCommand.command("privacy", async (ctx) => {
    await ctx.reply(
        `В связи с [последними событиями](${PRIVACY_POLICY_CHANGES_LINK}), бот теперь предоставляет политику приватности по [ссылке](${PRIVACY_POLICY_LINK})`,
        {
            parse_mode: "MarkdownV2",
        },
    );
});
