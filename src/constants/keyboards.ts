import { InlineKeyboard } from "grammy";

import {
    KEYBOARD_CURRENT_BUTTON,
    KEYBOARD_START_BUTTON,
} from "@/src/constants/locale";

export const sendInlineRequestKeyboard = new InlineKeyboard().switchInline(
    KEYBOARD_START_BUTTON,
);

export const sendCurrentInlineRequestKeyboard =
    new InlineKeyboard().switchInlineCurrent(KEYBOARD_CURRENT_BUTTON);
