import { InlineKeyboard } from "@/deps.ts";

import {
    KEYBOARD_CURRENT_BUTTON,
    KEYBOARD_START_BUTTON,
} from "@/src/constants/locale.ts";

export const sendInlineRequestKeyboard = new InlineKeyboard()
    .switchInline(KEYBOARD_START_BUTTON);

export const sendCurrentInlineRequestKeyboard = new InlineKeyboard()
    .switchInlineCurrent(KEYBOARD_CURRENT_BUTTON);
