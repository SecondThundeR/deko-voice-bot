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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    const [sharing, setSharing] = useState<string>();
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

function AdminVoiceForm() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isDiscardOpen, setIsDiscardOpen] = useState(false);
    const [voiceId, setVoiceId] = useState("");
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File>();
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [selection, setSelection] = useState<AudioSelection>({
        startMs: 0,
        endMs: null,
    });
    const hasData =
        voiceId.length > 0 || title.length > 0 || file !== undefined;

    function resetForm() {
        setVoiceId("");
        setTitle("");
        setFile(undefined);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        setAudioUrl(null);
        setSelection({ startMs: 0, endMs: null });
        setFileInputKey((key) => key + 1);
    }

    function closeAndReset() {
        setIsDiscardOpen(false);
        resetForm();
        setIsOpen(false);
    }

    function requestClose() {
        if (add.isPending) return;
        if (hasData) setIsDiscardOpen(true);
        else closeAndReset();
    }

    const add = useMutation({
        mutationFn: api.addVoice,
        onSuccess: () => {
            toast.success("Реплика добавлена");
            closeAndReset();
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
        <Dialog
            open={isOpen}
            onOpenChange={(open, details) => {
                if (open) setIsOpen(true);
                else {
                    details.cancel();
                    requestClose();
                }
            }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Добавить реплику</CardTitle>
                    <CardDescription>
                        Прямая публикация в каталог без пользовательской заявки
                    </CardDescription>
                    <CardAction>
                        <DialogTrigger
                            render={<Button size="sm" variant="outline" />}
                        >
                            <PlusIcon data-icon="inline-start" />
                            Добавить
                        </DialogTrigger>
                    </CardAction>
                </CardHeader>
            </Card>
            <DialogContent
                className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
                showCloseButton={!add.isPending}
            >
                <DialogHeader>
                    <DialogTitle>Добавить реплику</DialogTitle>
                    <DialogDescription>
                        Реплика будет опубликована напрямую в каталоге без
                        пользовательской заявки
                    </DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                                Латинские буквы, цифры, дефис и подчёркивание
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
                    </FieldGroup>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={add.isPending}
                            onClick={requestClose}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={add.isPending || !file}>
                            {add.isPending ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <PlusIcon data-icon="inline-start" />
                            )}
                            Добавить в каталог
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Закрыть форму добавления?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Введённые данные и выбранный файл будут удалены.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Продолжить редактирование
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={closeAndReset}
                        >
                            Закрыть и удалить данные
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
