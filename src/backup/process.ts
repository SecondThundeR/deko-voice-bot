import { spawn } from "node:child_process";

const MAX_STDERR_BYTES = 16 * 1024;
const DEFAULT_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_TERMINATION_GRACE_MS = 5_000;

export type ProcessResult = {
    exitCode: number;
    stderr: string;
    stdout: string;
    timedOut: boolean;
};

type RunProcessOptions = {
    captureStdout?: boolean;
    env?: Partial<NodeJS.ProcessEnv>;
    terminationGraceMs?: number;
    timeoutMs?: number;
};

export async function runProcess(
    executable: string,
    args: string[],
    {
        captureStdout = false,
        env,
        terminationGraceMs = DEFAULT_TERMINATION_GRACE_MS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
    }: RunProcessOptions = {},
): Promise<ProcessResult> {
    const child = spawn(executable, args, {
        env: { ...process.env, ...env },
        stdio: ["ignore", captureStdout ? "pipe" : "ignore", "pipe"],
    });
    const stderrChunks: Buffer[] = [];
    const stdoutChunks: Buffer[] = [];
    let stderrBytes = 0;
    let timedOut = false;
    let forceKillTimeout: NodeJS.Timeout | undefined;

    child.stderr?.on("data", (chunk: Buffer) => {
        if (stderrBytes < MAX_STDERR_BYTES) {
            const remaining = MAX_STDERR_BYTES - stderrBytes;
            stderrChunks.push(chunk.subarray(0, remaining));
        }
        stderrBytes += chunk.length;
    });
    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));

    const timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        forceKillTimeout = setTimeout(
            () => child.kill("SIGKILL"),
            terminationGraceMs,
        );
    }, timeoutMs);

    try {
        const exitCode = await new Promise<number>((resolve, reject) => {
            child.once("error", reject);
            child.once("close", (code) => resolve(code ?? 1));
        });
        const stderr = Buffer.concat(stderrChunks).toString("utf8");
        return {
            exitCode,
            stderr:
                stderrBytes > MAX_STDERR_BYTES
                    ? `${stderr}\n... stderr output truncated`
                    : stderr,
            stdout: Buffer.concat(stdoutChunks).toString("utf8"),
            timedOut,
        };
    } finally {
        clearTimeout(timeout);
        if (forceKillTimeout) clearTimeout(forceKillTimeout);
    }
}
