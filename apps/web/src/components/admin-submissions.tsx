import type {
    AdminSubmission,
    AdminSubmissionBucket,
} from "@deko-voice-bot/contracts";
import {
    SUBMISSION_REJECTION_REASON_MAX_LENGTH,
    VOICE_ID_MAX_LENGTH,
    VOICE_TITLE_MAX_LENGTH,
} from "@deko-voice-bot/contracts";
import {
    useMutation,
    useQuery,
    useQueryClient,
    useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { AlertTriangleIcon, CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
    adminSubmissionsQueryOptions,
    queryKeys,
    submissionAudioQueryOptions,
} from "@/lib/queries";
import {
    submissionStatusLabels,
    submissionStatusVariant,
} from "@/lib/submissions";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ru", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function AdminSubmissions() {
    const [bucket, setBucket] = useState<AdminSubmissionBucket>("queue");
    const [selectedId, setSelectedId] = useState<string>();
    const submissions = useSuspenseInfiniteQuery(
        adminSubmissionsQueryOptions(bucket),
    );
    const items = submissions.data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div className="flex flex-col gap-4">
            <Alert>
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
            {items.length === 0 ? (
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
                    <Badge variant={submissionStatusVariant(item.status)}>
                        {submissionStatusLabels[item.status]}
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
    const audio = useQuery(submissionAudioQueryOptions(item.id));
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
            queryKey: queryKeys.adminSubmissions.all,
        });
    };
    const save = useMutation({
        mutationFn: () => api.updateSubmission(item.id, title),
        onSuccess: () => {
            toast.success("Название сохранено");
            queryClient.invalidateQueries({
                queryKey: queryKeys.adminSubmissions.all,
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
            await queryClient.invalidateQueries({
                queryKey: queryKeys.voices.all,
            });
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
                        maxLength={VOICE_TITLE_MAX_LENGTH}
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
                        maxLength={VOICE_ID_MAX_LENGTH}
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
                    maxLength={SUBMISSION_REJECTION_REASON_MAX_LENGTH}
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
