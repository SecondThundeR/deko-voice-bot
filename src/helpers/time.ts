/**
 * Gets timestamp and returns formatted timestamp string for Europe/Moscow timezone
 *
 * @param timestamp `lastUsedAt` field timestamp
 * @returns Formatted timestamp
 */
export function convertLastUsedAtTimestamp(timestamp: number) {
    return new Date(timestamp).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
    });
}
