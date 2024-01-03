import { InlineKeyboard } from "@/deps.ts";

import { KEYBOARD_START_BUTTON } from "@/src/constants/locale.ts";

export const sendInlineRequestKeyboard = new InlineKeyboard()
    .switchInline(KEYBOARD_START_BUTTON);
