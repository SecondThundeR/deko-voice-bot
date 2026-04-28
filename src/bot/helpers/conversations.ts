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

export async function sendConvertedVoice({
    caption,
    conversation,
    ctx,
    filePath,
}: {
    caption: string;
    conversation: Conversation<Context, ConversationContext>;
    ctx: ConversationContext;
    filePath: string;
}): Promise<SendConvertedVoiceResult> {
    const { input, output } = createVoiceTempFilePaths();

    try {
        const downloadStatus = await conversation.external(() =>
            downloadTelegramFileToPath({
                filePath,
                outputPath: input,
                token: ctx.api.token,
            }),
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
                error,
                status: false,
                type: "convert",
            };
        }

        const {
            voice: { file_id: fileId, file_unique_id: fileUniqueId },
        } = await ctx.replyWithVoice(new InputFile(output), { caption });

        return {
            fileId,
            fileUniqueId,
            status: true,
        };
    } finally {
        await conversation.external(() =>
            Promise.all([
                unlink(input).catch(() => undefined),
                unlink(output).catch(() => undefined),
            ]),
        );
    }
}
