import { useEffect } from "react";
import { syncTelegramTheme, WebApp } from "@/lib/telegram";

export function useTelegram() {
    useEffect(syncTelegramTheme, []);
}

export function useTelegramBackButton(show: boolean, onBack: () => void) {
    useEffect(() => {
        if (!WebApp || !show) return;
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(onBack);
        return () => {
            WebApp.BackButton.offClick(onBack);
            WebApp.BackButton.hide();
        };
    }, [onBack, show]);
}
