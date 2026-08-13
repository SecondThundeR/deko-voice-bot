import { lazy, Suspense } from "react";
import type {
    AudioSelection,
    AudioTrimmerProps,
} from "@/components/audio-trimmer";
import { Skeleton } from "@/components/ui/skeleton";

const AudioTrimmer = lazy(() =>
    import("@/components/audio-trimmer").then((module) => ({
        default: module.AudioTrimmer,
    })),
);

export type { AudioSelection };

export function LazyAudioTrimmer(props: AudioTrimmerProps) {
    return (
        <Suspense fallback={<Skeleton className="h-40" />}>
            <AudioTrimmer {...props} />
        </Suspense>
    );
}
