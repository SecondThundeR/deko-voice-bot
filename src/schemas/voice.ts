import { ObjectId } from "@/deps.ts";

export interface VoiceSchema {
    _id: ObjectId;
    id: string;
    title: string;
    url: string;
}
