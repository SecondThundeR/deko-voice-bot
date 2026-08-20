import type { Conversation } from "@grammyjs/conversations";
import { InputFile } from "grammy";
import type { Context, ConversationContext } from "#root/bot/context.js";
import {
    downloadAndConvertVoice,
    removeConvertedVoice,
} from "#root/voice-converter.js";

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
    let convertedVoice:
        | Awaited<ReturnType<typeof downloadAndConvertVoice>>
        | undefined;

    try {
        convertedVoice = await conversation.external(() =>
            downloadAndConvertVoice(filePath, ctx.api.token),
        );
        if (!convertedVoice) {
            return {
                status: false,
                type: "download",
            };
        }

        const {
            voice: { file_id: fileId, file_unique_id: fileUniqueId },
        } = await ctx.replyWithVoice(new InputFile(convertedVoice.path), {
            caption,
        });

        return {
            status: true,
            fileId,
            fileUniqueId,
        };
    } catch (error) {
        return {
            status: false,
            type: "convert",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    } finally {
        if (convertedVoice) {
            const file = convertedVoice;
            await conversation.external(() => removeConvertedVoice(file));
        }
    }
}
