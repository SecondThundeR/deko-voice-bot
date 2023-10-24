import { ObjectId } from "@/deps.ts";

export interface FeatureFlagSchema {
    _id: ObjectId;
    id: string;
    status: boolean;
}
