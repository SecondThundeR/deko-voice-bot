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

export const donateInlineKeyboard = new InlineKeyboard()
    .text("25 ⭐", "donate_25")
    .text("50 ⭐", "donate_50")
    .row()
    .text("100 ⭐", "donate_100")
    .text("200 ⭐", "donate_200")
    .row()
    .text("Другая сумма", "donate_custom");
