import { googleExportDownloadLink } from "@/src/constants/general.ts";
import { GOOGLE_EXPORT_LINK_FAIL } from "@/src/constants/locale.ts";

const GOOGLE_DRIVE_LINK_CHECK_REGEX =
    /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/.*?\?usp=[sharing|drive_link]/g;
const GOOGLE_DRIVE_LINK_CONVERT_REGEX = /(?<=\/d\/)(.*?)(?=\/view)/;
const GENERAL_URL_REGEX =
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

type ConvertReturn = { status: true; error: undefined } | {
    status: false;
    error: string;
};

/**
 * Converts regular Google Drive sharing link to direct download link
 *
 * @deprecated This function was previously (and still is) used to
 * convert Google Drive links into direct download links in order
 * to retrieve voice file from them. With the new feature of
 * adding replicas from PM, this helper function is no longer relevant
 * for general use and has been left as a helper for old voices
 * in the current production database
 *
 * @param link Google link for voice file
 * @returns Google link for direct download of voice file
 */
export function convertGoogleDriveLink(link: string) {
    if (!link) throw new Error("Link is empty for some reason");
    const fileId = link.match(GOOGLE_DRIVE_LINK_CONVERT_REGEX)?.[0];
    if (!fileId) throw new Error(GOOGLE_EXPORT_LINK_FAIL);
    return `${googleExportDownloadLink}${fileId}`;
}

/**
 * Check if passed URL is a Google Drive sharing link
 *
 * Used as sub-helper for {@link convertGoogleDriveLink}
 *
 * @deprecated See reason in {@link convertGoogleDriveLink}
 *
 * @param url URL to check for Google Drive link match
 * @returns Result of regex check
 */
export function isGoogleDriveLink(link: string) {
    return link.match(GOOGLE_DRIVE_LINK_CHECK_REGEX) !== null;
}

/**
 * Check if passed URL is a valid one
 *
 * @param url URL to check validity
 * @returns Result of regex check
 */
export function isValidURL(url: string) {
    return url.match(GENERAL_URL_REGEX) !== null;
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

/**
 * Checks if ffmpeg can be called on the system to ensure that it's exists
 * by running `ffmpeg -h`
 *
 * @returns Status of ffmpeg's help command execution
 */
export async function canRunFFMPEG() {
    const ffmpeg = new Deno.Command("ffmpeg", { args: ["-h"] });
    const { success } = await ffmpeg.output();
    return success;
}

/**
 * Converts MP3 to OGG Opus for using as Telegram voice message
 *
 * @param inputFilename Name of input file to read
 * @param outputFilename Name of output file for ffmpeg to output
 * @returns Object with convert status
 */
export async function convertMP3ToOGGOpus(
    inputFilename: string,
    outputFilename: string,
): Promise<ConvertReturn> {
    const ffmpeg = new Deno.Command("ffmpeg", {
        args: [
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            inputFilename,
            "-c:a",
            "libopus",
            outputFilename,
        ],
    });
    const { success, stderr } = await ffmpeg.output();

    return success
        ? {
            status: true,
            error: undefined,
        }
        : {
            status: false,
            error: new TextDecoder().decode(stderr),
        };
}
