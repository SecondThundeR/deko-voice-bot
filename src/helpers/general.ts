import { googleExportDownloadLink } from "@/src/constants/general.ts";
import { GOOGLE_EXPORT_LINK_FAIL } from "@/src/constants/locale.ts";

const GOOGLE_LINK_REGEX = /(?<=\/d\/)(.*?)(?=\/view)/;

type ConvertReturn = { status: true; error: undefined } | {
    status: false;
    error: string;
};

/**
 * Converts regular Google Drive sharing link to direct download link
 *
 * @param link Google link for voice file
 * @returns Google link for direct download of voice file
 */
export function convertGoogleDriveLink(link: string) {
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
