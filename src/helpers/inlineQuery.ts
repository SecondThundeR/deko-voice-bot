import { locale } from "@/src/constants/locale.ts";

const { allVoices, filteredVoices } = locale.frontend;

/**
 * Gets current text for inline query button
 *
 * If query string is not present, shows placeholder header, else current query string
 *
 * @param queryString String for filtering voice queries
 * @returns Button text
 */
export function getCurrentButtonText(queryString: string) {
    if (queryString.length === 0) {
        return allVoices;
    }

    return filteredVoices(queryString);
}
