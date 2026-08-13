import { useEffect } from "react";
import { syncTelegramTheme, WebApp } from "@/lib/telegram";

export function useTelegram() {
    useEffect(syncTelegramTheme, []);
}

export function useTelegramBackButton(show: boolean, onBack: () => void) {
    useEffect(() => {
        const webApp = WebApp;
        if (!webApp || !show) return;
        webApp.BackButton.show();
        webApp.BackButton.onClick(onBack);
        return () => {
            webApp.BackButton.offClick(onBack);
            webApp.BackButton.hide();
        };
    }, [onBack, show]);
}
