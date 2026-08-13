/// <reference types="@types/telegram-web-app" />

export const WebApp = window.Telegram?.WebApp;

const LIGHT_THEME_COLOR = "#ffffff";
const DARK_THEME_COLOR = "#090b0c";

export function initializeTelegram() {
    if (!WebApp) return;
    WebApp.ready();
    if (
        WebApp.isVersionAtLeast("8.0") &&
        ["android", "ios"].includes(WebApp.platform)
    ) {
        WebApp.requestFullscreen();
    } else {
        WebApp.expand();
    }
}

export function syncTelegramTheme() {
    if (!WebApp) return () => {};
    const apply = () => {
        const isDark = WebApp.colorScheme === "dark";
        const color = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;

        document.documentElement.classList.toggle("dark", isDark);
        if (WebApp.isVersionAtLeast("6.1")) {
            WebApp.setHeaderColor(color);
            WebApp.setBackgroundColor(color);
        }
        if (WebApp.isVersionAtLeast("7.10")) {
            WebApp.setBottomBarColor(color);
        }
    };
    apply();
    WebApp.onEvent("themeChanged", apply);
    return () => WebApp.offEvent("themeChanged", apply);
}
