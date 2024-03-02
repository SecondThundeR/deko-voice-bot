export interface VoiceSchema {
    id: string;
    title: string;
    url?: string;
    fileId?: string;
    voiceUniqueId: string;
    usesAmount: number;
}
