export function formatMoscowDateTime(timestamp: number, locale: string) {
    return new Date(timestamp).toLocaleString(locale, {
        timeZone: "Europe/Moscow",
    });
}
