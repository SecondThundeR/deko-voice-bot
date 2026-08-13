import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, {
    type Region,
} from "wavesurfer.js/dist/plugins/regions.esm.js";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export type AudioSelection = {
    startMs: number;
    endMs: number | null;
};

export type AudioTrimmerProps = {
    onChange: (selection: AudioSelection) => void;
    src: string;
};

function seconds(milliseconds: number) {
    return (milliseconds / 1_000).toFixed(3);
}

export function AudioTrimmer({ onChange, src }: AudioTrimmerProps) {
    const container = useRef<HTMLElement>(null);
    const wavesurfer = useRef<WaveSurfer>(null);
    const region = useRef<Region>(null);
    const onChangeRef = useRef(onChange);
    const [durationMs, setDurationMs] = useState(0);
    const [startMs, setStartMs] = useState(0);
    const [endMs, setEndMs] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasWaveformError, setHasWaveformError] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!container.current) return;
        setDurationMs(0);
        setStartMs(0);
        setEndMs(0);
        setIsReady(false);
        setHasWaveformError(false);
        onChangeRef.current({ startMs: 0, endMs: null });

        const regions = RegionsPlugin.create();
        const styles = getComputedStyle(document.documentElement);
        const instance = WaveSurfer.create({
            container: container.current,
            height: 72,
            normalize: true,
            progressColor: styles.getPropertyValue("--primary").trim(),
            plugins: [regions],
            url: src,
            waveColor: styles.getPropertyValue("--muted-foreground").trim(),
        });
        wavesurfer.current = instance;

        const emitSelection = (
            start: number,
            end: number,
            duration: number,
        ) => {
            const roundedStart = Math.round(start * 1_000);
            const roundedEnd = Math.round(end * 1_000);
            setStartMs(roundedStart);
            setEndMs(roundedEnd);
            instance.pause();
            instance.setTime(start);
            onChangeRef.current({
                startMs: roundedStart,
                endMs:
                    roundedStart === 0 && Math.abs(roundedEnd - duration) <= 25
                        ? null
                        : roundedEnd,
            });
        };

        instance.on("ready", (duration) => {
            const roundedDuration = Math.round(duration * 1_000);
            setDurationMs(roundedDuration);
            setEndMs(roundedDuration);
            region.current = regions.addRegion({
                id: "selection",
                start: 0,
                end: duration,
                minLength: 0.1,
                color: "color-mix(in oklch, var(--primary) 24%, transparent)",
            });
            setIsReady(true);
        });
        regions.on("region-updated", (updated) => {
            if (updated.id === "selection") {
                emitSelection(
                    updated.start,
                    updated.end,
                    instance.getDuration() * 1_000,
                );
            }
        });
        instance.on("play", () => setIsPlaying(true));
        instance.on("pause", () => setIsPlaying(false));
        instance.on("finish", () => setIsPlaying(false));
        instance.on("error", () => setHasWaveformError(true));

        return () => {
            instance.destroy();
            wavesurfer.current = null;
            region.current = null;
        };
    }, [src]);

    function updateSelection(nextStartMs: number, nextEndMs: number) {
        if (
            nextStartMs < 0 ||
            nextEndMs > durationMs ||
            nextEndMs - nextStartMs < 100
        ) {
            return;
        }
        setStartMs(nextStartMs);
        setEndMs(nextEndMs);
        wavesurfer.current?.pause();
        region.current?.setOptions({
            start: nextStartMs / 1_000,
            end: nextEndMs / 1_000,
        });
        wavesurfer.current?.setTime(nextStartMs / 1_000);
        onChangeRef.current({
            startMs: nextStartMs,
            endMs:
                nextStartMs === 0 && nextEndMs === durationMs
                    ? null
                    : nextEndMs,
        });
    }

    function reset() {
        updateSelection(0, durationMs);
    }

    return (
        <FieldGroup>
            <Field>
                <FieldLabel>Обрезка</FieldLabel>
                {!isReady && !hasWaveformError ? (
                    <Skeleton className="h-18" />
                ) : null}
                <figure
                    ref={container}
                    className={isReady ? "m-0 block" : "hidden"}
                    aria-label="Форма аудиоволны"
                />
                {hasWaveformError ? (
                    // biome-ignore lint/a11y/useMediaCaption: пользовательская реплика не имеет готовой расшифровки
                    <audio
                        className="w-full"
                        controls
                        src={src}
                        onLoadedMetadata={(event) => {
                            const duration = Math.round(
                                event.currentTarget.duration * 1_000,
                            );
                            setDurationMs(duration);
                            setEndMs(duration);
                            setIsReady(true);
                        }}
                    />
                ) : null}
                <FieldDescription>
                    Перетащите границы выделения или укажите точное время
                </FieldDescription>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field>
                    <FieldLabel htmlFor="trim-start">Начало, сек.</FieldLabel>
                    <Input
                        id="trim-start"
                        type="number"
                        min="0"
                        max={Math.max(0, (endMs - 100) / 1_000)}
                        step="0.001"
                        value={seconds(startMs)}
                        disabled={!isReady}
                        onChange={(event) =>
                            updateSelection(
                                Math.round(Number(event.target.value) * 1_000),
                                endMs,
                            )
                        }
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="trim-end">Конец, сек.</FieldLabel>
                    <Input
                        id="trim-end"
                        type="number"
                        min={(startMs + 100) / 1_000}
                        max={durationMs / 1_000}
                        step="0.001"
                        value={seconds(endMs)}
                        disabled={!isReady}
                        onChange={(event) =>
                            updateSelection(
                                startMs,
                                Math.round(Number(event.target.value) * 1_000),
                            )
                        }
                    />
                </Field>
            </div>
            <div className="flex flex-wrap gap-2">
                {!hasWaveformError ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!isReady}
                        onClick={() => {
                            const instance = wavesurfer.current;
                            const selection = region.current;
                            if (!instance || !selection) return;
                            if (instance.isPlaying()) instance.pause();
                            else {
                                instance.setTime(selection.start);
                                void instance.play(
                                    selection.start,
                                    selection.end,
                                );
                            }
                        }}
                    >
                        {isPlaying ? (
                            <PauseIcon data-icon="inline-start" />
                        ) : (
                            <PlayIcon data-icon="inline-start" />
                        )}
                        {isPlaying ? "Пауза" : "Слушать фрагмент"}
                    </Button>
                ) : null}
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!isReady}
                    onClick={reset}
                >
                    <RotateCcwIcon data-icon="inline-start" />
                    Весь файл
                </Button>
            </div>
        </FieldGroup>
    );
}
