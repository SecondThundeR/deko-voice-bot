import { unlink } from "node:fs/promises";
import type { Conversation } from "@grammyjs/conversations";
import { InputFile } from "grammy";
import type { Context, ConversationContext } from "../context";
import { downloadTelegramFileToPath } from "./api";
import { convertMP3ToOGGOpus, createVoiceTempFilePaths } from "./general";

type SendConvertedVoiceResult =
    | {
          fileId: string;
          fileUniqueId: string;
          status: true;
      }
    | {
          status: false;
          type: "download";
      }
    | {
          error: string;
          status: false;
          type: "convert";
      };

type SendConvertedVoiceOptions = {
    caption: string;
    conversation: Conversation<Context, ConversationContext>;
    ctx: ConversationContext;
    filePath: string;
};

export async function sendConvertedVoice({
    caption,
    conversation,
    ctx,
    filePath,
}: SendConvertedVoiceOptions): Promise<SendConvertedVoiceResult> {
    const { input, output } = createVoiceTempFilePaths();

    try {
        const downloadStatus = await conversation.external(() =>
            downloadTelegramFileToPath(filePath, input, ctx.api.token),
        );
        if (!downloadStatus) {
            return {
                status: false,
                type: "download",
            };
        }

        const { status, error } = await conversation.external(() =>
            convertMP3ToOGGOpus(input, output),
        );
        if (!status) {
            return {
                status: false,
                type: "convert",
                error,
            };
        }

        const {
            voice: { file_id: fileId, file_unique_id: fileUniqueId },
        } = await ctx.replyWithVoice(new InputFile(output), { caption });

        return {
            status: true,
            fileId,
            fileUniqueId,
        };
    } finally {
        await conversation.external(() =>
            Promise.all([
                unlink(input).catch(() => {}),
                unlink(output).catch(() => {}),
            ]),
        );
    }
}
