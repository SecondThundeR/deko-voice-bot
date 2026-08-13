import {
    useMutation,
    useQueryClient,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import {
    AudioLinesIcon,
    HeartIcon,
    PauseIcon,
    PlayIcon,
    SearchIcon,
    SendIcon,
    XIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import { Field } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import {
    queryKeys,
    type VoiceSort,
    viewerQueryOptions,
    voicesQueryOptions,
} from "@/lib/queries";
import { WebApp } from "@/lib/telegram";
import { voicesRoute } from "@/router";

const AdminVoiceForm = lazy(() =>
    import("@/components/admin-voice-form").then((module) => ({
        default: module.AdminVoiceForm,
    })),
);

export function VoicesPage() {
    const { q: query, sort } = voicesRoute.useSearch();
    const navigate = voicesRoute.useNavigate();
    const [search, setSearch] = useState(query);
    const [playing, setPlaying] = useState<string>();
    const [sharing, setSharing] = useState<string>();
    const audio = useRef<{ element: HTMLAudioElement; url: string } | null>(
        null,
    );
    const queryClient = useQueryClient();
    const viewer = useSuspenseQuery(viewerQueryOptions);

    useEffect(() => {
        const normalizedSearch = search.trim();
        if (normalizedSearch === query) return;
        const timeout = setTimeout(() => {
            void navigate({
                replace: true,
                resetScroll: false,
                search: (previous) => ({
                    ...previous,
                    q: normalizedSearch,
                }),
            });
        }, 250);
        return () => clearTimeout(timeout);
    }, [navigate, query, search]);

    useEffect(() => setSearch(query), [query]);

    useEffect(
        () => () => {
            audio.current?.element.pause();
            if (audio.current) URL.revokeObjectURL(audio.current.url);
        },
        [],
    );

    const voices = useSuspenseInfiniteQuery(
        voicesQueryOptions({ query, sort }),
    );
    const favorite = useMutation({
        mutationFn: ({ id, value }: { id: string; value: boolean }) =>
            api.favorite(id, value),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: queryKeys.voices.all,
            }),
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

    async function sendVoice(voiceId: string, title: string) {
        if (!WebApp) {
            toast.error("Не удалось открыть отправку реплики");
            return;
        }

        if (!WebApp.isVersionAtLeast("8.0")) {
            try {
                WebApp.switchInlineQuery(title, [
                    "users",
                    "groups",
                    "channels",
                ]);
            } catch (error) {
                toast.error(
                    error instanceof Error &&
                        error.message === "WebAppInlineModeDisabled"
                        ? "Inline-режим бота отключён. Отправка реплик сейчас недоступна"
                        : "Не удалось открыть отправку реплики",
                );
            }
            return;
        }

        setSharing(voiceId);
        try {
            const prepared = await api.prepareVoiceShare(voiceId);
            WebApp.shareMessage(prepared.id);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Не удалось открыть отправку реплики",
            );
        } finally {
            setSharing(undefined);
        }
    }

    const items = voices.data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-1">
                <Field>
                    <InputGroup>
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            id="voice-search"
                            aria-label="Поиск реплик"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Название реплики"
                        />
                        {search ? (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    size="icon-xs"
                                    aria-label="Очистить поиск"
                                    onClick={() => {
                                        setSearch("");
                                    }}
                                >
                                    <XIcon />
                                </InputGroupButton>
                            </InputGroupAddon>
                        ) : null}
                    </InputGroup>
                </Field>
                {viewer.data?.isAdmin ? (
                    <Suspense fallback={<Skeleton className="h-8 w-24" />}>
                        <AdminVoiceForm />
                    </Suspense>
                ) : null}
            </div>
            <Tabs
                value={sort}
                onValueChange={(value) => {
                    void navigate({
                        resetScroll: false,
                        search: (previous) => ({
                            ...previous,
                            sort: value as VoiceSort,
                        }),
                    });
                }}
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="title">Название</TabsTrigger>
                    <TabsTrigger value="popularity">Популярные</TabsTrigger>
                    <TabsTrigger value="favorites">Избранное</TabsTrigger>
                </TabsList>
            </Tabs>
            {items.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            {query ? (
                                <SearchIcon />
                            ) : sort === "favorites" ? (
                                <HeartIcon />
                            ) : (
                                <AudioLinesIcon />
                            )}
                        </EmptyMedia>
                        <EmptyTitle>
                            {query
                                ? "Ничего не найдено"
                                : sort === "favorites"
                                  ? "В избранном пока ничего нет"
                                  : "Реплик пока нет"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {query
                                ? "Попробуйте изменить запрос"
                                : sort === "favorites"
                                  ? "Добавляйте реплики в избранное с помощью кнопки-сердца"
                                  : "Здесь появятся реплики после добавления в каталог"}
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
                                disabled={sharing !== undefined}
                                onClick={() =>
                                    void sendVoice(
                                        voice.voiceId,
                                        voice.voiceTitle,
                                    )
                                }
                            >
                                {sharing === voice.voiceId ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <SendIcon data-icon="inline-start" />
                                )}
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
