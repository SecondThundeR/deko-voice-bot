import type {
    AdminSubmission,
    AdminSubmissionBucket,
} from "@deko-voice-bot/contracts";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    AlertTriangleIcon,
    CheckIcon,
    FileAudioIcon,
    PencilIcon,
    ShieldCheckIcon,
    XIcon,
} from "lucide-react";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    type AudioSelection,
    LazyAudioTrimmer,
} from "@/components/lazy-audio-trimmer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
    EmptyContent,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { WebApp } from "@/lib/telegram";

const statusLabels = {
    uploading: "Загрузка",
    pending: "На проверке",
    processing: "Обработка",
    approved: "Одобрено",
    rejected: "Отклонено",
    failed: "Ошибка",
} as const;

function statusVariant(status: AdminSubmission["status"]) {
    if (status === "rejected" || status === "failed") return "destructive";
    if (status === "approved") return "default";
    return "secondary";
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ru", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function SubmitPage() {
    const viewer = useQuery({ queryKey: ["viewer"], queryFn: api.viewer });
    if (viewer.isLoading) return <Skeleton className="h-72" />;
    if (viewer.error) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>Ошибка</EmptyTitle>
                    <EmptyDescription>{viewer.error.message}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }
    if (viewer.data?.isAdmin) return <AdminSubmissions />;
    return <UserSubmissions hasConsent={viewer.data?.hasConsent === true} />;
}

