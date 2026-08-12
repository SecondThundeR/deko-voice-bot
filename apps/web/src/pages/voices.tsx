import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    HeartIcon,
    PauseIcon,
    PlayIcon,
    SearchIcon,
    SendIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { WebApp } from "@/lib/telegram";

export function VoicesPage() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<"title" | "popularity" | "favorites">(
        "title",
    );
    const [playing, setPlaying] = useState<string>();
    const audio = useRef<{ element: HTMLAudioElement; url: string } | null>(
        null,
    );
    const queryClient = useQueryClient();

    useEffect(() => {
        const timeout = setTimeout(() => setQuery(search.trim()), 250);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(
        () => () => {
            audio.current?.element.pause();
            if (audio.current) URL.revokeObjectURL(audio.current.url);
        },
        [],
    );

    const voices = useInfiniteQuery({
        queryKey: ["voices", query, sort],
        queryFn: ({ pageParam }) => api.voices(query, sort, pageParam),
        initialPageParam: 0,
        getNextPageParam: (page) => page.nextOffset ?? undefined,
    });
    const favorite = useMutation({
        mutationFn: ({ id, value }: { id: string; value: boolean }) =>
            api.favorite(id, value),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["voices"] }),
        onError: (error) => toast.error(error.message),
    });

    async function toggleAudio(id: string) {
        if (playing === id) {
            audio.current?.element.pause();
            if (audio.current) URL.revokeObjectURL(audio.current.url);
            audio.current = null;
            setPlaying(undefined);
            return;
        }
        audio.current?.element.pause();
        if (audio.current) URL.revokeObjectURL(audio.current.url);
        try {
            const url = await api.audio(id);
            const element = new Audio(url);
            audio.current = { element, url };
            element.onended = () => {
                URL.revokeObjectURL(url);
                audio.current = null;
                setPlaying(undefined);
            };
            await element.play();
            setPlaying(id);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Ошибка аудио",
            );
        }
    }

    const items = voices.data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div className="flex flex-col gap-4">
            <Field>
                <FieldLabel htmlFor="voice-search">Поиск</FieldLabel>
                <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="voice-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="pl-8"
                        placeholder="Название реплики"
                    />
                </div>
            </Field>
            <Tabs
                value={sort}
                onValueChange={(value) =>
                    setSort(value as "title" | "popularity" | "favorites")
                }
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="title">Название</TabsTrigger>
                    <TabsTrigger value="popularity">Популярные</TabsTrigger>
                    <TabsTrigger value="favorites">Избранное</TabsTrigger>
                </TabsList>
            </Tabs>
            {voices.isLoading ? <Skeleton className="h-72" /> : null}
            {voices.error ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>Ошибка</EmptyTitle>
                        <EmptyDescription>
                            {voices.error.message}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : null}
            {items.length === 0 && voices.isSuccess ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <SearchIcon />
                        </EmptyMedia>
                        <EmptyTitle>Ничего не найдено</EmptyTitle>
                        <EmptyDescription>
                            Попробуйте изменить запрос
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : null}
            <div className="flex flex-col gap-3">
                {items.map((voice) => (
                    <Card key={voice.voiceId}>
                        <CardHeader>
                            <CardTitle>{voice.voiceTitle}</CardTitle>
                            <CardAction>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={
                                        voice.isFavorite
                                            ? "Удалить из избранного"
                                            : "Добавить в избранное"
                                    }
                                    onClick={() =>
                                        favorite.mutate({
                                            id: voice.voiceId,
                                            value: !voice.isFavorite,
                                        })
                                    }
                                >
                                    <HeartIcon
                                        fill={
                                            voice.isFavorite
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => void toggleAudio(voice.voiceId)}
                            >
                                {playing === voice.voiceId ? (
                                    <PauseIcon data-icon="inline-start" />
                                ) : (
                                    <PlayIcon data-icon="inline-start" />
                                )}
                                {playing === voice.voiceId
                                    ? "Пауза"
                                    : "Слушать"}
                            </Button>
                            <Button
                                onClick={() =>
                                    WebApp?.switchInlineQuery(
                                        voice.voiceTitle,
                                        ["users", "groups", "channels"],
                                    )
                                }
                            >
                                <SendIcon data-icon="inline-start" />
                                Отправить
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {voices.hasNextPage ? (
                <Button
                    variant="outline"
                    disabled={voices.isFetchingNextPage}
                    onClick={() => void voices.fetchNextPage()}
                >
                    {voices.isFetchingNextPage ? "Загрузка…" : "Показать ещё"}
                </Button>
            ) : null}
        </div>
    );
}
