export function convertLastUsedAtTimestamp(timestamp: number) {
    return new Date(timestamp).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
    });
}