function UserSubmissions({ hasConsent }: { hasConsent: boolean }) {
    const submissions = useQuery({
        queryKey: ["submissions"],
        queryFn: api.submissions,
        enabled: hasConsent,
    });
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File>();

    const consent = useMutation({
        mutationFn: api.consent,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["viewer"] }),
        onError: (error) => toast.error(error.message),
    });
    const submit = useMutation({
        mutationFn: api.submit,
        onSuccess: () => {
            setTitle("");
            setFile(undefined);
            toast.success("Заявка отправлена");
            queryClient.invalidateQueries({ queryKey: ["submissions"] });
        },
        onError: (error) => toast.error(error.message),
    });

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return toast.error("Выберите MP3-файл");
        const send = () => {
            const form = new FormData();
            form.set("title", title);
            form.set("file", file);
            submit.mutate(form);
        };
        if (WebApp?.requestWriteAccess) WebApp.requestWriteAccess(() => send());
        else send();
    }

    if (!hasConsent) {
        return (
            <Empty className="flex-1">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ShieldCheckIcon />
                    </EmptyMedia>
                    <EmptyTitle>Нужно согласие</EmptyTitle>
                    <EmptyDescription>
                        Для заявок и избранного мы сохраняем ваш Telegram ID,
                        профиль и историю действий. Просматривать каталог и
                        статистику можно без этого
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button
                        className="w-full"
                        onClick={() => consent.mutate()}
                        disabled={consent.isPending}
                    >
                        {consent.isPending ? (
                            <Spinner data-icon="inline-start" />
                        ) : null}
                        Подтвердить согласие
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Предложить реплику</CardTitle>
                    <CardDescription>
                        MP3 до 20 МБ. Не больше трёх заявок в сутки и
                        одновременно
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="submission-title">
                                    Название
                                </FieldLabel>
                                <Input
                                    id="submission-title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    minLength={1}
                                    maxLength={128}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="submission-file">
                                    MP3-файл
                                </FieldLabel>
                                <Input
                                    id="submission-file"
                                    type="file"
                                    accept="audio/mpeg,.mp3"
                                    onChange={(event) =>
                                        setFile(event.target.files?.[0])
                                    }
                                    required
                                />
                                <FieldDescription>
                                    Файл будет удалён из очереди после решения
                                    модератора
                                </FieldDescription>
                            </Field>
                            <Button type="submit" disabled={submit.isPending}>
                                {submit.isPending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <FileAudioIcon data-icon="inline-start" />
                                )}
                                Отправить
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Мои заявки</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {submissions.data?.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-3"
                        >
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="truncate font-medium">
                                    {item.title}
                                </span>
                                {item.rejectionReason ? (
                                    <span className="text-muted-foreground">
                                        {item.rejectionReason}
                                    </span>
                                ) : null}
                            </div>
                            <Badge variant={statusVariant(item.status)}>
                                {statusLabels[item.status]}
                            </Badge>
                        </div>
                    ))}
                    {submissions.data?.length === 0 ? (
                        <p className="text-muted-foreground">
                            Вы ещё ничего не предлагали
                        </p>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}

function AdminSubmissions() {
    const [bucket, setBucket] = useState<AdminSubmissionBucket>("queue");
    const [selectedId, setSelectedId] = useState<string>();
    const submissions = useInfiniteQuery({
        queryKey: ["admin-submissions", bucket],
        queryFn: ({ pageParam }) => api.adminSubmissions(bucket, pageParam),
        initialPageParam: 0,
        getNextPageParam: (page) => page.nextOffset ?? undefined,
    });
    const items = submissions.data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div className="flex flex-col gap-4">
            <Alert className="max-w-full border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-50">
                <AlertTriangleIcon />
                <AlertTitle>Внимание</AlertTitle>
                <AlertDescription>
                    Проверяйте пользовательские реплики перед публикацией
                </AlertDescription>
            </Alert>
            <Tabs
                value={bucket}
                onValueChange={(value) => {
                    setBucket(value as AdminSubmissionBucket);
                    setSelectedId(undefined);
                }}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="queue">Очередь</TabsTrigger>
                    <TabsTrigger value="history">История</TabsTrigger>
                </TabsList>
            </Tabs>
            {submissions.isLoading ? <Skeleton className="h-72" /> : null}
            {submissions.error ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>Ошибка</EmptyTitle>
                        <EmptyDescription>
                            {submissions.error.message}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : null}
            {submissions.isSuccess && items.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>
                            {bucket === "queue"
                                ? "Очередь пуста"
                                : "История пуста"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {bucket === "queue"
                                ? "Новых заявок пока нет"
                                : "Завершённые заявки появятся здесь"}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : null}
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <SubmissionCard
                        key={item.id}
                        item={item}
                        isOpen={selectedId === item.id}
                        onToggle={() =>
                            setSelectedId((current) =>
                                current === item.id ? undefined : item.id,
                            )
                        }
                    />
                ))}
            </div>
            {submissions.hasNextPage ? (
                <Button
                    variant="outline"
                    disabled={submissions.isFetchingNextPage}
                    onClick={() => void submissions.fetchNextPage()}
                >
                    {submissions.isFetchingNextPage
                        ? "Загрузка…"
                        : "Показать ещё"}
                </Button>
            ) : null}
        </div>
    );
}

function SubmissionCard({
    isOpen,
    item,
    onToggle,
}: {
    isOpen: boolean;
    item: AdminSubmission;
    onToggle: () => void;
}) {
    const actionable = item.status === "pending" || item.status === "failed";
    const author = item.submitter.username
        ? `@${item.submitter.username}`
        : item.submitter.fullname || String(item.submitter.id);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                    {author} · {formatDate(item.createdAt)}
                </CardDescription>
                <CardAction>
                    <Badge variant={statusVariant(item.status)}>
                        {statusLabels[item.status]}
                    </Badge>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {item.rejectionReason ? (
                    <p className="text-muted-foreground">
                        {item.rejectionReason}
                    </p>
                ) : null}
                {actionable ? (
                    <Button variant="outline" onClick={onToggle}>
                        <PencilIcon data-icon="inline-start" />
                        {isOpen ? "Закрыть редактор" : "Модерировать"}
                    </Button>
                ) : null}
                {isOpen && actionable ? (
                    <ModerationEditor item={item} onDone={onToggle} />
                ) : null}
            </CardContent>
        </Card>
    );
}

