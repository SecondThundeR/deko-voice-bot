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
