import { client } from "@/bot.ts";
import { User } from "@/deps.ts";

import { VoiceStatsSchema } from "@/src/schemas/voiceStats.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";
import { rootCacheKey } from "@/src/constants.ts";
import { rootQueryCache } from "@/src/handlers/inlineQuery.ts";

export async function updateVoiceStats(voiceID: string) {
  const db = client.database("deko");
  const voiceStats = db.collection<VoiceStatsSchema>("voiceStats");
  const { id, title } = rootQueryCache
    .get(rootCacheKey)!
    .find((data) => data.id === voiceID)!;

  await voiceStats.findAndModify(
    { id },
    {
      update: {
        $set: {
          id,
          title,
        },
        $inc: {
          usesAmount: 1,
        },
      },
      upsert: true,
    }
  );
}

export async function updateUsersStats(from: User) {
  const db = client.database("deko");
  const userDetails = extractUserDetails(from);
  const usersStats = db.collection<UsersStatsSchema>("usersStats");

  await usersStats.findAndModify(
    { userID: userDetails.userID },
    {
      update: {
        $set: {
          ...userDetails,
        },
        $inc: {
          usesAmount: 1,
        },
      },
      upsert: true,
    }
  );
}
