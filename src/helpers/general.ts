import { googleExportDownloadLink, locale } from "@/src/constants.ts";

const { googleExportLinkFail } = locale.general;

/**
 * Converts regular Google Drive sharing link to direct download link
 *
 * @param link Google link for voice file
 * @returns Google link for direct download of voice file
 */
export function convertGoogleDriveLink(link: string) {
  const fileId = link.match(/(?<=\/d\/)(.*?)(?=\/view)/)?.[0];
  if (!fileId) throw new Error(googleExportLinkFail);
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