function ModerationEditor({
    item,
    onDone,
}: {
    item: AdminSubmission;
    onDone: () => void;
}) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(item.title);
    const [voiceId, setVoiceId] = useState(item.id);
    const [reason, setReason] = useState("");
    const [selection, setSelection] = useState<AudioSelection>({
        startMs: 0,
        endMs: null,
    });
    const audio = useQuery({
        queryKey: ["submission-audio", item.id],
        queryFn: () => api.submissionAudio(item.id),
        gcTime: 0,
        staleTime: Number.POSITIVE_INFINITY,
    });
    const audioUrlRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        audioUrlRef.current = audio.data;
    }, [audio.data]);

    useEffect(
        () => () => {
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        },
        [],
    );

    const finish = async (message: string) => {
        toast.success(message);
        onDone();
        await queryClient.invalidateQueries({
            queryKey: ["admin-submissions"],
        });
    };
    const save = useMutation({
        mutationFn: () => api.updateSubmission(item.id, title),
        onSuccess: () => {
            toast.success("Название сохранено");
            queryClient.invalidateQueries({
                queryKey: ["admin-submissions"],
            });
        },
        onError: (error) => toast.error(error.message),
    });
    const approve = useMutation({
        mutationFn: () =>
            api.approveSubmission(item.id, {
                voiceId,
                title,
                ...selection,
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["voices"] });
            await finish("Заявка одобрена");
        },
        onError: (error) => toast.error(error.message),
    });
    const reject = useMutation({
        mutationFn: () => api.rejectSubmission(item.id, reason),
        onSuccess: () => finish("Заявка отклонена"),
        onError: (error) => toast.error(error.message),
    });
    const pending = save.isPending || approve.isPending || reject.isPending;

    return (
        <div className="flex flex-col gap-4">
            <Separator />
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`submission-title-${item.id}`}>
                        Название
                    </FieldLabel>
                    <Input
                        id={`submission-title-${item.id}`}
                        value={title}
                        minLength={1}
                        maxLength={128}
                        disabled={pending}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={`submission-id-${item.id}`}>
                        ID реплики
                    </FieldLabel>
                    <Input
                        id={`submission-id-${item.id}`}
                        value={voiceId}
                        maxLength={64}
                        pattern="[A-Za-z0-9_-]+"
                        disabled={pending}
                        onChange={(event) => setVoiceId(event.target.value)}
                    />
                </Field>
                <Button
                    type="button"
                    variant="outline"
                    disabled={pending || title.trim() === item.title}
                    onClick={() => save.mutate()}
                >
                    {save.isPending ? (
                        <Spinner data-icon="inline-start" />
                    ) : (
                        <PencilIcon data-icon="inline-start" />
                    )}
                    Сохранить название
                </Button>
            </FieldGroup>
            {audio.isLoading ? <Skeleton className="h-40" /> : null}
            {audio.error ? (
                <p className="text-destructive">{audio.error.message}</p>
            ) : null}
            {audio.data ? (
                <LazyAudioTrimmer src={audio.data} onChange={setSelection} />
            ) : null}
            <Field>
                <FieldLabel htmlFor={`rejection-reason-${item.id}`}>
                    Причина отклонения
                </FieldLabel>
                <Textarea
                    id={`rejection-reason-${item.id}`}
                    value={reason}
                    maxLength={512}
                    placeholder="Необязательно"
                    disabled={pending}
                    onChange={(event) => setReason(event.target.value)}
                />
            </Field>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    disabled={
                        pending ||
                        !audio.data ||
                        !title.trim() ||
                        !voiceId.trim()
                    }
                    onClick={() => approve.mutate()}
                >
                    {approve.isPending ? (
                        <Spinner data-icon="inline-start" />
                    ) : (
                        <CheckIcon data-icon="inline-start" />
                    )}
                    Одобрить
                </Button>
                <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => reject.mutate()}
                >
                    {reject.isPending ? (
                        <Spinner data-icon="inline-start" />
                    ) : (
                        <XIcon data-icon="inline-start" />
                    )}
                    Отклонить
                </Button>
            </div>
        </div>
    );
}
