import { googleExportDownloadLink } from "@/src/constants/general.ts";
import { GOOGLE_EXPORT_LINK_FAIL } from "@/src/constants/locale.ts";

const GOOGLE_LINK_REGEX = /(?<=\/d\/)(.*?)(?=\/view)/;

/**
 * Converts regular Google Drive sharing link to direct download link
 *
 * @param link Google link for voice file
 * @returns Google link for direct download of voice file
 */
export function convertGoogleDriveLink(link: string) {
    if (!link) throw new Error(`Link is empty for some reason: "${link}"`);
    const fileId = link.match(GOOGLE_LINK_REGEX)?.[0];
    if (!fileId) throw new Error(GOOGLE_EXPORT_LINK_FAIL);
    return `${googleExportDownloadLink}${fileId}`;
}

/**
 * Returns full name of user, based on availability of last name
 *
 * If last name is present, combines it with first name, otherwise returns only first name as is
 *
 * @param firstName First name of user
 * @param lastName Last name of user
 * @returns Full name of user
 */
export function getFullName(firstName: string, lastName?: string) {
    if (!lastName) return firstName;
    return `${firstName} ${lastName}`;
}
