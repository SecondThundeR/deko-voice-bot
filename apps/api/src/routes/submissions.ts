import {
    type SubmissionPorts,
    SubmissionService,
} from "@deko-voice-bot/application";
import { MAX_SUBMISSION_FILE_BYTES } from "@deko-voice-bot/contracts";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { SubmissionRouteDependencies } from "../dependencies.ts";
import { HttpError } from "../errors.ts";
import type { ApiEnv } from "../types.ts";
import { parseTitle } from "../validation.ts";
import { requireConsent } from "./helpers.ts";

function submissionService(deps: SubmissionRouteDependencies) {
    const ports: SubmissionPorts = {
        createSubmission: (input) =>
            deps.database(() => deps.createVoiceSubmission(input)),
        markPending: (id, source) =>
            deps.database(() => deps.markVoiceSubmissionPending(id, source)),
        markFailed: (id) =>
            deps.database(() => deps.markVoiceSubmissionFailed(id)),
        listForUser: (userId) =>
            deps.database(() => deps.getUserVoiceSubmissions(userId)),
        sendToModeration: (input) =>
            deps.sendSubmissionToModeration({
                ...input,
                file: input.file as File,
            }),
    };
    return new SubmissionService(ports);
}

export function createSubmissionRoutes(deps: SubmissionRouteDependencies) {
    const service = submissionService(deps);
    return new Hono<ApiEnv>()
        .get("/submissions", async (c) => {
            await requireConsent(deps, c.var.user.id);
            return c.json(
                (await service.list(c.var.user.id)).map((submission) =>
                    deps.toSubmissionDto(
                        submission as Parameters<
                            typeof deps.toSubmissionDto
                        >[0],
                    ),
                ),
            );
        })
        .post(
            "/submissions",
            bodyLimit({
                maxSize: MAX_SUBMISSION_FILE_BYTES + 64 * 1024,
                onError: (c) =>
                    c.json(
                        {
                            error: {
                                code: "FILE_TOO_LARGE",
                                message: "Файл превышает 20 МБ",
                                requestId: c.var.requestId,
                            },
                        },
                        413,
                    ),
            }),
            async (c) => {
                await requireConsent(deps, c.var.user.id);
                const form = await c.req.formData();
                const title = parseTitle(form.get("title"));
                const file = form.get("file");
                if (!(file instanceof File)) {
                    throw new HttpError(
                        400,
                        "INVALID_FILE",
                        "Выберите MP3-файл",
                    );
                }
                await deps.validateMp3Upload(file);
                const submission = await service.submit({
                    id: deps.randomUUID(),
                    userId: c.var.user.id,
                    title,
                    file,
                });
                return c.json(
                    deps.toSubmissionDto(
                        submission as Parameters<
                            typeof deps.toSubmissionDto
                        >[0],
                    ),
                    201,
                );
            },
        );
}
