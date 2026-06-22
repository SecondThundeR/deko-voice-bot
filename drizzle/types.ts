import type { SelectUser, SelectVoice } from "./schema.ts";

export type BasicUsersStats = {
    allUsedUsers: number;
    allIgnoredUsers: number;
    allMAUUsers: number;
    allInactiveUsers: number;
};
export type BasicVoicesStats = {
    allUsedVoices: number;
};
export type BasicStats = BasicUsersStats & BasicVoicesStats;

export type FullUsersStats = Omit<SelectUser, "isIgnored" | "userId">;
export type FullVoicesStats = Pick<SelectVoice, "usesAmount" | "voiceTitle">;

export type FullStats = {
    basicStats: BasicStats;
    mostUsedUsersStats: FullUsersStats[];
    lastUsedUsersStats: FullUsersStats[];
    mostUsedVoicesStats: FullVoicesStats[];
};
