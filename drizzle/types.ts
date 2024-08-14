import type { SelectUser, SelectVoice } from "./schema";

export type BasicUsersStats = Pick<SelectUser, "lastUsedAt">;
export type BasicVoicesStats = Pick<SelectVoice, "usesAmount">;

export type FullUsersStats = Omit<SelectUser, "isIgnored" | "userId">;
export type FullVoicesStats = Pick<SelectVoice, "usesAmount" | "voiceTitle">;

export type FavoriteVoicesIds = SelectVoice["voiceId"][];
