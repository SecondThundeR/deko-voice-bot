import type { UserProfile } from "@deko-voice-bot/contracts";

type ActiveUserProfile = Extract<UserProfile, { status: "active" }>;
type StoredUserProfile = Omit<ActiveUserProfile, "status">;

export function toUserProfile(user: StoredUserProfile | null): UserProfile {
    return user ? { status: "active", ...user } : { status: "excluded" };
}
