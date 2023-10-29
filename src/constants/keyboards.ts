import { InlineKeyboard } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";

const { startButtonText } = locale.frontend;

export const sendInlineRequestKeyboard = new InlineKeyboard().switchInline(
    startButtonText,
);
