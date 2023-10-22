import { ObjectId } from "@/deps.ts";

export interface VoiceStatsSchema {
    _id: ObjectId;
    id: string;
    title: string;
    usesAmount: number;
}
