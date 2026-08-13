import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    AudioLinesIcon,
    HeartIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
    SearchIcon,
    SendIcon,
} from "lucide-react";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    type AudioSelection,
    LazyAudioTrimmer,
} from "@/components/lazy-audio-trimmer";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
    const viewer = useQuery({ queryKey: ["viewer"], queryFn: api.viewer });

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
            {viewer.data?.isAdmin ? <AdminVoiceForm /> : null}
            <Field>
                <FieldLabel htmlFor="voice-search">Поиск</FieldLabel>
                <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
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
                            {query ? <SearchIcon /> : <AudioLinesIcon />}
                        </EmptyMedia>
                        <EmptyTitle>
                            {query ? "Ничего не найдено" : "Реплик пока нет"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {query
                                ? "Попробуйте изменить запрос"
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

function AdminVoiceForm() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [voiceId, setVoiceId] = useState("");
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File>();
    const [audioUrl, setAudioUrl] = useState<string | null>();
    const audioUrlRef = useRef<string>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [selection, setSelection] = useState<AudioSelection>({
        startMs: 0,
        endMs: null,
    });
    const add = useMutation({
        mutationFn: api.addVoice,
        onSuccess: () => {
            toast.success("Реплика добавлена");
            setVoiceId("");
            setTitle("");
            setFile(undefined);
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
            setAudioUrl(undefined);
            setSelection({ startMs: 0, endMs: null });
            setFileInputKey((key) => key + 1);
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: ["voices"] });
        },
        onError: (error) => toast.error(error.message),
    });

    useEffect(
        () => () => {
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        },
        [],
    );

    function handleFile(nextFile?: File) {
        setFile(nextFile);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
        audioUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);
        setSelection({ startMs: 0, endMs: null });
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return toast.error("Выберите MP3-файл");
        const form = new FormData();
        form.set("voiceId", voiceId);
        form.set("title", title);
        form.set("file", file);
        form.set("startMs", String(selection.startMs));
        form.set(
            "endMs",
            selection.endMs === null ? "" : String(selection.endMs),
        );
        add.mutate(form);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Добавить реплику</CardTitle>
                <CardDescription>
                    Прямая публикация в каталог без пользовательской заявки
                </CardDescription>
                <CardAction>
                    <Button
                        size="sm"
                        variant={isOpen ? "ghost" : "outline"}
                        onClick={() => setIsOpen((value) => !value)}
                    >
                        <PlusIcon data-icon="inline-start" />
                        {isOpen ? "Закрыть" : "Добавить"}
                    </Button>
                </CardAction>
            </CardHeader>
            {isOpen ? (
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-id">
                                    ID реплики
                                </FieldLabel>
                                <Input
                                    id="admin-voice-id"
                                    value={voiceId}
                                    minLength={1}
                                    maxLength={64}
                                    pattern="[A-Za-z0-9_-]+"
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        setVoiceId(event.target.value)
                                    }
                                />
                                <FieldDescription>
                                    Латинские буквы, цифры, дефис и
                                    подчёркивание
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-title">
                                    Название
                                </FieldLabel>
                                <Input
                                    id="admin-voice-title"
                                    value={title}
                                    minLength={1}
                                    maxLength={128}
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="admin-voice-file">
                                    MP3-файл
                                </FieldLabel>
                                <Input
                                    key={fileInputKey}
                                    id="admin-voice-file"
                                    type="file"
                                    accept="audio/mpeg,.mp3"
                                    required
                                    disabled={add.isPending}
                                    onChange={(event) =>
                                        handleFile(event.target.files?.[0])
                                    }
                                />
                            </Field>
                            {audioUrl ? (
                                <LazyAudioTrimmer
                                    src={audioUrl}
                                    onChange={setSelection}
                                />
                            ) : null}
                            <Button
                                type="submit"
                                disabled={add.isPending || !file}
                            >
                                {add.isPending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <PlusIcon data-icon="inline-start" />
                                )}
                                Добавить в каталог
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            ) : null}
        </Card>
    );
}
