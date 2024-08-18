export const GOOGLE_DRIVE_DOWNLOAD_LINK =
    "https://drive.google.com/uc?export=download&id=";
export const GOOGLE_DRIVE_LINK_CHECK_REGEX =
    /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/.*?\?usp=[sharing|drive_link]/g;
export const GOOGLE_DRIVE_LINK_CONVERT_REGEX = /(?<=\/d\/)(.*?)(?=\/view)/;
export const BASE_LINK_URL = "https://api.telegram.org/file/bot";
export const PRIVACY_MESSAGE_TEXT =
    "В связи с [последними событиями](https://t.me/tginfo/4053), бот теперь предоставляет политику приватности по [ссылке](https://github.com/SecondThundeR/deko-voice-bot/blob/main/PRIVACY_POLICY.md)";
