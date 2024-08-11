import { GOOGLE_DRIVE_DOWNLOAD_LINK } from "@/src/constants/general";
import { GOOGLE_EXPORT_LINK_FAIL } from "@/src/constants/locale";

const GOOGLE_DRIVE_LINK_CHECK_REGEX =
    /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/.*?\?usp=[sharing|drive_link]/g;
const GOOGLE_DRIVE_LINK_CONVERT_REGEX = /(?<=\/d\/)(.*?)(?=\/view)/;

type ConvertReturn =
    | { status: true; error: undefined }
    | {
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
    if (!link) throw new Error(`Link is empty for some reason: "${link}"`);

    const fileId = link.match(GOOGLE_DRIVE_LINK_CONVERT_REGEX)?.[0];
    if (!fileId) throw new Error(GOOGLE_EXPORT_LINK_FAIL);

    return `${GOOGLE_DRIVE_DOWNLOAD_LINK}${fileId}`;
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
 * Returns full name of user, based on availability of last name
 *
 * If last name is present, combines it with first name, otherwise returns only first name as is
 *
 * @param firstName First name of user
 * @param lastName Last name of user
 * @returns Full name of user
 */
export function getFullName(firstName: string, lastName?: string) {
    return !lastName ? firstName : `${firstName} ${lastName}`;
}

/**
 * Checks if ffmpeg can be called on the system to ensure that it's exists
 * by running `ffmpeg -h`
 *
 * @returns Status of ffmpeg's help command execution
 */
export async function canRunFFMPEG() {
    try {
        const { exited } = Bun.spawn(["ffmpeg", "-h"], {
            stdout: null,
            stderr: null,
        });

        return (await exited) === 0;
    } catch {
        return false;
    }
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
    try {
        const { exited, stderr } = Bun.spawn([
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            inputFilename,
            "-c:a",
            "libopus",
            outputFilename,
        ]);

        if ((await exited) === 0)
            return {
                status: true,
                error: undefined,
            };

        return {
            status: false,
            error: await new Response(stderr).text(),
        };
    } catch (error: unknown) {
        if (!(error instanceof Error)) {
            return {
                status: false,
                error: "Unknown error occurred",
            };
        }

        return {
            status: false,
            error: error.message,
        };
    }
}

/**
 * Checks if value is empty
 *
 * @param val Value to check for emptiness
 * @returns Boolean result of check
 */
export function isEmpty(val: unknown) {
    return val == null || !(Object.keys(val) || val).length;
}
