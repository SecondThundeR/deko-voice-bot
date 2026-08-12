/// <reference types="@types/telegram-web-app" />

export const WebApp = window.Telegram?.WebApp;

export function initializeTelegram() {
    if (!WebApp) return;
    WebApp.ready();
    WebApp.expand();
}

export function syncTelegramTheme() {
    if (!WebApp) return () => {};
    const apply = () => {
        document.documentElement.classList.toggle(
            "dark",
            WebApp.colorScheme === "dark",
        );
        const color = WebApp.colorScheme === "dark" ? "#1f2427" : "#ffffff";
        WebApp.setHeaderColor(color);
        WebApp.setBackgroundColor(color);
    };
    apply();
    WebApp.onEvent("themeChanged", apply);
    return () => WebApp.offEvent("themeChanged", apply);
}
